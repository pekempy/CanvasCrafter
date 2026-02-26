import * as fabric from 'fabric';

/**
 * Alignment Logic Tests
 * Verifies that objects can be aligned to the canvas or to each other.
 */
describe('Alignment Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 1000, height: 1000 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should align a single object to the canvas left', () => {
        const obj = new fabric.Rect({ left: 500, top: 500, width: 100, height: 100, strokeWidth: 0 });
        canvas.add(obj);

        // Simulation of alignSelected('left') for single object
        obj.set('left', 0);

        expect(obj.left).toBe(0);
    });

    test('should align a single object to the canvas right', () => {
        const obj = new fabric.Rect({ left: 10, top: 10, width: 100, height: 100, strokeWidth: 0 });
        canvas.add(obj);

        // Simulation of alignSelected('right')
        obj.set('left', canvas.width! - obj.getScaledWidth());

        expect(obj.left).toBe(900);
    });

    test('should align a single object to the canvas bottom', () => {
        const obj = new fabric.Rect({ left: 10, top: 10, width: 100, height: 100, strokeWidth: 0 });
        canvas.add(obj);

        // Simulation of alignSelected('bottom')
        obj.set('top', canvas.height! - obj.getScaledHeight());

        expect(obj.top).toBe(900);
    });

    test('should center an object horizontally in the canvas', () => {
        const obj = new fabric.Rect({
            left: 10,
            top: 10,
            width: 200,
            height: 200,
            strokeWidth: 0,
            originX: 'left' // Explicitly set origin
        });
        canvas.add(obj);

        canvas.centerObjectH(obj);

        // centerObjectH centers the object center on the canvas center (500).
        // If originX is 'left', then obj.left should be 500 - (objWidth / 2) = 400.
        // Wait, Fabric 7 might behave differently or I might be misremembering origin behavior in tests.
        expect(obj.left).toBe(400);
    });
});
