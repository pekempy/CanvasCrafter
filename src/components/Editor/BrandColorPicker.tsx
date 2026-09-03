"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function BrandColorPicker({
    currentColor,
    onChange,
}: {
    currentColor: string;
    onChange: (color: string) => void;
}) {
    const { brandKits, savedDesigns, currentDesignId } = useCanvas() as any;
    const [showAll, setShowAll] = useState(false);

    const activeKit = useMemo(() => {
        const bId = savedDesigns?.find((d: any) => d.id === currentDesignId)?.brandId;
        return brandKits.find((k: any) => k.id === bId) || brandKits[0];
    }, [brandKits, savedDesigns, currentDesignId]);

    if (!brandKits.length) return null;
    const kits = showAll ? brandKits : [activeKit].filter(Boolean);

    return (
        <div className="mt-1">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] text-text-dim">Brand colours</span>
                {brandKits.length > 1 && (
                    <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 text-[11px] text-text-mute hover:text-text">
                        {showAll ? "This club only" : "All clubs"}
                        <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
                    </button>
                )}
            </div>
            <div className={`space-y-2 ${showAll ? "max-h-40 overflow-y-auto pr-1" : ""}`}>
                {kits.map((kit: any) => (
                    <div key={kit.id}>
                        {showAll && <p className="mb-1 text-[11px] text-text-mute">{kit.name}</p>}
                        <div className="flex flex-wrap gap-1.5">
                            {kit.colors.map((color: string, i: number) => (
                                <button
                                    key={`${kit.id}-${i}`}
                                    onClick={() => onChange(color)}
                                    className={`h-6 w-6 rounded-sm border transition-transform hover:scale-110 ${
                                        currentColor?.toLowerCase() === color.toLowerCase() ? "border-gold" : "border-line"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
