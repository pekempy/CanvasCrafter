"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { GOOGLE_FONTS } from "@/lib/fonts";
import {
    Plus, Palette, Type, Shield, Trash2,
    ChevronRight, Hash, Edit3, Save, X,
    Check, PlusCircle, MinusCircle, ChevronLeft, Image as ImageIcon,
    ChevronDown, Layout, Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import WebFont from "webfontloader";
import CustomAssetItem from "./CustomAssetItem";
import FontPicker from "./FontPicker";

export default function BrandPanel() {
    const { brandKits, setBrandKits, assetFolders, updateSelectedObject, addImage, maskShapeWithImage, selectedObject, customFonts, savedDesigns, loadTemplate, deleteDesign } = useCanvas();
    const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"colours" | "images" | "templates">("colours");
    const [editingBrandName, setEditingBrandName] = useState(false);
    const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);

    const activeKit = brandKits.find(k => k.id === activeBrandId);

    const createKit = () => {
        const newKit = {
            id: Math.random().toString(36).substr(2, 9),
            name: "New Brand Kit",
            colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
            fonts: ["Inter", "Oswald"],
            images: [],
            assetFolderIds: []
        };
        setBrandKits([newKit, ...brandKits]);
        setActiveBrandId(newKit.id);
        setActiveTab("colours");
        setEditingBrandName(true);
    };

    const deleteKit = (id: string) => {
        if (confirm("Delete this brand kit?")) {
            setBrandKits(brandKits.filter(k => k.id !== id));
            if (activeBrandId === id) setActiveBrandId(null);
        }
    };

    const updateKit = (id: string, updates: any) => {
        setBrandKits(brandKits.map(k => k.id === id ? { ...k, ...updates } : k));
    };

    const addColor = (id: string) => {
        if (activeKit) {
            updateKit(id, { colors: [...activeKit.colors, "#ffffff"] });
        }
    };

    const removeColor = (id: string, index: number) => {
        if (activeKit) {
            const newColors = [...activeKit.colors];
            newColors.splice(index, 1);
            updateKit(id, { colors: newColors });
        }
    };

    const addFont = (id: string, font: string) => {
        if (activeKit && !activeKit.fonts.includes(font)) {
            updateKit(id, { fonts: [...activeKit.fonts, font] });
        }
    };

    const removeFont = (id: string, font: string) => {
        if (activeKit) {
            updateKit(id, { fonts: activeKit.fonts.filter(f => f !== font) });
        }
    };

    const handleFontClick = (font: string) => {
        WebFont.load({
            google: { families: [font] },
            active: () => {
                updateSelectedObject({ fontFamily: font });
            }
        });
    };

    // Render Submenu for Active Kit
    if (activeBrandId && activeKit) {
        return (
            <div className="flex h-full w-full flex-col bg-[#181a20]">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 bg-[#1e2229]">
                    <button
                        onClick={() => setActiveBrandId(null)}
                        className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex-1 flex items-center justify-between">
                        {editingBrandName ? (
                            <input
                                autoFocus
                                type="text"
                                value={activeKit.name}
                                onChange={(e) => updateKit(activeKit.id, { name: e.target.value })}
                                onBlur={() => setEditingBrandName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingBrandName(false)}
                                className="bg-transparent text-xs font-black uppercase tracking-tight text-white border-b border-blue-500 focus:outline-none w-full mr-2"
                            />
                        ) : (
                            <h3
                                onDoubleClick={() => setEditingBrandName(true)}
                                className="text-xs font-black uppercase tracking-widest text-white truncate cursor-pointer"
                                title="Double click to edit"
                            >
                                {activeKit.name}
                            </h3>
                        )}
                        <button onClick={() => deleteKit(activeKit.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-[#1e2229]">
                    <button onClick={() => setActiveTab("colours")} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'colours' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>Colours & Fonts</button>
                    <button onClick={() => setActiveTab("images")} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'images' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>Images</button>
                    <button onClick={() => setActiveTab("templates" as any)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === ('templates' as any) ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}>Templates</button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
                    {/* COLOURS & FONTS TAB */}
                    {activeTab === 'colours' && (
                        <div className="space-y-6">
                            {/* COLOURS */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Colours</p>
                                    <button onClick={() => addColor(activeKit.id)} className="text-blue-500 hover:text-blue-400 transition-colors">
                                        <PlusCircle className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 px-1">
                                    {activeKit.colors.map((color, idx) => (
                                        <div key={idx} className="relative group/color">
                                            <button
                                                onClick={() => updateSelectedObject({ fill: color })}
                                                className="h-10 w-10 rounded-xl border border-white/10 shadow-xl transition-transform hover:scale-110 active:scale-90"
                                                style={{ backgroundColor: color }}
                                            />
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => {
                                                    const newColors = [...activeKit.colors];
                                                    newColors[idx] = e.target.value;
                                                    updateKit(activeKit.id, { colors: newColors });
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <button
                                                onClick={() => removeColor(activeKit.id, idx)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/color:opacity-100 transition-opacity scale-75"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-white/5 mx-1" />

                            {/* FONTS */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Typography</p>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsFontPickerOpen(!isFontPickerOpen)}
                                            className="flex items-center gap-2 rounded-lg bg-[#181a20] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                                        >
                                            {isFontPickerOpen ? <X className="h-3 w-3" /> : <PlusCircle className="h-3.5 w-3.5 text-blue-500" />}
                                            {isFontPickerOpen ? "Close" : "Add Font"}
                                        </button>

                                        {isFontPickerOpen && (
                                            <div className="absolute right-0 top-full mt-2 z-[100] w-64 shadow-2xl animate-in slide-in-from-top-2">
                                                <div className="rounded-2xl bg-[#1e2229] border border-white/10 overflow-hidden">
                                                    <FontPicker
                                                        inline
                                                        onSelect={(font) => {
                                                            addFont(activeKit.id, font);
                                                            setIsFontPickerOpen(false);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {activeKit.fonts.map(font => (
                                        <div key={font} className="group/font flex items-center justify-between w-full rounded-xl hover:bg-white/5 transition-all text-left">
                                            <button
                                                onClick={() => handleFontClick(font)}
                                                className="flex-1 px-3 py-1.5 text-xs font-bold text-gray-300"
                                            >
                                                <span style={{ fontFamily: font }}>{font}</span>
                                            </button>
                                            <button
                                                onClick={() => removeFont(activeKit.id, font)}
                                                className="p-1 px-2 text-gray-600 hover:text-red-500 opacity-0 group-hover/font:opacity-100 transition-opacity"
                                            >
                                                <MinusCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* IMAGES TAB */}
                    {activeTab === 'images' && (
                        <div className="space-y-6">
                            {/* Folders tied to this brand */}
                            {assetFolders.filter(f => activeKit.assetFolderIds?.includes(f.id)).map(folder => (
                                <div key={folder.id}>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{folder.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {folder.assets.map((asset) => (
                                            <CustomAssetItem key={asset.id} asset={asset} folderId={folder.id} />
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Unassigned images or placeholder */}
                            {(!activeKit.assetFolderIds || activeKit.assetFolderIds.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30 px-4">
                                    <ImageIcon className="h-8 w-8 mb-3" />
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">No asset folders linked to this brand kit yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TEMPLATES TAB */}
                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {savedDesigns.filter(d => d.brandId === activeKit.id).map((design) => (
                                    <div
                                        key={design.id}
                                        onClick={() => loadTemplate(design.data)}
                                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-2 transition-all hover:bg-white/10 active:scale-95 flex flex-col"
                                    >
                                        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/50 border border-white/5 flex items-center justify-center relative">
                                            <img src={design.thumbnail} alt={design.name} className="h-full w-full object-contain" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); if (confirm("Delete design?")) deleteDesign(design.id); }}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <p className="mt-2 text-[10px] font-black text-gray-200 truncate px-1">{design.name}</p>
                                    </div>
                                ))}
                            </div>
                            {savedDesigns.filter(d => d.brandId === activeKit.id).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30 px-4">
                                    <Layout className="h-8 w-8 mb-3" />
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">No templates saved for this brand.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default View: List of Kits
    return (
        <div className="flex h-full w-full flex-col bg-[#181a20]">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#1e2229]">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Brand Kits</h3>
                </div>
                <button
                    onClick={createKit}
                    className="p-1.5 rounded-lg bg-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                    title="New Brand Kit"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {brandKits.map(kit => (
                    <button
                        key={kit.id}
                        onClick={() => { setActiveBrandId(kit.id); setActiveTab("colours"); }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group active:scale-95 text-left"
                    >
                        <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">
                            {kit.name}
                        </span>

                        {/* 2x2 Color Grid Preview */}
                        <div className="grid grid-cols-2 gap-1 w-8 h-8 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                            {kit.colors.slice(0, 4).map((c, i) => (
                                <div key={i} className="rounded-sm w-full h-full" style={{ backgroundColor: c }} />
                            ))}
                            {/* Fill empty spots if less than 4 colors */}
                            {Array.from({ length: Math.max(0, 4 - kit.colors.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="rounded-sm w-full h-full bg-white/5" />
                            ))}
                        </div>
                    </button>
                ))}

                {brandKits.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                        <Palette className="h-12 w-12 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Design your brand identity<br />Create a kit above</p>
                    </div>
                )}
            </div>
        </div>
    );
}
