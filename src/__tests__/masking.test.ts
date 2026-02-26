import * as fabric from 'fabric';

/**
 * Masking Logic Tests
 * Verifies the creation and release of clipping masks.
 */
describe('Masking Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 500, height: 500 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should apply a clipPath to an image correctly', () => {
        const shape = new fabric.Rect({ width: 100, height: 100, left: 10, top: 10 });
        const img = new fabric.Rect({ width: 200, height: 200 });

        const clonedShape = new fabric.Rect({
            width: shape.width,
            height: shape.height,
            originX: 'center',
            originY: 'center',
            absolutePositioned: false
        });

        img.set({ clipPath: clonedShape });

        expect(img.clipPath).toBeDefined();
        expect(img.clipPath?.type.toLowerCase()).toBe('rect');
        expect(img.clipPath?.originX).toBe('center');
    });

    test('should release a mask and restore the original shape property', () => {
        const mask = new fabric.Circle({ radius: 50 });
        const img = new fabric.Rect({
            width: 100,
            height: 100,
            clipPath: mask
        });

        const releasedMask: any = img.clipPath;
        const restoredShape = new fabric.Circle({
            radius: releasedMask.radius,
            left: img.left,
            top: img.top
        });

        img.set({ clipPath: undefined });

        expect(img.clipPath).toBeUndefined();
        expect(restoredShape.type.toLowerCase()).toBe('circle');
        expect(restoredShape.radius).toBe(50);
    });
});
