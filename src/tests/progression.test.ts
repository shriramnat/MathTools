import { describe, it, expect } from 'vitest';
import { computeProgression, updateStreaks } from '../domain/scoring/progression';

describe('computeProgression', () => {
  it('increases maxDigits after 5 correct in a row', () => {
    const result = computeProgression(2, 'Easy', { correctInARow: 5, incorrectInARow: 0 });
    expect(result.newMaxDigits).toBe(3);
    expect(result.changed).toBe(true);
  });

  it('does not change below threshold', () => {
    const result = computeProgression(2, 'Easy', { correctInARow: 4, incorrectInARow: 0 });
    expect(result.newMaxDigits).toBe(2);
    expect(result.changed).toBe(false);
  });

  it('decreases maxDigits after 3 incorrect in a row', () => {
    const result = computeProgression(3, 'Medium', { correctInARow: 0, incorrectInARow: 3 });
    expect(result.newMaxDigits).toBe(2);
    expect(result.changed).toBe(true);
  });

  it('does not decrease below 1', () => {
    const result = computeProgression(1, 'Easy', { correctInARow: 0, incorrectInARow: 3 });
    expect(result.newMaxDigits).toBe(1);
    // Should try to decrease difficulty instead, but Easy is minimum
    expect(result.changed).toBe(false);
  });

  it('increases difficulty when maxDigits is at max', () => {
    const result = computeProgression(6, 'Medium', { correctInARow: 5, incorrectInARow: 0 });
    expect(result.newMaxDigits).toBe(6);
    expect(result.newDifficulty).toBe('Hard');
    expect(result.changed).toBe(true);
  });

  it('decreases difficulty when at min digits and incorrect streak', () => {
    const result = computeProgression(1, 'Medium', { correctInARow: 0, incorrectInARow: 3 });
    expect(result.newMaxDigits).toBe(1);
    expect(result.newDifficulty).toBe('Easy');
    expect(result.changed).toBe(true);
  });

  it('does not change when at max everything', () => {
    const result = computeProgression(6, 'Hard', { correctInARow: 5, incorrectInARow: 0 });
    expect(result.changed).toBe(false);
  });
});

describe('updateStreaks', () => {
  it('increments correct streak on correct answer', () => {
    const result = updateStreaks({ correctInARow: 3, incorrectInARow: 0 }, true);
    expect(result.correctInARow).toBe(4);
    expect(result.incorrectInARow).toBe(0);
  });

  it('resets correct streak on incorrect answer', () => {
    const result = updateStreaks({ correctInARow: 3, incorrectInARow: 0 }, false);
    expect(result.correctInARow).toBe(0);
    expect(result.incorrectInARow).toBe(1);
  });

  it('resets incorrect streak on correct answer', () => {
    const result = updateStreaks({ correctInARow: 0, incorrectInARow: 2 }, true);
    expect(result.correctInARow).toBe(1);
    expect(result.incorrectInARow).toBe(0);
  });
});