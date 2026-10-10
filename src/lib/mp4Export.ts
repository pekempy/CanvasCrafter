import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import * as fabric from 'fabric';
import { FabricGif } from './gifPlayer';

let ffmpegInstance: FFmpeg | null = null;

async function initFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance && ffmpegInstance.loaded) {
        return ffmpegInstance;
    }

    const ffmpeg = new FFmpeg();

    // Load ffmpeg from CDN using toBlobURL
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
}

export async function exportCanvasAsMp4(
    canvas: fabric.Canvas,
    gifObjects: FabricGif[],
    onProgress?: (pct: number) => void
): Promise<Blob> {
    const ffmpeg = await initFFmpeg();

    try {
        // Render each frame and collect as PNG
        const frameDataUrls: string[] = [];
        const maxFrames = 200; // Limit total frames
        let frameIndex = 0;

        // Calculate total duration and frame count
        let maxDuration = 0;
        gifObjects.forEach((gif) => {
            const totalDelay = gif.delays.reduce((a, b) => a + b, 0);
            if (totalDelay > maxDuration) {
                maxDuration = totalDelay;
            }
        });

        // Frame interval: 50ms = 20fps
        const frameInterval = 50;
        const frameCount = Math.min(Math.ceil(maxDuration / frameInterval), maxFrames);

        // Render each time step
        for (let i = 0; i < frameCount; i++) {
            const timeMs = i * frameInterval;

            // Update each GIF to the correct frame for this time
            gifObjects.forEach((gif) => {
                let elapsed = 0;
                let frameIdx = 0;

                for (let j = 0; j < gif.frames.length; j++) {
                    elapsed += gif.delays[j];
                    if (timeMs < elapsed) {
                        frameIdx = j;
                        break;
                    }
                }

                gif.currentFrameIndex = frameIdx;
                const frameCanvas = gif.frames[frameIdx];
                const dataUrl = frameCanvas.toDataURL('image/png');

                // Swap the fabric image to current frame
                fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((newImg) => {
                    newImg.set({
                        left: gif.left,
                        top: gif.top,
                        scaleX: gif.scaleX,
                        scaleY: gif.scaleY,
                        angle: gif.angle,
                        flipX: gif.flipX,
                        flipY: gif.flipY,
                        originX: gif.originX,
                        originY: gif.originY,
                    });

                    const parent = gif.canvas;
                    if (parent) {
                        const index = parent.getObjects().indexOf(gif);
                        if (index >= 0) {
                            parent.remove(gif);
                            parent.insertAt(index, newImg);
                        }
                    }
                });
            });

            // Render canvas to PNG
            canvas.renderAll();
            const pngDataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
            frameDataUrls.push(pngDataUrl);

            if (onProgress) {
                onProgress((i / frameCount) * 50); // First 50% is rendering
            }
        }

        // Write frames to FFmpeg virtual FS
        for (let i = 0; i < frameDataUrls.length; i++) {
            const dataUrl = frameDataUrls[i];
            const base64 = dataUrl.split(',')[1];
            const data = Buffer.from(base64, 'base64');
            const filename = `frame${String(i).padStart(4, '0')}.png`;
            await ffmpeg.writeFile(filename, data);

            if (onProgress) {
                onProgress(50 + (i / frameDataUrls.length) * 25);
            }
        }

        // Run FFmpeg to create MP4
        await ffmpeg.exec([
            '-framerate', '20',
            '-i', 'frame%04d.png',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'fast',
            'output.mp4'
        ]);

        if (onProgress) {
            onProgress(85);
        }

        // Read output
        const data = await ffmpeg.readFile('output.mp4');
        const blob = new Blob([data as unknown as ArrayBuffer], { type: 'video/mp4' });

        // Cleanup
        await ffmpeg.deleteFile('output.mp4');
        frameDataUrls.forEach((_, i) => {
            const filename = `frame${String(i).padStart(4, '0')}.png`;
            ffmpeg.deleteFile(filename);
        });

        if (onProgress) {
            onProgress(100);
        }

        return blob;
    } catch (err) {
        console.error('MP4 export failed:', err);
        throw err;
    }
}
