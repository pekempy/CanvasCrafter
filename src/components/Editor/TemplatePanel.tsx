"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Layout, Trash2, Clock, Save, Check, Folder, ChevronDown, Globe } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function TemplatePanel() {
    const { savedDesigns, setSavedDesigns, saveToTemplate, loadTemplate, deleteDesign, brandKits, canvasName, designName, setDesignName, currentDesignId } = useCanvas();
    const [selectedBrand, setSelectedBrand] = useState<string>("");
    const [selectedParent, setSelectedParent] = useState<string>("none");
    const [lastSaved, setLastSaved] = useState(false);
    const [expandedMasters, setExpandedMasters] = useState<Set<string>>(new Set());
    const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set(["no-brand"]));

    const masters = useMemo(() => savedDesigns.filter(d => !d.parentId), [savedDesigns]);

    // Sync UI selectors with current design
    useEffect(() => {
        if (currentDesignId) {
            const current = savedDesigns.find(d => d.id === currentDesignId);
            if (current) {
                setSelectedBrand(current.brandId || "");
                setSelectedParent(current.parentId || "none");
            }
        }
    }, [currentDesignId, savedDesigns]);

    const isOverwrite = useMemo(() => {
        if (!designName.trim()) return false;
        return savedDesigns.some(d => 
            d.name.toLowerCase() === designName.trim().toLowerCase() && 
            d.brandId === (selectedBrand || undefined) && 
            d.parentId === (selectedParent === "none" ? undefined : selectedParent)
        );
    }, [designName, selectedBrand, selectedParent, savedDesigns]);

    const handleSave = () => {
        const nameToSave = designName.trim() || canvasName || "Untitled Template";
        // If it's an overwrite, we don't forceNew. If it's new, we forceNew (to avoid accidentally updating currentDesignId if they just typed a new name)
        saveToTemplate(nameToSave, selectedBrand || undefined, selectedParent === "none" ? undefined : selectedParent, !isOverwrite);
        setLastSaved(true);
        setTimeout(() => setLastSaved(false), 3000);
    };

    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmingDeleteId === id) {
            deleteDesign(id);
            setConfirmingDeleteId(null);
        } else {
            setConfirmingDeleteId(id);
            // Auto-reset after 3 seconds if not confirmed
            setTimeout(() => {
                setConfirmingDeleteId(prev => prev === id ? null : prev);
            }, 3000);
        }
    };

    const toggleMaster = (id: string) => {
        const next = new Set(expandedMasters);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedMasters(next);
    };

    const toggleBrand = (id: string) => {
        const next = new Set(expandedBrands);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedBrands(next);
    };

    // Sorting logic for masters
    const sortedMasters = useMemo(() => {
        return [...masters].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }, [masters]);

    // Grouping logic for display: { [brandId]: { [masterId]: { master, versions } } }
    const templatesByBrand = useMemo(() => {
        const brands: Record<string, Record<string, { master: any, versions: any[] }>> = {};

        sortedMasters.forEach(m => {
            const brandId = m.brandId || "no-brand";
            if (!brands[brandId]) brands[brandId] = {};
            
            const versions = savedDesigns
                .filter(v => v.parentId === m.id)
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            
            brands[brandId][m.id] = { master: m, versions };
        });

        return brands;
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
                        ) : isOverwrite ? (
                            <>
                                <Save className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Overwrite Template</span>
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
                    Object.entries(templatesByBrand).sort(([aId], [bId]) => {
                        if (aId === "no-brand") return 1;
                        if (bId === "no-brand") return -1;
                        return 0;
                    }).map(([brandId, masters]) => {
                        const brand = brandKits.find(b => b.id === brandId);
                        const brandName = brand?.name || "No Brand";
                        const isBrandExpanded = expandedBrands.has(brandId);
                        const masterCount = Object.keys(masters).length;

                        return (
                            <div key={brandId} className="space-y-2">
                                {/* Brand Header */}
                                <button
                                    onClick={() => toggleBrand(brandId)}
                                    className="w-full flex items-center justify-between group/brand hover:bg-white/5 p-2 rounded-xl transition-all border-b border-white/5 pb-3"
                                >
                                    <div className="flex items-start gap-3 text-left">
                                        <div className={`p-1.5 rounded-lg transition-all shrink-0 mt-0.5 ${isBrandExpanded ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-500'}`}>
                                            <Layout className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white group-hover/brand:text-blue-400 transition-colors leading-none">
                                                {brandName}
                                            </p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1.5">
                                                {masterCount} {masterCount === 1 ? 'PROJECT' : 'PROJECTS'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${isBrandExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                </button>

                                {/* Templates under this brand */}
                                {isBrandExpanded && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {Object.values(masters).map(({ master, versions }) => (
                                            <div key={master.id} className="space-y-1">
                                                {/* Master Card / Folder Row */}
                                                <div
                                                    onClick={() => toggleMaster(master.id)}
                                                    className={`group relative flex flex-col gap-1 bg-white/5 border border-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all border-l-2 ${expandedMasters.has(master.id) ? 'border-l-blue-500 bg-white/[0.07]' : 'border-l-transparent'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start gap-2 mb-1 text-left">
                                                                <Folder className={`h-3 w-3 shrink-0 mt-0.5 ${expandedMasters.has(master.id) ? 'text-blue-500 fill-blue-500/20' : 'text-gray-600'}`} />
                                                                <p className="text-[10px] font-black text-white uppercase tracking-wider leading-tight break-words">{master.name}</p>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                                    {versions.length} {versions.length === 1 ? 'VERSION' : 'VERSIONS'}
                                                                </p>
                                                                {master.visibility === 'global' && (
                                                                    <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">
                                                                        GLOBAL
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isGlobal = master.visibility === 'global';
                                                                    if (confirm(isGlobal ? "Make this template private?" : "Share this template globally?")) {
                                                                        setSavedDesigns(savedDesigns.map(d => {
                                                                            if (d.id === master.id || d.parentId === master.id) {
                                                                                return { ...d, visibility: isGlobal ? 'private' : 'global' };
                                                                            }
                                                                            return d;
                                                                        }));
                                                                    }
                                                                }}
                                                                className={`p-1.5 rounded-lg hover:bg-white/10 transition-all ${master.visibility === 'global' ? 'text-blue-500' : 'text-gray-500'}`}
                                                            >
                                                                <Globe className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDelete(master.id, e)}
                                                                className={`transition-all p-1.5 rounded-lg ${confirmingDeleteId === master.id ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-red-500 hover:bg-red-500/10'}`}
                                                            >
                                                                {confirmingDeleteId === master.id ? <Check className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                            </button>
                                                            <div className={`p-1 transition-transform duration-200 ${expandedMasters.has(master.id) ? 'rotate-180 text-blue-400' : 'text-gray-600'}`}>
                                                                <ChevronDown className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Versions (Expanded) */}
                                                {expandedMasters.has(master.id) && versions.length > 0 && (
                                                    <div className="ml-6 space-y-1 mt-1 border-l border-white/10 pl-3">
                                                        {versions.map(version => (
                                                            <div
                                                                key={version.id}
                                                                onClick={() => loadTemplate(version.data, version.name, version.id)}
                                                                className="group flex flex-col gap-2 bg-white/[0.03] p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-all border border-transparent hover:border-blue-500/20"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-black text-white uppercase tracking-wider leading-tight break-words group-hover:text-blue-400 transition-colors">{version.name}</p>
                                                                        <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                                                            <Clock className="h-2 w-2" />
                                                                            {new Date(version.timestamp).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(version.id, e); }}
                                                                        className={`transition-all p-1 rounded-md ${confirmingDeleteId === version.id ? 'bg-red-500 text-white' : 'text-gray-700 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'}`}
                                                                    >
                                                                        {confirmingDeleteId === version.id ? <Check className="h-2.5 w-2.5" /> : <Trash2 className="h-2.5 w-2.5" />}
                                                                    </button>
                                                                </div>
                                                                <div className="w-full h-[60px] overflow-hidden rounded-lg bg-black/40 border border-white/5 relative group/vthumb">
                                                                    <img src={version.thumbnail} alt={version.name} className="h-full w-full object-contain opacity-60 group-hover:opacity-100 transition-all p-1" />
                                                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/vthumb:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <div className="text-[7px] font-black text-white uppercase tracking-widest bg-blue-600 px-2 py-1 rounded shadow-lg">LOAD</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
