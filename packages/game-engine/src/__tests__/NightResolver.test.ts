import { describe, it, expect, vi } from 'vitest';
import { NightResolver } from '../NightResolver.js';
import { EventBus } from '../EventBus.js';
import { EventType, ActionType, TeamType, RoleType } from '../types.js';
import type { GameState, GameAction, RoleConfig } from '../models.js';

const makeRole = (id: string, team: TeamType, roleType: RoleType, triggers: RoleConfig['triggers'] = []): RoleConfig => ({
  id, team, roleType, nightAction: true, priority: 7, rarity: 'COMMON', difficulty: 1, triggers,
});

function makeState(players: { id: string; roleId: string; team: TeamType; roleType: RoleType; triggers?: RoleConfig['triggers'] }[]): GameState {
  return {
    id: 'game-1',
    phase: 'NIGHT' as never,
    dayNumber: 1,
    players: players.map((p) => ({
      id: p.id,
      name: p.id,
      role: makeRole(p.roleId, p.team, p.roleType, p.triggers),
      alive: true,
      protected: false,
      silenced: false,
      cursed: false,
      votes: 0,
      executionCount: 0,
    })),
    events: [],
    seed: 42,
    winner: null,
    votes: new Map(),
    pendingActions: [],
  } as unknown as GameState;
}

function makeAction(actorId: string, targetId: string, actionType: ActionType): GameAction {
  return { id: crypto.randomUUID(), actorId, targetId, actionType, priority: 1, timestamp: Date.now() };
}

describe('NightResolver — BLOCK', () => {
  it('blocked actor cannot perform their action', () => {
    const bus = new EventBus();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);

    const resolver = new NightResolver(bus);
    const state = makeState([
      { id: 'shaman', roleId: 'shaman', team: TeamType.VILLAGE, roleType: RoleType.SHAMAN },
      { id: 'wolf',   roleId: 'werewolf', team: TeamType.WEREWOLF, roleType: RoleType.WEREWOLF },
      { id: 'victim', roleId: 'villager', team: TeamType.VILLAGE, roleType: RoleType.VILLAGER },
    ]);

    resolver.resolve(state, [
      makeAction('shaman', 'wolf', ActionType.BLOCK),   // block the wolf
      makeAction('wolf', 'victim', ActionType.ATTACK),  // wolf is blocked — should not fire
    ]);

    expect(killedHandler).not.toHaveBeenCalled();
    expect(state.players.find((p) => p.id === 'victim')!.alive).toBe(true);
  });

  it('non-blocked actor can still act after another player is blocked', () => {
    const bus = new EventBus();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);

    const resolver = new NightResolver(bus);
    const state = makeState([
      { id: 'shaman', roleId: 'shaman', team: TeamType.VILLAGE, roleType: RoleType.SHAMAN },
      { id: 'wolf',   roleId: 'werewolf', team: TeamType.WEREWOLF, roleType: RoleType.WEREWOLF },
      { id: 'wolf2',  roleId: 'werewolf', team: TeamType.WEREWOLF, roleType: RoleType.WEREWOLF },
      { id: 'victim', roleId: 'villager', team: TeamType.VILLAGE, roleType: RoleType.VILLAGER },
    ]);

    resolver.resolve(state, [
      makeAction('shaman', 'wolf', ActionType.BLOCK),    // block wolf1 only
      makeAction('wolf2', 'victim', ActionType.ATTACK),  // wolf2 is not blocked
    ]);

    expect(killedHandler).toHaveBeenCalledOnce();
    expect(state.players.find((p) => p.id === 'victim')!.alive).toBe(false);
  });
});

describe('NightResolver — unknown action / missing target', () => {
  it('skips attack when target player does not exist in state', () => {
    const bus = new EventBus();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);

    const resolver = new NightResolver(bus);
    const state = makeState([
      { id: 'wolf', roleId: 'werewolf', team: TeamType.WEREWOLF, roleType: RoleType.WEREWOLF },
    ]);

    // target 'ghost' is not in the state
    resolver.resolve(state, [makeAction('wolf', 'ghost', ActionType.ATTACK)]);
    expect(killedHandler).not.toHaveBeenCalled();
  });

  it('handles action with unknown type gracefully (falls to default priority 99)', () => {
    const bus = new EventBus();
    const resolver = new NightResolver(bus);
    const state = makeState([
      { id: 'actor', roleId: 'villager', team: TeamType.VILLAGE, roleType: RoleType.VILLAGER },
      { id: 'target', roleId: 'villager', team: TeamType.VILLAGE, roleType: RoleType.VILLAGER },
    ]);
    // Two actions so the sort comparator runs; unknown type triggers ?? 99 fallback
    expect(() =>
      resolver.resolve(state, [
        makeAction('actor', 'target', 'UNKNOWN_TYPE' as ActionType),
        makeAction('target', 'actor', ActionType.PROTECT),
      ])
    ).not.toThrow();
  });
});

describe('NightResolver — processTriggers', () => {
  it('fires PLAYER_KILLED trigger event when player with ON_DEATH trigger is killed', () => {
    const bus = new EventBus();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);

    const resolver = new NightResolver(bus);
    const state = makeState([
      { id: 'wolf',   roleId: 'werewolf', team: TeamType.WEREWOLF, roleType: RoleType.WEREWOLF },
      {
        id: 'hunter', roleId: 'hunter', team: TeamType.VILLAGE, roleType: RoleType.HUNTER,
        triggers: [{ on: 'ON_DEATH', action: ActionType.ATTACK, target: 'ACTOR_CHOICE', priority: 9 }],
      },
    ]);

    resolver.resolve(state, [
      makeAction('wolf', 'hunter', ActionType.ATTACK),
    ]);

    // First call: PLAYER_KILLED for the hunter; second call: trigger event
    expect(killedHandler).toHaveBeenCalledTimes(2);
    const triggerCall = killedHandler.mock.calls[1][0];
    expect(triggerCall.payload.trigger).toBe('ON_DEATH');
    expect(triggerCall.payload.roleId).toBe('hunter');
  });

  it('does not fire trigger events when no triggers match', () => {
    const bus = new EventBus();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);

    const resolver = new NightResolver(bus);
    const state = makeState([
      { id: 'wolf',     roleId: 'werewolf', team: TeamType.WEREWOLF, roleType: RoleType.WEREWOLF },
      { id: 'villager', roleId: 'villager', team: TeamType.VILLAGE,  roleType: RoleType.VILLAGER },
    ]);

    resolver.resolve(state, [makeAction('wolf', 'villager', ActionType.ATTACK)]);

    // Only the primary PLAYER_KILLED, no trigger
    expect(killedHandler).toHaveBeenCalledTimes(1);
  });
});
