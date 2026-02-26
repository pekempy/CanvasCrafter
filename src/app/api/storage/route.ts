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
            return NextResponse.json(JSON.parse(data));
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

        // Write file atomically (or simply write for now)
        await fs.writeFile(filePath, JSON.stringify(body));
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Storage POST Error:", e.message);
        return NextResponse.json({ error: 'Failed to write' }, { status: 500 });
    }
}
