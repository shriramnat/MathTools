import type { Operation, MaxDigits, Difficulty } from '../../app/store/types';

/** Range for a number with the given digit count */
export function digitRange(digits: number): { min: number; max: number } {
  if (digits === 1) return { min: 1, max: 9 };
  return { min: Math.pow(10, digits - 1), max: Math.pow(10, digits) - 1 };
}

/** Get the number of digits in a number */
export function countDigits(n: number): number {
  if (n === 0) return 1;
  return Math.floor(Math.log10(Math.abs(n))) + 1;
}

/** Compute the correct answer for a problem */
export function computeAnswer(a: number, b: number, op: Operation): number {
  switch (op) {
    case 'addition':
      return a + b;
    case 'subtraction':
      return a - b;
    case 'multiplication':
      return a * b;
  }
}

/** Get the operator symbol for display */
export function operatorSymbol(op: Operation): string {
  switch (op) {
    case 'addition':
      return '+';
    case 'subtraction':
      return '−'; // Using proper minus sign
    case 'multiplication':
      return '×';
  }
}

/** Get enabled operations from config */
export function getEnabledOperations(operations: {
  addition: boolean;
  subtraction: boolean;
  multiplication: boolean;
}): Operation[] {
  const enabled: Operation[] = [];
  if (operations.addition) enabled.push('addition');
  if (operations.subtraction) enabled.push('subtraction');
  if (operations.multiplication) enabled.push('multiplication');
  // Fallback: if nothing enabled, default to addition
  if (enabled.length === 0) enabled.push('addition');
  return enabled;
}

/** Get max bDigits for multiplication based on difficulty */
export function getMultiplicationBDigitsCap(
  difficulty: Difficulty,
  maxDigits: MaxDigits,
): number {
  switch (difficulty) {
    case 'Easy':
      return 1;
    case 'Medium':
      return Math.min(2, maxDigits);
    case 'Hard':
      return maxDigits;
  }
}

/** Check if addition produces a carry at any digit position */
export function hasCarry(a: number, b: number): boolean {
  let carry = 0;
  while (a > 0 || b > 0) {
    const digitSum = (a % 10) + (b % 10) + carry;
    if (digitSum >= 10) return true;
    carry = digitSum >= 10 ? 1 : 0;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

/** Check if subtraction requires borrowing at any digit position */
export function hasBorrow(a: number, b: number): boolean {
  let borrow = 0;
  while (a > 0 || b > 0) {
    const aDigit = (a % 10) - borrow;
    const bDigit = b % 10;
    if (aDigit < bDigit) return true;
    borrow = aDigit < bDigit ? 1 : 0;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}