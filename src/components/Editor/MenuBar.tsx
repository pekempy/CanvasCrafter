"use client";

import { useState, useRef, useEffect } from "react";
import {
    ChevronDown,
    File,
    Edit2,
    Plus,
    Download,
    Monitor,
    Type,
    Shapes,
    Image as ImageIcon,
    Undo2,
    Redo2,
    Trash2,
    Grid,
    Maximize,
    Settings2,
    HelpCircle,
    ChevronRight,
    Search,
    Save,
    FolderOpen,
    ArrowRight,
    Check
} from "lucide-react";
import { useCanvas } from "@/store/useCanvasStore";

interface MenuBarProps {
    setActiveTab: (tab: any) => void;
}

type MenuItemType = {
    id: string;
    label?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    shortcut?: string;
    type?: "divider";
    submenu?: { id: string; label: string; onClick: () => void }[];
    disabled?: boolean;
    checked?: boolean;
};

interface MenuType {
    id: string;
    label: string;
    items: MenuItemType[];
}

export default function MenuBar({ setActiveTab }: MenuBarProps) {
    const {
        undo, redo, canUndo, canRedo,
        clearCanvas, addText, addRect, addCircle,
        addTriangle, addStar, addHexagon, addDiamond,
        addArrow, addPolygon, addBadge, addCloud, addHeart,
        showGrid, setShowGrid, fitToScreen,
        canvasSize, exportAsFormat,
        canvasName, setCanvasName,
        saveToTemplate, addImage,
        selectedObject, updateSelectedObject, clearEffects,
        setIsResizeOpen
    } = useCanvas();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSave = () => {
        saveToTemplate(canvasName);
        alert("Design saved successfully!");
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            addImage(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const menus: MenuType[] = [
        {
            id: "file",
            label: "File",
            items: [
                { id: "new", label: "New Canvas", icon: <Plus className="h-3.5 w-3.5" />, onClick: () => { if (confirm("Discard changes?")) clearCanvas(); } },
                { id: "divider1", type: "divider" },
                { id: "import", label: "Import File", icon: <FolderOpen className="h-3.5 w-3.5" />, onClick: handleImport },
                { id: "save", label: "Save Edit", icon: <Save className="h-3.5 w-3.5" />, onClick: handleSave },
                { id: "divider2", type: "divider" },
                { id: "canvas-size", label: "Canvas Size", icon: <Maximize className="h-3.5 w-3.5" />, onClick: () => setIsResizeOpen(true), shortcut: "S" },
                { id: "divider3", type: "divider" },
                {
                    id: "export",
                    label: "Export As",
                    icon: <Download className="h-3.5 w-3.5" />,
                    submenu: [
                        { id: "png", label: "PNG Image", onClick: () => exportAsFormat('png') },
                        { id: "jpeg", label: "JPEG Image", onClick: () => exportAsFormat('jpeg') },
                        { id: "pdf", label: "PDF Document", onClick: () => exportAsFormat('pdf') },
                    ]
                },
                { id: "divider4", type: "divider" },
                {
                    id: "logout", label: "Log Out", icon: <ArrowRight className="h-3.5 w-3.5 text-red-500" />, onClick: async () => {
                        if (confirm("Log out? Any unsaved work may be lost.")) {
                            await fetch('/api/auth/status', { method: 'DELETE' });
                            window.location.reload();
                        }
                    }
                }
            ]
        },
        {
            id: "edit",
            label: "Edit",
            items: [
                { id: "undo", label: "Undo", icon: <Undo2 className="h-3.5 w-3.5" />, onClick: undo, disabled: !canUndo, shortcut: "Ctrl+Z" },
                { id: "redo", label: "Redo", icon: <Redo2 className="h-3.5 w-3.5" />, onClick: redo, disabled: !canRedo, shortcut: "Ctrl+Y" },
                { id: "divider1", type: "divider" },
                { id: "clear", label: "Clear Canvas", icon: <Trash2 className="h-3.5 w-3.5 text-red-500" />, onClick: () => { if (confirm("Clear everything?")) clearCanvas(); } }
            ]
        },
        {
            id: "insert",
            label: "Insert",
            items: [
                { id: "text", label: "Text Layer", icon: <Type className="h-3.5 w-3.5" />, onClick: addText },
                {
                    id: "shapes", label: "Shapes", icon: <Shapes className="h-3.5 w-3.5" />, submenu: [
                        { id: "rect", label: "Rectangle", onClick: addRect },
                        { id: "circle", label: "Circle", onClick: addCircle },
                        { id: "triangle", label: "Triangle", onClick: () => addTriangle() },
                        { id: "star", label: "Star", onClick: () => addStar(5) },
                        { id: "hexagon", label: "Hexagon", onClick: () => addHexagon() },
                        { id: "diamond", label: "Diamond", onClick: () => addDiamond() },
                        { id: "arrow", label: "Arrow", onClick: () => addArrow() },
                        { id: "polygon", label: "Polygon", onClick: () => addPolygon(6) },
                        { id: "badge", label: "Badge", onClick: () => addBadge() },
                        { id: "cloud", label: "Cloud", onClick: () => addCloud() },
                        { id: "heart", label: "Heart", onClick: () => addHeart() },
                    ]
                },
                { id: "image", label: "Image Asset", icon: <ImageIcon className="h-3.5 w-3.5" />, onClick: () => setActiveTab("assets") }
            ]
        },
        {
            id: "view",
            label: "View",
            items: [
                { id: "grid", label: "Toggle Grid", icon: <Grid className="h-3.5 w-3.5" />, onClick: () => setShowGrid(!showGrid), checked: showGrid },
                { id: "fit", label: "Fit to Screen", icon: <Maximize className="h-3.5 w-3.5" />, onClick: fitToScreen },
            ]
        },
        {
            id: "tools",
            label: "Tools",
            items: [
                { id: "grid", label: "Show Canvas Grid", icon: <Grid className="h-3.5 w-3.5" />, onClick: () => setShowGrid(!showGrid), checked: showGrid },
                { id: "divider1", type: "divider" },
                { id: "flip-h", label: "Flip Horizontal", icon: <ChevronDown className="h-3.5 w-3.5 -rotate-90" />, onClick: () => selectedObject && updateSelectedObject({ flipX: !selectedObject.flipX }), disabled: !selectedObject },
                { id: "flip-v", label: "Flip Vertical", icon: <ChevronDown className="h-3.5 w-3.5" />, onClick: () => selectedObject && updateSelectedObject({ flipY: !selectedObject.flipY }), disabled: !selectedObject },
                { id: "divider2", type: "divider" },
                { id: "clear-effects", label: "Reset Effects", icon: <Settings2 className="h-3.5 w-3.5 text-rose-500" />, onClick: clearEffects, disabled: !selectedObject },
                { id: "divider3", type: "divider" },
                { id: "assets", label: "Assets Library", icon: <ImageIcon className="h-3.5 w-3.5 text-blue-500" />, onClick: () => setActiveTab("assets") },
            ]
        }
    ];

    return (
        <div ref={menuRef} className="flex items-center bg-[#0d0f14] h-12 border-b border-white/5 shadow-2xl select-none z-[1100] px-4 gap-8">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

            {/* Project Title & Status */}
            <div className="flex items-center gap-4 group shrink-0">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="p-2 bg-blue-500 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-105 active:scale-95">
                        <Monitor className="h-4 w-4 text-white" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ChevronRight className="h-3 w-3 text-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-gray-600 tracking-[0.2em] leading-none mb-1">Current Workspace</span>
                        <div className="relative group/input">
                            <input
                                type="text"
                                value={canvasName}
                                onChange={(e) => setCanvasName(e.target.value)}
                                className="bg-transparent text-[11px] font-black uppercase tracking-[0.1em] text-white/90 focus:text-white focus:outline-none w-auto min-w-[120px] max-w-[200px] border-none p-0 h-4 transition-all"
                                placeholder="Untitled Project"
                            />
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-500 group-hover/input:w-full opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex items-center gap-2">
                {menus.map((menu) => (
                    <div key={menu.id} className="relative">
                        <button
                            onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                            onMouseEnter={() => activeMenu && setActiveMenu(menu.id)}
                            className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-200
                                ${activeMenu === menu.id ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'}`}
                        >
                            {menu.label}
                        </button>

                        {activeMenu === menu.id && (
                            <div className="absolute left-0 top-full mt-2 w-64 bg-[#1e2229]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] py-2 z-[1200] animate-in fade-in slide-in-from-top-2 duration-200">
                                {menu.items.map((item, idx) => (
                                    item.type === "divider" ? (
                                        <div key={`divider-${idx}`} className="h-px bg-white/5 my-2 mx-4" />
                                    ) : (
                                        <MenuItem key={item.id} item={item} />
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1" />

            {/* Canvas Actions & Info */}
            <div className="flex items-center gap-6">
                <div className="flex items-center bg-white/5 rounded-xl border border-white/5 px-3 py-1.5 gap-3 shadow-inner">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-500 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black tracking-tighter">LIVE</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.1em]">
                        {canvasSize.width}x{canvasSize.height}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 hover:text-white transition-all border border-white/5 shadow-sm">
                        <HelpCircle className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => exportAsFormat('png')}
                        className="flex items-center gap-3 px-6 h-10 bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        Export Design
                    </button>
                </div>
            </div>
        </div>
    );
}

function MenuItem({ item }: { item: any }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                onClick={item.submenu ? undefined : item.onClick}
                disabled={item.disabled}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-medium transition-all
                    ${item.disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-600/20 hover:text-blue-400'} 
                    ${isHovered && item.submenu ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'}`}
            >
                <div className="flex items-center gap-2">
                    <span className="w-4 flex items-center justify-center opacity-70">
                        {item.checked ? <Check className="h-3 w-3 text-blue-500" /> : item.icon}
                    </span>
                    <span className="uppercase tracking-wide">{item.label}</span>
                </div>
                {item.shortcut && <span className="text-[9px] text-gray-600 font-mono ml-4">{item.shortcut}</span>}
                {item.submenu && <ChevronRight className="h-3 w-3 opacity-50" />}
            </button>

            {isHovered && item.submenu && (
                <div className="absolute left-full top-0 ml-0.5 w-48 bg-[#1e2229] border border-white/10 rounded-xl shadow-2xl py-1 z-[1300] animate-in fade-in slide-in-from-left-1 duration-150">
                    {item.submenu.map((sub: any) => (
                        <button
                            key={sub.id}
                            onClick={sub.onClick}
                            className="flex w-full items-center px-4 py-1.5 text-[11px] font-medium text-gray-300 hover:bg-blue-600/20 hover:text-blue-400 transition-all uppercase tracking-wide"
                        >
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
