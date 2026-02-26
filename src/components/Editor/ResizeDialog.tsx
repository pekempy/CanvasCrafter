"use client";

import { useState } from "react";
import { useCanvas } from "@/store/useCanvasStore";
import { X, Monitor, Facebook, Instagram, Twitter, Cloud } from "lucide-react";

const PRESETS = [
    { name: "Instagram", width: 1080, height: 1080, icon: <Instagram className="h-4 w-4" /> },
    { name: "Facebook", width: 1200, height: 630, icon: <Facebook className="h-4 w-4" /> },
    { name: "Twitter / X", width: 1600, height: 900, icon: <Twitter className="h-4 w-4" /> },
    { name: "Website Hero", width: 1920, height: 1080, icon: <Monitor className="h-4 w-4" /> },
    { name: "Template 1", width: 800, height: 800, icon: <Cloud className="h-4 w-4" /> },
    { name: "Template 2", width: 400, height: 400, icon: <Cloud className="h-4 w-4" /> },
    { name: "Template 3", width: 600, height: 600, icon: <Cloud className="h-4 w-4" /> },
    { name: "Template 4", width: 256, height: 256, icon: <Cloud className="h-4 w-4" /> },
    { name: "Template 5", width: 100, height: 100, icon: <Cloud className="h-4 w-4" /> },
];

export default function ResizeDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { canvasSize, setCanvasSize, canvas } = useCanvas();
    const [width, setWidth] = useState(canvasSize.width);
    const [height, setHeight] = useState(canvasSize.height);
    const [smartScale, setSmartScale] = useState(true);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (smartScale && canvas) {
            const scaleX = width / canvasSize.width;
            const scaleY = height / canvasSize.height;
            canvas.getObjects().forEach(obj => {
                obj.set({
                    left: (obj.left || 0) * scaleX,
                    top: (obj.top || 0) * scaleY,
                    scaleX: (obj.scaleX || 1) * scaleX,
                    scaleY: (obj.scaleY || 1) * scaleY
                });
                obj.setCoords();
            });
            canvas.renderAll();
        }

        setCanvasSize({ width, height });
        onClose();
    };

    const applyPreset = (w: number, h: number) => {
        setWidth(w);
        setHeight(h);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-xl rounded-[2rem] bg-[#181a20] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-white">RESIZE CANVAS</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Adjust dimensions or pick a preset</p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-gray-400 transition-all active:scale-95">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Presets Side */}
                    <div className="flex flex-col max-h-[400px]">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-1">Popular Sizes</h3>
                        <div className="space-y-2 overflow-y-auto pr-2 scrollbar-hide">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyPreset(preset.width, preset.height)}
                                    className={`flex w-full items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] group
                                        ${width === preset.width && height === preset.height
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-500'
                                            : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors ${width === preset.width && height === preset.height ? 'bg-blue-500 text-white' : 'bg-[#1e2229] group-hover:bg-blue-500/20'}`}>
                                            {preset.icon}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-tight">{preset.name}</p>
                                            <p className="text-[9px] font-bold opacity-60 tracking-tighter">{preset.width} × {preset.height} px</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 opacity-30" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form Side */}
                    <form onSubmit={handleSubmit} className="flex flex-col justify-between">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Custom Dimensions</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-tight text-gray-600">Width (pixels)</label>
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                                        className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-lg font-black text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-tight text-gray-600">Height (pixels)</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                                        className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-lg font-black text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                <button
                                    type="button"
                                    onClick={() => setSmartScale(!smartScale)}
                                    className={`w-10 h-5 rounded-full relative transition-all ${smartScale ? 'bg-blue-600' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-all ${smartScale ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-tight text-white leading-none">Smart Resize</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Scale content proportionally</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-12">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] rounded-2xl bg-blue-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95"
                            >
                                Resize Canvas
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
