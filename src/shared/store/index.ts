import { create } from 'zustand';
import { AppState } from '@/shared/types';

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  setInitialized: (value: boolean) => set({ isInitialized: value }),
}));
