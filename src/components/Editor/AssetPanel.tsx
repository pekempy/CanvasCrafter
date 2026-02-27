"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Upload, Image as ImageIcon, X, Search, Loader2, FolderPlus,
    Folder, MoreVertical, Plus, ChevronRight, Hash, ExternalLink,
    Globe, Cloud, AlertCircle, Info, Trash2, Shield, ChevronDown, Star
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

import CustomAssetItem from "./CustomAssetItem";

export default function AssetPanel() {
    const { addImage, assetFolders, setAssetFolders, maskShapeWithImage, selectedObject, brandKits, setBrandKits, apiConfig, setBackgroundImage, currentUser } = useCanvas();
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<"library" | "stock" | "clipart">("library");
    const [activeFolderId, setActiveFolderId] = useState("default");
    const [search, setSearch] = useState("");
    const [stockPhotos, setStockPhotos] = useState<any[]>([]);
    const [clipartPhotos, setClipartPhotos] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [librarySearch, setLibrarySearch] = useState("");
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const assetsToDisplay = useMemo(() => {
        if (activeFolderId === "favorites") {
            return assetFolders.flatMap(f => f.assets.filter(a => a.isFavorite).map(a => ({ ...a, folderId: f.id })));
        }
        if (activeFolderId === "default") {
            return assetFolders.flatMap(f => f.assets.map(a => ({ ...a, folderId: f.id })));
        }
        const folder = assetFolders.find(f => f.id === activeFolderId);
        return folder ? folder.assets.map(a => ({ ...a, folderId: activeFolderId })) : [];
    }, [assetFolders, activeFolderId]);

    const filteredAssets = assetsToDisplay.filter(asset =>
        !librarySearch || (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(librarySearch.toLowerCase())))
    );

    const searchStock = async () => {
        if (!search) return;
        setIsSearching(true);
        setError(null);
        setStockPhotos([]);

        const unsplashId = apiConfig.unsplashAccessKey || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        const pexelsKey = apiConfig.pexelsKey || process.env.NEXT_PUBLIC_PEXELS_API_KEY;

        try {
            const allResults: any[] = [];
            let unAuth = false;
            let unLimit = false;

            // 1. Fetch from Unsplash
            if (unsplashId) {
                try {
                    const pages = [1, 2];
                    const requests = pages.map(page =>
                        fetch(`https://api.unsplash.com/search/photos?query=${search}&per_page=30&page=${page}`, {
                            headers: { 'Authorization': `Client-ID ${unsplashId}` }
                        })
                    );
                    const responses = await Promise.all(requests);
                    for (const res of responses) {
                        if (res.ok) {
                            const data = await res.json();
                            allResults.push(...data.results);
                        } else {
                            if (res.status === 401) unAuth = true;
                            if (res.status === 403) unLimit = true;
                        }
                    }
                } catch (e) { console.error("Unsplash error", e); }
            }

            // 2. Fetch from Pexels
            if (pexelsKey) {
                try {
                    const res = await fetch(`https://api.pexels.com/v1/search?query=${search}&per_page=40`, {
                        headers: { 'Authorization': pexelsKey }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const mapped = data.photos.map((p: any) => ({
                            id: `pexels-${p.id}`,
                            urls: { regular: p.src.large2x || p.src.large, small: p.src.medium },
                            user: { name: p.photographer, links: { html: p.photographer_url } },
                            links: { html: p.url },
                            source: 'Pexels'
                        }));
                        allResults.push(...mapped);
                    }
                } catch (e) { console.error("Pexels error", e); }
            }

            if (allResults.length > 0) {
                // Shuffle for variety
                setStockPhotos(allResults.sort(() => Math.random() - 0.5));
            } else {
                const fallbacks = [
                    "photo-1441974231531-c6227db76b6e", "photo-1501854140801-50d01698950b",
                    "photo-1470071459604-3b5ec3a7fe05", "photo-1447752875215-b2761acb3c5d"
                ];
                setStockPhotos(fallbacks.map(id => ({
                    id,
                    urls: {
                        regular: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1080&q=80`,
                        small: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`
                    },
                    user: { name: "Nature Contributor", links: { html: "https://unsplash.com" } },
                    links: { html: "https://unsplash.com" }
                })));
                if (unAuth) setError("API Authentication Failed.");
                else if (unLimit) setError("Rate Limit Exceeded.");
                else if (!unsplashId && !pexelsKey) setError("No API keys configured. Set them in API Settings.");
            }
        } catch (e) {
            setError("Network issue. Using fallback gallery.");
        }
        setIsSearching(false);
    };

    const searchClipart = async () => {
        if (!search) return;
        setIsSearching(true);
        setError(null);
        setClipartPhotos([]);

        const key = apiConfig.pixabayKey || process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
        if (!key) {
            setError("Pixabay API key not configured.");
            setIsSearching(false);
            return;
        }

        try {
            const res = await fetch(`https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(search)}&image_type=vector&per_page=50`);
            if (res.ok) {
                const data = await res.json();
                setClipartPhotos(data.hits.map((hit: any) => ({
                    id: hit.id,
                    urls: {
                        regular: hit.webformatURL,
                        small: hit.previewURL
                    },
                    user: { name: hit.user, links: { html: `https://pixabay.com/users/${hit.user}-${hit.user_id}/` } },
                })));
            } else {
                setError("Failed to fetch clipart.");
            }
        } catch (e) {
            setError("Network issue fetching clipart.");
        }
        setIsSearching(false);
    };

    const trackDownload = async (photo: any) => {
        if (photo.links?.download_location) {
            const clientId = apiConfig.unsplashAccessKey || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
            try {
                await fetch(photo.links.download_location, {
                    headers: {
                        'Authorization': `Client-ID ${clientId}`
                    }
                });
            } catch (e) {
                console.error("Failed to track Unsplash download", e);
            }
        }
    };

    const handleAddImage = (photo: any) => {
        trackDownload(photo);
        addImage(photo.urls.regular);
    };

    const handleMaskImage = (photo: any) => {
        if (!selectedObject) return;
        trackDownload(photo);
        maskShapeWithImage(selectedObject, photo.urls.regular);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            const assetId = Date.now();
            let finalUrl = dataUrl;

            try {
                const res = await fetch('/api/images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: assetId.toString(),
                        url: dataUrl,
                        metadata: { folderId: activeFolderId }
                    })
                });
                const data = await res.json();
                if (data.url) finalUrl = data.url;
            } catch (e) {
                console.error("Failed to upload image during manual upload", e);
            }

            const updated = assetFolders.map(f => {
                if (f.id === activeFolderId) {
                    // Check if this folder is linked to any global brand
                    const isLinkedToGlobal = brandKits.some(k => k.assetFolderIds?.includes(activeFolderId) && (k as any).visibility === 'global');
                    const nextVisibility = isLinkedToGlobal ? 'global' : (f.visibility || 'private');

                    return {
                        ...f,
                        assets: [{
                            id: assetId,
                            url: finalUrl,
                            owner: currentUser || undefined,
                            visibility: nextVisibility
                        }, ...f.assets],
                        updatedAt: Date.now()
                    };
                }
                return f;
            });
            setAssetFolders(updated);
            addImage(finalUrl);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex h-full w-full flex-col bg-[#181a20]">
            {/* Tabs */}
            <div className="flex px-4 py-2 border-b border-white/5 gap-4">
                <button
                    onClick={() => setActiveTab('library')}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'library' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                >
                    My Library
                </button>
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'stock' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                >
                    Stock
                </button>
                <button
                    onClick={() => setActiveTab('clipart')}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === 'clipart' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-400'}`}
                >
                    Clipart
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === 'stock' ? (
                    <div className="p-3">
                        <div className="relative group mb-1.5">
                            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                                type="text"
                                style={{ paddingLeft: !search ? 'calc(2rem + 3em)' : undefined }}
                                placeholder="Search stock photos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        searchStock();
                                    }
                                }}
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all"
                            />
                        </div>

                        <div className="px-1 py-3 flex items-start gap-2 opacity-40 hover:opacity-100 transition-opacity">
                            <Info className="h-3 w-3 mt-0.5" />
                            <p className="text-[8px] font-black uppercase leading-tight tracking-tighter">
                                Photos provided by <a href="https://unsplash.com" target="_blank" className="underline text-blue-500">Unsplash</a> & <a href="https://pexels.com" target="_blank" className="underline text-blue-500">Pexels</a>.
                                High quality assets for your designs.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase border border-orange-500/20">
                                <AlertCircle className="h-3 w-3" /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {stockPhotos.map(photo => (
                                <AssetItem
                                    key={photo.id}
                                    photo={photo}
                                    onAdd={() => handleAddImage(photo)}
                                    onMask={() => handleMaskImage(photo)}
                                />
                            ))}
                        </div>

                        {stockPhotos.length === 0 && !isSearching && (
                            <div className="flex flex-col items-center justify-center py-24 text-center opacity-10">
                                <ImageIcon className="h-12 w-12 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Search to explore</p>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'clipart' ? (
                    <div className="p-3">
                        <div className="relative group mb-1.5">
                            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                                type="text"
                                style={{ paddingLeft: !search ? 'calc(2rem + 3em)' : undefined }}
                                placeholder="Search clipart..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        searchClipart();
                                    }
                                }}
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all"
                            />
                        </div>

                        <div className="px-1 py-3 flex items-start gap-2 opacity-40 hover:opacity-100 transition-opacity">
                            <Info className="h-3 w-3 mt-0.5" />
                            <p className="text-[8px] font-black uppercase leading-tight tracking-tighter">
                                Resources provided by <a href="https://pixabay.com" target="_blank" className="underline text-blue-500">Pixabay</a>. Ensure your API Key is stored inside your `.env` appropriately.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase border border-orange-500/20">
                                <AlertCircle className="h-3 w-3" /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-3">
                            {clipartPhotos.map(photo => (
                                <AssetItem
                                    key={photo.id}
                                    photo={photo}
                                    onAdd={() => handleAddImage(photo)}
                                    onMask={() => handleMaskImage(photo)}
                                />
                            ))}
                        </div>

                        {clipartPhotos.length === 0 && !isSearching && (
                            <div className="flex flex-col items-center justify-center py-24 text-center opacity-10">
                                <ImageIcon className="h-12 w-12 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Search to explore</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        {/* Folder Management Header */}
                        <div className="flex flex-col gap-3 mb-6 bg-[#1e2229] p-3 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={activeFolderId}
                                        onChange={(e) => setActiveFolderId(e.target.value)}
                                        className="w-full bg-white/10 text-xs font-black uppercase tracking-widest text-white border border-white/10 rounded-xl pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all hover:bg-white/20"
                                    >
                                        <option value="favorites" className="bg-[#181a20]">Favourite Assets</option>
                                        <hr className="border-white/5" />
                                        {assetFolders.map(f => (
                                            <option key={f.id} value={f.id} className="bg-[#181a20]">
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => {
                                        const name = prompt("Enter new folder name:");
                                        if (name) {
                                            const newId = Math.random().toString(36).substr(2, 9);
                                            setAssetFolders([...assetFolders, {
                                                id: newId,
                                                name,
                                                assets: [],
                                                owner: currentUser || undefined,
                                                visibility: 'private',
                                                updatedAt: Date.now()
                                            }]);
                                            setActiveFolderId(newId);
                                        }
                                    }}
                                    className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-colors"
                                    title="Create Folder"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                </button>
                                {activeFolderId !== "default" && (
                                    <>
                                        <button
                                            onClick={() => {
                                                const currentFolder = assetFolders.find(f => f.id === activeFolderId);
                                                const newName = prompt("Rename folder:", currentFolder?.name);
                                                if (newName) {
                                                    setAssetFolders(assetFolders.map(f => f.id === activeFolderId ? { ...f, name: newName, updatedAt: Date.now() } : f));
                                                }
                                            }}
                                            className="p-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-colors"
                                            title="Rename Folder"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Delete this folder and all its contents?")) {
                                                    setAssetFolders(assetFolders.filter(f => f.id !== activeFolderId));
                                                    setActiveFolderId("default");
                                                }
                                            }}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                            title="Delete Folder"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Brand Kit Linking */}
                            {activeFolderId !== "default" && (
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    <Shield className="h-2.5 w-2.5 text-blue-500/70" />
                                    <div className="relative flex-1">
                                        <select
                                            className="w-full bg-white/5 text-[8px] font-black uppercase tracking-[0.15em] text-gray-400 border border-white/5 rounded-md pl-2 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/30 appearance-none transition-all hover:bg-white/10 hover:text-white hover:border-white/10 cursor-pointer"
                                            onChange={(e) => {
                                                const brandId = e.target.value;
                                                const targetBrand = brandKits.find(k => k.id === brandId);
                                                const rawFolderId = (assetFolders.find(f => f.id === activeFolderId) as any)?.originalId || activeFolderId;

                                                if (brandId === "none") {
                                                    // Remove from all kits
                                                    setBrandKits(brandKits.map((k: any) => ({
                                                        ...k,
                                                        assetFolderIds: k.assetFolderIds?.filter((id: string) => id !== activeFolderId && id !== rawFolderId) || [],
                                                        updatedAt: Date.now()
                                                    })));
                                                } else {
                                                    // Add to selected kit
                                                    setBrandKits(brandKits.map((k: any) => {
                                                        if (k.id === brandId) {
                                                            const currentIds = k.assetFolderIds || [];
                                                            if (!currentIds.includes(rawFolderId)) {
                                                                return { ...k, assetFolderIds: [...currentIds, rawFolderId], updatedAt: Date.now() };
                                                            }
                                                        }
                                                        return k;
                                                    }));

                                                    // Sync folder visibility with brand
                                                    if (targetBrand && (targetBrand as any).visibility === 'global') {
                                                        setAssetFolders(assetFolders.map(f =>
                                                            (f.id === activeFolderId || (f as any).originalId === rawFolderId) ? {
                                                                ...f,
                                                                visibility: 'global',
                                                                assets: f.assets.map(a => ({ ...a, visibility: 'global' })),
                                                                updatedAt: Date.now()
                                                            } : f
                                                        ));
                                                    }
                                                }
                                            }}
                                            value={brandKits.find((k: any) => k.assetFolderIds?.includes(activeFolderId) || k.assetFolderIds?.includes((assetFolders.find(f => f.id === activeFolderId) as any)?.originalId))?.id || "none"}
                                        >
                                            <option value="none" className="bg-[#181a20]">No Brand Kit Linked</option>
                                            {brandKits.map((kit: any) => (
                                                <option key={kit.id} value={kit.id} className="bg-[#181a20]">{kit.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-gray-600 pointer-events-none group-hover:text-gray-400 transition-colors" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-8 mb-6 rounded-3xl border-2 border-dashed border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-3 group shrink-0"
                        >
                            <div className="p-3 rounded-full bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                                <Upload className="h-5 w-5 text-gray-500 group-hover:text-blue-500" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-400">Upload to {assetFolders.find(f => f.id === activeFolderId)?.name}</p>
                        </button>

                        <div className="relative group mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 transition-colors group-focus-within:text-blue-500" />
                            <input
                                type="text"
                                placeholder="Search by tags..."
                                value={librarySearch}
                                onChange={(e) => setLibrarySearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-20 overflow-y-auto w-full">
                            {filteredAssets.map(asset => (
                                <CustomAssetItem key={`${asset.folderId}-${asset.id}`} asset={asset} folderId={asset.folderId} />
                            ))}
                            {assetsToDisplay.length === 0 && (
                                <div className="col-span-2 flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                    {activeFolderId === "favorites" ? (
                                        <>
                                            <Star className="h-10 w-10 mb-3 text-yellow-500/50 fill-current" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">No favourite assets yet.<br />Click the heart icon to start!</p>
                                        </>
                                    ) : (
                                        <>
                                            <Folder className="h-8 w-8 mb-2" />
                                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Folder is empty</p>
                                        </>
                                    )}
                                </div>
                            )}
                            {assetsToDisplay.length !== 0 &&
                                librarySearch &&
                                filteredAssets.length === 0 && (
                                    <div className="col-span-2 flex flex-col items-center justify-center py-10 opacity-30 text-center">
                                        <Search className="h-8 w-8 mb-2" />
                                        <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">No matching tags</p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AssetItem({ photo, onAdd, onMask }: { photo: any; onAdd: () => void; onMask: () => void }) {
    const { selectedObject, setBackgroundImage } = useCanvas();
    const sourceName = photo.source || "Unsplash";
    const sourceLink = sourceName === "Pexels" ? "https://pexels.com" : "https://unsplash.com";

    return (
        <div className="group relative rounded-2xl bg-white/5 overflow-hidden border border-white/5 transition-all hover:scale-[1.05] hover:shadow-2xl">
            <div className="aspect-square relative overflow-hidden">
                <img src={photo.urls.small} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-125" />
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2 overflow-y-auto scrollbar-hide">
                    <button onClick={onAdd} className="w-full py-1.5 rounded-lg bg-blue-600 text-[9px] font-black uppercase text-white hover:bg-blue-700">Add to Canvas</button>
                    <button onClick={() => setBackgroundImage(photo.urls.regular)} className="w-full py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase text-white hover:bg-white/20 border border-white/20">Set Background</button>
                    {selectedObject && (
                        <button onClick={onMask} className="w-full py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase text-white hover:bg-white/20 border border-white/20 backdrop-blur-md">Mask Shape</button>
                    )}
                </div>
            </div>
            <div className="p-2 border-t border-white/5 bg-[#1e2229]">
                <p className="text-[7px] font-black uppercase tracking-tighter text-gray-500 truncate">
                    Photo by <a href={photo.user.links.html} target="_blank" className="text-blue-400 hover:underline">{photo.user.name}</a> on <a href={sourceLink} target="_blank" className="text-white hover:underline">{sourceName}</a>
                </p>
            </div>
        </div>
    )
}
