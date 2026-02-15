import type { Stroke, StrokePoint } from './strokeModel';

/**
 * Draw a single stroke segment (the most recent segment) for incremental rendering.
 * This avoids redrawing the entire canvas on every pointer move.
 */
export function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  fromIndex: number,
): void {
  if (stroke.points.length < 2 || fromIndex < 1) return;

  ctx.save();
  setupStrokeStyle(ctx, stroke);

  ctx.beginPath();
  const prev = stroke.points[fromIndex - 1];
  ctx.moveTo(prev.x, prev.y);

  for (let i = fromIndex; i < stroke.points.length; i++) {
    const point = stroke.points[i];
    ctx.lineTo(point.x, point.y);
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw the first point of a stroke (a dot).
 */
export function drawStrokeStart(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
): void {
  if (stroke.points.length === 0) return;

  ctx.save();

  if (stroke.mode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.fillStyle = stroke.color;
  }

  const point = stroke.points[0];
  ctx.beginPath();
  ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Redraw all strokes from scratch (used after undo or clear).
 */
export function redrawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (const stroke of strokes) {
    drawFullStroke(ctx, stroke);
  }
}

/**
 * Draw a complete stroke from all its points.
 */
function drawFullStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
): void {
  if (stroke.points.length === 0) return;

  ctx.save();
  setupStrokeStyle(ctx, stroke);

  if (stroke.points.length === 1) {
    // Single dot
    if (stroke.mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.fillStyle = stroke.color;
    }
    ctx.beginPath();
    ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Set up stroke styling on a canvas context.
 */
function setupStrokeStyle(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
): void {
  if (stroke.mode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }

  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/**
 * Extract the ink canvas content as a base64 PNG image.
 * Used for future LLM handwriting recognition.
 */
export function extractCanvasImage(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Extract a specific region of the canvas as ImageData.
 * Useful for extracting just the answer area.
 */
export function extractRegion(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
): ImageData | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return ctx.getImageData(x, y, width, height);
}