import { useMemo, useCallback, useState, useEffect } from 'react';
import type { Problem, PracticeConfig, CheckResult } from '../../app/store/types';
import { generateProblems, createSeed } from '../../domain/generation/problemGenerator';
import { ProblemCard } from './ProblemCard';

interface ProblemGridProps {
  config: PracticeConfig;
  sessionProblems?: Problem[];
  sessionStatus?: 'active' | 'completed' | null;
  toolColor: string;
  toolSize: number;
  toolMode: 'pen' | 'eraser';
  onCheck?: (problemId: string, result: CheckResult) => void;
  clearInkVersion?: number;
}

const BATCH_SIZE = 12;

export function ProblemGrid({
  config,
  sessionProblems,
  sessionStatus,
  toolColor,
  toolSize,
  toolMode,
  onCheck,
  clearInkVersion,
}: ProblemGridProps) {
  const [seed] = useState(() => createSeed());
  const [problemCount, setProblemCount] = useState(BATCH_SIZE);

  // Generate problems for free practice mode
  const problems = useMemo(() => {
    if (sessionProblems) return sessionProblems;
    return generateProblems(seed, 0, problemCount, config);
  }, [seed, problemCount, config, sessionProblems]);

  // Infinite scroll handler for free practice
  const handleScroll = useCallback(() => {
    if (sessionProblems) return; // No infinite scroll in session mode

    const scrollBottom =
      document.documentElement.scrollHeight -
      document.documentElement.scrollTop -
      document.documentElement.clientHeight;

    if (scrollBottom < 500) {
      setProblemCount((prev) => prev + BATCH_SIZE);
    }
  }, [sessionProblems]);

  useEffect(() => {
    if (sessionProblems) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, sessionProblems]);

  // Reset problems when config changes in free practice mode
  useEffect(() => {
    if (!sessionProblems) {
      setProblemCount(BATCH_SIZE);
    }
  }, [config.operations, config.maxDigits, config.difficulty, sessionProblems]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {problems.map((problem) => (
        <ProblemCard
          key={problem.id}
          problem={problem}
          guidedMode={config.guidedMode}
          toolColor={toolColor}
          toolSize={toolSize}
          toolMode={toolMode}
          checkMode={config.checkMode}
          sessionStatus={sessionStatus}
          onCheck={onCheck}
          clearInkVersion={clearInkVersion}
        />
      ))}
    </div>
  );
}