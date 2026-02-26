"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
    AlignRight, Trash2, ChevronUp, ChevronDown, CaseSensitive,
    MousePointer2, Sparkles, Palette, Copy, FlipHorizontal, FlipVertical,
    Scissors, Settings2, Maximize2, Group, Ungroup,
    AlignStartVertical as AlignTop, AlignCenterVertical as AlignMiddle, AlignEndVertical as AlignBottom,
    AlignStartHorizontal as AlignLeftIcon, AlignCenterHorizontal as AlignCenterIcon, AlignEndHorizontal as AlignRightIcon,
    Crop, Check, XCircle, GripVertical
} from "lucide-react";
import * as fabric from "fabric";
import { useState, useEffect } from "react";
import SmartResizeDialog from "./SmartResizeDialog";
import APISettingsDialog from "./APISettingsDialog";

export default function Toolbar() {
    const {
        selectedObject, updateSelectedObject, deleteSelected,
        bringToFront, sendToBack, duplicateSelected, releaseMask,
        groupSelected, ungroupSelected, alignSelected,
        isCropMode, enterCropMode, confirmCrop, cancelCrop
    } = useCanvas();

    const [showSmartResize, setShowSmartResize] = useState(false);
    const [showApiSettings, setShowApiSettings] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ top: -100, left: 0 });
    const [userOffset, setUserOffset] = useState({ x: 0, y: -55 });
    const [isDocked, setIsDocked] = useState(false);

    useEffect(() => {
        if (selectedObject && !isDocked) {
            const updatePos = () => {
                const rect = selectedObject.getBoundingRect();
                // Find global canvas position
                const canvasEl = selectedObject.canvas?.getElement();
                if (!canvasEl) return;
                const canvasRect = canvasEl.getBoundingClientRect();

                // Position toolbar above object + apply custom user offset
                setToolbarPos({
                    top: canvasRect.top + rect.top + userOffset.y,
                    left: canvasRect.left + rect.left + rect.width / 2 + userOffset.x
                });
            };

            updatePos();
            selectedObject.canvas?.on('object:moving', updatePos);
            selectedObject.canvas?.on('object:scaling', updatePos);

            // Re-calc on window resize
            window.addEventListener('resize', updatePos);

            return () => {
                selectedObject.canvas?.off('object:moving', updatePos);
                selectedObject.canvas?.off('object:scaling', updatePos);
                window.removeEventListener('resize', updatePos);
            };
        }
    }, [selectedObject, userOffset, isDocked]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const startX = clientX;
        const startY = clientY;
        const startOffsetX = userOffset.x;
        const startOffsetY = userOffset.y;

        const onMouseMove = (moveEvObj: MouseEvent | TouchEvent) => {
            const moveX = 'touches' in moveEvObj ? (moveEvObj as TouchEvent).touches[0].clientX : (moveEvObj as MouseEvent).clientX;
            const moveY = 'touches' in moveEvObj ? (moveEvObj as TouchEvent).touches[0].clientY : (moveEvObj as MouseEvent).clientY;

            if (moveY < 60) {
                setIsDocked(true);
            } else {
                setIsDocked(false);
                setUserOffset({
                    x: startOffsetX + (moveX - startX),
                    y: startOffsetY + (moveY - startY)
                });
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onMouseMove);
            document.removeEventListener('touchend', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onMouseMove);
        document.addEventListener('touchend', onMouseUp);
    };

    if (!selectedObject) return null;

    const isText = selectedObject instanceof fabric.IText;
    const isImage = selectedObject instanceof fabric.Image;
    const hasMask = !!selectedObject.clipPath;

    return (
        <>
            <div
                className={`fixed z-[200] flex items-center gap-1 bg-[#181a20]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto transition-all ${isDocked
                        ? 'top-4 left-1/2 -translate-x-1/2 w-auto max-w-[90vw]'
                        : ''
                    }`}
                style={!isDocked ? {
                    top: `${toolbarPos.top}px`,
                    left: `${toolbarPos.left}px`,
                    transform: 'translateX(-50%)',
                } : {}}
            >
                <div
                    className="flex items-center gap-1 px-2 border-r border-white/5 mr-1 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    title="Drag to move toolbar"
                >
                    <GripVertical className="h-4 w-4 text-gray-500 hover:text-white transition-colors" />
                </div>
                <div className="flex items-center gap-1 px-2 border-r border-white/5 mr-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500 shadow-inner">
                        {selectedObject.type === 'activeSelection' ? <MousePointer2 className="h-3 w-3" /> : (isText ? <CaseSensitive className="h-3 w-3" /> : (isImage ? <Sparkles className="h-3 w-3" /> : <Palette className="h-3 w-3" />))}
                    </div>
                </div>

                {isText ? (
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton
                            icon={<Bold className="h-3.5 w-3.5" />}
                            onClick={() => updateSelectedObject({ fontWeight: (selectedObject as fabric.IText).fontWeight === 'bold' ? 'normal' : 'bold' })}
                            active={(selectedObject as fabric.IText).fontWeight === 'bold'}
                            label="Bold"
                        />
                        <ToolbarButton
                            icon={<Italic className="h-3.5 w-3.5" />}
                            onClick={() => updateSelectedObject({ fontStyle: (selectedObject as fabric.IText).fontStyle === 'italic' ? 'normal' : 'italic' })}
                            active={(selectedObject as fabric.IText).fontStyle === 'italic'}
                            label="Italic"
                        />
                        <ToolbarButton
                            icon={<Underline className="h-3.5 w-3.5" />}
                            onClick={() => updateSelectedObject({ underline: !(selectedObject as fabric.IText).underline })}
                            active={(selectedObject as fabric.IText).underline}
                            label="Underline"
                        />
                        <div className="h-4 w-px bg-white/5 mx-1" />
                        <ToolbarButton icon={<AlignLeft className="h-3.5 w-3.5" />} onClick={() => updateSelectedObject({ textAlign: 'left' })} label="Left" />
                        <ToolbarButton icon={<AlignCenter className="h-3.5 w-3.5" />} onClick={() => updateSelectedObject({ textAlign: 'center' })} label="Centre" />
                        <ToolbarButton icon={<AlignRight className="h-3.5 w-3.5" />} onClick={() => updateSelectedObject({ textAlign: 'right' })} label="Right" />
                    </div>
                ) : (
                    <div className="flex items-center gap-0.5">
                        <ToolbarButton
                            icon={<FlipHorizontal className="h-3.5 w-3.5" />}
                            onClick={() => updateSelectedObject({ flipX: !selectedObject.flipX })}
                            label="Flip Horizontal"
                        />
                        <ToolbarButton
                            icon={<FlipVertical className="h-3.5 w-3.5" />}
                            onClick={() => updateSelectedObject({ flipY: !selectedObject.flipY })}
                            label="Flip Vertical"
                        />
                        {hasMask && (
                            <ToolbarButton
                                icon={<Scissors className="h-3.5 w-3.5 text-blue-500" />}
                                onClick={releaseMask}
                                label="Release Mask"
                            />
                        )}
                        <ToolbarButton
                            icon={<Maximize2 className="h-3.5 w-3.5 text-blue-400" />}
                            onClick={() => setShowSmartResize(true)}
                            label="Smart Resize"
                        />
                        {isImage && (
                            <ToolbarButton
                                icon={<Crop className="h-3.5 w-3.5 text-blue-500" />}
                                onClick={enterCropMode}
                                label="Crop Image"
                            />
                        )}
                    </div>
                )}

                {isCropMode && (
                    <div className="flex items-center gap-1 bg-blue-600/10 rounded-xl px-2">
                        <span className="text-[8px] font-black text-blue-500 uppercase mx-2">Crop Mode</span>
                        <ToolbarButton icon={<Check className="h-3.5 w-3.5 text-green-500" />} onClick={confirmCrop} label="Confirm Crop" />
                        <ToolbarButton icon={<XCircle className="h-3.5 w-3.5 text-red-500" />} onClick={cancelCrop} label="Cancel" />
                    </div>
                )}

                {/* Grouping Tools */}
                <div className="h-4 w-px bg-white/5 mx-1" />
                {selectedObject.type === 'activeSelection' && (
                    <ToolbarButton icon={<Group className="h-3.5 w-3.5" />} onClick={groupSelected} label="Group" />
                )}
                {selectedObject.type === 'group' && (
                    <ToolbarButton icon={<Ungroup className="h-3.5 w-3.5" />} onClick={ungroupSelected} label="Ungroup" />
                )}

                {/* Alignment Tools (Condensed) */}
                <div className="flex items-center gap-0.5 px-1 bg-white/5 rounded-xl">
                    <ToolbarButton icon={<AlignLeftIcon className="h-3.5 w-3.5" />} onClick={() => alignSelected('left')} label="Align Left" />
                    <ToolbarButton icon={<AlignCenterIcon className="h-3.5 w-3.5" />} onClick={() => alignSelected('center')} label="Align Centre" />
                    <ToolbarButton icon={<AlignRightIcon className="h-3.5 w-3.5" />} onClick={() => alignSelected('right')} label="Align Right" />
                </div>
                <div className="flex items-center gap-0.5 px-1 bg-white/5 rounded-xl ml-0.5">
                    <ToolbarButton icon={<AlignTop className="h-3.5 w-3.5" />} onClick={() => alignSelected('top')} label="Align Top" />
                    <ToolbarButton icon={<AlignMiddle className="h-3.5 w-3.5" />} onClick={() => alignSelected('middle')} label="Align Middle" />
                    <ToolbarButton icon={<AlignBottom className="h-3.5 w-3.5" />} onClick={() => alignSelected('bottom')} label="Align Bottom" />
                </div>

                <div className="h-4 w-px bg-white/5 mx-1" />

                <div className="flex items-center gap-0.5">
                    <div className="flex items-center bg-white/5 rounded-xl border border-white/5 px-0.5">
                        <ToolbarButton icon={<ChevronUp className="h-3.5 w-3.5" />} onClick={bringToFront} label="Bring Front" />
                        <ToolbarButton icon={<ChevronDown className="h-3.5 w-3.5" />} onClick={sendToBack} label="Send Back" />
                    </div>
                    <ToolbarButton
                        icon={<Copy className="h-3.5 w-3.5" />}
                        onClick={duplicateSelected}
                        label="Duplicate"
                    />
                    <ToolbarButton
                        icon={<Settings2 className="h-3.5 w-3.5" />}
                        onClick={() => setShowApiSettings(true)}
                        label="API Settings"
                    />
                    <ToolbarButton
                        className="text-red-500 hover:bg-red-500/20"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={deleteSelected}
                        label="Delete"
                    />
                </div>
            </div>

            <SmartResizeDialog isOpen={showSmartResize} onClose={() => setShowSmartResize(false)} />
            <APISettingsDialog isOpen={showApiSettings} onClose={() => setShowApiSettings(false)} />
        </>
    );
}

function ToolbarButton({
    icon,
    onClick,
    active = false,
    label,
    className = "",
}: {
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    label?: string;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex items-center justify-center rounded-xl p-2 transition-all active:scale-90
        ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'} ${className}`}
        >
            {icon}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[300]">
                <div className="bg-[#1e2229] text-[8px] font-black uppercase tracking-widest text-white px-2 py-1.5 rounded-lg border border-white/20 shadow-2xl whitespace-nowrap">
                    {label}
                </div>
                <div className="w-1.5 h-1.5 bg-[#1e2229] border-r border-b border-white/20 rotate-45 absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
            </div>
        </button>
    );
}
