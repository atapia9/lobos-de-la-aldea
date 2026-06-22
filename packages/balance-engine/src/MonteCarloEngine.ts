import { RoleConfig, TeamType } from '@lobos/game-engine';
import { GameSimulator, SimulationResult } from './GameSimulator.js';

export interface MonteCarloReport {
  iterations: number;
  villageWinRate: number;
  werewolfWinRate: number;
  neutralWinRate: number;
  averageRounds: number;
  balanceScore: number;       // 0–100, higher = more balanced
  verdict: 'BALANCED' | 'WOLF_FAVORED' | 'VILLAGE_FAVORED' | 'UNPLAYABLE';
}

export interface MonteCarloOptions {
  roles: RoleConfig[];
  iterations?: number;
  baseSeed?: number;
}

// Balance score targets ~50% village win rate, penalizes deviation
function computeBalanceScore(villageWinRate: number): number {
  const deviation = Math.abs(villageWinRate - 0.5);
  // Linear penalty: 0 deviation → 100, 0.5 deviation → 0
  return Math.max(0, Math.round((1 - deviation * 2) * 100));
}

function verdict(villageWinRate: number): MonteCarloReport['verdict'] {
  if (villageWinRate >= 0.4 && villageWinRate <= 0.65) return 'BALANCED';
  if (villageWinRate < 0.25 || villageWinRate > 0.85) return 'UNPLAYABLE';
  if (villageWinRate < 0.4) return 'WOLF_FAVORED';
  return 'VILLAGE_FAVORED';
}

export class MonteCarloEngine {
  private readonly simulator = new GameSimulator();

  run(options: MonteCarloOptions): MonteCarloReport {
    const { roles, iterations = 1000, baseSeed = 42 } = options;

    const wins = { [TeamType.VILLAGE]: 0, [TeamType.WEREWOLF]: 0, [TeamType.NEUTRAL]: 0 };
    let totalRounds = 0;

    for (let i = 0; i < iterations; i++) {
      const result: SimulationResult = this.simulator.simulate(roles, baseSeed + i);
      wins[result.winner] = (wins[result.winner] ?? 0) + 1;
      totalRounds += result.rounds;
    }

    const villageWinRate = wins[TeamType.VILLAGE] / iterations;
    const werewolfWinRate = wins[TeamType.WEREWOLF] / iterations;
    const neutralWinRate = wins[TeamType.NEUTRAL] / iterations;

    return {
      iterations,
      villageWinRate,
      werewolfWinRate,
      neutralWinRate,
      averageRounds: totalRounds / iterations,
      balanceScore: computeBalanceScore(villageWinRate),
      verdict: verdict(villageWinRate),
    };
  }
}
