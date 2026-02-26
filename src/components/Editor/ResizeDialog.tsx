"use client";

import { useState } from "react";
import { useCanvas } from "@/store/useCanvasStore";
import { X, Monitor, Facebook, Instagram, Twitter, Cloud, Trash2, Plus, ArrowRight } from "lucide-react";

const ICON_MAP: Record<string, any> = {
    instagram: <Instagram className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    monitor: <Monitor className="h-4 w-4" />,
    cloud: <Cloud className="h-4 w-4" />,
};

export default function ResizeDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { canvasSize, setCanvasSize, canvas, presets, setPresets } = useCanvas();
    const [width, setWidth] = useState(canvasSize.width);
    const [height, setHeight] = useState(canvasSize.height);
    const [smartScale, setSmartScale] = useState(true);
    const [newTemplateName, setNewTemplateName] = useState("");

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

    const applyPreset = (preset: { name: string; width: number; height: number }) => {
        setWidth(preset.width);
        setHeight(preset.height);
        setNewTemplateName(preset.name);
    };

    const saveAsTemplate = () => {
        if (!newTemplateName.trim()) return;

        const existingIndex = presets.findIndex(p => p.name.toLowerCase() === newTemplateName.toLowerCase());

        if (existingIndex > -1) {
            const updatedPresets = [...presets];
            updatedPresets[existingIndex] = { ...updatedPresets[existingIndex], width, height };
            setPresets(updatedPresets);
        } else {
            const newPreset = {
                id: Math.random().toString(36).substr(2, 9),
                name: newTemplateName,
                width,
                height,
                iconType: 'cloud'
            };
            setPresets([...presets, newPreset]);
        }
        setNewTemplateName("");
    };

    const deletePreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPresets(presets.filter(p => p.id !== id));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
            <div className="w-full max-w-2xl rounded-[2.5rem] bg-[#1a1c22] border border-white/5 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-white">RESIZE CANVAS</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Pick a preset or enter custom dimensions</p>
                    </div>
                    <button onClick={onClose} className="rounded-2xl p-3 bg-white/5 hover:bg-white/10 text-gray-400 transition-all active:scale-95">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Presets Side */}
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-1">Templates</h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {presets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset)}
                                    className={`flex w-full items-center justify-between p-3 rounded-[1.5rem] border transition-all active:scale-[0.98] group
                                        ${width === preset.width && height === preset.height && newTemplateName === preset.name
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-500'
                                            : 'bg-white/2 border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl transition-colors ${width === preset.width && height === preset.height && newTemplateName === preset.name ? 'bg-blue-500 text-white' : 'bg-[#252830] group-hover:bg-blue-500/20'}`}>
                                            {ICON_MAP[preset.iconType || 'cloud'] || <Cloud className="h-4 w-4" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-tight">{preset.name}</p>
                                            <p className="text-[9px] font-bold opacity-60 tracking-tighter">{preset.width} × {preset.height} px</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => deletePreset(preset.id, e)} className="p-2 hover:text-red-500 transition-colors">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                        <ArrowRight className="h-4 w-4 opacity-30" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="flex flex-col gap-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Custom Dimensions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-tight text-gray-500 pl-1">Width</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                                            className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-xl font-black text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 group-hover:bg-white/10"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">PX</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-tight text-gray-500 pl-1">Height</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                                            className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-xl font-black text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 group-hover:bg-white/10"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">PX</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setSmartScale(!smartScale)}
                                className="flex items-center gap-4 p-4 bg-white/2 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all group"
                            >
                                <div className={`w-10 h-6 rounded-full relative transition-all ${smartScale ? 'bg-blue-600' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${smartScale ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-tight text-white leading-none">Smart Resize</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">Keep composition intact</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                            >
                                Apply Dimensions
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>

                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Update or Save Template</h3>
                            <div className="space-y-2">
                                <div className="p-1.5 bg-white/5 rounded-2xl border border-white/5 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                                    <input
                                        type="text"
                                        placeholder="Template name..."
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none px-4 py-3 text-xs font-bold text-white placeholder:text-gray-600"
                                    />
                                </div>
                                <button
                                    onClick={saveAsTemplate}
                                    type="button"
                                    disabled={!newTemplateName.trim()}
                                    className="w-full p-4 bg-white/10 rounded-2xl hover:bg-blue-600 text-white transition-all disabled:opacity-30 disabled:hover:bg-white/10 flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {presets.some(p => p.name.toLowerCase() === newTemplateName.toLowerCase()) ? 'Update Existing Template' : 'Save As New Template'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
