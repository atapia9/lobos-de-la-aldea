import { GameAction, GameState, Player } from './models.js';
import { ActionType, EventType } from './types.js';
import { EventBus } from './EventBus.js';
import crypto from 'crypto';

const ACTION_PRIORITY: Record<ActionType, number> = {
  [ActionType.BLOCK]: 1,
  [ActionType.MARK]: 2,
  [ActionType.CONVERT]: 3,
  [ActionType.PROTECT]: 4,
  [ActionType.INVESTIGATE]: 5,
  [ActionType.TRACK]: 6,
  [ActionType.ATTACK]: 7,
  [ActionType.EXECUTE]: 8,
  [ActionType.REVIVE]: 9,
  [ActionType.SPECIAL]: 10,
  [ActionType.VOTE]: 11,
};

export class NightResolver {
  constructor(private readonly bus: EventBus) {}

  resolve(state: GameState, actions: GameAction[]): void {
    const sorted = [...actions].sort(
      (a, b) => (ACTION_PRIORITY[a.actionType] ?? 99) - (ACTION_PRIORITY[b.actionType] ?? 99)
    );

    const blockedActors = new Set<string>();
    const protectedTargets = new Set<string>();

    for (const action of sorted) {
      if (action.actionType === ActionType.BLOCK) {
        blockedActors.add(action.targetId);
        continue;
      }

      if (blockedActors.has(action.actorId)) continue;

      if (action.actionType === ActionType.PROTECT) {
        protectedTargets.add(action.targetId);
        continue;
      }

      if (action.actionType === ActionType.ATTACK) {
        const target = state.players.find((p) => p.id === action.targetId);
        if (!target) continue;

        this.bus.publish({
          id: crypto.randomUUID(),
          type: EventType.PLAYER_ATTACKED,
          payload: { actorId: action.actorId, targetId: action.targetId },
          timestamp: Date.now(),
          gameId: state.id,
        });

        if (protectedTargets.has(action.targetId)) {
          this.bus.publish({
            id: crypto.randomUUID(),
            type: EventType.PLAYER_PROTECTED,
            payload: { playerId: action.targetId },
            timestamp: Date.now(),
            gameId: state.id,
          });
        } else {
          target.alive = false;
          this.bus.publish({
            id: crypto.randomUUID(),
            type: EventType.PLAYER_KILLED,
            payload: { playerId: action.targetId, cause: 'NIGHT_ATTACK' },
            timestamp: Date.now(),
            gameId: state.id,
          });
          this.processTriggers(state, target, 'ON_DEATH');
        }
      }
    }
  }

  private processTriggers(state: GameState, player: Player, triggerType: string): void {
    for (const trigger of player.role.triggers) {
      if (trigger.on === triggerType) {
        this.bus.publish({
          id: crypto.randomUUID(),
          type: EventType.PLAYER_KILLED,
          payload: {
            trigger: triggerType,
            actorId: player.id,
            roleId: player.role.id,
            action: trigger.action,
          },
          timestamp: Date.now(),
          gameId: state.id,
        });
      }
    }
  }
}
