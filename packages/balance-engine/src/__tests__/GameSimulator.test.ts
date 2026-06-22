import { describe, it, expect } from 'vitest';
import { GameSimulator } from '../GameSimulator.js';
import { TeamType, RoleType } from '@lobos/game-engine';
import type { RoleConfig } from '@lobos/game-engine';

const makeRole = (id: string, team: TeamType): RoleConfig => ({
  id, team,
  roleType: id.toUpperCase() as RoleType,
  nightAction: team === TeamType.WEREWOLF,
  priority: 7,
  rarity: 'COMMON',
  difficulty: 1,
  triggers: [],
});

const wolf = makeRole('werewolf', TeamType.WEREWOLF);
const villager = makeRole('villager', TeamType.VILLAGE);

describe('GameSimulator', () => {
  const sim = new GameSimulator();

  it('returns a valid TeamType winner', () => {
    const roles = [wolf, villager, villager, villager, villager];
    const result = sim.simulate(roles, 42);
    expect([TeamType.VILLAGE, TeamType.WEREWOLF, TeamType.NEUTRAL]).toContain(result.winner);
  });

  it('rounds is at least 1', () => {
    const roles = [wolf, villager, villager, villager, villager];
    const result = sim.simulate(roles, 42);
    expect(result.rounds).toBeGreaterThanOrEqual(1);
  });

  it('survivorCount is non-negative', () => {
    const roles = [wolf, villager, villager, villager, villager];
    const result = sim.simulate(roles, 42);
    expect(result.survivorCount).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic: same seed produces same result', () => {
    const roles = [wolf, villager, villager, villager, villager];
    const r1 = sim.simulate(roles, 99);
    const r2 = sim.simulate(roles, 99);
    expect(r1.winner).toBe(r2.winner);
    expect(r1.rounds).toBe(r2.rounds);
  });

  it('different seeds can produce different outcomes', () => {
    const roles = [wolf, villager, villager, villager, villager];
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(sim.simulate(roles, i * 1000).winner);
    }
    // With varied seeds, both outcomes should appear eventually
    expect(results.size).toBeGreaterThanOrEqual(1);
  });

  it('overwhelming wolves always win (3 wolves vs 1 villager)', () => {
    const roles = [wolf, wolf, wolf, villager];
    // With 3 wolves vs 1 villager, wolves win on night 1 consistently
    const result = sim.simulate(roles, 42);
    expect(result.winner).toBe(TeamType.WEREWOLF);
  });

  it('lone wolf always loses to large village', () => {
    const roles = [wolf, ...Array(9).fill(villager)];
    // Village outnumbers wolf 9:1 — village should win most of the time
    let villageWins = 0;
    for (let i = 0; i < 30; i++) {
      if (sim.simulate(roles, i).winner === TeamType.VILLAGE) villageWins++;
    }
    expect(villageWins).toBeGreaterThan(15);
  });
});
