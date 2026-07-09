import { CameraState, GridType } from './store';
import { Stroke } from '@/features/drawing/types';
import { getSvgPathFromStroke } from '@/features/drawing/utils';

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

  public strokes: Stroke[] = [];
  public currentStroke: Stroke | null = null;
  public selectedStrokeIds: string[] = [];
  public cursorPreview: { x: number, y: number, size: number, color: string } | null = null;

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

  private renderStroke(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, stroke: Stroke) {
    const path = getSvgPathFromStroke(stroke);
    if (!path) return;
    const p = new Path2D(path);
    ctx.fillStyle = stroke.tool === 'highlighter' ? `${stroke.color}80` : stroke.color;
    ctx.fill(p);
  }

  private renderStrokesLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.applyCamera(ctx);

    // In a highly optimized engine, we'd only redraw strokes inside dirty rectangles.
    // For now, redraw all committed strokes.
    for (const stroke of this.strokes) {
      this.renderStroke(ctx, stroke);
    }
    ctx.restore();
  }

  private renderPreviewLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.applyCamera(ctx);

    if (this.currentStroke) {
      this.renderStroke(ctx, this.currentStroke);
    }
    ctx.restore();
  }

  private renderSelectionLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    this.applyCamera(ctx);

    const selectedStrokes = this.strokes.filter(s => this.selectedStrokeIds.includes(s.id));
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / this.camera.zoom;

    for (const stroke of selectedStrokes) {
      if (stroke.bounds) {
        ctx.strokeRect(
          stroke.bounds.minX - 2,
          stroke.bounds.minY - 2,
          stroke.bounds.maxX - stroke.bounds.minX + 4,
          stroke.bounds.maxY - stroke.bounds.minY + 4
        );
      }
    }
    ctx.restore();
  }

  private renderCursorLayer(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.cursorPreview) {
      const { x, y, size, color } = this.cursorPreview;
      ctx.beginPath();
      // Render cursor preview at exact screen position (not camera scaled)
      ctx.arc(x, y, (size * this.camera.zoom) / 2, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderLoop() {
    if (this.isDirty) {
      const bgCtx = this.contexts.get('background');
      if (bgCtx) this.renderGrid(bgCtx);

      const strokeCtx = this.contexts.get('stroke');
      if (strokeCtx) this.renderStrokesLayer(strokeCtx);

      const previewCtx = this.contexts.get('preview');
      if (previewCtx) this.renderPreviewLayer(previewCtx);

      const selectionCtx = this.contexts.get('selection');
      if (selectionCtx) this.renderSelectionLayer(selectionCtx);

      const cursorCtx = this.contexts.get('cursor');
      if (cursorCtx) this.renderCursorLayer(cursorCtx);

      this.isDirty = false;
      this.dirtyRects = [];
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }
}
