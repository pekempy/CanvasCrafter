import { NextResponse } from "next/server";

/* Hull Seahawks fixtures, scraped from nihlnational.com's server-rendered
   schedule page. Cached in memory for a few hours — fixtures rarely move. */

const SITE = "https://www.nihlnational.com";
const HULL_TEAM_ID = 3;

// One home rink per club (not in the schedule markup).
const VENUES: Record<string, string> = {
    "hull seahawks": "Hull Ice Arena",
    "basingstoke bison": "Planet Ice Basingstoke",
    "bristol pitbulls": "Planet Ice Bristol",
    "leeds knights": "Planet Ice Leeds",
    "milton keynes lightning": "Planet Ice Milton Keynes",
    "peterborough phantoms": "Planet Ice Peterborough",
    "romford raiders": "Sapphire Ice, Romford",
    "sheffield steeldogs": "iceSheffield",
    "solway ihc": "Dumfries Ice Bowl",
    "solway sharks": "Dumfries Ice Bowl",
    "swindon wildcats": "Link Centre, Swindon",
    "telford tigers": "Telford Ice Rink",
};

type Fixture = {
    id: string;
    date: string;        // ISO date "2026-11-14"
    time: string;        // "19:00"
    home: string;
    away: string;
    homeId: number | null;
    awayId: number | null;
    isHome: boolean;
    opponent: string;
    opponentId: number | null;
    opponentLogo: string;
    venue: string;
    played: boolean;
    score: string | null;
};

let cache: { at: number; data: Fixture[] } | null = null;
const TTL = 1000 * 60 * 60 * 4;

async function fetchText(url: string) {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 CanvasCrafter" }, next: { revalidate: 0 } });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return r.text();
}

function decode(s: string) {
    return s.replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
}

async function scrape(): Promise<Fixture[]> {
    // current season id (the "selected" option), fall back to 9
    let season = 9;
    try {
        const home = await fetchText(`${SITE}/schedule`);
        const m = home.match(/id_season=(\d+)"\s+selected/);
        if (m) season = parseInt(m[1]);
    } catch { /* keep default */ }

    const html = await fetchText(`${SITE}/schedule?id_season=${season}&id_team=${HULL_TEAM_ID}`);
    const out: Fixture[] = [];
    const seen = new Set<string>();

    // Each fixture row carries a <time datetime="YYYY-MM-DD">HH:MM</time> then a
    // 3-col grid: home <a/team> + img, <a/game> score, away img + <a/team>.
    const rowRe =
        /<time datetime="(\d{4}-\d{2}-\d{2})[^"]*"[^>]*>\s*([0-9]{1,2}:[0-9]{2})?\s*<\/time>[\s\S]{0,600}?href="\/team\/(\d+)-[a-z-]+"[^>]*>([^<]+)<\/a>[\s\S]{0,400}?href="\/game\/([\w-]+)"[^>]*>([^<]*)<\/a>[\s\S]{0,400}?href="\/team\/(\d+)-[a-z-]+"[^>]*>([^<]+)<\/a>/g;

    let r: RegExpExecArray | null;
    while ((r = rowRe.exec(html))) {
        const [, date, time, homeId, home, gameId, scoreRaw, awayId, away] = r;
        if (seen.has(gameId)) continue;
        seen.add(gameId);
        const H = decode(home), A = decode(away);
        if (!/seahawk/i.test(H) && !/seahawk/i.test(A)) continue;
        const isHome = /seahawk/i.test(H);
        const opp = isHome ? A : H;
        const oppId = parseInt(isHome ? awayId : homeId) || null;
        const score = scoreRaw && /\d/.test(scoreRaw) ? decode(scoreRaw) : null;
        out.push({
            id: gameId,
            date,
            time: (time || "").trim() || "TBC",
            home: H,
            away: A,
            homeId: parseInt(homeId) || null,
            awayId: parseInt(awayId) || null,
            isHome,
            opponent: opp,
            opponentId: oppId,
            opponentLogo: oppId ? `${SITE}/photo/team/team_${oppId}.png` : "",
            venue: VENUES[(isHome ? H : opp).toLowerCase()] || (isHome ? "Hull Ice Arena" : ""),
            played: !!score,
            score,
        });
    }
    out.sort((a, b) => a.date.localeCompare(b.date));
    return out;
}

export async function GET() {
    try {
        if (!cache || Date.now() - cache.at > TTL) {
            cache = { at: Date.now(), data: await scrape() };
        }
        const today = new Date().toISOString().slice(0, 10);
        const upcoming = cache.data.filter((f) => f.date >= today).slice(0, 12);
        const recent = cache.data.filter((f) => f.date < today).slice(-4).reverse();
        return NextResponse.json({ upcoming, recent, count: cache.data.length });
    } catch (e: any) {
        return NextResponse.json({ error: "Could not load fixtures", detail: String(e?.message || e) }, { status: 502 });
    }
}
