import { useEffect, useRef } from 'react';
import { useEngineStore } from './store';
import { Renderer } from './Renderer';
import { useDrawingStore } from '@/features/drawing/store';
import { hitTestStroke } from '@/features/drawing/utils';

export const Engine = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<HTMLCanvasElement>(null);
  const selectionRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<Renderer | null>(null);
  const { camera, gridType, setCamera, screenToCanvas } = useEngineStore();

  const {
    strokes, currentStroke, selectedStrokeIds, activeTool, color, size,
    startStroke, continueStroke, endStroke, selectStroke, clearSelection
  } = useDrawingStore();

  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new Renderer();
    }
    const renderer = rendererRef.current;

    if (bgRef.current) renderer.registerLayer('background', bgRef.current);
    if (strokeRef.current) renderer.registerLayer('stroke', strokeRef.current);
    if (selectionRef.current) renderer.registerLayer('selection', selectionRef.current);
    if (previewRef.current) renderer.registerLayer('preview', previewRef.current);
    if (cursorRef.current) renderer.registerLayer('cursor', cursorRef.current);
    if (uiRef.current) renderer.registerLayer('ui', uiRef.current);

    const handleResize = () => {
      if (containerRef.current) {
        renderer.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    renderer.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.stop();
    };
  }, []);

  // Sync state to renderer
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.camera = camera;
      rendererRef.current.gridType = gridType;
      rendererRef.current.strokes = strokes;
      rendererRef.current.currentStroke = currentStroke;
      rendererRef.current.selectedStrokeIds = selectedStrokeIds;
      rendererRef.current.requestRender();
    }
  }, [camera, gridType, strokes, currentStroke, selectedStrokeIds]);

  // Handle pointer and wheel events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPanning = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // Zoom
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, camera.zoom * zoomDelta));

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const canvasX = (mouseX - camera.x) / camera.zoom;
        const canvasY = (mouseY - camera.y) / camera.zoom;

        const newX = mouseX - canvasX * newZoom;
        const newY = mouseY - canvasY * newZoom;

        setCamera({ zoom: newZoom, x: newX, y: newY });
      } else {
        // Pan
        setCamera({
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY
        });
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+Left to pan
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = 'grabbing';
      } else if (e.button === 0) {
        const { x: cx, y: cy } = screenToCanvas(x, y);
        const pressure = e.pressure !== 0.5 ? e.pressure : 0.5; // Basic pressure support fallback

        if (activeTool === 'select') {
          // Hit detection
          const hit = [...strokes].reverse().find(s => hitTestStroke(cx, cy, s));
          if (hit) {
            selectStroke(hit.id, e.ctrlKey || e.metaKey);
          } else if (!e.ctrlKey && !e.metaKey) {
            clearSelection();
          }
        } else {
          isDrawing = true;
          startStroke([cx, cy, pressure]);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (rendererRef.current && activeTool !== 'select') {
        rendererRef.current.cursorPreview = { x, y, size, color };
        rendererRef.current.requestRender();
      } else if (rendererRef.current) {
        rendererRef.current.cursorPreview = null;
      }

      if (isPanning) {
        setCamera({
          x: camera.x + (e.clientX - lastX),
          y: camera.y + (e.clientY - lastY)
        });
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (isDrawing) {
        const { x: cx, y: cy } = screenToCanvas(x, y);
        const pressure = e.pressure !== 0.5 ? e.pressure : 0.5;
        continueStroke([cx, cy, pressure]);
      }
    };

    const handlePointerUp = () => {
      if (isPanning) {
        isPanning = false;
        container.style.cursor = 'default';
      } else if (isDrawing) {
        isDrawing = false;
        endStroke();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [camera, setCamera, activeTool, color, size, strokes, screenToCanvas, startStroke, continueStroke, endStroke, selectStroke, clearSelection]);

  const layerClasses = "absolute top-0 left-0 w-full h-full pointer-events-none";

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-white touch-none"
    >
      <canvas ref={bgRef} className={layerClasses} />
      <canvas ref={strokeRef} className={layerClasses} />
      <canvas ref={selectionRef} className={layerClasses} />
      <canvas ref={previewRef} className={layerClasses} />
      <canvas ref={cursorRef} className={layerClasses} />
      <canvas ref={uiRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
};
