import { z } from 'zod/v4';

// ── Word Problem Types ───────────────────────────────────────────────

export type WordProblemOperation = 'a' | 's' | 'm' | 'd';

export const WordProblemOperationSchema = z.enum(['a', 's', 'm', 'd']);

export interface WordProblem {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  answer: number;
  operation: WordProblemOperation[];
  solution: string;
}

export const WordProblemSchema = z.object({
  id: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  text: z.string(),
  answer: z.number(),
  operation: z.array(WordProblemOperationSchema),
  solution: z.string(),
});

// ── Word Problem Session ─────────────────────────────────────────────

export interface WordProblemSession {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  startedAt: number;
  completedAt?: number;
  status: 'active' | 'completed';
  problems: WordProblem[];
  currentIndex: number;
  answers: Record<string, number | null>;
  checkResults: Record<string, 'Correct' | 'Incorrect' | 'Skipped'>;
}

// ── Validation Result ────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  computedAnswer?: number;
  error?: string;
}