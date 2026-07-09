import getStroke from 'perfect-freehand';
import { Point, Stroke, ToolType, BoundingBox } from './types';

// Helper to get perfect-freehand options based on tool type
const getStrokeOptions = (tool: ToolType, size: number) => {
  const options: Record<string, unknown> = { size, smoothing: 0.5, streamline: 0.5 };

  switch (tool) {
    case 'pen':
      options.thinning = 0.5;
      break;
    case 'pencil':
      options.thinning = 0;
      options.smoothing = 0.1;
      options.streamline = 0.1;
      break;
    case 'marker':
      options.thinning = -0.3;
      break;
    case 'brush':
      options.thinning = 0.7;
      options.smoothing = 0.8;
      break;
    case 'calligraphy':
      options.thinning = 0.8;
      options.smoothing = 0.2;
      options.start = { taper: 20 };
      options.end = { taper: 20 };
      break;
    case 'highlighter':
      options.thinning = 0;
      options.smoothing = 0;
      break;
    default:
      break;
  }
  return options;
};

// Generates SVG path data from stroke points using perfect-freehand
export const getSvgPathFromStroke = (stroke: Stroke): string => {
  if (stroke.points.length === 0) return '';
  const strokePoints = getStroke(stroke.points, getStrokeOptions(stroke.tool, stroke.size));
  if (strokePoints.length === 0) return '';

  const d = strokePoints.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...strokePoints[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
};

// Returns points forming the polygon of the stroke for rendering on Canvas
export const getPolygonFromStroke = (stroke: Stroke): [number, number][] => {
  if (stroke.points.length === 0) return [];
  return getStroke(stroke.points, getStrokeOptions(stroke.tool, stroke.size)) as [number, number][];
};

export const calculateBoundingBox = (points: Point[]): BoundingBox | null => {
  if (points.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
};

export const isPointInBoundingBox = (x: number, y: number, box: BoundingBox): boolean => {
  return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
};

// Ray-casting algorithm to determine if a point is inside a polygon
export const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  let isInside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

export const hitTestStroke = (x: number, y: number, stroke: Stroke): boolean => {
  if (!stroke.bounds || !isPointInBoundingBox(x, y, stroke.bounds)) return false;
  const polygon = getPolygonFromStroke(stroke);
  return isPointInPolygon([x, y], polygon);
};
