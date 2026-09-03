"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Trash2, Save, Check, Folder, ChevronRight, Globe, Clock, RotateCcw, Undo2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function TemplatePanel() {
    const {
        savedDesigns, setSavedDesigns, saveToTemplate, loadTemplate, deleteDesign,
        brandKits, canvasName, designName, setDesignName, currentDesignId,
        activeTemplate, saveWorkingTemplate, updateDefaultTemplate, resetTemplateToDefault,
    } = useCanvas() as any;
    const [savedTier, setSavedTier] = useState<string | null>(null);
    const flash = (t: string) => { setSavedTier(t); setTimeout(() => setSavedTier(null), 2000); };

    const activeDesign = activeTemplate ? savedDesigns.find((d: any) => d.id === activeTemplate.id) : null;

    const [selectedBrand, setSelectedBrand] = useState<string>("");
    const [selectedParent, setSelectedParent] = useState<string>("none");
    const [justSaved, setJustSaved] = useState(false);
    const [openMasters, setOpenMasters] = useState<Set<string>>(new Set());
    const [openBrands, setOpenBrands] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const masters = useMemo(() => savedDesigns.filter((d: any) => !d.parentId), [savedDesigns]);
    const sortedMasters = useMemo(
        () => [...masters].sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })),
        [masters]
    );

    useEffect(() => {
        if (!currentDesignId) return;
        const cur = savedDesigns.find((d: any) => d.id === currentDesignId);
        if (cur) {
            setSelectedBrand(cur.brandId || "");
            setSelectedParent(cur.parentId || "none");
        }
    }, [currentDesignId, savedDesigns]);

    // Expand every brand group by default once designs load
    useEffect(() => {
        setOpenBrands(new Set(["no-brand", ...brandKits.map((b: any) => b.id)]));
    }, [brandKits.length]);

    const isOverwrite = useMemo(() => {
        if (!designName.trim()) return false;
        return savedDesigns.some(
            (d: any) =>
                d.name.toLowerCase() === designName.trim().toLowerCase() &&
                d.brandId === (selectedBrand || undefined) &&
                d.parentId === (selectedParent === "none" ? undefined : selectedParent)
        );
    }, [designName, selectedBrand, selectedParent, savedDesigns]);

    const handleSave = () => {
        const name = designName.trim() || canvasName || "Untitled template";
        saveToTemplate(name, selectedBrand || undefined, selectedParent === "none" ? undefined : selectedParent, !isOverwrite);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDelete === id) {
            deleteDesign(id);
            setConfirmDelete(null);
        } else {
            setConfirmDelete(id);
            setTimeout(() => setConfirmDelete((p) => (p === id ? null : p)), 2500);
        }
    };

    const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, id: string) => {
        const next = new Set(set);
        next.has(id) ? next.delete(id) : next.add(id);
        setFn(next);
    };

    const grouped = useMemo(() => {
        const brands: Record<string, { master: any; versions: any[] }[]> = {};
        sortedMasters.forEach((m: any) => {
            const bid = m.brandId || "no-brand";
            (brands[bid] ||= []).push({
                master: m,
                versions: savedDesigns
                    .filter((v: any) => v.parentId === m.id)
                    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })),
            });
        });
        return brands;
    }, [sortedMasters, savedDesigns]);

    return (
        <div className="panel">
            <div className="panel-head"><h2>Templates</h2></div>

            {/* Active responsive template: Default vs Working */}
            {activeDesign && (
                <div className="border-b border-line bg-surface-2 p-3.5">
                    <div className="mb-2 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{activeDesign.name}</p>
                        <span className={`chip !h-6 !px-2 ${activeTemplate.tier === "working" ? "is-active" : ""}`}>
                            {activeTemplate.tier === "working" ? "Working copy" : "Default"}
                        </span>
                    </div>
                    <p className="mb-2.5 text-[11px] leading-snug text-text-mute">
                        Set names and photos, then <b className="text-text-dim">save your working copy</b>. Come back to it any time, or reset to the clean template.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { saveWorkingTemplate(); flash("working"); }} className="btn btn-primary btn-sm">
                            {savedTier === "working" ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save working</>}
                        </button>
                        <button onClick={resetTemplateToDefault} className="btn btn-sm">
                            <RotateCcw className="h-3.5 w-3.5" /> Reset to default
                        </button>
                    </div>
                    <button
                        onClick={() => { if (confirm("Overwrite the default template with what's on the canvas? This affects every future use.")) { updateDefaultTemplate(); flash("default"); } }}
                        className="btn btn-ghost btn-sm mt-1.5 w-full text-text-mute"
                    >
                        {savedTier === "default" ? <><Check className="h-3.5 w-3.5" /> Default updated</> : <><Undo2 className="h-3.5 w-3.5" /> Update the default layout</>}
                    </button>
                </div>
            )}

            {/* Save the current canvas as a brand-new template */}
            <div className="border-b border-line p-3.5">
                <input
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="Name this template"
                    className="field mb-2"
                />
                <div className="mb-2 grid grid-cols-2 gap-2">
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="field">
                        <option value="">No club</option>
                        {[...brandKits]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                    </select>
                    <select value={selectedParent} onChange={(e) => setSelectedParent(e.target.value)} className="field">
                        <option value="none">New template</option>
                        {sortedMasters.map((m: any) => (
                            <option key={m.id} value={m.id}>Version of {m.name}</option>
                        ))}
                    </select>
                </div>
                <button onClick={handleSave} className={`btn btn-block ${justSaved ? "" : "btn-primary"}`}>
                    {justSaved ? (
                        <><Check className="h-4 w-4" /> Saved</>
                    ) : (
                        <><Save className="h-4 w-4" /> {isOverwrite ? "Update template" : "Save template"}</>
                    )}
                </button>
            </div>

            {/* Template library */}
            <div className="panel-body">
                {masters.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center text-text-mute">
                        <Folder className="h-8 w-8" />
                        <p className="text-[12px]">No templates saved yet.</p>
                    </div>
                ) : (
                    Object.entries(grouped)
                        .sort(([a], [b]) => (a === "no-brand" ? 1 : b === "no-brand" ? -1 : 0))
                        .map(([bid, items]) => {
                            const brand = brandKits.find((b: any) => b.id === bid);
                            const name = brand?.name || "No club";
                            const open = openBrands.has(bid);
                            return (
                                <div key={bid} className="mb-3">
                                    <button
                                        onClick={() => toggle(openBrands, setOpenBrands, bid)}
                                        className="mb-1.5 flex w-full items-center gap-2 py-1 text-left"
                                    >
                                        <ChevronRight className={`h-3.5 w-3.5 text-text-mute transition-transform ${open ? "rotate-90" : ""}`} />
                                        <span className="text-[12px] font-semibold text-text-dim">{name}</span>
                                        <span className="text-[11px] text-text-mute">{items.length}</span>
                                    </button>

                                    {open && (
                                        <div className="space-y-1.5 pl-1">
                                            {items.map(({ master, versions }) => (
                                                <div key={master.id}>
                                                    <div
                                                        onClick={() => master.data && loadTemplate(master.data, master.name, master.id)}
                                                        className={`row ${currentDesignId === master.id ? "is-active" : ""}`}
                                                    >
                                                        <Folder className="h-3.5 w-3.5 shrink-0 text-text-mute" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-[13px] font-medium text-text">{master.name}</p>
                                                            {versions.length > 0 && (
                                                                <p className="text-[11px] text-text-mute">{versions.length} saved version{versions.length === 1 ? "" : "s"}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const isGlobal = master.visibility === "global";
                                                                setSavedDesigns(
                                                                    savedDesigns.map((d: any) =>
                                                                        d.id === master.id || d.parentId === master.id
                                                                            ? { ...d, visibility: isGlobal ? "private" : "global" }
                                                                            : d
                                                                    )
                                                                );
                                                            }}
                                                            title={master.visibility === "global" ? "Shared with everyone" : "Share with everyone"}
                                                            className={`icon-btn h-7 w-7 ${master.visibility === "global" ? "is-active" : ""}`}
                                                        >
                                                            <Globe className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(master.id, e)}
                                                            className={`icon-btn h-7 w-7 ${confirmDelete === master.id ? "text-danger" : ""}`}
                                                            title={confirmDelete === master.id ? "Click again to delete" : "Delete"}
                                                        >
                                                            {confirmDelete === master.id ? <Check className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                        </button>
                                                        {versions.length > 0 && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggle(openMasters, setOpenMasters, master.id); }}
                                                                className="icon-btn h-7 w-7"
                                                            >
                                                                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${openMasters.has(master.id) ? "rotate-90" : ""}`} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {openMasters.has(master.id) && versions.length > 0 && (
                                                        <div className="ml-4 mt-1 space-y-1 border-l border-line pl-2">
                                                            {versions.map((v: any) => (
                                                                <div
                                                                    key={v.id}
                                                                    onClick={() => loadTemplate(v.data, v.name, v.id)}
                                                                    className="row"
                                                                >
                                                                    {v.thumbnail && (
                                                                        <img src={v.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded-sm border border-line object-contain" />
                                                                    )}
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-[12px] font-medium text-text">{v.name}</p>
                                                                        <p className="flex items-center gap-1 text-[10px] text-text-mute">
                                                                            <Clock className="h-2.5 w-2.5" />
                                                                            {new Date(v.timestamp).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => handleDelete(v.id, e)}
                                                                        className={`icon-btn h-6 w-6 ${confirmDelete === v.id ? "text-danger" : ""}`}
                                                                    >
                                                                        {confirmDelete === v.id ? <Check className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                                                                    </button>
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
