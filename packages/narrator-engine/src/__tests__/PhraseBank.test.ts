import { describe, it, expect } from 'vitest';
import { PhraseBank } from '../PhraseBank.js';

const PHRASES = {
  NIGHT_STARTED: [
    'La oscuridad cae.',
    'La luna llena brilla.',
    'Silencio en la aldea.',
    'Algo acecha.',
  ],
};

describe('PhraseBank', () => {
  it('picks a phrase from loaded category', () => {
    const bank = new PhraseBank(42);
    bank.load('night', PHRASES);
    const phrase = bank.pick('night.NIGHT_STARTED');
    expect(PHRASES.NIGHT_STARTED).toContain(phrase);
  });

  it('returns fallback for unknown key', () => {
    const bank = new PhraseBank(1);
    const result = bank.pick('missing.KEY');
    expect(result).toBe('[missing.KEY]');
  });

  it('has() returns true for loaded keys', () => {
    const bank = new PhraseBank(1);
    bank.load('night', PHRASES);
    expect(bank.has('night.NIGHT_STARTED')).toBe(true);
  });

  it('has() returns false for unknown keys', () => {
    const bank = new PhraseBank(1);
    expect(bank.has('foo.BAR')).toBe(false);
  });

  it('is deterministic: same seed picks same phrase', () => {
    const b1 = new PhraseBank(99);
    const b2 = new PhraseBank(99);
    b1.load('night', PHRASES);
    b2.load('night', PHRASES);
    expect(b1.pick('night.NIGHT_STARTED')).toBe(b2.pick('night.NIGHT_STARTED'));
  });

  it('setSeed resets the random sequence', () => {
    const bank = new PhraseBank(1);
    bank.load('night', PHRASES);
    bank.setSeed(42);
    const first = bank.pick('night.NIGHT_STARTED');
    bank.setSeed(42);
    const second = bank.pick('night.NIGHT_STARTED');
    expect(first).toBe(second);
  });

  it('different seeds can pick different phrases', () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const bank = new PhraseBank(i * 7919 + i * i + 1);
      bank.load('night', PHRASES);
      results.add(bank.pick('night.NIGHT_STARTED'));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('loads multiple categories independently', () => {
    const bank = new PhraseBank(1);
    bank.load('night', { A: ['night-a'] });
    bank.load('day', { A: ['day-a'] });
    expect(bank.pick('night.A')).toBe('night-a');
    expect(bank.pick('day.A')).toBe('day-a');
  });
});
