"use client";

import { useState, useRef, useEffect } from "react";
import {
    ChevronRight,
    Undo2,
    Redo2,
    Trash2,
    Plus,
    Save,
    FolderOpen,
    Maximize,
    Download,
    Type,
    Shapes,
    Image as ImageIcon,
    Grid,
    LogOut,
    HelpCircle,
    Check,
} from "lucide-react";
import { useCanvas } from "@/store/useCanvasStore";
import HelpDialog from "./HelpDialog";

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
        canvasSize, exportAsFormat, exportAllSizes, activeTemplate,
        canvasName, setCanvasName,
        saveToTemplate, addImage,
        selectedObject, updateSelectedObject, clearEffects,
        setIsResizeOpen, setIsHelpOpen,
    } = useCanvas() as any;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenu(null);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const handleSave = () => { saveToTemplate(canvasName); };
    const handleImport = () => fileInputRef.current?.click();
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => addImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const menus: MenuType[] = [
        {
            id: "file", label: "File",
            items: [
                { id: "new", label: "New canvas", icon: <Plus className="h-4 w-4" />, onClick: () => { if (confirm("Discard the current canvas?")) clearCanvas(); } },
                { id: "d1", type: "divider" },
                { id: "import", label: "Import image", icon: <FolderOpen className="h-4 w-4" />, onClick: handleImport },
                { id: "save", label: "Save to templates", icon: <Save className="h-4 w-4" />, onClick: handleSave },
                { id: "d2", type: "divider" },
                { id: "size", label: "Canvas size", icon: <Maximize className="h-4 w-4" />, onClick: () => setIsResizeOpen(true), shortcut: "S" },
                { id: "d3", type: "divider" },
                {
                    id: "export", label: "Export as", icon: <Download className="h-4 w-4" />,
                    submenu: [
                        { id: "png", label: "PNG image", onClick: () => exportAsFormat("png") },
                        { id: "jpeg", label: "JPEG image", onClick: () => exportAsFormat("jpeg") },
                        { id: "pdf", label: "PDF document", onClick: () => exportAsFormat("pdf") },
                        ...(activeTemplate ? [{ id: "all", label: "All sizes (PNG)", onClick: () => exportAllSizes() }] : []),
                    ],
                },
                { id: "d4", type: "divider" },
                {
                    id: "logout", label: "Log out", icon: <LogOut className="h-4 w-4" />, onClick: async () => {
                        if (confirm("Log out? Unsaved work may be lost.")) {
                            await fetch("/api/auth/status", { method: "DELETE" });
                            window.location.reload();
                        }
                    },
                },
            ],
        },
        {
            id: "edit", label: "Edit",
            items: [
                { id: "undo", label: "Undo", icon: <Undo2 className="h-4 w-4" />, onClick: undo, disabled: !canUndo, shortcut: "Ctrl+Z" },
                { id: "redo", label: "Redo", icon: <Redo2 className="h-4 w-4" />, onClick: redo, disabled: !canRedo, shortcut: "Ctrl+Y" },
                { id: "d1", type: "divider" },
                { id: "clear", label: "Clear canvas", icon: <Trash2 className="h-4 w-4" />, onClick: () => { if (confirm("Remove everything from the canvas?")) clearCanvas(); } },
            ],
        },
        {
            id: "insert", label: "Insert",
            items: [
                { id: "text", label: "Text box", icon: <Type className="h-4 w-4" />, onClick: addText },
                {
                    id: "shapes", label: "Shape", icon: <Shapes className="h-4 w-4" />,
                    submenu: [
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
                    ],
                },
                { id: "image", label: "Image from library", icon: <ImageIcon className="h-4 w-4" />, onClick: () => setActiveTab("assets") },
            ],
        },
        {
            id: "view", label: "View",
            items: [
                { id: "grid", label: "Grid", icon: <Grid className="h-4 w-4" />, onClick: () => setShowGrid(!showGrid), checked: showGrid },
                { id: "fit", label: "Fit to screen", icon: <Maximize className="h-4 w-4" />, onClick: fitToScreen },
                { id: "d1", type: "divider" },
                { id: "flip-h", label: "Flip horizontal", onClick: () => selectedObject && updateSelectedObject({ flipX: !selectedObject.flipX }), disabled: !selectedObject },
                { id: "flip-v", label: "Flip vertical", onClick: () => selectedObject && updateSelectedObject({ flipY: !selectedObject.flipY }), disabled: !selectedObject },
                { id: "reset-fx", label: "Reset effects on selection", onClick: clearEffects, disabled: !selectedObject },
            ],
        },
    ];

    return (
        <div ref={menuRef} className="flex h-11 shrink-0 items-center gap-1 border-b border-line bg-surface px-3 select-none z-[1100]">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

            {/* Wordmark */}
            <div className="flex items-center gap-2 pr-2">
                <span className="text-[15px] leading-none text-gold" style={{ fontFamily: "var(--font-display)" }}>CanvasCrafter</span>
            </div>

            <div className="mx-1 h-4 w-px bg-line" />

            {/* Menus */}
            <div className="flex items-center">
                {menus.map((menu) => (
                    <div key={menu.id} className="relative">
                        <button
                            onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                            onMouseEnter={() => activeMenu && setActiveMenu(menu.id)}
                            className={`rounded-sm px-2.5 py-1 text-[13px] transition-colors
                                ${activeMenu === menu.id ? "bg-surface-3 text-text" : "text-text-dim hover:bg-surface-2 hover:text-text"}`}
                        >
                            {menu.label}
                        </button>
                        {activeMenu === menu.id && (
                            <div className="menu absolute left-0 top-full mt-1 z-[1200]">
                                {menu.items.map((item, idx) =>
                                    item.type === "divider"
                                        ? <div key={`d${idx}`} className="menu-divider" />
                                        : <MenuItem key={item.id} item={item} onRun={() => setActiveMenu(null)} />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1" />

            {/* Doc name + size */}
            <button
                onClick={() => setIsResizeOpen(true)}
                className="flex items-center gap-2 rounded-sm border border-line bg-surface-2 px-2.5 py-1 text-[13px] hover:bg-surface-3 transition-colors"
                title="Change canvas size"
            >
                <input
                    value={canvasName}
                    onChange={(e) => setCanvasName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Untitled"
                    className="w-[120px] bg-transparent text-text focus:outline-none"
                    style={{ border: "none", padding: 0 }}
                />
                <span className="text-text-mute">·</span>
                <span className="tabular-nums text-text-dim">{canvasSize.width}×{canvasSize.height}</span>
            </button>

            <button onClick={() => setIsHelpOpen(true)} className="icon-btn" title="Help">
                <HelpCircle className="h-4 w-4" />
            </button>

            <button onClick={() => exportAsFormat("png")} className="btn btn-primary btn-sm">
                <Download className="h-3.5 w-3.5" /> Export
            </button>

            <HelpDialog />
        </div>
    );
}

function MenuItem({ item, onRun }: { item: any; onRun: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button
                onClick={item.submenu ? undefined : () => { item.onClick?.(); onRun(); }}
                disabled={item.disabled}
                className="menu-item"
            >
                <span className="flex h-4 w-4 items-center justify-center text-text-dim">
                    {item.checked ? <Check className="h-3.5 w-3.5 text-gold" /> : item.icon}
                </span>
                <span>{item.label}</span>
                {item.shortcut && <span className="k">{item.shortcut}</span>}
                {item.submenu && <ChevronRight className="ml-auto h-3.5 w-3.5 text-text-mute" />}
            </button>
            {open && item.submenu && (
                <div className="menu absolute left-full top-0 ml-1 z-[1300]" style={{ minWidth: 180 }}>
                    {item.submenu.map((sub: any) => (
                        <button key={sub.id} onClick={() => { sub.onClick(); onRun(); }} className="menu-item">
                            {sub.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
