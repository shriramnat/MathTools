import type { Stroke, StrokePoint } from './strokeModel';
import { createStroke, addPoint } from './strokeModel';
import { drawStrokeSegment, drawStrokeStart } from './inkRenderer';

export interface PointerControllerOptions {
  canvas: HTMLCanvasElement;
  getColor: () => string;
  getSize: () => number;
  getMode: () => 'pen' | 'eraser';
  onStrokeComplete: (stroke: Stroke) => void;
}

/**
 * Manages pointer input on the ink canvas.
 * Handles pen, touch, and mouse input with palm rejection.
 */
export class PointerController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: PointerControllerOptions;

  private activeStroke: Stroke | null = null;
  private lastPointIndex: number = 0;
  private isPenActive: boolean = false;
  private activePointerId: number | null = null;

  constructor(options: PointerControllerOptions) {
    this.canvas = options.canvas;
    this.ctx = options.canvas.getContext('2d')!;
    this.options = options;

    this.bindEvents();
  }

  private bindEvents(): void {
    const canvas = this.canvas;

    // Prevent default touch behaviors (scrolling, zooming)
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerUp);
  }

  destroy(): void {
    const canvas = this.canvas;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
    canvas.removeEventListener('pointerleave', this.onPointerUp);
  }

  private getCanvasPoint(e: PointerEvent): StrokePoint {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      t: Date.now(),
      pressure: e.pressure > 0 ? e.pressure : undefined,
    };
  }

  private onPointerDown = (e: PointerEvent): void => {
    // Palm rejection: if a pen is active, ignore touch input
    if (this.isPenActive && e.pointerType === 'touch') {
      return;
    }

    // If we already have an active stroke from a different pointer, ignore
    if (this.activeStroke !== null && this.activePointerId !== e.pointerId) {
      return;
    }

    if (e.pointerType === 'pen') {
      this.isPenActive = true;
    }

    this.activePointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);

    const mode = this.options.getMode();
    const color = this.options.getColor();
    const size = this.options.getSize();

    this.activeStroke = createStroke(color, size, mode);
    const point = this.getCanvasPoint(e);
    addPoint(this.activeStroke, point);
    this.lastPointIndex = 0;

    // Draw the initial dot
    drawStrokeStart(this.ctx, this.activeStroke);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.activeStroke || this.activePointerId !== e.pointerId) return;

    // Palm rejection
    if (this.isPenActive && e.pointerType === 'touch') return;

    const point = this.getCanvasPoint(e);
    addPoint(this.activeStroke, point);

    // Incremental rendering: only draw the new segment
    const newIndex = this.activeStroke.points.length - 1;
    drawStrokeSegment(this.ctx, this.activeStroke, this.lastPointIndex + 1);
    this.lastPointIndex = newIndex;
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.activeStroke || this.activePointerId !== e.pointerId) return;

    if (e.pointerType === 'pen') {
      this.isPenActive = false;
    }

    // Complete the stroke
    this.options.onStrokeComplete(this.activeStroke);
    this.activeStroke = null;
    this.activePointerId = null;
    this.lastPointIndex = 0;
  };
}