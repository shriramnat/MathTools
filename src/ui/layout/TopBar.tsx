import React, { useCallback, useState } from 'react';
import type {
  AppAction,
  ActiveSession,
  Difficulty,
  MaxDigits,
  PracticeConfig,
  SessionSize,
} from '../../app/store/types';
import { useTheme } from '../../theme/themeProvider';
import { THEMES } from '../../theme/themes';
import { Timer } from '../shared/Timer';

interface TopBarProps {
  config: PracticeConfig;
  toolColor: string;
  toolSize: number;
  toolMode: 'pen' | 'eraser';
  session: ActiveSession | null;
  dispatch: React.Dispatch<AppAction>;
  onStartSession: () => void;
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

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const SESSION_SIZES: SessionSize[] = [10, 15, 20];

export function TopBar({
  config,
  toolColor,
  toolSize,
  toolMode,
  session,
  dispatch,
  onStartSession,
  onFinishProblems,
  onEndSession,
}: TopBarProps) {
  const theme = useTheme();
  const [controlsOpen, setControlsOpen] = useState(false);

  // Operation toggles
  const toggleOp = useCallback(
    (op: 'addition' | 'subtraction' | 'multiplication') => {
      const current = config.operations[op];
      // Prevent disabling all operations
      const enabledCount = Object.values(config.operations).filter(Boolean).length;
      if (current && enabledCount <= 1) return;
      dispatch({ type: 'SET_OPERATIONS', payload: { [op]: !current } });
    },
    [config.operations, dispatch],
  );

  return (
    <div
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{
        backgroundColor: theme.colors.bgTopBar,
        borderColor: theme.colors.cardBorder,
      }}
    >
      {/* ====== ROW 1: Main top bar — title + hamburger ====== */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        <h1
          className="text-lg font-bold whitespace-nowrap"
          style={{ color: theme.colors.accent }}
        >
          🧮 MathCanvas
        </h1>

        {/* Hamburger toggle — visible on mobile/tablet, hidden on desktop */}
        <button
          onClick={() => setControlsOpen((o) => !o)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
          style={{
            color: theme.colors.accent,
            backgroundColor: controlsOpen ? theme.colors.accent + '18' : 'transparent',
          }}
          aria-label={controlsOpen ? 'Close settings' : 'Open settings'}
          aria-expanded={controlsOpen}
        >
          {controlsOpen ? (
            /* X icon */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ) : (
            /* Hamburger icon */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* ====== ROW 2: Controls bar — collapsible on mobile/tablet ====== */}
      <div
        className={`border-t overflow-hidden transition-all duration-200 ease-in-out ${
          controlsOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        } lg:max-h-none lg:opacity-100`}
        style={{ borderColor: theme.colors.cardBorder }}
      >
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 sm:gap-3">
          {/* Operations */}
          <div className="flex gap-1">
            <ToggleButton
              active={config.operations.addition}
              onClick={() => toggleOp('addition')}
              label="+"
              accent={theme.colors.accent}
            />
            <ToggleButton
              active={config.operations.subtraction}
              onClick={() => toggleOp('subtraction')}
              label="−"
              accent={theme.colors.accent}
            />
            <ToggleButton
              active={config.operations.multiplication}
              onClick={() => toggleOp('multiplication')}
              label="×"
              accent={theme.colors.accent}
            />
          </div>

          {/* Separator — hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Max Digits Slider */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Digits</label>
            <input
              type="range"
              min={1}
              max={6}
              value={config.maxDigits}
              onChange={(e) =>
                dispatch({
                  type: 'SET_MAX_DIGITS',
                  payload: Number(e.target.value) as MaxDigits,
                })
              }
              className="w-20 h-2 accent-current"
              style={{ accentColor: theme.colors.accent }}
            />
            <span
              className="text-sm font-bold w-4 text-center"
              style={{ color: theme.colors.accent }}
            >
              {config.maxDigits}
            </span>
          </div>

          {/* Separator — hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Difficulty */}
          <div className="flex gap-1">
            {DIFFICULTIES.map((d) => (
              <ToggleButton
                key={d}
                active={config.difficulty === d}
                onClick={() => dispatch({ type: 'SET_DIFFICULTY', payload: d })}
                label={d}
                accent={theme.colors.accent}
              />
            ))}
          </div>

          {/* Separator — hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Mode */}
          <div className="flex gap-1">
            <ToggleButton
              active={config.mode === 'FreePractice'}
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'FreePractice' })}
              label="Free"
              accent={theme.colors.accent}
            />
            <ToggleButton
              active={config.mode === 'Session'}
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'Session' })}
              label="Session"
              accent={theme.colors.accent}
            />
          </div>

          {/* Session controls */}
          {config.mode === 'Session' && (
            <>
              <select
                value={config.sessionSize}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_SESSION_SIZE',
                    payload: Number(e.target.value) as SessionSize,
                  })
                }
                className="text-sm px-2 py-1.5 border rounded min-h-[36px]"
                disabled={session !== null}
              >
                {SESSION_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} problems
                  </option>
                ))}
              </select>

              {!session ? (
                <button
                  onClick={onStartSession}
                  className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors min-h-[36px]"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  ▶ Start
                </button>
              ) : (
                <>
                  <Timer
                    startedAt={session.startedAt}
                    stoppedAt={session.completedAt}
                    className="mx-1"
                    style={{ color: theme.colors.accent }}
                  />
                  {session.status === 'active' ? (
                    <button
                      onClick={onFinishProblems}
                      className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors min-h-[36px]"
                      style={{ backgroundColor: '#f59e0b' }}
                    >
                      ✓ Finished Problems
                    </button>
                  ) : (
                    <button
                      onClick={onEndSession}
                      className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors bg-red-500 hover:bg-red-600 min-h-[36px]"
                    >
                      ■ End Session
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Guided mode */}
          <label className="flex items-center gap-1.5 text-sm cursor-pointer sm:ml-auto min-h-[36px]">
            <input
              type="checkbox"
              checked={config.guidedMode}
              onChange={(e) =>
                dispatch({ type: 'SET_GUIDED_MODE', payload: e.target.checked })
              }
              className="w-5 h-5 rounded"
              style={{ accentColor: theme.colors.accent }}
            />
            Guides
          </label>

          {/* Theme selector */}
          <div className="flex gap-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => dispatch({ type: 'SET_THEME', payload: t.id })}
                className={`text-base w-9 h-9 rounded-full border-2 transition-transform ${
                  config.themeId === t.id ? 'scale-110 border-current' : 'border-transparent'
                }`}
                style={{
                  borderColor: config.themeId === t.id ? theme.colors.accent : 'transparent',
                }}
                title={t.name}
              >
                {t.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====== ROW 3: Drawing tools — always visible ====== */}
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2 border-t sm:px-4 sm:gap-3"
        style={{ borderColor: theme.colors.cardBorder }}
      >
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
      </div>
    </div>
  );
}

// Reusable toggle button component
function ToggleButton({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors min-w-[40px] min-h-[36px] ${
        active ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
      }`}
      style={{
        backgroundColor: active ? accent : undefined,
      }}
    >
      {label}
    </button>
  );
}