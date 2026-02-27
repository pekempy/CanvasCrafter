import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the data path based on the environment (docker /data or local /data)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function migrateAsset(id: string, url: string, metadata: any = {}) {
    await ensureImagesDir();
    const filePath = path.join(IMAGES_DIR, `${id}.png`);
    const jsonPath = path.join(IMAGES_DIR, `${id}.json`);

    try {
        // Only write if the image file doesn't exist
        try {
            await fs.access(filePath);
            console.log(`Asset ${id} already exists on disk, skipping copy.`);
        } catch {
            const base64Data = url.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            await fs.writeFile(filePath, buffer);
            console.log(`Exported asset ${id} to disk.`);
        }

        // Always ensure sidecar info is synced/exists
        try {
            await fs.access(jsonPath);
        } catch {
            await fs.writeFile(jsonPath, JSON.stringify({
                id,
                ...metadata,
                migrated: true,
                timestamp: Date.now()
            }, null, 2));
        }

        return `/api/images?id=${id}`;
    } catch (e) {
        console.error(`Migration error for ${id}:`, e);
        return url;
    }
}

async function deepMigrate(obj: any, context: any = {}): Promise<{ data: any; changed: boolean }> {
    let changed = false;

    if (!obj || typeof obj !== 'object') return { data: obj, changed };

    if (Array.isArray(obj)) {
        const results = await Promise.all(obj.map(item => deepMigrate(item, context)));
        return {
            data: results.map(r => r.data),
            changed: results.some(r => r.changed)
        };
    }

    const newObj = { ...obj };
    for (const key in newObj) {
        const val = newObj[key];

        // Match base64 images
        if (typeof val === 'string' && val.startsWith('data:image/')) {
            const id = newObj.id || `legacy_${Math.random().toString(36).substr(2, 9)}`;
            const metadata = {
                sourceKey: key,
                originalName: newObj.name || newObj.label || 'Migrated Asset',
                ...context
            };
            newObj[key] = await migrateAsset(id.toString(), val, metadata);
            changed = true;
        } else if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
            // Attempt to parse string as JSON (for design data)
            try {
                const innerJson = JSON.parse(val);
                const res = await deepMigrate(innerJson, context);
                if (res.changed) {
                    newObj[key] = JSON.stringify(res.data);
                    changed = true;
                }
            } catch (e) {
                // Not JSON or parse error, skip
            }
        } else if (typeof val === 'object' && val !== null) {
            const res = await deepMigrate(val, context);
            if (res.changed) {
                newObj[key] = res.data;
                changed = true;
            }
        }
    }

    return { data: newObj, changed };
}

const IMAGES_DIR = process.env.IMAGES_DIR || path.join(process.cwd(), 'images');

async function ensureImagesDir() {
    try {
        await fs.access(IMAGES_DIR);
    } catch {
        await fs.mkdir(IMAGES_DIR, { recursive: true });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    try {
        await ensureDataDir();
        const filePath = path.join(DATA_DIR, `${key}.json`);
        const fileStat = await fs.stat(filePath);
        if (fileStat.isFile()) {
            const data = await fs.readFile(filePath, 'utf-8');
            let jsonData = JSON.parse(data);

            // Universal auto-migration across all state keys
            const { data: migratedData, changed } = await deepMigrate(jsonData, { fromFile: key });

            if (changed) {
                await fs.writeFile(filePath, JSON.stringify(migratedData, null, 2));
                jsonData = migratedData;
            }

            return NextResponse.json(jsonData);
        }
        return NextResponse.json(null);
    } catch (e) {
        return NextResponse.json(null); // Return null if not found
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    try {
        await ensureDataDir();
        const body = await request.json();
        const filePath = path.join(DATA_DIR, `${key}.json`);

        // If we are saving folders, we should also update sidecar JSONs for safety/sync
        if (key === 'folders' && Array.isArray(body)) {
            await ensureImagesDir();
            for (const folder of body) {
                if (!folder.assets) continue;
                for (const asset of folder.assets) {
                    if (asset.url && asset.url.includes('/api/images?id=')) {
                        const id = new URL(asset.url, 'http://localhost').searchParams.get('id');
                        if (id) {
                            const jsonPath = path.join(IMAGES_DIR, `${id}.json`);
                            // Update or create sidecar
                            try {
                                await fs.writeFile(jsonPath, JSON.stringify({
                                    id,
                                    tags: asset.tags || [],
                                    folderId: folder.id,
                                    brandId: asset.brandId || null,
                                    isFavorite: asset.isFavorite || false,
                                    timestamp: asset.timestamp || Date.now()
                                }, null, 2));
                            } catch (err) {
                                console.error(`Failed to sync sidecar for ${id}`, err);
                            }
                        }
                    }
                }
            }
        }

        // Write file atomically (or simply write for now)
        await fs.writeFile(filePath, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Storage POST Error:", e.message);
        return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
    }
}
