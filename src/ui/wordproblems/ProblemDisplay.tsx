import type { WordProblem } from '../../domain/wordproblems/types';
import type { CheckResult } from '../../app/store/types';
import { useTheme } from '../../theme/themeProvider';

interface ProblemDisplayProps {
  problem: WordProblem;
  checkResult?: CheckResult;
}

export function ProblemDisplay({ problem, checkResult }: ProblemDisplayProps) {
  const theme = useTheme();

  return (
    <div
      className="p-8 rounded-2xl shadow-lg transition-all"
      style={{
        backgroundColor: theme.colors.bgTopBar,
        borderColor: theme.colors.cardBorder,
        borderWidth: 2,
      }}
    >
      {/* Problem text */}
      <p className="text-xl leading-relaxed text-gray-800 mb-6">{problem.text}</p>

      {/* Feedback section */}
      {checkResult && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            checkResult === 'Correct'
              ? 'bg-green-50'
              : checkResult === 'Incorrect'
              ? 'bg-red-50'
              : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {checkResult === 'Correct' ? (
              <>
                <span className="text-2xl">✓</span>
                <span className="font-bold text-green-700">Correct!</span>
              </>
            ) : checkResult === 'Incorrect' ? (
              <>
                <span className="text-2xl">✗</span>
                <span className="font-bold text-red-700">Incorrect</span>
              </>
            ) : (
              <>
                <span className="text-2xl">⊝</span>
                <span className="font-bold text-gray-700">Skipped</span>
              </>
            )}
          </div>

          {/* Show correct answer and solution for incorrect/skipped */}
          {(checkResult === 'Incorrect' || checkResult === 'Skipped') && (
            <div className="mt-3 text-sm">
              <div className="mb-1">
                <span className="text-gray-600">The correct answer is: </span>
                <span className="font-bold text-gray-800">{problem.answer}</span>
              </div>
              {problem.solution && (
                <div>
                  <span className="text-gray-600">Solution: </span>
                  <span className="font-mono text-gray-800">{problem.solution}</span>
                </div>
              )}
            </div>
          )}

          {/* Show solution for correct answers too */}
          {checkResult === 'Correct' && problem.solution && (
            <div className="mt-3 text-sm">
              <span className="text-gray-600">Solution: </span>
              <span className="font-mono text-gray-800">{problem.solution}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}