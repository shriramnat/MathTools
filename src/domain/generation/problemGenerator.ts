import type { PracticeConfig, Problem } from '../../app/store/types';
import { SeededRng } from './rng';
import { selectOperation, generateOperands } from './rules';

/**
 * Generate a single problem deterministically from seed, index, and config.
 * Pure function: same inputs always produce the same output.
 */
export function generateProblem(
  seed: number,
  index: number,
  config: PracticeConfig,
): Problem {
  const rng = SeededRng.forProblem(seed, index);

  // Select operation
  const op = selectOperation(rng, config);

  // Generate operands
  const operands = generateOperands(rng, op, config);

  return {
    id: `p-${seed}-${index}`,
    seed,
    index,
    op: operands.op,
    a: operands.a,
    b: operands.b,
    aDigits: operands.aDigits,
    bDigits: operands.bDigits,
    createdAt: Date.now(),
  };
}

/**
 * Generate a batch of problems for a session or initial load.
 */
export function generateProblems(
  seed: number,
  startIndex: number,
  count: number,
  config: PracticeConfig,
): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count; i++) {
    problems.push(generateProblem(seed, startIndex + i, config));
  }
  return problems;
}

/**
 * Create a new random seed for sessions or free practice.
 */
export function createSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}