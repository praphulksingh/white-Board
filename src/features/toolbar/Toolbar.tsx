
import { useBoardStore } from '@/shared/store/boardStore';
import { Settings, PenTool } from 'lucide-react';

export const Toolbar = () => {
  const { isMinimized, isFullscreen } = useBoardStore();

  if (isMinimized || isFullscreen) return null;

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col p-2 space-y-2 pointer-events-auto">
      <button className="p-3 hover:bg-gray-100 rounded-lg text-gray-700 transition" title="Tools">
        <PenTool size={20} />
      </button>
      <div className="w-full h-px bg-gray-100 my-1"></div>
      <button className="p-3 hover:bg-gray-100 rounded-lg text-gray-700 transition" title="Settings">
        <Settings size={20} />
      </button>
    </div>
  );
};
