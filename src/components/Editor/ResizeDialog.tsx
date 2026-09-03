"use client";

import { useState, useEffect } from "react";
import { useCanvas } from "@/store/useCanvasStore";
import { X, Monitor, Facebook, Instagram, Twitter, Cloud, Trash2, Plus, Check } from "lucide-react";

const ICON: Record<string, any> = {
    instagram: <Instagram className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    monitor: <Monitor className="h-4 w-4" />,
    cloud: <Cloud className="h-4 w-4" />,
};

export default function ResizeDialog() {
    const {
        canvasSize, canvas, presets, setPresets, deletePreset,
        isResizeOpen: isOpen, setIsResizeOpen,
        switchTemplateSize, activeTemplateId,
    } = useCanvas() as any;

    const onClose = () => setIsResizeOpen(false);
    const [width, setWidth] = useState(canvasSize.width);
    const [height, setHeight] = useState(canvasSize.height);
    const [newName, setNewName] = useState("");
    const [confirmDel, setConfirmDel] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) { setWidth(canvasSize.width || 1080); setHeight(canvasSize.height || 1080); }
    }, [isOpen, canvasSize.width, canvasSize.height]);

    if (!isOpen) return null;

    const apply = (w: number, h: number) => {
        const W = Math.min(5000, Math.max(1, w));
        const H = Math.min(5000, Math.max(1, h));
        switchTemplateSize(W, H);
        onClose();
    };

    const savePreset = () => {
        if (!newName.trim()) return;
        const i = presets.findIndex((p: any) => p.name.toLowerCase() === newName.toLowerCase());
        if (i > -1) {
            const next = [...presets];
            next[i] = { ...next[i], width, height };
            setPresets(next);
        } else {
            setPresets([...presets, { id: Math.random().toString(36).slice(2, 9), name: newName, width, height, iconType: "cloud" }]);
        }
        setNewName("");
    };

    const delPreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDel === id) { deletePreset(id); setConfirmDel(null); }
        else { setConfirmDel(id); setTimeout(() => setConfirmDel((p) => (p === id ? null : p)), 2500); }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-lg border border-line bg-surface p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-[15px] font-semibold text-text">Canvas size</h2>
                        <p className="text-[12px] text-text-dim">
                            {activeTemplateId
                                ? "This template re-lays-out to fit the size you pick."
                                : "Pick a size, or set custom dimensions."}
                        </p>
                    </div>
                    <button onClick={onClose} className="icon-btn"><X className="h-4 w-4" /></button>
                </div>

                <div className="mb-4 space-y-1.5">
                    {presets.map((p: any) => {
                        const active = canvasSize.width === p.width && canvasSize.height === p.height;
                        return (
                            <button
                                key={p.id}
                                onClick={() => apply(p.width, p.height)}
                                className={`row w-full ${active ? "is-active" : ""}`}
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-surface-3 text-text-dim">
                                    {ICON[p.iconType || "cloud"]}
                                </span>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="text-[13px] font-medium text-text">{p.name}</p>
                                    <p className="text-[11px] tabular-nums text-text-mute">{p.width} × {p.height}</p>
                                </div>
                                {active && <Check className="h-4 w-4 text-gold" />}
                                <span
                                    onClick={(e) => delPreset(p.id, e)}
                                    className={`icon-btn h-7 w-7 ${confirmDel === p.id ? "text-danger" : ""}`}
                                >
                                    {confirmDel === p.id ? <Check className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-app border border-line bg-surface-2 p-3">
                    <p className="section-label">Custom size</p>
                    <div className="flex items-center gap-2">
                        <input type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 0)} className="field" />
                        <span className="text-text-mute">×</span>
                        <input type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="field" />
                        <button onClick={() => apply(width, height)} className="btn btn-primary shrink-0">Apply</button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Save this size as a preset"
                            className="field"
                        />
                        <button onClick={savePreset} disabled={!newName.trim()} className="btn shrink-0">
                            <Plus className="h-3.5 w-3.5" /> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
