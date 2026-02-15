import type { PracticeConfig, Operation } from '../../app/store/types';
import { SeededRng } from './rng';
import {
  digitRange,
  getEnabledOperations,
  getMultiplicationBDigitsCap,
  hasCarry,
  hasBorrow,
  countDigits,
} from './problemTypes';

export interface GeneratedOperands {
  op: Operation;
  a: number;
  b: number;
  aDigits: number;
  bDigits: number;
}

/**
 * Choose digit counts for operands based on difficulty and operation.
 */
function chooseDigitCounts(
  rng: SeededRng,
  op: Operation,
  config: PracticeConfig,
): { aDigits: number; bDigits: number } {
  const { maxDigits, difficulty } = config;

  if (op === 'multiplication') {
    const bCap = getMultiplicationBDigitsCap(difficulty, maxDigits);
    const aDigits = rng.nextInt(1, maxDigits);
    const bDigits = rng.nextInt(1, bCap);
    return { aDigits, bDigits };
  }

  if (difficulty === 'Easy') {
    // For Easy, both operands have same digit count to avoid carry/borrow
    const digits = rng.nextInt(1, maxDigits);
    return { aDigits: digits, bDigits: digits };
  }

  // Medium and Hard: any digit count up to maxDigits
  const aDigits = rng.nextInt(1, maxDigits);
  const bDigits = rng.nextInt(1, maxDigits);
  return { aDigits, bDigits };
}

/**
 * Generate operands for a specific operation, respecting all constraints.
 * - Subtraction: a >= b (never negative)
 * - Easy addition: prefer no carry
 * - Easy subtraction: prefer no borrow
 * - Multiplication: result must not exceed 7 digits
 */
export function generateOperands(
  rng: SeededRng,
  op: Operation,
  config: PracticeConfig,
  maxAttempts: number = 20,
): GeneratedOperands {
  const { difficulty } = config;
  const { aDigits, bDigits } = chooseDigitCounts(rng, op, config);

  const aRange = digitRange(aDigits);
  const bRange = digitRange(bDigits);

  // For multiplication, ensure result doesn't exceed 7 digits
  if (op === 'multiplication') {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const a = rng.nextInt(aRange.min, aRange.max);
      const b = rng.nextInt(bRange.min, bRange.max);
      const result = a * b;
      
      if (countDigits(result) <= 7) {
        return { op, a, b, aDigits, bDigits };
      }
    }
    // Fallback: reduce b until result fits
    const a = rng.nextInt(aRange.min, aRange.max);
    let b = rng.nextInt(bRange.min, bRange.max);
    while (countDigits(a * b) > 7 && b > 1) {
      b = Math.floor(b / 2);
    }
    return { op, a, b, aDigits, bDigits };
  }

  // For Easy mode, try to avoid carry/borrow
  if (difficulty === 'Easy' && (op === 'addition' || op === 'subtraction')) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let a = rng.nextInt(aRange.min, aRange.max);
      let b = rng.nextInt(bRange.min, bRange.max);

      // Subtraction: ensure a >= b
      if (op === 'subtraction' && b > a) {
        [a, b] = [b, a];
      }

      // Check carry/borrow
      if (op === 'addition' && !hasCarry(a, b)) {
        return { op, a, b, aDigits, bDigits };
      }
      if (op === 'subtraction' && !hasBorrow(a, b)) {
        return { op, a, b, aDigits, bDigits };
      }
    }
    // Fallback: return last generated pair even if it has carry/borrow
  }

  // Default generation (Medium, Hard, or fallback)
  let a = rng.nextInt(aRange.min, aRange.max);
  let b = rng.nextInt(bRange.min, bRange.max);

  // Subtraction: ensure a >= b (swap if needed)
  if (op === 'subtraction' && b > a) {
    [a, b] = [b, a];
  }

  return { op, a, b, aDigits, bDigits };
}

/**
 * Select an operation from enabled operations.
 */
export function selectOperation(
  rng: SeededRng,
  config: PracticeConfig,
): Operation {
  const enabled = getEnabledOperations(config.operations);
  return rng.pick(enabled);
}