"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Trash2, ChevronUp, ChevronDown, Layers as LayersIcon, Eye, EyeOff, Lock, Unlock, Group, Ungroup, Folder, FolderOpen, Plus, Pin, PinOff } from "lucide-react";
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
        const isCurrentlyFullyLocked = !obj.selectable;
        const newLockState = !isCurrentlyFullyLocked;
        
        obj.set({
            lockMovementX: newLockState,
            lockMovementY: newLockState,
            lockRotation: newLockState,
            lockScalingX: newLockState,
            lockScalingY: newLockState,
            lockSkewingX: newLockState,
            lockSkewingY: newLockState,
            lockScalingFlip: newLockState,
            selectable: !newLockState, // Locked items cannot be selected on canvas
            evented: !newLockState,    // Mouse events pass through locked items
            hasControls: !newLockState, // No handles for locked items
        });

        if (newLockState && canvas?.getActiveObject() === obj) {
            canvas.discardActiveObject();
        }

        canvas?.requestRenderAll();
        // Force an update for all components listening to canvas changes
        if ((canvas as any).fire) (canvas as any).fire('object:modified', { target: obj });
        setLayers([...(canvas?.getObjects() || [])].reverse());
    };

    const togglePositionLock = (obj: fabric.Object) => {
        // If it was fully locked, unlock it first to position lock it
        const isFullyLocked = !obj.selectable;
        
        const isPositionLocked = !!obj.lockMovementX && obj.selectable;
        const newState = !isPositionLocked;

        obj.set({
            lockMovementX: newState,
            lockMovementY: newState,
            lockScalingX: newState,
            lockScalingY: newState,
            lockRotation: newState,
            // If we are position locking, ensure it's selectable
            selectable: true,
            evented: true,
            // Keep other locks as they were if not fully locked, or reset if fully locked
            ...(isFullyLocked ? {
                lockSkewingX: false,
                lockSkewingY: false,
                lockScalingFlip: false,
                hasControls: true,
            } : {})
        });

        canvas?.requestRenderAll();
        if ((canvas as any).fire) (canvas as any).fire('object:modified', { target: obj });
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
                    className={`row group ${isSelected ? "is-active" : ""}`}
                    style={{ marginLeft: `${depth * 14}px` }}
                >
                    {isGroup && (
                        <button onClick={(e) => toggleGroup(objId, e)} className="icon-btn h-5 w-5 z-10">
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                        </button>
                    )}

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line bg-surface-3 pointer-events-none">
                        <LayerPreview obj={obj} />
                    </div>

                    <div className="min-w-0 flex-1" onDoubleClick={(e) => startEditing(obj, e)}>
                        {editingLayer === obj ? (
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={submitEdit}
                                onKeyDown={handleKeyDown}
                                className="field h-6"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className={`truncate text-[12px] font-medium ${isSelected ? "text-gold" : "text-text"}`}>
                                {getLayerName(obj)}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); toggleVisibility(obj); }} className="icon-btn h-6 w-6" title={obj.visible ? "Hide" : "Show"}>
                            {obj.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-danger" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); togglePositionLock(obj); }} className={`icon-btn h-6 w-6 ${obj.lockMovementX && obj.selectable ? "is-active" : ""}`} title="Lock position">
                            {obj.lockMovementX && obj.selectable ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleLock(obj); }} className={`icon-btn h-6 w-6 ${!obj.selectable ? "is-active" : ""}`} title="Lock layer">
                            {!obj.selectable ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
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
            canvas.discardActiveObject();
            canvas.setActiveObject(obj);
        }

        canvas.requestRenderAll();
        // Force state update in useCanvasStore
        canvas.fire('selection:created');
        canvas.fire('selection:updated');
    };

    return (
        <div className="panel">
            <div className="panel-head">
                <h2>Layers</h2>
                {selectedObject && (
                    selectedObject.type === "group" ? (
                        <button onClick={(e) => { e.stopPropagation(); ungroupSelected(); }} className="btn btn-sm">
                            <FolderOpen className="h-3.5 w-3.5" /> Ungroup
                        </button>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); groupSelected(); }} className="btn btn-sm">
                            <Folder className="h-3.5 w-3.5" /> {selectedObject.type === "activeSelection" ? "Group" : "Folder"}
                        </button>
                    )
                )}
            </div>

            <div className="panel-body space-y-1">
                {layers.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center text-text-mute">
                        <Plus className="h-7 w-7" />
                        <p className="text-[12px]">Add something to the canvas to see it here.</p>
                    </div>
                ) : (
                    layers.map((obj) => renderLayer(obj))
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
    if (obj instanceof fabric.IText || obj instanceof fabric.Textbox) return <span className="text-[11px] font-semibold text-text-dim">T</span>;
    if (obj instanceof fabric.Rect) return <div className="h-3.5 w-3.5 rounded-[2px]" style={{ backgroundColor: typeof obj.fill === "string" ? obj.fill : "#f2a91b" }} />;
    if (obj instanceof fabric.Circle) return <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: typeof obj.fill === "string" ? obj.fill : "#f2a91b" }} />;
    if (obj.type === "group") return <Folder className="h-3.5 w-3.5 text-text-dim" />;
    return <LayersIcon className="h-3.5 w-3.5 text-text-mute" />;
}
