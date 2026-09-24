"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Scissors, Copy, Clipboard, Trash2,
    ChevronUp, ChevronDown, Layers,
    Maximize2, Group, Ungroup, Save, Paintbrush
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import * as fabric from "fabric";

export default function ContextMenu() {
    const {
        canvas, selectedObject,
        cutSelected, copySelected, pasteSelected, deleteSelected,
        bringToFront, sendToBack, bringForward, sendBackwards, duplicateSelected,
        groupSelected, ungroupSelected,
        setSavingAssetUrl,
        copyStyle, pasteStyle, hasCopiedStyle
    } = useCanvas();

    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvas) return;

        const handleContextMenu = (opt: any) => {
            opt.e.preventDefault();
            opt.e.stopPropagation();

            if (opt.target) {
                const activeObjects = canvas.getActiveObjects();
                if (!activeObjects.includes(opt.target)) {
                    canvas.setActiveObject(opt.target);
                    canvas.requestRenderAll();
                }
            }

            setPosition({ x: opt.e.clientX, y: opt.e.clientY });
            setIsVisible(true);
        };

        const hideMenu = () => setIsVisible(false);

        const handleCustomContext = (e: any) => {
            if (e.detail) {
                setPosition({ x: e.detail.x, y: e.detail.y });
                setIsVisible(true);
            }
        };

        canvas.on("mouse:down", hideMenu);
        const canvasEl = canvas.getElement().parentElement;
        if (canvasEl) {
            canvasEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });
        }

        canvas.on("contextmenu", handleContextMenu);

        window.addEventListener("click", hideMenu);
        window.addEventListener("canvascrafter:contextmenu", handleCustomContext);
        window.addEventListener("contextmenu", (e) => {
            const isInsideEditor = (e.target as HTMLElement).closest(".canvas-container");
            if (isInsideEditor) e.preventDefault();
        });

        return () => {
            canvas.off("contextmenu", handleContextMenu);
            canvas.off("mouse:down", hideMenu);
            window.removeEventListener("click", hideMenu);
            window.removeEventListener("canvascrafter:contextmenu", handleCustomContext);
        };
    }, [canvas]);

    if (!isVisible) return null;

    const activeObj = canvas?.getActiveObject() || selectedObject;
    const isGroup = activeObj?.type === 'group';
    const isMultiSelect = (activeObj?.type || '').toLowerCase() === 'activeselection' ||
        activeObj instanceof fabric.ActiveSelection ||
        (canvas ? canvas.getActiveObjects().length > 1 : false);

    return (
        <div
            ref={menuRef}
            className="fixed z-[999] w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0c0e12]/98 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/40"
            style={{ top: position.y, left: position.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col gap-0.5">
                <ContextItem
                    icon={<Scissors className="h-3.5 w-3.5" />}
                    label="Cut"
                    shortcut="Ctrl+X"
                    onClick={() => { cutSelected(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<Copy className="h-3.5 w-3.5" />}
                    label="Copy"
                    shortcut="Ctrl+C"
                    onClick={() => { copySelected(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<Clipboard className="h-3.5 w-3.5" />}
                    label="Paste"
                    shortcut="Ctrl+V"
                    onClick={() => { pasteSelected(); setIsVisible(false); }}
                />
                <ContextItem
                    icon={<Maximize2 className="h-3.5 w-3.5" />}
                    label="Duplicate"
                    shortcut="Ctrl+D"
                    onClick={() => { duplicateSelected(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<Paintbrush className="h-3.5 w-3.5" />}
                    label="Copy Style"
                    shortcut="Ctrl+Alt+C"
                    onClick={() => { copyStyle(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<Paintbrush className="h-3.5 w-3.5" />}
                    label="Paste Style"
                    shortcut="Ctrl+Alt+V"
                    onClick={() => { pasteStyle(); setIsVisible(false); }}
                    disabled={!hasCopiedStyle || !selectedObject}
                />

                <div className="my-1 h-px bg-white/[0.08]" />

                {isMultiSelect && (
                    <>
                        <ContextItem
                            icon={<Group className="h-3.5 w-3.5" />}
                            label="Group"
                            shortcut="Ctrl+G"
                            onClick={() => { groupSelected(); setIsVisible(false); }}
                        />
                        <div className="my-1 h-px bg-white/[0.08]" />
                    </>
                )}

                {isGroup && (
                    <>
                        <ContextItem
                            icon={<Ungroup className="h-3.5 w-3.5" />}
                            label="Ungroup"
                            shortcut="Ctrl+Shift+G"
                            onClick={() => { ungroupSelected(); setIsVisible(false); }}
                        />
                        <div className="my-1 h-px bg-white/[0.08]" />
                    </>
                )}

                <ContextItem
                    icon={<ChevronUp className="h-3.5 w-3.5" />}
                    label="Bring Forward"
                    shortcut="]"
                    onClick={() => { bringForward(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<ChevronDown className="h-3.5 w-3.5" />}
                    label="Send Backward"
                    shortcut="["
                    onClick={() => { sendBackwards(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <div className="my-1 h-px bg-white/[0.08]" />
                <ContextItem
                    icon={<Layers className="h-3.5 w-3.5" />}
                    label="Bring to Front"
                    shortcut="Shift+]"
                    onClick={() => { bringToFront(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<Layers className="h-3.5 w-3.5 -scale-y-100" />}
                    label="Send to Back"
                    shortcut="Shift+["
                    onClick={() => { sendToBack(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />

                <div className="my-1 h-px bg-white/[0.08]" />

                <ContextItem
                    icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                    label="Delete"
                    shortcut="Del"
                    onClick={() => { deleteSelected(); setIsVisible(false); }}
                    disabled={!selectedObject}
                    className="text-red-400 hover:bg-red-500/10"
                />

                {selectedObject?.type === 'image' && (
                    <>
                        <div className="my-1 h-px bg-white/[0.08]" />
                        <ContextItem
                            icon={<Save className="h-3.5 w-3.5 text-gold" />}
                            label="Save to Assets"
                            onClick={() => {
                                const img = selectedObject as fabric.Image;
                                setSavingAssetUrl(img.getSrc());
                                setIsVisible(false);
                            }}
                            className="text-gold hover:bg-gold/10"
                        />
                    </>
                )}
            </div>
        </div>
    );
}

function ContextItem({
    icon, label, shortcut, onClick, disabled = false, className = ""
}: {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-normal transition-all
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white/80 hover:text-white'} ${className}`}
        >
            <div className="flex items-center gap-3">
                <span className="opacity-70">{icon}</span>
                {label}
            </div>
            {shortcut && <span className="text-[8px] font-bold text-text-mute ml-4">{shortcut}</span>}
        </button>
    );
}
