"use client";

import { useEffect, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { useCanvas } from "@/store/useCanvasStore";
import { preloadFontsFromJSON } from "@/utils/fontLoader";

fabric.Object.customProperties = ['id', 'name', 'isEdgeBorderGroup'];

export default function FabricCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setCanvas, canvasSize, zoom, showGrid, theme, fitToScreen, setZoom, panOffset, setPanOffset, canvas, setCurrentDesignId, setCanvasName } = useCanvas();
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const zoomRef = useRef(zoom);
    const setZoomRef = useRef(setZoom);
    const panOffsetRef = useRef(panOffset);
    const setPanOffsetRef = useRef(setPanOffset);
    const fitToScreenRef = useRef(fitToScreen);

    useEffect(() => {
        zoomRef.current = zoom;
        setZoomRef.current = setZoom;
        panOffsetRef.current = panOffset;
        setPanOffsetRef.current = setPanOffset;
        fitToScreenRef.current = fitToScreen;
    }, [zoom, setZoom, panOffset, setPanOffset, fitToScreen]);

    const applyBackground = useCallback(() => {
        if (!canvas || !(canvas as any)._isAlive) return;

        // Base background color
        canvas.set('backgroundColor', theme === 'dark' ? '#1a1d24' : '#ffffff');

        if (showGrid) {
            const gridSize = 40;
            const gridCanvas = document.createElement('canvas');
            gridCanvas.width = gridSize;
            gridCanvas.height = gridSize;
            const ctx = gridCanvas.getContext('2d');

            if (ctx) {
                ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0.5, 0);
                ctx.lineTo(0.5, gridSize);
                ctx.moveTo(0, 0.5);
                ctx.lineTo(gridSize, 0.5);
                ctx.stroke();
            }

            const pattern = new fabric.Pattern({
                source: gridCanvas,
                repeat: 'repeat'
            });

            canvas.set('overlayColor', pattern);
        } else {
            canvas.set('overlayColor', null);
        }

        canvas.requestRenderAll();
    }, [canvas, showGrid, theme]);

    // Reactive effect for background/grid changes
    useEffect(() => {
        applyBackground();
    }, [applyBackground]);

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        // Initialize Fabric Canvas
        const instance = new fabric.Canvas(canvasRef.current, {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: theme === 'dark' ? '#1a1d24' : '#ffffff',
            preserveObjectStacking: true,
            subTargetCheck: true,
        });

        (instance as any)._isAlive = true;
        fabricCanvasRef.current = instance;
        setCanvas(instance);

        // Initial load from storage
        fetch("/api/storage?key=autosave").then(r => r.json()).then(async (data) => {
            if (data && (instance as any)._isAlive) {
                const canvasData = data.canvas || data;
                if (data.currentDesignId) setCurrentDesignId(data.currentDesignId);
                if (data.canvasName) setCanvasName(data.canvasName);

                await preloadFontsFromJSON(canvasData);
                instance.loadFromJSON(canvasData).then(() => {
                    if ((instance as any)._isAlive) {
                        instance.getObjects().forEach(obj => {
                            if (obj.type === 'group') {
                                (obj as any).set({ interactive: false, subTargetCheck: true, objectCaching: false });
                            }
                        });
                        applyBackground();
                        instance.requestRenderAll();
                        setTimeout(() => {
                            if ((instance as any)._isAlive) fitToScreenRef.current();
                        }, 100);
                    }
                });
            } else {
                applyBackground();
            }
        }).catch(err => {
            console.error("Storage Error:", err);
            applyBackground();
        });

        // Setup common event listeners
        instance.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            let zoomLevel = zoomRef.current;
            if (opt.e.altKey || opt.e.ctrlKey) {
                if (delta > 0) zoomLevel -= 5;
                else zoomLevel += 5;
                setZoomRef.current(Math.max(10, Math.min(500, zoomLevel)));
                opt.e.preventDefault();
                opt.e.stopPropagation();
            }
        });

        instance.on('mouse:down', function (opt) {
            const evt = opt.e as MouseEvent;
            if (evt.button === 1 || (evt.button === 0 && evt.altKey)) {
                evt.preventDefault();
                evt.stopPropagation();
                (instance as any).isDragging = true;
                instance.selection = false;
                instance.defaultCursor = 'grabbing';
                (instance as any).lastPosX = evt.clientX;
                (instance as any).lastPosY = evt.clientY;
                instance.requestRenderAll();
            }
        });

        instance.on('mouse:move', function (opt) {
            if ((instance as any).isDragging) {
                const e = opt.e as MouseEvent;
                const dx = e.clientX - (instance as any).lastPosX;
                const dy = e.clientY - (instance as any).lastPosY;
                setPanOffsetRef.current({
                    x: panOffsetRef.current.x + dx,
                    y: panOffsetRef.current.y + dy
                });
                (instance as any).lastPosX = e.clientX;
                (instance as any).lastPosY = e.clientY;
            }
        });

        instance.on('mouse:up', function () {
            if ((instance as any).isDragging) {
                (instance as any).isDragging = false;
                instance.selection = true;
                instance.defaultCursor = 'default';
                instance.requestRenderAll();
            }
        });

        const canvasEl = canvasRef.current;
        const preventMiddlePaste = (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        if (canvasEl) {
            canvasEl.addEventListener('mousedown', preventMiddlePaste, true);
            canvasEl.addEventListener('auxclick', preventMiddlePaste, true);
        }

        return () => {
            if (canvasEl) {
                canvasEl.removeEventListener('mousedown', preventMiddlePaste, true);
                canvasEl.removeEventListener('auxclick', preventMiddlePaste, true);
            }
            (instance as any)._isAlive = false;
            fabricCanvasRef.current = null;
            setCanvas(null);
            instance.dispose();
        };
    }, [setCanvas, theme]); // Removed fitToScreen from deps to prevent circular re-init

    useEffect(() => {
        const canvasInstance = fabricCanvasRef.current;
        if (canvasInstance && (canvasInstance as any)._isAlive) {
            const z = zoom / 100;

            canvasInstance.setDimensions({
                width: canvasSize.width * z,
                height: canvasSize.height * z
            });

            canvasInstance.setZoom(z);
            canvasInstance.requestRenderAll();
        }
    }, [canvasSize.width, canvasSize.height, zoom]);

    return (
        <canvas ref={canvasRef} className="shadow-2xl" />
    );
}
