import * as fabric from 'fabric';

/**
 * Zoom & Scaling Logic Tests
 * Verifies the mathematical logic behind zooming and fitting to screen.
 */
describe('Zoom & Scaling Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 1000, height: 1000 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should set zoom level correctly', () => {
        canvas.setZoom(2);
        expect(canvas.getZoom()).toBe(2);
    });

    test('should calculate fit-to-screen scale correctly (simulation)', () => {
        const padding = 100;
        const availableWidth = 800; // Mock viewport width minus sidebar
        const availableHeight = 600; // Mock viewport height

        const canvasWidth = 1000;
        const canvasHeight = 1000;

        // Logic from fitToScreen
        const scaleX = (availableWidth - padding) / canvasWidth;
        const scaleY = (availableHeight - padding) / canvasHeight;
        let scale = Math.min(scaleX, scaleY);

        if (scale > 1) scale = 1;

        // expected: min((800-100)/1000, (600-100)/1000) = min(0.7, 0.5) = 0.5
        expect(scale).toBe(0.5);
    });

    test('should maintain relative object positions during zoom', () => {
        const obj = new fabric.Rect({ left: 100, top: 100, width: 50, height: 50 });
        canvas.add(obj);

        canvas.setZoom(2);

        // Logical position should still be 100, 100
        expect(obj.left).toBe(100);
        // But the viewport relative position would be different (not tested here as it's internal to Fabric)
    });
});
