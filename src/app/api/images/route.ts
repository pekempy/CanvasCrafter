import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/security';

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
        const filePath = path.join(IMAGES_DIR, `${id}.png`); // Support more formats? user said "images"
        const data = await fs.readFile(filePath);

        // Basic mime type detection based on extension or just use image/png for now since uploads are likely converted
        return new NextResponse(data, {
            headers: {
                'Content-Type': 'image/png',
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
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = path.join(IMAGES_DIR, `${id}.png`);
            await fs.writeFile(filePath, buffer);

            // Save sidecar JSON
            const jsonPath = path.join(IMAGES_DIR, `${id}.json`);
            await fs.writeFile(jsonPath, JSON.stringify({
                id,
                ...metadata,
                owner: user || undefined,
                timestamp: Date.now()
            }, null, 2));

            return NextResponse.json({
                success: true,
                url: `/api/images?id=${id}`
            });
        }

        return NextResponse.json({ error: 'Only base64 uploads supported via this route currently' }, { status: 400 });
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
        const filePath = path.join(IMAGES_DIR, `${id}.png`);
        const jsonPath = path.join(IMAGES_DIR, `${id}.json`);

        // Delete image if exists
        try { await fs.unlink(filePath); } catch { }
        // Delete metadata if exists
        try { await fs.unlink(jsonPath); } catch { }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Image DELETE Error:", e.message);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}
