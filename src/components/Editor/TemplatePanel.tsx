"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Layout, Trash2, Clock, Save, Check, Folder, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

export default function TemplatePanel() {
    const { savedDesigns, saveToTemplate, loadTemplate, deleteDesign, brandKits } = useCanvas();
    const [designName, setDesignName] = useState("");
    const [selectedBrand, setSelectedBrand] = useState<string>("");
    const [selectedParent, setSelectedParent] = useState<string>("none");
    const [lastSaved, setLastSaved] = useState(false);
    const [expandedMasters, setExpandedMasters] = useState<Set<string>>(new Set());

    const masters = useMemo(() => savedDesigns.filter(d => !d.parentId), [savedDesigns]);

    const handleSave = () => {
        if (!designName.trim()) return;
        saveToTemplate(designName, selectedBrand || undefined, selectedParent === "none" ? undefined : selectedParent);
        setDesignName("");
        setLastSaved(true);
        setTimeout(() => setLastSaved(false), 2000);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this design? This will also delete any versions if it's a master.")) {
            deleteDesign(id);
            // Also delete versions if it's a master? The store deleteDesign should handle that or we can filter here.
            // For now let's assume flat deletion or manual.
        }
    };

    const toggleMaster = (id: string) => {
        const next = new Set(expandedMasters);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedMasters(next);
    };

    // Sorting logic for masters
    const sortedMasters = useMemo(() => {
        return [...masters].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }, [masters]);

    // Grouping logic for display
    const organizedTemplates = useMemo(() => {
        const groups: Record<string, { master: any, versions: any[] }> = {};

        sortedMasters.forEach(m => {
            const versions = savedDesigns
                .filter(v => v.parentId === m.id)
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            groups[m.id] = { master: m, versions };
        });

        return groups;
    }, [sortedMasters, savedDesigns]);

    return (
        <div className="flex h-full w-full flex-col bg-[#13151a]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#1e2229]">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Templates & Versions</h3>
                <Layout className="h-4 w-4 text-gray-400" />
            </div>

            {/* Save Section */}
            <div className="p-4 border-b border-white/5 bg-[#1e2229]">
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Template Name..."
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="w-full rounded-xl bg-white/5 py-2.5 px-4 text-xs font-bold transition-all focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-gray-500 border border-white/5"
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-3 pr-8 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none appearance-none hover:bg-white/10 transition-colors"
                            >
                                <option value="">No Brand</option>
                                {brandKits.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })).map(b => (
                                    <option key={b.id} value={b.id}>🏷️ {b.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={selectedParent}
                                onChange={(e) => setSelectedParent(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl pl-3 pr-8 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none appearance-none hover:bg-white/10 transition-colors"
                            >
                                <option value="none">New Master</option>
                                {sortedMasters.map(m => (
                                    <option key={m.id} value={m.id}>📂 {m.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className={`w-full rounded-xl py-2 flex items-center justify-center text-white transition-all shadow-md active:scale-95 space-x-2
                ${lastSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {lastSaved ? (
                            <>
                                <Check className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Saved Successfully</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Save Template</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {masters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <Folder className="mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No Templates Found</p>
                    </div>
                ) : (
                    Object.values(organizedTemplates).map(({ master, versions }) => (
                        <div key={master.id} className="space-y-1">
                            {/* Master Card / Folder Row */}
                            <div
                                onClick={() => loadTemplate(master.data, master.name)}
                                className="group relative flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/10 transition-all border-l-4 border-l-blue-500"
                            >
                                <div className="h-12 w-16 overflow-hidden rounded-lg bg-black border border-white/5 shrink-0">
                                    <img src={master.thumbnail} alt={master.name} className="h-full w-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-white uppercase tracking-wider truncate">{master.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                                            MASTER • {versions.length} VERSIONS
                                        </p>
                                        {master.brandId && (
                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest truncate max-w-[80px]">
                                                {brandKits.find(b => b.id === master.brandId)?.name || 'BRAND'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {versions.length > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleMaster(master.id); }}
                                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${expandedMasters.has(master.id) ? 'rotate-180 text-blue-400' : 'text-gray-500'}`}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => handleDelete(master.id, e)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Versions (Expanded) */}
                            {expandedMasters.has(master.id) && versions.length > 0 && (
                                <div className="ml-6 space-y-1 mt-1 border-l border-white/10 pl-3">
                                    {versions.map(version => (
                                        <div
                                            key={version.id}
                                            onClick={() => loadTemplate(version.data, version.name)}
                                            className="group flex items-center gap-3 bg-white/2 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-xs"
                                        >
                                            <div className="h-8 w-10 overflow-hidden rounded-md bg-black/40 shrink-0">
                                                <img src={version.thumbnail} alt={version.name} className="h-full w-full object-contain opacity-70 group-hover:opacity-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 truncate group-hover:text-gray-200">{version.name}</p>
                                                <p className="text-[7px] text-gray-600 font-bold uppercase tracking-wider">{new Date(version.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(version.id, e)}
                                                className="p-1 rounded-md text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
