import { describe, it, expect } from 'vitest';
import { RoleFactory } from '../RoleFactory.js';
import { TeamType, RoleType } from '../types.js';
import type { RoleConfig } from '../models.js';

const customRole: RoleConfig = {
  id: 'oracle',
  team: TeamType.VILLAGE,
  roleType: RoleType.ORACLE,
  nightAction: true,
  priority: 3,
  rarity: 'RARE',
  difficulty: 3,
  triggers: [],
};

describe('RoleFactory', () => {
  it('get returns built-in roles', () => {
    const factory = new RoleFactory();
    const wolf = factory.get('werewolf');
    expect(wolf.team).toBe(TeamType.WEREWOLF);
  });

  it('get throws for unknown role', () => {
    const factory = new RoleFactory();
    expect(() => factory.get('unknown-role')).toThrow('Unknown role: unknown-role');
  });

  it('register adds a custom role retrievable by get', () => {
    const factory = new RoleFactory();
    factory.register(customRole);
    const role = factory.get('oracle');
    expect(role.id).toBe('oracle');
    expect(role.roleType).toBe(RoleType.ORACLE);
  });

  it('register overwrites an existing role', () => {
    const factory = new RoleFactory();
    const modified = { ...customRole, id: 'villager', roleType: RoleType.VILLAGER, difficulty: 99 };
    factory.register(modified);
    expect(factory.get('villager').difficulty).toBe(99);
  });

  it('list returns all registered roles including custom ones', () => {
    const factory = new RoleFactory();
    const before = factory.list().length;
    factory.register(customRole);
    const after = factory.list().length;
    expect(after).toBe(before + 1);
    expect(factory.list().map((r) => r.id)).toContain('oracle');
  });
});
