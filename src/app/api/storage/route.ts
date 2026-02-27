import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/security';

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

// Keep track of the last discovery scan per user to avoid heavy disk I/O on every poll
const lastScanRegistry: Record<string, number> = {};
const SCAN_THROTTLE = 10000; // 10 seconds

async function discoverOrphans(user: string, allFolders: any[]) {
    const now = Date.now();
    if (lastScanRegistry[user] && (now - lastScanRegistry[user] < SCAN_THROTTLE)) {
        return []; // Skip scan, throttled
    }
    lastScanRegistry[user] = now;

    await ensureImagesDir();
    const files = await fs.readdir(IMAGES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    // Build a map of existing assets by ID for fast lookup
    const existingAssetIds = new Set();
    const foldersById = new Map();
    allFolders.forEach(f => {
        foldersById.set(f.id, f);
        f.assets?.forEach((a: any) => existingAssetIds.add(String(a.id)));
    });

    // OPTIMIZATION: Filter files by ID before reading content
    const potentialOrphans = jsonFiles.filter(file => {
        const id = file.replace('.json', '');
        return !existingAssetIds.has(id);
    });

    if (potentialOrphans.length === 0) return [];

    const discovered: any[] = [];
    // Only read files that are actually "new" to the database
    for (const file of potentialOrphans) {
        try {
            const data = await fs.readFile(path.join(IMAGES_DIR, file), 'utf-8');
            const meta = JSON.parse(data);

            // Re-verify ID in case it differs from filename
            if (existingAssetIds.has(String(meta.id))) continue;

            // Never ingest thumbnails (e.g. from template/design generation) as reusable assets
            if (meta.sourceKey === 'thumbnail') continue;

            const parentFolder = meta.folderId ? foldersById.get(meta.folderId) : null;
            const isParentVisible = parentFolder && (parentFolder.owner === user || parentFolder.visibility === 'global');

            // Discover if:
            // 1. Asset metadata says owner is this user
            // 2. Asset metadata says it is explicitly global
            // 3. Asset belongs to a folder that IS visible to this user
            if (!meta.owner || meta.owner === user || meta.visibility === 'global' || isParentVisible) {
                discovered.push({
                    id: meta.id,
                    url: `/api/images?id=${meta.id}`,
                    tags: meta.tags || [],
                    isFavorite: meta.isFavorite || false,
                    brandId: meta.brandId || null,
                    owner: meta.owner || user,
                    visibility: (isParentVisible && parentFolder.visibility === 'global') ? 'global' : (meta.visibility || 'private'),
                    folderId: meta.folderId || 'default'
                });
            }
        } catch (e) {
            console.error("Failed to read image meta:", file);
        }
    }
    return discovered;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const user = await getSession(request);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    try {
        await ensureDataDir();
        const filePath = path.join(DATA_DIR, `${key}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf-8');
            let jsonData = JSON.parse(data);

            // Universal auto-migration across all state keys
            const { data: migratedData, changed } = await deepMigrate(jsonData, { fromFile: key, owner: user });

            if (changed) {
                await fs.writeFile(filePath, JSON.stringify(migratedData, null, 2));
                jsonData = migratedData;
            }

            // --- AUTO-GLOBAL BACKWARD COMPATIBILITY SYNC ---
            // If the user is polling folders, do an on-the-fly upgrade of any existing legacy assets
            // that are attached to a global brand but aren't marked as global yet.
            if (key === 'folders' && Array.isArray(jsonData)) {
                let synced = false;
                try {
                    const brandsPath = path.join(DATA_DIR, 'brandkits.json');
                    const brandsData = await fs.readFile(brandsPath, 'utf-8');
                    const brands = JSON.parse(brandsData);
                    const globalBrands = brands.filter((b: any) => b.visibility === 'global');
                    const globalBrandIds = new Set(globalBrands.map((b: any) => b.id));
                    const globalFolderIds = new Set();
                    globalBrands.forEach((b: any) => {
                        if (Array.isArray(b.assetFolderIds)) {
                            b.assetFolderIds.forEach((id: string) => globalFolderIds.add(id));
                        }
                    });

                    for (const folder of jsonData) {
                        const isGlobalFolder = globalFolderIds.has(folder.id);
                        if (isGlobalFolder && folder.visibility !== 'global') {
                            folder.visibility = 'global';
                            synced = true;
                        }

                        if (folder.assets && Array.isArray(folder.assets)) {
                            for (const asset of folder.assets) {
                                if ((isGlobalFolder || (asset.brandId && globalBrandIds.has(asset.brandId))) && asset.visibility !== 'global') {
                                    asset.visibility = 'global';
                                    synced = true;

                                    // Hard-sync sidecar
                                    try {
                                        const sidecarPath = path.join(IMAGES_DIR, `${asset.id}.json`);
                                        const sidecarData = await fs.readFile(sidecarPath, 'utf-8');
                                        const sidecar = JSON.parse(sidecarData);
                                        if (sidecar.visibility !== 'global') {
                                            sidecar.visibility = 'global';
                                            await fs.writeFile(sidecarPath, JSON.stringify(sidecar, null, 2));
                                        }
                                    } catch (e) {
                                        // Skip if doesn't exist
                                    }
                                }
                            }
                        }
                    }

                    if (synced) {
                        await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
                    }
                } catch (e) {
                    console.error("Auto-global GET sync failed:", e);
                }
            }

            // Filter data based on user ownership or global visibility
            if (Array.isArray(jsonData)) {
                let filtered = jsonData.filter((item: any) => {
                    // Item is visible if:
                    // 1. It belongs to the current user
                    // 2. It is marked as global
                    // 3. It has no owner (legacy data)
                    return !item.owner || item.owner === user || item.visibility === 'global';
                });

                // --- Permission Inheritance ---
                // If a folder or design is linked to a visible brand kit, it should also be visible.
                if (key === 'folders' || key === 'designs') {
                    // NEW: Deep Discovery for folders to find orphaned images
                    if (key === 'folders') {
                        const orphans = await discoverOrphans(user, jsonData);
                        if (orphans.length > 0) {
                            orphans.forEach(o => {
                                let targetFolder = jsonData.find(f => f.id === o.folderId);

                                // If target folder doesn't exist or isn't accessible, fallback to default
                                if (!targetFolder || (targetFolder.owner !== user && targetFolder.visibility !== 'global')) {
                                    targetFolder = jsonData.find(f => f.id === 'default' && f.owner === user);
                                    if (!targetFolder) {
                                        targetFolder = { id: 'default', name: 'All Uploads', assets: [], owner: user, visibility: 'private' };
                                        jsonData.push(targetFolder);
                                    }
                                }

                                // Add orphan if not already present
                                if (!targetFolder.assets.some((a: any) => String(a.id) === String(o.id))) {
                                    targetFolder.assets.push(o);
                                }
                            });

                            // Save discovery back to disk
                            await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
                        }
                    }

                    try {
                        const brandsPath = path.join(DATA_DIR, 'brandkits.json');
                        const brandsData = await fs.readFile(brandsPath, 'utf-8');
                        const brands = JSON.parse(brandsData);

                        // Brands the user can see
                        const visibleBrandIds = new Set(brands.filter((b: any) =>
                            !b.owner || b.owner === user || b.visibility === 'global'
                        ).map((b: any) => b.id));

                        // Find items that should be inherited (designs ONLY, since folders use Implicit Projection below)
                        if (key === 'designs') {
                            const inheritedItems = jsonData.filter((item: any) => {
                                if (!item.owner || item.owner === user || item.visibility === 'global') return false;
                                return item.brandId && visibleBrandIds.has(item.brandId);
                            }).map((item: any) => ({ ...item, visibility: 'global' as const }));
                            filtered = [...filtered, ...inheritedItems];
                        }

                        // INSTANT IMPLICIT ASSET INHERITANCE
                        // Project 'sterilized' folders for private folders linked to a visible brand, OR explicitly tagged assets
                        if (key === 'folders') {
                            jsonData.forEach((folder: any) => {
                                // Skip if the exact folder is already in the filtered list
                                if (filtered.some((f: any) => f.id === folder.id && f.owner === folder.owner)) return;

                                // Is the entire folder linked to a visible brand?
                                const isLinkedFolder = brands.some((b: any) => visibleBrandIds.has(b.id) && b.assetFolderIds?.includes(folder.id));

                                // Look for explicitly tagged individual assets OR orphaned assets sitting in 'default' that belong to linked folders
                                const explicitAssets = (folder.assets || []).filter((asset: any) => {
                                    const explicitBrand = asset.brandId && visibleBrandIds.has(asset.brandId);
                                    const explicitFolder = asset.folderId && brands.some((b: any) => visibleBrandIds.has(b.id) && b.assetFolderIds?.includes(asset.folderId));
                                    return explicitBrand || explicitFolder;
                                });

                                if (isLinkedFolder || explicitAssets.length > 0) {
                                    filtered.push({
                                        ...folder,
                                        id: `${folder.id}_shared_${folder.owner}`, // Prevent local client collision
                                        originalId: folder.id, // Keep the real ID for frontend brand linking
                                        owner: 'system', // Designate as projected (read-only for receiver)
                                        assets: isLinkedFolder
                                            ? folder.assets.map((a: any) => ({ ...a, visibility: 'global' }))
                                            : explicitAssets.map((a: any) => {
                                                let fallbackBrandId = a.brandId;
                                                if (!fallbackBrandId && a.folderId) {
                                                    const match = brands.find((b: any) => visibleBrandIds.has(b.id) && b.assetFolderIds?.includes(a.folderId));
                                                    if (match) fallbackBrandId = match.id;
                                                }
                                                return { ...a, visibility: 'global', brandId: fallbackBrandId || a.brandId };
                                            }),
                                        visibility: 'global', // Project the folder wrapper as global
                                        isProjected: true, // Flag to prevent saving back as a duplicate
                                        name: isLinkedFolder ? `${folder.name} (Shared)` : folder.name
                                    });
                                }
                            });
                        }
                    } catch (e) {
                        // If brandkits.json fails to load, just stick with basic filtering
                    }
                }

                // Map results to ensure ownership injection
                filtered = filtered.map((item: any) => {
                    // Inject ownership if missing (for legacy data)
                    if (!item.owner) item.owner = user;

                    // Permission Inheritance for Assets:
                    // If the folder is global, all assets inside MUST be treated as global.
                    if (key === 'folders' && item.visibility === 'global' && item.assets) {
                        item.assets = item.assets.map((a: any) => ({ ...a, visibility: 'global' }));
                    }

                    return item;
                });

                // Ensure 'default' folder exists in the list for this user
                if (key === 'folders') {
                    const hasDefault = filtered.some((f: any) => f.id === 'default' && f.owner === user);
                    if (!hasDefault) {
                        filtered.push({
                            id: 'default',
                            name: 'All Uploads',
                            assets: [],
                            owner: user,
                            visibility: 'private'
                        });
                    }
                }

                return NextResponse.json(filtered);
            }

            return NextResponse.json(jsonData);
        } catch (e) {
            return NextResponse.json([]); // Return empty array if file missing but expected
        }
    } catch (e) {
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const user = await getSession(request);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    try {
        await ensureDataDir();
        const body = await request.json();
        const filePath = path.join(DATA_DIR, `${key}.json`);

        let finalData = body;

        if (Array.isArray(body)) {
            let existingData: any[] = [];
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                existingData = JSON.parse(data);
            } catch { }

            // 1. Identify items in the incoming body that the user is ALLOWED to modify
            const userAllowedUpdates = body.filter((item: any) =>
                !item.isProjected && // Do not accept purely projected folders back
                (!item.owner ||
                    item.owner === user ||
                    item.visibility === 'global')
            ).map((item: any) => {
                const newItem = { ...item };
                if (!newItem.owner) newItem.owner = user;
                return newItem;
            });

            // 2. Preserve items from the existing file that the user is NOT allowed to see or touch
            // (i.e. other users' private items)
            const protectedOthersData = existingData.filter((item: any) =>
                item.owner &&
                item.owner !== user &&
                item.visibility !== 'global'
            );

            // 3. Intelligent Merge: 
            // We want all the protected items, PLUS the ones the user just sent/updated.
            // But we must prevent ID collisions between protected items and updates.
            // Using a compound key (ID + Owner) ensures users can all have their own 'default' private folder without deleting each others.
            const protectedKeys = new Set(protectedOthersData.map(i => `${i.id}_${i.owner || 'global'}`));
            const filteredUpdates = userAllowedUpdates.filter(i => !protectedKeys.has(`${i.id}_${i.owner || 'global'}`));

            finalData = [...protectedOthersData, ...filteredUpdates];
        }

        // AUTO-GLOBAL BRAND SYNC: Recursively propagate 'global' or 'private' visibility for configured assets
        if ((key === 'folders' || key === 'brandkits') && Array.isArray(finalData)) {
            try {
                const brandsPath = path.join(DATA_DIR, 'brandkits.json');
                const foldersPath = path.join(DATA_DIR, 'folders.json');

                let brands = key === 'brandkits' ? finalData : [];
                let folders = key === 'folders' ? finalData : [];

                if (key === 'folders') {
                    try {
                        const brandsData = await fs.readFile(brandsPath, 'utf-8');
                        brands = JSON.parse(brandsData);
                    } catch (e) { }
                } else if (key === 'brandkits') {
                    try {
                        const foldersData = await fs.readFile(foldersPath, 'utf-8');
                        folders = JSON.parse(foldersData);
                    } catch (e) { }
                }

                const globalBrands = brands.filter((b: any) => b.visibility === 'global');
                const globalBrandIds = new Set(globalBrands.map((b: any) => b.id));
                const globalFolderIds = new Set();
                globalBrands.forEach((b: any) => {
                    if (Array.isArray(b.assetFolderIds)) {
                        b.assetFolderIds.forEach((id: string) => globalFolderIds.add(id));
                    }
                });

                let foldersChanged = false;

                for (const folder of folders) {
                    const isGlobalFolder = globalFolderIds.has(folder.id) || globalFolderIds.has(folder.originalId);
                    const targetFolderVisibility = isGlobalFolder ? 'global' : 'private';

                    if (folder.id !== 'default' && folder.visibility !== targetFolderVisibility) {
                        folder.visibility = targetFolderVisibility;
                        foldersChanged = true;
                    }

                    if (folder.assets && Array.isArray(folder.assets)) {
                        for (const asset of folder.assets) {
                            const isGlobalAsset = isGlobalFolder || (asset.brandId && globalBrandIds.has(asset.brandId));
                            const targetAssetVisibility = isGlobalAsset ? 'global' : 'private';

                            if (asset.visibility !== targetAssetVisibility) {
                                asset.visibility = targetAssetVisibility;
                                foldersChanged = true;

                                // Hard-sync to sidecar metadata on disk
                                try {
                                    const sidecarPath = path.join(IMAGES_DIR, `${asset.id}.json`);
                                    const sidecarData = await fs.readFile(sidecarPath, 'utf-8');
                                    const sidecar = JSON.parse(sidecarData);
                                    if (sidecar.visibility !== targetAssetVisibility) {
                                        sidecar.visibility = targetAssetVisibility;
                                        await fs.writeFile(sidecarPath, JSON.stringify(sidecar, null, 2));
                                    }
                                } catch (e) {
                                    // Sidecar may not exist (e.g. legacy data), continue gracefully
                                }
                            }
                        }
                    }
                }

                // If we triggered this via brandkits change, forcefully write the cascaded updates back to folders.json
                if (key === 'brandkits' && foldersChanged) {
                    await fs.writeFile(foldersPath, JSON.stringify(folders, null, 2));
                }
            } catch (e) {
                console.error("Auto-global recursive sync failed:", e);
            }
        }

        await fs.writeFile(filePath, JSON.stringify(finalData, null, 2));
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Storage POST Error:", e.message);
        return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
    }
}
