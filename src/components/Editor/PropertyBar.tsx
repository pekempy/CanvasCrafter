"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Bold, Italic, AlignLeft, AlignCenter, AlignRight,
    FlipHorizontal, FlipVertical, ArrowUp, ArrowDown,
    Copy, Trash2, Type as TypeIcon, Image as ImageIcon, Square,
    Minus, Plus,
} from "lucide-react";
import * as fabric from "fabric";

/* Slim context strip above the canvas — quick actions only.
   Full styling (colour, stroke, effects, geometry) lives in the
   Properties panel on the right. */

export default function PropertyBar() {
    const {
        selectedObject, updateSelectedObject,
        duplicateSelected, deleteSelected,
        bringForward, sendBackwards,
    } = useCanvas() as any;

    if (!selectedObject) return null;

    const o = selectedObject;
    const isText =
        o.type === "text" || o.type === "i-text" || o.type === "textbox" ||
        o instanceof fabric.IText || o instanceof fabric.Textbox;
    const isImage = o.type === "image" || o.isEdgeBorderGroup || o instanceof fabric.Image;
    const kind = isText ? "Text" : isImage ? "Image" : o.type === "activeSelection" ? "Selection" : "Shape";
    const KindIcon = isText ? TypeIcon : isImage ? ImageIcon : Square;

    const set = (p: any) => updateSelectedObject(p);

    return (
        <div className="flex h-11 w-full shrink-0 items-center gap-3 overflow-x-auto border-b border-line bg-surface px-3 scrollbar-hide">
            <div className="flex items-center gap-2 pr-3">
                <KindIcon className="h-4 w-4 text-text-dim" />
                <span className="text-[13px] font-medium text-text">{kind}</span>
            </div>

            {isText && (
                <>
                    <div className="mx-1 h-4 w-px bg-line" />
                    <div className="seg">
                        <button className={o.fontWeight === "bold" ? "is-active" : ""} onClick={() => set({ fontWeight: o.fontWeight === "bold" ? "normal" : "bold" })} title="Bold">
                            <Bold className="h-4 w-4" />
                        </button>
                        <button className={o.fontStyle === "italic" ? "is-active" : ""} onClick={() => set({ fontStyle: o.fontStyle === "italic" ? "normal" : "italic" })} title="Italic">
                            <Italic className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="seg">
                        {(["left", "center", "right"] as const).map((a) => {
                            const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                            return (
                                <button key={a} className={o.textAlign === a ? "is-active" : ""} onClick={() => set({ textAlign: a })} title={`Align ${a}`}>
                                    <Icon className="h-4 w-4" />
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-1 rounded-sm border border-line bg-surface-2 px-1">
                        <button className="icon-btn h-7 w-7" onClick={() => set({ fontSize: Math.max(1, Math.round((o.fontSize || 40) - 2)) })}><Minus className="h-3.5 w-3.5" /></button>
                        <input
                            type="number"
                            value={Math.round(o.fontSize || 40)}
                            onChange={(e) => set({ fontSize: parseInt(e.target.value) || 1 })}
                            className="w-10 bg-transparent text-center text-[12px] font-medium text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ border: "none", padding: 0 }}
                        />
                        <button className="icon-btn h-7 w-7" onClick={() => set({ fontSize: Math.round((o.fontSize || 40) + 2) })}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                </>
            )}

            <div className="ml-auto flex items-center gap-1.5">
                <div className="seg">
                    <button onClick={() => set({ flipX: !o.flipX })} title="Flip horizontal"><FlipHorizontal className="h-4 w-4" /></button>
                    <button onClick={() => set({ flipY: !o.flipY })} title="Flip vertical"><FlipVertical className="h-4 w-4" /></button>
                </div>
                <div className="seg">
                    <button onClick={bringForward} title="Bring forward"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={sendBackwards} title="Send backward"><ArrowDown className="h-4 w-4" /></button>
                </div>
                <button className="icon-btn" onClick={duplicateSelected} title="Duplicate"><Copy className="h-4 w-4" /></button>
                <button className="icon-btn hover:text-danger" onClick={deleteSelected} title="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
        </div>
    );
}
