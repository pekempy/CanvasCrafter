import * as fabric from 'fabric';

/**
 * Layer Management Logic Tests
 * Verifies that objects can be moved forward/backward in the stack.
 */
describe('Layer Management Logic', () => {
    let canvas: fabric.Canvas;

    beforeEach(() => {
        canvas = new fabric.Canvas(document.createElement('canvas'), { width: 500, height: 500 });
    });

    afterEach(() => {
        canvas.dispose();
    });

    test('should bring object to the absolute front of the stack', () => {
        const obj1 = new fabric.Rect({ left: 0, top: 0, width: 50, height: 50 });
        const obj2 = new fabric.Circle({ radius: 25, left: 10, top: 10 });
        const obj3 = new fabric.Triangle({ width: 50, height: 50, left: 20, top: 20 });

        canvas.add(obj1, obj2, obj3);

        // Initial order: obj1 (0), obj2 (1), obj3 (2)
        expect(canvas.getObjects().indexOf(obj1)).toBe(0);

        canvas.bringObjectToFront(obj1);

        // New order: obj2 (0), obj3 (1), obj1 (2)
        expect(canvas.getObjects().indexOf(obj1)).toBe(2);
    });

    test('should send object to the absolute back of the stack', () => {
        const obj1 = new fabric.Rect({ width: 50, height: 50 });
        const obj2 = new fabric.Circle({ radius: 25 });

        canvas.add(obj1, obj2);

        expect(canvas.getObjects().indexOf(obj2)).toBe(1);

        canvas.sendObjectToBack(obj2);

        expect(canvas.getObjects().indexOf(obj2)).toBe(0);
    });

    test('should move object forward by one step', () => {
        const obj1 = new fabric.Rect({ width: 50, height: 50 });
        const obj2 = new fabric.Circle({ radius: 25 });
        const obj3 = new fabric.Triangle({ width: 50, height: 50 });

        canvas.add(obj1, obj2, obj3);

        canvas.bringObjectForward(obj1);

        expect(canvas.getObjects().indexOf(obj1)).toBe(1);
        expect(canvas.getObjects().indexOf(obj2)).toBe(0);
    });
});
