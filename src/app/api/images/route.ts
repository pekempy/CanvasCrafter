import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/security';
import sharp from 'sharp';

async function compressImageBuffer(inputBuffer: Buffer): Promise<Buffer> {
    try {
        // Compress using sharp PNG options with high compression effort & quality optimization
        return await sharp(inputBuffer)
            .png({ quality: 80, compressionLevel: 9, effort: 7 })
            .toBuffer();
    } catch (err) {
        console.warn('Image compression fallback to original buffer:', err);
        return inputBuffer;
    }
}
// Define the images path
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
    const id = searchParams.get('id');
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const token = (await cookieStore).get('auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    try {
        // Try .gif first, then .png
        const gifPath = path.join(IMAGES_DIR, `${id}.gif`);
        const pngPath = path.join(IMAGES_DIR, `${id}.png`);
        let filePath: string;
        let contentType: string;

        try {
            await fs.access(gifPath);
            filePath = gifPath;
            contentType = 'image/gif';
        } catch {
            filePath = pngPath;
            contentType = 'image/png';
        }

        const data = await fs.readFile(filePath);

        return new NextResponse(data, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (e) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}

export async function POST(request: Request) {
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const token = (await cookieStore).get('auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await ensureImagesDir();
        const body = await request.json();
        const { id, url, metadata } = body;

        if (!id || !url) {
            return NextResponse.json({ error: 'Missing id or url' }, { status: 400 });
        }

        // Handle Base64 URL
        if (url.startsWith('data:image/')) {
            const user = await getSession(request);
            const base64Data = url.split(',')[1];
            const rawBuffer = Buffer.from(base64Data, 'base64');
            
            // Detect GIF and skip compression
            const isGif = url.startsWith('data:image/gif');
            let buffer = rawBuffer;
            let mimeType = 'image/png';
            let extension = 'png';

            if (isGif) {
                buffer = rawBuffer;
                mimeType = 'image/gif';
                extension = 'gif';
            } else {
                // @ts-expect-error - Buffer type compatibility
                buffer = await compressImageBuffer(rawBuffer as unknown as Buffer);
                mimeType = 'image/png';
                extension = 'png';
            }

            const filePath = path.join(IMAGES_DIR, `${id}.${extension}`);
            await fs.writeFile(filePath, buffer);
            
            // Save sidecar JSON
            const jsonPath = path.join(IMAGES_DIR, `${id}.json`);
            await fs.writeFile(jsonPath, JSON.stringify({
                id,
                ...metadata,
                mimeType,
                owner: user || undefined,
                timestamp: Date.now()
            }, null, 2));

            return NextResponse.json({
                success: true,
                url: `/api/images?id=${id}`,
                mimeType
            });
        }

        // Fetch a remote image server-side (e.g. an opponent crest from a league site)
        if (/^https?:\/\//.test(url)) {
            const user = await getSession(request);
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 CanvasCrafter' } });
            if (!res.ok) return NextResponse.json({ error: `Fetch failed (${res.status})` }, { status: 502 });
            const rawBuffer = Buffer.from(await res.arrayBuffer() as ArrayBuffer);
            
            // Detect GIF by Content-Type or URL
            const contentType = res.headers.get('content-type') || '';
            const isGif = contentType.includes('image/gif') || url.toLowerCase().endsWith('.gif');
            
            let buffer = rawBuffer;
            let mimeType = 'image/png';
            let extension = 'png';

            if (isGif) {
                buffer = rawBuffer;
                mimeType = 'image/gif';
                extension = 'gif';
            } else {
                // @ts-expect-error - Buffer type compatibility
                buffer = await compressImageBuffer(rawBuffer as unknown as Buffer);
                mimeType = 'image/png';
                extension = 'png';
            }

            const filePath = path.join(IMAGES_DIR, `${id}.${extension}`);
            await fs.writeFile(filePath, buffer);
            
            // Save sidecar JSON
            const jsonPath = path.join(IMAGES_DIR, `${id}.json`);
            await fs.writeFile(jsonPath, JSON.stringify({
                id,
                ...metadata,
                mimeType,
                owner: user || undefined,
                timestamp: Date.now()
            }, null, 2));

            return NextResponse.json({ 
                success: true, 
                url: `/api/images?id=${id}`,
                mimeType
            });
        }

        return NextResponse.json({ error: 'Only base64 uploads or http(s) URLs supported' }, { status: 400 });
    } catch (e: any) {
        console.error("Image POST Error:", e.message);
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const token = (await cookieStore).get('auth_token');

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    try {
        const gifPath = path.join(IMAGES_DIR, `${id}.gif`);
        const pngPath = path.join(IMAGES_DIR, `${id}.png`);
        const jsonPath = path.join(IMAGES_DIR, `${id}.json`);

        // Delete GIF if exists
        try { await fs.unlink(gifPath); } catch { }
        // Delete PNG if exists
        try { await fs.unlink(pngPath); } catch { }
        // Delete metadata if exists
        try { await fs.unlink(jsonPath); } catch { }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Image DELETE Error:", e.message);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
