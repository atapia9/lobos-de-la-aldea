import { GameState } from './models.js';
import { TeamType, RoleType } from './types.js';

export interface VictoryResult {
  winner: TeamType | null;
  winnerRoleType?: RoleType;
  reason: string;
}

export class VictoryEngine {
  evaluate(state: GameState): VictoryResult {
    const alive = state.players.filter((p) => p.alive);
    const werewolvesAlive = alive.filter((p) => p.role.team === TeamType.WEREWOLF).length;
    const villagersAlive = alive.filter((p) => p.role.team === TeamType.VILLAGE).length;

    // Jester win: checked before other conditions via event history
    const jesterWon = state.events.some((e) => {
      if (e.type !== 'PLAYER_EXECUTED') return false;
      const playerId = e.payload['playerId'] as string;
      const player = state.players.find((p) => p.id === playerId);
      return player?.role.roleType === RoleType.JESTER;
    });
    if (jesterWon) {
      return { winner: TeamType.NEUTRAL, winnerRoleType: RoleType.JESTER, reason: 'Jester was executed by vote' };
    }

    // Village wins when all werewolves eliminated
    if (werewolvesAlive === 0) {
      return { winner: TeamType.VILLAGE, reason: 'All werewolves eliminated' };
    }

    // Werewolves win when they outnumber or equal villagers
    if (werewolvesAlive >= villagersAlive) {
      return { winner: TeamType.WEREWOLF, reason: 'Werewolves outnumber villagers' };
    }

    return { winner: null, reason: 'Game continues' };
  }
}
