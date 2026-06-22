import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../GameEngine.js';
import { EventBus } from '../EventBus.js';
import { EventType, PhaseType, ActionType, TeamType, RoleType } from '../types.js';

const PLAYER_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
const FIXED_SEED = 42;

describe('GameEngine — startGame', () => {
  it('emits GAME_CREATED and returns state in SETUP phase', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.GAME_CREATED, handler);
    const engine = new GameEngine(bus);
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED });
    expect(state.phase).toBe(PhaseType.SETUP);
    expect(handler).toHaveBeenCalledOnce();
    expect(state.seed).toBe(FIXED_SEED);
  });

  it('assigns a role to every player', () => {
    const engine = new GameEngine();
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED });
    expect(state.players).toHaveLength(PLAYER_NAMES.length);
    for (const p of state.players) {
      expect(p.role).toBeDefined();
      expect(p.alive).toBe(true);
    }
  });

  it('emits ROLE_ASSIGNED for each player', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.ROLE_ASSIGNED, handler);
    const engine = new GameEngine(bus);
    engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED });
    expect(handler).toHaveBeenCalledTimes(PLAYER_NAMES.length);
  });

  it('is reproducible with same seed', () => {
    const e1 = new GameEngine();
    const e2 = new GameEngine();
    const s1 = e1.startGame({ playerNames: PLAYER_NAMES, seed: 999 });
    const s2 = e2.startGame({ playerNames: PLAYER_NAMES, seed: 999 });
    const roles1 = s1.players.map((p) => p.role.id);
    const roles2 = s2.players.map((p) => p.role.id);
    expect(roles1).toEqual(roles2);
  });

  it('uses provided roleIds when given', () => {
    const engine = new GameEngine();
    const roleIds = ['werewolf', 'villager', 'villager', 'villager', 'villager'];
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: 1, roleIds });
    const assignedIds = state.players.map((p) => p.role.id);
    expect(assignedIds).toContain('werewolf');
  });

  it('throws if game not started before calling startNight', () => {
    const engine = new GameEngine();
    expect(() => engine.startNight()).toThrow();
  });
});

describe('GameEngine — night phase', () => {
  it('transitions to NIGHT phase and increments dayNumber', () => {
    const engine = new GameEngine();
    engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED });
    const state = engine.startNight();
    expect(state.phase).toBe(PhaseType.NIGHT);
    expect(state.dayNumber).toBe(1);
  });

  it('emits NIGHT_STARTED and PHASE_STARTED', () => {
    const bus = new EventBus();
    const nightHandler = vi.fn();
    const phaseHandler = vi.fn();
    bus.subscribe(EventType.NIGHT_STARTED, nightHandler);
    bus.subscribe(EventType.PHASE_STARTED, phaseHandler);
    const engine = new GameEngine(bus);
    engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED });
    engine.startNight();
    expect(nightHandler).toHaveBeenCalledOnce();
    expect(phaseHandler).toHaveBeenCalled();
  });

  it('werewolf attack kills unprotected player (PLAYER_KILLED emitted)', () => {
    const bus = new EventBus();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);
    const engine = new GameEngine(bus);
    const roleIds = ['werewolf', 'villager', 'villager', 'villager', 'villager'];
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED, roleIds });
    engine.startNight();
    const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
    const victim = state.players.find((p) => p.id !== wolf.id)!;
    engine.queueAction({ actorId: wolf.id, targetId: victim.id, actionType: ActionType.ATTACK, priority: 7 });
    engine.resolveNight();
    expect(victim.alive).toBe(false);
    expect(killedHandler).toHaveBeenCalledOnce();
  });

  it('guardian PROTECT saves player from attack (PLAYER_PROTECTED emitted, not PLAYER_KILLED)', () => {
    const bus = new EventBus();
    const protectedHandler = vi.fn();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_PROTECTED, protectedHandler);
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);
    const engine = new GameEngine(bus);
    const roleIds = ['werewolf', 'guardian', 'villager', 'villager', 'villager'];
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED, roleIds });
    engine.startNight();
    const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
    const guardian = state.players.find((p) => p.role.id === 'guardian')!;
    const victim = state.players.find((p) => p.id !== wolf.id && p.id !== guardian.id)!;
    engine.queueAction({ actorId: guardian.id, targetId: victim.id, actionType: ActionType.PROTECT, priority: 4 });
    engine.queueAction({ actorId: wolf.id, targetId: victim.id, actionType: ActionType.ATTACK, priority: 7 });
    engine.resolveNight();
    expect(victim.alive).toBe(true);
    expect(protectedHandler).toHaveBeenCalledOnce();
    expect(killedHandler).not.toHaveBeenCalled();
  });
});

describe('GameEngine — voting phase', () => {
  function setupVoting(engine: GameEngine, roleIds?: string[]) {
    const ids = roleIds ?? ['werewolf', 'villager', 'villager', 'villager', 'villager'];
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED, roleIds: ids });
    engine.startNight();
    engine.resolveNight();
    engine.startDay();
    engine.startVoting();
    return state;
  }

  it('records votes and emits VOTE_CAST', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.VOTE_CAST, handler);
    const engine = new GameEngine(bus);
    const state = setupVoting(engine);
    const [a, b] = state.players;
    engine.vote(a.id, b.id);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('throws if dead player tries to vote', () => {
    const engine = new GameEngine();
    const roleIds = ['werewolf', 'villager', 'villager', 'villager', 'villager'];
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED, roleIds });
    engine.startNight();
    const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
    const victim = state.players.find((p) => p.id !== wolf.id)!;
    engine.queueAction({ actorId: wolf.id, targetId: victim.id, actionType: ActionType.ATTACK, priority: 7 });
    engine.resolveNight();
    engine.startDay();
    engine.startVoting();
    expect(() => engine.vote(victim.id, wolf.id)).toThrow();
  });

  it('majority vote triggers PLAYER_EXECUTED (not PLAYER_KILLED)', () => {
    const bus = new EventBus();
    const executedHandler = vi.fn();
    const killedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_EXECUTED, executedHandler);
    bus.subscribe(EventType.PLAYER_KILLED, killedHandler);
    const engine = new GameEngine(bus);
    const state = setupVoting(engine);
    const target = state.players[0];
    for (const voter of state.players.filter((p) => p.id !== target.id)) {
      engine.vote(voter.id, target.id);
    }
    engine.executePlayer();
    expect(executedHandler).toHaveBeenCalledOnce();
    expect(killedHandler).not.toHaveBeenCalled();
    expect(target.alive).toBe(false);
  });

  it('tie vote results in no execution', () => {
    const bus = new EventBus();
    const executedHandler = vi.fn();
    bus.subscribe(EventType.PLAYER_EXECUTED, executedHandler);
    const engine = new GameEngine(bus);
    const state = setupVoting(engine);
    const [a, b, c, d] = state.players;
    // Equal votes for a and b: true tie
    engine.vote(a.id, b.id);
    engine.vote(b.id, a.id);
    engine.vote(c.id, b.id);
    engine.vote(d.id, a.id);
    engine.executePlayer();
    expect(executedHandler).not.toHaveBeenCalled();
  });

  it('PLAYER_EXECUTED and PLAYER_KILLED are different events', () => {
    // Sanity: enum values are distinct strings
    expect(EventType.PLAYER_EXECUTED).not.toBe(EventType.PLAYER_KILLED);
  });
});

describe('GameEngine — victory conditions', () => {
  it('ends game when all werewolves eliminated', () => {
    const bus = new EventBus();
    const endedHandler = vi.fn();
    bus.subscribe(EventType.GAME_ENDED, endedHandler);
    const engine = new GameEngine(bus);
    const roleIds = ['werewolf', 'villager', 'villager', 'villager', 'villager'];
    const state = engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED, roleIds });
    engine.startNight();
    engine.resolveNight();
    engine.startDay();
    engine.startVoting();
    const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
    for (const voter of state.players.filter((p) => p.id !== wolf.id && p.alive)) {
      engine.vote(voter.id, wolf.id);
    }
    engine.executePlayer();
    expect(endedHandler).toHaveBeenCalledOnce();
    expect(state.winner).toBe(TeamType.VILLAGE);
    expect(state.phase).toBe(PhaseType.GAME_OVER);
  });

  it('endGame sets winner and emits GAME_ENDED', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(EventType.GAME_ENDED, handler);
    const engine = new GameEngine(bus);
    engine.startGame({ playerNames: PLAYER_NAMES, seed: FIXED_SEED });
    const state = engine.endGame(TeamType.WEREWOLF);
    expect(state.winner).toBe(TeamType.WEREWOLF);
    expect(handler).toHaveBeenCalledOnce();
  });
});
