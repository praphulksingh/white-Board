export type Point = [number, number, number]; // x, y, pressure

export type ToolType = 'pen' | 'pencil' | 'marker' | 'brush' | 'highlighter' | 'calligraphy' | 'select';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  tool: ToolType;
  color: string;
  size: number;
  bounds: BoundingBox | null;
}
