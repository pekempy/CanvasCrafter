import * as fabric from "fabric";
import { handleObjectSnapping, clearGuides } from "../utils/snapping";

describe("Object Snapping Utility", () => {
    let canvas: fabric.Canvas;
    let obj1: fabric.Rect;
    let obj2: fabric.Rect;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement("canvas"), { width: 1000, height: 1000 });
        obj1 = new fabric.Rect({
            left: 100, top: 100, width: 100, height: 100,
            scaleX: 1, scaleY: 1, strokeWidth: 0,
            originX: 'left', originY: 'top'
        });
        obj2 = new fabric.Rect({
            left: 500, top: 500, width: 100, height: 100,
            scaleX: 1, scaleY: 1, strokeWidth: 0,
            originX: 'left', originY: 'top'
        });
        canvas.add(obj1, obj2);
        canvas.renderAll();
    });

    test("should snap object to another object left edge", () => {
        // Move obj2 close to obj1's left edge (100)
        obj2.set({ left: 104 });
        canvas.renderAll();
        handleObjectSnapping(canvas, obj2);
        expect(Math.round(obj2.left)).toBe(100);
    });

    test("should snap object to canvas centers", () => {
        // Canvas center is 500, 500
        // Object center is left + scaledWidth / 2
        // To snap center to 500, left should be 500 - 50 = 450
        obj2.set({ left: 454, top: 454 });
        canvas.renderAll();
        handleObjectSnapping(canvas, obj2);

        expect(Math.round(obj2.left)).toBe(450);
        expect(Math.round(obj2.top)).toBe(450);
    });

    test("should clear guides correctly", () => {
        // Trigger a snap to create a guide
        obj2.set({ left: 104 });
        handleObjectSnapping(canvas, obj2);

        const guidesCountBefore = canvas.getObjects().filter((o: any) => o.isGuide).length;
        expect(guidesCountBefore).toBeGreaterThan(0);

        clearGuides(canvas);
        const guidesCountAfter = canvas.getObjects().filter((o: any) => o.isGuide).length;
        expect(guidesCountAfter).toBe(0);
    });
});
