import { RoleConfig } from './models.js';
import { TeamType, RoleType, ActionType } from './types.js';

const DEFAULT_ROLES: Record<string, RoleConfig> = {
  villager: {
    id: 'villager',
    team: TeamType.VILLAGE,
    roleType: RoleType.VILLAGER,
    nightAction: false,
    priority: 10,
    rarity: 'COMMON',
    difficulty: 1,
    triggers: [],
  },
  werewolf: {
    id: 'werewolf',
    team: TeamType.WEREWOLF,
    roleType: RoleType.WEREWOLF,
    nightAction: true,
    priority: 7,
    rarity: 'COMMON',
    difficulty: 2,
    triggers: [],
  },
  seer: {
    id: 'seer',
    team: TeamType.VILLAGE,
    roleType: RoleType.SEER,
    nightAction: true,
    priority: 5,
    rarity: 'UNCOMMON',
    difficulty: 2,
    triggers: [],
  },
  guardian: {
    id: 'guardian',
    team: TeamType.VILLAGE,
    roleType: RoleType.GUARDIAN,
    nightAction: true,
    priority: 4,
    rarity: 'UNCOMMON',
    difficulty: 2,
    triggers: [],
  },
  hunter: {
    id: 'hunter',
    team: TeamType.VILLAGE,
    roleType: RoleType.HUNTER,
    nightAction: false,
    priority: 9,
    rarity: 'UNCOMMON',
    difficulty: 3,
    triggers: [
      { on: 'ON_DEATH', action: ActionType.ATTACK, target: 'ACTOR_CHOICE', priority: 9 },
    ],
  },
  jester: {
    id: 'jester',
    team: TeamType.NEUTRAL,
    roleType: RoleType.JESTER,
    nightAction: false,
    priority: 10,
    rarity: 'RARE',
    difficulty: 4,
    triggers: [],
  },
};

export class RoleFactory {
  private registry = new Map<string, RoleConfig>(Object.entries(DEFAULT_ROLES));

  register(config: RoleConfig): void {
    this.registry.set(config.id, config);
  }

  get(roleId: string): RoleConfig {
    const role = this.registry.get(roleId);
    if (!role) throw new Error(`Unknown role: ${roleId}`);
    return role;
  }

  list(): RoleConfig[] {
    return [...this.registry.values()];
  }
}
