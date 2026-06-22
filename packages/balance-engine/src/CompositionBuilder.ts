import { RoleConfig, TeamType } from '@lobos/game-engine';

export interface Composition {
  roles: RoleConfig[];
  werewolfCount: number;
  villageCount: number;
  neutralCount: number;
  werewolfRatio: number;
}

export interface CompositionOptions {
  playerCount: number;
  availableRoles: RoleConfig[];
  difficulty?: 'EASY' | 'NORMAL' | 'HARD';
}

// Werewolf count per player count, tuned for balance
const WEREWOLF_TABLE: Record<number, number> = {
  5: 1, 6: 1, 7: 2, 8: 2, 9: 2, 10: 3,
  11: 3, 12: 3, 13: 3, 14: 4, 15: 4,
  16: 4, 17: 4, 18: 5, 19: 5, 20: 5,
};

function getWerewolfCount(playerCount: number, difficulty: 'EASY' | 'NORMAL' | 'HARD'): number {
  const base = WEREWOLF_TABLE[playerCount] ?? Math.floor(playerCount / 4);
  if (difficulty === 'EASY') return Math.max(1, base - 1);
  if (difficulty === 'HARD') return base + 1;
  return base;
}

export class CompositionBuilder {
  build(options: CompositionOptions): Composition {
    const { playerCount, availableRoles, difficulty = 'NORMAL' } = options;

    const werewolfRoles = availableRoles.filter((r) => r.team === TeamType.WEREWOLF);
    const villageRoles = availableRoles.filter((r) => r.team === TeamType.VILLAGE);
    const neutralRoles = availableRoles.filter((r) => r.team === TeamType.NEUTRAL);

    const werewolfCount = Math.min(
      getWerewolfCount(playerCount, difficulty),
      playerCount - 1  // always leave at least one non-wolf
    );

    const roles: RoleConfig[] = [];

    // Fill werewolves (prefer variety — cycle through available wolf roles)
    for (let i = 0; i < werewolfCount; i++) {
      roles.push(werewolfRoles[i % werewolfRoles.length]);
    }

    // Fill with special village roles (sorted by rarity, rare first for interesting games)
    const specialVillage = villageRoles
      .filter((r) => r.rarity !== 'COMMON')
      .sort((a, b) => b.difficulty - a.difficulty);

    const villager = villageRoles.find((r) => r.id === 'villager') ?? villageRoles[0];
    const neutralSlots = Math.min(1, neutralRoles.length, Math.floor(playerCount / 8));

    let neutralCount = 0;
    for (let i = 0; i < neutralSlots && roles.length < playerCount; i++) {
      roles.push(neutralRoles[i]);
      neutralCount++;
    }

    let specialIdx = 0;
    while (roles.length < playerCount - Math.max(0, playerCount - roles.length - specialVillage.length + specialIdx)) {
      if (specialIdx < specialVillage.length && roles.length < playerCount) {
        roles.push(specialVillage[specialIdx++]);
      } else {
        break;
      }
    }

    // Pad remaining with plain villagers
    while (roles.length < playerCount) {
      roles.push(villager);
    }

    const villageCount = roles.filter((r) => r.team === TeamType.VILLAGE).length;

    return {
      roles,
      werewolfCount,
      villageCount,
      neutralCount,
      werewolfRatio: werewolfCount / playerCount,
    };
  }
}
