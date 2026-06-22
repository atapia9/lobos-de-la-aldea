import { GameState, GameEvent, Player, TeamType, RoleType, EventType } from '@lobos/game-engine';

export interface VictoryResult {
  winner: TeamType | null;
  winnerRoleType?: RoleType;
  reason: string;
}

export interface VictoryRule {
  id: string;
  evaluate(state: GameState): VictoryResult | null;
}

export class JesterVictoryRule implements VictoryRule {
  id = 'jester';

  evaluate(state: GameState): VictoryResult | null {
    const executedViaVote = state.events.find((e: GameEvent) => {
      if (e.type !== EventType.PLAYER_EXECUTED) return false;
      const player = state.players.find((p: Player) => p.id === (e.payload['playerId'] as string));
      return player?.role.roleType === RoleType.JESTER;
    });

    if (executedViaVote) {
      return {
        winner: TeamType.NEUTRAL,
        winnerRoleType: RoleType.JESTER,
        reason: 'Jester was executed by village vote',
      };
    }
    return null;
  }
}

export class VillageVictoryRule implements VictoryRule {
  id = 'village';

  evaluate(state: GameState): VictoryResult | null {
    const werewolvesAlive = state.players.filter(
      (p: Player) => p.alive && p.role.team === TeamType.WEREWOLF
    ).length;

    if (werewolvesAlive === 0) {
      return { winner: TeamType.VILLAGE, reason: 'All werewolves eliminated' };
    }
    return null;
  }
}

export class WerewolfVictoryRule implements VictoryRule {
  id = 'werewolf';

  evaluate(state: GameState): VictoryResult | null {
    const alive = state.players.filter((p: Player) => p.alive);
    const werewolvesAlive = alive.filter((p: Player) => p.role.team === TeamType.WEREWOLF).length;
    const villagersAlive = alive.filter((p: Player) => p.role.team === TeamType.VILLAGE).length;

    if (werewolvesAlive >= villagersAlive && werewolvesAlive > 0) {
      return { winner: TeamType.WEREWOLF, reason: 'Werewolves outnumber or equal villagers' };
    }
    return null;
  }
}

export class VictoryRuleEngine {
  // Rules evaluated in order — first match wins
  private rules: VictoryRule[] = [
    new JesterVictoryRule(),
    new VillageVictoryRule(),
    new WerewolfVictoryRule(),
  ];

  addRule(rule: VictoryRule, atIndex?: number): void {
    if (atIndex !== undefined) {
      this.rules.splice(atIndex, 0, rule);
    } else {
      this.rules.push(rule);
    }
  }

  evaluate(state: GameState): VictoryResult {
    for (const rule of this.rules) {
      const result = rule.evaluate(state);
      if (result) return result;
    }
    return { winner: null, reason: 'Game continues' };
  }

  getRules(): readonly VictoryRule[] {
    return this.rules;
  }
}
