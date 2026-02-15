import { WordProblemSchema, type WordProblem } from './types';
import { validateProblemsDataset } from './validator';

// Cache for loaded problems
const problemsCache: Map<string, WordProblem[]> = new Map();

/**
 * Loads word problems for a specific difficulty level.
 * Uses dynamic imports for lazy loading and caching.
 */
export async function loadWordProblems(
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<WordProblem[]> {
  // Check cache first
  if (problemsCache.has(difficulty)) {
    return problemsCache.get(difficulty)!;
  }

  try {
    let data: unknown;

    // Dynamic import based on difficulty
    switch (difficulty) {
      case 'easy':
        data = (await import('../../data/wordproblems/easy.json')).default;
        break;
      case 'medium':
        data = (await import('../../data/wordproblems/medium.json')).default;
        break;
      case 'hard':
        data = (await import('../../data/wordproblems/hard.json')).default;
        break;
      default:
        throw new Error(`Unknown difficulty: ${difficulty}`);
    }

    // Validate the data structure
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format for ${difficulty} problems`);
    }

    // Validate each problem against the schema
    const problems: WordProblem[] = [];
    for (const item of data) {
      try {
        const problem = WordProblemSchema.parse(item);
        problems.push(problem);
      } catch (error) {
        console.warn(`Skipping invalid problem ${item.id}:`, error);
      }
    }

    if (problems.length === 0) {
      throw new Error(`No valid problems found for ${difficulty}`);
    }

    // Cache the validated problems
    problemsCache.set(difficulty, problems);

    return problems;
  } catch (error) {
    console.error(`Failed to load ${difficulty} word problems:`, error);
    throw error;
  }
}

/**
 * Validates all word problems in a difficulty level.
 * Useful for development/debugging to check solution strings.
 */
export async function validateWordProblemsFile(
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<{
  total: number;
  valid: number;
  errors: Array<{ id: string; error: string; solution: string; answer: number }>;
}> {
  const problems = await loadWordProblems(difficulty);
  const errors = validateProblemsDataset(problems);

  return {
    total: problems.length,
    valid: problems.length - errors.length,
    errors,
  };
}

/**
 * Selects random word problems from a difficulty level.
 */
export async function selectRandomWordProblems(
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Promise<WordProblem[]> {
  const allProblems = await loadWordProblems(difficulty);

  // If requesting more problems than available, return all
  if (count >= allProblems.length) {
    return [...allProblems];
  }

  // Fisher-Yates shuffle to get random problems
  const shuffled = [...allProblems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * Clears the problems cache.
 * Useful for testing or forcing a reload.
 */
export function clearProblemsCache(): void {
  problemsCache.clear();
}