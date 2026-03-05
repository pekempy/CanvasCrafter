import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();
        if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

        const accessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!accessKey) return NextResponse.json({ error: 'Unsplash key not configured' }, { status: 500 });

        // Unsplash download track endpoint just needs the client ID
        await fetch(url, {
            headers: { 'Authorization': `Client-ID ${accessKey}` }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Unsplash Track Error:', error.message);
        return NextResponse.json({ error: 'Failed to track download' }, { status: 500 });
    }
}
