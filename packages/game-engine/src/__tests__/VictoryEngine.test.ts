import { describe, it, expect } from 'vitest';
import { VictoryEngine } from '../VictoryEngine.js';
import { TeamType, RoleType, PhaseType, EventType } from '../types.js';
import { GameState } from '../models.js';

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

const makePlayer = (id: string, team: TeamType, roleType = RoleType.VILLAGER, alive = true) => ({
  id,
  name: id,
  role: makeRole(team, roleType),
  alive,
  protected: false,
  silenced: false,
  cursed: false,
  votes: 0,
  executionCount: 0,
});

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'g1',
  players: [],
  phase: PhaseType.RESOLUTION,
  dayNumber: 1,
  events: [],
  seed: 1,
  winner: null,
  votes: new Map(),
  pendingActions: [],
  ...overrides,
});

describe('VictoryEngine', () => {
  const engine = new VictoryEngine();

  it('village wins when no werewolves alive', () => {
    const state = makeState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('v2', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF, false),
      ],
    });
    const result = engine.evaluate(state);
    expect(result.winner).toBe(TeamType.VILLAGE);
  });

  it('werewolves win when they equal villagers', () => {
    const state = makeState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF),
      ],
    });
    const result = engine.evaluate(state);
    expect(result.winner).toBe(TeamType.WEREWOLF);
  });

  it('werewolves win when they outnumber villagers', () => {
    const state = makeState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF),
        makePlayer('w2', TeamType.WEREWOLF, RoleType.WEREWOLF),
      ],
    });
    expect(engine.evaluate(state).winner).toBe(TeamType.WEREWOLF);
  });

  it('game continues when village has more players', () => {
    const state = makeState({
      players: [
        makePlayer('v1', TeamType.VILLAGE),
        makePlayer('v2', TeamType.VILLAGE),
        makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF),
      ],
    });
    expect(engine.evaluate(state).winner).toBeNull();
  });

  it('jester wins when executed by vote (PLAYER_EXECUTED event)', () => {
    const jester = makePlayer('j1', TeamType.NEUTRAL, RoleType.JESTER, false);
    const state = makeState({
      players: [jester, makePlayer('v1', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF)],
      events: [
        {
          id: 'e1',
          type: EventType.PLAYER_EXECUTED,
          payload: { playerId: 'j1', roleId: 'jester' },
          timestamp: 1,
          gameId: 'g1',
        },
      ],
    });
    const result = engine.evaluate(state);
    expect(result.winner).toBe(TeamType.NEUTRAL);
    expect(result.winnerRoleType).toBe(RoleType.JESTER);
  });

  it('jester does NOT win when killed by werewolf (PLAYER_KILLED, not PLAYER_EXECUTED)', () => {
    const jester = makePlayer('j1', TeamType.NEUTRAL, RoleType.JESTER, false);
    const state = makeState({
      players: [jester, makePlayer('v1', TeamType.VILLAGE), makePlayer('v2', TeamType.VILLAGE), makePlayer('w1', TeamType.WEREWOLF, RoleType.WEREWOLF)],
      events: [
        {
          id: 'e1',
          type: EventType.PLAYER_KILLED,
          payload: { playerId: 'j1' },
          timestamp: 1,
          gameId: 'g1',
        },
      ],
    });
    // Jester killed at night should NOT trigger neutral win
    const result = engine.evaluate(state);
    expect(result.winner).toBeNull();
  });
});
