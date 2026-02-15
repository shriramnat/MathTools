import { useReducer, useCallback, useState } from 'react';
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
import { ProblemGrid } from '../ui/problems/ProblemGrid';
import { ConfirmDialog } from '../ui/shared/ConfirmDialog';

export function App() {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_APP_STATE);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const { config, session, toolSettings } = state;

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

  // End the session (reset to free practice)
  const handleEndSession = useCallback(() => {
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
          toolColor={toolSettings.color}
          toolSize={toolSettings.size}
          toolMode={toolSettings.mode}
          session={session}
          dispatch={dispatch}
          onStartSession={handleStartSession}
          onFinishProblems={handleFinishProblems}
          onEndSession={handleEndSession}
        />

        <main className="flex-1">
          <ProblemGrid
            config={config}
            sessionProblems={sessionProblems}
            toolColor={toolSettings.color}
            toolSize={toolSettings.size}
            toolMode={toolSettings.mode}
            onCheck={handleCheck}
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
      </Shell>
    </ThemeProvider>
  );
}