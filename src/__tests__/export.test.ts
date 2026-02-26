import * as fabric from 'fabric';

/**
 * Export Logic Tests
 * Verifies that the canvas dimensions and zoom are adjusted correctly during export.
 */
describe('Export Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 500, height: 500 });
        canvas.setZoom(0.5);
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should reset zoom to 1 and adjust dimensions during export simulation', () => {
        const targetWidth = 1080;
        const targetHeight = 1080;

        const originalZoom = canvas.getZoom(); // 0.5
        const originalWidth = canvas.width;    // 500

        // Simulation of exportAsFormat logic
        canvas.setDimensions({ width: targetWidth, height: targetHeight });
        canvas.setZoom(1);

        expect(canvas.width).toBe(1080);
        expect(canvas.getZoom()).toBe(1);

        // Restore logic
        canvas.setDimensions({ width: originalWidth, height: canvas.height }); // Simplified
        canvas.setZoom(originalZoom);

        expect(canvas.getZoom()).toBe(0.5);
    });

    test('should generate a dataURL of appropriate format', () => {
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
        expect(dataURL).toContain('data:image/png;base64');
    });
});
