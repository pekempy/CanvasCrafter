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

    // In Fabric, text objects can have scaleX !== 1 (e.g. scaleX = 2.97, width = 320)
    // The rendered width on canvas is obj.width * obj.scaleX
    const scaleX = typeof obj.scaleX === "number" && obj.scaleX > 0 ? obj.scaleX : 1;
    
    // Normalised box width that unscaled text must fit into
    let boxWidth = (targetWidth || obj.width || 300);

    const baseFontSize = obj.baseFontSize || obj.fontSize || 40;
    if (!obj.baseFontSize) obj.baseFontSize = baseFontSize;

    const text = obj.text || "";
    if (!text.trim()) return;

    if (fitRule === "wrap") {
        obj.set({
            width: boxWidth,
            splitByGrapheme: false,
        });
        obj.setCoords();
        return;
    }

    // Fabric Textbox wraps lines whenever any line width exceeds `obj.width`.
    // To prevent multi-word strings like "De la bertouche" from wrapping:
    // 1. Measure text on single line
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontStyle = `${obj.fontStyle || "normal"} ${obj.fontWeight || "normal"} 100px ${obj.fontFamily || "sans-serif"}`;
    ctx.font = fontStyle;
    const measured100 = ctx.measureText(text).width;
    if (measured100 <= 0) return;

    const minFontSize = 8;
    const maxFontSize = fitRule === "auto" ? baseFontSize * 2 : baseFontSize;

    // Width of text at font size F is (F / 100) * measured100
    // We require: (F / 100) * measured100 <= boxWidth
    const calculatedFont = Math.floor((boxWidth / measured100) * 100);

    let targetFont = baseFontSize;
    if (fitRule === "shrink") {
        targetFont = Math.min(baseFontSize, Math.max(minFontSize, calculatedFont));
    } else if (fitRule === "auto") {
        targetFont = Math.max(minFontSize, Math.min(maxFontSize, calculatedFont));
    }

    const actualLineWidth = (targetFont / 100) * measured100;

    // CRITICAL: obj.width on a Fabric Textbox MUST be >= actualLineWidth,
    // otherwise Fabric's wrap algorithm breaks words across multiple lines.
    const finalBoxWidth = Math.max(boxWidth, Math.ceil(actualLineWidth) + 4);

    obj.set({
        fontSize: targetFont,
        width: finalBoxWidth,
        splitByGrapheme: false,
    });
    obj.setCoords();
}
