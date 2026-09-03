"use client";

import { useState, useEffect } from "react";
import { X, Globe, Key, Shield, AlertCircle } from "lucide-react";
import { useCanvas } from "@/store/useCanvasStore";

export default function APISettingsDialog({
    isOpen,
    onClose,
}: { isOpen: boolean; onClose: () => void }) {
    const { apiConfig, setApiConfig } = useCanvas();
    const [config, setConfig] = useState(apiConfig);

    useEffect(() => {
        if (isOpen) setConfig(apiConfig);
    }, [isOpen, apiConfig]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setApiConfig({
            unsplashAccessKey: config.unsplashAccessKey.trim(),
            pexelsKey: config.pexelsKey.trim(),
            pixabayKey: config.pixabayKey.trim()
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-lg bg-[1d222a] border border-line p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-gold/20 flex items-center justify-center text-gold">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-normal text-white">
                                API Settings
                            </h2>
                            <p className="text-[10px] text-text-mute font-bold uppercase tracking-tight">Stock Integration</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-text-dim transition-all active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-semibold text-text-mute uppercase px-1">Unsplash Access Key</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute" />
                                <input
                                    type="password"
                                    value={config.unsplashAccessKey}
                                    onChange={(e) => setConfig({ ...config, unsplashAccessKey: e.target.value })}
                                    className="w-full rounded-md border border-line bg-white/5 p-4 pl-12 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                                    placeholder="Enter Access Key"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-semibold text-text-mute uppercase px-1">Pexels API Key</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute" />
                                <input
                                    type="password"
                                    value={config.pexelsKey}
                                    onChange={(e) => setConfig({ ...config, pexelsKey: e.target.value })}
                                    className="w-full rounded-md border border-line bg-white/5 p-4 pl-12 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                                    placeholder="Enter Pexels Key"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-semibold text-text-mute uppercase px-1">Pixabay API Key</label>
                            <div className="relative">
                                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute" />
                                <input
                                    type="password"
                                    value={config.pixabayKey}
                                    onChange={(e) => setConfig({ ...config, pixabayKey: e.target.value })}
                                    className="w-full rounded-md border border-line bg-white/5 p-4 pl-12 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                                    placeholder="Enter Pixabay Key"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-[8px] font-bold text-text-mute leading-relaxed uppercase tracking-tighter text-center">
                        API keys enable high-quality stock photo searching. Settings are synchronized with your personal self-hosted storage.
                    </p>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md px-4 py-4 text-[10px] font-semibold uppercase tracking-normal text-text-mute hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] rounded-md bg-gold px-4 py-4 text-[10px] font-semibold uppercase tracking-normal text-white shadow-xl shadow-gold/20 hover:bg-gold active:scale-95 transition-all"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
