import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to manually load environment variables from .env if they aren't in process.env (common in standalone mode)
function getEnv(key: string): string | undefined {
    if (process.env[key]) return process.env[key];

    try {
        const envFiles = ['.env', '.env.local'];
        for (const file of envFiles) {
            const envPath = path.join(process.cwd(), file);
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf-8');
                const lines = content.split('\n');
                for (const line of lines) {
                    const [k, ...v] = line.split('=');
                    if (k.trim() === key) return v.join('=').trim().replace(/^["']|["']$/g, '');
                }
            }
        }
    } catch (e) { }
    return undefined;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '30';

    if (!type || !query) {
        return NextResponse.json({ error: 'Missing type or query' }, { status: 400 });
    }

    try {
        if (type === 'unsplash') {
            const accessKey = getEnv('UNSPLASH_ACCESS_KEY') || getEnv('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY');
            if (!accessKey) {
                console.error("Unsplash search failed: Access Key missing from ENV and .env file");
                return NextResponse.json({ error: 'Unsplash key not configured' }, { status: 500 });
            }

            const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, {
                headers: { 'Authorization': `Client-ID ${accessKey}` }
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        if (type === 'pexels') {
            const apiKey = getEnv('PEXELS_API_KEY') || getEnv('NEXT_PUBLIC_PEXELS_API_KEY');
            if (!apiKey) {
                console.error("Pexels search failed: API Key missing from ENV and .env file");
                return NextResponse.json({ error: 'Pexels key not configured' }, { status: 500 });
            }

            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, {
                headers: { 'Authorization': apiKey }
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        if (type === 'pixabay') {
            const apiKey = getEnv('PIXABAY_API_KEY') || getEnv('NEXT_PUBLIC_PIXABAY_API_KEY');
            if (!apiKey) {
                console.error("Pixabay search failed: API Key missing from ENV and .env file");
                return NextResponse.json({ error: 'Pixabay key not configured' }, { status: 500 });
            }

            const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=vector&per_page=${perPage}&page=${page}`);
            const data = await res.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        console.error(`External Search Error (${type}):`, error.message);
        return NextResponse.json({ error: 'Failed to fetch from external source' }, { status: 500 });
    }
}
