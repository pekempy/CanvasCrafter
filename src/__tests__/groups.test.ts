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
        canvas.add(r1, r2);

        const allObjects = canvas.getObjects();
        const minIndex = Math.min(allObjects.indexOf(r1), allObjects.indexOf(r2));
        canvas.remove(r1, r2);
        const group = new fabric.Group([r1, r2]);
        canvas.insertAt(minIndex, group);

        // Ungroup logic
        const items = [...group.getObjects()];
        const groupIndex = canvas.getObjects().indexOf(group);
        group.removeAll();
        canvas.remove(group);
        items.forEach((item, i) => {
            canvas.insertAt(groupIndex + i, item);
            item.setCoords();
        });

        expect(canvas.getObjects()).toHaveLength(2);
        expect(canvas.getObjects()[0]).toBe(r1);
        expect(canvas.getObjects()[1]).toBe(r2);
        expect(r1.left).toBe(10);
        expect(r2.left).toBe(70);
    });

    test('should group active selection, move together, and retain coordinates after ungroup', () => {
        const r1 = new fabric.Rect({ left: 100, top: 100, width: 50, height: 50 });
        const r2 = new fabric.Rect({ left: 200, top: 200, width: 50, height: 50 });
        canvas.add(r1, r2);

        const sel = new fabric.ActiveSelection([r1, r2], { canvas });
        canvas.setActiveObject(sel);

        // Group selected logic
        const objects = [...sel.getObjects()];
        canvas.discardActiveObject();
        objects.forEach(obj => canvas.remove(obj));
        const group = new fabric.Group(objects);
        canvas.add(group);

        // Move group together
        group.set({ left: 300, top: 300 });
        group.setCoords();

        // Ungroup
        const items = [...group.getObjects()];
        group.removeAll();
        canvas.remove(group);
        items.forEach(item => {
            canvas.add(item);
            item.setCoords();
        });

        expect(canvas.getObjects()).toHaveLength(2);
        expect(r1.left).toBe(250);
        expect(r1.top).toBe(250);
        expect(r2.left).toBe(350);
        expect(r2.top).toBe(350);
    });

    test('should cascade shadow and outline properties to all group members', () => {
        const r1 = new fabric.Rect({ left: 10, top: 10, width: 50, height: 50 });
        const r2 = new fabric.Rect({ left: 70, top: 10, width: 50, height: 50 });
        canvas.add(r1, r2);

        const group = new fabric.Group([r1, r2]);
        canvas.add(group);

        const shadow = new fabric.Shadow({ color: '#ff0000', blur: 15, offsetX: 5, offsetY: 5 });
        const strokeProps = { stroke: '#00ff00', strokeWidth: 4, paintFirst: 'stroke' };

        const setRecursive = (target: fabric.Object, props: any) => {
            if (typeof (target as any).forEachObject === 'function') {
                (target as fabric.Group).forEachObject((child) => setRecursive(child, props));
            }
            target.set(props);
        };

        setRecursive(group, { shadow });
        setRecursive(group, strokeProps);

        expect(group.shadow).toBe(shadow);
        expect(r1.shadow).toBe(shadow);
        expect(r2.shadow).toBe(shadow);

        expect(group.stroke).toBe('#00ff00');
        expect(r1.stroke).toBe('#00ff00');
        expect(r2.stroke).toBe('#00ff00');
        expect(r1.strokeWidth).toBe(4);
        expect(r2.strokeWidth).toBe(4);
    });
});
