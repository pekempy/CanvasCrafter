"use client";

import { useCanvas } from "@/store/useCanvasStore";

export default function BrandColorPicker({
    currentColor,
    onChange
}: {
    currentColor: string;
    onChange: (color: string) => void;
}) {
    const { brandKits } = useCanvas();

    if (brandKits.length === 0) return null;

    return (
        <div className="mt-4 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Brand Colours</p>
            <div className="space-y-3 max-h-32 overflow-y-auto scrollbar-hide pr-1">
                {brandKits.map(kit => (
                    <div key={kit.id} className="space-y-1.5">
                        <p className="text-[9px] font-bold text-gray-400">{kit.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {kit.colors.map((color, i) => (
                                <button
                                    key={`${kit.id}-${i}`}
                                    onClick={() => onChange(color)}
                                    className={`h-6 w-6 rounded-md border transition-all hover:scale-110 active:scale-95 ${currentColor === color ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]' : 'border-white/10'
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
