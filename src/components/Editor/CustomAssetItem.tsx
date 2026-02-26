"use client";

import { useCanvas, CustomAsset } from "@/store/useCanvasStore";
import { Trash2, Heart, Tag, Plus, X } from "lucide-react";
import { useState } from "react";

export default function CustomAssetItem({ asset, folderId }: { asset: CustomAsset; folderId: string }) {
    const { addImage, maskShapeWithImage, selectedObject, assetFolders, setAssetFolders, setBackgroundImage } = useCanvas();
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [newTag, setNewTag] = useState("");

    const updateAsset = (updates: Partial<CustomAsset>) => {
        setAssetFolders(assetFolders.map(f => {
            if (f.id === folderId) {
                return {
                    ...f,
                    assets: f.assets.map(a => a.id === asset.id ? { ...a, ...updates } : a)
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

    const handleDelete = () => {
        if (confirm("Delete this asset?")) {
            setAssetFolders(assetFolders.map(f => {
                if (f.id === folderId) {
                    return { ...f, assets: f.assets.filter(a => a.id !== asset.id) };
                }
                return f;
            }));
        }
    };

    return (
        <div className="group relative rounded-2xl bg-white/5 overflow-hidden border border-white/5 transition-all w-full">
            <div className="aspect-square relative overflow-hidden bg-[#12141a]">
                <img src={asset.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />

                {/* Always show favorite if liked */}
                {asset.isFavorite && !isEditingTags && (
                    <div className="absolute top-2 right-2 pointer-events-none z-10">
                        <Heart className="h-4 w-4 text-pink-500 fill-current drop-shadow-md" />
                    </div>
                )}

                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-3 gap-2 overflow-y-auto scrollbar-hide">
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                        <button onClick={() => addImage(asset.url)} className="w-full py-1.5 rounded-lg bg-blue-600 text-[9px] font-black uppercase text-white hover:bg-blue-700">Add Canvas</button>
                        <button onClick={() => setBackgroundImage(asset.url)} className="w-full py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase text-white hover:bg-white/20 border border-white/20">Set Background</button>
                        {selectedObject && (
                            <button onClick={() => maskShapeWithImage(selectedObject, asset.url)} className="w-full py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase text-white hover:bg-white/20 border border-white/20">Mask Shape</button>
                        )}
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={toggleFavorite} className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${asset.isFavorite ? 'bg-pink-500/20 text-pink-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <Heart className={`h-3.5 w-3.5 ${asset.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={handleDelete} className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 backdrop-blur-md transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="absolute top-2 left-2 flex gap-1 transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => setIsEditingTags(!isEditingTags)} className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${isEditingTags ? 'bg-blue-500/20 text-blue-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <Tag className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tags area */}
            <div className="p-2 border-t border-white/5 bg-[#1e2229]">
                <div className="flex flex-wrap gap-1">
                    {asset.tags?.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold text-gray-300">
                            {tag}
                            {isEditingTags && (
                                <button onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-400">
                                    <X className="h-2 w-2" />
                                </button>
                            )}
                        </span>
                    ))}
                    {(!asset.tags || asset.tags.length === 0) && !isEditingTags && (
                        <p className="text-[8px] font-bold text-gray-600 uppercase">No Tags</p>
                    )}
                </div>
                {isEditingTags && (
                    <form onSubmit={addTag} className="flex mt-2 items-center gap-1">
                        <input
                            type="text"
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            placeholder="Add tag..."
                            className="flex-1 w-0 bg-white/5 border border-white/10 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-blue-500"
                        />
                        <button type="submit" className="shrink-0 p-1 rounded bg-blue-500 hover:bg-blue-600 text-white">
                            <Plus className="h-3 w-3" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
