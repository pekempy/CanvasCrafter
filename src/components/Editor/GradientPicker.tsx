"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Plus, X, Palette, Trash2, Heart, RotateCw, Ghost } from "lucide-react";
import { useState } from "react";
import * as fabric from "fabric";

const hexToRgba = (hex: string, opacity: number) => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function GradientPicker({ inline = false }: { inline?: boolean }) {
    const { selectedObject, updateSelectedObject, canvas } = useCanvas();
    const [stops, setStops] = useState([
        { offset: 0, color: "#3b82f6", opacity: 1 },
        { offset: 1, color: "#2dd4bf", opacity: 1 }
    ]);
    const [angle, setAngle] = useState(0);
    const [spread, setSpread] = useState(1);

    const applyGradient = (customStops = stops, customAngle = angle, customSpread = spread) => {
        if (!selectedObject || !canvas) return;

        const angleInRad = (customAngle * Math.PI) / 180;
        const radius = 50 * customSpread;

        // Calculate direction vectors based on angle and spread
        const x1 = Math.round(50 + Math.cos(angleInRad + Math.PI) * radius) / 100 * selectedObject.width;
        const y1 = Math.round(50 + Math.sin(angleInRad + Math.PI) * radius) / 100 * selectedObject.height;
        const x2 = Math.round(50 + Math.cos(angleInRad) * radius) / 100 * selectedObject.width;
        const y2 = Math.round(50 + Math.sin(angleInRad) * radius) / 100 * selectedObject.height;

        const gradient = new fabric.Gradient({
            type: 'linear',
            gradientUnits: 'pixels',
            coords: { x1, y1, x2, y2 },
            colorStops: customStops.map(s => ({
                offset: s.offset,
                color: hexToRgba(s.color, s.opacity ?? 1)
            }))
        });

        updateSelectedObject({ fill: gradient });
    };

    const addStop = () => {
        const newStops = [...stops];
        newStops.splice(newStops.length - 1, 0, { offset: 0.5, color: "#ffffff", opacity: 1 });
        setStops(newStops);
        applyGradient(newStops, angle, spread);
    };

    const updateStopColor = (index: number, color: string) => {
        const newStops = [...stops];
        newStops[index].color = color;
        setStops(newStops);
        applyGradient(newStops, angle, spread);
    };

    const updateStopOpacity = (index: number, opacity: number) => {
        const newStops = [...stops];
        newStops[index].opacity = opacity;
        setStops(newStops);
        applyGradient(newStops, angle, spread);
    };

    const removeStop = (index: number) => {
        if (stops.length <= 2) return;
        const newStops = stops.filter((_, i) => i !== index);
        setStops(newStops);
        applyGradient(newStops, angle, spread);
    };

    const applyPride = () => {
        const prideStops = [
            { offset: 0, color: "#E40303", opacity: 1 },
            { offset: 0.2, color: "#FF8C00", opacity: 1 },
            { offset: 0.4, color: "#FFED00", opacity: 1 },
            { offset: 0.6, color: "#008026", opacity: 1 },
            { offset: 0.8, color: "#004DFF", opacity: 1 },
            { offset: 1, color: "#750787", opacity: 1 }
        ];
        setStops(prideStops);
        applyGradient(prideStops, angle, spread);
    };

    const isGradient = selectedObject?.fill instanceof fabric.Gradient;

    const toggleGradient = () => {
        if (isGradient) {
            updateSelectedObject({ fill: hexToRgba(stops[0].color, stops[0].opacity ?? 1) });
        } else {
            applyGradient(stops, angle, spread);
        }
    };

    const containerClass = inline
        ? "w-full"
        : "absolute top-14 left-0 z-[110] w-80 rounded-2xl bg-[#1e2229] border border-white/10 p-6 shadow-2xl animate-in slide-in-from-top-2";

    return (
        <div className={containerClass}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gradients</h3>
                    <button
                        onClick={toggleGradient}
                        className={`w-8 h-4 rounded-full relative transition-colors ${isGradient ? 'bg-blue-500' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isGradient ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>
                {isGradient && (
                    <button onClick={applyPride} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[8px] font-black text-rose-400 hover:bg-white/10">
                        <Heart className="h-3 w-3 fill-rose-400" />
                        PRIDE
                    </button>
                )}
            </div>

            {isGradient && (
                <>
                    <div className="mb-6 space-y-2">
                        <div className="flex items-center justify-between font-black text-[9px] uppercase tracking-widest text-gray-500">
                            <p>Angle</p>
                            <span className="text-blue-500">{angle}°</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <RotateCw className="h-3 w-3 text-gray-500" />
                            <input
                                type="range" min="0" max="360" step="1"
                                value={angle}
                                onChange={(e) => {
                                    const newAngle = parseInt(e.target.value);
                                    setAngle(newAngle);
                                    applyGradient(stops, newAngle, spread);
                                }}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="mb-6 space-y-2">
                        <div className="flex items-center justify-between font-black text-[9px] uppercase tracking-widest text-gray-500">
                            <p>Spread (Sharpness)</p>
                            <span className="text-blue-500">{Math.round(spread * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Palette className="h-3 w-3 text-gray-500" />
                            <input
                                type="range" min="0.1" max="2" step="0.01"
                                value={spread}
                                onChange={(e) => {
                                    const newSpread = parseFloat(e.target.value);
                                    setSpread(newSpread);
                                    applyGradient(stops, angle, newSpread);
                                }}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stops.map((stop, i) => (
                            <div key={i} className="group relative space-y-2 rounded-xl bg-white/5 border border-white/5 p-3 transition-colors hover:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-8 w-8 rounded-lg border border-white/10 overflow-hidden shrink-0"
                                        style={{
                                            backgroundImage: `linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                                                              linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                                                              linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                                                              linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)`,
                                            backgroundSize: '8px 8px',
                                            backgroundPosition: '0 0, 0 4px, 4px 4px, 4px 0',
                                            backgroundColor: '#1a1a1a'
                                        }}>
                                        <input
                                            type="color"
                                            value={stop.color}
                                            onChange={(e) => updateStopColor(i, e.target.value)}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                        <div className="h-full w-full transition-colors" style={{ backgroundColor: hexToRgba(stop.color, stop.opacity ?? 1) }} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.01"
                                                value={stop.offset}
                                                onChange={(e) => {
                                                    const newStops = [...stops];
                                                    newStops[i].offset = parseFloat(e.target.value);
                                                    setStops(newStops);
                                                    applyGradient(newStops, angle, spread);
                                                }}
                                                className="flex-1 h-1 accent-blue-500"
                                            />
                                            <span className="text-[8px] font-black w-6 text-gray-500">{Math.round(stop.offset * 100)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Ghost className="h-3 w-3 text-blue-400/50" />
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.01"
                                                value={stop.opacity ?? 1}
                                                onChange={(e) => updateStopOpacity(i, parseFloat(e.target.value))}
                                                className="flex-1 h-1 accent-blue-400"
                                            />
                                            <span className="text-[8px] font-black w-6 text-gray-500">{Math.round((stop.opacity ?? 1) * 100)}</span>
                                        </div>
                                    </div>
                                    {stops.length > 2 && (
                                        <button
                                            onClick={() => removeStop(i)}
                                            className="p-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 transition-all"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addStop}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-2 text-[10px] font-bold text-gray-500 hover:bg-white/5 transition-all mt-2"
                        >
                            <Plus className="h-3 w-3" />
                            Add Colour Stop
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

