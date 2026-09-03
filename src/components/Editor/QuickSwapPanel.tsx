"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Replace, Type, Image as ImageIcon, Palette, ALargeSmall, Crosshair, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import WebFont from "webfontloader";
import CustomColorPicker from "@/components/Editor/CustomColorPicker";

/* Quick Swap — find & replace every image, text block, font and colour
   in the open design. Works on any design; layers named in the Layers
   panel (and template slots) show up with that name. */

type AnyObj = any;

const isText = (o: AnyObj) => o && (o.type === "textbox" || o.type === "i-text" || o.type === "text");
const isImage = (o: AnyObj) => o && o.type === "image";

const normHex = (c: any): string | null => {
    if (typeof c !== "string") return null;
    let s = c.trim().toLowerCase();
    if (s === "black") s = "#000000";
    if (s === "white") s = "#ffffff";
    if (/^#([0-9a-f]{3})$/.test(s)) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return /^#([0-9a-f]{6})$/.test(s) ? s : null;
};

function Section({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
    return (
        <div className="mb-5">
            <p className="section-label">
                {icon}
                <span>{title}</span>
                <span className="count">{count}</span>
            </p>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

export default function QuickSwapPanel() {
    const { canvas, updateTick, forceUpdate, brandKits, savedDesigns, currentDesignId } = useCanvas() as any;
    const [, bump] = useState(0);
    const rerender = () => bump((v) => v + 1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingImg = useRef<AnyObj>(null);

    useEffect(() => {
        if (!canvas) return;
        const h = () => rerender();
        const evts = ["object:modified", "object:added", "object:removed", "text:changed", "selection:created", "selection:updated", "selection:cleared"];
        evts.forEach((e) => canvas.on(e as any, h));
        return () => evts.forEach((e) => canvas.off(e as any, h));
    }, [canvas]);

    const objects: AnyObj[] = useMemo(
        () => (canvas ? canvas.getObjects().filter((o: AnyObj) => !o.excludeFromExport) : []),
        [canvas, updateTick]
    );

    const commit = (target?: AnyObj) => {
        if (!canvas) return;
        canvas.requestRenderAll();
        canvas.fire("object:modified", { target: target || canvas.getActiveObject() });
        forceUpdate();
        rerender();
    };

    const select = (o: AnyObj) => {
        if (!canvas) return;
        canvas.setActiveObject(o);
        canvas.requestRenderAll();
        rerender();
    };

    const texts = objects.filter(isText);
    const images = objects.filter(isImage);

    const colourMap = useMemo(() => {
        const m = new Map<string, AnyObj[]>();
        for (const o of objects) {
            for (const key of ["fill", "stroke"] as const) {
                const hex = normHex((o as AnyObj)[key]);
                if (hex) {
                    if (!m.has(hex)) m.set(hex, []);
                    if (!m.get(hex)!.includes(o)) m.get(hex)!.push(o);
                }
            }
        }
        return m;
    }, [objects, updateTick]);

    const fontMap = useMemo(() => {
        const m = new Map<string, AnyObj[]>();
        for (const o of texts) {
            const f = (o.fontFamily || "").toString().replace(/["']/g, "").trim() || "(default)";
            if (!m.has(f)) m.set(f, []);
            m.get(f)!.push(o);
        }
        return m;
    }, [texts, updateTick]);

    const activeKit = useMemo(() => {
        const bId = savedDesigns.find((d: AnyObj) => d.id === currentDesignId)?.brandId;
        return brandKits.find((k: AnyObj) => k.id === bId) || brandKits[0];
    }, [brandKits, savedDesigns, currentDesignId]);
    const brandColours = useMemo(() => Array.from(new Set(activeKit?.colors || [])) as string[], [activeKit]);
    const brandFonts = useMemo(
        () => Array.from(new Set([...(activeKit?.fonts || []), ...brandKits.flatMap((k: AnyObj) => k.fonts || [])])) as string[],
        [activeKit, brandKits]
    );

    const setColourEverywhere = (from: string, to: string) => {
        const targets = colourMap.get(from) || [];
        targets.forEach((o) => {
            if (normHex(o.fill) === from) o.set("fill", to);
            if (normHex(o.stroke) === from) o.set("stroke", to);
        });
        commit(targets[0]);
    };

    const applyFont = (family: string, targets: AnyObj[]) => {
        const set = () => {
            targets.forEach((o) => o.set("fontFamily", family));
            commit(targets[0]);
        };
        if (family === "(default)") return;
        WebFont.load({ google: { families: [family] }, active: set, inactive: set });
    };

    const replaceImage = async (file: File) => {
        const obj = pendingImg.current;
        if (!obj || !canvas) return;
        const dataUrl: string = await new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(file);
        });
        let url = dataUrl;
        try {
            const id = `swap-${Date.now()}`;
            const r = await fetch("/api/images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, url: dataUrl, metadata: { tags: ["quick swap"] } }),
            });
            const j = await r.json();
            if (j.url) url = j.url;
        } catch { /* fall back to data url */ }
        await setImageFromUrl(obj, url);
    };

    const setImageFromUrl = async (obj: AnyObj, url: string) => {
        if (!obj) return;
        const w = obj.getScaledWidth();
        const h = obj.getScaledHeight();
        await obj.setSrc(url, { crossOrigin: "anonymous" });
        obj.set({ scaleX: w / (obj.width || 1), scaleY: h / (obj.height || 1) });
        obj.setCoords();
        commit(obj);
    };

    const imgThumb = (o: AnyObj): string => {
        try { return o.getSrc?.() || o._element?.currentSrc || o._element?.src || ""; } catch { return ""; }
    };

    if (!canvas) {
        return (
            <div className="panel">
                <div className="panel-head"><h2>Quick swap</h2></div>
                <div className="panel-body flex items-center justify-center text-text-mute text-[12px]">Loading canvas…</div>
            </div>
        );
    }

    const fontOptions = (current: string) =>
        Array.from(new Set([current, ...brandFonts, "Changa One", "Barlow Condensed", "Inter", "Oswald", "Anton", "Bebas Neue", "Montserrat"])).filter(Boolean);

    return (
        <div className="panel">
            <div className="panel-head">
                <h2>Quick swap</h2>
                <Replace className="h-4 w-4 text-text-mute" />
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceImage(f); e.target.value = ""; }}
            />

            <div className="panel-body">
                {objects.length === 0 && (
                    <p className="text-[12px] text-text-mute text-center py-14">Nothing on the canvas yet.</p>
                )}

                {images.length > 0 && (
                    <Section icon={<ImageIcon className="h-3.5 w-3.5" />} title="Images" count={images.length}>
                        {images.map((o, i) => (
                            <div key={i} className="rounded-app border border-line-soft bg-surface-2 p-2.5">
                                <button onClick={() => select(o)} className="mb-2 flex w-full items-center gap-2.5 text-left">
                                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-line bg-surface-3">
                                        {imgThumb(o) && <img src={imgThumb(o)} alt="" className="h-full w-full object-contain" />}
                                    </span>
                                    <span className="flex-1 truncate text-[13px] font-medium text-text">
                                        {o.name?.trim() || `Image ${i + 1}`}
                                    </span>
                                    <Crosshair className="h-3.5 w-3.5 shrink-0 text-text-mute" />
                                </button>
                                <button onClick={() => { pendingImg.current = o; fileInputRef.current?.click(); }} className="btn btn-sm btn-block">
                                    <Upload className="h-3.5 w-3.5" /> Replace image
                                </button>
                                {brandKits.some((k: AnyObj) => (k.images || []).length) && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {brandKits.flatMap((k: AnyObj) => k.images || []).slice(0, 6).map((url: string, bi: number) => (
                                            <button
                                                key={bi}
                                                onClick={() => setImageFromUrl(o, url)}
                                                title="Use brand image"
                                                className="h-8 w-8 overflow-hidden rounded-sm border border-line bg-surface-3 hover:border-gold"
                                            >
                                                <img src={url} alt="" className="h-full w-full object-contain" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </Section>
                )}

                {texts.length > 0 && (
                    <Section icon={<Type className="h-3.5 w-3.5" />} title="Text blocks" count={texts.length}>
                        {texts.map((o, i) => (
                            <div key={i} className="rounded-app border border-line-soft bg-surface-2 p-2.5">
                                <button onClick={() => select(o)} className="mb-1.5 flex w-full items-center gap-2 text-left">
                                    <span className="flex-1 truncate text-[12px] font-medium text-text-dim">
                                        {o.name?.trim() || `Text ${i + 1}`}
                                    </span>
                                    <Crosshair className="h-3.5 w-3.5 shrink-0 text-text-mute" />
                                </button>
                                <textarea
                                    value={o.text || ""}
                                    onChange={(e) => { o.set("text", e.target.value); canvas.requestRenderAll(); rerender(); }}
                                    onBlur={() => commit(o)}
                                    rows={Math.min(4, Math.max(1, (o.text || "").split("\n").length))}
                                    className="field"
                                />
                                <div className="mt-2 flex items-center gap-2">
                                    <CustomColorPicker color={normHex(o.fill) || "#ffffff"} onChange={(c) => { o.set("fill", c); commit(o); }} />
                                    <select
                                        value={(o.fontFamily || "").toString().replace(/["']/g, "")}
                                        onChange={(e) => applyFont(e.target.value, [o])}
                                        className="field"
                                    >
                                        {fontOptions((o.fontFamily || "").toString().replace(/["']/g, "")).map((f) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </Section>
                )}

                {colourMap.size > 0 && (
                    <Section icon={<Palette className="h-3.5 w-3.5" />} title="Colours in use" count={colourMap.size}>
                        {Array.from(colourMap.entries()).map(([hex, objs]) => (
                            <div key={hex} className="flex items-center gap-2.5 rounded-app border border-line-soft bg-surface-2 p-2">
                                <CustomColorPicker color={hex} onChange={(c) => setColourEverywhere(hex, c)} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-text">{hex.toUpperCase()}</p>
                                    <p className="text-[11px] text-text-mute">{objs.length} {objs.length === 1 ? "object" : "objects"}</p>
                                </div>
                                {brandColours.length > 0 && (
                                    <div className="flex shrink-0 gap-1">
                                        {brandColours.map((bc) => (
                                            <button
                                                key={bc}
                                                onClick={() => setColourEverywhere(hex, bc)}
                                                title={`Set to ${bc}`}
                                                className="h-5 w-5 rounded-sm border border-line hover:scale-110 transition-transform"
                                                style={{ backgroundColor: bc }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </Section>
                )}

                {fontMap.size > 0 && (
                    <Section icon={<ALargeSmall className="h-3.5 w-3.5" />} title="Fonts in use" count={fontMap.size}>
                        {Array.from(fontMap.entries()).map(([font, objs]) => (
                            <div key={font} className="rounded-app border border-line-soft bg-surface-2 p-2.5">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="truncate text-[14px] text-text" style={{ fontFamily: font }}>{font}</span>
                                    <span className="ml-auto text-[11px] text-text-mute">{objs.length}×</span>
                                </div>
                                <select value={font} onChange={(e) => applyFont(e.target.value, objs)} className="field">
                                    {fontOptions(font).map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </Section>
                )}
            </div>
        </div>
    );
}
