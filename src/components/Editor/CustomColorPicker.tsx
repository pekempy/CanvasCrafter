"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Pipette, X, Check, Palette, Bookmark } from "lucide-react";
import { useCanvas } from "@/store/useCanvasStore";

interface CustomColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
    className?: string;
}

// Helper: Hex to HSV
const hexToHsv = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;

    let d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h, s, v };
};

// Helper: HSV to Hex
const hsvToHex = (h: number, s: number, v: number) => {
    let r: number = 0, g: number = 0, b: number = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    const toHex = (n: number) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Helper: Get Contrast Color (Black or White)
const getContrastColor = (hex: string) => {
    if (!hex.startsWith('#') || hex.length !== 7) return "white";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
};

export default function CustomColorPicker({ color, onChange, label, className = "" }: CustomColorPickerProps) {
    const { brandKits } = useCanvas();
    const [isOpen, setIsOpen] = useState(false);
    const [hsv, setHsv] = useState(() => hexToHsv(color.startsWith('#') ? color : '#3b82f6'));
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const saturationRef = useRef<HTMLDivElement>(null);
    const [isPicking, setIsPicking] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [previewColor, setPreviewColor] = useState("#3b82f6");


    useEffect(() => {
        if (color.startsWith('#') && color.length === 7) {
            const newHsv = hexToHsv(color);
            setHsv(prev => {
                if (Math.abs(prev.s - newHsv.s) > 0.01 || Math.abs(prev.v - newHsv.v) > 0.01 || (newHsv.s > 0 && Math.abs(prev.h - newHsv.h) > 0.01)) {
                    return newHsv;
                }
                return prev;
            });
        }
    }, [color]);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Default offset
            let top = rect.top - 12;
            let left = rect.left;

            // If near top, flip to bottom
            if (top < 350) {
                top = rect.bottom + 12;
            }

            // Keep in horizontal bounds
            if (left + 256 > window.innerWidth) {
                left = window.innerWidth - 272;
            }

            setCoords({ top, left });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", () => setIsOpen(false), true);
            window.addEventListener("resize", () => setIsOpen(false));
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", () => setIsOpen(false), true);
            window.removeEventListener("resize", () => setIsOpen(false));
        };
    }, [isOpen]);

    const handleSaturationChange = (e: React.MouseEvent | React.TouchEvent) => {
        if (!saturationRef.current) return;
        const rect = saturationRef.current.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const y = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const s = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        const v = Math.max(0, Math.min(1, 1 - (y - rect.top) / rect.height));

        const newHsv = { ...hsv, s, v };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
    };

    const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const h = parseFloat(e.target.value) / 360;
        const newHsv = { ...hsv, h };
        setHsv(newHsv);
        onChange(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
    };

    const handleEyeDropper = async () => {
        if (typeof window !== 'undefined' && 'EyeDropper' in window) {
            try {
                const eyeDropper = new (window as any).EyeDropper();
                const result = await eyeDropper.open();
                onChange(result.sRGBHex);
                setIsOpen(false);
            } catch (err) {
                console.error("EyeDropper failed:", err);
            }
        } else {
            // In-browser fallback: DOM & Canvas Sampling Mode
            setIsOpen(false);
            setIsPicking(true);

            const sampleColor = (clientX: number, clientY: number) => {
                let color = "#3b82f6";
                const element = document.elementFromPoint(clientX, clientY);

                if (element) {
                    // Optimized Fabric.js sampling
                    const container = element.closest('.canvas-container');
                    const targetCanvas = container ? container.querySelector('.lower-canvas') as HTMLCanvasElement : (element.tagName === 'CANVAS' ? element as HTMLCanvasElement : null);

                    if (targetCanvas) {
                        try {
                            const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
                            if (ctx) {
                                const rect = targetCanvas.getBoundingClientRect();
                                const x = (clientX - rect.left) * (targetCanvas.width / rect.width);
                                const y = (clientY - rect.top) * (targetCanvas.height / rect.height);
                                const pixel = ctx.getImageData(x, y, 1, 1).data;
                                if (pixel[3] > 0) {
                                    color = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
                                }
                            }
                        } catch (e) { }
                    } else {
                        let current: HTMLElement | null = element as HTMLElement;
                        while (current && current !== document.body) {
                            const style = window.getComputedStyle(current);
                            const bg = style.backgroundColor;
                            const rgb = bg.match(/\d+/g);
                            if (rgb && rgb.length >= 3 && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && (rgb.length === 3 || parseInt(rgb[3]) > 0)) {
                                color = "#" + rgb.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
                                break;
                            }
                            current = current.parentElement;
                        }
                    }
                }
                return color;
            };

            const handleMouseMove = (e: MouseEvent) => {
                setMousePos({ x: e.clientX, y: e.clientY });
                setPreviewColor(sampleColor(e.clientX, e.clientY));
            };

            const handleInteraction = (e: MouseEvent | PointerEvent) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (e.type === 'click' || e.type === 'pointerup') {
                    const finalColor = sampleColor(e.clientX, e.clientY);
                    onChange(finalColor);
                    cleanup();
                }
            };

            const cleanup = () => {
                setIsPicking(false);
                window.removeEventListener('click', handleInteraction, true);
                window.removeEventListener('mousedown', handleInteraction, true);
                window.removeEventListener('mouseup', handleInteraction, true);
                window.removeEventListener('pointerdown', handleInteraction, true);
                window.removeEventListener('pointerup', handleInteraction, true);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('keydown', handleKeydown);
                document.body.style.cursor = 'default';
            };

            const handleKeydown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') cleanup();
            };

            document.body.style.cursor = 'crosshair';
            window.addEventListener('click', handleInteraction, true);
            window.addEventListener('mousedown', handleInteraction, true);
            window.addEventListener('mouseup', handleInteraction, true);
            window.addEventListener('pointerdown', handleInteraction, true);
            window.addEventListener('pointerup', handleInteraction, true);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('keydown', handleKeydown);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-1.5 hover:bg-white/10 transition-all active:scale-95 group"
                title={label || "Pick Color"}
            >
                <div
                    className="w-8 h-8 rounded-lg border border-white/10 shadow-inner flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: color }}
                >
                    <Palette
                        className="h-4 w-4 transition-transform group-hover:scale-110"
                        style={{ color: getContrastColor(color) }}
                    />
                </div>
                {label && <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{label}</span>}
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[10000] w-64 rounded-3xl bg-[#1e2229] border border-white/10 p-4 shadow-2xl animate-in zoom-in-95 duration-200"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: coords.top < 400 ? 'translateY(0)' : 'translateY(-100%)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Palette className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color Palette</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Saturation/Brightness Square */}
                    <div
                        ref={saturationRef}
                        onMouseDown={(e) => {
                            handleSaturationChange(e);
                            const onMouseMove = (moveEvent: MouseEvent) => handleSaturationChange(moveEvent as any);
                            const onMouseUp = () => {
                                document.removeEventListener("mousemove", onMouseMove);
                                document.removeEventListener("mouseup", onMouseUp);
                            };
                            document.addEventListener("mousemove", onMouseMove);
                            document.addEventListener("mouseup", onMouseUp);
                        }}
                        className="relative w-full aspect-square rounded-2xl mb-4 cursor-crosshair overflow-hidden"
                        style={{
                            backgroundColor: hsvToHex(hsv.h, 1, 1),
                            backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)`
                        }}
                    >
                        <div
                            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{
                                left: `${hsv.s * 100}%`,
                                top: `${(1 - hsv.v) * 100}%`,
                                backgroundColor: color
                            }}
                        />
                    </div>

                    {/* Hue Slider */}
                    <div className="space-y-4">
                        <div className="relative h-3 w-full rounded-full overflow-hidden" style={{
                            backgroundImage: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)`
                        }}>
                            <input
                                type="range"
                                min="0" max="360"
                                value={hsv.h * 360}
                                onChange={handleHueChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="absolute top-0 bottom-0 w-3 border-2 border-white rounded-full shadow-md pointer-events-none -translate-x-1/2"
                                style={{ left: `${hsv.h * 100}%`, backgroundColor: hsvToHex(hsv.h, 1, 1) }}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/5 rounded-xl border border-white/5 px-3 py-2 flex items-center justify-between">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">HEX</span>
                                <input
                                    type="text"
                                    value={color.toUpperCase()}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                            onChange(val);
                                        }
                                    }}
                                    className="bg-transparent border-none outline-none text-right text-[8px] font-bold text-white w-12"
                                />
                            </div>

                            <button
                                onClick={handleEyeDropper}
                                className="p-2.5 rounded-xl transition-all shadow-lg group active:scale-90 bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20"
                                title="Eye Dropper"
                            >
                                <Pipette className="h-4 w-4 transition-transform group-hover:scale-110" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <Bookmark className="h-3 w-3 text-blue-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Brand Kit Colours</span>
                            </div>
                            <span className="text-[8px] font-bold text-gray-600 uppercase">{brandKits.length} Kits</span>
                        </div>

                        <div className="max-h-40 overflow-y-auto pr-2 space-y-4 custom-scrollbar overflow-x-hidden">
                            {brandKits.length > 0 ? (
                                brandKits.map((kit) => (
                                    <div key={kit.id} className="space-y-2 group/kit">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter px-1 group-hover/kit:text-white transition-colors">
                                            {kit.name}
                                        </p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {kit.colors.map((c, idx) => (
                                                <button
                                                    key={`${kit.id}-${idx}`}
                                                    onClick={() => onChange(c)}
                                                    className={`w-full aspect-square rounded-lg border transition-all active:scale-75 hover:scale-110 shadow-sm
                                                        ${color.toLowerCase() === c.toLowerCase() ? 'border-white ring-2 ring-blue-500/50' : 'border-white/5 hover:border-white/20'}`}
                                                    style={{ backgroundColor: c }}
                                                    title={c}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 flex flex-col items-center gap-2 border border-dashed border-white/5 rounded-2xl mx-1">
                                    <Palette className="h-5 w-5 text-gray-700" />
                                    <p className="text-[8px] font-bold text-gray-600 italic">No brand kits available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Picking Mode Overlay */}
            {isPicking && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[10001] pointer-events-none">
                    <div
                        className="absolute flex items-center gap-3 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full border border-black/10 shadow-2xl transition-transform"
                        style={{
                            left: mousePos.x + 20,
                            top: mousePos.y + 20,
                        }}
                    >
                        <div
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: previewColor }}
                        />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-black leading-none">{previewColor.toUpperCase()}</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">Click to select</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-1 border-l border-black/5 pl-3">
                            <span className="bg-black/5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-gray-400">ESC to exit</span>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
