import { describe, it, expect } from 'vitest';
import {
  VictoryRuleEngine,
  JesterVictoryRule,
  VillageVictoryRule,
  WerewolfVictoryRule,
  VictoryRule,
} from '../VictoryRuleEngine.js';
import { GameState, Player, TeamType, RoleType, PhaseType, EventType } from '@lobos/game-engine';

const makeRole = (team: TeamType, roleType: RoleType) => ({
  id: roleType.toLowerCase(),
  team,
  roleType,
  nightAction: false,
  priority: 10,
  rarity: 'COMMON' as const,
  difficulty: 1,
  triggers: [],
});

const makePlayer = (id: string, team: TeamType, roleType = RoleType.VILLAGER, alive = true): Player => ({
  id, name: id, alive, protected: false, silenced: false, cursed: false, votes: 0, executionCount: 0,
  role: makeRole(team, roleType),
});

const baseState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'g1', phase: PhaseType.RESOLUTION, dayNumber: 1, events: [],
  seed: 1, winner: null, votes: new Map(), pendingActions: [], players: [],
  ...overrides,
});

describe('VillageVictoryRule', () => {
  const rule = new VillageVictoryRule();

  it('triggers when no werewolves alive', () => {
    const state = baseState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF, false),
      ],
    });
    expect(rule.evaluate(state)?.winner).toBe(TeamType.VILLAGE);
  });

  it('does not trigger when werewolves still alive', () => {
    const state = baseState({
      players: [makePlayer('v1', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF)],
    });
    expect(rule.evaluate(state)).toBeNull();
  });
});

describe('WerewolfVictoryRule', () => {
  const rule = new WerewolfVictoryRule();

  it('triggers when werewolves equal villagers', () => {
    const state = baseState({
      players: [makePlayer('v1', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF)],
    });
    expect(rule.evaluate(state)?.winner).toBe(TeamType.WEREWOLF);
  });

  it('triggers when werewolves outnumber villagers', () => {
    const state = baseState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF),
        makePlayer('w2', TeamType.WEREWOLF, RoleType.WEREWOLF),
      ],
    });
    expect(rule.evaluate(state)?.winner).toBe(TeamType.WEREWOLF);
  });

  it('does not trigger when village has more players', () => {
    const state = baseState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('v2', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF),
      ],
    });
    expect(rule.evaluate(state)).toBeNull();
  });

  it('does not trigger when no werewolves alive', () => {
    const state = baseState({
      players: [makePlayer('v1', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF, false)],
    });
    expect(rule.evaluate(state)).toBeNull();
  });
});

describe('JesterVictoryRule', () => {
  const rule = new JesterVictoryRule();

  it('triggers when jester was executed (PLAYER_EXECUTED)', () => {
    const jester = makePlayer('j1', TeamType.NEUTRAL, RoleType.JESTER, false);
    const state = baseState({
      players: [jester, makePlayer('v1', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF)],
      events: [{ id: 'e1', type: EventType.PLAYER_EXECUTED, payload: { playerId: 'j1' }, timestamp: 1, gameId: 'g1' }],
    });
    const result = rule.evaluate(state);
    expect(result?.winner).toBe(TeamType.NEUTRAL);
    expect(result?.winnerRoleType).toBe(RoleType.JESTER);
  });

  it('does NOT trigger when jester was killed at night (PLAYER_KILLED)', () => {
    const jester = makePlayer('j1', TeamType.NEUTRAL, RoleType.JESTER, false);
    const state = baseState({
      players: [jester, makePlayer('v1', TeamType.VILLAGE), makePlayer('v2', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF)],
      events: [{ id: 'e1', type: EventType.PLAYER_KILLED, payload: { playerId: 'j1' }, timestamp: 1, gameId: 'g1' }],
    });
    expect(rule.evaluate(state)).toBeNull();
  });
});

describe('VictoryRuleEngine — pipeline', () => {
  it('evaluates Jester before Village (Jester priority)', () => {
    const engine = new VictoryRuleEngine();
    const jester = makePlayer('j1', TeamType.NEUTRAL, RoleType.JESTER, false);
    // All werewolves eliminated AND jester was executed — Jester wins
    const state = baseState({
      players: [jester, makePlayer('v1', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF, false)],
      events: [{ id: 'e1', type: EventType.PLAYER_EXECUTED, payload: { playerId: 'j1' }, timestamp: 1, gameId: 'g1' }],
    });
    const result = engine.evaluate(state);
    expect(result.winner).toBe(TeamType.NEUTRAL);
    expect(result.winnerRoleType).toBe(RoleType.JESTER);
  });

  it('returns null winner when game continues', () => {
    const engine = new VictoryRuleEngine();
    const state = baseState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('v2', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF),
      ],
    });
    expect(engine.evaluate(state).winner).toBeNull();
  });

  it('supports custom pluggable rules', () => {
    const engine = new VictoryRuleEngine();
    const customRule: VictoryRule = {
      id: 'always-neutral',
      evaluate: () => ({ winner: TeamType.NEUTRAL, reason: 'custom' }),
    };
    engine.addRule(customRule, 0); // insert at front
    const state = baseState({ players: [makePlayer('v1', TeamType.VILLAGE)] });
    expect(engine.evaluate(state).winner).toBe(TeamType.NEUTRAL);
  });

  it('exposes ordered list of rules', () => {
    const engine = new VictoryRuleEngine();
    const ids = engine.getRules().map((r) => r.id);
    expect(ids).toEqual(['jester', 'village', 'werewolf']);
  });
});
