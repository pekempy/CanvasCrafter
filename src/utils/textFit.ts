import * as fabric from "fabric";

/**
 * Adjusts font size or text wrapping according to text fit rule:
 * - 'none': normal fabric behavior
 * - 'shrink': if text width exceeds box width, decrease fontSize so it fits on 1 line (down to minFontSize)
 * - 'auto': adjusts fontSize up or down to fill the box width without overflowing
 * - 'wrap': enforces fixed width and wraps text onto multiple lines
 */
export type TextFitRule = "none" | "shrink" | "auto" | "wrap";

export function applyTextFit(obj: any, rule?: TextFitRule, targetWidth?: number) {
    if (!obj || !(obj instanceof fabric.IText || obj instanceof fabric.Textbox || obj.type === "i-text" || obj.type === "textbox")) {
        return;
    }

    const fitRule: TextFitRule = rule || obj.textFitRule || "none";
    if (fitRule === "none") return;

    const availableWidth = targetWidth || obj.width || 300;
    const baseFontSize = obj.baseFontSize || obj.fontSize || 40;
    if (!obj.baseFontSize) obj.baseFontSize = baseFontSize;

    const text = obj.text || "";
    if (!text.trim()) return;

    if (fitRule === "wrap") {
        obj.set({
            width: availableWidth,
            splitByGrapheme: false,
        });
        obj.setCoords();
        return;
    }

    // Measuring single-line text width accurately
    // Fabric Textbox/IText calculates line widths using getLineWidth or canvas measuring
    const minFontSize = 10;
    const maxFontSize = fitRule === "auto" ? baseFontSize * 2 : baseFontSize;

    // Binary search or iterative scaling to find best fontSize for availableWidth
    let low = minFontSize;
    let high = maxFontSize;
    let bestSize = low;

    // Use a temporary canvas 2D context for sub-millisecond font measuring
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontStyle = `${obj.fontStyle || "normal"} ${obj.fontWeight || "normal"} 100px ${obj.fontFamily || "sans-serif"}`;
    ctx.font = fontStyle;
    const measured100 = ctx.measureText(text).width;
    if (measured100 <= 0) return;

    // Width at font size F is approximately (F / 100) * measured100
    // We want (F / 100) * measured100 <= availableWidth
    const calculatedFont = Math.floor((availableWidth / measured100) * 100);

    let targetFont = baseFontSize;
    if (fitRule === "shrink") {
        targetFont = Math.min(baseFontSize, Math.max(minFontSize, calculatedFont));
    } else if (fitRule === "auto") {
        targetFont = Math.max(minFontSize, Math.min(maxFontSize, calculatedFont));
    }

    obj.set({
        fontSize: targetFont,
        width: Math.max(availableWidth, Math.ceil((targetFont / 100) * measured100)),
    });
    obj.setCoords();
}
