import type { Problem, Operation } from '../../app/store/types';
import { computeAnswer } from '../generation/problemTypes';

/**
 * Check if a given answer is correct for a problem.
 */
export function isAnswerCorrect(problem: Problem, answer: number): boolean {
  return computeAnswer(problem.a, problem.b, problem.op) === answer;
}

/**
 * Get the correct answer for a problem.
 */
export function getCorrectAnswer(problem: Problem): number {
  return computeAnswer(problem.a, problem.b, problem.op);
}