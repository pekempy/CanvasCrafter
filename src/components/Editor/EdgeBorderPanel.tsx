"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { ChevronDown, Palette, Zap } from "lucide-react";
import * as fabric from "fabric";
import BrandColorPicker from "./BrandColorPicker";

export default function EdgeBorderPanel() {
    const { selectedObject, canvas, updateSelectedObject } = useCanvas();

    if (!selectedObject || !(selectedObject as any).isEdgeBorderGroup) return null;

    const group = selectedObject as fabric.Group;
    const objects = group.getObjects();
    // More robust finding: name > type > index
    const outline = (
        objects.find(obj => (obj as any).name === 'edge-border-outline') ||
        objects.find(obj => obj.type === 'polygon' || obj instanceof fabric.Polygon) ||
        objects[1]
    ) as fabric.Polygon;

    if (!outline) return null;

    const currentThickness = outline.strokeWidth || 0;
    const currentColor = typeof outline.stroke === 'string' ? outline.stroke : '#ffffff';

    // Convert opacity (0-1) to percentage for UI
    const currentOpacity = outline.opacity ?? 1;

    // Blur is stored in the shadow
    const currentBlur = outline.shadow ? (outline.shadow as fabric.Shadow).blur ?? 0 : 0;

    // Style parsing
    const currentDash = outline.strokeDashArray?.toString();
    let currentStyle = "solid";
    if (currentDash === "10,5") currentStyle = "dashed";
    else if (currentDash === "2,2") currentStyle = "dotted";
    if (currentDash === `${currentThickness * 2},${currentThickness}`) currentStyle = "dashed";
    else if (currentDash === `${currentThickness},${currentThickness}`) currentStyle = "dotted";

    const updateOutline = (props: any) => {
        // Apply directly to the object in the group
        outline.set(props);

        // Ensure Fabric updates the internal state correctly
        outline.set({ dirty: true });
        group.set({ dirty: true });
        group.setCoords();

        canvas?.requestRenderAll();
        // Force React to re-render slider positions
        updateSelectedObject({ dirty: true });
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const thickness = parseInt(e.target.value) || 0;

        // Update dash array dynamically based on new thickness if not solid
        let newDashArray = outline.strokeDashArray;
        if (currentStyle === 'dashed') newDashArray = [thickness * 2, thickness];
        if (currentStyle === 'dotted') newDashArray = [thickness, thickness];

        updateOutline({
            strokeWidth: thickness,
            strokeDashArray: newDashArray
        });
    };

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateOutline({ opacity: parseFloat(e.target.value) });
    };

    const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const blurNum = parseInt(e.target.value) || 0;
        const shadowOptions = blurNum === 0 ? null : new fabric.Shadow({
            color: currentColor,
            blur: blurNum,
            offsetX: 0,
            offsetY: 0
        });

        outline.set({ shadow: shadowOptions, dirty: true });
        group.set({ dirty: true });
        group.setCoords();
        updateSelectedObject({ dirty: true });
        canvas?.requestRenderAll();
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
        const color = typeof e === 'string' ? e : e.target.value;
        const currentShadow = outline.shadow as fabric.Shadow;

        outline.set({ stroke: color, dirty: true });

        if (currentShadow) {
            const newShadow = new fabric.Shadow({
                color: color,
                blur: currentShadow.blur,
                offsetX: 0,
                offsetY: 0
            });

            outline.set({ shadow: newShadow });
        }

        group.set({ dirty: true });
        group.setCoords();
        updateSelectedObject({ dirty: true });
        canvas?.requestRenderAll();
    };

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        let dashArray: number[] | undefined = undefined;
        if (value === "dashed") dashArray = [currentThickness * 2, currentThickness];
        else if (value === "dotted") dashArray = [currentThickness, currentThickness];

        updateOutline({ strokeDashArray: dashArray });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Colour</span>
                <div className="h-8 w-8 rounded-full border border-white/10 relative overflow-hidden group shrink-0">
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
                onChange={handleColorChange}
            />

            <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Thickness</label>
                    <span className="text-[10px] font-black text-white bg-purple-600/30 px-2 py-0.5 rounded-lg border border-purple-500/30 min-w-[34px] text-center">{currentThickness}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={currentThickness}
                    onChange={handleWidthChange}
                    className="w-full h-1.5 bg-[#1e2229] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Opacity</label>
                    <span className="text-[10px] font-black text-white bg-purple-600/30 px-2 py-0.5 rounded-lg border border-purple-500/30 min-w-[34px] text-center">{Math.round(currentOpacity * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentOpacity}
                    onChange={handleOpacityChange}
                    className="w-full h-1.5 bg-[#1e2229] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Blur (Glow)</label>
                    <span className="text-[10px] font-black text-white bg-purple-600/30 px-2 py-0.5 rounded-lg border border-purple-500/30 min-w-[34px] text-center">{currentBlur}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="50"
                    value={currentBlur}
                    onChange={handleBlurChange}
                    className="w-full h-1.5 bg-[#1e2229] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Style</label>
                <div className="relative">
                    <select
                        value={currentStyle}
                        onChange={handleStyleChange}
                        className="w-full bg-[#1e2229] border border-white/5 rounded-xl pl-3 pr-10 py-2 text-xs font-bold text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none hover:bg-white/5 transition-all"
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
