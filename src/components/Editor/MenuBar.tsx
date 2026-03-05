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
        <div ref={menuRef} className="flex items-center bg-[#181a20] h-10 border-b border-white/5 shadow-sm select-none z-[1100]">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-2 px-2 mr-2">
                    <div className="h-6 w-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Monitor className="h-3.5 w-3.5 text-white" />
                    </div>
                </div>
                {menus.map((menu) => (
                    <div key={menu.id} className="relative">
                        <button
                            onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                            onMouseEnter={() => activeMenu && setActiveMenu(menu.id)}
                            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200
                                ${activeMenu === menu.id ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                        >
                            {menu.label}
                        </button>

                        {activeMenu === menu.id && (
                            <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#1e2229]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-1.5 z-[1200] animate-in fade-in zoom-in-95 duration-150">
                                {menu.items.map((item, idx) => (
                                    item.type === "divider" ? (
                                        <div key={`divider-${idx}`} className="h-px bg-white/5 my-1.5 mx-3" />
                                    ) : (
                                        <MenuItem key={item.id} item={item} />
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1 px-4 flex justify-center">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-0.5 rounded-full border border-white/5">
                    <Edit2 className="h-2.5 w-2.5 text-gray-500" />
                    <input
                        type="text"
                        value={canvasName}
                        onChange={(e) => setCanvasName(e.target.value)}
                        className="bg-transparent text-[9px] font-black uppercase tracking-widest text-white focus:outline-none w-48 text-center leading-tight"
                        placeholder="UNTITLED PROJECT"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mr-2">
                    {canvasSize.width}x{canvasSize.height}
                </span>
                <HelpCircle className="h-4 w-4 text-gray-600 hover:text-gray-400 cursor-pointer" />
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
