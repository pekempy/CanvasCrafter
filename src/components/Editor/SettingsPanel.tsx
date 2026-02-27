"use client";

import { useCanvas } from "@/store/useCanvasStore";
import {
    Settings, User, Shield, Share2, Key,
    Plus, Trash2, Globe, Lock, ChevronRight,
    Loader2, Check, ExternalLink, Mail
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPanel() {
    const {
        brandKits, setBrandKits,
        assetFolders, setAssetFolders,
        currentUser,
        apiConfig, setApiConfig
    } = useCanvas();

    const [users, setUsers] = useState<{ username: string, lastLogin: number }[]>([]);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [userError, setUserError] = useState<string | null>(null);
    const [userSuccess, setUserSuccess] = useState<string | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch('/api/auth/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) { }
        setIsLoadingUsers(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserError(null);
        setUserSuccess(null);

        try {
            const res = await fetch('/api/auth/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setUserSuccess(`User ${newUsername} created!`);
                setNewUsername("");
                setNewPassword("");
                setIsCreatingUser(false);
                fetchUsers();
            } else {
                setUserError(data.error || "Failed to create user");
            }
        } catch (e) {
            setUserError("Connection error");
        }
    };

    const toggleBrandVisibility = (kitId: string, currentVisibility: string) => {
        const isGlobal = currentVisibility === 'global';
        if (confirm(isGlobal ? "Make this brand kit private?" : "Share this brand kit globally with all users? This will also share associated asset folders.")) {
            const nextVisibility = isGlobal ? 'private' : 'global';

            // Update Brand Kits
            setBrandKits(brandKits.map(k =>
                k.id === kitId ? { ...k, visibility: nextVisibility, updatedAt: Date.now() } : k
            ));

            // Cascade to Asset Folders & Assets
            const kit = brandKits.find(k => k.id === kitId);
            if (kit && kit.assetFolderIds && kit.assetFolderIds.length > 0) {
                setAssetFolders(assetFolders.map(f => {
                    if (kit.assetFolderIds.includes(f.id)) {
                        return {
                            ...f,
                            visibility: nextVisibility,
                            assets: f.assets.map(a => ({ ...a, visibility: nextVisibility })),
                            updatedAt: Date.now()
                        };
                    }
                    return f;
                }));
            }
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-[#13151a]">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#1e2229]">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">System Settings</h3>
                <Settings className="h-4 w-4 text-gray-400" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">

                {/* USER MANAGEMENT */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-blue-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Team Members</h4>
                        </div>
                        <button
                            onClick={() => setIsCreatingUser(!isCreatingUser)}
                            className="p-1 rounded-lg bg-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {isCreatingUser && (
                        <form onSubmit={handleCreateUser} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-gray-600 ml-1">New Identity</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Username"
                                    value={newUsername}
                                    onChange={e => setNewUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-gray-600 ml-1">Access Phrase</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            {userError && <p className="text-[9px] font-bold text-red-400 px-1">{userError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase py-2 rounded-xl transition-all"
                                >
                                    Create User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingUser(false)}
                                    className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] font-black uppercase py-2 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {userSuccess && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <p className="text-[9px] font-bold text-green-400">{userSuccess}</p>
                        </div>
                    )}

                    <div className="space-y-1">
                        {isLoadingUsers ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-600" /></div>
                        ) : users.map(u => (
                            <div key={u.username} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3 group">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-white/5">
                                        <span className="text-[10px] font-black text-blue-400 uppercase">{u.username[0]}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white">{u.username} {u.username === currentUser && <span className="text-[8px] text-blue-500 ml-1">(YOU)</span>}</p>
                                        <p className="text-[8px] font-bold text-gray-600 uppercase">Last active: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</p>
                                    </div>
                                </div>
                                <Shield className="h-3.5 w-3.5 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-white/5 mx-1" />

                {/* BRAND ACCESS MANAGEMENT */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Share2 className="h-3.5 w-3.5 text-purple-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Brand Privacy</h4>
                    </div>

                    <div className="space-y-2">
                        {brandKits.map(kit => (
                            <div key={kit.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-3 hover:bg-white/10 transition-all">
                                <div>
                                    <p className="text-xs font-black text-white">{kit.name}</p>
                                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                                        Owner: {kit.owner || 'System'} • {(kit as any).visibility || 'private'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => toggleBrandVisibility(kit.id, (kit as any).visibility || 'private')}
                                    className={`p-2 rounded-xl transition-all ${(kit as any).visibility === 'global' ? 'bg-blue-600/20 text-blue-500' : 'bg-white/5 text-gray-600 hover:text-white'}`}
                                    title={(kit as any).visibility === 'global' ? "Shared Globally" : "Private to Owner"}
                                >
                                    {(kit as any).visibility === 'global' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        ))}
                        {brandKits.length === 0 && (
                            <p className="text-[9px] font-bold text-gray-600 text-center py-4 uppercase tracking-widest italic">No brand kits found</p>
                        )}
                    </div>
                </section>

                <div className="h-px bg-white/5 mx-1" />

                {/* API CONFIGURATION */}
                <section className="space-y-4 pb-4">
                    <div className="flex items-center gap-2 px-1">
                        <Key className="h-3.5 w-3.5 text-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Media Partners</h4>
                    </div>

                    <div className="space-y-4 bg-white/5 border border-white/5 rounded-2xl p-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unsplash API</label>
                                <ExternalLink className="h-3 w-3 text-gray-700" />
                            </div>
                            <input
                                type="password"
                                value={apiConfig.unsplashAccessKey}
                                onChange={e => setApiConfig({ ...apiConfig, unsplashAccessKey: e.target.value })}
                                placeholder="Access Key..."
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pexels Key</label>
                                <ExternalLink className="h-3 w-3 text-gray-700" />
                            </div>
                            <input
                                type="password"
                                value={apiConfig.pexelsKey}
                                onChange={e => setApiConfig({ ...apiConfig, pexelsKey: e.target.value })}
                                placeholder="API Key..."
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pixabay Key</label>
                                <ExternalLink className="h-3 w-3 text-gray-700" />
                            </div>
                            <input
                                type="password"
                                value={apiConfig.pixabayKey}
                                onChange={e => setApiConfig({ ...apiConfig, pixabayKey: e.target.value })}
                                placeholder="API Key..."
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
