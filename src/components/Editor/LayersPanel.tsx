"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Trash2, ChevronUp, ChevronDown, Layers as LayersIcon, Eye, EyeOff, Lock, Unlock, Group, Ungroup, Folder, FolderOpen, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import * as fabric from "fabric";

export default function LayersPanel() {
    const { canvas, selectedObject, groupSelected, ungroupSelected, updateTick } = useCanvas();
    const [layers, setLayers] = useState<fabric.Object[]>([]);
    const [editingLayer, setEditingLayer] = useState<fabric.Object | null>(null);
    const [editName, setEditName] = useState("");

    // Update layers list whenever canvas changes
    useEffect(() => {
        if (!canvas) return;

        const updateLayers = () => {
            // Fabric objects are stored from bottom to top, we reverse for UI
            setLayers([...canvas.getObjects()].reverse());
        };

        canvas.on("object:added", updateLayers);
        canvas.on("object:removed", updateLayers);
        canvas.on("object:modified", updateLayers);
        canvas.on("selection:created", updateLayers);
        canvas.on("selection:updated", updateLayers);
        canvas.on("selection:cleared", updateLayers);

        updateLayers();

        return () => {
            canvas.off("object:added", updateLayers);
            canvas.off("object:removed", updateLayers);
            canvas.off("object:modified", updateLayers);
            canvas.off("selection:created", updateLayers);
            canvas.off("selection:updated", updateLayers);
            canvas.off("selection:cleared", updateLayers);
        };
    }, [canvas]);

    const toggleVisibility = (obj: fabric.Object) => {
        obj.set("visible", !obj.visible);
        canvas?.renderAll();
        setLayers([...(canvas?.getObjects() || [])].reverse());
    };

    const toggleLock = (obj: fabric.Object) => {
        const isLocked = obj.lockMovementX;
        obj.set({
            lockMovementX: !isLocked,
            lockMovementY: !isLocked,
            // We keep rotation and scaling enabled as per "otherwise can edit"
            hasControls: true,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
        });
        canvas?.renderAll();
        setLayers([...(canvas?.getObjects() || [])].reverse());
    };



    const startEditing = (obj: fabric.Object, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLayer(obj);
        setEditName((obj as any).name || getLayerName(obj));
    };

    const submitEdit = () => {
        if (editingLayer) {
            (editingLayer as any).set("name", editName);
            canvas?.renderAll();
            setLayers([...(canvas?.getObjects() || [])].reverse());
        }
        setEditingLayer(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            submitEdit();
        } else if (e.key === "Escape") {
            setEditingLayer(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("text/plain", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
        if (sourceIndex === targetIndex) return;

        if (!canvas) return;

        const sourceObj = layers[sourceIndex];
        const targetObj = layers[targetIndex];

        if (targetObj.type === 'group') {
            const group = targetObj as fabric.Group;

            // Don't allow dropping a group into itself
            if (sourceObj === group) return;

            // Simple way to add to group while preserving global position
            canvas.remove(sourceObj);
            group.add(sourceObj);

            canvas.renderAll();
            setLayers([...canvas.getObjects()].reverse());
            return;
        }

        const allObjects = [...canvas.getObjects()];
        const targetFabricIndex = allObjects.indexOf(targetObj);
        canvas.moveObjectTo(sourceObj, targetFabricIndex);

        canvas.renderAll();
        setLayers([...canvas.getObjects()].reverse());
    };

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleGroup = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedGroups);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedGroups(newSet);
    };

    const renderLayer = (obj: fabric.Object, depth: number = 0) => {
        const activeObjects = canvas?.getActiveObjects() || [];
        const isSelected = activeObjects.includes(obj);

        const isGroup = obj.type === 'group';
        const objId = (obj as any).id || Math.random().toString(36).substr(2, 9);
        if (!(obj as any).id) (obj as any).id = objId;
        const isExpanded = expandedGroups.has(objId);

        return (
            <div key={objId} className="space-y-1">
                <div
                    draggable
                    onDragStart={(e) => {
                        const idx = layers.indexOf(obj);
                        if (idx !== -1) handleDragStart(e, idx);
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                        const idx = layers.indexOf(obj);
                        if (idx !== -1) handleDrop(e, idx);
                    }}
                    onClick={(e) => selectObject(obj, e.metaKey || e.ctrlKey)}
                    className={`group flex items-center gap-2 rounded-xl border p-2 transition-all cursor-pointer select-none relative overflow-hidden
                        ${isSelected ? 'bg-blue-600/15 border-blue-500/40 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                    style={{ marginLeft: `${depth * 16}px` }}
                >
                    {/* Selection Indicator Accent */}
                    {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]" />
                    )}

                    {isGroup && (
                        <button onClick={(e) => toggleGroup(objId, e)} className="p-1 hover:bg-white/5 rounded z-10">
                            <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                        </button>
                    )}

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 overflow-hidden border border-white/5 shrink-0 pointer-events-none">
                        <LayerPreview obj={obj} />
                    </div>

                    <div className="flex-1 min-w-0" onDoubleClick={(e) => startEditing(obj, e)}>
                        {editingLayer === obj ? (
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={submitEdit}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-black/50 border border-blue-500 rounded px-1 py-0.5 text-xs text-white outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className={`text-[11px] font-bold truncate ${isSelected ? 'text-blue-500' : 'text-gray-200'}`}>
                                {getLayerName(obj)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }}
                            className="p-1 px-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200"
                        >
                            {obj.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-red-500" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleLock(obj); }}
                            className="p-1 px-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200"
                        >
                            {obj.lockMovementX ? <Lock className="h-3 w-3 text-blue-500" /> : <Unlock className="h-3 w-3" />}
                        </button>
                    </div>
                </div>
                {isGroup && isExpanded && (obj as fabric.Group).getObjects().map(child => renderLayer(child, depth + 1))}
            </div>
        );
    };

    const selectObject = (obj: fabric.Object, multi: boolean = false) => {
        if (!canvas) return;

        if (multi) {
            const active = canvas.getActiveObject();
            if (!active) {
                canvas.setActiveObject(obj);
            } else if (active.type === 'activeSelection') {
                const as = active as fabric.ActiveSelection;
                const objects = as.getObjects();
                if (objects.includes(obj)) {
                    as.remove(obj);
                    if (as.getObjects().length === 1) {
                        canvas.setActiveObject(as.getObjects()[0]);
                    }
                } else {
                    as.add(obj);
                }
            } else {
                if (active === obj) {
                    canvas.discardActiveObject();
                } else {
                    const sel = new fabric.ActiveSelection([active, obj], { canvas });
                    canvas.setActiveObject(sel);
                }
            }
        } else {
            canvas.setActiveObject(obj);
        }

        canvas.requestRenderAll();
        // Force state update in useCanvasStore
        canvas.fire('selection:created');
        canvas.fire('selection:updated');
    };

    return (
        <div className="flex h-full w-full flex-col bg-[#13151a]">
            <div className="flex items-center justify-between border-b border-white/5 bg-[#1e2229] px-4 py-3">
                <div className="flex items-center gap-2">
                    <LayersIcon className="h-4 w-4 text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Layers</h3>
                </div>
                <div className="flex items-center gap-1">
                    {selectedObject && (
                        <>
                            {selectedObject.type === 'group' ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); ungroupSelected(); }}
                                    className="flex items-center gap-1.5 rounded-lg bg-red-600/10 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg"
                                    title="Ungroup / Open Folder"
                                >
                                    <FolderOpen className="h-3 w-3" />
                                    Ungroup
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); groupSelected(); }}
                                    className="flex items-center gap-1.5 rounded-lg bg-blue-600/10 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                    title="Group into Folder"
                                >
                                    <Folder className="h-3 w-3" />
                                    {selectedObject.type === 'activeSelection' ? 'Group' : 'Folder'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {layers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <Plus className="mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-xs font-medium text-gray-400">Add assets to start</p>
                    </div>
                ) : (
                    layers.map(obj => renderLayer(obj))
                )}
            </div>
        </div>
    );
}

function getLayerName(obj: fabric.Object) {
    if ((obj as any).name) return (obj as any).name;
    if (obj instanceof fabric.IText) return obj.text || "Text";
    if (obj instanceof fabric.Rect) return "Rectangle";
    if (obj instanceof fabric.Circle) return "Circle";
    if (obj instanceof fabric.Image) return "Image";
    if (obj.type === 'group') return "Group";
    return "Object";
}

function LayerPreview({ obj }: { obj: fabric.Object }) {
    if (obj instanceof fabric.IText || obj instanceof fabric.Textbox) return <span className="text-xs font-black truncate max-w-full px-1 text-gray-300">T</span>;
    if (obj instanceof fabric.Rect) return <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: typeof obj.fill === 'string' ? obj.fill : '#3b82f6' }} />;
    if (obj instanceof fabric.Circle) return <div className="h-4 w-4 rounded-full" style={{ backgroundColor: typeof obj.fill === 'string' ? obj.fill : '#10b981' }} />;
    if (obj.type === 'group') return <Folder className="h-4 w-4 text-blue-400" />;
    return <LayersIcon className="h-4 w-4 text-gray-500" />;
}
