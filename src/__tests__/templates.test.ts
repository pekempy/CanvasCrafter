import * as fabric from 'fabric';

/**
 * Template Management Logic Tests
 * Verifies how designs are serialized, stored, and restored.
 */
describe('Template & Design Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 500, height: 500 });
        localStorage.clear();
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should serialize canvas to a valid JSON string', () => {
        const rect = new fabric.Rect({ width: 100, height: 100, fill: 'red' });
        canvas.add(rect);

        const json = JSON.stringify(canvas.toObject());
        expect(typeof json).toBe('string');
        expect(json).toContain('Rect');
        expect(json).toContain('red');
    });

    test('should create a design object with correct metadata', () => {
        const canvasJSON = JSON.stringify({ version: "5.3.0", objects: [] });
        const name = "My Test Design";
        const designId = Math.random().toString(36).substr(2, 9);

        const design = {
            id: designId,
            name: name,
            data: canvasJSON,
            timestamp: Date.now()
        };

        expect(design.name).toBe(name);
        expect(design.data).toBe(canvasJSON);
        expect(design.id).toHaveLength(9);
    });

    test('should properly restore canvas from stored JSON', async () => {
        const originalRect = new fabric.Rect({ width: 50, height: 50, fill: 'green', top: 10, left: 10 });
        canvas.add(originalRect);
        const savedJSON = canvas.toObject();

        canvas.clear();
        expect(canvas.getObjects()).toHaveLength(0);

        await canvas.loadFromJSON(savedJSON);
        expect(canvas.getObjects()).toHaveLength(1);
        const restored = canvas.getObjects()[0] as fabric.Rect;
        expect(restored.type).toBe('rect');
        expect(restored.fill).toBe('green');
        expect(restored.top).toBe(10);
    });
});
