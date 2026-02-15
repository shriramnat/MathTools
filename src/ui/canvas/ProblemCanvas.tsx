import React, { useRef, useEffect, useCallback } from 'react';
import type { Problem } from '../../app/store/types';
import type { Stroke } from './strokeModel';
import { computeLayout, renderTemplate, renderAnswer } from './templateRenderer';
import { redrawAllStrokes } from './inkRenderer';
import { PointerController } from './pointerController';

interface ProblemCanvasProps {
  problem: Problem;
  guidedMode: boolean;
  toolColor: string;
  toolSize: number;
  toolMode: 'pen' | 'eraser';
  showAnswer: boolean;
  checkResult?: 'Correct' | 'Incorrect' | null;
  clearInkVersion?: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;

export const ProblemCanvas = React.memo(function ProblemCanvas({
  problem,
  guidedMode,
  toolColor,
  toolSize,
  toolMode,
  showAnswer,
  checkResult,
  clearInkVersion,
}: ProblemCanvasProps) {
  const templateCanvasRef = useRef<HTMLCanvasElement>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<PointerController | null>(null);
  const strokesRef = useRef<Stroke[]>([]);

  // Refs for current tool settings (avoids re-creating controller on every change)
  const toolColorRef = useRef(toolColor);
  const toolSizeRef = useRef(toolSize);
  const toolModeRef = useRef(toolMode);

  toolColorRef.current = toolColor;
  toolSizeRef.current = toolSize;
  toolModeRef.current = toolMode;

  // Draw the template layer
  const drawTemplate = useCallback(() => {
    const canvas = templateCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layout = computeLayout(problem, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderTemplate(ctx, problem, layout, guidedMode);

    if (showAnswer) {
      renderAnswer(ctx, problem, layout);
    }
  }, [problem, guidedMode, showAnswer]);

  // Redraw template when problem or settings change
  useEffect(() => {
    drawTemplate();
  }, [drawTemplate]);

  // Set up pointer controller for ink canvas
  useEffect(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;

    const controller = new PointerController({
      canvas,
      getColor: () => toolColorRef.current,
      getSize: () => toolSizeRef.current,
      getMode: () => toolModeRef.current,
      onStrokeComplete: (stroke: Stroke) => {
        strokesRef.current = [...strokesRef.current, stroke];
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []); // Only create once per mount

  // Handle clear ink
  const handleClear = useCallback(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    strokesRef.current = [];
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Clear ink when clearInkVersion changes (from parent "clear all" or config change)
  const clearInkVersionRef = useRef(clearInkVersion);
  useEffect(() => {
    // Skip the initial mount — only clear on subsequent changes
    if (clearInkVersionRef.current !== clearInkVersion) {
      clearInkVersionRef.current = clearInkVersion;
      handleClear();
    }
  }, [clearInkVersion, handleClear]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const canvas = inkCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    strokesRef.current = strokesRef.current.slice(0, -1);
    redrawAllStrokes(ctx, strokesRef.current, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Check result badge
  const badgeColor =
    checkResult === 'Correct'
      ? 'bg-green-500'
      : checkResult === 'Incorrect'
        ? 'bg-red-500'
        : '';

  return (
    <div className="relative">
      {/* Stacked canvases */}
      <div className="relative" style={{ width: '100%', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}>
        {/* Template layer (non-interactive) */}
        <canvas
          ref={templateCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />
        {/* Ink layer (interactive) */}
        <canvas
          ref={inkCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Check result badge */}
      {checkResult && (
        <div
          className={`absolute top-2 right-2 ${badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full`}
        >
          {checkResult === 'Correct' ? '✓' : '✗'}
        </div>
      )}

      {/* Canvas action buttons */}
      <div className="flex gap-1 mt-1 justify-end">
        <button
          onClick={handleUndo}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
          title="Undo last stroke"
        >
          ↩
        </button>
        <button
          onClick={handleClear}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
          title="Clear all ink"
        >
          🗑
        </button>
      </div>
    </div>
  );
});