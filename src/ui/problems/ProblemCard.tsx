import React, { useState, useCallback } from 'react';
import type { Problem, CheckResult } from '../../app/store/types';
import { ProblemCanvas } from '../canvas/ProblemCanvas';
import { computeAnswer } from '../../domain/generation/problemTypes';
import { useTheme } from '../../theme/themeProvider';

interface ProblemCardProps {
  problem: Problem;
  guidedMode: boolean;
  toolColor: string;
  toolSize: number;
  toolMode: 'pen' | 'eraser';
  checkMode: 'Manual' | 'Off';
  sessionStatus?: 'active' | 'completed' | null;
  onCheck?: (problemId: string, result: CheckResult) => void;
  clearInkVersion?: number;
}

export const ProblemCard = React.memo(function ProblemCard({
  problem,
  guidedMode,
  toolColor,
  toolSize,
  toolMode,
  checkMode,
  sessionStatus,
  onCheck,
  clearInkVersion,
}: ProblemCardProps) {
  const theme = useTheme();
  const [showAnswer, setShowAnswer] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [showCheckPanel, setShowCheckPanel] = useState(false);

  const answer = computeAnswer(problem.a, problem.b, problem.op);

  const handleReveal = useCallback(() => {
    setShowAnswer((prev) => !prev);
  }, []);

  const handleMarkCorrect = useCallback(() => {
    setCheckResult('Correct');
    setShowCheckPanel(false);
    onCheck?.(problem.id, 'Correct');
  }, [problem.id, onCheck]);

  const handleMarkIncorrect = useCallback(() => {
    setCheckResult('Incorrect');
    setShowCheckPanel(false);
    onCheck?.(problem.id, 'Incorrect');
  }, [problem.id, onCheck]);

  const toggleCheckPanel = useCallback(() => {
    setShowCheckPanel((prev) => !prev);
  }, []);

  return (
    <div
      className="rounded-xl border-2 overflow-hidden transition-shadow hover:shadow-md"
      style={{
        backgroundColor: theme.colors.bgCard,
        borderColor: checkResult === 'Correct'
          ? theme.colors.success
          : checkResult === 'Incorrect'
            ? theme.colors.error
            : theme.colors.cardBorder,
      }}
    >
      {/* Canvas area */}
      <div className="p-2">
        <ProblemCanvas
          problem={problem}
          guidedMode={guidedMode}
          toolColor={toolColor}
          toolSize={toolSize}
          toolMode={toolMode}
          showAnswer={showAnswer}
          checkResult={checkResult === 'Skipped' ? null : checkResult}
          clearInkVersion={clearInkVersion}
        />
      </div>

      {/* Check panel (Manual mode only, hidden during active session) */}
      {checkMode === 'Manual' && sessionStatus !== 'active' && (
        <div className="border-t px-3 py-2" style={{ borderColor: theme.colors.cardBorder }}>
          {!showCheckPanel ? (
            <button
              onClick={toggleCheckPanel}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors w-full"
              style={{
                backgroundColor: `${theme.colors.accent}15`,
                color: theme.colors.accent,
              }}
            >
              🧐 Verify your answers
            </button>
          ) : (
            <div className="space-y-2">
              {/* Answer reveal */}
              <button
                onClick={handleReveal}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors w-full font-medium"
                style={{
                  backgroundColor: showAnswer ? `${theme.colors.accent}25` : `${theme.colors.accent}10`,
                  color: theme.colors.accent,
                }}
              >
                {showAnswer ? `Answer: ${answer}` : '👁 Reveal Answer'}
              </button>

              {/* Mark buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleMarkCorrect}
                  className="flex-1 text-xs font-bold px-3 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: theme.colors.success }}
                >
                  ✓ Correct
                </button>
                <button
                  onClick={handleMarkIncorrect}
                  className="flex-1 text-xs font-bold px-3 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: theme.colors.error }}
                >
                  ✗ Incorrect
                </button>
              </div>

              {/* Close */}
              <button
                onClick={toggleCheckPanel}
                className="text-xs text-gray-400 w-full"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});