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

    const adjustColor = (color: string, amount: number) => {
        const clamp = (val: number) => Math.min(Math.max(val, 0), 255);

        // Handle rgba/rgb strings
        if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (!match) return color;
            const [r, g, b] = match.map(Number);
            return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
        }

        // Handle hex
        let res = color.replace('#', '');
        if (res.length === 3) res = res.split('').map(c => c + c).join('');

        const num = parseInt(res, 16);
        const r = clamp((num >> 16) + amount);
        const g = clamp(((num >> 8) & 0x00FF) + amount);
        const b = clamp((num & 0x0000FF) + amount);

        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    };

    const applyEffect = (type: 'bevel' | 'emboss' | 'none', s = strength, a = angle) => {
        if (type === 'none') {
            const originalFill = (selectedObject as any)._originalFill || selectedObject.fill;
            const originalStroke = (selectedObject as any)._originalStroke || selectedObject.stroke;
            const originalStrokeWidth = (selectedObject as any)._originalStrokeWidth || selectedObject.strokeWidth;

            updateSelectedObject({
                shadow: null,
                fill: originalFill,
                stroke: originalStroke,
                strokeWidth: originalStrokeWidth,
                paintFirst: 'fill'
            });
            return;
        }

        if (!(selectedObject as any)._originalFill) {
            (selectedObject as any)._originalFill = selectedObject.fill;
            (selectedObject as any)._originalStroke = selectedObject.stroke;
            (selectedObject as any)._originalStrokeWidth = selectedObject.strokeWidth;
        }

        const baseColor = typeof (selectedObject as any)._originalFill === 'string'
            ? (selectedObject as any)._originalFill
            : '#ffffff';

        const angleRad = (a * Math.PI) / 180;
        const ux = Math.cos(angleRad);
        const uy = Math.sin(angleRad);

        const coords = {
            x1: 0.5 - ux * 0.5,
            y1: 0.5 - uy * 0.5,
            x2: 0.5 + ux * 0.5,
            y2: 0.5 + uy * 0.5
        };

        if (type === 'bevel') {
            // BEVEL: Raised "Hard Chisel"
            const bevelStroke = new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords,
                colorStops: [
                    { offset: 0, color: 'rgba(255,255,255,0.95)' }, // Highlight edge
                    { offset: 0.45, color: 'rgba(255,255,255,0.1)' },
                    { offset: 0.55, color: 'rgba(0,0,0,0.1)' },
                    { offset: 1, color: 'rgba(0,0,0,0.8)' } // Shadow edge
                ]
            });

            const shadow = new fabric.Shadow({
                color: 'rgba(0,0,0,0.5)',
                blur: s * 0.2,
                offsetX: -ux * (s * 0.15),
                offsetY: -uy * (s * 0.15),
                nonScaling: true
            });

            (shadow as any).effectType = 'bevel';
            (shadow as any).embossStrength = s;
            (shadow as any).embossAngle = a;

            updateSelectedObject({
                fill: baseColor,
                shadow,
                stroke: bevelStroke,
                strokeWidth: Math.max(1, s * 0.12),
                paintFirst: 'fill',
                strokeLineCap: 'round',
                strokeLineJoin: 'round'
            });
        } else {
            // EMBOSS: Deep Recessed "Stamped"
            // The fill itself should be a gradient to simulate "pit depth"
            const pitFill = new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords,
                colorStops: [
                    { offset: 0, color: adjustColor(baseColor, -70) }, // Dark occlusion at top-left
                    { offset: 0.25, color: adjustColor(baseColor, -30) },
                    { offset: 0.75, color: baseColor },
                    { offset: 1, color: adjustColor(baseColor, 20) }  // Catch light at bottom-right
                ]
            });

            // High-contrast internal rim stroke
            const embossStroke = new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords,
                colorStops: [
                    { offset: 0, color: 'rgba(0,0,0,0.9)' },    // Deep inner shadow (recess edge)
                    { offset: 0.4, color: 'rgba(0,0,0,0.2)' },
                    { offset: 0.6, color: 'rgba(255,255,255,0.2)' },
                    { offset: 1, color: 'rgba(255,255,255,1)' } // Sharp highlight on bottom rim
                ]
            });

            // Outer Lip Highlight: A very thin light shadow offset TOWARDS the light
            // serves as a "catch light" on the outer corner of the hole.
            const lipShadow = new fabric.Shadow({
                color: 'rgba(255,255,255,0.6)',
                blur: 0,
                offsetX: ux * 1.5,
                offsetY: uy * 1.5,
                nonScaling: true
            });

            (lipShadow as any).effectType = 'emboss';
            (lipShadow as any).embossStrength = s;
            (lipShadow as any).embossAngle = a;

            updateSelectedObject({
                fill: pitFill,
                shadow: lipShadow,
                stroke: embossStroke,
                strokeWidth: Math.max(1, s * 0.15),
                paintFirst: 'fill',
                strokeLineCap: 'round',
                strokeLineJoin: 'round'
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
