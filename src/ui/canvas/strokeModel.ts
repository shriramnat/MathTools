/**
 * Ink data model - per-problem card, not persisted in v1.
 */

export interface StrokePoint {
  x: number;
  y: number;
  t: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  color: string;
  size: number;
  mode: 'pen' | 'eraser';
  points: StrokePoint[];
}

export interface InkState {
  strokes: Stroke[];
}

let strokeCounter = 0;

export function createStroke(
  color: string,
  size: number,
  mode: 'pen' | 'eraser',
): Stroke {
  return {
    id: `stroke-${Date.now()}-${++strokeCounter}`,
    color,
    size,
    mode,
    points: [],
  };
}

export function addPoint(stroke: Stroke, point: StrokePoint): void {
  stroke.points.push(point);
}

export function createEmptyInkState(): InkState {
  return { strokes: [] };
}