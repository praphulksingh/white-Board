import { useBoardStore } from '@/shared/store/boardStore';
import { useDrawingStore } from '@/features/drawing/store';
import {
  Pen, Pencil, Highlighter, Brush, Eraser,
  MousePointer2, Undo2, Redo2, Copy, Trash2
} from 'lucide-react';
import { ToolType } from '@/features/drawing/types';

export const Toolbar = () => {
  const { isMinimized, isFullscreen } = useBoardStore();
  const {
    activeTool, setTool, undo, redo,
    selectedStrokeIds, duplicateSelection, deleteSelection
  } = useDrawingStore();

  if (isMinimized || isFullscreen) return null;

  const tools: { id: ToolType; icon: React.ReactNode; tooltip: string }[] = [
    { id: 'select', icon: <MousePointer2 size={20} />, tooltip: 'Select' },
    { id: 'pen', icon: <Pen size={20} />, tooltip: 'Pen' },
    { id: 'pencil', icon: <Pencil size={20} />, tooltip: 'Pencil' },
    { id: 'marker', icon: <Highlighter size={20} />, tooltip: 'Marker' }, // using highlighter icon for marker
    { id: 'brush', icon: <Brush size={20} />, tooltip: 'Brush' },
    { id: 'calligraphy', icon: <Pen size={20} />, tooltip: 'Calligraphy' }, // reuse pen icon for now
    { id: 'highlighter', icon: <Eraser size={20} />, tooltip: 'Highlighter' }, // reuse eraser icon for now visually
  ];

  const hasSelection = selectedStrokeIds.length > 0;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col p-2 space-y-1 pointer-events-auto">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id)}
          className={`p-2 rounded-lg transition ${activeTool === tool.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
          title={tool.tooltip}
        >
          {tool.icon}
        </button>
      ))}

      <div className="w-full h-px bg-gray-200 my-2"></div>

      <button onClick={undo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition" title="Undo">
        <Undo2 size={20} />
      </button>
      <button onClick={redo} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition" title="Redo">
        <Redo2 size={20} />
      </button>

      {hasSelection && (
        <>
          <div className="w-full h-px bg-gray-200 my-2"></div>
          <button onClick={duplicateSelection} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition" title="Duplicate">
            <Copy size={20} />
          </button>
          <button onClick={deleteSelection} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition" title="Delete">
            <Trash2 size={20} />
          </button>
        </>
      )}
    </div>
  );
};
