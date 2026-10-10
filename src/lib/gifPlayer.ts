import * as fabric from 'fabric';
import { parseGIF, decompressFrames } from 'gifuct-js';

export interface GifFrame {
    imageData: ImageData;
    delay: number; // ms
}

export async function parseGifFrames(url: string): Promise<GifFrame[]> {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const gif = parseGIF(arrayBuffer);
        const frames = decompressFrames(gif, true); // true = build full frame patches with imageData

        return frames.map((frame: any) => {
            // decompressFrames with true returns frames with imageData already built
            const imageData = frame.patch as ImageData;
            const delay = Math.max(50, (frame.delay || 10) * 10); // centiseconds to ms, min 50ms
            
            return {
                imageData,
                delay
            };
        });
    } catch (err) {
        console.error('Failed to parse GIF:', err);
        throw err;
    }
}

export class FabricGif extends fabric.Image {
    static type = 'gif';
    frames: HTMLCanvasElement[] = [];
    delays: number[] = [];
    currentFrameIndex: number = 0;
    isAnimated: boolean = true;
    gifUrl: string = '';
    private _rafId?: number;
    private _lastFrameTime: number = 0;
    private _isPlaying: boolean = false;

    constructor(element: HTMLCanvasElement | HTMLImageElement, options?: any) {
        super(element as unknown as string, options);
        (this as any).type = 'gif';
    }

    static async fromFrames(
        frames: GifFrame[],
        gifUrl: string,
        options?: any
    ): Promise<FabricGif> {
        // Build HTMLCanvasElement for each frame
        const canvases: HTMLCanvasElement[] = [];
        const delays: number[] = [];

        frames.forEach((frame) => {
            const canvas = document.createElement('canvas');
            canvas.width = frame.imageData.width;
            canvas.height = frame.imageData.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(frame.imageData, 0, 0);
            }
            canvases.push(canvas);
            delays.push(frame.delay);
        });

        // Create FabricGif from first frame
        const firstCanvas = canvases[0];
        const fabricGif = new FabricGif(firstCanvas, options);
        fabricGif.frames = canvases;
        fabricGif.delays = delays;
        fabricGif.gifUrl = gifUrl;
        fabricGif.currentFrameIndex = 0;

        return fabricGif;
    }

    play(canvas: fabric.Canvas): void {
        if (this._isPlaying) return;
        this._isPlaying = true;
        this._lastFrameTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - this._lastFrameTime;

            if (elapsed >= this.delays[this.currentFrameIndex]) {
                this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
                const frameCanvas = this.frames[this.currentFrameIndex];
                
                // Update the fabric Image element to show current frame
                const dataUrl = frameCanvas.toDataURL('image/png');
                fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((newImg) => {
                    newImg.set({
                        left: this.left,
                        top: this.top,
                        scaleX: this.scaleX,
                        scaleY: this.scaleY,
                        angle: this.angle,
                        flipX: this.flipX,
                        flipY: this.flipY,
                        originX: this.originX,
                        originY: this.originY,
                    });
                    
                    const parent = this.canvas;
                    if (parent && this === canvas.getActiveObject()) {
                        const index = parent.getObjects().indexOf(this);
                        if (index >= 0) {
                            parent.remove(this);
                            (newImg as any).type = 'gif';
                            (newImg as any).gifUrl = this.gifUrl;
                            parent.insertAt(index, newImg);
                            canvas.setActiveObject(newImg);
                        }
                    }
                });

                this._lastFrameTime = now;
            }

            if (this._isPlaying) {
                this._rafId = requestAnimationFrame(animate);
            }
        };

        this._rafId = requestAnimationFrame(animate);
    }

    stop(): void {
        this._isPlaying = false;
        if (this._rafId !== undefined) {
            cancelAnimationFrame(this._rafId);
            this._rafId = undefined;
        }
    }

    toObject(propertiesToInclude?: any): any {
        return {
            ...super.toObject(propertiesToInclude),
            gifUrl: this.gifUrl,
            type: 'gif'
        };
    }
}
