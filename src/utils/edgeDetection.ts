import * as fabric from "fabric";
import { contours } from "d3-contour";

export async function detectEdgesAndAddStroke(canvas: fabric.Canvas, img: fabric.Image, strokeColor = "#3b82f6", strokeWidth = 4) {
    const imgElement = img.getElement() as HTMLImageElement;
    if (!imgElement) return;

    const scale = Math.min(1, 400 / Math.max(img.width!, img.height!));
    const w = Math.round(img.width! * scale);
    const h = Math.round(img.height! * scale);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(imgElement, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Create a 1D array of values for d3-contour (using alpha channel)
    const values = new Array(w * h);
    for (let i = 0; i < w * h; i++) {
        values[i] = data[i * 4 + 3] > 60 ? 1 : 0;
    }

    const contourGen = contours().size([w, h]).thresholds([0.5]);
    const results = contourGen(values);

    // d3-contour shapes arrays have type === "MultiPolygon"
    const shape = results[0];
    if (!shape || !shape.coordinates || shape.coordinates.length === 0) return;

    const invScale = 1 / scale;

    const mainPolygon = shape.coordinates.reduce((maxPoly: any, currentPoly: any) => {
        return currentPoly[0].length > maxPoly[0].length ? currentPoly : maxPoly;
    }, shape.coordinates[0]);

    if (!mainPolygon || !mainPolygon[0]) return;

    // Offset points slightly based on d3-contour output relative to stroke centers
    const points = mainPolygon[0].map((coord: number[]) => ({
        x: (coord[0] * invScale) - (img.width! / 2),
        y: (coord[1] * invScale) - (img.height! / 2)
    }));

    // Generate Path from coordinates
    const outline = new fabric.Polygon(points, {
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeLineJoin: 'round',
        strokeLineCap: 'round',
        originX: 'center',
        originY: 'center',
        evented: false,
        selectable: false
    });


    const clone = await img.clone() as fabric.Image;
    clone.set({
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        angle: 0
    });

    const group = new fabric.Group([outline, clone], {
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
        shadow: img.shadow
    });

    canvas.remove(img);
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
}
