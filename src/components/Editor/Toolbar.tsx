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
        bringToFront, sendToBack, bringForward, sendBackwards, duplicateSelected, releaseMask,
        groupSelected, ungroupSelected, alignSelected,
        isCropMode, enterCropMode, confirmCrop, cancelCrop
    } = useCanvas();

    const [showSmartResize, setShowSmartResize] = useState(false);
    const [showApiSettings, setShowApiSettings] = useState(false);

    if (!selectedObject) return null;

    const checkIsImage = (obj: any) => {
        return obj && (
            obj.type === 'image' ||
            obj.type === 'FabricImage' ||
            obj.isAiBorderGroup ||
            obj instanceof fabric.Image
        );
    };

    const isImage = checkIsImage(selectedObject);
    const isMultiImage = selectedObject?.type === 'activeSelection' &&
        (selectedObject as any)._objects?.every((obj: any) => checkIsImage(obj));

    const isText = !!selectedObject && (
        selectedObject.type === 'text' ||
        selectedObject.type === 'i-text' ||
        selectedObject.type === 'textbox' ||
        selectedObject instanceof fabric.IText ||
        selectedObject instanceof fabric.Textbox
    );
    const hasMask = !!selectedObject.clipPath;

    return (
        <>
            <div className="flex flex-col items-center gap-2 bg-[#12141a]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)] pointer-events-auto transition-all w-14 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] mb-4">
                    {selectedObject.type === 'activeSelection' && !isMultiImage ? (
                        <MousePointer2 className="h-5 w-5" />
                    ) : (isText ? <CaseSensitive className="h-5 w-5" /> : (isImage || isMultiImage ? <Sparkles className="h-5 w-5" /> : <Palette className="h-5 w-5" />))}
                </div>

                {isText ? (
                    <div className="flex flex-col items-center gap-1.5">
                        <ToolbarButton
                            icon={<Bold className="h-4 w-4" />}
                            onClick={() => updateSelectedObject({ fontWeight: (selectedObject as fabric.IText).fontWeight === 'bold' ? 'normal' : 'bold' })}
                            active={(selectedObject as fabric.IText).fontWeight === 'bold'}
                            label="Bold"
                        />
                        <ToolbarButton
                            icon={<Italic className="h-4 w-4" />}
                            onClick={() => updateSelectedObject({ fontStyle: (selectedObject as fabric.IText).fontStyle === 'italic' ? 'normal' : 'italic' })}
                            active={(selectedObject as fabric.IText).fontStyle === 'italic'}
                            label="Italic"
                        />
                        <ToolbarButton
                            icon={<Underline className="h-4 w-4" />}
                            onClick={() => updateSelectedObject({ underline: !(selectedObject as fabric.IText).underline })}
                            active={(selectedObject as fabric.IText).underline}
                            label="Underline"
                        />
                        <div className="w-6 h-px bg-white/10 my-2" />
                        <ToolbarButton icon={<AlignLeft className="h-4 w-4" />} onClick={() => updateSelectedObject({ textAlign: 'left' })} label="Left" />
                        <ToolbarButton icon={<AlignCenter className="h-4 w-4" />} onClick={() => updateSelectedObject({ textAlign: 'center' })} label="Centre" />
                        <ToolbarButton icon={<AlignRight className="h-4 w-4" />} onClick={() => updateSelectedObject({ textAlign: 'right' })} label="Right" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1.5">
                        <ToolbarButton
                            icon={<FlipHorizontal className="h-4 w-4" />}
                            onClick={() => updateSelectedObject({ flipX: !selectedObject.flipX })}
                            label="Flip Horizontal"
                        />
                        <ToolbarButton
                            icon={<FlipVertical className="h-4 w-4" />}
                            onClick={() => updateSelectedObject({ flipY: !selectedObject.flipY })}
                            label="Flip Vertical"
                        />
                        {hasMask && (
                            <ToolbarButton
                                icon={<Scissors className="h-4 w-4 text-blue-400" />}
                                onClick={releaseMask}
                                label="Release Mask"
                            />
                        )}
                        <ToolbarButton
                            icon={<Maximize2 className="h-4 w-4 text-blue-400" />}
                            onClick={() => setShowSmartResize(true)}
                            label="Smart Resize"
                        />
                        {isImage && (
                            <ToolbarButton
                                icon={<Crop className="h-4 w-4 text-blue-500" />}
                                onClick={enterCropMode}
                                label="Crop Image"
                            />
                        )}
                    </div>
                )}

                {isCropMode && (
                    <div className="flex flex-col items-center gap-2 bg-blue-600/10 rounded-2xl p-2 my-2 border border-blue-500/20">
                        <ToolbarButton icon={<Check className="h-4 w-4 text-green-500" />} onClick={confirmCrop} label="Confirm Crop" />
                        <ToolbarButton icon={<XCircle className="h-4 w-4 text-red-500" />} onClick={cancelCrop} label="Cancel" />
                    </div>
                )}

                {/* Grouping Tools */}
                <div className="w-6 h-px bg-white/10 my-2" />
                <div className="flex flex-col items-center gap-1.5">
                    {selectedObject.type === 'activeSelection' && (
                        <ToolbarButton icon={<Group className="h-4 w-4" />} onClick={groupSelected} label="Group" />
                    )}
                    {selectedObject.type === 'group' && (
                        <ToolbarButton icon={<Ungroup className="h-4 w-4" />} onClick={ungroupSelected} label="Ungroup" />
                    )}

                    <ToolbarButton icon={<AlignLeftIcon className="h-4 w-4" />} onClick={() => alignSelected('left')} label="Align Left" />
                    <ToolbarButton icon={<AlignCenterIcon className="h-4 w-4" />} onClick={() => alignSelected('center')} label="Align Centre" />
                    <ToolbarButton icon={<AlignRightIcon className="h-4 w-4" />} onClick={() => alignSelected('right')} label="Align Right" />
                </div>

                <div className="w-6 h-px bg-white/10 my-2" />

                <div className="flex flex-col items-center gap-1.5">
                    <ToolbarButton icon={<ChevronUp className="h-4 w-4" />} onClick={bringForward} label="Bring Forward" />
                    <ToolbarButton icon={<ChevronDown className="h-4 w-4" />} onClick={sendBackwards} label="Send Backward" />
                    <ToolbarButton
                        icon={<Copy className="h-4 w-4" />}
                        onClick={duplicateSelected}
                        label="Duplicate"
                    />
                    <ToolbarButton
                        icon={<Settings2 className="h-4 w-4" />}
                        onClick={() => setShowApiSettings(true)}
                        label="API Settings"
                    />
                    <ToolbarButton
                        className="text-red-500 hover:bg-red-500/10"
                        icon={<Trash2 className="h-4 w-4" />}
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
