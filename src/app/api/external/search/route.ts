import { NextResponse } from 'next/server';

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
            const accessKey = process.env.UNSPLASH_ACCESS_KEY;
            if (!accessKey) return NextResponse.json({ error: 'Unsplash key not configured' }, { status: 500 });

            const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, {
                headers: { 'Authorization': `Client-ID ${accessKey}` }
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        if (type === 'pexels') {
            const apiKey = process.env.PEXELS_API_KEY;
            if (!apiKey) return NextResponse.json({ error: 'Pexels key not configured' }, { status: 500 });

            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, {
                headers: { 'Authorization': apiKey }
            });
            const data = await res.json();
            return NextResponse.json(data);
        }

        if (type === 'pixabay') {
            const apiKey = process.env.PIXABAY_API_KEY;
            if (!apiKey) return NextResponse.json({ error: 'Pixabay key not configured' }, { status: 500 });

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
