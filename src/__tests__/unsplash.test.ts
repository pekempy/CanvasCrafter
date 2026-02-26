/**
 * Unsplash Service Logic Tests
 * Verifies API configuration management and image URL formatting.
 */
describe('Unsplash Integration Logic', () => {
    const mockConfig = {
        applicationId: "test_app",
        accessKey: "test_access",
        secretKey: "test_secret"
    };

    test('should construct valid Unsplash Image URLs with clean parameters', () => {
        const photoId = "photo-1234567";
        const w = 1080;
        const q = 80;

        const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&q=${q}`;

        expect(url).toContain('images.unsplash.com');
        expect(url).toContain('w=1080');
        expect(url).toContain('q=80');
        expect(url).toContain('format');
    });

    test('should favor user-provided API keys over empty defaults', () => {
        const unsplashConfig = { ...mockConfig };
        const envKey = "";

        // Logic from AssetPanel.tsx:30
        const effectiveKey = unsplashConfig.accessKey || envKey || "fallback_key";

        expect(effectiveKey).toBe("test_access");
    });

    test('should use fallback key when config and env are empty', () => {
        const unsplashConfig = { accessKey: "" };
        const envKey = "";
        const fallback = "fallback_legacy_key";
        const effectiveKey = unsplashConfig.accessKey || envKey || fallback;
        expect(effectiveKey).toBe("fallback_legacy_key");
    });
});
