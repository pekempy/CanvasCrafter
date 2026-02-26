"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Sparkles, Sun, Contrast, Droplets, Palette, RotateCcw, Zap, Scan, RefreshCw } from "lucide-react";
import { useState } from "react";
import * as fabric from "fabric";

export default function EffectsPanel({ inline = false }: { inline?: boolean }) {
    const { selectedObject, updateSelectedObject, applyFilter, canvas, applyAIEdgeStroke, removeBackground: runBGRemoval } = useCanvas();
    const [isRemovingBG, setIsRemovingBG] = useState(false);
    const [isApplyingEdge, setIsApplyingEdge] = useState(false);

    const handleApplyEdge = () => {
        setIsApplyingEdge(true);
        applyAIEdgeStroke();
        setTimeout(() => setIsApplyingEdge(false), 800);
    };

    const removeBackground = async () => {
        if (!isImage || !canvas) return;
        setIsRemovingBG(true);
        try {
            await runBGRemoval();
        } catch (err) {
            console.error(err);
        }
        setIsRemovingBG(false);
    };

    if (!selectedObject) return null;

    const isImage = selectedObject instanceof fabric.Image;
    const shadowEnabled = !!selectedObject.shadow;
    const isInverted = isImage && !!(selectedObject as fabric.Image).filters?.find(f => f.type === 'Invert');

    const toggleShadow = () => {
        if (shadowEnabled) {
            updateSelectedObject({ shadow: null });
        } else {
            const newShadow = new fabric.Shadow({
                color: 'rgba(0,0,0,0.3)',
                blur: 10,
                offsetX: 5,
                offsetY: 5
            });
            updateSelectedObject({ shadow: newShadow });
        }
    };

    const handleShadowChange = (prop: string, value: number | string) => {
        const currentShadow = (selectedObject.shadow as fabric.Shadow) || new fabric.Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 10,
            offsetX: 5,
            offsetY: 5
        });

        const shadowOptions: any = {
            color: currentShadow.color,
            blur: currentShadow.blur,
            offsetX: currentShadow.offsetX,
            offsetY: currentShadow.offsetY,
        };
        shadowOptions[prop] = value;

        updateSelectedObject({ shadow: new fabric.Shadow(shadowOptions) });
    };

    const containerClass = inline
        ? "w-full"
        : "absolute top-14 left-0 z-[110] w-72 rounded-2xl bg-[#1e2229] p-6 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-200";

    return (
        <div className={containerClass}>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Drop Shadow
                    </h3>
                    <button
                        onClick={toggleShadow}
                        className={`w-8 h-4 rounded-full relative transition-colors ${shadowEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${shadowEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>

                {shadowEnabled && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Colour</label>
                            <input
                                type="color"
                                value={((selectedObject.shadow as fabric.Shadow)?.color as string) || '#000000'}
                                onChange={(e) => handleShadowChange('color', e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-none p-0 outline-none"
                            />
                        </div>
                        <EffectSlider
                            label="Blur"
                            value={((selectedObject.shadow as fabric.Shadow)?.blur) || 0}
                            min={0} max={50}
                            defaultValue={10}
                            onChange={(v) => handleShadowChange('blur', v)}
                        />
                        <EffectSlider
                            label="Offset X"
                            value={((selectedObject.shadow as fabric.Shadow)?.offsetX) || 0}
                            min={-50} max={50}
                            defaultValue={5}
                            onChange={(v) => handleShadowChange('offsetX', v)}
                        />
                        <EffectSlider
                            label="Offset Y"
                            value={((selectedObject.shadow as fabric.Shadow)?.offsetY) || 0}
                            min={-50} max={50}
                            defaultValue={5}
                            onChange={(v) => handleShadowChange('offsetY', v)}
                        />
                    </div>
                )}
            </div>

            {isImage && (
                <div className="border-t border-white/5 pt-8">
                    <div className="mb-6">
                        <button
                            onClick={removeBackground}
                            disabled={isRemovingBG}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-[10px] font-black uppercase tracking-widest text-white hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {isRemovingBG ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Scan className="h-3.5 w-3.5" />}
                            {isRemovingBG ? "Removing..." : "Remove Background"}
                        </button>
                    </div>
                    <div className="mb-6">
                        <button
                            onClick={handleApplyEdge}
                            disabled={isApplyingEdge}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/5 p-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            {isApplyingEdge ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" /> : <Sparkles className="h-3.5 w-3.5 text-blue-500" />}
                            {isApplyingEdge ? "Detecting..." : "Detect Edge Border"}
                        </button>
                    </div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <Droplets className="h-3.5 w-3.5 text-blue-500" />
                            Image Filters
                        </h3>
                        <button
                            onClick={() => applyFilter('invert', !isInverted)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all
                                ${isInverted ? 'bg-blue-500/20 border-blue-500/50 text-blue-500' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        >
                            <Zap className={`h-3 w-3 ${isInverted ? 'fill-blue-500' : ''}`} /> Invert
                        </button>
                    </div>

                    <div className="space-y-5">
                        <FilterControl
                            icon={<Sun className="h-4 w-4" />}
                            label="Brightness"
                            type="Brightness"
                            prop="brightness"
                            min={-1} max={1} step={0.1}
                            defaultValue={0}
                            selectedObject={selectedObject as fabric.Image}
                            applyFilter={applyFilter}
                        />
                        <FilterControl
                            icon={<Contrast className="h-4 w-4" />}
                            label="Contrast"
                            type="Contrast"
                            prop="contrast"
                            min={-1} max={1} step={0.1}
                            defaultValue={0}
                            selectedObject={selectedObject as fabric.Image}
                            applyFilter={applyFilter}
                        />
                        <FilterControl
                            icon={<Droplets className="h-4 w-4" />}
                            label="Saturation"
                            type="Saturation"
                            prop="saturation"
                            min={-1} max={1} step={0.1}
                            defaultValue={0}
                            selectedObject={selectedObject as fabric.Image}
                            applyFilter={applyFilter}
                        />
                        <FilterControl
                            label="Blur"
                            type="Blur"
                            prop="blur"
                            min={0} max={1} step={0.05}
                            defaultValue={0}
                            selectedObject={selectedObject as fabric.Image}
                            applyFilter={applyFilter}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterControl({ icon, label, type, prop, min, max, step, defaultValue, selectedObject, applyFilter }: any) {
    const filter = (selectedObject.filters || []).find((f: any) => f.type === type) as any;
    const value = filter ? filter[prop] : defaultValue;

    return (
        <EffectSlider
            icon={icon}
            label={label}
            value={value}
            min={min}
            max={max}
            step={step}
            defaultValue={defaultValue}
            onChange={(v) => applyFilter(type.toLowerCase(), v)}
        />
    );
}

function EffectSlider({
    label,
    value,
    min,
    max,
    step = 1,
    defaultValue,
    onChange,
    icon
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    defaultValue?: number;
    onChange: (v: number) => void;
    icon?: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-gray-600">{icon}</span>}
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight">{label}</label>
                </div>
                <div className="flex items-center gap-2">
                    {defaultValue !== undefined && value !== defaultValue && (
                        <button
                            onClick={() => onChange(defaultValue)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-600 hover:text-blue-500 transition-all"
                            title="Reset to default"
                        >
                            <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                    )}
                    <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-lg border border-blue-500/20 w-8 text-center">{value}</span>
                </div>
            </div>
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full appearance-none h-1 bg-white/5 rounded-full accent-blue-500 hover:bg-white/10 transition-all cursor-pointer"
            />
        </div>
    );
}
