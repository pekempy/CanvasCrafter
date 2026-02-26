import * as fabric from 'fabric';

/**
 * Clipboard & Duplication Logic Tests
 * Verifies that objects are cloned correctly during copy, cut, and paste.
 */
describe('Clipboard & Duplication Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 500, height: 500 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should clone an object correctly for duplication', async () => {
        const rect = new fabric.Rect({ left: 10, top: 10, width: 100, height: 100, fill: 'blue' });
        canvas.add(rect);

        const cloned = await rect.clone();
        expect(cloned).not.toBe(rect); // Different reference
        expect(cloned.left).toBe(10);
        expect(cloned.width).toBe(100);
        expect(cloned.fill).toBe('blue');
    });

    test('should apply an offset when pasting a cloned object', async () => {
        const rect = new fabric.Rect({ left: 100, top: 100, width: 50, height: 50 });
        const clipboard = await rect.clone();

        // Simulate pasteSelected offset logic
        const pasted = await clipboard.clone();
        pasted.set({
            left: (clipboard.left || 0) + 10,
            top: (clipboard.top || 0) + 10,
        });

        expect(pasted.left).toBe(110);
        expect(pasted.top).toBe(110);
    });

    test('should handle group cloning correctly', async () => {
        const r1 = new fabric.Rect({ width: 50, height: 50 });
        const r2 = new fabric.Rect({ width: 50, height: 50, left: 60 });
        const group = new fabric.Group([r1, r2]);

        const clonedGroup = await group.clone();
        expect(clonedGroup.type).toBe('group');
        expect((clonedGroup as fabric.Group).getObjects()).toHaveLength(2);
    });
});
