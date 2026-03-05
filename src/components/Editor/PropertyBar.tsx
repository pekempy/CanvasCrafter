"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    FlipHorizontal,
    FlipVertical,
    Eraser,
    Sparkles,
    RotateCcw,
    Palette,
    Layers,
    Type,
    Image as ImageIcon,
    Trash2,
    Copy,
    BringToFront,
    SendToBack,
    BoxSelect,
    Bolt,
    Monitor,
    MousePointer2,
    Type as TypeIcon,
    Shapes,
    ChevronDown,
    Ghost,
    Maximize,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Plus,
    Minus
} from "lucide-react";
import * as fabric from "fabric";
import { useState } from "react";

export default function PropertyBar() {
    const {
        selectedObject,
        updateSelectedObject,
        removeBackground,
        applyEdgeStroke,
        clearEffects,
        duplicateSelected,
        deleteSelected,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackwards,
        canvas,
        applyFilter
    } = useCanvas() as any;

    const [isRemovingBG, setIsRemovingBG] = useState(false);

    if (!selectedObject) return null;

    const isText = !!selectedObject && (
        selectedObject.type === 'text' ||
        selectedObject.type === 'i-text' ||
        selectedObject.type === 'textbox' ||
        selectedObject instanceof fabric.IText ||
        selectedObject instanceof fabric.Textbox
    );

    const isEdgeBorderGroup = !!selectedObject && (selectedObject as any).isEdgeBorderGroup;

    const checkIsImage = (obj: any) => {
        return obj && (
            obj.type === 'image' ||
            obj.type === 'FabricImage' ||
            obj.isEdgeBorderGroup ||
            obj instanceof fabric.Image
        );
    };

    const isImage = checkIsImage(selectedObject);

    // Handle multiple selection (ActiveSelection)
    const isMultiImage = selectedObject?.type === 'activeSelection' &&
        (selectedObject as any)._objects?.every((obj: any) => checkIsImage(obj));

    const hideFillStroke = isImage || isMultiImage;
    const isShape = !isImage && !isText && selectedObject?.type !== 'activeSelection';

    const handleRemoveBG = async () => {
        if (!isImage) return;
        setIsRemovingBG(true);
        try {
            await removeBackground();
        } catch (e) {
            console.error(e);
        }
        setIsRemovingBG(false);
    };

    const toggleGradient = () => {
        const hasGradient = selectedObject.fill instanceof fabric.Gradient;
        if (hasGradient) {
            updateSelectedObject({ fill: '#3b82f6' });
        } else {
            const width = selectedObject.width || 100;
            const gradient = new fabric.Gradient({
                type: 'linear',
                coords: { x1: 0, y1: 0, x2: width, y2: 0 },
                colorStops: [
                    { offset: 0, color: '#3b82f6' },
                    { offset: 1, color: '#8b5cf6' }
                ]
            });
            updateSelectedObject({ fill: gradient });
        }
    };

    const toggleShadow = () => {
        if (selectedObject.shadow) {
            updateSelectedObject({ shadow: null });
        } else {
            updateSelectedObject({
                shadow: new fabric.Shadow({
                    color: 'rgba(0,0,0,0.3)',
                    blur: 15,
                    offsetX: 8,
                    offsetY: 8
                })
            });
        }
    };

    return (
        <div className="h-12 w-full border-b border-white/5 bg-[#181a20] flex items-center px-4 gap-4 z-50 overflow-x-auto scrollbar-hide">
            {/* Selection Info */}
            <div className="flex items-center gap-3 pr-4 border-r border-white/5 shrink-0">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    {isText ? <TypeIcon className="h-4 w-4" /> : isImage ? <ImageIcon className="h-4 w-4" /> : <Shapes className="h-4 w-4" />}
                </div>
            </div>

            {/* Core Appearance (Fill/Stroke) */}
            {!hideFillStroke && (
                <div className="flex items-center gap-4 pr-4 border-r border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Fill</span>
                        <div className="h-6 w-8 rounded-md border border-white/10 relative overflow-hidden group">
                            <input
                                type="color"
                                value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#3b82f6'}
                                onChange={(e) => updateSelectedObject({ fill: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: typeof selectedObject.fill === 'string' ? selectedObject.fill : 'transparent' }} />
                            {selectedObject.fill instanceof fabric.Gradient && (
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500" />
                            )}
                        </div>
                        <button
                            onClick={toggleGradient}
                            className={`p-1.5 rounded-lg transition-all ${selectedObject.fill instanceof fabric.Gradient ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                            title="Toggle Gradient"
                        >
                            <Palette className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Stroke</span>
                        <div className="h-6 w-8 rounded-md border border-white/10 relative overflow-hidden flex items-center justify-center">
                            <input
                                type="color"
                                value={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#ffffff'}
                                onChange={(e) => updateSelectedObject({ stroke: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full h-full" style={{ backgroundColor: typeof selectedObject.stroke === 'string' ? selectedObject.stroke : 'transparent' }} />
                        </div>
                        <CompactNumberInput
                            value={selectedObject.strokeWidth || 0}
                            onChange={(v) => updateSelectedObject({ strokeWidth: v })}
                        />
                    </div>
                </div>
            )}

            {/* Typography Controls */}
            {isText && (
                <div className="flex items-center gap-2 pr-4 border-r border-white/5 shrink-0">
                    <button
                        onClick={() => updateSelectedObject({ fontWeight: selectedObject.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`p-2 rounded-lg transition-all ${selectedObject.fontWeight === 'bold' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => updateSelectedObject({ fontStyle: selectedObject.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        className={`p-2 rounded-lg transition-all ${selectedObject.fontStyle === 'italic' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-white/5 mx-1" />
                    <button
                        onClick={() => updateSelectedObject({ textAlign: 'left' })}
                        className={`p-2 rounded-lg transition-all ${selectedObject.textAlign === 'left' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => updateSelectedObject({ textAlign: 'center' })}
                        className={`p-2 rounded-lg transition-all ${selectedObject.textAlign === 'center' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => updateSelectedObject({ textAlign: 'right' })}
                        className={`p-2 rounded-lg transition-all ${selectedObject.textAlign === 'right' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        <AlignRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Opacity */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/5 shrink-0">
                <Ghost className="h-3.5 w-3.5 text-gray-500" />
                <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={selectedObject.opacity || 1}
                    onChange={(e) => updateSelectedObject({ opacity: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[9px] font-black text-blue-500 w-8">{Math.round((selectedObject.opacity || 1) * 100)}%</span>
            </div>

            {/* Effects */}
            <div className="flex items-center gap-2 pr-4 border-r border-white/5 shrink-0">
                <button
                    onClick={toggleShadow}
                    className={`flex items-center gap-2 px-3 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedObject.shadow ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-500 hover:text-gray-300'}`}
                >
                    <BoxSelect className="h-3.5 w-3.5" />
                    Shadow
                </button>
                {selectedObject.shadow && (
                    <div className="h-6 w-8 rounded-md border border-white/10 relative overflow-hidden flex items-center justify-center shrink-0">
                        <input
                            type="color"
                            value={((selectedObject.shadow as fabric.Shadow)?.color as string) || '#000000'}
                            onChange={(e) => {
                                const s = selectedObject.shadow as fabric.Shadow;
                                updateSelectedObject({
                                    shadow: new fabric.Shadow({
                                        color: e.target.value,
                                        blur: s?.blur || 15,
                                        offsetX: s?.offsetX || 8,
                                        offsetY: s?.offsetY || 8
                                    })
                                });
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-full" style={{ backgroundColor: ((selectedObject.shadow as fabric.Shadow)?.color as string) || '#000000' }} />
                    </div>
                )}

                {isImage && (
                    <>
                        <button
                            onClick={handleRemoveBG}
                            disabled={isRemovingBG}
                            className={`flex items-center gap-2 px-3 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRemovingBG ? 'bg-white/5 text-gray-500 opacity-50' : 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20'}`}
                        >
                            <Eraser className="h-3.5 w-3.5" />
                            {isRemovingBG ? 'Removing...' : 'Background remover'}
                        </button>
                        <button
                            onClick={applyEdgeStroke}
                            className={`flex items-center gap-2 px-3 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isEdgeBorderGroup ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'}`}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Edge detect border
                        </button>

                        {isEdgeBorderGroup && (
                            <div className="flex items-center gap-2 pl-2 border-l border-white/10 animate-in fade-in slide-in-from-left-2 duration-200">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Adjust in Properties Panel 👉</span>
                            </div>
                        )}

                        <div className="w-px h-4 bg-white/5 mx-1" />
                        <button
                            onClick={() => applyFilter('grayscale', !((selectedObject as any).filters?.find((f: any) => f.type === 'Grayscale')))}
                            className={`px-3 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${(selectedObject as any).filters?.find((f: any) => f.type === 'Grayscale') ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                        >
                            B&W
                        </button>
                        <button
                            onClick={() => applyFilter('sepia', !((selectedObject as any).filters?.find((f: any) => f.type === 'Sepia')))}
                            className={`px-3 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${(selectedObject as any).filters?.find((f: any) => f.type === 'Sepia') ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                        >
                            Sepia
                        </button>
                    </>
                )}
            </div>

            {/* Transform & Arrangement */}
            <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateSelectedObject({ flipX: !selectedObject.flipX })} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all">
                    <FlipHorizontal className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => updateSelectedObject({ flipY: !selectedObject.flipY })} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all">
                    <FlipVertical className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <button onClick={bringForward} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Bring Forward">
                    <BringToFront className="h-3.5 w-3.5" />
                </button>
                <button onClick={sendBackwards} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Send Backward">
                    <SendToBack className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <button onClick={duplicateSelected} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all">
                    <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={deleteSelected} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-white/5 mx-2" />
                <button onClick={clearEffects} className="h-8 px-3 hover:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset All
                </button>
            </div>
        </div>
    );
}

function CompactNumberInput({ value, onChange, min = 0, max = 100 }: { value: number, onChange: (v: number) => void, min?: number, max?: number }) {
    return (
        <div className="flex items-center bg-white/10 rounded-lg border border-white/10 overflow-hidden h-8">
            <button
                onClick={() => onChange(Math.max(min, value - 1))}
                className="px-2 hover:bg-white/10 text-gray-400 hover:text-white transition-all border-r border-white/5 h-full flex items-center justify-center"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                    if (!isNaN(val)) onChange(Math.min(max, Math.max(min, val)));
                    else if (e.target.value === '') onChange(min);
                }}
                className="w-10 bg-transparent text-xs font-black text-center text-white outline-none select-all"
            />
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                className="px-2 hover:bg-white/10 text-gray-400 hover:text-white transition-all border-l border-white/5 h-full flex items-center justify-center"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
