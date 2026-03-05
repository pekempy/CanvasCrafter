"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    FlipHorizontal,
    FlipVertical,
    Eraser,
    Sparkles,
    RotateCcw,
    BoxSelect,
    Palette,
    Layers,
    Type,
    Image as ImageIcon,
    Trash2,
    Copy,
    BringToFront,
    SendToBack
} from "lucide-react";
import * as fabric from "fabric";
import { useState } from "react";

export default function ContextToolbar() {
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
        canvas
    } = useCanvas() as any;

    const [isRemovingBG, setIsRemovingBG] = useState(false);

    if (!selectedObject) return null;

    const isImage = selectedObject && (selectedObject.type === 'image' || selectedObject instanceof fabric.Image);
    const isText = selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text' || selectedObject.type === 'textbox');

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
        if (!selectedObject) return;

        const hasGradient = selectedObject.fill instanceof fabric.Gradient;

        if (hasGradient) {
            // Revert to solid color
            updateSelectedObject({ fill: '#3b82f6' });
        } else {
            // Apply linear gradient
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
        if (!selectedObject) return;
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1e2229]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Common Actions */}
            <div className="flex items-center gap-1 border-r border-white/5 pr-1 mr-1">
                <ActionButton
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    label="Delete"
                    onClick={deleteSelected}
                    danger
                />
                <ActionButton
                    icon={<Copy className="h-3.5 w-3.5" />}
                    label="Duplicate"
                    onClick={duplicateSelected}
                />
            </div>

            {/* Ordering */}
            <div className="flex items-center gap-1 border-r border-white/5 pr-1 mr-1">
                <ActionButton
                    icon={<BringToFront className="h-3.5 w-3.5" />}
                    label="Forward"
                    onClick={bringForward}
                />
                <ActionButton
                    icon={<SendToBack className="h-3.5 w-3.5" />}
                    label="Backward"
                    onClick={sendBackwards}
                />
            </div>

            {/* Transform */}
            <div className="flex items-center gap-1 border-r border-white/5 pr-1 mr-1">
                <ActionButton
                    icon={<FlipHorizontal className="h-3.5 w-3.5" />}
                    label="Flip H"
                    onClick={() => updateSelectedObject({ flipX: !selectedObject.flipX })}
                />
                <ActionButton
                    icon={<FlipVertical className="h-3.5 w-3.5" />}
                    label="Flip V"
                    onClick={() => updateSelectedObject({ flipY: !selectedObject.flipY })}
                />
            </div>

            {/* Styles & Effects */}
            <div className="flex items-center gap-1">
                {!isImage && (
                    <ActionButton
                        icon={<Palette className="h-3.5 w-3.5" />}
                        label="Gradient"
                        onClick={toggleGradient}
                        active={selectedObject?.fill instanceof fabric.Gradient}
                    />
                )}

                <ActionButton
                    icon={<Layers className="h-3.5 w-3.5" />}
                    label="Shadow"
                    onClick={toggleShadow}
                    active={!!selectedObject?.shadow}
                />

                {isImage && (
                    <>
                        <ActionButton
                            icon={<Eraser className="h-3.5 w-3.5" />}
                            label={isRemovingBG ? "Removing..." : "Background remover"}
                            onClick={handleRemoveBG}
                            disabled={isRemovingBG}
                        />
                        <ActionButton
                            icon={<Layers className="h-3.5 w-3.5" />}
                            label="Edge detect border"
                            onClick={() => applyEdgeStroke()}
                        />
                    </>
                )}

                <div className="w-px h-4 bg-white/10 mx-1" />

                <ActionButton
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    label="Reset"
                    onClick={clearEffects}
                />
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick, active, disabled, danger }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                group relative flex h-8 items-center gap-2 rounded-lg px-2.5 transition-all
                ${active ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
                ${danger ? 'hover:text-red-400 hover:bg-red-500/10' : ''}
            `}
            title={label}
        >
            <div className="transition-transform duration-200 group-hover:scale-110">
                {icon}
            </div>

            {/* Tooltip on hover if preferred, or just label */}
            <span className="hidden lg:block text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                {label}
            </span>
        </button>
    );
}
