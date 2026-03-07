"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Palette, Type, ChevronRight, Hash } from "lucide-react";
import WebFont from "webfontloader";

export default function BrandShortcuts() {
    const { brandKits, updateSelectedObject } = useCanvas();

    if (brandKits.length === 0) return null;

    const handleFontClick = (font: string) => {
        WebFont.load({
            google: { families: [font] },
            active: () => {
                updateSelectedObject({ fontFamily: font });
            }
        });
    };

    const handleColorClick = (color: string) => {
        updateSelectedObject({ fill: color });
    };

    return (
        <div className="p-6 space-y-8 pb-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Brand Assets</h3>
            
            {brandKits.map(kit => (
                <div key={kit.id} className="p-4 rounded-3xl bg-white/2 border border-white/5 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/90">{kit.name}</h4>
                    </div>

                    {/* Colors */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="h-3 w-3 text-gray-600" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Colours</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {kit.colors.map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleColorClick(color)}
                                    className="w-7 h-7 rounded-xl border-2 border-transparent hover:border-white hover:scale-110 transition-all shadow-lg active:scale-95"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            {kit.colors.length === 0 && (
                                <p className="text-[8px] text-gray-600 italic">No colors defined</p>
                            )}
                        </div>
                    </div>

                    {/* Fonts */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Type className="h-3 w-3 text-gray-600" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Fonts</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {kit.fonts.map((font, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleFontClick(font)}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all text-left group"
                                >
                                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-white truncate" style={{ fontFamily: font }}>
                                        {font}
                                    </span>
                                    <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            ))}
                            {kit.fonts.length === 0 && (
                                <p className="text-[8px] text-gray-600 italic">No fonts defined</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
