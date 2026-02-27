"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Sparkles, Mountain, Tent, MoveDownRight, RotateCw, Ghost } from "lucide-react";
import { useState, useEffect } from "react";
import * as fabric from "fabric";

export default function TypographyEffects() {
    const { selectedObject, updateSelectedObject } = useCanvas();

    if (!selectedObject || !(selectedObject instanceof fabric.IText || selectedObject instanceof fabric.Textbox || selectedObject.type === 'i-text' || selectedObject.type === 'textbox')) {
        return null;
    }

    const currentShadow = selectedObject.shadow as fabric.Shadow;
    // We'll consider it "embossed" if it has a specific metadata or if we recognize the pattern
    // For now, let's just track it via local state to keep UI responsive, 
    // but sync it with object properties.

    const isBevel = !!currentShadow && (currentShadow as any).effectType === 'bevel';
    const isEmboss = !!currentShadow && (currentShadow as any).effectType === 'emboss';
    const strength = (currentShadow as any)?.embossStrength || 15;
    const angle = (currentShadow as any)?.embossAngle || 135; // Top-left light source matches image

    const applyEffect = (type: 'bevel' | 'emboss' | 'none', s = strength, a = angle) => {
        if (type === 'none') {
            const originalFill = (selectedObject as any)._originalFill || selectedObject.fill;
            const originalStroke = (selectedObject as any)._originalStroke || selectedObject.stroke;
            const originalStrokeWidth = (selectedObject as any)._originalStrokeWidth || selectedObject.strokeWidth;

            updateSelectedObject({
                shadow: null,
                fill: originalFill,
                stroke: originalStroke,
                strokeWidth: originalStrokeWidth
            });
            return;
        }

        // Save original state
        if (!(selectedObject as any)._originalFill) {
            (selectedObject as any)._originalFill = selectedObject.fill;
            (selectedObject as any)._originalStroke = selectedObject.stroke;
            (selectedObject as any)._originalStrokeWidth = selectedObject.strokeWidth;
        }

        const angleInRad = (a * Math.PI) / 180;
        const baseColor = typeof (selectedObject as any)._originalFill === 'string'
            ? (selectedObject as any)._originalFill
            : '#ffffff';

        if (type === 'bevel') {
            // BEVEL: Raised plastic/3D look
            const shadow = new fabric.Shadow({
                color: 'rgba(0,0,0,0.6)',
                blur: s * 0.4,
                offsetX: Math.cos((a + 180) * Math.PI / 180) * (s * 0.45),
                offsetY: Math.sin((a + 180) * Math.PI / 180) * (s * 0.45),
                nonScaling: true
            });

            (shadow as any).effectType = 'bevel';
            (shadow as any).embossStrength = s;
            (shadow as any).embossAngle = a;

            updateSelectedObject({
                fill: baseColor,
                shadow,
                stroke: 'rgba(255,255,255,0.4)',
                strokeWidth: Math.max(0.5, s * 0.05),
                paintFirst: 'stroke'
            });
        } else {
            // EMBOSS: Molded/Pressed into surface
            // Ensure the text remains visible by blending baseColor into the gradient
            const internalGradient = new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
                colorStops: [
                    { offset: 0, color: 'rgba(0,0,0,0.2)' }, // Inner shadow atop base
                    { offset: 0.3, color: baseColor },       // Actual color starts here
                    { offset: 1, color: baseColor }
                ]
            });

            const shadow = new fabric.Shadow({
                color: 'rgba(255,255,255,0.3)', // Material highlight rim
                blur: s * 0.2,
                offsetX: Math.cos(a * Math.PI / 180) * (s * 0.2),
                offsetY: Math.sin(a * Math.PI / 180) * (s * 0.2),
                nonScaling: true
            });

            (shadow as any).effectType = 'emboss';
            (shadow as any).embossStrength = s;
            (shadow as any).embossAngle = a;

            updateSelectedObject({
                fill: internalGradient,
                shadow,
                stroke: 'rgba(0,0,0,0.2)',
                strokeWidth: 0.5,
                paintFirst: 'fill'
            });
        }
    };

    const currentType = isBevel ? 'bevel' : (isEmboss ? 'emboss' : 'none');

    return (
        <div className="space-y-4 mt-6 border-t border-white/5 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Mountain className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">3D Typography</span>
                </div>
                {currentType !== 'none' && (
                    <button
                        onClick={() => applyEffect('none')}
                        className="text-[8px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest"
                    >
                        Reset
                    </button>
                )}
            </div>

            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                    onClick={() => applyEffect('bevel')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${currentType === 'bevel' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                >
                    Bevel
                </button>
                <button
                    onClick={() => applyEffect('emboss')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${currentType === 'emboss' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                >
                    Emboss
                </button>
            </div>

            {currentType !== 'none' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight text-gray-500">
                            <label>Depth Strength</label>
                            <span className="text-blue-400">{strength}</span>
                        </div>
                        <input
                            type="range" min="1" max="50" step="1"
                            value={strength}
                            onChange={(e) => applyEffect(currentType, parseInt(e.target.value), angle)}
                            className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight text-gray-500">
                            <label>Light Angle</label>
                            <span className="text-blue-400">{angle}°</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <RotateCw className="h-3 w-3 text-gray-600" />
                            <input
                                type="range" min="0" max="360"
                                value={angle}
                                onChange={(e) => applyEffect(currentType, strength, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
