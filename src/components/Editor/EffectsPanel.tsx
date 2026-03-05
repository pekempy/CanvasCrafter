"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Sparkles,
    Sun,
    Contrast,
    Droplets,
    Palette,
    RotateCcw,
    Zap,
    Scan,
    RefreshCw,
    Camera,
    Film,
    Maximize,
    Eye,
    Wind,
    Layers,
    Type,
    Image as ImageIcon
} from "lucide-react";
import { useState } from "react";
import * as fabric from "fabric";
import CustomColorPicker from "./CustomColorPicker";

export default function EffectsPanel({ inline = false }: { inline?: boolean }) {
    const {
        selectedObject,
        updateSelectedObject,
        applyFilter,
        canvas,
        applyEdgeStroke,
        removeBackground: runBGRemoval
    } = useCanvas();
    const [isRemovingBG, setIsRemovingBG] = useState(false);
    const [isApplyingEdge, setIsApplyingEdge] = useState(false);

    const handleApplyEdge = () => {
        setIsApplyingEdge(true);
        applyEdgeStroke();
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

    const isEdgeBorderGroup = selectedObject && (selectedObject as any).isEdgeBorderGroup;
    const isImage = (selectedObject instanceof fabric.Image) || isEdgeBorderGroup;
    const shadowEnabled = !!selectedObject.shadow;

    // Check for active filters
    const hasFilter = (type: string) => {
        if (!isImage) return false;
        let img = selectedObject as fabric.Image;
        if (isEdgeBorderGroup) {
            img = (selectedObject as fabric.Group).getObjects().find(obj => obj instanceof fabric.Image) as fabric.Image;
        }
        return !!img?.filters?.find(f => f.type === type);
    };

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
            updateSelectedObject({
                shadow: newShadow,
                objectCaching: false,
                dirty: true
            });
            if (canvas) {
                selectedObject.setCoords();
                canvas.requestRenderAll();
            }
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

        const newShadow = new fabric.Shadow(shadowOptions);
        updateSelectedObject({
            shadow: newShadow,
            objectCaching: false,
            dirty: true
        });
        if (canvas) {
            selectedObject.setCoords();
            canvas.requestRenderAll();
        }
    };

    const containerClass = inline
        ? "w-full space-y-8"
        : "absolute top-14 left-0 z-[110] w-80 rounded-2xl bg-[#1e2229] p-6 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-200 overflow-y-auto max-h-[80vh] scrollbar-hide";

    return (
        <div className={containerClass}>
            {/* Shadow Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
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
                    <div className="space-y-4 rounded-2xl bg-white/5 border border-white/5 p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tight text-center">Color</label>
                            <CustomColorPicker
                                color={((selectedObject.shadow as fabric.Shadow)?.color as string) || '#000000'}
                                onChange={(color) => handleShadowChange('color', color)}
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
                <div className="space-y-8">
                    {/* Magic Tools */}
                    <div className="space-y-3 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Magic tools</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={removeBackground}
                                disabled={isRemovingBG}
                                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-3 text-[9px] font-black uppercase text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isRemovingBG ? 'Removing...' : 'Background remover'}
                            </button>
                            <button
                                onClick={handleApplyEdge}
                                disabled={isApplyingEdge || isEdgeBorderGroup}
                                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-[9px] font-black uppercase transition-all disabled:opacity-50
                                    ${isEdgeBorderGroup ? 'bg-purple-500 text-white' : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {isApplyingEdge ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
                                {isEdgeBorderGroup ? 'Border Active' : 'Edge detect border'}
                            </button>
                        </div>

                    </div>

                    {/* Filter Presets */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <Camera className="h-3.5 w-3.5 text-blue-500" />
                            Photoshop Presets
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <FilterPreset label="B&W" type="Grayscale" active={hasFilter('Grayscale')} onToggle={(v) => applyFilter('grayscale', v)} />
                            <FilterPreset label="Sepia" type="Sepia" active={hasFilter('Sepia')} onToggle={(v) => applyFilter('sepia', v)} />
                            <FilterPreset label="Invert" type="Invert" active={hasFilter('Invert')} onToggle={(v) => applyFilter('invert', v)} />
                            <FilterPreset label="Vintage" type="Vintage" active={hasFilter('Vintage')} onToggle={(v) => applyFilter('vintage', v)} />
                            <FilterPreset label="Kodak" type="Kodachrome" active={hasFilter('Kodachrome')} onToggle={(v) => applyFilter('kodachrome', v)} />
                            <FilterPreset label="Polaroid" type="Polaroid" active={hasFilter('Polaroid')} onToggle={(v) => applyFilter('polaroid', v)} />
                        </div>
                    </div>

                    {/* Advanced Adjustments */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <Sun className="h-3.5 w-3.5 text-orange-400" />
                            Advanced Adjustments
                        </h3>

                        <div className="space-y-6">
                            <FilterControl
                                label="Brightness" type="Brightness" prop="brightness"
                                min={-1} max={1} step={0.01} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Contrast" type="Contrast" prop="contrast"
                                min={-1} max={1} step={0.01} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Saturation" type="Saturation" prop="saturation"
                                min={-1} max={1} step={0.01} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Vibrance" type="Vibrance" prop="vibrance"
                                min={-1} max={1} step={0.01} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Gaussian Blur" type="Blur" prop="blur"
                                min={0} max={1} step={0.01} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Hue Rotate" type="HueRotation" prop="rotation"
                                min={-1} max={1} step={0.01} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Grain / Noise" type="Noise" prop="noise"
                                min={0} max={500} step={1} defaultValue={0}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Pixelate" type="Pixelate" prop="blocksize"
                                min={1} max={50} step={1} defaultValue={1}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                            <FilterControl
                                label="Gamma Corrector" type="Gamma" prop="gamma"
                                min={0.1} max={2.2} step={0.1} defaultValue={1}
                                selectedObject={selectedObject as fabric.Image} applyFilter={applyFilter}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterPreset({ label, active, onToggle }: { label: string, type: string, active: boolean, onToggle: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onToggle(!active)}
            className={`px-2 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all
                ${active ? 'bg-blue-500/20 border-blue-500/50 text-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
        >
            {label}
        </button>
    );
}

function FilterControl({ label, type, prop, min, max, step, defaultValue, selectedObject, applyFilter }: any) {
    let target = selectedObject;
    if (selectedObject && (selectedObject as any).isEdgeBorderGroup) {
        target = (selectedObject as fabric.Group).getObjects().find(obj => obj instanceof fabric.Image);
    }

    const filter = ((target as any)?.filters || []).find((f: any) => f.type === type) as any;
    let value = filter ? filter[prop] : defaultValue;

    // Handle array values (like Gamma: [v,v,v])
    if (Array.isArray(value)) {
        value = value[0];
    }

    // HueRotation uses 'rotation' internally in my applyFilter map, but here we call it via prop

    return (
        <EffectSlider
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
    label: string,
    value: number,
    min: number,
    max: number,
    step?: number,
    defaultValue?: number,
    onChange: (v: number) => void,
    icon?: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-gray-600">{icon}</span>}
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-tight">{label}</label>
                </div>
                <div className="flex items-center gap-1.5">
                    {defaultValue !== undefined && value !== defaultValue && (
                        <button
                            onClick={() => onChange(defaultValue)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-600 hover:text-blue-500 transition-all"
                            title="Reset"
                        >
                            <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                    )}
                    <span className="text-[10px] font-black text-white bg-blue-600/30 px-2 py-0.5 rounded-lg border border-blue-500/30 min-w-[34px] text-center">{Number(value).toFixed(step < 1 ? 2 : 0)}</span>
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
