import { useTheme } from '../../theme/themeProvider';

interface NavigationButtonsProps {
  currentIndex: number;
  totalProblems: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onComplete: () => void;
}

export function NavigationButtons({
  currentIndex,
  totalProblems,
  onNavigate,
  onComplete,
}: NavigationButtonsProps) {
  const theme = useTheme();

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalProblems - 1;

  return (
    <div className="space-y-3">
      {/* Navigation arrows */}
      <div className="flex gap-3">
        <button
          onClick={() => onNavigate('prev')}
          disabled={isFirst}
          className="flex-1 px-4 py-3 font-medium rounded-lg border-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: theme.colors.cardBorder,
            color: theme.colors.accent,
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => onNavigate('next')}
          disabled={isLast}
          className="flex-1 px-4 py-3 font-medium rounded-lg border-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: theme.colors.cardBorder,
            color: theme.colors.accent,
          }}
        >
          Next →
        </button>
      </div>

      {/* Complete button */}
      <button
        onClick={onComplete}
        className="w-full px-4 py-3 font-bold rounded-lg text-white transition-colors"
        style={{ backgroundColor: theme.colors.accent }}
      >
        I'm Done!
      </button>
    </div>
  );
}