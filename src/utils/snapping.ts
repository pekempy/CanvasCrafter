import * as fabric from "fabric";

const SNAP_THRESHOLD = 5;
const STICKY_THRESHOLD = 20;

/**
 * Handles snapping of an object to other objects and canvas guidelines.
 * Uses a "sticky" mechanism to prevent jitter and provide a solid feel.
 */
export function handleObjectSnapping(canvas: fabric.Canvas, activeObject: any) {
    if (!canvas || !activeObject || activeObject instanceof fabric.ActiveSelection) return;

    const zoom = canvas.getZoom();
    const snapThreshold = SNAP_THRESHOLD / zoom;
    const stickyThreshold = STICKY_THRESHOLD / zoom;

    // 1. Initialization on First Move
    // We need to know where the drag started to calculate "raw" position correctly.
    const pointer = canvas.getScenePoint((canvas as any)._lastEvent?.e || {} as any);
    const downPointer = (canvas as any)._mouseDownPointer;

    if (!downPointer) return;

    if (activeObject._dragStartLeft === undefined) {
        activeObject._dragStartLeft = activeObject.left ?? 0;
        activeObject._dragStartTop = activeObject.top ?? 0;
    }

    // Calculate the raw "desired" position based on mouse delta
    const rawLeft = activeObject._dragStartLeft + (pointer.x - downPointer.x);
    const rawTop = activeObject._dragStartTop + (pointer.y - downPointer.y);

    // 2. Clear previous guides
    const objectsInCanvas = canvas.getObjects();
    const existingGuides = objectsInCanvas.filter(o => (o as any).isGuide);
    if (existingGuides.length > 0) {
        canvas.remove(...existingGuides);
    }

    const isText = (obj: any) =>
        obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';

    const activeIsText = isText(activeObject);
    const objects = objectsInCanvas.filter(obj =>
        obj !== activeObject && obj.visible && !(obj as any).isGuide
    );

    const canvasWidth = (canvas.width || 0) / zoom;
    const canvasHeight = (canvas.height || 0) / zoom;

    // Calculate potential bounds at the raw position
    const w = (activeObject.width || 0) * (activeObject.scaleX || 1);
    const h = (activeObject.height || 0) * (activeObject.scaleY || 1);

    let aL = rawLeft;
    let aT = rawTop;

    if (activeObject.originX === 'center') aL -= w / 2;
    if (activeObject.originY === 'center') aT -= h / 2;

    const aR = aL + w;
    const aB = aT + h;
    const aCX = aL + w / 2;
    const aCY = aT + h / 2;

    // 3. Collect Snap Targets
    const vTargets: { pos: number, priority: number }[] = [
        { pos: 0, priority: 1 },
        { pos: canvasWidth / 2, priority: 2 },
        { pos: canvasWidth, priority: 1 }
    ];
    const hTargets: { pos: number, priority: number }[] = [
        { pos: 0, priority: 1 },
        { pos: canvasHeight / 2, priority: 2 },
        { pos: canvasHeight, priority: 1 }
    ];

    objects.forEach(obj => {
        const obCoords = obj.getCoords();
        const oL = Math.min(obCoords[0].x, obCoords[1].x, obCoords[2].x, obCoords[3].x);
        const oR = Math.max(obCoords[0].x, obCoords[1].x, obCoords[2].x, obCoords[3].x);
        const oT = Math.min(obCoords[0].y, obCoords[1].y, obCoords[2].y, obCoords[3].y);
        const oB = Math.max(obCoords[0].y, obCoords[1].y, obCoords[2].y, obCoords[3].y);
        const oCX = (oL + oR) / 2;
        const oCY = (oT + oB) / 2;

        const basePriority = (activeIsText && isText(obj)) ? 3 : 1;

        vTargets.push({ pos: oL, priority: basePriority });
        vTargets.push({ pos: oCX, priority: basePriority + 1 });
        vTargets.push({ pos: oR, priority: basePriority });

        hTargets.push({ pos: oT, priority: basePriority });
        hTargets.push({ pos: oCY, priority: basePriority + 1 });
        hTargets.push({ pos: oB, priority: basePriority });
    });

    // 4. Snapping Logic
    let finalLeft = rawLeft;
    let finalTop = rawTop;

    // X Snapping
    let bestX: { pos: number, delta: number, priority: number } | null = null;
    [aL, aCX, aR].forEach(activePoint => {
        vTargets.forEach(target => {
            const delta = target.pos - activePoint;
            const dist = Math.abs(delta);
            const isCurrentlySnapped = activeObject._lastSnapX === target.pos;
            const threshold = isCurrentlySnapped ? stickyThreshold : snapThreshold;

            if (dist < threshold) {
                if (!bestX || target.priority > bestX.priority || (target.priority === bestX.priority && dist < Math.abs(bestX.delta))) {
                    bestX = { pos: target.pos, delta, priority: target.priority };
                }
            }
        });
    });

    if (bestX) {
        finalLeft += (bestX as any).delta;
        activeObject._lastSnapX = (bestX as any).pos;
        showGuide(canvas, (bestX as any).pos, 'v');
    } else {
        activeObject._lastSnapX = null;
    }

    // Y Snapping
    let bestY: { pos: number, delta: number, priority: number } | null = null;
    [aT, aCY, aB].forEach(activePoint => {
        hTargets.forEach(target => {
            const delta = target.pos - activePoint;
            const dist = Math.abs(delta);
            const isCurrentlySnapped = activeObject._lastSnapY === target.pos;
            const threshold = isCurrentlySnapped ? stickyThreshold : snapThreshold;

            if (dist < threshold) {
                if (!bestY || target.priority > bestY.priority || (target.priority === bestY.priority && dist < Math.abs(bestY.delta))) {
                    bestY = { pos: target.pos, delta, priority: target.priority };
                }
            }
        });
    });

    if (bestY) {
        finalTop += (bestY as any).delta;
        activeObject._lastSnapY = (bestY as any).pos;
        showGuide(canvas, (bestY as any).pos, 'h');
    } else {
        activeObject._lastSnapY = null;
    }

    // 5. Apply Position
    activeObject.set({
        left: finalLeft,
        top: finalTop
    });

    activeObject.setCoords();
}

function showGuide(canvas: fabric.Canvas, pos: number, type: 'h' | 'v') {
    const zoom = canvas.getZoom();
    const worldWidth = (canvas.width || 0) / zoom;
    const worldHeight = (canvas.height || 0) / zoom;

    const guide = new fabric.Line(
        type === 'h' ? [0, pos, worldWidth, pos] : [pos, 0, pos, worldHeight],
        {
            stroke: '#3b82f6',
            strokeWidth: 1 / zoom,
            selectable: false,
            evented: false,
            opacity: 0.6,
            strokeDashArray: [5 / zoom, 5 / zoom],
            excludeFromExport: true
        }
    );
    (guide as any).isGuide = true;
    canvas.add(guide);
}

export function clearGuides(canvas: fabric.Canvas) {
    const guides = canvas.getObjects().filter(o => (o as any).isGuide);
    if (guides.length > 0) {
        canvas.remove(...guides);
    }

    const activeObject = canvas.getActiveObject() as any;
    if (activeObject) {
        delete activeObject._dragStartLeft;
        delete activeObject._dragStartTop;
        delete activeObject._lastSnapX;
        delete activeObject._lastSnapY;
    }

    canvas.requestRenderAll();
}
