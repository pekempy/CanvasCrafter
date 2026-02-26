// Jest tests for the smartResize utility
import { smartResizeSelected } from '@/utils/smartResize';
import * as fabric from 'fabric';

describe('smartResizeSelected', () => {
    test('resizes width and preserves aspect ratio when height is 0', () => {
        const canvas = new fabric.Canvas();
        const rect = new fabric.Rect({ left: 0, top: 0, width: 100, height: 50, fill: 'red', strokeWidth: 0 });
        canvas.add(rect);
        // width = 200, height = 0 => height should become 100 (preserve ratio)
        smartResizeSelected(canvas, rect, 200, 0);
        // getScaledWidth/Height reflect the actual rendered size
        expect(rect.getScaledWidth()).toBeCloseTo(200);
        expect(rect.getScaledHeight()).toBe(100);
    });

    test('resizes height and preserves aspect ratio when width is 0', () => {
        const canvas = new fabric.Canvas();
        const rect = new fabric.Rect({ left: 0, top: 0, width: 100, height: 50, fill: 'blue', strokeWidth: 0 });
        canvas.add(rect);
        // width = 0, height = 150 => width should become 300 (preserve ratio)
        smartResizeSelected(canvas, rect, 0, 150);
        expect(rect.getScaledWidth()).toBe(300);
        expect(rect.getScaledHeight()).toBe(150);
    });

    test('resizes a group based on scales', () => {
        const canvas = new fabric.Canvas();
        const rect1 = new fabric.Rect({ width: 50, height: 50 });
        const rect2 = new fabric.Rect({ width: 50, height: 50, left: 60 });
        const group: any = new fabric.Group([rect1, rect2]);
        canvas.add(group);

        // Original size: ~110x50 (50 + 60)
        // New size: 220x0 => height should be around 100
        smartResizeSelected(canvas, group, 220, 0);

        expect(group.getScaledWidth()).toBeCloseTo(220);
        // Allow for minor Fabric rounding/bounding-box offsets in Groups
        expect(Math.abs(group.getScaledHeight() - 100)).toBeLessThan(5);
    });
});
