import React, { useCallback, useEffect, useState } from 'react';
import type { AppAction, ActiveSession } from '../../app/store/types';
import { useTheme } from '../../theme/themeProvider';
import { Timer } from '../shared/Timer';

interface StickyToolbarProps {
  toolColor: string;
  toolSize: number;
  toolMode: 'pen' | 'eraser';
  dispatch: React.Dispatch<AppAction>;
  onClearAll: () => void;
  session: ActiveSession | null;
  onFinishProblems: () => void;
  onEndSession: () => void;
}

const PEN_COLORS = [
  '#000000', // Black
  '#1e40af', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0d9488', // Teal
  '#be185d', // Pink
];

export function StickyToolbar({
  toolColor,
  toolSize,
  toolMode,
  dispatch,
  onClearAll,
  session,
  onFinishProblems,
  onEndSession,
}: StickyToolbarProps) {
  const theme = useTheme();
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showBottomBtn, setShowBottomBtn] = useState(true);

  // Track scroll position to show/hide scroll buttons
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      setShowTopBtn(scrollTop > 200);
      setShowBottomBtn(scrollTop + clientHeight < scrollHeight - 200);
    }

    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div
      className="sticky top-0 z-40 border-b transition-shadow duration-200"
      style={{
        backgroundColor: theme.colors.bgTopBar,
        borderColor: theme.colors.cardBorder,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 sm:gap-3">
        {/* Pen / Eraser */}
        <div className="flex gap-1">
          <button
            onClick={() => dispatch({ type: 'SET_TOOL_MODE', payload: 'pen' })}
            className={`text-sm px-3 py-2 rounded-lg font-medium transition-colors min-h-[40px] ${
              toolMode === 'pen' ? 'text-white' : 'text-gray-600 bg-gray-100'
            }`}
            style={{
              backgroundColor: toolMode === 'pen' ? theme.colors.accent : undefined,
            }}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_TOOL_MODE', payload: 'eraser' })}
            className={`text-sm px-3 py-2 rounded-lg font-medium transition-colors min-h-[40px] ${
              toolMode === 'eraser' ? 'text-white bg-gray-600' : 'text-gray-600 bg-gray-100'
            }`}
          >
            🧽 Eraser
          </button>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-5 bg-gray-200" />

        {/* Brush size */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs text-gray-500">Size</label>
          <input
            type="range"
            min={1}
            max={12}
            value={toolSize}
            onChange={(e) =>
              dispatch({ type: 'SET_TOOL_SIZE', payload: Number(e.target.value) })
            }
            className="w-20 sm:w-16 h-2"
            style={{ accentColor: theme.colors.accent }}
          />
          <div
            className="rounded-full shrink-0"
            style={{
              width: Math.max(toolSize, 4),
              height: Math.max(toolSize, 4),
              backgroundColor: toolMode === 'eraser' ? '#9ca3af' : toolColor,
            }}
          />
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-5 bg-gray-200" />

        {/* Color palette */}
        <div className="flex flex-wrap gap-1.5">
          {PEN_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => dispatch({ type: 'SET_TOOL_COLOR', payload: color })}
              className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full border-2 transition-transform ${
                toolColor === color && toolMode === 'pen' ? 'scale-125' : ''
              }`}
              style={{
                backgroundColor: color,
                borderColor:
                  toolColor === color && toolMode === 'pen' ? theme.colors.accent : 'transparent',
              }}
              title={color}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-5 bg-gray-200" />

        {/* Clear all */}
        <button
          onClick={onClearAll}
          className="text-sm px-3 py-2 rounded-lg font-medium transition-colors min-h-[40px] text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-600"
          title="Clear all canvases"
        >
          🗑 Clear all
        </button>

        {/* Session controls — shown when a session is active */}
        {session && (
          <>
            {/* Separator */}
            <div className="hidden sm:block w-px h-5 bg-gray-200" />

            <div className="flex items-center gap-2">
              <Timer
                startedAt={session.startedAt}
                stoppedAt={session.completedAt}
                className="text-sm font-mono font-bold"
                style={{ color: theme.colors.accent }}
              />
              {session.status === 'active' ? (
                <button
                  onClick={onFinishProblems}
                  className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors min-h-[40px]"
                  style={{ backgroundColor: '#f59e0b' }}
                >
                  ✓ Finished Problems
                </button>
              ) : (
                <button
                  onClick={onEndSession}
                  className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors bg-red-500 hover:bg-red-600 min-h-[40px]"
                >
                  ■ End Test
                </button>
              )}
            </div>
          </>
        )}

        {/* Spacer to push scroll buttons to the right */}
        <div className="flex-1" />

        {/* Scroll buttons */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={scrollToTop}
            className={`text-sm px-2 py-2 rounded-lg font-medium transition-all duration-200 min-h-[40px] ${
              showTopBtn
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 pointer-events-none -translate-y-1'
            }`}
            style={{
              backgroundColor: `${theme.colors.accent}15`,
              color: theme.colors.accent,
            }}
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            ↑ Top
          </button>
          <button
            onClick={scrollToBottom}
            className={`text-sm px-2 py-2 rounded-lg font-medium transition-all duration-200 min-h-[40px] ${
              showBottomBtn
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 pointer-events-none translate-y-1'
            }`}
            style={{
              backgroundColor: `${theme.colors.accent}15`,
              color: theme.colors.accent,
            }}
            title="Scroll to bottom"
            aria-label="Scroll to bottom"
          >
            ↓ Bottom
          </button>
        </div>
      </div>
    </div>
  );
}