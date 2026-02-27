"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as fabric from "fabric";
import debounce from "lodash.debounce";
import jsPDF from "jspdf";
import { getCustomFonts, saveCustomFont, deleteCustomFont } from "@/lib/idb";
import { smartResizeSelected as smartResizeUtils } from "@/utils/smartResize";
import { handleObjectSnapping, clearGuides } from "@/utils/snapping";
import * as backgroundRemoval from "@imgly/background-removal";
import { detectEdgesAndAddStroke } from "@/utils/edgeDetection";
import { preloadFontsFromJSON } from "@/utils/fontLoader";

interface BrandKit {
    id: string;
    name: string;
    colors: string[];
    fonts: string[];
    images: string[];
    assetFolderIds: string[];
}

export interface CustomAsset {
    id: number;
    url: string;
    tags?: string[];
    isFavorite?: boolean;
    brandId?: string;
    timestamp?: number;
}

export interface AssetFolder {
    id: string;
    name: string;
    assets: CustomAsset[];
}

interface CanvasContextType {
    canvas: fabric.Canvas | null;
    setCanvas: (canvas: fabric.Canvas | null) => void;
    selectedObject: fabric.Object | null;
    theme: "dark" | "light";
    setTheme: (theme: "dark" | "light") => void;
    canvasSize: { width: number; height: number };
    setCanvasSize: (size: { width: number; height: number }) => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    panOffset: { x: number; y: number };
    setPanOffset: (offset: { x: number; y: number }) => void;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    fitToScreen: () => void;
    updateTick: number;
    forceUpdate: () => void;

    // Creation
    addRect: () => void;
    addText: () => void;
    addCircle: () => void;
    addTriangle: () => void;
    addStar: (points?: number) => void;
    addHexagon: () => void;
    addDiamond: () => void;
    addArrow: () => void;
    addHeart: () => void;
    addBadge: () => void;
    addCloud: () => void;
    addPolygon: (sides: number) => void;
    addImage: (url: string) => void;
    copySelected: () => void;
    cutSelected: () => void;
    pasteSelected: () => void;
    enterCropMode: () => void;
    confirmCrop: () => void;
    cancelCrop: () => void;
    isCropMode: boolean;
    applyAIEdgeStroke: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Manipulation
    clearCanvas: () => void;
    updateSelectedObject: (properties: any) => void;
    applyFilter: (filterType: string, value: any) => void;
    clearEffects: () => void;
    updateMaskProperties: (properties: any) => void;
    bringToFront: () => void;
    sendToBack: () => void;
    deleteSelected: () => void;
    duplicateSelected: () => void;
    releaseMask: () => void;
    groupSelected: () => void;
    ungroupSelected: () => void;
    alignSelected: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;

    // Advanced Features
    maskShapeWithImage: (shape: fabric.Object, imageUrl: string) => void;
    // New utilities
    smartResizeSelected: (width: number, height: number) => void;
    apiConfig: { unsplashAccessKey: string; pexelsKey: string; pixabayKey: string };
    setApiConfig: (config: { unsplashAccessKey: string; pexelsKey: string; pixabayKey: string }) => void;

    saveToTemplate: (name: string, brandId?: string, parentId?: string) => void;
    loadTemplate: (json: string, name?: string) => void;
    deleteDesign: (id: string) => void;
    exportAsFormat: (format: 'png' | 'jpeg' | 'pdf') => void;
    savedDesigns: any[];
    canvasName: string;
    setCanvasName: (name: string) => void;

    // Organizations
    brandKits: BrandKit[];
    setBrandKits: (kits: BrandKit[]) => void;
    assetFolders: AssetFolder[];
    setAssetFolders: (folders: AssetFolder[]) => void;
    templateFolders: { id: string; name: string; designIds: string[] }[];
    setTemplateFolders: (folders: { id: string; name: string; designIds: string[] }[]) => void;

    // Custom Fonts
    customFonts: { name: string; dataUrl: string }[];
    addCustomFont: (name: string, dataUrl: string) => Promise<void>;
    removeCustomFont: (name: string) => Promise<void>;
    removeBackground: () => Promise<void>;
    setBackgroundImage: (url: string) => void;
    presets: { id: string; name: string; width: number; height: number; iconType?: string }[];
    setPresets: (presets: { id: string; name: string; width: number; height: number; iconType?: string }[]) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const CanvasProvider = ({ children }: { children: React.ReactNode }) => {
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 });
    const [zoom, setZoom] = useState(100);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
    const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
    const [templateFolders, setTemplateFolders] = useState<{ id: string; name: string; designIds: string[] }[]>([]);
    const [canvasName, setCanvasName] = useState("Untitled Project");
    // API key handling
    const [apiConfig, setApiConfig] = useState({
        unsplashAccessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
        pexelsKey: process.env.NEXT_PUBLIC_PEXELS_API_KEY || '',
        pixabayKey: process.env.NEXT_PUBLIC_PIXABAY_API_KEY || ''
    });
    const [clipboard, setClipboard] = useState<any>(null);
    const [presets, setPresets] = useState<{ id: string; name: string; width: number; height: number; iconType?: string }[]>([
        { id: "insta", name: "Instagram", width: 1080, height: 1080, iconType: 'instagram' },
        { id: "fb", name: "Facebook", width: 1200, height: 630, iconType: 'facebook' },
        { id: "twitter", name: "Twitter / X", width: 1600, height: 900, iconType: 'twitter' },
        { id: "hero", name: "Website Hero", width: 1920, height: 1080, iconType: 'monitor' }
    ]);
    const [updateTick, setUpdateTick] = useState(0);
    const isLoaded = useRef(false);

    const forceUpdate = useCallback(() => {
        setUpdateTick(t => t + 1);
    }, []);

    const smartResize = useCallback((width: number, height: number) => {
        smartResizeUtils(canvas, selectedObject, width, height);
        forceUpdate();
    }, [canvas, selectedObject, forceUpdate]);
    const [showGrid, setShowGrid] = useState(false);
    const [assetFolders, setAssetFolders] = useState<AssetFolder[]>([{ id: "default", name: "All Uploads", assets: [] }]);
    const [customFonts, setCustomFonts] = useState<{ name: string; dataUrl: string }[]>([]);
    const [isCropMode, setIsCropMode] = useState(false);
    const [cropRect, setCropRect] = useState<fabric.Rect | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);

    useEffect(() => {
        getCustomFonts()
            .then((fonts) => {
                setCustomFonts(fonts);
                // Preload custom fonts into the document
                fonts.forEach((font) => {
                    const fontFace = new FontFace(font.name, `url(${font.dataUrl})`);
                    fontFace.load().then((loaded) => {
                        document.fonts.add(loaded);
                    }).catch(console.error);
                });
            })
            .catch(console.error);
    }, []);

    const addCustomFont = useCallback(async (name: string, dataUrl: string) => {
        await saveCustomFont(name, dataUrl);
        setCustomFonts((prev) => [...prev.filter((f) => f.name !== name), { name, dataUrl }]);

        const fontFace = new FontFace(name, `url(${dataUrl})`);
        try {
            const loaded = await fontFace.load();
            document.fonts.add(loaded);
        } catch (e) {
            console.error("Failed to load added font into document", e);
        }
    }, []);

    const removeCustomFont = useCallback(async (name: string) => {
        await deleteCustomFont(name);
        setCustomFonts((prev) => prev.filter((f) => f.name !== name));
    }, []);

    const fitToScreen = useCallback(() => {
        if (!canvas) return;
        const padding = 100;
        // Sidebar width is ~360px (80px + 280px). Assume 400px to be safe.
        const availableWidth = window.innerWidth - 400 - padding;
        const availableHeight = window.innerHeight - 100 - padding;

        const scaleX = availableWidth / canvasSize.width;
        const scaleY = availableHeight / canvasSize.height;
        let scale = Math.min(scaleX, scaleY);

        // Don't scale up past 100%
        if (scale > 1) scale = 1;

        // Multiply by 100 since zoom state is stored as a percentage
        const newZoom = Math.max(10, Math.round(scale * 100));
        setZoom(newZoom);

        // Reset panning and viewport
        setPanOffset({ x: 0, y: 0 });
        const vpt = canvas.viewportTransform;
        if (vpt) {
            vpt[0] = scale;
            vpt[3] = scale;
            vpt[4] = 0;
            vpt[5] = 0;
            canvas.setViewportTransform(vpt);
        }
        canvas.requestRenderAll();
    }, [canvas, canvasSize.width, canvasSize.height]);

    useEffect(() => {
        const load = async () => {
            const keys = ["designs", "brandkits", "folders", "canvas_size", "custom_fonts", "presets", "template_folders", "canvas_name", "api_config", "theme"];
            const results = await Promise.all(keys.map(k => fetch(`/api/storage?key=${k}`).then(r => r.json().catch(() => null))));

            if (results[0]) setSavedDesigns(results[0]);
            if (results[1]) setBrandKits(results[1]);
            if (results[2]) setAssetFolders(results[2]);
            if (results[3]) setCanvasSize(results[3]);
            if (results[4]) setCustomFonts(results[4]);
            if (results[5] && Array.isArray(results[5])) setPresets(results[5]);
            if (results[6]) setTemplateFolders(results[6]);
            if (results[7]) setCanvasName(results[7]);
            if (results[8]) setApiConfig(prev => ({ ...prev, ...results[8] }));
            if (results[9]) setTheme(results[9]);

            isLoaded.current = true;
        };
        load();
    }, []);

    useEffect(() => {
        if (!isLoaded.current) return;
        fetch("/api/storage?key=brandkits", { method: 'POST', body: JSON.stringify(brandKits) }).catch(() => { });
        fetch("/api/storage?key=folders", { method: 'POST', body: JSON.stringify(assetFolders) }).catch(() => { });
        fetch("/api/storage?key=canvas_size", { method: 'POST', body: JSON.stringify(canvasSize) }).catch(() => { });
        fetch("/api/storage?key=custom_fonts", { method: 'POST', body: JSON.stringify(customFonts) }).catch(() => { });
        fetch("/api/storage?key=presets", { method: 'POST', body: JSON.stringify(presets) }).catch(() => { });
        fetch("/api/storage?key=template_folders", { method: 'POST', body: JSON.stringify(templateFolders) }).catch(() => { });
        fetch("/api/storage?key=canvas_name", { method: 'POST', body: JSON.stringify(canvasName) }).catch(() => { });
        fetch("/api/storage?key=api_config", { method: 'POST', body: JSON.stringify(apiConfig) }).catch(() => { });
        fetch("/api/storage?key=theme", { method: 'POST', body: JSON.stringify(theme) }).catch(() => { });
    }, [brandKits, assetFolders, canvasSize, customFonts, presets, templateFolders, canvasName, apiConfig, theme]);

    // Global Event Listeners (Moved to bottom of Provider)

    const addShape = useCallback((shape: fabric.Object) => {
        if (!canvas) return;
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.centerObject(shape);
        canvas.renderAll();
    }, [canvas]);

    const addRect = useCallback(() => addShape(new fabric.Rect({ fill: "#3b82f6", width: 150, height: 150, rx: 12, ry: 12 })), [addShape]);
    const addCircle = useCallback(() => addShape(new fabric.Circle({ fill: "#10b981", radius: 75 })), [addShape]);
    const addTriangle = useCallback(() => addShape(new fabric.Triangle({ fill: "#f59e0b", width: 150, height: 150 })), [addShape]);
    const addStar = useCallback((points = 5) => {
        const starPoints = [];
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const r = i % 2 === 0 ? 75 : 30;
            starPoints.push({ x: 75 + r * Math.sin(angle), y: 75 - r * Math.cos(angle) });
        }
        addShape(new fabric.Polygon(starPoints, { fill: "#ef4444" }));
    }, [addShape]);

    const addHexagon = useCallback(() => addShape(new fabric.Polygon([{ x: 37.5, y: 0 }, { x: 112.5, y: 0 }, { x: 150, y: 65 }, { x: 112.5, y: 130 }, { x: 37.5, y: 130 }, { x: 0, y: 65 }], { fill: "#8b5cf6" })), [addShape]);
    const addDiamond = useCallback(() => addShape(new fabric.Polygon([{ x: 75, y: 0 }, { x: 150, y: 75 }, { x: 75, y: 150 }, { x: 0, y: 75 }], { fill: "#ec4899" })), [addShape]);
    const addArrow = useCallback(() => addShape(new fabric.Polygon([{ x: 0, y: 40 }, { x: 80, y: 40 }, { x: 80, y: 0 }, { x: 150, y: 75 }, { x: 80, y: 150 }, { x: 80, y: 110 }, { x: 0, y: 110 }], { fill: "#06b6d4" })), [addShape]);
    const addHeart = useCallback(() => addShape(new fabric.Path('M 300 130 c -50 -70 -130 -30 -130 50 c 0 70 130 150 130 150 s 130 -80 130 -150 c 0 -80 -80 -120 -130 -50 Z', { fill: "#f43f5e", scaleX: 0.5, scaleY: 0.5, originX: 'center', originY: 'center' })), [addShape]);
    const addBadge = useCallback(() => addShape(new fabric.Path('M 50 0 L 100 20 L 100 80 L 50 100 L 0 80 L 0 20 Z', { fill: "#facc15", scaleX: 1.5, scaleY: 1.5 })), [addShape]);
    const addCloud = useCallback(() => addShape(new fabric.Path('M 25 50 c -20 0 -20 -30 0 -30 c 0 -20 30 -20 30 0 c 20 -10 40 10 20 20 c 15 10 0 30 -15 20 c -10 10 -30 10 -35 -10 Z', { fill: "#94a3b8", scaleX: 2, scaleY: 2 })), [addShape]);
    const addPolygon = useCallback((sides: number) => {
        const points = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            points.push({ x: 75 + 75 * Math.sin(angle), y: 75 - 75 * Math.cos(angle) });
        }
        addShape(new fabric.Polygon(points, { fill: "#10b981" }));
    }, [addShape]);

    const addText = useCallback(() => {
        if (!canvas) return;
        const text = new fabric.Textbox('Double click to edit', {
            left: 100,
            top: 100,
            width: 300,
            fontSize: 40,
            fontFamily: 'Outfit',
            fill: '#ffffff',
            fontWeight: 'bold',
            splitByGrapheme: true
        });
        canvas.add(text);
        canvas.centerObject(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    }, [canvas]);

    const addImage = useCallback((url: string) => {
        if (!canvas) return;
        fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
            if (img.width > 400) img.scaleToWidth(400);
            canvas.add(img);
            canvas.centerObject(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        }).catch(e => console.error("Image load failed", e));
    }, [canvas]);

    const setBackgroundImage = useCallback((url: string) => {
        if (!canvas) return;
        fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
            const canvasW = canvasSize.width;
            const canvasH = canvasSize.height;

            const scaleX = canvasW / img.width!;
            const scaleY = canvasH / img.height!;
            const scale = Math.max(scaleX, scaleY);

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: canvasW / 2,
                top: canvasH / 2,
                originX: 'center',
                originY: 'center',
                evented: false,
                selectable: false
            });

            canvas.backgroundImage = img;
            canvas.renderAll();
        }).catch(e => console.error("Background set failed", e));
    }, [canvas, canvasSize.width, canvasSize.height]);

    const maskShapeWithImage = useCallback((shape: fabric.Object, imageUrl: string) => {
        if (!canvas) return;
        fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
            shape.clone().then((clonedShape) => {
                // Essential: clipPath must be centered for logical rendering in Fabric
                clonedShape.set({
                    left: 0,
                    top: 0,
                    originX: 'center',
                    originY: 'center',
                    absolutePositioned: false
                });

                // Match image properties to shape
                const scale = Math.max(shape.getScaledWidth() / img.width, shape.getScaledHeight() / img.height);
                img.set({
                    scaleX: scale,
                    scaleY: scale,
                    left: shape.left,
                    top: shape.top,
                    originX: shape.originX,
                    originY: shape.originY,
                    angle: shape.angle,
                    flipX: shape.flipX,
                    flipY: shape.flipY,
                    clipPath: clonedShape
                });

                canvas.remove(shape);
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
            });
        }).catch(err => {
            console.error("Masking failed", err);
            alert("Failed to load image for masking.");
        });
    }, [canvas]);

    const clearCanvas = useCallback(() => {
        if (!canvas) return;
        canvas.clear();
        canvas.set("backgroundColor", "#ffffff");
        canvas.renderAll();
    }, [canvas]);

    const updateSelectedObject = useCallback((properties: any) => {
        if (!canvas || !selectedObject) return;
        selectedObject.set(properties);
        canvas.requestRenderAll();
        forceUpdate();
    }, [canvas, selectedObject, forceUpdate]);

    const clearEffects = useCallback(() => {
        if (!canvas || !selectedObject) return;

        selectedObject.set({
            clipPath: undefined,
            shadow: undefined,
        });

        if (selectedObject instanceof fabric.Image) {
            selectedObject.filters = [];
            selectedObject.applyFilters();
        }

        canvas.requestRenderAll();
    }, [canvas, selectedObject]);

    const updateMaskProperties = useCallback((properties: any) => {
        if (!canvas || !selectedObject || !selectedObject.clipPath) return;

        selectedObject.clipPath.set(properties);
        selectedObject.setCoords();
        canvas.requestRenderAll();
    }, [canvas, selectedObject]);

    const applyFilter = useCallback((filterType: string, value: any) => {
        if (!canvas || !selectedObject || !(selectedObject instanceof fabric.Image)) return;
        const img = selectedObject as fabric.Image;
        const filterMap: any = {
            Brightness: fabric.filters.Brightness,
            Contrast: fabric.filters.Contrast,
            Blur: fabric.filters.Blur,
            Saturation: fabric.filters.Saturation,
            HueRotation: fabric.filters.HueRotation,
            Invert: fabric.filters.Invert
        };
        const filterClassType = filterType.charAt(0).toUpperCase() + filterType.slice(1);
        const FilterClass = filterMap[filterClassType];

        if (FilterClass) {
            const index = img.filters.findIndex(f => f.type === filterClassType);

            if (value === 0 && filterClassType !== 'Invert') {
                if (index > -1) img.filters.splice(index, 1);
            } else if (filterClassType === 'Invert' && !value) {
                if (index > -1) img.filters.splice(index, 1);
            } else {
                let options: any = {};
                if (filterClassType === 'HueRotation') {
                    options = { rotation: value };
                } else if (filterClassType === 'Invert') {
                    options = {};
                } else {
                    options = { [filterType.toLowerCase()]: value };
                }

                const filter = new FilterClass(options);
                if (index > -1) img.filters[index] = filter;
                else img.filters.push(filter);
            }

            img.applyFilters();
            canvas.renderAll();

            forceUpdate();
        }
    }, [canvas, selectedObject, forceUpdate]);

    const saveToTemplate = useCallback((name: string, brandId?: string, parentId?: string) => {
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        const thumbnail = canvas.toDataURL({ format: 'png', multiplier: 0.1 });
        const id = Math.random().toString(36).substr(2, 9);
        const newDesign = {
            id,
            name: name || "Untitled",
            thumbnail,
            data: json,
            timestamp: Date.now(),
            brandId,
            parentId // for versions
        };
        const updated = [newDesign, ...savedDesigns];
        setSavedDesigns(updated);
        fetch("/api/storage?key=designs", { method: 'POST', body: JSON.stringify(updated) }).catch(() => { });
        return id;
    }, [canvas, savedDesigns]);

    const deleteDesign = useCallback((id: string) => {
        const updated = savedDesigns.filter(d => d.id !== id && d.parentId !== id);
        setSavedDesigns(updated);
        fetch("/api/storage?key=designs", { method: 'POST', body: JSON.stringify(updated) }).catch(() => { });
    }, [savedDesigns]);

    const loadTemplate = useCallback((json: string, name?: string) => {
        if (!canvas) return;
        if (name) setCanvasName(name);
        try {
            const data = JSON.parse(json);
            // Sanitize objects to handle expired blob URLs
            if (data.objects && Array.isArray(data.objects)) {
                data.objects.forEach((obj: any) => {
                    if ((obj.type === 'image' || obj.type === 'Image') && obj.src && obj.src.startsWith('blob:')) {
                        console.warn("Recovering from expired blob URL:", obj.src);
                        // Use a transparent 1x1 pixel instead of the broken blob
                        obj.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                    }
                });
            }
            preloadFontsFromJSON(data).then(() => {
                // Update canvas size from template
                if (data.width && data.height) {
                    const newSize = { width: data.width, height: data.height };
                    setCanvasSize(newSize);
                    canvas.setDimensions(newSize);
                }

                canvas.loadFromJSON(data)
                    .then(() => {
                        canvas.renderAll();
                        setTimeout(() => fitToScreen(), 100); // Small delay to ensure render is stable
                    })
                    .catch(err => {
                        console.error("Fabric load error:", err);
                        canvas.renderAll();
                    });
            });
        } catch (e) {
            console.error("Failed to parse template JSON:", e);
        }
    }, [canvas, fitToScreen]);

    const exportAsFormat = useCallback((format: 'png' | 'jpeg' | 'pdf') => {
        if (!canvas) return;
        canvas.discardActiveObject();
        canvas.renderAll();

        const currentZoom = canvas.getZoom();
        const currentWidth = canvas.width;
        const currentHeight = canvas.height;

        canvas.setDimensions({ width: canvasSize.width, height: canvasSize.height });
        canvas.setZoom(1);
        canvas.renderAll();

        if (format === 'pdf') {
            const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
            const pdf = new jsPDF({ orientation: canvasSize.width > canvasSize.height ? 'landscape' : 'portrait', unit: 'px', format: [canvasSize.width, canvasSize.height] });
            pdf.addImage(dataURL, 'PNG', 0, 0, canvasSize.width, canvasSize.height);
            pdf.save(`${canvasName || 'canvascrafter'}.pdf`);
        } else {
            const dataURL = canvas.toDataURL({ format, multiplier: 2, quality: 1 });
            const link = document.createElement("a");
            link.download = `${canvasName || 'canvascrafter'}.${format}`;
            link.href = dataURL;
            link.click();
        }

        canvas.setDimensions({ width: currentWidth, height: currentHeight });
        canvas.setZoom(currentZoom);
        canvas.renderAll();
    }, [canvas, canvasSize.width, canvasSize.height, canvasName]);

    const bringToFront = useCallback(() => { selectedObject && canvas?.bringObjectToFront(selectedObject); canvas?.renderAll(); }, [canvas, selectedObject]);
    const sendToBack = useCallback(() => { selectedObject && canvas?.sendObjectToBack(selectedObject); canvas?.renderAll(); }, [canvas, selectedObject]);
    const deleteSelected = useCallback(() => { selectedObject && canvas?.remove(selectedObject); canvas?.discardActiveObject(); canvas?.renderAll(); }, [canvas, selectedObject]);

    const copySelected = useCallback(() => {
        if (!canvas) return;
        canvas.getActiveObject()?.clone().then((cloned: any) => {
            setClipboard(cloned);
            const copyId = Date.now().toString();
            (window as any).__canvascrafterCopyId = copyId;
            try { navigator.clipboard.writeText(`CANVASCRAFTER_COPY:${copyId}`); } catch (e) { }
        });
    }, [canvas]);

    const cutSelected = useCallback(() => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;
        activeObject.clone().then((cloned: any) => {
            setClipboard(cloned);
            const copyId = Date.now().toString();
            (window as any).__canvascrafterCopyId = copyId;
            try { navigator.clipboard.writeText(`CANVASCRAFTER_COPY:${copyId}`); } catch (e) { }

            canvas.remove(activeObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        });
    }, [canvas]);

    const pasteSelected = useCallback(async () => {
        if (!canvas) return;

        const doPasteInternal = () => {
            if (!clipboard) return;
            clipboard.clone().then((cloned: any) => {
                canvas.discardActiveObject();
                cloned.set({
                    left: (cloned.left || 0) + 10,
                    top: (cloned.top || 0) + 10,
                    evented: true,
                });
                if (cloned.type === 'activeSelection') {
                    cloned.canvas = canvas;
                    cloned.forEachObject((obj: any) => canvas.add(obj));
                    cloned.setCoords();
                } else {
                    canvas.add(cloned);
                }
                canvas.setActiveObject(cloned);
                canvas.requestRenderAll();
                setClipboard(cloned);
            });
        };

        if (!navigator?.clipboard) {
            console.warn("Clipboard API requires HTTPS or localhost.");
            return;
        }

        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                // Images take priority if multiple formats are on the clipboard
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        addImage(dataUrl);
                    };
                    reader.readAsDataURL(blob);
                    return;
                }

                const textType = item.types.find(type => type === 'text/plain');
                if (textType) {
                    const blob = await item.getType('text/plain');
                    const text = await blob.text();

                    if (text.startsWith("CANVASCRAFTER_COPY:") && (window as any).__canvascrafterCopyId === text.split(":")[1]) {
                        return doPasteInternal();
                    }

                    if (text.trim().match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i)) {
                        addImage(text.trim());
                        return;
                    }

                    const newText = new fabric.IText(text, {
                        left: 100,
                        top: 100,
                        fontFamily: 'Inter',
                        fill: theme === 'dark' ? '#ffffff' : '#000000',
                    });
                    canvas.add(newText);
                    canvas.setActiveObject(newText);
                    canvas.requestRenderAll();
                    return;
                }
            }
        } catch (e) {
            // Fallback for browsers that don't support read() or if it failed
            try {
                if (navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    if (text.startsWith("CANVASCRAFTER_COPY:") && (window as any).__canvascrafterCopyId === text.split(":")[1]) {
                        return doPasteInternal();
                    }
                    if (text.trim().match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i)) {
                        addImage(text.trim());
                        return;
                    }
                    const newText = new fabric.IText(text, {
                        left: 100,
                        top: 100,
                        fontFamily: 'Inter',
                        fill: theme === 'dark' ? '#ffffff' : '#000000',
                    });
                    canvas.add(newText);
                    canvas.setActiveObject(newText);
                    canvas.requestRenderAll();
                    return;
                }
            } catch (err) {
                console.error("Paste failed to read from clipboard", err);
            }
        }

        if (clipboard) doPasteInternal();

    }, [canvas, clipboard, addImage, theme]);

    const duplicateSelected = useCallback(() => {
        if (!canvas || !selectedObject) return;
        selectedObject.clone().then((cloned: fabric.Object) => {
            cloned.set({
                left: (cloned.left || 0) + 10,
                top: (cloned.top || 0) + 10
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
        });
    }, [canvas, selectedObject]);

    const releaseMask = useCallback(() => {
        if (!canvas || !selectedObject || !selectedObject.clipPath) return;

        const img = selectedObject as fabric.Image;
        const clipPath = img.clipPath!;

        clipPath.clone().then((shape: any) => {
            shape.set({
                left: img.left,
                top: img.top,
                angle: img.angle,
                scaleX: img.scaleX,
                scaleY: img.scaleY,
            });
            img.set({ clipPath: undefined });
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        });
    }, [canvas, selectedObject]);

    const groupSelected = useCallback(() => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        let objects: fabric.Object[] = [];
        if (activeObject.type === 'activeSelection') {
            objects = (activeObject as fabric.ActiveSelection).getObjects();
        } else {
            objects = [activeObject];
        }

        if (objects.length === 0) return;

        // In Fabric v7, Group constructor handles the positioning relative to its members
        const group = new fabric.Group(objects, {
            name: objects.length > 1 ? "New Group" : "Folder",
            subTargetCheck: true,
            interactive: false,
            objectCaching: false,
        } as any);

        // Remove from canvas top-level
        objects.forEach(obj => {
            canvas.remove(obj);
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        forceUpdate();
    }, [canvas, forceUpdate]);

    const ungroupSelected = useCallback(() => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'group') return;

        const group = activeObject as fabric.Group;
        const items = group.getObjects();

        // Release objects from group back to canvas
        group.forEachObject(obj => {
            const matrix = obj.calcTransformMatrix();
            const options = fabric.util.qrDecompose(matrix);
            obj.set({
                ...options,
                flipX: false,
                flipY: false,
            });
            canvas.add(obj);
            obj.setCoords();
        });

        canvas.remove(group);

        const selection = new fabric.ActiveSelection(items, { canvas });
        canvas.setActiveObject(selection);
        canvas.renderAll();
        forceUpdate();
    }, [canvas, forceUpdate]);

    const alignSelected = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject.type === 'activeSelection') {
            const activeSelection = activeObject as fabric.ActiveSelection;
            const width = activeSelection.width || 0;
            const height = activeSelection.height || 0;

            activeSelection.forEachObject((obj) => {
                const objWidth = obj.getScaledWidth();
                const objHeight = obj.getScaledHeight();

                switch (type) {
                    case 'left': obj.set('left', -width / 2); break;
                    case 'center': obj.set('left', 0 - objWidth / 2); break;
                    case 'right': obj.set('left', width / 2 - objWidth); break;
                    case 'top': obj.set('top', -height / 2); break;
                    case 'middle': obj.set('top', 0 - objHeight / 2); break;
                    case 'bottom': obj.set('top', height / 2 - objHeight); break;
                }
            });
        } else {
            // Align to canvas
            switch (type) {
                case 'left': activeObject.set('left', 0); break;
                case 'center': canvas.centerObjectH(activeObject); break;
                case 'right': activeObject.set('left', canvas.width! - activeObject.getScaledWidth()); break;
                case 'top': activeObject.set('top', 0); break;
                case 'middle': canvas.centerObjectV(activeObject); break;
                case 'bottom': activeObject.set('top', canvas.height! - activeObject.getScaledHeight()); break;
            }
        }
        activeObject.setCoords();
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: activeObject });
    }, [canvas]);

    const enterCropMode = useCallback(() => {
        if (!canvas || !(selectedObject instanceof fabric.Image)) return;
        setIsCropMode(true);
        const img = selectedObject as fabric.Image;
        const rect = new fabric.Rect({
            left: img.left,
            top: img.top,
            width: img.getScaledWidth(),
            height: img.getScaledHeight(),
            fill: 'rgba(59, 130, 246, 0.2)',
            stroke: '#3b82f6',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            cornerColor: '#3b82f6',
            cornerSize: 10,
            transparentCorners: false,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        setCropRect(rect);
        img.set({ selectable: false, evented: false });
        canvas.renderAll();
    }, [canvas, selectedObject]);

    const confirmCrop = useCallback(() => {
        if (!canvas || !selectedObject || !cropRect) return;
        const img = selectedObject as fabric.Image;

        // Convert cropRect local to image local
        const clipPath = new fabric.Rect({
            left: cropRect.left - img.left,
            top: cropRect.top - img.top,
            width: cropRect.getScaledWidth(),
            height: cropRect.getScaledHeight(),
            absolutePositioned: true
        });

        img.set({ clipPath, selectable: true, evented: true });
        canvas.remove(cropRect);
        setCropRect(null);
        setIsCropMode(false);
        canvas.setActiveObject(img);
        canvas.renderAll();
    }, [canvas, selectedObject, cropRect]);

    const cancelCrop = useCallback(() => {
        if (!canvas || !cropRect || !selectedObject) return;
        canvas.remove(cropRect);
        setCropRect(null);
        setIsCropMode(false);
        selectedObject.set({ selectable: true, evented: true });
        canvas.renderAll();
    }, [canvas, cropRect, selectedObject]);

    const applyAIEdgeStroke = useCallback(async () => {
        if (!canvas || !(selectedObject instanceof fabric.Image)) return;
        const img = selectedObject as fabric.Image;

        await detectEdgesAndAddStroke(canvas, img, '#3b82f6', 10);
    }, [canvas, selectedObject]);

    const removeBackground = useCallback(async () => {
        if (!canvas || !(selectedObject instanceof fabric.Image)) return;
        const img = selectedObject as fabric.Image;
        const src = img.getSrc();

        try {
            const blob = await backgroundRemoval.removeBackground(src);
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;

                fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((newImg) => {
                    // Match properties
                    newImg.set({
                        left: img.left,
                        top: img.top,
                        scaleX: img.scaleX,
                        scaleY: img.scaleY,
                        angle: img.angle,
                        flipX: img.flipX,
                        flipY: img.flipY,
                        originX: img.originX,
                        originY: img.originY,
                        clipPath: img.clipPath,
                        shadow: img.shadow,
                        opacity: img.opacity,
                    });

                    canvas.remove(img);
                    canvas.add(newImg);
                    canvas.setActiveObject(newImg);
                    canvas.renderAll();
                    setSelectedObject(newImg);
                });
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error("BG Removal failed", err);
            alert("Failed to remove background. Ensure the image is accessible.");
        }
    }, [canvas, selectedObject]);

    const undo = useCallback(() => {
        if (!canvas || history.length === 0) return;

        const current = JSON.stringify(canvas.toJSON());
        const past = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        setRedoStack(prev => [current, ...prev]);
        setHistory(newHistory);

        canvas.loadFromJSON(JSON.parse(past)).then(() => canvas.renderAll());
    }, [canvas, history]);

    const redo = useCallback(() => {
        if (!canvas || redoStack.length === 0) return;

        const current = JSON.stringify(canvas.toJSON());
        const future = redoStack[0];
        const newRedo = redoStack.slice(1);

        setHistory(prev => [...prev, current]);
        setRedoStack(newRedo);

        canvas.loadFromJSON(JSON.parse(future)).then(() => canvas.renderAll());
    }, [canvas, redoStack]);

    const saveHistory = useCallback(debounce(() => {
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        setHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1] === json) return prev;
            return [...prev, json].slice(-50); // Limit history to 50 steps
        });
        setRedoStack([]); // Clear redo stack on new action
    }, 500), [canvas]);

    useEffect(() => {
        if (!canvas) return;
        canvas.on('object:modified', saveHistory);
        canvas.on('object:added', saveHistory);
        canvas.on('object:removed', saveHistory);
        return () => {
            canvas.off('object:modified', saveHistory);
            canvas.off('object:added', saveHistory);
            canvas.off('object:removed', saveHistory);
        };
    }, [canvas, saveHistory]);

    useEffect(() => {
        if (!canvas) return;

        const handleSelection = () => {
            setSelectedObject(canvas.getActiveObject() || null);
            forceUpdate();
        };

        const debouncedAutoSave = debounce(() => {
            fetch("/api/storage?key=autosave", { method: 'POST', body: JSON.stringify(canvas.toJSON()) }).catch(() => { });
        }, 1000);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) redo();
                        else undo();
                        return;
                    case 'y':
                        e.preventDefault();
                        redo();
                        return;
                    case 'c':
                        e.preventDefault();
                        copySelected();
                        return;
                    case 'v':
                        if (clipboard) {
                            e.preventDefault();
                            pasteSelected();
                        }
                        return;
                    case 'd':
                        e.preventDefault();
                        duplicateSelected();
                        return;
                    case 'x':
                        e.preventDefault();
                        cutSelected();
                        return;
                    case 'g':
                        e.preventDefault();
                        const activeObj = canvas.getActiveObject();
                        if (activeObj?.type === 'group') ungroupSelected();
                        else if (activeObj?.type === 'activeSelection') groupSelected();
                        return;
                    case ']':
                        e.preventDefault();
                        bringToFront();
                        return;
                    case '[':
                        e.preventDefault();
                        sendToBack();
                        return;
                }
            }

            const activeObject = canvas.getActiveObject();
            if (!activeObject) return;

            const step = e.shiftKey ? 10 : 1;
            let handled = false;

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    deleteSelected();
                    handled = true;
                    break;
                case 'ArrowLeft':
                    activeObject.set('left', (activeObject.left || 0) - step);
                    handled = true;
                    break;
                case 'ArrowRight':
                    activeObject.set('left', (activeObject.left || 0) + step);
                    handled = true;
                    break;
                case 'ArrowUp':
                    activeObject.set('top', (activeObject.top || 0) - step);
                    handled = true;
                    break;
                case 'ArrowDown':
                    activeObject.set('top', (activeObject.top || 0) + step);
                    handled = true;
                    break;
            }

            if (handled) {
                e.preventDefault();
                canvas.requestRenderAll();
                canvas.fire('object:modified', { target: activeObject });
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            addImage(dataUrl);
                        };
                        reader.readAsDataURL(blob);
                        return;
                    }
                }
            }

            const text = e.clipboardData.getData("text");
            if (text && text.trim().match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i)) {
                addImage(text.trim());
                return;
            }
        };

        const handleMoving = (e: any) => {
            // Snapping disabled for smoother movement as per plan
        };

        const handleMouseDown = (opt: any) => {
            if (!canvas) return;
            (canvas as any)._mouseDownPointer = canvas.getScenePoint(opt.e);
        };

        const handleMouseUp = (opt: any) => {
            clearGuides(canvas);

            // Fix for group drill-down: click again to enter
            const activeObject = canvas.getActiveObject();
            if (opt.target && opt.target.type === 'group' && opt.target === activeObject) {
                const pointer = canvas.getScenePoint(opt.e);
                const downPointer = (canvas as any)._mouseDownPointer;

                // If the pointer hasn't moved much, it was a click, not a drag
                const isClick = downPointer && Math.hypot(pointer.x - downPointer.x, pointer.y - downPointer.y) < 5;
                if (isClick && opt.e.button === 0) {
                    const subTarget = (opt.target as any)._searchPossibleTargets(opt.e);
                    if (subTarget) {
                        canvas.setActiveObject(subTarget);
                        canvas.requestRenderAll();
                        handleSelection();
                    }
                }
            }
        };

        const handleModified = (e: any) => {
            const obj = e.target;
            if (obj && obj.group) {
                (obj.group as any).addWithUpdate();
            }
            debouncedAutoSave();
        };

        canvas.on("mouse:down", handleMouseDown);
        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("selection:cleared", () => {
            setSelectedObject(null);
            clearGuides(canvas);
        });

        canvas.on("object:modified", handleModified);
        canvas.on("object:added", debouncedAutoSave);
        canvas.on("object:removed", debouncedAutoSave);
        canvas.on("object:moving", handleMoving);
        canvas.on("mouse:up", handleMouseUp);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("paste", handlePaste);

        return () => {
            canvas.off("mouse:down", handleMouseDown);
            canvas.off("selection:created", handleSelection);
            canvas.off("selection:updated", handleSelection);
            canvas.off("selection:cleared", () => setSelectedObject(null));
            canvas.off("object:modified", handleModified);
            canvas.off("object:added", debouncedAutoSave);
            canvas.off("object:removed", debouncedAutoSave);
            canvas.off("object:moving", handleMoving);
            canvas.off("mouse:up", handleMouseUp);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("paste", handlePaste);
        };
    }, [canvas, undo, redo, copySelected, pasteSelected, duplicateSelected, cutSelected, groupSelected, ungroupSelected, bringToFront, sendToBack, deleteSelected, addImage, clipboard]);

    const contextValue = useMemo(() => ({
        canvas, setCanvas, selectedObject, theme, setTheme, canvasSize, setCanvasSize, zoom, setZoom, panOffset, setPanOffset, fitToScreen,
        updateTick, forceUpdate,
        addRect, addText, addCircle, addTriangle, addStar, addHexagon, addDiamond, addArrow, addHeart, addBadge, addCloud, addPolygon, addImage,
        clearCanvas, updateSelectedObject, applyFilter, clearEffects, updateMaskProperties, bringToFront, sendToBack, deleteSelected,
        duplicateSelected, copySelected, cutSelected, pasteSelected, releaseMask, groupSelected, ungroupSelected, alignSelected,
        maskShapeWithImage, saveToTemplate, loadTemplate, deleteDesign, exportAsFormat, savedDesigns,
        canvasName, setCanvasName,
        brandKits, setBrandKits, assetFolders, setAssetFolders,
        templateFolders, setTemplateFolders,
        customFonts, addCustomFont, removeCustomFont,
        removeBackground, setBackgroundImage,
        showGrid, setShowGrid,
        enterCropMode, confirmCrop, cancelCrop, isCropMode,
        applyAIEdgeStroke,
        undo, redo, canUndo: history.length > 0, canRedo: redoStack.length > 0,
        smartResizeSelected: smartResize,
        apiConfig, setApiConfig,
        presets, setPresets
    }), [
        canvas, selectedObject, theme, canvasSize, zoom, panOffset, fitToScreen,
        updateTick, forceUpdate, savedDesigns, canvasName, brandKits, assetFolders, templateFolders,
        customFonts, history.length, redoStack.length, apiConfig, presets,
        addRect, addText, addCircle, addTriangle, addStar, addHexagon, addDiamond, addArrow, addHeart, addBadge, addCloud, addPolygon, addImage,
        clearCanvas, updateSelectedObject, applyFilter, clearEffects, updateMaskProperties, bringToFront, sendToBack, deleteSelected,
        duplicateSelected, copySelected, cutSelected, pasteSelected, releaseMask, groupSelected, ungroupSelected, alignSelected,
        maskShapeWithImage, saveToTemplate, loadTemplate, deleteDesign, exportAsFormat,
        addCustomFont, removeCustomFont, removeBackground, setBackgroundImage,
        showGrid, enterCropMode, confirmCrop, cancelCrop, isCropMode, applyAIEdgeStroke, smartResize,
        setPresets
    ]);

    return (
        <CanvasContext.Provider value={contextValue}>
            <div className={theme}>
                {children}
            </div>
        </CanvasContext.Provider>
    );
};

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) throw new Error("useCanvas must be used within a CanvasProvider");
    return context;
};
