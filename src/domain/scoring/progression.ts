import type { MaxDigits, Difficulty } from '../../app/store/types';

/**
 * Automatic progression engine.
 * Adjusts maxDigits and difficulty based on streak performance.
 */
export interface ProgressionResult {
  newMaxDigits: MaxDigits;
  newDifficulty: Difficulty;
  changed: boolean;
}

const DIGITS_VALUES: MaxDigits[] = [1, 2, 3, 4, 5, 6];
const DIFFICULTY_ORDER: Difficulty[] = ['Easy', 'Medium', 'Hard'];

/**
 * Compute progression adjustments based on current streaks.
 *
 * Rules:
 * - If correctInARow >= 5, increase maxDigits by 1 (up to 6)
 * - If incorrectInARow >= 3, decrease maxDigits by 1 (down to 1)
 * - If maxDigits is stable (at max or min), shift difficulty
 */
export function computeProgression(
  currentMaxDigits: MaxDigits,
  currentDifficulty: Difficulty,
  streaks: { correctInARow: number; incorrectInARow: number },
): ProgressionResult {
  let newMaxDigits = currentMaxDigits;
  let newDifficulty = currentDifficulty;
  let changed = false;

  if (streaks.correctInARow >= 5) {
    // Try to increase maxDigits
    const currentIdx = DIGITS_VALUES.indexOf(currentMaxDigits);
    if (currentIdx < DIGITS_VALUES.length - 1) {
      newMaxDigits = DIGITS_VALUES[currentIdx + 1];
      changed = true;
    } else {
      // At max digits, try to increase difficulty
      const diffIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty);
      if (diffIdx < DIFFICULTY_ORDER.length - 1) {
        newDifficulty = DIFFICULTY_ORDER[diffIdx + 1];
        changed = true;
      }
    }
  } else if (streaks.incorrectInARow >= 3) {
    // Try to decrease maxDigits
    const currentIdx = DIGITS_VALUES.indexOf(currentMaxDigits);
    if (currentIdx > 0) {
      newMaxDigits = DIGITS_VALUES[currentIdx - 1];
      changed = true;
    } else {
      // At min digits, try to decrease difficulty
      const diffIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty);
      if (diffIdx > 0) {
        newDifficulty = DIFFICULTY_ORDER[diffIdx - 1];
        changed = true;
      }
    }
  }

  return { newMaxDigits, newDifficulty, changed };
}

/**
 * Update streak counts after a check result.
 */
export function updateStreaks(
  streaks: { correctInARow: number; incorrectInARow: number },
  isCorrect: boolean,
): { correctInARow: number; incorrectInARow: number } {
  if (isCorrect) {
    return {
      correctInARow: streaks.correctInARow + 1,
      incorrectInARow: 0,
    };
  }
  return {
    correctInARow: 0,
    incorrectInARow: streaks.incorrectInARow + 1,
  };
}