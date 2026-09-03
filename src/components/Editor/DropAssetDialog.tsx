"use client";

import { useState } from "react";
import { useCanvas } from "@/store/useCanvasStore";
import { X, Image as ImageIcon, Plus, Folder, Shield, ArrowRight, Tag } from "lucide-react";

export default function DropAssetDialog({
    isOpen,
    onClose,
    dataUrl,
    onConfirm
}: {
    isOpen: boolean;
    onClose: () => void;
    dataUrl: string | null;
    onConfirm: (brandId?: string, folderId?: string, tags?: string[]) => void;
}) {
    const { brandKits, assetFolders } = useCanvas();
    const [selectedBrandId, setSelectedBrandId] = useState<string>("");
    const [selectedFolderId, setSelectedFolderId] = useState<string>("default");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    if (!isOpen || !dataUrl) return null;

    const activeBrand = brandKits.find(b => b.id === selectedBrandId);
    const availableFolders = activeBrand
        ? assetFolders.filter(f => activeBrand.assetFolderIds?.includes(f.id))
        : assetFolders;

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        if (!tags.includes(tagInput.trim().toLowerCase())) {
            setTags([...tags, tagInput.trim().toLowerCase()]);
        }
        setTagInput("");
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
            <div className="w-full max-w-2xl rounded-[2.5rem] bg-[#1a1c22] border border-line p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tighter text-white">ADD NEW ASSET</h2>
                        <p className="text-[10px] font-bold uppercase tracking-normal text-text-mute mt-1">Organize your upload for future use</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-3 bg-white/5 hover:bg-white/10 text-text-dim transition-all active:scale-95">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-h-[70vh]">
                    {/* Preview Side - Sticky/Static */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="aspect-square rounded-[2rem] bg-black/40 border border-line overflow-hidden flex items-center justify-center p-4 shadow-inner">
                            <img src={dataUrl} alt="Dropped Asset" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                        </div>

                        <div className="hidden lg:flex flex-col gap-2">
                            <h3 className="text-[10px] font-semibold uppercase tracking-normal text-text-mute px-1">Quick Action</h3>
                            <button
                                onClick={() => onConfirm()}
                                className="w-full rounded-md bg-white/5 border border-line px-6 py-4 text-[10px] font-semibold uppercase tracking-normal text-text-dim hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Just add to canvas
                            </button>
                        </div>
                    </div>

                    {/* Form Side - Scrollable if content is long */}
                    <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-normal text-text-mute pl-1">Associate with Brand</label>
                                <select
                                    value={selectedBrandId}
                                    onChange={(e) => {
                                        setSelectedBrandId(e.target.value);
                                        setSelectedFolderId("default");
                                    }}
                                    className="w-full bg-white/5 border border-line rounded-md px-4 py-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none transition-all hover:bg-white/10"
                                >
                                    <option value="">No Brand Association</option>
                                    {brandKits.map(kit => (
                                        <option key={kit.id} value={kit.id}>🛡️ {kit.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-normal text-text-mute pl-1">Select Asset Folder</label>
                                <select
                                    value={selectedFolderId}
                                    onChange={(e) => setSelectedFolderId(e.target.value)}
                                    className="w-full bg-white/5 border border-line rounded-md px-4 py-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 appearance-none transition-all hover:bg-white/10"
                                >
                                    <option value="default">📂 Default Folder</option>
                                    {availableFolders.filter(f => f.id !== 'default').map(folder => (
                                        <option key={folder.id} value={folder.id}>📂 {folder.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold uppercase tracking-normal text-text-mute pl-1">Add Search Tags</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-mute group-focus-within:text-gold transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Enter tags..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            className="w-full bg-white/5 border border-line rounded-md pl-10 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddTag}
                                        className="bg-gold h-[52px] w-[52px] rounded-md flex items-center justify-center hover:bg-gold text-white transition-all active:scale-95 shadow-lg shadow-gold/20"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold/10 text-gold text-[10px] font-semibold uppercase tracking-normal border border-gold/20 transition-all animate-in zoom-in-95">
                                            {tag}
                                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-white transition-colors p-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-line flex flex-col gap-3">
                            <button
                                onClick={() => onConfirm(selectedBrandId, selectedFolderId, tags)}
                                className="w-full rounded-md bg-gold px-6 py-5 text-xs font-semibold uppercase tracking-normal text-white shadow-xl shadow-gold/20 transition-all hover:bg-gold hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
                            >
                                Add to Library & Canvas
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onConfirm()}
                                className="lg:hidden w-full rounded-md bg-white/5 border border-line px-6 py-4 text-[10px] font-semibold uppercase tracking-normal text-text-dim hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Just add to canvas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
