import WebFont from "webfontloader";

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
