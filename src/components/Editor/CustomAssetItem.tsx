"use client";

import { useCanvas, CustomAsset } from "@/store/useCanvasStore";
import { Trash2, Heart, Tag, Plus, X, Info, Globe, Folder } from "lucide-react";
import { useState } from "react";

export default function CustomAssetItem({ asset, folderId }: { asset: CustomAsset; folderId: string }) {
    const { addImage, maskShapeWithImage, selectedObject, assetFolders, setAssetFolders, setBackgroundImage } = useCanvas();
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const updateAsset = (updates: Partial<CustomAsset>) => {
        setAssetFolders(assetFolders.map(f => {
            if (f.id === folderId) {
                return {
                    ...f,
                    assets: f.assets.map(a => a.id === asset.id ? { ...a, ...updates, updatedAt: Date.now() } : a),
                    updatedAt: Date.now()
                };
            }
            return f;
        }));
    };

    const toggleFavorite = () => updateAsset({ isFavorite: !asset.isFavorite });

    const addTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        const currentTags = asset.tags || [];
        if (!currentTags.includes(newTag.trim())) {
            updateAsset({ tags: [...currentTags, newTag.trim()] });
        }
        setNewTag("");
    };

    const removeTag = (tagToRemove: string) => {
        updateAsset({ tags: (asset.tags || []).filter(t => t !== tagToRemove) });
    };

    const handleDelete = async () => {
        if (confirmingDelete) {
            // Physical deletion from disk
            try {
                await fetch(`/api/images?id=${asset.id}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Failed to delete asset from disk", e);
            }

            setAssetFolders(assetFolders.map(f => {
                if (f.id === folderId) {
                    return { ...f, assets: f.assets.filter(a => a.id !== asset.id) };
                }
                return f;
            }));
            setConfirmingDelete(false);
        } else {
            setConfirmingDelete(true);
            setTimeout(() => setConfirmingDelete(false), 3000);
        }
    };

    const moveToFolder = (targetRawId: string) => {
        const rawCurrentId = (assetFolders.find(f => f.id === folderId) as any)?.originalId || folderId;
        if (targetRawId === rawCurrentId) return;

        setAssetFolders(assetFolders.map(f => {
            const fRawId = (f as any).originalId || f.id;
            if (fRawId === rawCurrentId) {
                return { ...f, assets: f.assets.filter(a => a.id !== asset.id), updatedAt: Date.now() };
            }
            if (fRawId === targetRawId) {
                return { ...f, assets: [{ ...asset, folderId: targetRawId, updatedAt: Date.now() }, ...f.assets], updatedAt: Date.now() };
            }
            return f;
        }));
    };

    return (
        <div className="group relative rounded-[1.5rem] bg-[#1a1c22] overflow-hidden border border-line transition-all w-full flex flex-col shadow-2xl hover:border-gold/50 h-[320px]">
            {/* 1. Image Section - Locked Height */}
            <div className="h-[150px] relative shrink-0 overflow-hidden bg-[0f1114]">
                <img src={asset.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />

                {/* Secondary Actions (Heart/Trash) - High corner visibility */}
                <div className="absolute top-2 right-2 flex gap-1 z-20">
                    <button
                        onClick={toggleFavorite}
                        className={`p-1.5 rounded-xl backdrop-blur-md border border-line transition-all ${asset.isFavorite ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-black/40 text-text-dim hover:text-white hover:bg-black/60'}`}
                    >
                        <Heart className={`h-3 w-3 ${asset.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`transition-all p-1.5 rounded-xl backdrop-blur-md border border-line ${confirmingDelete ? 'bg-red-500 text-white animate-pulse' : 'bg-black/40 text-text-dim hover:text-red-500 hover:bg-black/60'}`}
                    >
                        {confirmingDelete ? <span className="text-[8px] font-semibold px-1">CONFIRM?</span> : <Trash2 className="h-3 w-3" />}
                    </button>
                </div>
            </div>

            {/* 2. Content Area - Swaps between View/Edit */}
            <div className={`flex-1 flex flex-col p-3 gap-3 min-h-0 relative ${isEditingTags ? 'bg-gold/[0.03]' : ''}`}>

                {isEditingTags ? (
                    /* TAG EDITOR UI */
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[9px] font-semibold uppercase text-gold tracking-[0.1em]">Manage Tags</h4>
                            <button onClick={() => setIsEditingTags(false)} className="text-text-mute hover:text-white transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </div>

                        <form onSubmit={addTag} className="flex gap-1.5 mb-2 shrink-0">
                            <input
                                type="text"
                                autoFocus
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                placeholder="Add tag..."
                                className="flex-1 bg-white/5 border border-line rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-gold/50 transition-all"
                            />
                            <button type="submit" className="shrink-0 h-8 w-8 rounded-lg bg-gold hover:bg-gold text-white flex items-center justify-center transition-all active:scale-95 shadow-lg">
                                <Plus className="h-4 w-4" />
                            </button>
                        </form>

                        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-wrap gap-1 content-start pb-2">
                            {asset.tags?.map((tag, i) => (
                                <span key={i} className="flex items-center gap-1 rounded-md bg-gold/10 border border-gold/20 px-1.5 py-1 text-[8px] font-semibold text-gold uppercase tracking-wider">
                                    {tag}
                                    <X className="h-2 w-2 hover:text-white cursor-pointer" onClick={() => removeTag(tag)} />
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsEditingTags(false)}
                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-semibold uppercase text-text-dim border border-line rounded-lg transition-all mt-auto shrink-0"
                        >
                            Done Editing
                        </button>
                    </div>
                ) : (
                    /* VIEW MODE UI */
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-2 gap-1.5 shrink-0 mb-1.5">
                            <button
                                onClick={() => addImage(asset.url)}
                                className="col-span-2 py-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold hover:text-white text-[9px] font-semibold uppercase tracking-normal transition-all flex items-center justify-center gap-1.5"
                            >
                                <Plus className="h-3 w-3" /> Insert
                            </button>
                            <button
                                onClick={() => setBackgroundImage(asset.url)}
                                className="py-1.5 rounded-lg bg-white/5 text-[8px] font-semibold uppercase text-text-dim hover:bg-white/10 hover:text-white transition-all"
                            >
                                Set BG
                            </button>
                            <button
                                onClick={() => selectedObject ? maskShapeWithImage(selectedObject, asset.url) : null}
                                className={`py-1.5 rounded-lg text-[8px] font-semibold uppercase transition-all ${selectedObject ? 'bg-white/5 text-text-dim hover:bg-white/10 hover:text-white' : 'bg-transparent border border-line text-text-mute cursor-not-allowed'}`}
                            >
                                Mask
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-wrap gap-1 content-start py-1">
                            <span className="px-1.5 py-0.5 rounded relative bg-white/10 text-[8px] font-semibold text-white uppercase tracking-normal border border-line flex items-center gap-1 shrink-0" title={`In folder: ${assetFolders.find(f => f.id === folderId)?.name || 'Unknown'}`}>
                                <Folder className="h-2.5 w-2.5 text-white/70" />
                                <span className="truncate max-w-[80px]">{assetFolders.find(f => (f as any).originalId === folderId || f.id === folderId)?.name || "Unknown"}</span>
                            </span>
                            {asset.tags?.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded pl-2.5 relative bg-white/5 text-[8px] font-semibold text-text-dim uppercase tracking-normal shrink-0">
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-gold rounded-full" />
                                    {tag}
                                </span>
                            ))}
                            {(!asset.tags || asset.tags.length === 0) && (
                                <span className="text-[8px] font-bold text-text-mute italic py-1 px-1">No tags.</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1 mt-auto pt-2 border-t border-line shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    const isGlobal = (asset as any).visibility === 'global';
                                    const nextVisibility = isGlobal ? 'private' : 'global';
                                    setAssetFolders(assetFolders.map(f => {
                                        if (f.id === folderId) {
                                            return {
                                                ...f,
                                                assets: f.assets.map(a => a.id === asset.id ? { ...a, visibility: nextVisibility, updatedAt: Date.now() } : a),
                                                updatedAt: Date.now()
                                            };
                                        }
                                        return f;
                                    }));
                                }}
                                className={`p-1.5 rounded-lg transition-all ${(asset as any).visibility === 'global' ? 'text-gold bg-gold/10' : 'text-text-mute hover:text-white hover:bg-white/5'}`}
                                title={(asset as any).visibility === 'global' ? "Shared Globally" : "Share Globally"}
                            >
                                <Globe className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => setIsEditingTags(true)}
                                className="p-1.5 rounded-lg text-text-mute hover:text-gold hover:bg-gold/10 transition-all"
                                title="Edit Tags"
                            >
                                <Tag className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => alert(`ASSET INSIGHT\n\nID: ${asset.id}\nFolder: ${folderId}\nBrand: ${asset.brandId || 'None'}\nPath: /images/${asset.id}.png\nVisibility: ${(asset as any).visibility || 'private'}`)}
                                className="p-1.5 rounded-lg text-text-mute hover:text-gold hover:bg-gold/10 transition-all"
                                title="Technical Info"
                            >
                                <Info className="h-3 w-3" />
                            </button>

                            <div className="ml-auto relative min-w-0 max-w-[80px]">
                                <select
                                    className="w-full appearance-none bg-gold/10 hover:bg-gold/20 text-gold text-[8px] font-semibold uppercase tracking-normal py-1.5 pl-2 pr-5 rounded-lg outline-none cursor-pointer transition-colors truncate"
                                    value="move"
                                    onChange={(e) => {
                                        if (e.target.value !== 'move') {
                                            moveToFolder(e.target.value);
                                        }
                                    }}
                                >
                                    <option value="move" disabled>MOVE...</option>
                                    {assetFolders.map(f => (
                                        <option key={f.id} value={(f as any).originalId || f.id} className="bg-[16191f] text-text-dim py-1">
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gold">
                                    <Folder className="h-2.5 w-2.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
