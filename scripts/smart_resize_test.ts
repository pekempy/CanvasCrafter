import * as fabric from 'fabric';

// Replicate the smartResizeSelected logic from useCanvasStore
function smartResizeSelected(canvas: fabric.Canvas | null, selectedObject: fabric.Object | null, width: number, height: number) {
    if (!canvas || !selectedObject) return;
    const obj: any = selectedObject;
    const originalWidth = obj.getScaledWidth ? obj.getScaledWidth() : obj.width;
    const originalHeight = obj.getScaledHeight ? obj.getScaledHeight() : obj.height;
    const newWidth = width || (height * originalWidth) / originalHeight;
    const newHeight = height || (width * originalHeight) / originalWidth;
    if (obj.setScaleX && obj.setScaleY) {
        obj.setScaleX(newWidth / obj.width);
        obj.setScaleY(newHeight / obj.height);
    } else {
        obj.set({ width: newWidth, height: newHeight });
    }
    canvas.requestRenderAll();
    console.log('Resized to', newWidth, newHeight);
}

// Create a canvas and a rectangle
const canvas = new fabric.Canvas();
const rect = new fabric.Rect({ left: 0, top: 0, width: 100, height: 50, fill: 'red' });
canvas.add(rect);
canvas.setActiveObject(rect);

// Test smart resize: provide width only, height 0 to preserve aspect ratio
smartResizeSelected(canvas, rect, 200, 0);
// Expected height = 200 * 50 / 100 = 100

// Test smart resize: provide height only
smartResizeSelected(canvas, rect, 0, 150);
// Expected width = 150 * 100 / 50 = 300
