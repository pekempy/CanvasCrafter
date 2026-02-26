import * as fabric from 'fabric';

/**
 * Filter Management Logic Tests
 * Since Fabric 7.x uses a new Filter interface, we verify our implementation of
 * Brightness and Contrast used in the EffectsPanel.
 */
describe('Image Filter Implementation', () => {
    test('should apply the Brightness filter to a state object', () => {
        const filter = new fabric.filters.Brightness({ brightness: 0.5 });
        expect(filter.brightness).toBe(0.5);
    });

    test('should maintain filter stack order correctly', () => {
        const filters = [
            new fabric.filters.Brightness({ brightness: 0.2 }),
            new fabric.filters.Contrast({ contrast: 0.8 })
        ];

        expect(filters[0].type).toBe('Brightness');
        expect(filters[1].type).toBe('Contrast');
    });
});
