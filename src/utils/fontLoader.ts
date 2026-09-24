import WebFont from "webfontloader";

/**
 * Registers a custom (uploaded) font's data URL as a usable @font-face in the
 * current document. Every place that learns about a custom font — whether from
 * this machine's local IndexedDB cache, a fresh upload, or the list fetched
 * from the server on load — must call this, otherwise the font shows up by
 * name in pickers/brand kits but the browser has nothing to actually render
 * text with, which is exactly what breaks custom fonts on a machine that
 * never uploaded them itself.
 */
export async function registerFontFace(name: string, dataUrl: string): Promise<void> {
    try {
        const fontFace = new FontFace(name, `url(${dataUrl})`);
        const loaded = await fontFace.load();
        document.fonts.add(loaded);
    } catch (e) {
        console.error(`Failed to register custom font "${name}"`, e);
    }
}

export async function preloadFontsFromJSON(json: any): Promise<void> {
    const fonts = new Set<string>();

    function extractFonts(obj: any) {
        if (obj.fontFamily) {
            fonts.add(obj.fontFamily);
        }
        if (obj.objects) {
            obj.objects.forEach(extractFonts);
        }
    }

    if (json.objects) {
        json.objects.forEach(extractFonts);
    }

    if (json.backgroundImage && json.backgroundImage.objects) {
        json.backgroundImage.objects.forEach(extractFonts);
    }

    const fontList = Array.from(fonts).filter(f => f && f !== 'Times New Roman' && f !== 'Arial' && f !== 'serif' && f !== 'sans-serif');

    if (fontList.length === 0) return;

    return new Promise((resolve) => {
        WebFont.load({
            google: {
                families: fontList
            },
            active: () => resolve(),
            inactive: () => resolve(), // Resolve anyway to not block rendering indefinitely
            timeout: 2000
        });
    });
}
