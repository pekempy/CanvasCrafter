"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Folder, ChevronDown, Search, Check, Star } from "lucide-react";
import { AssetFolder } from "@/store/useCanvasStore";
import { sortFoldersNaturally } from "@/utils/folderSort";
import { normalizeSearchString } from "@/utils/normalize";

interface SearchableFolderSelectProps {
    folders: AssetFolder[];
    selectedId: string;
    onSelect: (id: string) => void;
    includeSpecial?: boolean; // include "Favorites"
    allowEmpty?: boolean;
    emptyLabel?: string;
    showCounts?: boolean;
    placeholder?: string;
    className?: string;
}

export default function SearchableFolderSelect({
    folders,
    selectedId,
    onSelect,
    includeSpecial = false,
    allowEmpty = false,
    emptyLabel = "No Folder Linked",
    showCounts = false,
    placeholder = "Search folders...",
    className = "",
}: SearchableFolderSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Selected folder label computation
    const selectedLabel = useMemo(() => {
        if (selectedId === "favorites") return "Favourite Assets";
        if (selectedId === "default") return "Default Folder";
        if (!selectedId && allowEmpty) return emptyLabel;

        const f = folders.find(fold => fold.id === selectedId || (fold as any).originalId === selectedId);
        if (f) {
            if (f.parentId) {
                const parent = folders.find(p => p.id === f.parentId || (p as any).originalId === f.parentId);
                return parent ? `${parent.name} ↳ ${f.name}` : f.name;
            }
            return f.name;
        }
        return "Select Folder...";
    }, [selectedId, folders, allowEmpty, emptyLabel]);

    // Flatten tree items with indentation metadata
    const flatTree = useMemo(() => {
        const result: { folder: AssetFolder; depth: number; path: string }[] = [];

        const traverse = (parentId?: string, depth = 0, prefix = "") => {
            const children = folders.filter(f => (f.parentId || undefined) === parentId);
            const sorted = sortFoldersNaturally(children);
            sorted.forEach(f => {
                const fullPath = prefix ? `${prefix} / ${f.name}` : f.name;
                result.push({ folder: f, depth, path: fullPath });
                traverse(f.id, depth + 1, fullPath);
            });
        };

        traverse(undefined, 0, "");
        return result;
    }, [folders]);

    // Filter items based on search query
    const filteredTree = useMemo(() => {
        const q = normalizeSearchString(search);
        if (!q) return flatTree;
        return flatTree.filter(item => {
            const normPath = normalizeSearchString(item.path);
            const normName = normalizeSearchString(item.folder.name);
            return normPath.includes(q) || normName.includes(q);
        });
    }, [flatTree, search]);

    return (
        <div ref={containerRef} className={`relative select-none ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 bg-white/10 text-xs font-semibold uppercase tracking-normal text-white border border-line rounded-xl px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-gold/40 hover:bg-white/15 transition-all"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {selectedId === "favorites" ? (
                        <Star className="h-3.5 w-3.5 text-pink-400 shrink-0 fill-current" />
                    ) : (
                        <Folder className="h-3.5 w-3.5 text-gold shrink-0" />
                    )}
                    <span className="truncate text-xs font-semibold">{selectedLabel}</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-text-mute shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu - wider and allowed to overflow sidebar */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-[100] w-[min(90vw,420px)] rounded-xl border border-line bg-[#16191f]/98 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] p-2 backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Field */}
                    <div className="relative mb-1.5 px-1 pt-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-mute" />
                        <input
                            type="text"
                            autoFocus
                            placeholder={placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-line bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-gold"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-80 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 pr-0.5">
                        {includeSpecial && !search && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => { onSelect("favorites"); setIsOpen(false); setSearch(""); }}
                                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${selectedId === "favorites" ? "bg-gold/20 text-gold font-bold" : "text-text-dim hover:bg-white/5 hover:text-white"}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Star className="h-3.5 w-3.5 text-pink-400 fill-current" /> Favourite Assets
                                    </span>
                                    {selectedId === "favorites" && <Check className="h-3.5 w-3.5 text-gold" />}
                                </button>
                                <div className="my-1 h-px bg-white/5" />
                            </>
                        )}

                        {allowEmpty && !search && (
                            <button
                                type="button"
                                onClick={() => { onSelect(""); setIsOpen(false); setSearch(""); }}
                                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${!selectedId ? "bg-gold/20 text-gold font-bold" : "text-text-dim hover:bg-white/5 hover:text-white"}`}
                            >
                                <span className="text-text-mute italic">{emptyLabel}</span>
                                {!selectedId && <Check className="h-3.5 w-3.5 text-gold" />}
                            </button>
                        )}

                        {filteredTree.map(({ folder, depth, path }) => {
                            const isSelected = selectedId === folder.id || selectedId === (folder as any).originalId;
                            return (
                                <button
                                    type="button"
                                    key={folder.id}
                                    onClick={() => {
                                        onSelect((folder as any).originalId || folder.id);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${isSelected ? "bg-gold/20 text-gold font-bold" : "text-text-dim hover:bg-white/5 hover:text-white"}`}
                                    style={{ paddingLeft: search ? "10px" : `${Math.max(10, depth * 14 + 10)}px` }}
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        {!search && depth > 0 && <span className="text-text-mute text-[10px]">↳</span>}
                                        <Folder className={`h-3 w-3 shrink-0 ${isSelected ? "text-gold" : "text-text-mute"}`} />
                                        <span className="truncate">
                                            {search ? path : folder.name}
                                        </span>
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        {showCounts && (
                                            <span className="text-[9px] text-text-mute bg-white/5 px-1.5 py-0.5 rounded">
                                                {folder.assets.length}
                                            </span>
                                        )}
                                        {isSelected && <Check className="h-3.5 w-3.5 text-gold" />}
                                    </div>
                                </button>
                            );
                        })}

                        {filteredTree.length === 0 && (
                            <p className="py-4 text-center text-xs text-text-mute">No folders found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
