"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Trash2, Save, Check, Folder, ChevronRight, Globe, Clock,
    RotateCcw, Undo2, Download, CalendarClock, Layers as LayersIcon, FilePlus2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

const PERIODS = [
    "END OF THE 1ST PERIOD",
    "END OF THE 2ND PERIOD",
    "FULL TIME",
    "FINAL SCORE AFTER OVERTIME",
    "FINAL SCORE AFTER A SHOOTOUT",
];

/* Collapsible section */
function Section({
    title, icon, defaultOpen = true, children,
}: { title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-line">
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-surface-2">
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-text-mute transition-transform ${open ? "rotate-90" : ""}`} />
                {icon}
                <span className="text-[12px] font-semibold text-text-dim">{title}</span>
            </button>
            {open && <div className="px-3.5 pb-3.5">{children}</div>}
        </div>
    );
}

export default function TemplatePanel() {
    const {
        savedDesigns, setSavedDesigns, saveToTemplate, loadTemplate, deleteDesign,
        brandKits, canvasName, designName, setDesignName, currentDesignId,
        activeTemplate, saveWorkingTemplate, updateDefaultTemplate, resetTemplateToDefault,
        applyFixture, exportAllSizes, canvas, forceUpdate,
    } = useCanvas() as any;

    const [savedTier, setSavedTier] = useState<string | null>(null);
    const flash = (t: string) => { setSavedTier(t); setTimeout(() => setSavedTier(null), 2000); };
    const activeDesign = activeTemplate ? savedDesigns.find((d: any) => d.id === activeTemplate.id) : null;

    const [fixtures, setFixtures] = useState<{ upcoming: any[]; recent: any[] } | null>(null);
    const [fxError, setFxError] = useState(false);
    const [exporting, setExporting] = useState(false);
    useEffect(() => {
        if (!activeTemplate || fixtures) return;
        fetch("/api/fixtures").then((r) => r.json()).then((d) => {
            if (d.error) setFxError(true); else setFixtures(d);
        }).catch(() => setFxError(true));
    }, [activeTemplate, fixtures]);

    const setPeriod = (text: string) => {
        if (!canvas) return;
        const o = (canvas.getObjects() as any[]).find((x) => x.name === "Period");
        if (!o) return;
        o.set("text", text);
        canvas.requestRenderAll();
        canvas.fire("object:modified", { target: o });
        forceUpdate?.();
    };

    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedParent, setSelectedParent] = useState("none");
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
        if (cur) { setSelectedBrand(cur.brandId || ""); setSelectedParent(cur.parentId || "none"); }
    }, [currentDesignId, savedDesigns]);

    useEffect(() => {
        setOpenBrands(new Set(["no-brand", ...brandKits.map((b: any) => b.id)]));
    }, [brandKits.length]);

    const isOverwrite = useMemo(() => {
        if (!designName.trim()) return false;
        return savedDesigns.some((d: any) =>
            d.name.toLowerCase() === designName.trim().toLowerCase() &&
            d.brandId === (selectedBrand || undefined) &&
            d.parentId === (selectedParent === "none" ? undefined : selectedParent)
        );
    }, [designName, selectedBrand, selectedParent, savedDesigns]);

    const handleSave = () => {
        saveToTemplate(designName.trim() || canvasName || "Untitled template", selectedBrand || undefined, selectedParent === "none" ? undefined : selectedParent, !isOverwrite);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDelete === id) { deleteDesign(id); setConfirmDelete(null); }
        else { setConfirmDelete(id); setTimeout(() => setConfirmDelete((p) => (p === id ? null : p)), 2500); }
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
                versions: savedDesigns.filter((v: any) => v.parentId === m.id)
                    .sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })),
            });
        });
        return brands;
    }, [sortedMasters, savedDesigns]);

    return (
        <div className="panel">
            <div className="panel-head"><h2>Templates</h2></div>

            <div className="flex-1 overflow-y-auto">
                {activeDesign && (
                    <>
                        {/* Identity bar — always visible */}
                        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3.5 py-2.5">
                            <Folder className="h-3.5 w-3.5 shrink-0 text-gold" />
                            <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{activeDesign.name}</p>
                            <span className={`chip !h-6 !px-2 ${activeTemplate.tier === "working" ? "is-active" : ""}`}>
                                {activeTemplate.tier === "working" ? "Working copy" : "Default"}
                            </span>
                        </div>

                        <Section title="This match" icon={<CalendarClock className="h-3.5 w-3.5 text-text-mute" />}>
                            {fxError && <p className="text-[11px] text-text-mute">Couldn't reach the fixture list — fill the details in by hand.</p>}
                            {!fxError && !fixtures && <p className="text-[11px] text-text-mute">Loading fixtures…</p>}
                            {fixtures && (
                                <select
                                    className="field"
                                    defaultValue=""
                                    onChange={(e) => {
                                        const all = [...(fixtures.upcoming || []), ...(fixtures.recent || [])];
                                        const fx = all.find((f) => f.id === e.target.value);
                                        if (fx) applyFixture(fx);
                                    }}
                                >
                                    <option value="" disabled>Pick a Seahawks game…</option>
                                    {fixtures.upcoming?.length > 0 && (
                                        <optgroup label="Upcoming">
                                            {fixtures.upcoming.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {new Date(f.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {f.isHome ? "vs" : "@"} {f.opponent}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {fixtures.recent?.length > 0 && (
                                        <optgroup label="Recent">
                                            {fixtures.recent.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {new Date(f.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {f.isHome ? "vs" : "@"} {f.opponent} {f.score ? `(${f.score})` : ""}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            )}
                            <p className="mt-1.5 text-[11px] text-text-mute">Sets opponent, crest, date, time and venue across every size.</p>

                            {activeTemplate.id === "sh-tpl-score-update" && (
                                <div className="mt-3">
                                    <p className="mb-1.5 text-[11px] font-medium text-text-dim">Period label</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {["End 1st", "End 2nd", "Full time", "After OT", "After SO"].map((label, i) => (
                                            <button key={label} onClick={() => setPeriod(PERIODS[i])} className="chip">{label}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Section>

                        <Section title="Save & versions" icon={<Save className="h-3.5 w-3.5 text-text-mute" />}>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { saveWorkingTemplate(); flash("working"); }} className="btn btn-primary btn-sm">
                                    {savedTier === "working" ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save working</>}
                                </button>
                                <button onClick={resetTemplateToDefault} className="btn btn-sm">
                                    <RotateCcw className="h-3.5 w-3.5" /> Reset to default
                                </button>
                            </div>
                            <p className="mt-2 text-[11px] leading-snug text-text-mute">
                                Your working copy keeps names and photos. Reset drops it and reloads the clean template.
                            </p>
                            <button
                                onClick={() => { if (confirm("Overwrite the default template with what's on the canvas? Affects every future use.")) { updateDefaultTemplate(); flash("default"); } }}
                                className="btn btn-ghost btn-sm mt-2 w-full text-text-mute"
                            >
                                {savedTier === "default" ? <><Check className="h-3.5 w-3.5" /> Default updated</> : <><Undo2 className="h-3.5 w-3.5" /> Update the default layout</>}
                            </button>
                        </Section>

                        <Section title="Export" icon={<Download className="h-3.5 w-3.5 text-text-mute" />} defaultOpen={false}>
                            <button
                                onClick={async () => { setExporting(true); try { await exportAllSizes(); } finally { setExporting(false); } }}
                                disabled={exporting}
                                className="btn btn-sm w-full"
                            >
                                <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting…" : "Export all sizes (PNG)"}
                            </button>
                            <p className="mt-1.5 text-[11px] text-text-mute">One PNG per posting size. Single-size export is in File → Export.</p>
                        </Section>
                    </>
                )}

                {/* Library */}
                <Section
                    key={activeTemplate ? "lib-collapsed" : "lib-open"}
                    title="All templates"
                    icon={<LayersIcon className="h-3.5 w-3.5 text-text-mute" />}
                    defaultOpen={!activeTemplate}
                >
                    {masters.length === 0 ? (
                        <p className="py-6 text-center text-[12px] text-text-mute">No templates saved yet.</p>
                    ) : (
                        Object.entries(grouped)
                            .sort(([a], [b]) => (a === "no-brand" ? 1 : b === "no-brand" ? -1 : 0))
                            .map(([bid, items]) => {
                                const brand = brandKits.find((b: any) => b.id === bid);
                                const name = brand?.name || "No club";
                                const open = openBrands.has(bid);
                                return (
                                    <div key={bid} className="mb-2">
                                        <button onClick={() => toggle(openBrands, setOpenBrands, bid)} className="mb-1 flex w-full items-center gap-2 py-1 text-left">
                                            <ChevronRight className={`h-3 w-3 text-text-mute transition-transform ${open ? "rotate-90" : ""}`} />
                                            <span className="text-[12px] font-medium text-text-dim">{name}</span>
                                            <span className="text-[11px] text-text-mute">{items.length}</span>
                                        </button>
                                        {open && (
                                            <div className="space-y-1 pl-1">
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
                                                                    <p className="text-[11px] text-text-mute">{versions.length} version{versions.length === 1 ? "" : "s"}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const isGlobal = master.visibility === "global";
                                                                    setSavedDesigns(savedDesigns.map((d: any) =>
                                                                        d.id === master.id || d.parentId === master.id ? { ...d, visibility: isGlobal ? "private" : "global" } : d
                                                                    ));
                                                                }}
                                                                title={master.visibility === "global" ? "Shared with everyone" : "Share with everyone"}
                                                                className={`icon-btn h-7 w-7 ${master.visibility === "global" ? "is-active" : ""}`}
                                                            >
                                                                <Globe className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button onClick={(e) => handleDelete(master.id, e)} className={`icon-btn h-7 w-7 ${confirmDelete === master.id ? "text-danger" : ""}`} title="Delete">
                                                                {confirmDelete === master.id ? <Check className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                            </button>
                                                            {versions.length > 0 && (
                                                                <button onClick={(e) => { e.stopPropagation(); toggle(openMasters, setOpenMasters, master.id); }} className="icon-btn h-7 w-7">
                                                                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${openMasters.has(master.id) ? "rotate-90" : ""}`} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {openMasters.has(master.id) && versions.length > 0 && (
                                                            <div className="ml-4 mt-1 space-y-1 border-l border-line pl-2">
                                                                {versions.map((v: any) => (
                                                                    <div key={v.id} onClick={() => loadTemplate(v.data, v.name, v.id)} className="row">
                                                                        {v.thumbnail && <img src={v.thumbnail} alt="" className="h-8 w-8 shrink-0 rounded-sm border border-line object-contain" />}
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-[12px] font-medium text-text">{v.name}</p>
                                                                            <p className="flex items-center gap-1 text-[10px] text-text-mute">
                                                                                <Clock className="h-2.5 w-2.5" />{new Date(v.timestamp).toLocaleDateString()}
                                                                            </p>
                                                                        </div>
                                                                        <button onClick={(e) => handleDelete(v.id, e)} className={`icon-btn h-6 w-6 ${confirmDelete === v.id ? "text-danger" : ""}`}>
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
                </Section>

                {/* Save canvas as a new template */}
                <Section title="Save canvas as a new template" icon={<FilePlus2 className="h-3.5 w-3.5 text-text-mute" />} defaultOpen={false}>
                    <input
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        placeholder="Template name"
                        className="field mb-2"
                    />
                    <div className="mb-2 grid grid-cols-2 gap-2">
                        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="field">
                            <option value="">No club</option>
                            {[...brandKits].sort((a, b) => a.name.localeCompare(b.name)).map((b) => (
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
                    <button onClick={handleSave} className={`btn btn-block btn-sm ${justSaved ? "" : "btn-primary"}`}>
                        {justSaved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> {isOverwrite ? "Update template" : "Save template"}</>}
                    </button>
                </Section>
            </div>
        </div>
    );
}
