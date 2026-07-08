import { CameraState, GridType } from './store';

export interface RendererOptions {
  width: number;
  height: number;
}

export class Renderer {
  private canvases: Map<string, HTMLCanvasElement | OffscreenCanvas> = new Map();
  private contexts: Map<string, CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D> = new Map();
  private animationFrameId: number | null = null;
  private isDirty = true;
  private dirtyRects: { x: number, y: number, w: number, h: number }[] = [];

  public camera: CameraState = { x: 0, y: 0, zoom: 1 };
  public gridType: GridType = 'dot';
  public width = 0;
  public height = 0;

  constructor() {
    this.renderLoop = this.renderLoop.bind(this);
  }

  public registerLayer(name: string, canvas: HTMLCanvasElement) {
    this.canvases.set(name, canvas);
    const ctx = canvas.getContext('2d');
    if (ctx) this.contexts.set(name, ctx);
    this.resizeLayer(name);
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    for (const name of this.canvases.keys()) {
      this.resizeLayer(name);
    }
    this.requestRender();
  }

  private resizeLayer(name: string) {
    const canvas = this.canvases.get(name);
    if (canvas && canvas instanceof HTMLCanvasElement) {
      canvas.width = this.width;
      canvas.height = this.height;
    }
  }

  public start() {
    if (!this.animationFrameId) {
      this.renderLoop();
    }
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public requestRender(rect?: { x: number, y: number, w: number, h: number }) {
    this.isDirty = true;
    if (rect) {
      this.dirtyRects.push(rect);
    }
  }

  private applyCamera(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.setTransform(this.camera.zoom, 0, 0, this.camera.zoom, this.camera.x, this.camera.y);
  }

  private renderGrid(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.applyCamera(ctx);

    const gridSize = 20;
    const scaledGridSize = gridSize * this.camera.zoom;

    // Viewport bounds in canvas coordinates
    const startX = Math.floor(-this.camera.x / scaledGridSize) * gridSize;
    const startY = Math.floor(-this.camera.y / scaledGridSize) * gridSize;
    const endX = startX + (this.width / this.camera.zoom) + gridSize;
    const endY = startY + (this.height / this.camera.zoom) + gridSize;

    ctx.fillStyle = '#e5e7eb';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1 / this.camera.zoom;

    if (this.gridType === 'dot') {
      for (let x = startX; x < endX; x += gridSize) {
        for (let y = startY; y < endY; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1 / this.camera.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (this.gridType === 'grid') {
      ctx.beginPath();
      for (let x = startX; x < endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y < endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    } else if (this.gridType === 'isometric') {
      ctx.beginPath();
      // Simple isometric grid representation
      for (let x = startX - this.height; x < endX + this.height; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x + endY - startY, endY);
        ctx.moveTo(x, startY);
        ctx.lineTo(x - (endY - startY), endY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderLoop() {
    if (this.isDirty) {
      // Clear or clip based on dirty rects for optimization
      // (For now, doing a full clear on requested render)
      const bgCtx = this.contexts.get('background');
      if (bgCtx) {
        this.renderGrid(bgCtx);
      }

      // We would render other layers (Stroke, Selection, etc.) here
      // adhering to the dirty rectangles array for performance.

      this.isDirty = false;
      this.dirtyRects = [];
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }
}
