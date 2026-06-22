import { RoleConfig, TeamType, SeededRandom } from '@lobos/game-engine';
import { VictoryRuleEngine } from '@lobos/rules-engine';
import { PhaseType, EventType } from '@lobos/game-engine';

export interface SimulatedPlayer {
  id: string;
  role: RoleConfig;
  alive: boolean;
  team: TeamType;
}

export interface SimulationResult {
  winner: TeamType;
  rounds: number;
  survivorCount: number;
}

// Lightweight game simulator — no full GameEngine to keep it fast for Monte Carlo
export class GameSimulator {
  private readonly victoryEngine = new VictoryRuleEngine();

  simulate(roles: RoleConfig[], seed: number): SimulationResult {
    const rng = new SeededRandom(seed);
    const shuffled = rng.shuffle(roles);

    const players: SimulatedPlayer[] = shuffled.map((role, i) => ({
      id: `p${i}`,
      role,
      alive: true,
      team: role.team,
    }));

    let rounds = 0;
    const MAX_ROUNDS = 20;

    while (rounds < MAX_ROUNDS) {
      rounds++;

      // Night: werewolves pick a random village target
      const wolves = players.filter((p) => p.alive && p.team === TeamType.WEREWOLF);
      const villagers = players.filter((p) => p.alive && p.team === TeamType.VILLAGE);

      if (wolves.length > 0 && villagers.length > 0) {
        const targetIdx = Math.floor(rng.next() * villagers.length);
        villagers[targetIdx].alive = false;
      }

      // Check victory after night
      const nightWinner = this.checkWinner(players);
      if (nightWinner !== null) {
        return { winner: nightWinner, rounds, survivorCount: players.filter((p) => p.alive).length };
      }

      // Day: village votes out a random alive player (simplified — equal chance)
      const alive = players.filter((p) => p.alive);
      if (alive.length > 1) {
        const execIdx = Math.floor(rng.next() * alive.length);
        alive[execIdx].alive = false;
      }

      const dayWinner = this.checkWinner(players);
      if (dayWinner !== null) {
        return { winner: dayWinner, rounds, survivorCount: players.filter((p) => p.alive).length };
      }
    }

    // Timeout: give it to whoever's ahead
    const wolves = players.filter((p) => p.alive && p.team === TeamType.WEREWOLF).length;
    const vils = players.filter((p) => p.alive && p.team === TeamType.VILLAGE).length;
    return {
      winner: wolves >= vils ? TeamType.WEREWOLF : TeamType.VILLAGE,
      rounds,
      survivorCount: players.filter((p) => p.alive).length,
    };
  }

  private checkWinner(players: SimulatedPlayer[]): TeamType | null {
    const alive = players.filter((p) => p.alive);
    const wolves = alive.filter((p) => p.team === TeamType.WEREWOLF).length;
    const vils = alive.filter((p) => p.team === TeamType.VILLAGE).length;

    if (wolves === 0) return TeamType.VILLAGE;
    if (wolves >= vils) return TeamType.WEREWOLF;
    return null;
  }
}
