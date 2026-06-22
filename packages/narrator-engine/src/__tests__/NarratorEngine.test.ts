import { describe, it, expect } from 'vitest';
import { NarratorEngine } from '../NarratorEngine.js';
import { EventType, TeamType, RoleType, PhaseType } from '@lobos/game-engine';
import type { GameEvent, GameState, Player } from '@lobos/game-engine';

// ── helpers ──────────────────────────────────────────────────────────────────

const makePlayer = (id: string, name: string, roleType = RoleType.VILLAGER, alive = true): Player => ({
  id, name, alive, protected: false, silenced: false, cursed: false, votes: 0, executionCount: 0,
  role: {
    id: roleType.toLowerCase(), team: TeamType.VILLAGE, roleType,
    nightAction: false, priority: 10, rarity: 'COMMON', difficulty: 1, triggers: [],
  },
});

const baseState = (players: Player[] = []): GameState => ({
  id: 'g1', phase: PhaseType.DISCUSSION, dayNumber: 2, events: [],
  seed: 42, winner: null, votes: new Map(), pendingActions: [], players,
});

const makeEvent = (type: EventType, payload: Record<string, unknown> = {}): GameEvent => ({
  id: 'e1', type, payload, timestamp: Date.now(), gameId: 'g1',
});

const NIGHT_PHRASES = {
  NIGHT_STARTED: ['La oscuridad cae sobre la aldea.'],
  PLAYER_KILLED: ['{playerName} no sobrevivió la noche.'],
  PLAYER_PROTECTED: ['{playerName} fue protegido.'],
};
const DAY_PHRASES = {
  DAY_STARTED: ['El día {dayNumber} comienza.'],
  VOTE_CAST: ['{voterName} vota por {targetName}.'],
  PLAYER_EXECUTED: ['{playerName} fue ejecutado. Era {roleDisplay}.'],
  TIE_NO_EXECUTION: ['Empate. Nadie ejecutado.'],
};
const SETUP_PHRASES = {
  GAME_CREATED: ['Nueva partida. {playerCount} jugadores.'],
  ROLE_ASSIGNED: ['Tu rol ha sido asignado.'],
};
const VICTORY_PHRASES = {
  VILLAGE_WINS: ['¡La aldea triunfa!'],
  WEREWOLF_WINS: ['Los lobos ganan.'],
  JESTER_WINS: ['¡El Bufón ríe el último!'],
};

function makeNarrator(): NarratorEngine {
  const n = new NarratorEngine({ seed: 1 });
  n.loadPhrases('night', NIGHT_PHRASES);
  n.loadPhrases('day', DAY_PHRASES);
  n.loadPhrases('setup', SETUP_PHRASES);
  n.loadPhrases('victory', VICTORY_PHRASES);
  return n;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('NarratorEngine — phase narration', () => {
  it('narrates NIGHT_STARTED', () => {
    const n = makeNarrator();
    const result = n.narrate(makeEvent(EventType.NIGHT_STARTED), baseState());
    expect(result.text).toBe('La oscuridad cae sobre la aldea.');
  });

  it('narrates DAY_STARTED with dayNumber substituted', () => {
    const n = makeNarrator();
    const result = n.narrate(makeEvent(EventType.DAY_STARTED), baseState());
    expect(result.text).toBe('El día 2 comienza.');
  });

  it('narrates GAME_CREATED with playerCount substituted', () => {
    const n = makeNarrator();
    const players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id, id));
    const result = n.narrate(makeEvent(EventType.GAME_CREATED), baseState(players));
    expect(result.text).toBe('Nueva partida. 5 jugadores.');
  });

  it('narrates ROLE_ASSIGNED', () => {
    const n = makeNarrator();
    const result = n.narrate(makeEvent(EventType.ROLE_ASSIGNED), baseState());
    expect(result.text).toBe('Tu rol ha sido asignado.');
  });
});

describe('NarratorEngine — player events', () => {
  it('narrates PLAYER_KILLED with player name', () => {
    const n = makeNarrator();
    const alice = makePlayer('p1', 'Alice');
    const result = n.narrate(
      makeEvent(EventType.PLAYER_KILLED, { playerId: 'p1' }),
      baseState([alice])
    );
    expect(result.text).toBe('Alice no sobrevivió la noche.');
  });

  it('narrates PLAYER_PROTECTED with player name', () => {
    const n = makeNarrator();
    const bob = makePlayer('p2', 'Bob');
    const result = n.narrate(
      makeEvent(EventType.PLAYER_PROTECTED, { playerId: 'p2' }),
      baseState([bob])
    );
    expect(result.text).toBe('Bob fue protegido.');
  });

  it('narrates PLAYER_EXECUTED with name and role', () => {
    const n = makeNarrator();
    const carol = makePlayer('p3', 'Carol', RoleType.SEER);
    const result = n.narrate(
      makeEvent(EventType.PLAYER_EXECUTED, { playerId: 'p3' }),
      baseState([carol])
    );
    expect(result.text).toBe('Carol fue ejecutado. Era seer.');
  });

  it('narrates VOTE_CAST with voter and target names', () => {
    const n = makeNarrator();
    const dave = makePlayer('p4', 'Dave');
    const eve = makePlayer('p5', 'Eve');
    const result = n.narrate(
      makeEvent(EventType.VOTE_CAST, { voterId: 'p4', targetId: 'p5' }),
      baseState([dave, eve])
    );
    expect(result.text).toBe('Dave vota por Eve.');
  });
});

describe('NarratorEngine — victory', () => {
  it('narrates GAME_ENDED with village winner', () => {
    const n = makeNarrator();
    const result = n.narrate(
      makeEvent(EventType.GAME_ENDED, { winner: TeamType.VILLAGE }),
      baseState()
    );
    expect(result.text).toBe('¡La aldea triunfa!');
  });

  it('narrates GAME_ENDED with werewolf winner', () => {
    const n = makeNarrator();
    const result = n.narrate(
      makeEvent(EventType.GAME_ENDED, { winner: TeamType.WEREWOLF }),
      baseState()
    );
    expect(result.text).toBe('Los lobos ganan.');
  });

  it('narrates PLAYER_EXECUTED for Jester as Jester victory', () => {
    const n = makeNarrator();
    const jester = makePlayer('j1', 'Fool', RoleType.JESTER);
    const result = n.narrate(
      makeEvent(EventType.PLAYER_EXECUTED, { playerId: 'j1' }),
      baseState([jester])
    );
    expect(result.text).toBe('¡El Bufón ríe el último!');
  });

  it('narrates GAME_ENDED with neutral winner as Jester victory', () => {
    const n = makeNarrator();
    const result = n.narrate(
      makeEvent(EventType.GAME_ENDED, { winner: TeamType.NEUTRAL }),
      baseState()
    );
    expect(result.text).toBe('¡El Bufón ríe el último!');
  });
});

describe('NarratorEngine — performance and structure', () => {
  it('narration completes in under 2000ms', () => {
    const n = makeNarrator();
    const result = n.narrate(makeEvent(EventType.NIGHT_STARTED), baseState());
    expect(result.durationMs).toBeLessThan(2000);
  });

  it('result includes eventType matching the event', () => {
    const n = makeNarrator();
    const result = n.narrate(makeEvent(EventType.DAY_STARTED), baseState());
    expect(result.eventType).toBe(EventType.DAY_STARTED);
  });

  it('is deterministic: same seed produces same text sequence', () => {
    const n1 = makeNarrator();
    const n2 = makeNarrator();
    const state = baseState();
    const e = makeEvent(EventType.NIGHT_STARTED);
    expect(n1.narrate(e, state).text).toBe(n2.narrate(e, state).text);
  });

  it('returns fallback text for unregistered event types', () => {
    const n = makeNarrator();
    const result = n.narrate(makeEvent(EventType.PHASE_STARTED), baseState());
    expect(result.text).toContain('PHASE_STARTED');
  });
});
