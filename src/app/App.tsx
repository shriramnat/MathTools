import { useReducer, useCallback, useState, useRef, useEffect } from 'react';
import { appReducer } from './store/appReducer';
import {
  DEFAULT_APP_STATE,
  type CheckResult,
  type ActiveSession,
} from './store/types';
import { generateProblems, createSeed } from '../domain/generation/problemGenerator';
import { ThemeProvider } from '../theme/themeProvider';
import { Shell } from '../ui/layout/Shell';
import { TopBar } from '../ui/layout/TopBar';
import { StickyToolbar } from '../ui/layout/StickyToolbar';
import { ProblemGrid } from '../ui/problems/ProblemGrid';
import { ConfirmDialog } from '../ui/shared/ConfirmDialog';
import { SessionResultOverlay } from '../ui/shared/SessionResultOverlay';

export function App() {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_APP_STATE);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [sessionResult, setSessionResult] = useState<{
    type: 'celebration' | 'feedback';
    correct: number;
    total: number;
  } | null>(null);

  // Keep a ref to the session so we can read checkResults in handleEndSession
  // even after the session might be transitioning
  const sessionRef = useRef(state.session);
  sessionRef.current = state.session;

  const { config, session, toolSettings } = state;

  // ── Clear-all-ink version counter ────────────────────────────────
  // Incremented when we want every ProblemCanvas to wipe its ink layer.
  const [clearInkVersion, setClearInkVersion] = useState(0);

  // Auto-clear ink whenever config values that regenerate problems change
  const prevMaxDigitsRef = useRef(config.maxDigits);
  const prevOperationsRef = useRef(config.operations);
  const prevDifficultyRef = useRef(config.difficulty);

  useEffect(() => {
    const digitsChanged = prevMaxDigitsRef.current !== config.maxDigits;
    const opsChanged = prevOperationsRef.current !== config.operations;
    const diffChanged = prevDifficultyRef.current !== config.difficulty;

    if (digitsChanged || opsChanged || diffChanged) {
      setClearInkVersion((v) => v + 1);
    }

    prevMaxDigitsRef.current = config.maxDigits;
    prevOperationsRef.current = config.operations;
    prevDifficultyRef.current = config.difficulty;
  }, [config.maxDigits, config.operations, config.difficulty]);

  // Manual "Clear all" from the toolbar
  const handleClearAll = useCallback(() => {
    setClearInkVersion((v) => v + 1);
  }, []);

  // Start a new session
  const handleStartSession = useCallback(() => {
    const seed = createSeed();
    const problems = generateProblems(seed, 0, config.sessionSize, config);
    const newSession: ActiveSession = {
      id: `session-${Date.now()}`,
      seed,
      startedAt: Date.now(),
      status: 'active',
      problems,
      checkResults: {},
    };
    dispatch({ type: 'START_SESSION', payload: newSession });
  }, [config]);

  // User clicks "Finished Problems" — show confirmation
  const handleFinishProblems = useCallback(() => {
    setShowFinishConfirm(true);
  }, []);

  // User confirms they are done — stop timer, transition to completed state
  const handleConfirmFinish = useCallback(() => {
    setShowFinishConfirm(false);
    dispatch({ type: 'COMPLETE_SESSION' });
  }, []);

  // User cancels the finish confirmation
  const handleCancelFinish = useCallback(() => {
    setShowFinishConfirm(false);
  }, []);

  // End the session — check results and show appropriate feedback
  const handleEndSession = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession) {
      dispatch({ type: 'END_SESSION' });
      return;
    }

    const checkResults = currentSession.checkResults;
    const checkedEntries = Object.values(checkResults);
    const totalChecked = checkedEntries.filter(
      (r) => r === 'Correct' || r === 'Incorrect',
    ).length;

    // No problems were checked by parent — end session gracefully
    if (totalChecked === 0) {
      dispatch({ type: 'END_SESSION' });
      return;
    }

    const correctCount = checkedEntries.filter((r) => r === 'Correct').length;
    const totalProblems = currentSession.problems.length;

    if (correctCount === totalProblems) {
      // Perfect score — celebration!
      setSessionResult({
        type: 'celebration',
        correct: correctCount,
        total: totalProblems,
      });
    } else {
      // Partial score — feedback modal
      setSessionResult({
        type: 'feedback',
        correct: correctCount,
        total: totalProblems,
      });
    }
  }, []);

  // Called when the session result overlay is dismissed
  const handleResultClose = useCallback(() => {
    setSessionResult(null);
    dispatch({ type: 'END_SESSION' });
  }, []);

  // Handle problem check
  const handleCheck = useCallback(
    (problemId: string, result: CheckResult) => {
      if (session) {
        dispatch({ type: 'CHECK_PROBLEM', payload: { problemId, result } });
      }
    },
    [session],
  );

  // Determine which problems to show
  const sessionProblems = session ? session.problems : undefined;

  return (
    <ThemeProvider themeId={config.themeId}>
      <Shell>
        <TopBar
          config={config}
          session={session}
          dispatch={dispatch}
          onStartSession={handleStartSession}
          onFinishProblems={handleFinishProblems}
          onEndSession={handleEndSession}
        />

        <StickyToolbar
          toolColor={toolSettings.color}
          toolSize={toolSettings.size}
          toolMode={toolSettings.mode}
          dispatch={dispatch}
          onClearAll={handleClearAll}
          session={session}
          onFinishProblems={handleFinishProblems}
          onEndSession={handleEndSession}
        />

        <main className="flex-1">
          <ProblemGrid
            config={config}
            sessionProblems={sessionProblems}
            sessionStatus={session?.status ?? null}
            toolColor={toolSettings.color}
            toolSize={toolSettings.size}
            toolMode={toolSettings.mode}
            onCheck={handleCheck}
            clearInkVersion={clearInkVersion}
          />
        </main>

        <ConfirmDialog
          open={showFinishConfirm}
          title="Finished Problems?"
          message="Are you sure you're done with all the problems? The timer will stop."
          confirmLabel="Yes, I'm done!"
          cancelLabel="Keep working"
          onConfirm={handleConfirmFinish}
          onCancel={handleCancelFinish}
        />

        {sessionResult && (
          <SessionResultOverlay
            type={sessionResult.type}
            correct={sessionResult.correct}
            total={sessionResult.total}
            onClose={handleResultClose}
          />
        )}
      </Shell>
    </ThemeProvider>
  );
}