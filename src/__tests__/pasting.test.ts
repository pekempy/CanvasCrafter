/**
 * Clipboard Pasting Logic Tests
 * Verifies the edge cases of URL detection during paste events.
 */
describe('Clipboard Pasting Logic', () => {
    // Logic extracted from useCanvasStore.tsx:344
    const imageRegex = /\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i;

    test('should detect valid image URLs from various extensions', () => {
        expect("https://example.com/image.png".trim().match(imageRegex)).toBeTruthy();
        expect("https://example.com/photo.JPG".trim().match(imageRegex)).toBeTruthy();
        expect("https://example.com/anim.webp".trim().match(imageRegex)).toBeTruthy();
        expect("image.svg".trim().match(imageRegex)).toBeTruthy();
    });

    test('should handle URLs with query parameters correctly', () => {
        expect("https://images.unsplash.com/photo-123.webp?w=1080&q=80".trim().match(imageRegex)).toBeTruthy();
        expect("https://picsum.photos/200/300.jpg?random=1".trim().match(imageRegex)).toBeTruthy();
    });

    test('should reject non-image URLs or text', () => {
        expect("https://google.com".trim().match(imageRegex)).toBeFalsy();
        expect("This is just some text.png.txt".trim().match(imageRegex)).toBeFalsy();
        expect("https://example.com/image.png/edit".trim().match(imageRegex)).toBeFalsy();
    });

    test('should handle whitespace in clipboard text', () => {
        const input = "  https://example.com/logo.png  ";
        expect(input.trim().match(imageRegex)).toBeTruthy();
    });
});
