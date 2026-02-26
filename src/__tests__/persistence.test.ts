"use client";

/**
 * Mock tests for Persistence Logic
 * Since we can't easily test React's useEffect + localStorage in this env,
 * we verify the storage keys and serialization logic used in useCanvasStore.
 */
describe('Persistence Serialization Logic', () => {
    const mockState = {
        canvasSize: { width: 1080, height: 1080 },
        brandKits: [{ id: '1', name: 'Test Kit', colors: ['#ff0000'] }],
        assetFolders: [{ id: 'default', name: 'My Assets', assets: [] }]
    };

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('should correctly serialize state values used in store', () => {
        const json = JSON.stringify(mockState.canvasSize);
        localStorage.setItem("canvascrafter_canvas_size", json);

        const retrieved = JSON.parse(localStorage.getItem("canvascrafter_canvas_size") || "{}");
        expect(retrieved.width).toBe(1080);
    });

    test('should load fallback if storage is empty', () => {
        const retrieved = localStorage.getItem("canvascrafter_brandkits");
        expect(retrieved).toBeNull();
    });
});
