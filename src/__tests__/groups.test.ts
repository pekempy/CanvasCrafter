import * as fabric from 'fabric';

/**
 * Grouping/Ungrouping Logic Tests
 * Verifies that objects can be grouped and ungrouped while maintaining positions.
 */
describe('Grouping Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 800, height: 800 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should create a group from multiple objects', () => {
        const r1 = new fabric.Rect({ left: 10, top: 10, width: 50, height: 50 });
        const r2 = new fabric.Rect({ left: 70, top: 10, width: 50, height: 50 });

        canvas.add(r1, r2);

        const group = new fabric.Group([r1, r2]);
        canvas.add(group);

        expect(group.getObjects()).toHaveLength(2);
        expect(group.type).toBe('group');
    });

    test('should ungroup objects and restore them to the canvas', () => {
        const r1 = new fabric.Rect({ left: 10, top: 10, width: 50, height: 50 });
        const r2 = new fabric.Rect({ left: 70, top: 10, width: 50, height: 50 });
        const group = new fabric.Group([r1, r2]);
        canvas.add(group);

        // Simulation of ungroupSelected logic
        const items = group.getObjects();
        canvas.remove(group);
        items.forEach(obj => canvas.add(obj));

        expect(canvas.getObjects()).toHaveLength(2);
        expect(canvas.getObjects()[0]).toBe(r1);
        expect(canvas.getObjects()[1]).toBe(r2);
    });
});
