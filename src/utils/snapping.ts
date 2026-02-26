import * as fabric from "fabric";

const SNAP_THRESHOLD = 8;

export function handleObjectSnapping(canvas: fabric.Canvas, activeObject: fabric.Object) {
    if (!activeObject || activeObject instanceof fabric.ActiveSelection) return;

    const objects = canvas.getObjects().filter(obj => obj !== activeObject && obj.visible && !(obj as any).isGuide);
    const activeRect = activeObject.getBoundingRect();
    const activeCenter = activeObject.getCenterPoint();

    let snapX: number | null = null;
    let snapY: number | null = null;

    canvas.getObjects().filter(o => (o as any).isGuide).forEach(g => canvas.remove(g));

    objects.forEach(obj => {
        const targetRect = obj.getBoundingRect();
        const targetCenter = obj.getCenterPoint();

        // Snap to edges - X
        if (Math.abs(activeRect.left - targetRect.left) < SNAP_THRESHOLD) snapX = targetRect.left;
        if (Math.abs(activeRect.left + activeRect.width - (targetRect.left + targetRect.width)) < SNAP_THRESHOLD) snapX = targetRect.left + targetRect.width - activeRect.width;
        if (Math.abs(activeCenter.x - targetCenter.x) < SNAP_THRESHOLD) snapX = targetCenter.x - (activeObject.width! * activeObject.scaleX! / 2);

        // Snap to edges - Y
        if (Math.abs(activeRect.top - targetRect.top) < SNAP_THRESHOLD) snapY = targetRect.top;
        if (Math.abs(activeRect.top + activeRect.height - (targetRect.top + targetRect.height)) < SNAP_THRESHOLD) snapY = targetRect.top + targetRect.height - activeRect.height;
        if (Math.abs(activeCenter.y - targetCenter.y) < SNAP_THRESHOLD) snapY = targetCenter.y - (activeObject.height! * activeObject.scaleY! / 2);
    });

    // Snap to canvas center
    const canvasCenter = { x: canvas.width! / 2, y: canvas.height! / 2 };
    if (Math.abs(activeCenter.x - canvasCenter.x) < SNAP_THRESHOLD) snapX = canvasCenter.x - (activeObject.width! * activeObject.scaleX! / 2);
    if (Math.abs(activeCenter.y - canvasCenter.y) < SNAP_THRESHOLD) snapY = canvasCenter.y - (activeObject.height! * activeObject.scaleY! / 2);


    if (snapX !== null) {
        activeObject.set({ left: snapX });
        showGuide(canvas, snapX, 'v');
    }
    if (snapY !== null) {
        activeObject.set({ top: snapY });
        showGuide(canvas, snapY, 'h');
    }
}

function showGuide(canvas: fabric.Canvas, pos: number, type: 'h' | 'v') {
    const guide = new fabric.Line(
        type === 'h' ? [0, pos, canvas.width!, pos] : [pos, 0, pos, canvas.height!],
        {
            stroke: '#3b82f6',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            opacity: 0.5,
            strokeDashArray: [5, 5]
        }
    );
    (guide as any).isGuide = true;
    canvas.add(guide);
}

export function clearGuides(canvas: fabric.Canvas) {
    canvas.getObjects().filter(o => (o as any).isGuide).forEach(g => canvas.remove(g));
    canvas.requestRenderAll();
}
