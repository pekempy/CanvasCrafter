"use client";

import { useState } from "react";
import {
    Type,
    Image as ImageIcon,
    Square,
    Layers as LayersIcon,
    Download,
    Undo2,
    Redo2,
    Plus,
    MousePointer2,
    Settings2,
    Circle as CircleIcon,
    Trash2,
    FileDown,
    ChevronDown,
    Palette,
    Shield as BadgeIcon,
    Sun,
    Moon,
    Shapes,
    Triangle,
    Star,
    Heart,
    Hexagon,
    Diamond,
    ArrowRight,
    Cloud
} from "lucide-react";
import FabricCanvas from "@/components/Editor/FabricCanvas";
import Toolbar from "@/components/Editor/Toolbar";
import ResizeDialog from "@/components/Editor/ResizeDialog";
import LayersPanel from "@/components/Editor/LayersPanel";
import AssetPanel from "@/components/Editor/AssetPanel";
import TemplatePanel from "@/components/Editor/TemplatePanel";
import BrandPanel from "@/components/Editor/BrandPanel";
import FontUploader from "@/components/Editor/FontUploader";
import PropertiesPanel from "@/components/Editor/PropertiesPanel";
import ContextMenu from "@/components/Editor/ContextMenu";
import { CanvasProvider, useCanvas } from "@/store/useCanvasStore";
import DropAssetDialog from "@/components/Editor/DropAssetDialog";

type SidebarTab = "templates" | "assets" | "text" | "shapes" | "layers" | "brands";

function EditorContent() {
    const [isResizeOpen, setIsResizeOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>("templates");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [droppedImage, setDroppedImage] = useState<string | null>(null);
    const [isHoveringFile, setIsHoveringFile] = useState(false);

    const {
        addRect, addText, addCircle, addTriangle, addStar,
        addHexagon, addDiamond, addArrow, addHeart,
        addBadge, addCloud, addPolygon,
        clearCanvas, selectedObject, canvasSize, exportAsFormat,
        theme, setTheme, zoom, setZoom, panOffset, fitToScreen, showGrid, setShowGrid,
        undo, redo, canUndo, canRedo,
        canvasName, setCanvasName
    } = useCanvas();

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

    const { addImage, assetFolders, setAssetFolders, brandKits, setBrandKits } = useCanvas();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHoveringFile(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHoveringFile(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHoveringFile(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setDroppedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmDrop = async (brandId?: string, folderId?: string, tags?: string[]) => {
        if (!droppedImage) return;

        const assetId = Date.now();
        let finalUrl = droppedImage;

        // If saved to folder/library or even if just added, we want to store it physically
        try {
            const res = await fetch('/api/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: assetId.toString(),
                    url: droppedImage,
                    metadata: { tags, folderId, brandId }
                })
            });
            const data = await res.json();
            if (data.url) finalUrl = data.url;
        } catch (e) {
            console.error("Failed to upload dropped image to server", e);
        }

        if (folderId) {
            const updatedFolders = assetFolders.map(f => {
                if (f.id === folderId) {
                    return { ...f, assets: [{ id: assetId, url: finalUrl, tags, brandId }, ...f.assets] };
                }
                return f;
            });
            setAssetFolders(updatedFolders);
        }

        addImage(finalUrl);
        setDroppedImage(null);
    };

    return (
        <main
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex h-screen flex-col overflow-hidden text-[#1a1c1e] transition-colors ${theme} relative`}
        >
            <ResizeDialog isOpen={isResizeOpen} onClose={() => setIsResizeOpen(false)} />
            <DropAssetDialog
                isOpen={!!droppedImage}
                onClose={() => setDroppedImage(null)}
                dataUrl={droppedImage}
                onConfirm={handleConfirmDrop}
            />
            <ContextMenu />

            {/* Drag Overlay Feedback */}
            {isHoveringFile && (
                <div className="absolute inset-0 z-[500] bg-blue-600/10 backdrop-blur-sm border-4 border-dashed border-blue-500/50 flex items-center justify-center pointer-events-none">
                    <div className="bg-[#1a1c22] rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                            <ImageIcon className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Drop to add asset</h2>
                    </div>
                </div>
            )}

            {/* Top Navbar */}
            <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#181a20] px-4 shadow-sm z-[1000]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="App Logo" className="h-8 w-8 object-contain rounded-xl shadow-lg" />
                        <h1 className="text-sm font-black uppercase tracking-widest text-white">CanvasCrafter</h1>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex gap-1">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-white/10" />

                    <button
                        onClick={() => setIsResizeOpen(true)}
                        className="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-colors border border-white/5"
                    >
                        {canvasSize.width} × {canvasSize.height}
                    </button>

                    <div className="h-4 w-px bg-white/10" />

                    <button
                        onClick={() => {
                            if (confirm("Create a new canvas? This will discard any unsaved edits.")) {
                                clearCanvas();
                            }
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors border border-red-500/20"
                    >
                        <Plus className="h-3 w-3" />
                        New Canvas
                    </button>

                    <div className="h-4 w-px bg-white/10" />

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={canvasName}
                            onChange={(e) => setCanvasName(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white focus:outline-none border-b border-transparent hover:border-white/20 focus:border-blue-500 transition-all w-48 px-1 py-0.5"
                            placeholder="PROJECT TITLE"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#1e2229] p-2 shadow-2xl border border-white/10 z-[1001] animate-in slide-in-from-top-2">
                                <ExportOption icon={<ImageIcon className="h-4 w-4" />} label="PNG" sub="Best for complex images" onClick={() => exportAsFormat('png')} />
                                <ExportOption icon={<ImageIcon className="h-4 w-4" />} label="JPEG" sub="Best for sharing" onClick={() => exportAsFormat('jpeg')} />
                                <div className="h-px w-full bg-white/5 my-1" />
                                <ExportOption icon={<FileDown className="h-4 w-4" />} label="PDF" sub="Standard document" onClick={() => exportAsFormat('pdf')} />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar Menu */}
                <nav className="flex w-20 flex-col items-center border-r border-white/5 bg-[#181a20] py-6 z-40">
                    <SidebarNavItem icon={<LayersIcon className="h-5 w-5" />} label="Templates" active={activeTab === "templates"} onClick={() => setActiveTab("templates")} />
                    <SidebarNavItem icon={<Palette className="h-5 w-5" />} label="Brands" active={activeTab === "brands"} onClick={() => setActiveTab("brands")} />
                    <SidebarNavItem icon={<Type className="h-5 w-5" />} label="Text" active={activeTab === "text"} onClick={() => setActiveTab("text")} />
                    <SidebarNavItem icon={<ImageIcon className="h-5 w-5" />} label="Assets" active={activeTab === "assets"} onClick={() => setActiveTab("assets")} />
                    <SidebarNavItem icon={<Shapes className="h-5 w-5" />} label="Shapes" active={activeTab === "shapes"} onClick={() => setActiveTab("shapes")} />

                    <div className="w-8 h-px bg-white/5 my-4" />
                    <SidebarNavItem icon={<LayersIcon className="h-5 w-5" />} label="Layers" active={activeTab === "layers"} onClick={() => setActiveTab("layers")} />
                </nav>

                {/* Secondary Sidebar (Tab Content) */}
                <aside className="w-80 border-r border-white/5 bg-[#181a20] z-30 shadow-2xl flex flex-col h-full">
                    {activeTab === "templates" && <TemplatePanel />}
                    {activeTab === "brands" && <BrandPanel />}

                    {activeTab === "text" && (
                        <div className="flex h-full flex-col">
                            <div className="p-6">
                                <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Typography</h2>
                                <button
                                    onClick={addText}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 p-4 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
                                >
                                    <Type className="h-4 w-4" />
                                    Add Text Box
                                </button>
                            </div>
                            <div className="h-px w-full bg-white/5" />
                            <div className="flex-1 overflow-y-auto">
                                <FontUploader />
                            </div>
                        </div>
                    )}

                    {activeTab === "assets" && <AssetPanel />}

                    {activeTab === "shapes" && (
                        <div className="flex h-full flex-col p-6">
                            <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Basic Shapes</h2>
                            <div className="grid grid-cols-3 gap-3">
                                <ToolButton icon={<Square className="h-6 w-6" />} label="Rect" onClick={addRect} />
                                <ToolButton icon={<CircleIcon className="h-6 w-6" />} label="Circle" onClick={addCircle} />
                                <ToolButton icon={<Triangle className="h-6 w-6" />} label="Triangle" onClick={addTriangle} />
                                <ToolButton icon={<Hexagon className="h-6 w-6" />} label="Hexagon" onClick={addHexagon} />
                                <ToolButton icon={<Diamond className="h-6 w-6" />} label="Diamond" onClick={addDiamond} />
                                <ToolButton icon={<ArrowRight className="h-6 w-6" />} label="Arrow" onClick={addArrow} />
                                <ToolButton icon={<Star className="h-6 w-6" />} label="Star" onClick={() => addStar(5)} />
                                <ToolButton icon={<Shapes className="h-6 w-6" />} label="Polygon" onClick={() => addPolygon(6)} />
                                <ToolButton icon={<BadgeIcon className="h-6 w-6" />} label="Badge" onClick={addBadge} />
                                <ToolButton icon={<Cloud className="h-6 w-6" />} label="Cloud" onClick={addCloud} />
                                <ToolButton icon={<Heart className="h-6 w-6" />} label="Heart" onClick={addHeart} />
                            </div>
                        </div>
                    )}

                    {activeTab === "layers" && <LayersPanel />}
                </aside>

                {/* Main Canvas Area */}
                <section className="relative flex flex-1 flex-col overflow-hidden bg-[#12141a]">
                    {/* Centred Canvas Container */}
                    <div className="flex-1 overflow-auto relative flex items-center justify-center p-20 scrollbar-hide">
                        <div
                            className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-shadow duration-300"
                            style={{
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
                            }}
                        >
                            <FabricCanvas />
                        </div>
                    </div>

                    {/* Zoom / View Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e2229]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-40 h-12">
                        <button
                            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${showGrid ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-white/5 text-gray-400'}`}
                            onClick={() => setShowGrid(!showGrid)}
                            title="Toggle Grid"
                        >
                            <LayersIcon className="h-3.5 w-3.5" />
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 transition-colors"
                            onClick={() => setZoom(Math.max(10, zoom - 10))}
                        >
                            <span className="text-sm font-black">-</span>
                        </button>
                        <span className="w-12 text-center text-[10px] font-black tracking-widest text-white">
                            {Math.round(zoom)}%
                        </span>
                        <button
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 transition-colors"
                            onClick={() => setZoom(Math.min(500, zoom + 10))}
                        >
                            <span className="text-sm font-black">+</span>
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button
                            className="px-3 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-gray-400 text-[9px] font-black tracking-widest uppercase transition-colors"
                            onClick={fitToScreen}
                        >
                            Fit
                        </button>
                    </div>

                    {/* Right Properties Sidebar (Overlay) */}
                    <aside
                        className={`absolute right-0 top-0 h-full w-80 border-l border-white/5 bg-[#181a20]/95 backdrop-blur-2xl z-[60] transition-all duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.3)]
                            ${selectedObject ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
                    >
                        {/* Pinned Toolbar - To the left of the panel */}
                        <div className="absolute right-full top-6 translate-x-3 pointer-events-auto">
                            <Toolbar />
                        </div>
                        <PropertiesPanel />
                    </aside>
                </section>
            </div>
        </main>
    );
}

export default function Editor() {
    return (
        <CanvasProvider>
            <EditorContent />
        </CanvasProvider>
    );
}

function SidebarNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; }) {
    return (
        <button
            onClick={onClick}
            className={`group relative mb-4 flex w-16 flex-col items-center justify-center gap-2 py-3 transition-all
        ${active ? 'text-blue-500' : 'text-gray-600 hover:text-gray-400'}`}
        >
            <div className={`transition-transform duration-300 ${active ? 'scale-110 translate-x-1' : 'group-hover:scale-110 group-active:scale-95'}`}>
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
            {active && <div className="absolute left-0 h-10 w-1.5 rounded-r-full bg-blue-500 shadow-[2px_0_15px_rgba(59,130,246,0.6)]" />}
        </button>
    );
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 hover:-translate-y-1 active:scale-95 group shadow-lg"
        >
            <div className="text-blue-500 transition-transform duration-500 group-hover:rotate-[360deg] scale-110">
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-200">{label}</span>
        </button>
    );
}

function ExportOption({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all hover:bg-white/5 active:scale-95">
            <div className="rounded-xl bg-[#181a20] p-2.5 text-gray-500 group-hover:text-blue-500 group-hover:bg-[#252831] border border-white/5 transition-all">{icon}</div>
            <div>
                <p className="text-xs font-black text-gray-200 group-hover:text-blue-400 transition-colors">{label}</p>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{sub}</p>
            </div>
        </button>
    );
}
