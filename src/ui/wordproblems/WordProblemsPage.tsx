import { useState, useCallback } from 'react';
import type { AppAction } from '../../app/store/types';
import type { WordProblemSession } from '../../domain/wordproblems/types';
import { selectRandomWordProblems } from '../../domain/wordproblems/loader';
import { useTheme } from '../../theme/themeProvider';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { NavigationButtons } from './NavigationButtons';
import { ScratchCanvas } from './ScratchCanvas';
import { ResultsReview } from './ResultsReview';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface WordProblemsPageProps {
  session: WordProblemSession | null;
  dispatch: React.Dispatch<AppAction>;
}

export function WordProblemsPage({ session, dispatch }: WordProblemsPageProps) {
  const theme = useTheme();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [sessionSize, setSessionSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Start a new session
  const handleStartSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const problems = await selectRandomWordProblems(difficulty, sessionSize);
      const newSession: WordProblemSession = {
        id: `wp-session-${Date.now()}`,
        difficulty,
        startedAt: Date.now(),
        status: 'active',
        problems,
        currentIndex: 0,
        answers: {},
        checkResults: {},
      };
      dispatch({ type: 'START_WORD_PROBLEM_SESSION', payload: newSession });
    } catch (error) {
      console.error('Failed to start word problem session:', error);
      alert('Failed to load word problems. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, sessionSize, dispatch]);

  // Navigate between problems
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!session) return;
      const newIndex =
        direction === 'next'
          ? Math.min(session.currentIndex + 1, session.problems.length - 1)
          : Math.max(session.currentIndex - 1, 0);
      dispatch({ type: 'NAVIGATE_WORD_PROBLEM', payload: { index: newIndex } });
    },
    [session, dispatch]
  );

  // Set answer for current problem
  const handleSetAnswer = useCallback(
    (answer: number | null) => {
      if (!session) return;
      const currentProblem = session.problems[session.currentIndex];
      dispatch({
        type: 'SET_WORD_PROBLEM_ANSWER',
        payload: { problemId: currentProblem.id, answer },
      });
    },
    [session, dispatch]
  );

  // Complete session - auto-check all answers
  const handleCompleteSession = useCallback(() => {
    setShowCompleteConfirm(true);
  }, []);

  const handleConfirmComplete = useCallback(() => {
    if (!session) return;
    
    setShowCompleteConfirm(false);
    
    // Auto-check all problems
    session.problems.forEach((problem) => {
      const userAnswer = session.answers[problem.id];
      
      if (userAnswer === null || userAnswer === undefined) {
        dispatch({
          type: 'CHECK_WORD_PROBLEM',
          payload: { problemId: problem.id, result: 'Skipped' },
        });
      } else {
        const isCorrect = Math.abs(userAnswer - problem.answer) < 0.0001;
        dispatch({
          type: 'CHECK_WORD_PROBLEM',
          payload: {
            problemId: problem.id,
            result: isCorrect ? 'Correct' : 'Incorrect',
          },
        });
      }
    });
    
    // Mark session as completed
    dispatch({ type: 'COMPLETE_WORD_PROBLEM_SESSION' });
  }, [session, dispatch]);

  // End session
  const handleEndSession = useCallback(() => {
    dispatch({ type: 'END_WORD_PROBLEM_SESSION' });
  }, [dispatch]);

  // If no session, show settings page
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div
          className="w-full max-w-md p-8 rounded-2xl shadow-lg"
          style={{
            backgroundColor: theme.colors.bgTopBar,
            borderColor: theme.colors.cardBorder,
          }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.colors.accent }}>
            Word Problems
          </h2>

          <div className="space-y-6">
            {/* Difficulty selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      difficulty === d ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: difficulty === d ? theme.colors.accent : undefined,
                    }}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Session size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of problems: <span className="font-bold" style={{ color: theme.colors.accent }}>{sessionSize}</span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={sessionSize}
                onChange={(e) => setSessionSize(Number(e.target.value))}
                className="w-full h-2"
                style={{ accentColor: theme.colors.accent }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStartSession}
              disabled={isLoading}
              className="w-full text-lg font-bold px-6 py-3 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: theme.colors.accent }}
            >
              {isLoading ? 'Loading...' : '▶ Start Session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If session is completed, show results review
  if (session.status === 'completed') {
    return <ResultsReview session={session} onEndSession={handleEndSession} />;
  }

  // Session is active
  const currentProblem = session.problems[session.currentIndex];
  const currentAnswer = session.answers[currentProblem.id] ?? null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-200px)] p-4">
      {/* Left side: Problem and controls */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Progress indicator */}
          <div className="mb-4 text-center text-sm text-gray-500">
            Problem {session.currentIndex + 1} of {session.problems.length}
          </div>

          {/* Problem display */}
          <ProblemDisplay problem={currentProblem} />

          {/* Answer input */}
          <div className="mt-6">
            <AnswerInput
              value={currentAnswer}
              onChange={handleSetAnswer}
              disabled={false}
            />
          </div>

          {/* Navigation */}
          <div className="mt-6">
            <NavigationButtons
              currentIndex={session.currentIndex}
              totalProblems={session.problems.length}
              onNavigate={handleNavigate}
              onComplete={handleCompleteSession}
            />
          </div>
        </div>
      </div>

      {/* Right side: Scratch canvas */}
      <ScratchCanvas problemId={currentProblem.id} />

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={showCompleteConfirm}
        title="Complete Session?"
        message="Are you sure you want to finish? Once you submit, you'll see your results for all problems."
        confirmLabel="Yes, show my results!"
        cancelLabel="Keep working"
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </div>
  );
}