import { describe, it, expect } from 'vitest';
import { generateProblem, generateProblems } from '../domain/generation/problemGenerator';
import { hasCarry, hasBorrow, computeAnswer, digitRange, countDigits } from '../domain/generation/problemTypes';
import { SeededRng } from '../domain/generation/rng';
import type { PracticeConfig } from '../app/store/types';
import { DEFAULT_CONFIG } from '../app/store/types';

function makeConfig(overrides: Partial<PracticeConfig> = {}): PracticeConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe('SeededRng', () => {
  it('produces deterministic results', () => {
    const rng1 = new SeededRng(42);
    const rng2 = new SeededRng(42);
    const results1 = Array.from({ length: 10 }, () => rng1.next());
    const results2 = Array.from({ length: 10 }, () => rng2.next());
    expect(results1).toEqual(results2);
  });

  it('produces values in [0, 1)', () => {
    const rng = new SeededRng(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt returns values in range', () => {
    const rng = new SeededRng(99);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('forProblem produces different seeds for different indices', () => {
    const rng1 = SeededRng.forProblem(42, 0);
    const rng2 = SeededRng.forProblem(42, 1);
    expect(rng1.next()).not.toEqual(rng2.next());
  });
});

describe('digitRange', () => {
  it('returns 1-9 for 1 digit', () => {
    const range = digitRange(1);
    expect(range).toEqual({ min: 1, max: 9 });
  });

  it('returns 10-99 for 2 digits', () => {
    const range = digitRange(2);
    expect(range).toEqual({ min: 10, max: 99 });
  });

  it('returns 100-999 for 3 digits', () => {
    const range = digitRange(3);
    expect(range).toEqual({ min: 100, max: 999 });
  });

  it('returns correct range for 6 digits', () => {
    const range = digitRange(6);
    expect(range).toEqual({ min: 100000, max: 999999 });
  });
});

describe('hasCarry and hasBorrow', () => {
  it('detects carry', () => {
    expect(hasCarry(5, 6)).toBe(true);
    expect(hasCarry(3, 4)).toBe(false);
    expect(hasCarry(18, 12)).toBe(true);
    expect(hasCarry(11, 22)).toBe(false);
  });

  it('detects borrow', () => {
    expect(hasBorrow(5, 3)).toBe(false);
    expect(hasBorrow(10, 5)).toBe(true); // 0 - 5 at ones place
    expect(hasBorrow(33, 21)).toBe(false);
    expect(hasBorrow(32, 15)).toBe(true);
  });
});

describe('Problem Generation', () => {
  it('generates deterministic problems from same seed and index', () => {
    const config = makeConfig();
    const p1 = generateProblem(42, 0, config);
    const p2 = generateProblem(42, 0, config);
    expect(p1.a).toEqual(p2.a);
    expect(p1.b).toEqual(p2.b);
    expect(p1.op).toEqual(p2.op);
    expect(p1.id).toEqual(p2.id);
  });

  it('generates different problems for different indices', () => {
    const config = makeConfig();
    const p1 = generateProblem(42, 0, config);
    const p2 = generateProblem(42, 1, config);
    expect(p1.id).not.toEqual(p2.id);
    // They might coincidentally have same a/b but shouldn't always
  });

  it('generates a batch of problems', () => {
    const config = makeConfig();
    const problems = generateProblems(42, 0, 20, config);
    expect(problems).toHaveLength(20);
    // Check all have unique IDs
    const ids = new Set(problems.map((p) => p.id));
    expect(ids.size).toBe(20);
  });
});

describe('Subtraction Non-Negative Constraint', () => {
  it('never produces negative results (500 problems)', () => {
    const config = makeConfig({
      operations: { addition: false, subtraction: true, multiplication: false },
      maxDigits: 4,
      difficulty: 'Hard',
    });

    const seed = 12345;
    for (let i = 0; i < 500; i++) {
      const problem = generateProblem(seed, i, config);
      expect(problem.op).toBe('subtraction');
      expect(problem.a).toBeGreaterThanOrEqual(problem.b);
      const answer = computeAnswer(problem.a, problem.b, problem.op);
      expect(answer).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Digit Bounds', () => {
  it('aDigits and bDigits never exceed maxDigits', () => {
    for (const maxDigits of [1, 2, 3, 4, 5, 6] as const) {
      const config = makeConfig({
        maxDigits,
        operations: { addition: true, subtraction: true, multiplication: true },
        difficulty: 'Hard',
      });

      for (let i = 0; i < 100; i++) {
        const problem = generateProblem(42, i, config);
        expect(problem.aDigits).toBeLessThanOrEqual(maxDigits);
        expect(problem.bDigits).toBeLessThanOrEqual(maxDigits);
        expect(problem.aDigits).toBeGreaterThanOrEqual(1);
        expect(problem.bDigits).toBeGreaterThanOrEqual(1);

        // Verify actual numbers match claimed digit counts
        const aActualDigits = countDigits(problem.a);
        const bActualDigits = countDigits(problem.b);
        expect(aActualDigits).toBeLessThanOrEqual(maxDigits);
        expect(bActualDigits).toBeLessThanOrEqual(maxDigits);
      }
    }
  });
});

describe('Difficulty Behavior', () => {
  it('Easy addition has no carry in at least 80% of problems', () => {
    const config = makeConfig({
      operations: { addition: true, subtraction: false, multiplication: false },
      maxDigits: 3,
      difficulty: 'Easy',
    });

    let noCarryCount = 0;
    const total = 200;
    const seed = 777;

    for (let i = 0; i < total; i++) {
      const problem = generateProblem(seed, i, config);
      if (!hasCarry(problem.a, problem.b)) {
        noCarryCount++;
      }
    }

    const ratio = noCarryCount / total;
    expect(ratio).toBeGreaterThanOrEqual(0.8);
  });

  it('Easy multiplication caps b to 1 digit', () => {
    const config = makeConfig({
      operations: { addition: false, subtraction: false, multiplication: true },
      maxDigits: 4,
      difficulty: 'Easy',
    });

    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(42, i, config);
      expect(problem.bDigits).toBe(1);
      expect(problem.b).toBeLessThanOrEqual(9);
    }
  });

  it('Medium multiplication caps b to 2 digits', () => {
    const config = makeConfig({
      operations: { addition: false, subtraction: false, multiplication: true },
      maxDigits: 4,
      difficulty: 'Medium',
    });

    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(42, i, config);
      expect(problem.bDigits).toBeLessThanOrEqual(2);
    }
  });
});

describe('Operation Selection', () => {
  it('uses only enabled operations', () => {
    const config = makeConfig({
      operations: { addition: true, subtraction: false, multiplication: false },
    });

    for (let i = 0; i < 100; i++) {
      const problem = generateProblem(42, i, config);
      expect(problem.op).toBe('addition');
    }
  });

  it('uses multiple operations when enabled', () => {
    const config = makeConfig({
      operations: { addition: true, subtraction: true, multiplication: true },
      maxDigits: 2,
    });

    const ops = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const problem = generateProblem(42, i, config);
      ops.add(problem.op);
    }

    expect(ops.has('addition')).toBe(true);
    expect(ops.has('subtraction')).toBe(true);
    expect(ops.has('multiplication')).toBe(true);
  });
});