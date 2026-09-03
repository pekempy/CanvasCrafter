"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Trash2, RefreshCcw, RotateCw, FlipHorizontal, FlipVertical,
    Ghost, Lock, Unlock, Pin, PinOff, MoveUp, MoveDown,
} from "lucide-react";
import GradientPicker from "./GradientPicker";
import FontPicker from "./FontPicker";
import EffectsPanel from "./EffectsPanel";
import StrokePanel from "./StrokePanel";
import BrandColorPicker from "./BrandColorPicker";
import TypographyEffects from "./TypographyEffects";
import EdgeBorderPanel from "./EdgeBorderPanel";
import * as fabric from "fabric";
import CustomColorPicker from "./CustomColorPicker";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-5">
            <p className="section-label">{title}</p>
            {children}
        </section>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return <div className="rounded-app border border-line bg-surface-2 p-3">{children}</div>;
}

function Slider({ icon, label, value, display, min, max, step = 1, onChange }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex w-24 shrink-0 items-center gap-1.5 text-[12px] text-text-dim">
                {icon}<span>{label}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
            <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-text">{display}</span>
        </div>
    );
}

export default function PropertiesPanel() {
    const {
        selectedObject, deleteSelected, bringToFront, sendToBack,
        updateSelectedObject, clearEffects, updateMaskProperties, releaseMask,
        canvas,
    } = useCanvas() as any;

    if (!selectedObject) return null;
    const o = selectedObject;

    const isText =
        o.type === "text" || o.type === "i-text" || o.type === "textbox" ||
        o instanceof fabric.IText || o instanceof fabric.Textbox;
    const isEdgeBorderGroup = !!o.isEdgeBorderGroup;
    const checkIsImage = (x: any) => x && (x.type === "image" || x.type === "FabricImage" || x.isEdgeBorderGroup || x instanceof fabric.Image);
    const isImage = checkIsImage(o);
    const isMultiImage = o.type === "activeSelection" && o._objects?.every(checkIsImage);
    const hideFillStroke = isImage || isMultiImage;

    const fullyLocked = !o.selectable;
    const posLocked = !!o.lockMovementX && o.selectable;

    const applyToTargets = (fn: (x: any) => void) => {
        if (o.type === "activeSelection") { o._objects?.forEach(fn); fn(o); }
        else fn(o);
        canvas?.requestRenderAll();
        canvas?.fire("object:modified", { target: o });
        updateSelectedObject({ _lockStateTrigger: Date.now() });
    };

    const toggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !fullyLocked;
        applyToTargets((x) => x.set({
            lockMovementX: next, lockMovementY: next, lockRotation: next,
            lockScalingX: next, lockScalingY: next, lockSkewingX: next, lockScalingFlip: next,
            selectable: !next, evented: !next, hasControls: !next,
        }));
        if (next) canvas?.discardActiveObject();
    };

    const togglePositionLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !posLocked;
        applyToTargets((x) => x.set({
            lockMovementX: next, lockMovementY: next, lockScalingX: next, lockScalingY: next, lockRotation: next,
            selectable: true, evented: true,
            ...(!x.selectable ? { lockSkewingX: false, lockScalingFlip: false, hasControls: true } : {}),
        }));
    };

    return (
        <div className="panel">
            <div className="panel-head">
                <h2>Properties</h2>
                <div className="flex items-center gap-0.5">
                    <button onClick={togglePositionLock} className={`icon-btn h-7 w-7 ${posLocked ? "is-active" : ""}`} title={posLocked ? "Unlock position" : "Lock position"}>
                        {posLocked ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={toggleLock} className={`icon-btn h-7 w-7 ${fullyLocked ? "is-active" : ""}`} title={fullyLocked ? "Unlock" : "Lock"}>
                        {fullyLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={clearEffects} className="icon-btn h-7 w-7" title="Reset effects">
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={deleteSelected} className="icon-btn h-7 w-7 hover:text-danger" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="panel-body">
                {isText && (
                    <Section title="Text">
                        <Card>
                            <FontPicker inline />
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[12px] text-text-dim">Size</span>
                                <div className="flex items-center rounded-sm border border-line bg-surface pr-1.5">
                                    <input
                                        type="number"
                                        value={Math.round(o.fontSize || 40)}
                                        onChange={(e) => updateSelectedObject({ fontSize: parseInt(e.target.value) || 1 })}
                                        className="w-14 bg-transparent py-1.5 pl-2 text-right text-[13px] text-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                        style={{ border: "none" }}
                                    />
                                    <span className="text-[11px] text-text-mute">px</span>
                                </div>
                            </div>
                        </Card>
                        <div className="mt-2"><TypographyEffects /></div>
                    </Section>
                )}

                <Section title="Appearance">
                    <Card>
                        {!hideFillStroke && (
                            <div className="space-y-3">
                                <GradientPicker inline />
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-text-dim">Colour</span>
                                    <CustomColorPicker
                                        color={typeof o.fill === "string" ? o.fill : "#f2a91b"}
                                        onChange={(c) => updateSelectedObject({ fill: c })}
                                    />
                                </div>
                                <BrandColorPicker
                                    currentColor={typeof o.fill === "string" ? o.fill : ""}
                                    onChange={(c) => updateSelectedObject({ fill: c })}
                                />
                                <div className="h-px bg-line" />
                            </div>
                        )}
                        <div className={hideFillStroke ? "" : "pt-3"}>
                            <Slider
                                icon={<Ghost className="h-3.5 w-3.5" />}
                                label="Opacity"
                                value={o.opacity ?? 1}
                                display={`${Math.round((o.opacity ?? 1) * 100)}%`}
                                min={0} max={1} step={0.01}
                                onChange={(v: number) => updateSelectedObject({ opacity: v })}
                            />
                        </div>
                    </Card>
                </Section>

                {isEdgeBorderGroup && (
                    <Section title="Edge border">
                        <Card><EdgeBorderPanel /></Card>
                    </Section>
                )}

                {isImage && (
                    <Section title="Image adjustments">
                        <Card><EffectsPanel inline /></Card>
                    </Section>
                )}

                <Section title="Geometry">
                    <Card>
                        <div className="space-y-3">
                            <Slider
                                icon={<RotateCw className="h-3.5 w-3.5" />}
                                label="Rotation"
                                value={o.angle || 0}
                                display={`${Math.round(o.angle || 0)}°`}
                                min={0} max={360}
                                onChange={(v: number) => updateSelectedObject({ angle: v })}
                            />
                            <div className="flex items-center gap-3">
                                <span className="w-24 shrink-0 text-[12px] text-text-dim">Mirror</span>
                                <button onClick={() => updateSelectedObject({ flipX: !o.flipX })} className={`icon-btn ${o.flipX ? "is-active" : ""}`}><FlipHorizontal className="h-4 w-4" /></button>
                                <button onClick={() => updateSelectedObject({ flipY: !o.flipY })} className={`icon-btn ${o.flipY ? "is-active" : ""}`}><FlipVertical className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </Card>
                </Section>

                {!hideFillStroke && (
                    <Section title="Outline">
                        <Card><StrokePanel /></Card>
                    </Section>
                )}

                {!hideFillStroke && (
                    <Section title="Shadow">
                        <Card><EffectsPanel inline /></Card>
                    </Section>
                )}

                <Section title="Layer order">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={bringToFront} className="btn btn-sm"><MoveUp className="h-3.5 w-3.5" /> To front</button>
                        <button onClick={sendToBack} className="btn btn-sm"><MoveDown className="h-3.5 w-3.5" /> To back</button>
                    </div>
                </Section>

                {o.clipPath && (
                    <Section title="Mask">
                        <Card>
                            <div className="mb-2 flex justify-end">
                                <button onClick={releaseMask} className="btn btn-sm">Release mask</button>
                            </div>
                            <div className="space-y-3">
                                <Slider label="Scale" value={o.clipPath.scaleX || 1} display={(o.clipPath.scaleX || 1).toFixed(1)} min={0.1} max={3} step={0.01}
                                    onChange={(v: number) => updateMaskProperties({ scaleX: v, scaleY: v })} />
                                <Slider label="X" value={o.clipPath.left || 0} display={Math.round(o.clipPath.left || 0)} min={-300} max={300}
                                    onChange={(v: number) => updateMaskProperties({ left: v })} />
                                <Slider label="Y" value={o.clipPath.top || 0} display={Math.round(o.clipPath.top || 0)} min={-300} max={300}
                                    onChange={(v: number) => updateMaskProperties({ top: v })} />
                            </div>
                        </Card>
                    </Section>
                )}
            </div>
        </div>
    );
}
