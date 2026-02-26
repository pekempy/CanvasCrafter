"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Scissors, Copy, Clipboard, Trash2,
    ChevronUp, ChevronDown, Layers,
    Maximize2, Group, Ungroup
} from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

export default function ContextMenu() {
    const {
        canvas, selectedObject,
        cutSelected, copySelected, pasteSelected, deleteSelected,
        bringToFront, sendToBack, duplicateSelected,
        groupSelected, ungroupSelected
    } = useCanvas();

    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvas) return;

        const handleContextMenu = (opt: any) => {
            opt.e.preventDefault();
            opt.e.stopPropagation();

            const isObject = !!opt.target;

            // If right clicked on nothing but there is an active selection, 
            // fabric might sometimes behave weirdly. 
            // We force a refresh if the target is null but something is active? 

            setPosition({ x: opt.e.clientX, y: opt.e.clientY });
            setIsVisible(true);
        };

        const hideMenu = () => setIsVisible(false);

        canvas.on("mouse:down", hideMenu);
        // We use the fabric 'contextmenu' event if available, or native
        const canvasEl = canvas.getElement().parentElement;
        if (canvasEl) {
            canvasEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                // If we right click, we should ideally let fabric handle the target if possible
                // but for now, simple native coords is fine.
            });
        }

        // Custom fabric event
        canvas.on("contextmenu", handleContextMenu);

        window.addEventListener("click", hideMenu);
        window.addEventListener("contextmenu", (e) => {
            // Prevent default global context menu in editor
            const isInsideEditor = (e.target as HTMLElement).closest(".canvas-container");
            if (isInsideEditor) e.preventDefault();
        });

        return () => {
            canvas.off("contextmenu", handleContextMenu);
            canvas.off("mouse:down", hideMenu);
            window.removeEventListener("click", hideMenu);
        };
    }, [canvas]);

    if (!isVisible) return null;

    const isGroup = selectedObject?.type === 'group';
    const isMultiSelect = selectedObject?.type === 'activeSelection';

    return (
        <div
            ref={menuRef}
            className="fixed z-[999] w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#181a20]/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
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

                <div className="my-1 h-px bg-white/5" />

                {(isMultiSelect || isGroup) && (
                    <>
                        <ContextItem
                            icon={isGroup ? <Ungroup className="h-3.5 w-3.5" /> : <Group className="h-3.5 w-3.5" />}
                            label={isGroup ? "Ungroup" : "Group"}
                            shortcut="Ctrl+G"
                            onClick={() => { isGroup ? ungroupSelected() : groupSelected(); setIsVisible(false); }}
                        />
                        <div className="my-1 h-px bg-white/5" />
                    </>
                )}

                <ContextItem
                    icon={<ChevronUp className="h-3.5 w-3.5" />}
                    label="Bring to Front"
                    shortcut="]"
                    onClick={() => { bringToFront(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />
                <ContextItem
                    icon={<ChevronDown className="h-3.5 w-3.5" />}
                    label="Send to Back"
                    shortcut="["
                    onClick={() => { sendToBack(); setIsVisible(false); }}
                    disabled={!selectedObject}
                />

                <div className="my-1 h-px bg-white/5" />

                <ContextItem
                    icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                    label="Delete"
                    shortcut="Del"
                    onClick={() => { deleteSelected(); setIsVisible(false); }}
                    disabled={!selectedObject}
                    className="text-red-400 hover:bg-red-500/10"
                />
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
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5 text-gray-300 hover:text-white'} ${className}`}
        >
            <div className="flex items-center gap-3">
                <span className="opacity-70">{icon}</span>
                {label}
            </div>
            {shortcut && <span className="text-[8px] font-bold text-gray-600 ml-4">{shortcut}</span>}
        </button>
    );
}
