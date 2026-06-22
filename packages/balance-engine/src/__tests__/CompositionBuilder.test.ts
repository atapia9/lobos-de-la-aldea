import { describe, it, expect } from 'vitest';
import { CompositionBuilder } from '../CompositionBuilder.js';
import { TeamType, RoleType } from '@lobos/game-engine';
import type { RoleConfig } from '@lobos/game-engine';

const makeRole = (id: string, team: TeamType, rarity: RoleConfig['rarity'] = 'COMMON'): RoleConfig => ({
  id, team,
  roleType: id.toUpperCase() as RoleType,
  nightAction: team === TeamType.WEREWOLF,
  priority: 7,
  rarity,
  difficulty: 2,
  triggers: [],
});

const villager = makeRole('villager', TeamType.VILLAGE);
const wolf = makeRole('werewolf', TeamType.WEREWOLF);
const seer = makeRole('seer', TeamType.VILLAGE, 'UNCOMMON');
const jester = makeRole('jester', TeamType.NEUTRAL, 'RARE');

const BASE_ROLES = [villager, wolf, seer, jester];

describe('CompositionBuilder', () => {
  const builder = new CompositionBuilder();

  it('total roles equals playerCount', () => {
    for (const count of [5, 7, 10, 15]) {
      const comp = builder.build({ playerCount: count, availableRoles: BASE_ROLES });
      expect(comp.roles).toHaveLength(count);
    }
  });

  it('werewolf count is at least 1', () => {
    const comp = builder.build({ playerCount: 5, availableRoles: BASE_ROLES });
    expect(comp.werewolfCount).toBeGreaterThanOrEqual(1);
  });

  it('village always outnumbers werewolves in NORMAL difficulty', () => {
    for (const count of [5, 8, 10, 15]) {
      const comp = builder.build({ playerCount: count, availableRoles: BASE_ROLES, difficulty: 'NORMAL' });
      expect(comp.villageCount).toBeGreaterThan(comp.werewolfCount);
    }
  });

  it('HARD difficulty adds more werewolves than EASY', () => {
    const easy = builder.build({ playerCount: 10, availableRoles: BASE_ROLES, difficulty: 'EASY' });
    const hard = builder.build({ playerCount: 10, availableRoles: BASE_ROLES, difficulty: 'HARD' });
    expect(hard.werewolfCount).toBeGreaterThan(easy.werewolfCount);
  });

  it('werewolfRatio equals werewolfCount / playerCount', () => {
    const comp = builder.build({ playerCount: 10, availableRoles: BASE_ROLES });
    expect(comp.werewolfRatio).toBeCloseTo(comp.werewolfCount / 10, 5);
  });

  it('neutralCount never exceeds 1 for small games (< 8 players)', () => {
    const comp = builder.build({ playerCount: 6, availableRoles: BASE_ROLES });
    expect(comp.neutralCount).toBeLessThanOrEqual(1);
  });

  it('sum of team counts equals playerCount', () => {
    const comp = builder.build({ playerCount: 12, availableRoles: BASE_ROLES });
    expect(comp.werewolfCount + comp.villageCount + comp.neutralCount).toBe(12);
  });
});
