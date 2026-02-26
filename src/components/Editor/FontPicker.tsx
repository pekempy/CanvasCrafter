"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { GOOGLE_FONTS } from "@/lib/fonts";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import WebFont from "webfontloader";
import * as fabric from "fabric";

function useInView(options = {}) {
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.disconnect();
            }
        }, options);

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, inView };
}

function LazyFontItem({ font, selectedFamily, loadingFont, onSelect }: { font: any, selectedFamily: string, loadingFont: string | null, onSelect: (fontName: string, isCustom: boolean) => void }) {
    const { ref, inView } = useInView({ rootMargin: '100px 0px' });
    const isSelected = selectedFamily === font.name;

    // Load just the font name characters for the preview for ultra-fast eager loading
    useEffect(() => {
        if (inView && !font.isCustom) {
            const fontId = `eager-font-${font.name.replace(/\s+/g, '-')}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement("link");
                link.id = fontId;
                link.rel = "stylesheet";
                link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}&text=${encodeURIComponent(font.name)}`;
                document.head.appendChild(link);
            }
        }
    }, [inView, font]);

    return (
        <button
            ref={ref}
            onClick={() => onSelect(font.name, font.isCustom)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all hover:bg-white/5
                ${isSelected ? 'bg-blue-600/10 text-blue-500 border border-blue-500/30' : 'text-gray-400 border border-transparent'}`}
        >
            <span style={{ fontFamily: inView || font.isCustom ? `"${font.name}"` : 'inherit' }} className="text-sm flex items-center gap-2">
                {font.name}
                {font.isCustom && <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-gray-500 uppercase">Custom</span>}
            </span>
            {loadingFont === font.name && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
        </button>
    );
}

export default function FontPicker({
    isOpen = true,
    onClose,
    inline = false,
    onSelect,
    selectedFamily: customSelectedFamily
}: {
    isOpen?: boolean;
    onClose?: () => void;
    inline?: boolean;
    onSelect?: (fontName: string, isCustom: boolean) => void;
    selectedFamily?: string;
}) {
    const { selectedObject, updateSelectedObject, canvas, customFonts } = useCanvas();
    const [search, setSearch] = useState("");
    const [loadingFont, setLoadingFont] = useState<string | null>(null);

    if (!isOpen && !inline) return null;

    const allFonts = [
        ...customFonts.map(f => ({ name: f.name, isCustom: true })),
        ...GOOGLE_FONTS.map(f => ({ name: f, isCustom: false }))
    ];

    const filteredFonts = allFonts.filter(font =>
        font.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleFontSelect = (fontName: string, isCustom: boolean) => {
        if (onSelect) {
            onSelect(fontName, isCustom);
            return;
        }

        if (!selectedObject || !(selectedObject instanceof fabric.IText || selectedObject instanceof fabric.Textbox)) return;

        if (isCustom) {
            updateSelectedObject({ fontFamily: fontName });
            if (canvas) canvas.renderAll();
            return;
        }

        setLoadingFont(fontName);
        WebFont.load({
            google: { families: [fontName] },
            active: () => {
                updateSelectedObject({ fontFamily: fontName });
                setLoadingFont(null);
                if (canvas) canvas.renderAll();
            },
            inactive: () => {
                console.error(`Failed to load font: ${fontName}`);
                setLoadingFont(null);
            }
        });
    };

    const containerClass = inline
        ? "w-full"
        : "absolute top-14 left-0 z-[110] w-64 rounded-2xl bg-[#1e2229] p-4 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-200";

    const displaySelectedFamily = customSelectedFamily || (selectedObject as any)?.fontFamily;

    return (
        <div className={containerClass}>
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Fonts</h3>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/5 py-2 pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>

            <div className="max-h-64 overflow-y-auto pr-1 scrollbar-hide space-y-1">
                {filteredFonts.slice(0, 500).map((font) => (
                    <LazyFontItem
                        key={font.name}
                        font={font}
                        selectedFamily={displaySelectedFamily}
                        loadingFont={loadingFont}
                        onSelect={handleFontSelect}
                    />
                ))}
            </div>
        </div>
    );
}
