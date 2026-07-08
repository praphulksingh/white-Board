import { create } from 'zustand';

export interface BoardState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };

  toggleOpen: () => void;
  setOpen: (value: boolean) => void;
  toggleMinimize: () => void;
  toggleMaximize: () => void;
  toggleFullscreen: () => void;
  setPosition: (x: number, y: number) => void;
  setSize: (width: number, height: number) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  isOpen: false,
  isMinimized: false,
  isMaximized: false,
  isFullscreen: false,
  position: { x: 50, y: 50 },
  size: { width: 800, height: 600 },

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (value) => set({ isOpen: value }),
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized, isMaximized: false, isFullscreen: false })),
  toggleMaximize: () => set((state) => ({ isMaximized: !state.isMaximized, isMinimized: false, isFullscreen: false })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen, isMinimized: false, isMaximized: false })),
  setPosition: (x, y) => set({ position: { x, y } }),
  setSize: (width, height) => set({ size: { width, height } }),
}));
