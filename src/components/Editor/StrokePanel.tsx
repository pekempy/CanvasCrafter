"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as fabric from "fabric";
import BrandColorPicker from "./BrandColorPicker";

export default function StrokePanel() {
    const { selectedObject, updateSelectedObject } = useCanvas();

    if (!selectedObject) return null;

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSelectedObject({
            strokeWidth: parseInt(e.target.value) || 0,
            paintFirst: "stroke"
        });
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSelectedObject({ stroke: e.target.value });
    };

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        let dashArray: number[] | undefined;
        if (value === "dashed") dashArray = [10, 5];
        else if (value === "dotted") dashArray = [2, 2];
        else dashArray = undefined; // Solid

        updateSelectedObject({ strokeDashArray: dashArray });
    };

    const currentThickness = selectedObject.strokeWidth || 0;
    const currentColor = typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#ffffff';
    const currentDash = selectedObject.strokeDashArray?.toString();
    let currentStyle = "solid";
    if (currentDash === "10,5") currentStyle = "dashed";
    else if (currentDash === "2,2") currentStyle = "dotted";

    // Provide a disclaimer for images
    const isImage = selectedObject instanceof fabric.Image && !selectedObject.clipPath;
    const strokeEnabled = currentThickness > 0;

    const toggleStroke = () => {
        if (strokeEnabled) {
            updateSelectedObject({ strokeWidth: 0 });
        } else {
            updateSelectedObject({
                strokeWidth: 2,
                stroke: currentColor === 'transparent' ? '#ffffff' : currentColor,
                paintFirst: "stroke"
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-gray-400">Outline</span>
                <button
                    onClick={toggleStroke}
                    className={`w-8 h-4 rounded-full relative transition-colors ${strokeEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${strokeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>

            {strokeEnabled && (
                <>
                    {isImage && (
                        <p className="text-[9px] font-bold text-orange-400 bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                            Note: Strokes on unmasked images apply to the rectangular boundary. To trace the subject, please use a shape mask first.
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black uppercase text-gray-400">Colour</span>
                        <div className="h-8 w-8 rounded-full border border-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 z-10 pointer-events-none rounded-full shadow-inner" />
                            <input
                                type="color"
                                value={currentColor}
                                onChange={handleColorChange}
                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer z-0 opacity-0"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: currentColor }} />
                        </div>
                    </div>

                    <BrandColorPicker
                        currentColor={currentColor}
                        onChange={(color) => updateSelectedObject({ stroke: color })}
                    />

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase text-gray-400">Thickness</label>
                            <span className="text-xs font-bold text-gray-300">{currentThickness}px</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={currentThickness}
                            onChange={handleWidthChange}
                            className="w-full h-2 bg-[#1e2229] rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Style</label>
                        <div className="relative">
                            <select
                                value={currentStyle}
                                onChange={handleStyleChange}
                                className="w-full bg-[#1e2229] border border-white/5 rounded-xl pl-3 pr-10 py-2 text-xs font-bold text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none hover:bg-white/5 transition-all"
                            >
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
