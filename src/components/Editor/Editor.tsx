"use client";

import { useState, useEffect } from "react";
import {
    Type,
    Image as ImageIcon,
    Square,
    Layers as LayersIcon,
    Circle as CircleIcon,
    Palette,
    Shield as BadgeIcon,
    Shapes,
    Triangle,
    Star,
    Heart,
    Hexagon,
    Diamond,
    ArrowRight,
    Cloud,
    Pencil,
    Replace,
    LayoutTemplate,
    SlidersHorizontal,
    Minus,
    Plus,
    Maximize2,
    Grid3x3,
    MousePointer2,
} from "lucide-react";
import FabricCanvas from "@/components/Editor/FabricCanvas";
import Toolbar from "@/components/Editor/Toolbar";
import ResizeDialog from "@/components/Editor/ResizeDialog";
import LayersPanel from "@/components/Editor/LayersPanel";
import AssetPanel from "@/components/Editor/AssetPanel";
import TemplatePanel from "@/components/Editor/TemplatePanel";
import BrandPanel from "@/components/Editor/BrandPanel";
import SettingsPanel from "@/components/Editor/SettingsPanel";
import FontUploader from "@/components/Editor/FontUploader";
import PropertiesPanel from "@/components/Editor/PropertiesPanel";
import ContextMenu from "@/components/Editor/ContextMenu";
import { CanvasProvider, useCanvas } from "@/store/useCanvasStore";
import DropAssetDialog from "@/components/Editor/DropAssetDialog";
import MenuBar from "@/components/Editor/MenuBar";
import PropertyBar from "@/components/Editor/PropertyBar";
import CustomColorPicker from "@/components/Editor/CustomColorPicker";
import BrandShortcuts from "@/components/Editor/BrandShortcuts";
import QuickSwapPanel from "@/components/Editor/QuickSwapPanel";

type SidebarTab = "templates" | "assets" | "text" | "shapes" | "layers" | "brands" | "settings" | "swap";

const NAV: { tab: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { tab: "templates", label: "Templates", icon: <LayoutTemplate className="h-[18px] w-[18px]" /> },
    { tab: "swap", label: "Swap", icon: <Replace className="h-[18px] w-[18px]" /> },
    { tab: "brands", label: "Brands", icon: <Palette className="h-[18px] w-[18px]" /> },
    { tab: "text", label: "Text", icon: <Type className="h-[18px] w-[18px]" /> },
    { tab: "assets", label: "Assets", icon: <ImageIcon className="h-[18px] w-[18px]" /> },
    { tab: "shapes", label: "Shapes", icon: <Shapes className="h-[18px] w-[18px]" /> },
    { tab: "layers", label: "Layers", icon: <LayersIcon className="h-[18px] w-[18px]" /> },
];

function EditorContent({ username }: { username?: string }) {
    const [activeTab, setActiveTab] = useState<SidebarTab>("templates");
    const [droppedImage, setDroppedImage] = useState<string | null>(null);
    const [isHoveringFile, setIsHoveringFile] = useState(false);

    const {
        addRect, addText, addCircle, addTriangle, addStar,
        addHexagon, addDiamond, addArrow, addHeart,
        addBadge, addCloud, addPolygon,
        canvas, updateTick, selectedObject, canvasSize, setCanvasSize,
        zoom, setZoom, panOffset, fitToScreen, showGrid, setShowGrid,
        canvasName,
        setCurrentUser,
        setIsResizeOpen,
        switchTemplateSize, activeTemplate,
        isDrawingMode, setIsDrawingMode, brushSize, setBrushSize, brushColor, setBrushColor, brushSmoothing, setBrushSmoothing,
        savingAssetUrl, setSavingAssetUrl,
        presets,
        addImage, assetFolders, setAssetFolders,
    } = useCanvas() as any;

    const [sidebarWidth, setSidebarWidth] = useState(272);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        document.title = canvasName ? `${canvasName} — CanvasCrafter` : "CanvasCrafter";
    }, [canvasName]);

    useEffect(() => {
        if (username) setCurrentUser(username);
    }, [username, setCurrentUser]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
            if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsResizeOpen(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setIsResizeOpen]);

    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!isResizing) return;
            const w = e.clientX - 76;
            if (w > 210 && w < 460) setSidebarWidth(w);
        };
        const up = () => { setIsResizing(false); setTimeout(fitToScreen, 30); };
        if (isResizing) {
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
        }
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
    }, [isResizing, fitToScreen]);

    // Re-fit whenever the panel dock is resized (changes the space the canvas has).
    useEffect(() => {
        const t = setTimeout(fitToScreen, 60);
        return () => clearTimeout(t);
    }, [sidebarWidth, fitToScreen]);

    const updateActiveTab = (tab: SidebarTab) => {
        setActiveTab(tab);
        setIsDrawingMode(false);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsHoveringFile(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsHoveringFile(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsHoveringFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (ev) => setDroppedImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadAndPlace = async (dataUrl: string, brandId?: string, folderId?: string, tags?: string[]) => {
        const assetId = Date.now();
        let finalUrl = dataUrl;
        try {
            const res = await fetch("/api/images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: assetId.toString(), url: dataUrl, metadata: { tags, folderId, brandId } }),
            });
            const data = await res.json();
            if (data.url) finalUrl = data.url;
        } catch (e) { console.error("upload failed", e); }
        if (folderId) {
            setAssetFolders(assetFolders.map((f: any) =>
                f.id === folderId ? { ...f, assets: [{ id: assetId, url: finalUrl, tags, brandId }, ...f.assets] } : f
            ));
        }
        return finalUrl;
    };

    const handleConfirmDrop = async (brandId?: string, folderId?: string, tags?: string[]) => {
        if (!droppedImage) return;
        const url = await uploadAndPlace(droppedImage, brandId, folderId, tags);
        addImage(url);
        setDroppedImage(null);
    };

    const handleConfirmSave = async (brandId?: string, folderId?: string, tags?: string[]) => {
        if (!savingAssetUrl) return;
        await uploadAndPlace(savingAssetUrl, brandId, folderId, tags);
        setSavingAssetUrl(null);
    };

    const objectCount = canvas ? canvas.getObjects().filter((o: any) => !o.excludeFromExport).length : 0;
    const isEmpty = !!canvas && objectCount === 0;

    const applyFormat = (w: number, h: number) => {
        switchTemplateSize(w, h);
        setTimeout(fitToScreen, 60);
    };

    return (
        <main
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex h-screen flex-col overflow-hidden bg-bg text-text relative"
        >
            <ResizeDialog />
            <DropAssetDialog isOpen={!!droppedImage} onClose={() => setDroppedImage(null)} dataUrl={droppedImage} onConfirm={handleConfirmDrop} />
            <DropAssetDialog isOpen={!!savingAssetUrl} onClose={() => setSavingAssetUrl(null)} dataUrl={savingAssetUrl} onConfirm={handleConfirmSave} />
            <ContextMenu />

            {isHoveringFile && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-bg/70 pointer-events-none"
                    style={{ outline: "2px dashed var(--gold-line)", outlineOffset: "-12px" }}>
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-8 py-7">
                        <ImageIcon className="h-8 w-8 text-gold" />
                        <h2 className="text-[15px] font-semibold text-text">Drop to add image</h2>
                    </div>
                </div>
            )}

            <MenuBar setActiveTab={setActiveTab} />
            <PropertyBar />

            {activeTemplate && (
                <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
                    <span className="text-[12px] text-text-dim">Size</span>
                    <div className="seg">
                        {(presets?.length ? presets : [
                            { id: "ig", name: "Square", width: 1080, height: 1080 },
                            { id: "xfb", name: "X / FB", width: 1200, height: 675 },
                            { id: "poster", name: "Poster", width: 1080, height: 1350 },
                            { id: "big", name: "Big screen", width: 1280, height: 576 },
                        ]).map((p: any) => (
                            <button
                                key={p.id}
                                className={canvasSize.width === p.width && canvasSize.height === p.height ? "is-active" : ""}
                                onClick={() => applyFormat(p.width, p.height)}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                    <span className="ml-1 text-[11px] tabular-nums text-text-mute">{canvasSize.width}×{canvasSize.height}</span>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Nav rail */}
                <nav className="flex w-[76px] shrink-0 flex-col items-stretch border-r border-line bg-surface py-2">
                    {NAV.map((n) => (
                        <NavItem key={n.tab} {...n} active={activeTab === n.tab} onClick={() => updateActiveTab(n.tab)} />
                    ))}
                    <div className="flex-1" />
                    <NavItem tab="settings" label="Settings" icon={<SlidersHorizontal className="h-[18px] w-[18px]" />} active={activeTab === "settings"} onClick={() => updateActiveTab("settings")} />
                </nav>

                {/* Left dock — active panel */}
                <aside style={{ width: sidebarWidth }} className="relative shrink-0 border-r border-line bg-surface flex flex-col h-full">
                    <div
                        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                        className={`absolute right-0 top-0 h-full w-1 translate-x-1/2 cursor-col-resize z-50 transition-colors ${isResizing ? "bg-gold" : "hover:bg-gold/50"}`}
                    />
                    {activeTab === "templates" && <TemplatePanel />}
                    {activeTab === "swap" && <QuickSwapPanel />}
                    {activeTab === "brands" && <BrandPanel />}
                    {activeTab === "settings" && <SettingsPanel />}
                    {activeTab === "assets" && <AssetPanel />}
                    {activeTab === "layers" && <LayersPanel />}

                    {activeTab === "text" && (
                        <div className="panel">
                            <div className="panel-head"><h2>Text</h2></div>
                            <div className="panel-body">
                                <button onClick={addText} className="btn btn-primary btn-block mb-4">
                                    <Type className="h-4 w-4" /> Add a text box
                                </button>
                                <FontUploader />
                                <BrandShortcuts />
                            </div>
                        </div>
                    )}

                    {activeTab === "shapes" && (
                        <div className="panel">
                            <div className="panel-head"><h2>Shapes &amp; drawing</h2></div>
                            <div className="panel-body">
                                <button
                                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                                    className={`btn btn-block mb-4 ${isDrawingMode ? "btn-primary" : ""}`}
                                >
                                    <Pencil className="h-4 w-4" /> {isDrawingMode ? "Stop drawing" : "Freehand draw"}
                                </button>

                                {isDrawingMode && (
                                    <div className="mb-5 rounded-app border border-line bg-surface-2 p-3">
                                        <div className="mb-3">
                                            <div className="mb-1.5 flex items-center justify-between text-[12px] text-text-dim">
                                                <span>Brush size</span><span className="text-text">{brushSize}px</span>
                                            </div>
                                            <input type="range" min={1} max={100} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} />
                                        </div>
                                        <div className="mb-3">
                                            <div className="mb-1.5 flex items-center justify-between text-[12px] text-text-dim">
                                                <span>Smoothing</span><span className="text-text">{brushSmoothing}</span>
                                            </div>
                                            <input type="range" min={1} max={50} value={brushSmoothing} onChange={(e) => setBrushSmoothing(parseInt(e.target.value))} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CustomColorPicker color={brushColor} onChange={setBrushColor} />
                                            <span className="text-[12px] text-text-dim">Hold <kbd>Shift</kbd> for straight lines</span>
                                        </div>
                                    </div>
                                )}

                                <p className="section-label">Add a shape</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <ShapeButton icon={<Square className="h-5 w-5" />} label="Rectangle" onClick={addRect} />
                                    <ShapeButton icon={<CircleIcon className="h-5 w-5" />} label="Circle" onClick={addCircle} />
                                    <ShapeButton icon={<Triangle className="h-5 w-5" />} label="Triangle" onClick={() => addTriangle()} />
                                    <ShapeButton icon={<Hexagon className="h-5 w-5" />} label="Hexagon" onClick={() => addHexagon()} />
                                    <ShapeButton icon={<Diamond className="h-5 w-5" />} label="Diamond" onClick={() => addDiamond()} />
                                    <ShapeButton icon={<ArrowRight className="h-5 w-5" />} label="Arrow" onClick={() => addArrow()} />
                                    <ShapeButton icon={<Star className="h-5 w-5" />} label="Star" onClick={() => addStar(5)} />
                                    <ShapeButton icon={<Shapes className="h-5 w-5" />} label="Polygon" onClick={() => addPolygon(6)} />
                                    <ShapeButton icon={<BadgeIcon className="h-5 w-5" />} label="Badge" onClick={() => addBadge()} />
                                    <ShapeButton icon={<Cloud className="h-5 w-5" />} label="Cloud" onClick={() => addCloud()} />
                                    <ShapeButton icon={<Heart className="h-5 w-5" />} label="Heart" onClick={() => addHeart()} />
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Canvas */}
                <section className="relative flex flex-1 min-w-0 flex-col overflow-hidden bg-bg">
                    <div id="cc-canvas-viewport" className="flex-1 overflow-auto relative flex items-center justify-center p-16 scrollbar-hide">
                        <div className="relative" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)`, boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
                            <FabricCanvas />
                        </div>

                        {isEmpty && (
                            <StartOverlay
                                presets={presets}
                                canvasSize={canvasSize}
                                onPick={applyFormat}
                                onTemplates={() => setActiveTab("templates")}
                            />
                        )}
                    </div>

                    {/* Bottom bar — zoom only */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-app border border-line bg-surface px-1.5 py-1.5 z-40 shadow-lg">
                        <button className={`icon-btn ${showGrid ? "is-active" : ""}`} onClick={() => setShowGrid(!showGrid)} title="Toggle grid">
                            <Grid3x3 className="h-4 w-4" />
                        </button>
                        <div className="mx-1 h-4 w-px bg-line" />
                        <button className="icon-btn" onClick={() => setZoom(Math.max(10, zoom - 10))} title="Zoom out"><Minus className="h-4 w-4" /></button>
                        <span className="w-12 text-center text-[12px] font-semibold tabular-nums text-text">{Math.round(zoom)}%</span>
                        <button className="icon-btn" onClick={() => setZoom(Math.min(500, zoom + 10))} title="Zoom in"><Plus className="h-4 w-4" /></button>
                        <div className="mx-1 h-4 w-px bg-line" />
                        <button className="btn btn-ghost btn-sm" onClick={fitToScreen}><Maximize2 className="h-3.5 w-3.5" /> Fit</button>
                    </div>

                </section>

                {/* Right dock — properties, always present */}
                <aside className="relative shrink-0 w-[296px] border-l border-line bg-surface z-[60] flex flex-col">
                    {selectedObject && (
                        <div className="absolute right-full top-4 translate-x-2 z-10">
                            <Toolbar />
                        </div>
                    )}
                    {selectedObject ? (
                        <PropertiesPanel />
                    ) : (
                        <div className="panel">
                            <div className="panel-head"><h2>Properties</h2></div>
                            <div className="panel-body flex flex-col items-center justify-center text-center gap-3 text-text-dim">
                                <MousePointer2 className="h-7 w-7 text-text-mute" />
                                <p className="text-[13px] leading-relaxed max-w-[210px]">
                                    Select an item on the canvas to change its text, colour, font and position.
                                </p>
                                <button className="btn btn-sm mt-1" onClick={() => setActiveTab("templates")}>
                                    <LayoutTemplate className="h-3.5 w-3.5" /> Start from a template
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}

export default function Editor({ username }: { username?: string }) {
    return (
        <CanvasProvider>
            <EditorContent username={username} />
        </CanvasProvider>
    );
}

function NavItem({ label, icon, active, onClick }: { tab: string; label: string; icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                ${active ? "text-gold" : "text-text-mute hover:text-text-dim"}`}
        >
            {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-gold" />}
            {icon}
            <span className="leading-none">{label}</span>
        </button>
    );
}

function ShapeButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="flex flex-col items-center justify-center gap-1.5 rounded-app border border-line bg-surface-2 py-3.5 text-text-dim transition-colors hover:bg-surface-3 hover:text-text"
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}

function StartOverlay({ presets, canvasSize, onPick, onTemplates }: any) {
    const list = (presets && presets.length ? presets : [
        { id: "ig", name: "Instagram square", width: 1080, height: 1080 },
        { id: "xfb", name: "X / Facebook", width: 1200, height: 675 },
        { id: "poster", name: "Matchday poster", width: 1080, height: 1350 },
        { id: "big", name: "Big screen", width: 1280, height: 576 },
    ]);
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/80 backdrop-blur-[2px]">
            <div className="w-full max-w-[440px] px-6">
                <h1 className="mb-1 text-[26px] leading-tight text-text" style={{ fontFamily: "var(--font-display)" }}>
                    New graphic
                </h1>
                <p className="mb-5 text-[13px] text-text-dim">Pick a size to start, or open a saved template.</p>
                <div className="grid grid-cols-2 gap-2.5">
                    {list.map((p: any) => {
                        const active = canvasSize?.width === p.width && canvasSize?.height === p.height;
                        return (
                            <button
                                key={p.id}
                                onClick={() => onPick(p.width, p.height)}
                                className={`flex flex-col items-start gap-2 rounded-app border p-3.5 text-left transition-colors
                                    ${active ? "border-gold bg-gold/10" : "border-line bg-surface-2 hover:bg-surface-3"}`}
                            >
                                <span
                                    className="rounded-sm border border-line bg-surface-3"
                                    style={{
                                        width: 44,
                                        height: 44 * (p.height / p.width),
                                        maxHeight: 44,
                                    }}
                                />
                                <span className="text-[13px] font-medium text-text">{p.name}</span>
                                <span className="text-[11px] text-text-mute tabular-nums">{p.width} × {p.height}</span>
                            </button>
                        );
                    })}
                </div>
                <button onClick={onTemplates} className="btn btn-block mt-3">
                    <LayoutTemplate className="h-4 w-4" /> Open a template
                </button>
            </div>
        </div>
    );
}
