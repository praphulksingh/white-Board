import { useEffect, useRef } from 'react';
import { useEngineStore } from './store';
import { Renderer } from './Renderer';

export const Engine = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<HTMLCanvasElement>(null);
  const selectionRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<Renderer | null>(null);
  const { camera, gridType, setCamera } = useEngineStore();

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
      rendererRef.current.requestRender();
    }
  }, [camera, gridType]);

  // Handle pan and zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // Zoom
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, camera.zoom * zoomDelta));

        // Zoom towards mouse
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

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Space+Left
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setCamera({
          x: camera.x + (e.clientX - lastX),
          y: camera.y + (e.clientY - lastY)
        });
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isPanning = false;
      container.style.cursor = 'default';
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [camera, setCamera]);

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
      {/* UI Layer needs pointer events for potential interactive canvas elements if any, but usually we handle events on container */}
      <canvas ref={uiRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
};
