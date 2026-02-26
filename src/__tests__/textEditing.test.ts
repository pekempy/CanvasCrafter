import * as fabric from 'fabric';

/**
 * Text Editing Logic Tests
 * Verifies that text objects are created with correct defaults and updated properly.
 */
describe('Text Editing Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 500, height: 500 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should create IText object with expected default styling', () => {
        const text = new fabric.IText("Hello CanvasCrafter", {
            left: 100,
            top: 100,
            fontSize: 40,
            fontFamily: 'Inter',
            fill: '#000000'
        });

        expect(text.type).toBe('i-text');
        expect(text.text).toBe("Hello CanvasCrafter");
        expect(text.fontSize).toBe(40);
        expect(text.fill).toBe('#000000');
    });

    test('should update text properties through the generic update logic', () => {
        const text = new fabric.IText("Editable");
        canvas.add(text);

        // Simulate updateSelectedObject({ fontWeight: 'bold', fill: 'red' })
        text.set({
            fontWeight: 'bold',
            fill: 'red'
        });

        expect(text.fontWeight).toBe('bold');
        expect(text.fill).toBe('red');
    });

    test('should handle font family changes correctly', () => {
        const text = new fabric.IText("Custom Font");
        text.set('fontFamily', 'Roboto');
        expect(text.fontFamily).toBe('Roboto');
    });

    test('should handle shadow properties on text', () => {
        const text = new fabric.IText("Shadowed");
        const shadow = new fabric.Shadow({
            color: 'rgba(0,0,0,0.5)',
            blur: 10,
            offsetX: 5,
            offsetY: 5
        });

        text.set('shadow', shadow);

        expect(text.shadow).toBeInstanceOf(fabric.Shadow);
        expect((text.shadow as fabric.Shadow).blur).toBe(10);
    });
});
