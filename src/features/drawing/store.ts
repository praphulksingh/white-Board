import { create } from 'zustand';
import { Point, Stroke, ToolType } from './types';
import { calculateBoundingBox } from './utils';

export interface DrawingState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  selectedStrokeIds: string[];
  activeTool: ToolType;
  color: string;
  size: number;

  history: Stroke[][];
  historyIndex: number;

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;

  startStroke: (point: Point) => void;
  continueStroke: (point: Point) => void;
  endStroke: () => void;

  selectStroke: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;

  undo: () => void;
  redo: () => void;
}

const pushHistory = (state: DrawingState, newStrokes: Stroke[]): Partial<DrawingState> => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newStrokes);
  return { strokes: newStrokes, history: newHistory, historyIndex: newHistory.length - 1 };
};

export const useDrawingStore = create<DrawingState>((set, get) => ({
  strokes: [],
  currentStroke: null,
  selectedStrokeIds: [],
  activeTool: 'pen',
  color: '#000000',
  size: 5,
  history: [[]],
  historyIndex: 0,

  setTool: (tool) => set({ activeTool: tool, selectedStrokeIds: tool === 'select' ? get().selectedStrokeIds : [] }),
  setColor: (color) => set({ color }),
  setSize: (size) => set({ size }),

  startStroke: (point) => {
    const { activeTool, color, size } = get();
    if (activeTool === 'select') return;
    set({
      currentStroke: {
        id: Math.random().toString(36).substring(2, 9),
        points: [point],
        tool: activeTool,
        color,
        size,
        bounds: null
      }
    });
  },

  continueStroke: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;

    // Basic point simplification (compression)
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    const dx = point[0] - lastPoint[0];
    const dy = point[1] - lastPoint[1];
    if (dx * dx + dy * dy < 2) return; // Ignore very small movements

    set({
      currentStroke: { ...currentStroke, points: [...currentStroke.points, point] }
    });
  },

  endStroke: () => {
    const { currentStroke, strokes } = get();
    if (!currentStroke) return;
    if (currentStroke.points.length < 2) {
      set({ currentStroke: null });
      return;
    }

    const finishedStroke = {
      ...currentStroke,
      bounds: calculateBoundingBox(currentStroke.points)
    };

    set((state) => ({
      currentStroke: null,
      ...pushHistory(state, [...strokes, finishedStroke])
    }));
  },

  selectStroke: (id, multi = false) => set((state) => {
    if (multi) {
      return { selectedStrokeIds: state.selectedStrokeIds.includes(id)
        ? state.selectedStrokeIds.filter(sid => sid !== id)
        : [...state.selectedStrokeIds, id] };
    }
    return { selectedStrokeIds: [id] };
  }),

  clearSelection: () => set({ selectedStrokeIds: [] }),

  deleteSelection: () => set((state) => {
    if (state.selectedStrokeIds.length === 0) return state;
    const newStrokes = state.strokes.filter(s => !state.selectedStrokeIds.includes(s.id));
    return { selectedStrokeIds: [], ...pushHistory(state, newStrokes) };
  }),

  duplicateSelection: () => set((state) => {
    if (state.selectedStrokeIds.length === 0) return state;
    const toDuplicate = state.strokes.filter(s => state.selectedStrokeIds.includes(s.id));
    const offset = 20;
    const duplicates = toDuplicate.map(s => ({
      ...s,
      id: Math.random().toString(36).substring(2, 9),
      points: s.points.map(p => [p[0] + offset, p[1] + offset, p[2]] as Point),
      bounds: s.bounds ? {
        minX: s.bounds.minX + offset, minY: s.bounds.minY + offset,
        maxX: s.bounds.maxX + offset, maxY: s.bounds.maxY + offset
      } : null
    }));
    return {
      selectedStrokeIds: duplicates.map(d => d.id),
      ...pushHistory(state, [...state.strokes, ...duplicates])
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return { historyIndex: newIndex, strokes: state.history[newIndex], selectedStrokeIds: [] };
    }
    return state;
  }),

  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return { historyIndex: newIndex, strokes: state.history[newIndex], selectedStrokeIds: [] };
    }
    return state;
  }),
}));
