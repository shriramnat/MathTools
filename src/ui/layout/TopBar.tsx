import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  AppAction,
  AppMode,
  ActiveSession,
  Difficulty,
  MaxDigits,
  PracticeConfig,
} from '../../app/store/types';
import { useTheme } from '../../theme/themeProvider';
import { THEMES } from '../../theme/themes';

interface TopBarProps {
  mode: AppMode;
  config: PracticeConfig;
  session: ActiveSession | null;
  dispatch: React.Dispatch<AppAction>;
  onStartSession: () => void;
}

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

export function TopBar({
  mode,
  config,
  session,
  dispatch,
  onStartSession,
}: TopBarProps) {
  const theme = useTheme();
  const [controlsOpen, setControlsOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const sessionBtnRef = useRef<HTMLButtonElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close session popover on outside click and revert to practice mode
  useEffect(() => {
    if (!sessionMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        sessionMenuRef.current &&
        !sessionMenuRef.current.contains(e.target as Node) &&
        sessionBtnRef.current &&
        !sessionBtnRef.current.contains(e.target as Node)
      ) {
        setSessionMenuOpen(false);
        // If no active session, revert to practice mode when clicking away
        if (!session) {
          dispatch({ type: 'SET_MODE', payload: 'FreePractice' });
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sessionMenuOpen, session, dispatch]);

  // Close theme menu on outside click
  useEffect(() => {
    if (!themeMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(e.target as Node) &&
        themeBtnRef.current &&
        !themeBtnRef.current.contains(e.target as Node)
      ) {
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [themeMenuOpen]);

  // Close session popover when a session starts
  useEffect(() => {
    if (session) setSessionMenuOpen(false);
  }, [session]);

  // Compute popover position relative to the session button
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!sessionMenuOpen || !sessionBtnRef.current) {
      setMenuPos(null);
      return;
    }
    const rect = sessionBtnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8, // 8px gap below button
      left: rect.right,     // align right edge
    });
  }, [sessionMenuOpen]);

  // Compute theme menu position relative to the theme button
  const [themeMenuPos, setThemeMenuPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!themeMenuOpen || !themeBtnRef.current) {
      setThemeMenuPos(null);
      return;
    }
    const rect = themeBtnRef.current.getBoundingClientRect();
    setThemeMenuPos({
      top: rect.bottom + 8, // 8px gap below button
      left: rect.right,     // align right edge
    });
  }, [themeMenuOpen]);

  // Check if session exists (both 'active' and 'completed' states should disable controls)
  const isSessionActive = session !== null;

  // Operation toggles
  const toggleOp = useCallback(
    (op: 'addition' | 'subtraction' | 'multiplication') => {
      // Disable during active session
      if (isSessionActive) return;
      const current = config.operations[op];
      // Prevent disabling all operations
      const enabledCount = Object.values(config.operations).filter(Boolean).length;
      if (current && enabledCount <= 1) return;
      dispatch({ type: 'SET_OPERATIONS', payload: { [op]: !current } });
    },
    [config.operations, dispatch, isSessionActive],
  );

  const bar = (
    <div
      className="z-50 border-b shadow-sm"
      style={{
        backgroundColor: theme.colors.bgTopBar,
        borderColor: theme.colors.cardBorder,
      }}
    >
      {/* ====== ROW 1: Main top bar — tabs + theme selector + hamburger ====== */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4">
        {/* Tab navigation */}
        <div className="flex gap-1">
          <button
            onClick={() => dispatch({ type: 'SET_APP_MODE', payload: 'canvas' })}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              mode === 'canvas' ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: mode === 'canvas' ? theme.colors.accent : undefined,
            }}
          >
            Number Problems
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_APP_MODE', payload: 'wordproblems' })}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              mode === 'wordproblems' ? 'text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: mode === 'wordproblems' ? theme.colors.accent : undefined,
            }}
          >
            Word Problems
          </button>
        </div>

        {/* Right side: Theme selector + Hamburger */}
        <div className="flex items-center gap-2">
          {/* Theme selector button */}
          <button
            ref={themeBtnRef}
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: themeMenuOpen ? theme.colors.accent + '18' : 'transparent',
            }}
          >
            <span className="text-xl">{THEMES.find(t => t.id === config.themeId)?.emoji}</span>
            <span className="hidden sm:inline text-sm font-medium text-gray-700">Theme</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
              className={`transition-transform ${themeMenuOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Hamburger toggle — visible on mobile/tablet, hidden on desktop (canvas mode only) */}
          {mode === 'canvas' && (
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
          )}
        </div>
      </div>

      {/* ====== ROW 2: Controls bar — only show for canvas mode ====== */}
      {mode === 'canvas' && (
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
              disabled={isSessionActive}
            />
            <ToggleButton
              active={config.operations.subtraction}
              onClick={() => toggleOp('subtraction')}
              label="−"
              accent={theme.colors.accent}
              disabled={isSessionActive}
            />
            <ToggleButton
              active={config.operations.multiplication}
              onClick={() => toggleOp('multiplication')}
              label="×"
              accent={theme.colors.accent}
              disabled={isSessionActive}
            />
          </div>

          {/* Separator — hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Max Digits Slider */}
          <div className={`flex items-center gap-2 ${isSessionActive ? 'opacity-50 pointer-events-none' : ''}`}>
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
              disabled={isSessionActive}
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
                disabled={isSessionActive}
              />
            ))}
          </div>

          {/* Separator — hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Test Mode toggle */}
          <div className="relative flex gap-1">
            <ToggleButton
              ref={sessionBtnRef}
              active={config.mode === 'Session'}
              onClick={() => {
                if (config.mode !== 'Session') {
                  // Activate test mode and show popover
                  dispatch({ type: 'SET_MODE', payload: 'Session' });
                  setSessionMenuOpen(true);
                } else if (session) {
                  // During an active session, just toggle popover visibility
                  // (don't allow deactivating test mode mid-session)
                } else {
                  // Deactivate test mode — go back to practice
                  dispatch({ type: 'SET_MODE', payload: 'FreePractice' });
                  setSessionMenuOpen(false);
                }
              }}
              label="📝 Test Mode"
              accent={theme.colors.accent}
            />
          </div>

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
        </div>
        </div>
      )}
    </div>
  );

  /* ---------- Session popover (portal) ---------- */
  const sessionPopover =
    config.mode === 'Session' && sessionMenuOpen && !session && menuPos
      ? createPortal(
          <div
            ref={sessionMenuRef}
            className="fixed z-[9999] flex flex-col gap-3 p-4 rounded-xl shadow-lg border"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              transform: 'translateX(-100%)', // right-align to the anchor
              backgroundColor: theme.colors.bgTopBar,
              borderColor: theme.colors.cardBorder,
              width: 260,
            }}
          >
            <label className="text-xs font-medium text-gray-500">
              Number of questions: <span className="font-bold" style={{ color: theme.colors.accent }}>{config.sessionSize}</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={config.sessionSize}
              onChange={(e) =>
                dispatch({
                  type: 'SET_SESSION_SIZE',
                  payload: Number(e.target.value),
                })
              }
              className="w-full h-2 accent-current"
              style={{ accentColor: theme.colors.accent }}
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>5</span>
              <span>100</span>
            </div>

            <button
              onClick={() => {
                setSessionMenuOpen(false);
                onStartSession();
              }}
              className="text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors min-h-[36px]"
              style={{ backgroundColor: theme.colors.accent }}
            >
              ▶ Start
            </button>
          </div>,
          document.body,
        )
      : null;

  /* ---------- Theme menu (portal) ---------- */
  const themePopover = themeMenuOpen && themeMenuPos
    ? createPortal(
        <div
          ref={themeMenuRef}
          className="fixed z-[9999] flex flex-col gap-2 p-3 rounded-xl shadow-lg border"
          style={{
            top: themeMenuPos.top,
            left: themeMenuPos.left,
            transform: 'translateX(-100%)', // right-align to the anchor
            backgroundColor: theme.colors.bgTopBar,
            borderColor: theme.colors.cardBorder,
            width: 200,
          }}
        >
          <div className="text-xs font-medium text-gray-500 mb-1">Select Theme</div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                dispatch({ type: 'SET_THEME', payload: t.id });
                setThemeMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                config.themeId === t.id ? 'text-white font-bold' : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: config.themeId === t.id ? theme.colors.accent : undefined,
              }}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="text-sm">{t.name}</span>
            </button>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {bar}
      {sessionPopover}
      {themePopover}
    </>
  );
}

// Reusable toggle button component (supports ref forwarding)
const ToggleButton = React.forwardRef<
  HTMLButtonElement,
  {
    active: boolean;
    onClick: () => void;
    label: string;
    accent: string;
    disabled?: boolean;
  }
>(({ active, onClick, label, accent, disabled = false }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    disabled={disabled}
    className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors min-w-[40px] min-h-[36px] ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : active
        ? 'text-white'
        : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
    }`}
    style={{
      backgroundColor: active && !disabled ? accent : undefined,
    }}
  >
    {label}
  </button>
));
ToggleButton.displayName = 'ToggleButton';
