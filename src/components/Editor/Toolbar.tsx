"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Crop, Check, X, Maximize2, Group, Ungroup, Scissors,
    AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
} from "lucide-react";
import * as fabric from "fabric";
import { useState } from "react";
import SmartResizeDialog from "./SmartResizeDialog";

/* Floating strip left of the canvas — structural operations that
   don't belong in the quick bar or the Properties panel. */

export default function Toolbar() {
    const {
        selectedObject, releaseMask,
        groupSelected, ungroupSelected, alignSelected,
        isCropMode, enterCropMode, confirmCrop, cancelCrop,
    } = useCanvas() as any;

    const [showResize, setShowResize] = useState(false);
    if (!selectedObject) return null;

    const o = selectedObject;
    const isImage = o.type === "image" || o.isEdgeBorderGroup || o instanceof fabric.Image;
    const isSelection = o.type === "activeSelection";
    const isGroup = o.type === "group";
    const hasMask = !!o.clipPath;

    return (
        <>
            <div className="flex flex-col gap-1 rounded-app border border-line bg-surface p-1 shadow-lg">
                <button className="icon-btn" onClick={() => setShowResize(true)} title="Smart resize to another format">
                    <Maximize2 className="h-4 w-4" />
                </button>

                {isImage && !isCropMode && (
                    <button className="icon-btn" onClick={enterCropMode} title="Crop image">
                        <Crop className="h-4 w-4" />
                    </button>
                )}
                {isCropMode && (
                    <>
                        <button className="icon-btn is-active" onClick={confirmCrop} title="Apply crop"><Check className="h-4 w-4" /></button>
                        <button className="icon-btn" onClick={cancelCrop} title="Cancel crop"><X className="h-4 w-4" /></button>
                    </>
                )}

                {hasMask && (
                    <button className="icon-btn" onClick={releaseMask} title="Release mask">
                        <Scissors className="h-4 w-4" />
                    </button>
                )}

                {isSelection && (
                    <button className="icon-btn" onClick={groupSelected} title="Group"><Group className="h-4 w-4" /></button>
                )}
                {isGroup && (
                    <button className="icon-btn" onClick={ungroupSelected} title="Ungroup"><Ungroup className="h-4 w-4" /></button>
                )}

                {isSelection && (
                    <>
                        <div className="mx-1 my-0.5 h-px bg-line" />
                        <button className="icon-btn" onClick={() => alignSelected("left")} title="Align left"><AlignHorizontalJustifyStart className="h-4 w-4" /></button>
                        <button className="icon-btn" onClick={() => alignSelected("center")} title="Align centre"><AlignHorizontalJustifyCenter className="h-4 w-4" /></button>
                        <button className="icon-btn" onClick={() => alignSelected("right")} title="Align right"><AlignHorizontalJustifyEnd className="h-4 w-4" /></button>
                    </>
                )}
            </div>

            <SmartResizeDialog isOpen={showResize} onClose={() => setShowResize(false)} />
        </>
    );
}
