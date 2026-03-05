"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Trash2, Copy, MoveUp, MoveDown, Layers, RefreshCcw,
    FlipHorizontal, FlipVertical, RotateCw, Ghost,
    Type, Palette, Sparkles, ChevronRight, Settings2
} from "lucide-react";
import GradientPicker from "./GradientPicker";
import FontPicker from "./FontPicker";
import EffectsPanel from "./EffectsPanel";
import StrokePanel from "./StrokePanel";
import BrandColorPicker from "./BrandColorPicker";
import TypographyEffects from "./TypographyEffects";
import EdgeBorderPanel from "./EdgeBorderPanel";
import * as fabric from "fabric";
import CustomColorPicker from "./CustomColorPicker";

export default function PropertiesPanel() {
    const {
        selectedObject, deleteSelected, bringToFront, sendToBack,
        updateSelectedObject, clearEffects, updateMaskProperties, releaseMask,
        canvasName, setCanvasName, canvasSize, setIsResizeOpen, showGrid, setShowGrid,
        canvas,
        isDrawingMode, setIsDrawingMode, brushSize, setBrushSize, brushColor, setBrushColor,
        brushSmoothing, setBrushSmoothing
    } = useCanvas() as any;

    if (!selectedObject) return null;

    const isText = !!selectedObject && (
        selectedObject.type === 'text' ||
        selectedObject.type === 'i-text' ||
        selectedObject.type === 'textbox' ||
        selectedObject instanceof fabric.IText ||
        selectedObject instanceof fabric.Textbox
    );
    const isEdgeBorderGroup = !!selectedObject && (selectedObject as any).isEdgeBorderGroup;
    const checkIsImage = (obj: any) => {
        return obj && (
            obj.type === 'image' ||
            obj.type === 'FabricImage' ||
            obj.isEdgeBorderGroup ||
            obj instanceof fabric.Image
        );
    };
    const isImage = checkIsImage(selectedObject);
    const isMultiImage = selectedObject?.type === 'activeSelection' &&
        (selectedObject as any)._objects?.every((obj: any) => checkIsImage(obj));

    const hideFillStroke = isImage || isMultiImage;

    return (
        <div className="flex h-full w-full flex-col bg-[#181a20] border-l border-white/5 overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-[#1e2229]">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Properties</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearEffects}
                        title="Clear Effects & Masks"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={deleteSelected}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Text Specific Tools */}
                {isText && (
                    <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                <Sparkles className="h-3 w-3" /> Text FX & Styling
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <FontPicker inline />
                                </div>

                                <div className="bg-white/2 p-3 rounded-2xl border border-white/5 flex items-center justify-between group transition-all hover:bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                            <Type className="h-3 w-3" />
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Font Size</span>
                                    </div>
                                    <div className="flex items-center bg-[#0a0a0c] rounded-xl border border-white/5 pr-1 focus-within:border-blue-500/30 transition-all">
                                        <input
                                            type="number"
                                            className="bg-transparent border-none outline-none text-right text-[11px] font-black text-white w-12 py-1.5 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={Math.round((selectedObject as any).fontSize || 40)}
                                            onChange={(e) => updateSelectedObject({ fontSize: parseInt(e.target.value) || 1 })}
                                        />
                                        <span className="text-[8px] font-black text-gray-600 uppercase pr-2">PX</span>
                                    </div>
                                </div>
                            </div>
                            <TypographyEffects />
                        </div>
                    </section>
                )}

                {/* Appearance Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Palette className="h-3 w-3" /> Appearance
                    </p>
                    <div className="space-y-4">
                        {!hideFillStroke && (
                            <>
                                <GradientPicker inline />
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Fixed Colour</span>
                                    <div className="flex items-center gap-2">
                                        <CustomColorPicker
                                            color={typeof selectedObject.fill === 'string' ? selectedObject.fill : "#3b82f6"}
                                            onChange={(color) => updateSelectedObject({ fill: color })}
                                        />
                                    </div>
                                </div>
                                <BrandColorPicker
                                    currentColor={typeof selectedObject.fill === 'string' ? selectedObject.fill : ""}
                                    onChange={(color) => updateSelectedObject({ fill: color })}
                                />
                            </>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Ghost className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-[10px] font-black uppercase text-gray-400">Opacity</span>
                            </div>
                            <div className="flex flex-1 max-w-[120px] items-center gap-3">
                                <input
                                    type="range"
                                    min={0} max={1} step={0.01}
                                    value={selectedObject.opacity || 1}
                                    onChange={(e) => updateSelectedObject({ opacity: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-[9px] font-black text-blue-500 w-8">
                                    {Math.round((selectedObject.opacity || 1) * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Edge Border Section */}
                {isEdgeBorderGroup && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8b5cf6]">
                            <Sparkles className="h-3 w-3" /> Edge detect border
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <EdgeBorderPanel />
                        </div>
                    </div>
                )}

                {/* Image Section */}
                {isImage && (
                    <section className="animate-in fade-in zoom-in-95 duration-300">
                        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> Image Adjustments
                        </p>
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                            <EffectsPanel inline />
                        </div>
                    </section>
                )}

                {/* Transform Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Geometry</p>
                    <div className="space-y-4 rounded-2xl bg-white/5 border border-white/5 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCw className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-[10px] font-black uppercase text-gray-400">Rotation</span>
                            </div>
                            <div className="flex flex-1 max-w-[120px] items-center gap-3">
                                <input
                                    type="range"
                                    min={0} max={360}
                                    value={selectedObject.angle || 0}
                                    onChange={(e) => updateSelectedObject({ angle: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-[9px] font-black text-blue-500 w-8">{Math.round(selectedObject.angle || 0)}°</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-gray-400">Mirror</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => updateSelectedObject({ flipX: !selectedObject.flipX })}
                                    className={`rounded-xl p-2.5 transition-all ${selectedObject.flipX ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/5 hover:text-white'}`}
                                >
                                    <FlipHorizontal className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateSelectedObject({ flipY: !selectedObject.flipY })}
                                    className={`rounded-xl p-2.5 transition-all ${selectedObject.flipY ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/5 hover:text-white'}`}
                                >
                                    <FlipVertical className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stroke Section for Non-images */}
                {!hideFillStroke && (
                    <section>
                        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Outlines</p>
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                            <StrokePanel />
                        </div>
                    </section>
                )}

                {/* Common Effects (Shadow) for all if not managed elsewhere */}
                {!hideFillStroke && (
                    <section>
                        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Shadow Effects</p>
                        <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                            <EffectsPanel inline />
                        </div>
                    </section>
                )}

                {/* Arrangement Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Order</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={bringToFront}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-[10px] font-black uppercase text-gray-300 hover:bg-white/10 transition-all border border-white/5"
                        >
                            <MoveUp className="h-3.5 w-3.5" /> Over
                        </button>
                        <button
                            onClick={sendToBack}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-[10px] font-black uppercase text-gray-300 hover:bg-white/10 transition-all border border-white/5"
                        >
                            <MoveDown className="h-3.5 w-3.5" /> Under
                        </button>
                    </div>
                </section>

                {/* Mask Controls */}
                {selectedObject.clipPath && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Mask Editor</p>
                            <button
                                onClick={releaseMask}
                                className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                            >
                                Release
                            </button>
                        </div>
                        <div className="space-y-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 p-5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Mask Scale</label>
                                <input
                                    type="range"
                                    min={0.1} max={3} step={0.01}
                                    value={selectedObject.clipPath.scaleX || 1}
                                    onChange={(e) => updateMaskProperties({ scaleX: parseFloat(e.target.value), scaleY: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Pos X</label>
                                    <input
                                        type="range"
                                        min={-300} max={300} step={1}
                                        value={selectedObject.clipPath.left || 0}
                                        onChange={(e) => updateMaskProperties({ left: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Pos Y</label>
                                    <input
                                        type="range"
                                        min={-300} max={300} step={1}
                                        value={selectedObject.clipPath.top || 0}
                                        onChange={(e) => updateMaskProperties({ top: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
