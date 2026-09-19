"use client";

import { useCanvas, Player } from "@/store/useCanvasStore";
import { Users, Plus, Trash2, Edit2, Folder, Image as ImageIcon, Check, X, Search, Sparkles, Award } from "lucide-react";
import React, { useState, useMemo } from "react";
import { normalizeSearchString } from "@/utils/normalize";
import { sortFoldersNaturally } from "@/utils/folderSort";

export default function RosterPanel() {
    const { roster, addOrUpdatePlayer, deletePlayer, assetFolders } = useCanvas();
    const [search, setSearch] = useState("");
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [position, setPosition] = useState("Forward");
    const [folderId, setFolderId] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [sponsorAssetId, setSponsorAssetId] = useState("");
    const [sponsorUrl, setSponsorUrl] = useState("");
    const [sponsorName, setSponsorName] = useState("");

    const openCreate = () => {
        setIsCreating(true);
        setEditingPlayer(null);
        setName("");
        setNumber("");
        setPosition("Forward");
        setFolderId("");
        setPhotoUrl("");
        setSponsorAssetId("");
        setSponsorUrl("");
        setSponsorName("");
    };

    const openEdit = (p: Player) => {
        setEditingPlayer(p);
        setIsCreating(false);
        setName(p.name);
        setNumber(p.number);
        setPosition(p.position || "Forward");
        setFolderId(p.folderId || "");
        setPhotoUrl(p.photoUrl || "");
        setSponsorAssetId(p.sponsorAssetId || "");
        setSponsorUrl(p.sponsorUrl || "");
        setSponsorName(p.sponsorName || "");
    };

    const cancelForm = () => {
        setIsCreating(false);
        setEditingPlayer(null);
    };

    const saveForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // If folder selected and no custom photo picked, default to the first asset in that folder
        let finalPhoto = photoUrl;
        if (!finalPhoto && folderId) {
            const folder = assetFolders.find(f => f.id === folderId);
            if (folder && folder.assets.length > 0) {
                finalPhoto = folder.assets[0].url;
            }
        }

        const id = editingPlayer ? editingPlayer.id : `p-${Date.now()}`;
        addOrUpdatePlayer({
            id,
            name: name.trim(),
            number: number.trim(),
            position: position.trim(),
            folderId: folderId || undefined,
            photoUrl: finalPhoto || undefined,
            sponsorAssetId: sponsorAssetId || undefined,
            sponsorUrl: sponsorUrl || undefined,
            sponsorName: sponsorName.trim() || undefined
        });

        cancelForm();
    };

    // Auto-populate roster from subfolders of Seahawks - Players or any folders with numbering e.g. "6 - E. Hehir"
    const autoPopulateFromFolders = () => {
        const playerFolders = assetFolders.filter(f => {
            if (f.parentId && assetFolders.some(p => p.id === f.parentId && p.name.toLowerCase().includes("player"))) {
                return true;
            }
            return /^\d+\s*-\s*.+/.test(f.name);
        });

        playerFolders.forEach(f => {
            const match = f.name.match(/^(\d+)\s*-\s*(.+)$/);
            const num = match ? match[1] : "";
            const rawName = match ? match[2] : f.name;
            const existing = roster.find(p => p.folderId === f.id || (p.number === num && p.name.toLowerCase().includes(rawName.toLowerCase())));

            const defaultPhoto = f.assets.length > 0 ? f.assets[0].url : undefined;

            if (!existing) {
                addOrUpdatePlayer({
                    id: `p-${f.id}`,
                    name: rawName,
                    number: num,
                    position: "Forward",
                    folderId: f.id,
                    photoUrl: defaultPhoto
                });
            } else if (!existing.folderId) {
                addOrUpdatePlayer({
                    ...existing,
                    folderId: f.id,
                    photoUrl: existing.photoUrl || defaultPhoto
                });
            }
        });
    };

    const filteredRoster = useMemo(() => {
        const q = normalizeSearchString(search);
        return roster
            .filter(p => {
                if (!q) return true;
                const normName = normalizeSearchString(p.name);
                const normNumber = normalizeSearchString(p.number);
                const normPos = normalizeSearchString(p.position);
                const normSponsor = normalizeSearchString(p.sponsorName);
                return normName.includes(q) || normNumber.includes(q) || normPos.includes(q) || normSponsor.includes(q);
            })
            .sort((a, b) => {
                const numA = parseInt(a.number) || 999;
                const numB = parseInt(b.number) || 999;
                return numA - numB;
            });
    }, [roster, search]);

    // Available images from the selected folder for photo selection
    const selectedFolderAssets = useMemo(() => {
        if (!folderId) return [];
        const f = assetFolders.find(fold => fold.id === folderId);
        return f ? f.assets : [];
    }, [folderId, assetFolders]);

    // All available sponsor assets: filter specifically to Seahawks - Sponsors or folders/assets marked as sponsor
    const allSponsorAssets = useMemo(() => {
        const list: { id: string; url: string; name: string; folderName: string }[] = [];
        
        // Find folders that are designated for sponsors
        const sponsorFolders = assetFolders.filter(f => f.name.toLowerCase().includes("sponsor"));

        if (sponsorFolders.length > 0) {
            sponsorFolders.forEach(f => {
                f.assets.forEach(a => {
                    list.push({
                        id: String(a.id),
                        url: a.url,
                        name: (a.tags && a.tags.length > 0 ? a.tags[0] : "") || f.name,
                        folderName: f.name
                    });
                });
            });
        } else {
            // Fallback only if no sponsor folder exists: look for explicit sponsor tags
            assetFolders.forEach(f => {
                f.assets.forEach(a => {
                    const tagNames = Array.isArray(a.tags) ? a.tags.join(" ").toLowerCase() : "";
                    if (tagNames.includes("sponsor")) {
                        list.push({
                            id: String(a.id),
                            url: a.url,
                            name: (a.tags && a.tags.length > 0 ? a.tags[0] : "") || "Sponsor",
                            folderName: f.name
                        });
                    }
                });
            });
        }
        return list;
    }, [assetFolders]);

    return (
        <div className="flex h-full w-full flex-col bg-[16191f] text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-surface">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gold" />
                    <h2 className="text-xs font-semibold uppercase tracking-wider">Team Roster</h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-text-mute">
                        {roster.length}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={autoPopulateFromFolders}
                        title="Auto-fill players from player folders"
                        className="flex items-center gap-1 rounded-md bg-white/5 hover:bg-white/10 px-2 py-1 text-[10px] font-medium text-text-dim hover:text-white transition-colors"
                    >
                        <Sparkles className="h-3 w-3 text-gold" /> Auto-Sync
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1 rounded-md bg-gold hover:bg-gold/90 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {/* Search Bar */}
                {!isCreating && !editingPlayer && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-mute" />
                        <input
                            type="text"
                            placeholder="Search by name, number, position..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-line bg-white/5 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                    </div>
                )}

                {/* Form: Add / Edit Player */}
                {(isCreating || editingPlayer) && (
                    <form onSubmit={saveForm} className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-line pb-2">
                            <h3 className="text-xs font-bold text-white">
                                {isCreating ? "Add New Player" : `Edit ${editingPlayer?.name}`}
                            </h3>
                            <button type="button" onClick={cancelForm} className="text-text-mute hover:text-white">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[9px] font-semibold uppercase text-text-mute">Player Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ethan Hehir"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-md border border-line bg-white/5 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-semibold uppercase text-text-mute">Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 6"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full rounded-md border border-line bg-white/5 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-semibold uppercase text-text-mute">Position</label>
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className="w-full rounded-md border border-line bg-white/5 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                            >
                                <option value="Forward" className="bg-[#16191f]">Forward</option>
                                <option value="Defence" className="bg-[#16191f]">Defence</option>
                                <option value="Netminder" className="bg-[#16191f]">Netminder / Goalie</option>
                                <option value="Coach" className="bg-[#16191f]">Coach</option>
                                <option value="Staff" className="bg-[#16191f]">Staff</option>
                            </select>
                        </div>

                        {/* Link to Asset Folder */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-semibold uppercase text-text-mute flex items-center gap-1">
                                <Folder className="h-2.5 w-2.5 text-gold" /> Linked Asset Folder
                            </label>
                            <select
                                value={folderId}
                                onChange={(e) => {
                                    setFolderId(e.target.value);
                                    // Default photo to first in selected folder if not already set
                                    const fol = assetFolders.find(f => f.id === e.target.value);
                                    if (fol && fol.assets.length > 0 && !photoUrl) {
                                        setPhotoUrl(fol.assets[0].url);
                                    }
                                }}
                                className="w-full rounded-md border border-line bg-white/5 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer"
                            >
                                <option value="" className="bg-[#16191f]">No Folder Linked</option>
                                {(() => {
                                    const renderOptions = (parentId?: string, depth = 0): React.ReactNode[] => {
                                        const rawItems = assetFolders.filter(f => (f.parentId || undefined) === parentId);
                                        const items = sortFoldersNaturally(rawItems);
                                        return items.flatMap(f => [
                                            <option key={f.id} value={f.id} className="bg-[#16191f]">
                                                {depth > 0 ? `${'\u00A0\u00A0'.repeat(depth)}↳ ` : ''}{f.name} ({f.assets.length} photos)
                                            </option>,
                                            ...renderOptions(f.id, depth + 1)
                                        ]);
                                    };
                                    return renderOptions(undefined, 0);
                                })()}
                            </select>
                        </div>

                        {/* Headshot Photo Preview / Picker */}
                        {selectedFolderAssets.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[9px] font-semibold uppercase text-text-mute">
                                    Select Headshot Photo
                                </label>
                                <div className="grid grid-cols-5 gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/5 rounded-md border border-line">
                                    {selectedFolderAssets.map((asset) => (
                                        <button
                                            type="button"
                                            key={asset.id}
                                            onClick={() => setPhotoUrl(asset.url)}
                                            className={`relative aspect-square rounded overflow-hidden border transition-all ${photoUrl === asset.url ? 'border-gold ring-1 ring-gold' : 'border-line opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={asset.url} alt="" className="h-full w-full object-cover" />
                                            {photoUrl === asset.url && (
                                                <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-white drop-shadow" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assign Sponsor Asset */}
                        <div className="space-y-2 pt-2 border-t border-line">
                            <label className="text-[9px] font-semibold uppercase text-text-mute flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <Award className="h-3 w-3 text-gold" /> Player Sponsor Asset
                                </span>
                                {sponsorUrl && (
                                    <button
                                        type="button"
                                        onClick={() => { setSponsorAssetId(""); setSponsorUrl(""); setSponsorName(""); }}
                                        className="text-[8px] text-red-400 hover:underline"
                                    >
                                        Clear Sponsor
                                    </button>
                                )}
                            </label>

                            {/* Custom Sponsor Name */}
                            <input
                                type="text"
                                placeholder="Sponsor Name (e.g. Southwood Garden Centre)"
                                value={sponsorName}
                                onChange={(e) => setSponsorName(e.target.value)}
                                className="w-full rounded-md border border-line bg-white/5 px-2.5 py-1 text-xs text-white placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-gold"
                            />

                            {/* Select from existing assets */}
                            <div className="space-y-1">
                                <p className="text-[8px] text-text-mute">Choose sponsor logo from assets:</p>
                                <div className="grid grid-cols-5 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white/5 rounded-md border border-line">
                                    {allSponsorAssets.map((asset) => (
                                        <button
                                            type="button"
                                            key={asset.id}
                                            onClick={() => {
                                                setSponsorAssetId(asset.id);
                                                setSponsorUrl(asset.url);
                                                if (!sponsorName && asset.name && asset.name !== "Asset") {
                                                    setSponsorName(asset.name);
                                                }
                                            }}
                                            className={`group relative flex flex-col aspect-square rounded overflow-hidden border p-1 transition-all ${sponsorUrl === asset.url ? 'border-gold bg-gold/20 ring-1 ring-gold' : 'border-line bg-surface hover:border-gold/50'}`}
                                            title={`${asset.name} (${asset.folderName})`}
                                        >
                                            <img src={asset.url} alt="" className="h-full w-full object-contain" />
                                            {sponsorUrl === asset.url && (
                                                <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-white drop-shadow" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="rounded-md px-3 py-1 text-xs text-text-mute hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-gold hover:bg-gold/90 px-3 py-1 text-xs font-bold text-white transition-colors"
                            >
                                {isCreating ? "Add Player" : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Player List */}
                <div className="space-y-2">
                    {filteredRoster.map((player) => {
                        const linkedFolder = assetFolders.find(f => f.id === player.folderId);
                        const photo = player.photoUrl || (linkedFolder && linkedFolder.assets.length > 0 ? linkedFolder.assets[0].url : "");

                        return (
                            <div
                                key={player.id}
                                className="group relative flex items-center justify-between rounded-xl border border-line bg-surface-2 p-2.5 hover:border-gold/50 transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Number / Photo Avatar */}
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-black flex items-center justify-center">
                                        {photo ? (
                                            <img src={photo} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-black text-gold">
                                                {player.number ? `#${player.number}` : <ImageIcon className="h-4 w-4 opacity-40" />}
                                            </span>
                                        )}
                                        {player.number && photo && (
                                            <div className="absolute bottom-0 right-0 bg-black/80 px-1 py-0.2 rounded-tl text-[8px] font-black text-gold">
                                                #{player.number}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="truncate text-xs font-bold text-white">
                                                {player.name}
                                            </h4>
                                            {player.number && (
                                                <span className="text-[10px] font-extrabold text-gold">
                                                    #{player.number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-text-mute mt-0.5">
                                            <span>{player.position || "Forward"}</span>
                                            {linkedFolder && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate flex items-center gap-0.5 text-text-dim">
                                                        <Folder className="h-2.5 w-2.5" />
                                                        {linkedFolder.assets.length} photos
                                                    </span>
                                                </>
                                            )}
                                            {player.sponsorUrl && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate flex items-center gap-1 text-gold">
                                                        <Award className="h-2.5 w-2.5" />
                                                        {player.sponsorName || "Sponsored"}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(player)}
                                        className="p-1.5 rounded-md hover:bg-white/10 text-text-mute hover:text-white"
                                        title="Edit Player"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Remove ${player.name} from roster?`)) {
                                                deletePlayer(player.id);
                                            }
                                        }}
                                        className="p-1.5 rounded-md hover:bg-red-500/20 text-text-mute hover:text-red-400"
                                        title="Delete Player"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredRoster.length === 0 && !isCreating && !editingPlayer && (
                        <div className="py-12 text-center text-text-mute space-y-2">
                            <Users className="mx-auto h-8 w-8 opacity-20" />
                            <p className="text-xs">No players on roster yet.</p>
                            <p className="text-[10px] text-text-dim">
                                Click <strong>Auto-Sync</strong> to import from your player asset folders, or add one manually.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
