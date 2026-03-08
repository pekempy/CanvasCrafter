"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { X, Command, Move, Trash2, Copy, Layers, MousePointer2, ZoomIn, Palette, Type } from "lucide-react";

export default function HelpDialog() {
    const { isHelpOpen, setIsHelpOpen } = useCanvas();

    if (!isHelpOpen) return null;

    const shortcuts = [
        { key: "V", action: "Selection Tool", icon: <MousePointer2 className="h-3.5 w-3.5" /> },
        { key: "T", action: "Add Text", icon: <Type className="h-3.5 w-3.5" /> },
        { key: "Del / Backspace", action: "Delete Selected", icon: <Trash2 className="h-3.5 w-3.5" /> },
        { key: "Ctrl + C", action: "Copy Object", icon: <Copy className="h-3.5 w-3.5" /> },
        { key: "Ctrl + V", action: "Paste Object", icon: <Layers className="h-3.5 w-3.5" /> },
        { key: "Ctrl + Z", action: "Undo", icon: <Palette className="h-3.5 w-3.5" /> },
        { key: "Ctrl + Y", action: "Redo", icon: <Palette className="h-3.5 w-3.5" /> },
        { key: "Alt + Wheel", action: "Zoom In/Out", icon: <ZoomIn className="h-3.5 w-3.5" /> },
        { key: "Ctrl + G", action: "Group Selected", icon: <Layers className="h-3.5 w-3.5" /> },
        { key: "Ctrl + Shift + G", action: "Ungroup Selected", icon: <Layers className="h-3.5 w-3.5" /> },
        { key: "Arrows", action: "Nudge Object", icon: <Move className="h-3.5 w-3.5" /> },
        { key: "Shift + Click", action: "Multi-select", icon: <MousePointer2 className="h-3.5 w-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#1a1c22] border border-white/5 rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-white">KEYBOARD SHORTCUTS</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Master the editor with speed</p>
                    </div>
                    <button 
                        onClick={() => setIsHelpOpen(false)} 
                        className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl transition-all active:scale-95 border border-white/5"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5 relative h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {shortcuts.map((s, idx) => (
                        <div 
                            key={idx} 
                            className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl group hover:bg-white/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#252830] rounded-xl text-blue-500 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                    {s.icon}
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">{s.action}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {s.key.split(" + ").map((k, kIdx) => (
                                    <span key={kIdx} className="flex items-center gap-1">
                                        <kbd className="px-2.5 py-1.5 bg-[#0d0f14] border border-white/10 rounded-lg text-[10px] font-black text-gray-400 shadow-lg min-w-[32px] text-center">
                                            {k}
                                        </kbd>
                                        {kIdx < s.key.split(" + ").length - 1 && <span className="text-gray-700 text-[10px] font-black">+</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pro Tip: Hold Alt to pan canvas</span>
                    </div>
                    <button 
                        onClick={() => setIsHelpOpen(false)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
