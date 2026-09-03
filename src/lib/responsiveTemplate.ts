import * as fabric from "fabric";

/* ------------------------------------------------------------------ *
 *  Responsive templates
 *
 *  Each template holds, per canvas size, a LAYOUT (fabric JSON), and
 *  a size-independent set of SLOTS (the text you type, the logos you
 *  swap in). Switching size loads that size's layout and re-applies
 *  the slots on top, so edits carry across every size.
 *
 *  Two tiers:
 *    default  – the canonical template. Rarely changed; you can revert to it.
 *    working  – your in-progress version with real names/photos set.
 *               Saved separately; "reset to default" throws it away.
 * ------------------------------------------------------------------ */

export type SlotValue = { text?: string; fill?: string; src?: string };
export type Slots = Record<string, SlotValue>;
export type Tier = "default" | "working";
export interface TierData { slots: Slots; layouts: Record<string, string> }

export interface ResponsiveDesign {
    id: string;
    name: string;
    responsive: true;
    nativeSize: string;
    default: TierData;
    working?: TierData | null;
    data: string;
    brandId?: string;
    visibility?: "private" | "global";
    [k: string]: any;
}

export const sizeKey = (w: number, h: number) => `${Math.round(w)}x${Math.round(h)}`;

export function isResponsive(d: any): d is ResponsiveDesign {
    return !!d && d.responsive === true && d.default && d.default.layouts;
}

export function tierOf(d: ResponsiveDesign): Tier {
    return d.working && d.working.layouts ? "working" : "default";
}

const isText = (o: any) => o && (o.type === "textbox" || o.type === "i-text" || o.type === "text");
const isImage = (o: any) => o && (o.type === "image" || o instanceof fabric.Image);

export function captureSlots(canvas: fabric.Canvas | null): Slots {
    if (!canvas) return {};
    const out: Slots = {};
    for (const o of canvas.getObjects() as any[]) {
        const name = o?.name;
        if (!name || typeof name !== "string") continue;
        const v: SlotValue = {};
        if (isText(o)) {
            v.text = o.text ?? "";
            if (typeof o.fill === "string") v.fill = o.fill;
        } else if (isImage(o)) {
            try { v.src = o.getSrc?.() || o._element?.currentSrc || o._element?.src; } catch { /* ignore */ }
        } else if (typeof o.fill === "string") {
            v.fill = o.fill;
        }
        if (Object.keys(v).length) out[name] = v;
    }
    return out;
}

export async function applySlots(canvas: fabric.Canvas | null, slots: Slots) {
    if (!canvas || !slots) return;
    const jobs: Promise<any>[] = [];
    for (const o of canvas.getObjects() as any[]) {
        const slot = o?.name && slots[o.name];
        if (!slot) continue;
        if (isText(o)) {
            if (slot.text !== undefined) o.set("text", slot.text);
            if (slot.fill) o.set("fill", slot.fill);
        } else if (isImage(o) && slot.src) {
            const w = o.getScaledWidth();
            const h = o.getScaledHeight();
            jobs.push(
                o.setSrc(slot.src, { crossOrigin: "anonymous" }).then(() => {
                    o.set({ scaleX: w / (o.width || 1), scaleY: h / (o.height || 1) });
                    o.setCoords();
                }).catch(() => { /* keep placeholder */ })
            );
        } else if (slot.fill && typeof o.fill === "string") {
            o.set("fill", slot.fill);
        }
    }
    await Promise.all(jobs);
    canvas.requestRenderAll();
}

export function reflowLayout(layoutJSON: string, fromW: number, fromH: number, toW: number, toH: number): string {
    let data: any;
    try { data = JSON.parse(layoutJSON); } catch { return layoutJSON; }
    const sx = toW / fromW;
    const sy = toH / fromH;
    const s = Math.min(sx, sy);
    for (const o of data.objects || []) {
        if (typeof o.left === "number") o.left *= sx;
        if (typeof o.top === "number") o.top *= sy;
        if (o.type === "Rect" || o.type === "rect") {
            if (typeof o.width === "number") o.width *= sx;
            if (typeof o.height === "number") o.height *= sy;
        } else {
            if (typeof o.scaleX === "number") o.scaleX *= s;
            if (typeof o.scaleY === "number") o.scaleY *= s;
            if (typeof o.fontSize === "number") o.fontSize *= s;
            if (typeof o.width === "number" && (o.type === "Textbox" || o.type === "textbox")) o.width *= sx;
        }
    }
    data.width = Math.round(toW);
    data.height = Math.round(toH);
    return JSON.stringify(data);
}

/** Layout string for a given size within a tier — exact, or reflowed from the nearest. */
export function layoutForSize(tierData: TierData, fallback: string, w: number, h: number): string {
    const key = sizeKey(w, h);
    if (tierData.layouts[key]) return tierData.layouts[key];

    const targetAR = w / h;
    let best: string | null = null;
    let bestKey = "";
    let bestDiff = Infinity;
    for (const [k, json] of Object.entries(tierData.layouts)) {
        const [lw, lh] = k.split("x").map(Number);
        const diff = Math.abs(lw / lh - targetAR);
        if (diff < bestDiff) { bestDiff = diff; best = json; bestKey = k; }
    }
    if (!best) return fallback;
    const [bw, bh] = bestKey.split("x").map(Number);
    return reflowLayout(best, bw, bh, w, h);
}
