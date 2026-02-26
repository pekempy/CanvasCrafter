// Utility for smart resizing of a selected Fabric object
import * as fabric from "fabric";

/**
 * Resize a selected object while preserving aspect ratio when one dimension is omitted (0).
 * @param canvas Fabric canvas instance (or null)
 * @param selectedObject The object to resize (or null)
 * @param width Desired width (0 to auto‑calculate)
 * @param height Desired height (0 to auto‑calculate)
 */
export function smartResizeSelected(
    canvas: fabric.Canvas | null,
    selectedObject: fabric.Object | null,
    width: number,
    height: number
): void {
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
}
