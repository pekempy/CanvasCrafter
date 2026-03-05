"use client";

import { useState, useEffect } from "react";
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
    Cloud,
    LogOut,
    Pencil
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

type SidebarTab = "templates" | "assets" | "text" | "shapes" | "layers" | "brands" | "settings";

function EditorContent({ username }: { username?: string }) {
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
        canvasName, setCanvasName,
        setCurrentUser,
        isResizeOpen, setIsResizeOpen,
        isDrawingMode, setIsDrawingMode, brushSize, setBrushSize, brushColor, setBrushColor, brushSmoothing, setBrushSmoothing
    } = useCanvas();

    const [sidebarWidth, setSidebarWidth] = useState(256); // Default 64rem = 256px
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        document.title = canvasName ? `${canvasName} — CanvasCrafter` : 'CanvasCrafter';
    }, [canvasName]);

    useEffect(() => {
        if (username) {
            setCurrentUser(username);
        }
    }, [username, setCurrentUser]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsResizeOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsResizeOpen]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // Navigation bar is 56px (w-14). Subtract it from the total X position.
            const newWidth = e.clientX - 56;
            if (newWidth > 150 && newWidth < 500) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

    const updateActiveTab = (tab: SidebarTab) => {
        setActiveTab(tab);
        setIsDrawingMode(false);
    };

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
            <ResizeDialog />
            <DropAssetDialog
                isOpen={!!droppedImage}
                onClose={() => setDroppedImage(null)}
                dataUrl={droppedImage}
                onConfirm={handleConfirmDrop}
            />
            <ContextMenu />

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

            <MenuBar setActiveTab={setActiveTab} />
            <PropertyBar />

            <div className="flex flex-1 overflow-hidden relative">
                <nav className="flex w-14 flex-col items-center border-r border-white/5 bg-[#181a20] py-4 z-40">
                    <SidebarNavItem icon={<LayersIcon className="h-5 w-5" />} label="Templates" active={activeTab === "templates"} onClick={() => updateActiveTab("templates")} />
                    <SidebarNavItem icon={<Palette className="h-5 w-5" />} label="Brands" active={activeTab === "brands"} onClick={() => updateActiveTab("brands")} />
                    <SidebarNavItem icon={<Type className="h-5 w-5" />} label="Text" active={activeTab === "text"} onClick={() => updateActiveTab("text")} />
                    <SidebarNavItem icon={<ImageIcon className="h-5 w-5" />} label="Assets" active={activeTab === "assets"} onClick={() => updateActiveTab("assets")} />
                    <SidebarNavItem icon={<Shapes className="h-5 w-5" />} label="Shapes" active={activeTab === "shapes"} onClick={() => updateActiveTab("shapes")} />

                    <div className="w-8 h-px bg-white/5 my-4" />
                    <SidebarNavItem icon={<LayersIcon className="h-5 w-5" />} label="Layers" active={activeTab === "layers"} onClick={() => updateActiveTab("layers")} />
                    <div className="flex-1" />
                    <SidebarNavItem icon={<Settings2 className="h-5 w-5" />} label="Settings" active={activeTab === "settings"} onClick={() => updateActiveTab("settings")} />
                </nav>

                <aside
                    style={{ width: sidebarWidth }}
                    className="relative border-r border-white/5 bg-[#181a20] z-30 shadow-2xl flex flex-col h-full transition-[width] duration-0"
                >
                    <div
                        onMouseDown={startResizing}
                        className={`absolute -right-0.5 top-0 w-1 h-full cursor-col-resize z-50 transition-colors hover:bg-blue-500/50 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                    />
                    {activeTab === "templates" && <TemplatePanel />}
                    {activeTab === "brands" && <BrandPanel />}
                    {activeTab === "settings" && <SettingsPanel />}

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
                        <div className="flex h-full flex-col p-6 overflow-y-auto scrollbar-hide">
                            <h2 className="mb-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Freehand & Paths</h2>
                            <div className="grid grid-cols-3 gap-3 mb-10">
                                <button
                                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all active:scale-95 group
                                        ${isDrawingMode ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                                >
                                    <Pencil className={`h-5 w-5 ${isDrawingMode ? 'text-white' : 'text-blue-500'}`} />
                                    <span className={`text-[8px] font-black uppercase tracking-wider ${isDrawingMode ? 'text-white' : 'text-gray-500'}`}>Draw</span>
                                </button>
                            </div>

                            {/* Drawing Controls - Only visible when Drawing Mode is active */}
                            {isDrawingMode && (
                                <div className="mb-10 p-4 rounded-3xl bg-blue-600/5 border border-blue-500/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Size</p>
                                            <span className="text-[10px] font-black text-blue-500">{brushSize}px</span>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <input
                                                type="range"
                                                min="1" max="100"
                                                value={brushSize}
                                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Smooth</p>
                                            <span className="text-[10px] font-black text-blue-500">{brushSmoothing}</span>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <input
                                                type="range"
                                                min="1" max="50"
                                                value={brushSmoothing}
                                                onChange={(e) => setBrushSmoothing(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 px-1">Color</p>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#ffffff", "#000000"].map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setBrushColor(color)}
                                                        className={`w-full aspect-square rounded-lg border transition-all active:scale-90
                                                            ${brushColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                <div className="relative group col-span-2 flex items-center justify-center">
                                                    <CustomColorPicker
                                                        color={brushColor}
                                                        onChange={setBrushColor}
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="px-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <kbd className="h-4 px-1 bg-white/5 rounded text-[8px] font-black text-blue-500 border border-white/10">SHIFT</kbd>
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tight">Straight Lines</span>
                                        </div>
                                    </div>
                                </div>
                            )}

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

                <section className="relative flex flex-1 flex-col overflow-hidden bg-[#12141a]">
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

                    <aside
                        className={`absolute right-0 top-0 h-full w-64 border-l border-white/5 bg-[#181a20]/95 backdrop-blur-2xl z-[60] transition-all duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.3)]
                            ${selectedObject ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
                    >
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

export default function Editor({ username }: { username?: string }) {
    return (
        <CanvasProvider>
            <EditorContent username={username} />
        </CanvasProvider>
    );
}

function SidebarNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; }) {
    return (
        <button
            onClick={onClick}
            className={`group relative mb-2 flex w-12 flex-col items-center justify-center gap-1.5 py-2.5 transition-all
        ${active ? 'text-blue-500' : 'text-gray-600 hover:text-gray-400'}`}
        >
            <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}>
                {icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest leading-none opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
            {active && <div className="absolute left-0 h-8 w-1 rounded-r-full bg-blue-500 shadow-[2px_0_15px_rgba(59,130,246,0.6)]" />}
        </button>
    );
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#1e2229] p-4 transition-all hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 group shadow-md"
        >
            <div className="text-blue-500 transition-transform duration-300 group-hover:scale-110">
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 group-hover:text-gray-300 transition-colors">{label}</span>
        </button>
    );
}
