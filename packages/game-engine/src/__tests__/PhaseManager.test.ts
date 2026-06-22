import { describe, it, expect } from 'vitest';
import { PhaseManager } from '../PhaseManager.js';
import { PhaseType } from '../types.js';

describe('PhaseManager', () => {
  const pm = new PhaseManager();

  it('advances SETUP → NIGHT', () => {
    expect(pm.advance(PhaseType.SETUP)).toBe(PhaseType.NIGHT);
  });

  it('advances NIGHT → DAWN', () => {
    expect(pm.advance(PhaseType.NIGHT)).toBe(PhaseType.DAWN);
  });

  it('advances DAWN → DISCUSSION', () => {
    expect(pm.advance(PhaseType.DAWN)).toBe(PhaseType.DISCUSSION);
  });

  it('advances DISCUSSION → VOTING', () => {
    expect(pm.advance(PhaseType.DISCUSSION)).toBe(PhaseType.VOTING);
  });

  it('advances VOTING → RESOLUTION', () => {
    expect(pm.advance(PhaseType.VOTING)).toBe(PhaseType.RESOLUTION);
  });

  it('advances RESOLUTION → NIGHT (next cycle)', () => {
    expect(pm.advance(PhaseType.RESOLUTION)).toBe(PhaseType.NIGHT);
  });

  it('GAME_OVER stays GAME_OVER', () => {
    expect(pm.advance(PhaseType.GAME_OVER)).toBe(PhaseType.GAME_OVER);
  });

  it('isTerminal returns true only for GAME_OVER', () => {
    expect(pm.isTerminal(PhaseType.GAME_OVER)).toBe(true);
    expect(pm.isTerminal(PhaseType.NIGHT)).toBe(false);
  });

  it('isNightPhase identifies NIGHT correctly', () => {
    expect(pm.isNightPhase(PhaseType.NIGHT)).toBe(true);
    expect(pm.isNightPhase(PhaseType.DISCUSSION)).toBe(false);
  });

  it('isVotingPhase identifies VOTING correctly', () => {
    expect(pm.isVotingPhase(PhaseType.VOTING)).toBe(true);
    expect(pm.isVotingPhase(PhaseType.NIGHT)).toBe(false);
  });
});
