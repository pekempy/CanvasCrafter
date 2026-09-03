"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Move, Maximize2 } from "lucide-react";
import { useCanvas } from "@/store/useCanvasStore";

export default function SmartResizeDialog({
    isOpen,
    onClose,
}: { isOpen: boolean; onClose: () => void }) {
    const { selectedObject, smartResizeSelected } = useCanvas();

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (isOpen && selectedObject) {
            const w = Math.round(selectedObject.getScaledWidth ? selectedObject.getScaledWidth() : (selectedObject as any).width || 0);
            const h = Math.round(selectedObject.getScaledHeight ? selectedObject.getScaledHeight() : (selectedObject as any).height || 0);
            setWidth(w);
            setHeight(h);
        }
    }, [isOpen, selectedObject]);

    if (!isOpen || !selectedObject) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        smartResizeSelected(width, height);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-lg bg-[1d222a] border border-line p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-gold/20 flex items-center justify-center text-gold">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-normal text-white">
                                Smart Resize
                            </h2>
                            <p className="text-[10px] text-text-mute font-bold uppercase tracking-tight">Preserve Aspect Ratio</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-text-dim transition-all active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-semibold text-text-mute uppercase px-1">Width (px)</label>
                            <div className="relative">
                                <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute" />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={width}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setWidth(parseInt(val) || 0);
                                    }}
                                    className="w-full rounded-md border border-line bg-white/5 p-4 pl-12 text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-semibold text-text-mute uppercase px-1">Height (px)</label>
                            <div className="relative">
                                <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute rotate-90" />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={height}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setHeight(parseInt(val) || 0);
                                    }}
                                    className="w-full rounded-md border border-line bg-white/5 p-4 pl-12 text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-md bg-gold/5 border border-gold/10">
                        <p className="text-[9px] font-bold text-gold leading-relaxed uppercase tracking-tight">
                            Entering 0 in one field will automatically calculate its value based on the other's dimension to maintain perfect proportions.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md px-6 py-4 text-[10px] font-semibold uppercase tracking-normal text-text-mute hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] rounded-md bg-gold px-6 py-4 text-[10px] font-semibold uppercase tracking-normal text-white shadow-xl shadow-gold/20 hover:bg-gold active:scale-95 transition-all"
                        >
                            Apply Transform
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
