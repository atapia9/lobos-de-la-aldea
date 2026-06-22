import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../SeededRandom.js';

describe('SeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
    expect(a.next()).toBe(b.next());
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('nextInt returns values in range', () => {
    const rng = new SeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    }
  });

  it('shuffle produces a permutation of same elements', () => {
    const rng = new SeededRandom(7);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('shuffle does not mutate original array', () => {
    const rng = new SeededRandom(7);
    const arr = [1, 2, 3];
    rng.shuffle(arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});
