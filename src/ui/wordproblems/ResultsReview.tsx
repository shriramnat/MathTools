import type { WordProblemSession } from '../../domain/wordproblems/types';
import { useTheme } from '../../theme/themeProvider';

interface ResultsReviewProps {
  session: WordProblemSession;
  onEndSession: () => void;
}

export function ResultsReview({ session, onEndSession }: ResultsReviewProps) {
  const theme = useTheme();

  // Calculate stats
  const totalProblems = session.problems.length;
  const correctCount = Object.values(session.checkResults).filter((r) => r === 'Correct').length;
  const percentCorrect = Math.round((correctCount / totalProblems) * 100);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with End Session button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.accent }}>
            Session Results
          </h2>
          <p className="text-gray-600 mt-1">
            You got {correctCount} out of {totalProblems} correct ({percentCorrect}%)
          </p>
        </div>
        <button
          onClick={onEndSession}
          className="px-6 py-3 font-bold rounded-lg text-white transition-colors"
          style={{ backgroundColor: theme.colors.accent }}
        >
          End Session
        </button>
      </div>

      {/* Problems list */}
      <div className="space-y-4">
        {session.problems.map((problem, index) => {
          const userAnswer = session.answers[problem.id];
          const checkResult = session.checkResults[problem.id];
          const isCorrect = checkResult === 'Correct';
          const isSkipped = checkResult === 'Skipped';

          return (
            <div
              key={problem.id}
              className="p-6 rounded-xl shadow-md border-2"
              style={{
                backgroundColor: theme.colors.bgTopBar,
                borderColor: theme.colors.cardBorder,
              }}
            >
              {/* Problem number and status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: theme.colors.accent,
                      color: 'white',
                    }}
                  >
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <span className="text-2xl">✓</span>
                        <span className="font-bold text-green-700">Correct</span>
                      </>
                    ) : isSkipped ? (
                      <>
                        <span className="text-2xl">⊝</span>
                        <span className="font-bold text-gray-700">Skipped</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">✗</span>
                        <span className="font-bold text-red-700">Incorrect</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem text */}
              <p className="text-lg text-gray-800 mb-4 leading-relaxed">{problem.text}</p>

              {/* Answer details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-gray-50">
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Your Answer:</span>
                  <span className="font-bold text-lg">
                    {userAnswer !== null && userAnswer !== undefined ? userAnswer : '(No answer)'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Correct Answer:</span>
                  <span className="font-bold text-lg text-green-700">{problem.answer}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Solution:</span>
                  <span className="font-mono text-sm">
                    {problem.solution || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom End Session button for convenience */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onEndSession}
          className="px-8 py-3 font-bold rounded-lg text-white transition-colors"
          style={{ backgroundColor: theme.colors.accent }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}