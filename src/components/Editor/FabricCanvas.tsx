"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useCanvas } from "@/store/useCanvasStore";
import { preloadFontsFromJSON } from "@/utils/fontLoader";

export default function FabricCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setCanvas, canvasSize, zoom, showGrid, theme, fitToScreen, setZoom, panOffset, setPanOffset } = useCanvas();
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const zoomRef = useRef(zoom);
    const setZoomRef = useRef(setZoom);
    const panOffsetRef = useRef(panOffset);
    const setPanOffsetRef = useRef(setPanOffset);

    useEffect(() => {
        zoomRef.current = zoom;
        setZoomRef.current = setZoom;
        panOffsetRef.current = panOffset;
        setPanOffsetRef.current = setPanOffset;
    }, [zoom, setZoom, panOffset, setPanOffset]);

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        // Initialize Fabric Canvas ONLY ONCE
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: "#ffffff",
            preserveObjectStacking: true,
        });

        fetch("/api/storage?key=autosave").then(r => r.json()).then(async (autosave) => {
            if (autosave && !canvas.destroyed) {
                await preloadFontsFromJSON(autosave);
                canvas.loadFromJSON(autosave).then(() => {
                    if (!canvas.destroyed) {
                        canvas.requestRenderAll();
                        setTimeout(() => fitToScreen(), 100);
                    }
                });
            }
        }).catch(err => console.error("Storage Error:", err));

        canvas.on('mouse:wheel', function (opt) {
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

        canvas.on('mouse:down', function (opt) {
            const evt = opt.e as MouseEvent;
            // Middle-click (1) panning
            if (evt.button === 1 || (evt.button === 0 && evt.altKey)) {
                evt.preventDefault();
                evt.stopPropagation();
                (canvas as any).isDragging = true;
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
                (canvas as any).lastPosX = evt.clientX;
                (canvas as any).lastPosY = evt.clientY;
                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:move', function (opt) {
            if ((canvas as any).isDragging) {
                const e = opt.e as MouseEvent;
                const dx = e.clientX - (canvas as any).lastPosX;
                const dy = e.clientY - (canvas as any).lastPosY;

                setPanOffsetRef.current({
                    x: panOffsetRef.current.x + dx,
                    y: panOffsetRef.current.y + dy
                });

                (canvas as any).lastPosX = e.clientX;
                (canvas as any).lastPosY = e.clientY;
            }
        });

        canvas.on('mouse:up', function (opt) {
            if ((canvas as any).isDragging) {
                (canvas as any).isDragging = false;
                canvas.selection = true;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
            }
        });

        fabricCanvasRef.current = canvas;
        setCanvas(canvas);

        // Cleanup on unmount
        return () => {
            fabricCanvasRef.current = null;
            setCanvas(null);
            canvas.dispose();
        };
    }, [setCanvas]); // Only run once on mount

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || canvas.destroyed) return;

        if (showGrid) {
            const gridSize = 50;
            const gridCanvas = document.createElement('canvas');
            gridCanvas.width = gridSize;
            gridCanvas.height = gridSize;
            const ctx = gridCanvas.getContext('2d');
            if (ctx) {
                // Background is white, so grid must be a light gray
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, gridSize, gridSize);
                ctx.strokeStyle = '#e5e7eb';
                ctx.strokeRect(0, 0, gridSize, gridSize);
            }
            const gridPattern = new fabric.Pattern({
                source: gridCanvas,
                repeat: 'repeat'
            });
            canvas.set({ backgroundColor: gridPattern });
        } else {
            canvas.set({ backgroundColor: '#ffffff' });
        }
        canvas.requestRenderAll();
    }, [showGrid, theme]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (canvas && !canvas.destroyed) {
            const z = zoom / 100;
            canvas.setDimensions({
                width: canvasSize.width * z,
                height: canvasSize.height * z
            });
            // Use setZoom to scale the rendering context
            canvas.setZoom(z);
            canvas.requestRenderAll();
        }
    }, [canvasSize.width, canvasSize.height, zoom]);

    return (
        <div className="relative shadow-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
            <canvas ref={canvasRef} />
        </div>
    );
}
