/**
 * Seeded pseudo-random number generator using Mulberry32 algorithm.
 * Deterministic: same seed always produces the same sequence.
 */
export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Pick a random element from an array */
  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  /**
   * Create a child RNG for a specific problem index.
   * This ensures each problem is independently reproducible.
   */
  static forProblem(seed: number, index: number): SeededRng {
    // Combine seed and index to create a unique child seed
    const childSeed = seed * 2654435761 + index * 2246822519;
    return new SeededRng(childSeed);
  }
}