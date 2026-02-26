"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Layout, Trash2, Clock, Save, Check, Folder, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

export default function TemplatePanel() {
    const { savedDesigns, saveToTemplate, loadTemplate, deleteDesign, brandKits } = useCanvas();
    const [designName, setDesignName] = useState("");
    const [selectedBrand, setSelectedBrand] = useState<string>("");
    const [lastSaved, setLastSaved] = useState(false);

    const handleSave = () => {
        if (!designName.trim()) return;
        saveToTemplate(designName, selectedBrand || undefined);
        setDesignName("");
        setLastSaved(true);
        setTimeout(() => setLastSaved(false), 2000);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this design?")) {
            deleteDesign(id);
        }
    };

    // Group designs by brand
    const groupedDesigns = useMemo(() => {
        const groups: Record<string, typeof savedDesigns> = {
            "Unassigned": []
        };
        brandKits.forEach(b => groups[b.id] = []);

        savedDesigns.forEach(d => {
            if (d.brandId && groups[d.brandId]) {
                groups[d.brandId].push(d);
            } else {
                groups["Unassigned"].push(d);
            }
        });

        // Remove empty groups
        return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
    }, [savedDesigns, brandKits]);

    return (
        <div className="flex h-full w-full flex-col bg-[#13151a]">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#1e2229]">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">My Designs</h3>
                <Layout className="h-4 w-4 text-gray-400" />
            </div>

            <div className="p-4 border-b border-white/5 bg-[#1e2229]">
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Name this design..."
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full rounded-xl bg-white/5 py-3 pl-4 pr-12 text-sm font-bold transition-all focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-gray-500 border border-white/5"
                    />

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 shadow-inner rounded-xl pl-3 pr-10 py-2.5 text-xs font-bold text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all hover:bg-white/10"
                            >
                                <option value="">No Brand</option>
                                {brandKits.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                        <button
                            onClick={handleSave}
                            className={`rounded-xl px-4 py-2.5 flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0
                    ${lastSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {lastSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {savedDesigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <Clock className="mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No designs saved</p>
                    </div>
                ) : (
                    Object.entries(groupedDesigns).map(([groupId, designs]) => (
                        <div key={groupId} className="space-y-3">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <Folder className="h-3 w-3" />
                                {groupId === "Unassigned" ? "Unassigned" : brandKits.find(b => b.id === groupId)?.name || "Unknown Brand"}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {designs.map((design) => (
                                    <div
                                        key={design.id}
                                        onClick={() => loadTemplate(design.data)}
                                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-2 transition-all hover:-translate-y-1 hover:bg-white/10 active:scale-95 flex flex-col"
                                    >
                                        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/50 border border-white/5 flex items-center justify-center relative">
                                            <img src={design.thumbnail} alt={design.name} className="h-full w-full object-contain" />
                                            <button
                                                onClick={(e) => handleDelete(design.id, e)}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between px-1">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-gray-200 truncate pr-2">{design.name}</p>
                                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{new Date(design.timestamp).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
