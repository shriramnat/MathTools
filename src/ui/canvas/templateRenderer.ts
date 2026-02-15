import type { Problem } from '../../app/store/types';
import { operatorSymbol, computeAnswer } from '../../domain/generation/problemTypes';

/** Layout metrics for the problem template */
export interface TemplateLayout {
  /** Total canvas width */
  canvasWidth: number;
  /** Total canvas height */
  canvasHeight: number;
  /** Font size in px */
  fontSize: number;
  /** Character width (monospace) */
  charWidth: number;
  /** Line height */
  lineHeight: number;
  /** X offset where numbers start (right-aligned) */
  numberRightX: number;
  /** X offset for the operator */
  operatorX: number;
  /** Y offset for the first number (a) */
  aY: number;
  /** Y offset for the second number (b) */
  bY: number;
  /** Y offset for the separator line */
  separatorY: number;
  /** Y offset for the answer area */
  answerY: number;
  /** Separator line start X */
  separatorStartX: number;
  /** Separator line end X */
  separatorEndX: number;
  /** Max digits in the problem (for alignment) */
  maxDigitWidth: number;
  /** Spacing between digits */
  digitSpacing: number;
}

const FONT_FAMILY = '"Courier New", Courier, monospace';
const DIGIT_SPACING_FACTOR = 2.0; // Spacing between digits
const SEPARATOR_EXTENSION = 4; // Extra chars on each side

/** Fixed font size used for all problems regardless of digit count */
const FIXED_FONT_SIZE = 36;

/**
 * Compute the ideal canvas dimensions based on the maxDigits config setting,
 * so all problems rendered at the same difficulty share uniform canvas sizes
 * and identical font sizes.
 *
 * Canvas size is fixed based on maxDigits=6 to ensure consistent visual sizing
 * regardless of actual digit count. For multiplication, results are constrained
 * to 7 digits maximum.
 */
export function computeCanvasSize(): { width: number; height: number } {
  // Always use 6 as the basis for canvas size to keep dimensions constant
  const maxNumberLen = 7; // Maximum answer length (7 digits for multiplication)

  const charWidth = FIXED_FONT_SIZE * 0.6;
  const lineHeight = FIXED_FONT_SIZE * 1.5;
  const digitSpacing = charWidth * DIGIT_SPACING_FACTOR;

  // Width: operator (2 chars) + digits with spacing + separator extension + padding
  const numberBlockWidth = maxNumberLen * digitSpacing;
  const operatorWidth = 2 * charWidth;
  const totalBlockWidth = operatorWidth + numberBlockWidth;
  const extension = SEPARATOR_EXTENSION * charWidth * 0.5;
  const contentWidth = totalBlockWidth + 2 * extension;
  const paddingX = 40; // fixed padding
  const width = Math.max(Math.ceil(contentWidth + 2 * paddingX), 300);

  // Height: 4 content rows (a, b, separator, answer) + carry space + padding
  const contentHeight = FIXED_FONT_SIZE + lineHeight * 3.6;
  const paddingY = 50; // fixed padding
  const height = Math.max(Math.ceil(contentHeight + 2 * paddingY), 250);

  return { width, height };
}

/**
 * Compute the layout for rendering a problem template.
 * Uses a fixed font size so text is consistent across all digit counts.
 */
export function computeLayout(
  problem: Problem,
  canvasWidth: number,
  canvasHeight: number,
): TemplateLayout {
  const answer = computeAnswer(problem.a, problem.b, problem.op);
  const aStr = problem.a.toString();
  const bStr = problem.b.toString();
  const answerStr = Math.abs(answer).toString();

  // Max width in characters (including operator column)
  const maxNumberLen = Math.max(aStr.length, bStr.length, answerStr.length);

  const fontSize = FIXED_FONT_SIZE;
  const charWidth = fontSize * 0.6; // Monospace approximation
  const lineHeight = fontSize * 1.5;
  const digitSpacing = charWidth * DIGIT_SPACING_FACTOR;

  // Compute block width
  const numberBlockWidth = maxNumberLen * digitSpacing;
  const operatorWidth = 2 * charWidth;
  const totalBlockWidth = operatorWidth + numberBlockWidth;

  // Center the block horizontally
  const blockStartX = (canvasWidth - totalBlockWidth) / 2;
  const operatorX = blockStartX;
  const numberRightX = blockStartX + totalBlockWidth;

  // Vertical layout — center vertically
  const contentHeight = fontSize + lineHeight * 3.6;
  const startY = (canvasHeight - contentHeight) / 2 + fontSize;
  const aY = startY;
  const bY = startY + lineHeight;
  const separatorY = bY + lineHeight * 0.6;
  const answerY = separatorY + lineHeight;

  // Separator line extends beyond number block
  const extension = SEPARATOR_EXTENSION * charWidth * 0.5;
  const separatorStartX = blockStartX - extension;
  const separatorEndX = numberRightX + extension;

  return {
    canvasWidth,
    canvasHeight,
    fontSize,
    charWidth,
    lineHeight,
    numberRightX,
    operatorX,
    aY,
    bY,
    separatorY,
    answerY,
    separatorStartX,
    separatorEndX,
    maxDigitWidth: maxNumberLen,
    digitSpacing,
  };
}

/**
 * Render the problem template onto a canvas context.
 * This draws the numbers, operator, and separator line.
 */
export function renderTemplate(
  ctx: CanvasRenderingContext2D,
  problem: Problem,
  layout: TemplateLayout,
  guidedMode: boolean = false,
): void {
  const { fontSize, numberRightX, operatorX, aY, bY, separatorY, digitSpacing } = layout;

  // Clear canvas
  ctx.clearRect(0, 0, layout.canvasWidth, layout.canvasHeight);

  // Set font
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#1e293b'; // slate-800
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';

  const aStr = problem.a.toString();
  const bStr = problem.b.toString();
  const opSymbol = operatorSymbol(problem.op);

  // Draw first number (a) - right aligned, with digit spacing
  drawSpacedNumber(ctx, aStr, numberRightX, aY, digitSpacing);

  // Draw operator
  ctx.textAlign = 'left';
  ctx.fillText(opSymbol, operatorX, bY);

  // Draw second number (b) - right aligned, with digit spacing
  ctx.textAlign = 'right';
  drawSpacedNumber(ctx, bStr, numberRightX, bY, digitSpacing);

  // Draw separator line
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(layout.separatorStartX, separatorY);
  ctx.lineTo(layout.separatorEndX, separatorY);
  ctx.stroke();

  // Draw guides if guided mode is enabled
  if (guidedMode) {
    renderGuides(ctx, problem, layout);
  }
}

/**
 * Draw a number with spacing between digits.
 */
function drawSpacedNumber(
  ctx: CanvasRenderingContext2D,
  numStr: string,
  rightX: number,
  y: number,
  digitSpacing: number,
): void {
  for (let i = numStr.length - 1; i >= 0; i--) {
    const digitIndex = numStr.length - 1 - i;
    const x = rightX - digitIndex * digitSpacing;
    ctx.fillText(numStr[i], x, y);
  }
}

/**
 * Draw guided mode overlays: digit columns, carry row, answer baseline.
 */
function renderGuides(
  ctx: CanvasRenderingContext2D,
  problem: Problem,
  layout: TemplateLayout,
): void {
  const { numberRightX, aY, answerY, digitSpacing, fontSize, canvasHeight } = layout;

  const answer = computeAnswer(problem.a, problem.b, problem.op);
  const maxLen = Math.max(
    problem.a.toString().length,
    problem.b.toString().length,
    Math.abs(answer).toString().length,
  );

  ctx.save();

  // Digit column lines (visible against white background)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'; // slate-400 with medium opacity
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  for (let i = 0; i < maxLen; i++) {
    const x = numberRightX - i * digitSpacing - digitSpacing * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, aY - fontSize);
    ctx.lineTo(x, canvasHeight * 0.85);
    ctx.stroke();
  }

  // Carry row (above first number for addition)
  if (problem.op === 'addition') {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.setLineDash([2, 4]);
    const carryY = aY - fontSize * 0.8;
    ctx.beginPath();
    ctx.moveTo(numberRightX - maxLen * digitSpacing, carryY);
    ctx.lineTo(numberRightX + digitSpacing * 0.5, carryY);
    ctx.stroke();
  }

  // Dotted answer baseline
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(layout.separatorStartX, answerY + fontSize * 0.1);
  ctx.lineTo(layout.separatorEndX, answerY + fontSize * 0.1);
  ctx.stroke();

  ctx.restore();
}

/**
 * Render the answer (for reveal mode).
 */
export function renderAnswer(
  ctx: CanvasRenderingContext2D,
  problem: Problem,
  layout: TemplateLayout,
): void {
  const answer = computeAnswer(problem.a, problem.b, problem.op);
  const answerStr = answer.toString();

  ctx.font = `${layout.fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#16a34a'; // green-600
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';

  drawSpacedNumber(ctx, answerStr, layout.numberRightX, layout.answerY, layout.digitSpacing);
}