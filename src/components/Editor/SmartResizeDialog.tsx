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
            <div className="w-full max-w-sm rounded-3xl bg-[#1e2229] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">
                                Smart Resize
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Preserve Aspect Ratio</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-gray-400 transition-all active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase px-1">Width (px)</label>
                            <div className="relative">
                                <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type="number"
                                    value={width}
                                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 pl-12 text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase px-1">Height (px)</label>
                            <div className="relative">
                                <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 rotate-90" />
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 pl-12 text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[9px] font-bold text-blue-400 leading-relaxed uppercase tracking-tight">
                            Entering 0 in one field will automatically calculate its value based on the other's dimension to maintain perfect proportions.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] rounded-2xl bg-blue-600 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            Apply Transform
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
