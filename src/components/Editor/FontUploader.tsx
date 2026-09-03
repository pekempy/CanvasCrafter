"use client";

import { useCanvas } from "@/store/useCanvasStore";
import { Upload, Type, FileType, Check, Plus, Folder } from "lucide-react";
import { useState, useRef } from "react";

export default function FontUploader() {
    const { addCustomFont, updateSelectedObject } = useCanvas();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fontName = file.name.split('.')[0].replace(/[^a-zA-Z]/g, '');
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const dataUrl = event.target?.result as string;
                await addCustomFont(fontName, dataUrl);

                // Add to active brand kit or a generic "Uploaded Fonts" list
                updateSelectedObject({ fontFamily: fontName });
            } catch (err) {
                console.error("Font loading failed", err);
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="p-6 border-b border-line">
            <h3 className="text-[10px] font-semibold uppercase tracking-normal text-text-mute mb-4">Custom Typography</h3>
            <input type="file" ref={fileInputRef} onChange={handleFontUpload} accept=".ttf,.otf,.woff,.woff2" className="hidden" />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 rounded-md border-2 border-dashed border-line bg-white/5 p-4 text-xs font-semibold text-text-dim hover:border-gold/50 hover:bg-gold/5 transition-all group"
            >
                {isUploading ? (
                    <span className="animate-pulse">Loading Font...</span>
                ) : (
                    <>
                        <Upload className="h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                        UPLOAD CUSTOM FONT
                    </>
                )}
            </button>
        </div>
    );
}
