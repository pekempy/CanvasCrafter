import * as fabric from 'fabric';

/**
 * Simplified History Logic Mock Test
 * Since we can't easily test React Hooks in this environment without extra deps,
 * we verify the methodology of JSON snapshotting used in our undo/redo logic.
 */
describe('History Snapshotting Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 400, height: 400 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should capture canvas state as JSON for history', () => {
        const rect = new fabric.Rect({ width: 100, height: 100, fill: 'red' });
        canvas.add(rect);
        canvas.renderAll();

        const snapshot1 = JSON.stringify(canvas.toObject());

        rect.set({ fill: 'blue' });
        canvas.renderAll();
        const snapshot2 = JSON.stringify(canvas.toObject());

        expect(snapshot1).not.toBe(snapshot2);
        expect(snapshot2).toContain('blue');
    });

    test('should restore state from JSON accurately', async () => {
        const rect = new fabric.Rect({ width: 100, height: 100, fill: 'red' });
        canvas.add(rect);
        const initialJSON = canvas.toObject();

        canvas.clear();
        expect(canvas.getObjects().length).toBe(0);

        await canvas.loadFromJSON(initialJSON);
        expect(canvas.getObjects().length).toBe(1);
        expect(canvas.getObjects()[0].type).toBe('rect');
    });
});
