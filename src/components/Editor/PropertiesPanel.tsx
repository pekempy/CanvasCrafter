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
import * as fabric from "fabric";

export default function PropertiesPanel() {
    const {
        selectedObject, deleteSelected, bringToFront, sendToBack,
        updateSelectedObject, clearEffects, updateMaskProperties, releaseMask
    } = useCanvas();

    if (!selectedObject) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#181a20]">
                <div className="mb-6 rounded-3xl bg-white/5 p-6 border border-white/5">
                    <Settings2 className="h-10 w-10 text-gray-700" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Inspector</h3>
                <p className="mt-2 text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-tighter">
                    Select an element on the canvas<br />to edit its properties
                </p>
            </div>
        );
    }

    const isText = selectedObject instanceof fabric.IText;

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
                {/* Appearance Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Appearance</p>
                    <div className="space-y-4">
                        <GradientPicker inline />

                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black uppercase text-gray-400">Fill Colour</span>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-xl border border-white/10 relative overflow-hidden group">
                                    <input
                                        type="color"
                                        value={typeof selectedObject.fill === 'string' ? selectedObject.fill : "#3b82f6"}
                                        onChange={(e) => updateSelectedObject({ fill: e.target.value })}
                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                                    />
                                    <div className="h-full w-full" style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : 'transparent' }} />
                                    {typeof selectedObject.fill !== 'string' && <div className="h-full w-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500" />}
                                </div>
                            </div>
                        </div>

                        <BrandColorPicker
                            currentColor={typeof selectedObject.fill === 'string' ? selectedObject.fill : ""}
                            onChange={(color) => updateSelectedObject({ fill: color })}
                        />

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
                                <span className="text-[9px] font-black text-blue-500 w-8">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Transform Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Transform</p>
                    <div className="space-y-5 rounded-2xl bg-white/5 border border-white/5 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCw className="h-3.5 w-3.5 text-gray-500" />
                                <span className="text-[10px] font-black uppercase text-gray-400">Rotate</span>
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
                            <span className="text-[10px] font-black uppercase text-gray-400">Flip</span>
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

                {/* Text Tools if applicable */}
                {isText && (
                    <section>
                        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Typography</p>
                        <div className="space-y-4">
                            <div>
                                <FontPicker inline />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={Math.round((selectedObject as fabric.IText).fontSize)}
                                    onChange={(e) => updateSelectedObject({ fontSize: parseInt(e.target.value) })}
                                />
                                <span className="text-[10px] font-black text-gray-600">PX</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Stroke Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Stroke</p>
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                        <StrokePanel />
                    </div>
                </section>

                {/* Arrangement Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Arrangement</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={bringToFront}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-[10px] font-black uppercase text-gray-300 hover:bg-white/10 transition-all"
                        >
                            <MoveUp className="h-3.5 w-3.5" /> Forward
                        </button>
                        <button
                            onClick={sendToBack}
                            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-[10px] font-black uppercase text-gray-300 hover:bg-white/10 transition-all"
                        >
                            <MoveDown className="h-3.5 w-3.5" /> Backward
                        </button>
                    </div>
                </section>

                {/* Effects Section */}
                <section>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Filters & Effects</p>
                    <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                        <EffectsPanel inline />
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
