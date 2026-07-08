import { useBoardStore } from '@/shared/store/boardStore';
import { Minus, Maximize2, X, Move } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Engine } from '@/features/engine/Engine';

export const Board = () => {
  const {
    isMinimized, isMaximized, isFullscreen, position, size,
    toggleMinimize, toggleMaximize, toggleOpen, setPosition, setSize
  } = useBoardStore();

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition(
          position.x + e.clientX - dragStart.current.x,
          position.y + e.clientY - dragStart.current.y
        );
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position.x, position.y, setPosition]);

  // Handle Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        setSize(
          Math.max(400, resizeStart.current.width + (e.clientX - resizeStart.current.x)),
          Math.max(300, resizeStart.current.height + (e.clientY - resizeStart.current.y))
        );
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSize]);

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-white shadow-xl rounded-lg p-2 pointer-events-auto cursor-pointer flex items-center border border-gray-200"
        onClick={toggleMinimize}
      >
        <span className="text-sm font-semibold mr-2 px-2">Board Minimized</span>
        <button onClick={(e) => { e.stopPropagation(); toggleOpen(); }} className="p-1 hover:bg-gray-100 rounded">
          <X size={16} />
        </button>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = isFullscreen ? {
    top: 0, left: 0, width: '100vw', height: '100vh',
    position: 'fixed'
  } : isMaximized ? {
    top: '10px', left: '10px', width: 'calc(100vw - 20px)', height: 'calc(100vh - 20px)',
    position: 'fixed'
  } : {
    top: `${position.y}px`, left: `${position.x}px`,
    width: `${size.width}px`, height: `${size.height}px`,
    position: 'fixed'
  };

  return (
    <div
      className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden pointer-events-auto absolute"
      style={containerStyle}
    >
      <div
        className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-50 select-none"
        onMouseDown={(e) => {
          if (!isMaximized && !isFullscreen) {
            setIsDragging(true);
            dragStart.current = { x: e.clientX, y: e.clientY };
          }
        }}
        style={{ cursor: (!isMaximized && !isFullscreen) ? 'move' : 'default' }}
      >
        <div className="flex items-center text-gray-500 space-x-2 px-2">
          {!isMaximized && !isFullscreen && <Move size={16} />}
          <span className="font-semibold text-sm">Board</span>
        </div>
        <div className="flex space-x-1">
          <button onClick={toggleMinimize} className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
            <Minus size={16} />
          </button>
          <button onClick={toggleMaximize} className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
            <Maximize2 size={16} />
          </button>
          <button onClick={toggleOpen} className="p-1.5 hover:bg-red-500 hover:text-white rounded text-gray-500">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 90% Engine, 10% bottom area reserved (for future toolbar/ui if placed inside, though toolbar is floating in this architecture based on previous steps. We will allocate the space visually) */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
        <div className="h-[90%] w-full relative">
           <Engine />
        </div>
        <div className="h-[10%] w-full bg-gray-100 border-t border-gray-200 flex items-center justify-center text-gray-400 text-sm">
           Toolbar Area
        </div>
      </div>

      {!isMaximized && !isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            setIsResizing(true);
            resizeStart.current = { width: size.width, height: size.height, x: e.clientX, y: e.clientY };
            e.stopPropagation();
          }}
        />
      )}
    </div>
  );
};
