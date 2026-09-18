"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Replace, Type, Image as ImageIcon, Palette, ALargeSmall, Crosshair, Upload, Folder, Shield, Search, X, Users } from "lucide-react";
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
    const { canvas, updateTick, forceUpdate, brandKits, assetFolders, savedDesigns, currentDesignId, roster } = useCanvas() as any;
    const [, bump] = useState(0);
    const rerender = () => bump((v) => v + 1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingImg = useRef<AnyObj>(null);

    // State for Asset Picker modal in Quick Swap
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [selectedTargetObj, setSelectedTargetObj] = useState<AnyObj>(null);
    const [filterBrandId, setFilterBrandId] = useState<string>("all");
    const [filterFolderId, setFilterFolderId] = useState<string>("all");
    const [assetSearch, setAssetSearch] = useState<string>("");
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
    const [selectedPlayerPhotoUrl, setSelectedPlayerPhotoUrl] = useState<string>("");
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

    // Automagically swap a player across all matching slots/elements
    const swapPlayer = async (player: any, chosenPhotoUrl?: string) => {
        if (!canvas || !player) return;

        const photoToUse = chosenPhotoUrl || player.photoUrl || (player.folderId && assetFolders.find((f: any) => f.id === player.folderId)?.assets?.[0]?.url) || "";
        const playerName = player.name || "";
        const playerNum = player.number || "";
        const playerPos = player.position || "";

        const allObjects = canvas.getObjects() as AnyObj[];

        // 1. Identify text elements that match player patterns
        allObjects.forEach((o) => {
            if (!isText(o)) return;
            const name = (o.name || "").trim().toLowerCase();
            const currentText = (o.text || "").trim();

            // Explicit layer name matches
            if (name === "player name" || name === "player" || name === "name" || name === "player 1" || name === "players") {
                o.set("text", playerName.toUpperCase());
            } else if (name === "squad number" || name === "number" || name === "player number" || name === "#" || name === "big number 1") {
                o.set("text", playerNum);
            } else if (name === "position" || name === "player position") {
                o.set("text", playerPos.toUpperCase());
            }
            // Heuristic detection based on current content if layer name is unset
            else if (!o.name || o.name === "text" || o.name === "textbox") {
                // If it looks like a jersey number (e.g. "6", "#6", "74", "#74")
                if (/^#?\d{1,2}$/.test(currentText) && playerNum) {
                    const hasHash = currentText.startsWith("#");
                    o.set("text", hasHash ? `#${playerNum}` : playerNum);
                }
                // If text looks like a full player name or uppercase name
                else if (roster && roster.some((p: any) => p.name && (currentText.toLowerCase() === p.name.toLowerCase() || p.name.toLowerCase().includes(currentText.toLowerCase())))) {
                    o.set("text", currentText === currentText.toUpperCase() ? playerName.toUpperCase() : playerName);
                }
            }
        });

        // 2. Identify image elements that match player photo
        if (photoToUse) {
            const playerImages = allObjects.filter((o) => {
                if (!isImage(o)) return false;
                const name = (o.name || "").trim().toLowerCase();
                if (name === "player photo" || name === "player" || name === "photo" || name === "player 1 photo" || name === "headshot") {
                    return true;
                }
                return false;
            });

            // If explicit player images were found, update them
            if (playerImages.length > 0) {
                for (const imgObj of playerImages) {
                    await setImageFromUrl(imgObj, photoToUse);
                }
            } else {
                // Fallback: If there's an image that isn't a crest/logo/background, or if user selected one
                const candidate = allObjects.find((o) => {
                    if (!isImage(o)) return false;
                    const name = (o.name || "").toLowerCase();
                    return !name.includes("logo") && !name.includes("crest") && !name.includes("sponsor") && !name.includes("background");
                });
                if (candidate) {
                    await setImageFromUrl(candidate, photoToUse);
                }
            }
        }

        canvas.requestRenderAll();
        commit();
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
                {/* Automagic Player Swap */}
                {roster && roster.length > 0 && (
                    <Section icon={<Users className="h-3.5 w-3.5 text-gold" />} title="Player Swap" count={roster.length}>
                        <div className="rounded-app border border-line bg-surface-2 p-3 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold uppercase text-text-mute flex items-center justify-between">
                                    <span>Choose Player</span>
                                    <span className="text-gold font-normal lowercase">auto-fills name, #, photo</span>
                                </label>
                                <select
                                    value={selectedPlayerId}
                                    onChange={(e) => {
                                        const pId = e.target.value;
                                        setSelectedPlayerId(pId);
                                        const p = roster.find((r: any) => r.id === pId);
                                        if (p) {
                                            const defaultPhoto = p.photoUrl || (p.folderId && assetFolders.find((f: any) => f.id === p.folderId)?.assets?.[0]?.url) || "";
                                            setSelectedPlayerPhotoUrl(defaultPhoto);
                                            swapPlayer(p, defaultPhoto);
                                        }
                                    }}
                                    className="w-full rounded-md border border-line bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                                >
                                    <option value="" disabled className="bg-[#16191f]">Select a player to swap...</option>
                                    {roster
                                        .slice()
                                        .sort((a: any, b: any) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999))
                                        .map((p: any) => (
                                            <option key={p.id} value={p.id} className="bg-[#16191f]">
                                                {p.number ? `#${p.number} ` : ""}{p.name} ({p.position || "Forward"})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Player Photo variant picker if selected player has multiple photos */}
                            {(() => {
                                const p = roster.find((r: any) => r.id === selectedPlayerId);
                                if (!p || !p.folderId) return null;
                                const fol = assetFolders.find((f: any) => f.id === p.folderId);
                                if (!fol || fol.assets.length <= 1) return null;

                                return (
                                    <div className="space-y-1.5 pt-1 border-t border-line">
                                        <label className="text-[9px] font-semibold uppercase text-text-mute">
                                            Switch Photo Pose / Cutout ({fol.assets.length} available)
                                        </label>
                                        <div className="grid grid-cols-5 gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/5 rounded-md border border-line">
                                            {fol.assets.map((asset: any) => (
                                                <button
                                                    key={asset.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPlayerPhotoUrl(asset.url);
                                                        swapPlayer(p, asset.url);
                                                    }}
                                                    className={`relative aspect-square rounded overflow-hidden border transition-all ${selectedPlayerPhotoUrl === asset.url ? 'border-gold ring-1 ring-gold' : 'border-line opacity-60 hover:opacity-100'}`}
                                                >
                                                    <img src={asset.url} alt="" className="h-full w-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </Section>
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
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                        onClick={() => {
                                            setSelectedTargetObj(o);
                                            setIsAssetPickerOpen(true);
                                        }}
                                        className="btn btn-sm btn-primary flex items-center justify-center gap-1 text-[11px]"
                                    >
                                        <Folder className="h-3.5 w-3.5" /> Pick asset
                                    </button>
                                    <button
                                        onClick={() => { pendingImg.current = o; fileInputRef.current?.click(); }}
                                        className="btn btn-sm flex items-center justify-center gap-1 text-[11px]"
                                    >
                                        <Upload className="h-3.5 w-3.5" /> Upload new
                                    </button>
                                </div>
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

            {/* Asset Picker Modal */}
            {isAssetPickerOpen && selectedTargetObj && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="flex h-[85vh] max-h-[700px] w-full max-w-2xl flex-col rounded-xl border border-line bg-[#16191f] shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-white/5">
                            <div>
                                <h3 className="text-sm font-semibold text-white">Select Replacement Asset</h3>
                                <p className="text-[11px] text-text-mute">
                                    Replacing: <span className="text-gold font-medium">{selectedTargetObj.name?.trim() || "Image"}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsAssetPickerOpen(false); setSelectedTargetObj(null); }}
                                className="rounded-lg p-1 text-text-mute hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Filters Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-b border-line p-3 bg-white/2">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-mute" />
                                <input
                                    type="text"
                                    placeholder="Search tags / name..."
                                    value={assetSearch}
                                    onChange={(e) => setAssetSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                            </div>

                            {/* Brand Filter */}
                            <select
                                value={filterBrandId}
                                onChange={(e) => setFilterBrandId(e.target.value)}
                                className="w-full bg-white/5 border border-line rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                            >
                                <option value="all" className="bg-[#16191f]">All Brands</option>
                                {brandKits.map((b: AnyObj) => (
                                    <option key={b.id} value={b.id} className="bg-[#16191f]">{b.name}</option>
                                ))}
                            </select>

                            {/* Folder Filter */}
                            <select
                                value={filterFolderId}
                                onChange={(e) => setFilterFolderId(e.target.value)}
                                className="w-full bg-white/5 border border-line rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                            >
                                <option value="all" className="bg-[#16191f]">All Folders</option>
                                {assetFolders.map((f: AnyObj) => (
                                    <option key={f.id} value={f.id} className="bg-[#16191f]">{f.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assets Grid */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                            {(() => {
                                // Gather all candidate assets
                                type CandidateAsset = { id: string | number; url: string; tags?: string[]; folderName?: string; brandName?: string };
                                const list: CandidateAsset[] = [];
                                const seenUrls = new Set<string>();

                                // Collect from Brand Kit Images
                                brandKits.forEach((b: AnyObj) => {
                                    if (filterBrandId !== "all" && b.id !== filterBrandId) return;
                                    (b.images || []).forEach((imgUrl: string, idx: number) => {
                                        if (!seenUrls.has(imgUrl)) {
                                            seenUrls.add(imgUrl);
                                            list.push({ id: `brand-${b.id}-${idx}`, url: imgUrl, brandName: b.name, tags: [b.name, "brand"] });
                                        }
                                    });
                                });

                                // Collect from Asset Folders
                                assetFolders.forEach((f: AnyObj) => {
                                    if (filterFolderId !== "all" && f.id !== filterFolderId) return;

                                    // If brand filter is set, ensure folder is linked or asset has matching brandId
                                    const isFolderLinkedToBrand = filterBrandId === "all" || brandKits.some((b: AnyObj) => b.id === filterBrandId && (b.assetFolderIds || []).includes(f.id));

                                    (f.assets || []).forEach((a: AnyObj) => {
                                        if (filterBrandId !== "all" && !isFolderLinkedToBrand && a.brandId !== filterBrandId) return;
                                        if (!seenUrls.has(a.url)) {
                                            seenUrls.add(a.url);
                                            list.push({ id: a.id, url: a.url, folderName: f.name, tags: a.tags });
                                        }
                                    });
                                });

                                // Filter by search term
                                const q = assetSearch.trim().toLowerCase();
                                const filtered = list.filter((item) => {
                                    if (!q) return true;
                                    const matchTag = (item.tags || []).some((t: string) => t.toLowerCase().includes(q));
                                    const matchFolder = (item.folderName || "").toLowerCase().includes(q);
                                    const matchBrand = (item.brandName || "").toLowerCase().includes(q);
                                    return matchTag || matchFolder || matchBrand;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="flex h-full flex-col items-center justify-center py-16 text-center opacity-40">
                                            <ImageIcon className="h-10 w-10 mb-3" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-text-mute">No assets found</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {filtered.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={async () => {
                                                    await setImageFromUrl(selectedTargetObj, item.url);
                                                    setIsAssetPickerOpen(false);
                                                    setSelectedTargetObj(null);
                                                }}
                                                className="group relative flex flex-col aspect-square rounded-lg border border-line bg-surface-3 p-2 hover:border-gold hover:bg-gold/5 transition-all text-left overflow-hidden"
                                            >
                                                <div className="flex-1 flex items-center justify-center overflow-hidden">
                                                    <img src={item.url} alt="" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
                                                </div>
                                                <div className="mt-1.5 truncate text-[9px] text-text-mute group-hover:text-gold transition-colors">
                                                    {item.brandName || item.folderName || (item.tags && item.tags[0]) || "Asset"}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end border-t border-line px-5 py-3 bg-white/5">
                            <button
                                onClick={() => { setIsAssetPickerOpen(false); setSelectedTargetObj(null); }}
                                className="btn btn-sm btn-ghost text-text-mute hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
