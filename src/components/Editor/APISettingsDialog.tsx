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
            <div className="w-full max-w-sm rounded-3xl bg-[#1e2229] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white">
                                API Settings
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Stock Integration</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-gray-400 transition-all active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase px-1">Unsplash Access Key</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type="password"
                                    value={config.unsplashAccessKey}
                                    onChange={(e) => setConfig({ ...config, unsplashAccessKey: e.target.value })}
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 pl-12 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Enter Access Key"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase px-1">Pexels API Key</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type="password"
                                    value={config.pexelsKey}
                                    onChange={(e) => setConfig({ ...config, pexelsKey: e.target.value })}
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 pl-12 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Enter Pexels Key"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-500 uppercase px-1">Pixabay API Key</label>
                            <div className="relative">
                                <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                <input
                                    type="password"
                                    value={config.pixabayKey}
                                    onChange={(e) => setConfig({ ...config, pixabayKey: e.target.value })}
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 pl-12 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Enter Pixabay Key"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-[8px] font-bold text-gray-500 leading-relaxed uppercase tracking-tighter text-center">
                        API keys enable high-quality stock photo searching. Settings are synchronized with your personal self-hosted storage.
                    </p>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] rounded-2xl bg-blue-600 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
