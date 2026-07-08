import { create } from 'zustand';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type GridType = 'none' | 'grid' | 'dot' | 'isometric';

export interface EngineState {
  camera: CameraState;
  gridType: GridType;
  setCamera: (camera: Partial<CameraState>) => void;
  setGridType: (type: GridType) => void;
  screenToCanvas: (screenX: number, screenY: number) => { x: number, y: number };
}

export const useEngineStore = create<EngineState>((set, get) => ({
  camera: { x: 0, y: 0, zoom: 1 },
  gridType: 'dot',
  setCamera: (update) => set((state) => ({ camera: { ...state.camera, ...update } })),
  setGridType: (type) => set({ gridType: type }),
  screenToCanvas: (screenX, screenY) => {
    const { camera } = get();
    return {
      x: (screenX - camera.x) / camera.zoom,
      y: (screenY - camera.y) / camera.zoom
    };
  }
}));
