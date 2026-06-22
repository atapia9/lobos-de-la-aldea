import { PhaseType } from './types.js';

const TRANSITIONS: Record<PhaseType, PhaseType> = {
  [PhaseType.SETUP]: PhaseType.NIGHT,
  [PhaseType.NIGHT]: PhaseType.DAWN,
  [PhaseType.DAWN]: PhaseType.DISCUSSION,
  [PhaseType.DISCUSSION]: PhaseType.VOTING,
  [PhaseType.VOTING]: PhaseType.RESOLUTION,
  [PhaseType.RESOLUTION]: PhaseType.NIGHT,
  [PhaseType.GAME_OVER]: PhaseType.GAME_OVER,
};

export class PhaseManager {
  advance(current: PhaseType): PhaseType {
    return TRANSITIONS[current];
  }

  isTerminal(phase: PhaseType): boolean {
    return phase === PhaseType.GAME_OVER;
  }

  isNightPhase(phase: PhaseType): boolean {
    return phase === PhaseType.NIGHT;
  }

  isVotingPhase(phase: PhaseType): boolean {
    return phase === PhaseType.VOTING;
  }
}
