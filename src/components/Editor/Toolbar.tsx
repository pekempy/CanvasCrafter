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

    if (!selectedObject) return null;

    const isText = selectedObject instanceof fabric.IText;
    const isImage = selectedObject instanceof fabric.Image;
    const hasMask = !!selectedObject.clipPath;

    return (
        <>
            <div className="flex flex-col items-center gap-1 bg-[#181a20]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto transition-all w-12">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500 shadow-inner mb-2">
                    {selectedObject.type === 'activeSelection' ? <MousePointer2 className="h-4 w-4" /> : (isText ? <CaseSensitive className="h-4 w-4" /> : (isImage ? <Sparkles className="h-4 w-4" /> : <Palette className="h-4 w-4" />))}
                </div>

                <div className="w-full h-px bg-white/5 mb-1" />

                {isText ? (
                    <div className="flex flex-col items-center gap-0.5">
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
                        <div className="w-4 h-px bg-white/5 my-1" />
                        <ToolbarButton icon={<AlignLeft className="h-3.5 w-3.5" />} onClick={() => updateSelectedObject({ textAlign: 'left' })} label="Left" />
                        <ToolbarButton icon={<AlignCenter className="h-3.5 w-3.5" />} onClick={() => updateSelectedObject({ textAlign: 'center' })} label="Centre" />
                        <ToolbarButton icon={<AlignRight className="h-3.5 w-3.5" />} onClick={() => updateSelectedObject({ textAlign: 'right' })} label="Right" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-0.5">
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
                    <div className="flex flex-col items-center gap-1 bg-blue-600/10 rounded-xl p-1 my-1">
                        <ToolbarButton icon={<Check className="h-3.5 w-3.5 text-green-500" />} onClick={confirmCrop} label="Confirm Crop" />
                        <ToolbarButton icon={<XCircle className="h-3.5 w-3.5 text-red-500" />} onClick={cancelCrop} label="Cancel" />
                    </div>
                )}

                {/* Grouping Tools */}
                <div className="w-4 h-px bg-white/5 my-1" />
                {selectedObject.type === 'activeSelection' && (
                    <ToolbarButton icon={<Group className="h-3.5 w-3.5" />} onClick={groupSelected} label="Group" />
                )}
                {selectedObject.type === 'group' && (
                    <ToolbarButton icon={<Ungroup className="h-3.5 w-3.5" />} onClick={ungroupSelected} label="Ungroup" />
                )}

                {/* Alignment Tools (Condensed) */}
                <div className="flex flex-col items-center gap-0.5 px-1 py-1 bg-white/5 rounded-xl">
                    <ToolbarButton icon={<AlignLeftIcon className="h-3.5 w-3.5" />} onClick={() => alignSelected('left')} label="Align Left" />
                    <ToolbarButton icon={<AlignCenterIcon className="h-3.5 w-3.5" />} onClick={() => alignSelected('center')} label="Align Centre" />
                    <ToolbarButton icon={<AlignRightIcon className="h-3.5 w-3.5" />} onClick={() => alignSelected('right')} label="Align Right" />
                </div>
                <div className="flex flex-col items-center gap-0.5 px-1 py-1 bg-white/5 rounded-xl mt-1">
                    <ToolbarButton icon={<AlignTop className="h-3.5 w-3.5" />} onClick={() => alignSelected('top')} label="Align Top" />
                    <ToolbarButton icon={<AlignMiddle className="h-3.5 w-3.5" />} onClick={() => alignSelected('middle')} label="Align Middle" />
                    <ToolbarButton icon={<AlignBottom className="h-3.5 w-3.5" />} onClick={() => alignSelected('bottom')} label="Align Bottom" />
                </div>

                <div className="w-4 h-px bg-white/5 my-1" />

                <div className="flex flex-col items-center gap-0.5">
                    <div className="flex flex-col items-center bg-white/5 rounded-xl border border-white/5 p-0.5">
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
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[300]">
                <div className="bg-[#1e2229] text-[8px] font-black uppercase tracking-widest text-white px-2 py-1.5 rounded-lg border border-white/20 shadow-2xl whitespace-nowrap">
                    {label}
                </div>
                <div className="w-1.5 h-1.5 bg-[#1e2229] border-t border-r border-white/20 rotate-45 absolute top-1/2 -translate-y-1/2 -right-1" />
            </div>
        </button>
    );
}
