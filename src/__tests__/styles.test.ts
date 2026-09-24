import * as fabric from 'fabric';

/**
 * Copy / Paste Style Logic Tests
 * Verifies that visual styles, typography, and shadow/stroke properties
 * are extracted and pasted properly across objects and groups.
 */
describe('Copy / Paste Style Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 800, height: 800 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should copy and paste fill, stroke, and shadow between shapes', () => {
        const source = new fabric.Rect({
            left: 10,
            top: 10,
            width: 100,
            height: 100,
            fill: '#ff0000',
            stroke: '#00ff00',
            strokeWidth: 4,
            opacity: 0.8,
            shadow: new fabric.Shadow({ color: '#000000', blur: 10, offsetX: 5, offsetY: 5 }),
        });

        const target = new fabric.Circle({
            left: 200,
            top: 200,
            radius: 50,
            fill: '#0000ff',
        });

        canvas.add(source, target);

        // Simulate copyStyle extraction
        const style: any = {
            fill: source.fill,
            stroke: source.stroke,
            strokeWidth: source.strokeWidth,
            opacity: source.opacity,
            shadow: source.shadow ? {
                color: source.shadow.color,
                blur: source.shadow.blur,
                offsetX: source.shadow.offsetX,
                offsetY: source.shadow.offsetY,
            } : null,
        };

        // Simulate pasteStyle
        target.set({
            fill: style.fill,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            opacity: style.opacity,
            shadow: style.shadow ? new fabric.Shadow(style.shadow) : null,
        });

        expect(target.fill).toBe('#ff0000');
        expect(target.stroke).toBe('#00ff00');
        expect(target.strokeWidth).toBe(4);
        expect(target.opacity).toBe(0.8);
        expect(target.shadow).toBeDefined();
        expect(target.shadow?.color).toBe('#000000');
        expect(target.shadow?.blur).toBe(10);
    });

    test('should copy typography from text and paste onto another text element', () => {
        const sourceText = new fabric.IText('Source', {
            fontFamily: 'Roboto',
            fontSize: 48,
            fontWeight: 'bold',
            fontStyle: 'italic',
            fill: '#e11d48',
        });

        const targetText = new fabric.IText('Target', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: '#ffffff',
        });

        canvas.add(sourceText, targetText);

        const style: any = {
            fill: sourceText.fill,
            isText: true,
            fontFamily: sourceText.fontFamily,
            fontSize: sourceText.fontSize,
            fontWeight: sourceText.fontWeight,
            fontStyle: sourceText.fontStyle,
        };

        targetText.set({
            fill: style.fill,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
        });

        expect(targetText.fill).toBe('#e11d48');
        expect(targetText.fontFamily).toBe('Roboto');
        expect(targetText.fontSize).toBe(48);
        expect(targetText.fontWeight).toBe('bold');
        expect(targetText.fontStyle).toBe('italic');
    });

    test('should recursively paste styles onto all group members and group container', () => {
        const r1 = new fabric.Rect({ left: 10, top: 10, width: 50, height: 50, fill: '#111111' });
        const r2 = new fabric.Rect({ left: 70, top: 10, width: 50, height: 50, fill: '#222222' });
        const group = new fabric.Group([r1, r2]);
        canvas.add(group);

        const style: any = {
            fill: '#3b82f6',
            stroke: '#1d4ed8',
            strokeWidth: 3,
            shadow: { color: '#000000', blur: 8, offsetX: 4, offsetY: 4 },
        };

        const applyRecursively = (target: fabric.Object) => {
            if (typeof (target as any).forEachObject === 'function') {
                (target as fabric.Group).forEachObject((child) => applyRecursively(child));
            }
            target.set({
                fill: style.fill,
                stroke: style.stroke,
                strokeWidth: style.strokeWidth,
                shadow: style.shadow ? new fabric.Shadow(style.shadow) : null,
            });
        };

        applyRecursively(group);

        expect(group.fill).toBe('#3b82f6');
        expect(group.stroke).toBe('#1d4ed8');
        expect(r1.fill).toBe('#3b82f6');
        expect(r1.stroke).toBe('#1d4ed8');
        expect(r1.strokeWidth).toBe(3);
        expect(r2.fill).toBe('#3b82f6');
        expect(r2.stroke).toBe('#1d4ed8');
        expect(r2.strokeWidth).toBe(3);
    });
});
