import { describe, it, expect, beforeEach } from 'vitest';
import { VoteManager } from '../VoteManager.js';
import { Player } from '@lobos/game-engine';
import { TeamType, RoleType } from '@lobos/game-engine';

const makePlayer = (id: string, alive = true): Player => ({
  id,
  name: id,
  alive,
  protected: false,
  silenced: false,
  cursed: false,
  votes: 0,
  executionCount: 0,
  role: {
    id: 'villager',
    team: TeamType.VILLAGE,
    roleType: RoleType.VILLAGER,
    nightAction: false,
    priority: 10,
    rarity: 'COMMON',
    difficulty: 1,
    triggers: [],
  },
});

describe('VoteManager — castVote', () => {
  let vm: VoteManager;
  let players: Player[];

  beforeEach(() => {
    vm = new VoteManager();
    players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id));
  });

  it('records a valid vote', () => {
    vm.castVote('a', 'b', players);
    expect(vm.getRecords()).toHaveLength(1);
  });

  it('rejects vote from dead player', () => {
    const dead = makePlayer('x', false);
    expect(() => vm.castVote('x', 'a', [...players, dead])).toThrow();
  });

  it('rejects vote targeting dead player', () => {
    const dead = makePlayer('z', false);
    expect(() => vm.castVote('a', 'z', [...players, dead])).toThrow();
  });

  it('voter can change their vote (overwrite)', () => {
    vm.castVote('a', 'b', players);
    vm.castVote('a', 'c', players);
    const records = vm.getRecords();
    expect(records).toHaveLength(1);
    expect(records[0].targetId).toBe('c');
  });

  it('different voters cast independent votes', () => {
    vm.castVote('a', 'c', players);
    vm.castVote('b', 'c', players);
    expect(vm.getRecords()).toHaveLength(2);
  });
});

describe('VoteManager — tally', () => {
  let vm: VoteManager;
  let players: Player[];

  beforeEach(() => {
    vm = new VoteManager();
    players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id));
  });

  it('identifies clear leader', () => {
    vm.castVote('a', 'e', players);
    vm.castVote('b', 'e', players);
    vm.castVote('c', 'e', players);
    vm.castVote('d', 'a', players);
    const { leader, isTie } = vm.tally();
    expect(leader).toBe('e');
    expect(isTie).toBe(false);
  });

  it('detects a tie between two candidates', () => {
    vm.castVote('a', 'b', players);
    vm.castVote('b', 'a', players);
    vm.castVote('c', 'b', players);
    vm.castVote('d', 'a', players);
    const { leader, isTie } = vm.tally();
    expect(isTie).toBe(true);
    expect(leader).toBeNull();
  });

  it('filters to candidate subset when provided', () => {
    vm.castVote('a', 'b', players);
    vm.castVote('b', 'c', players);
    vm.castVote('c', 'b', players);
    const { counts } = vm.tally(['b']);
    expect(counts.has('c')).toBe(false);
    expect(counts.get('b')).toBe(2);
  });
});

describe('VoteManager — resolveRound', () => {
  let vm: VoteManager;
  let players: Player[];

  beforeEach(() => {
    vm = new VoteManager();
    players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id));
  });

  it('returns EXECUTION when one player has majority', () => {
    vm.castVote('a', 'e', players);
    vm.castVote('b', 'e', players);
    vm.castVote('c', 'e', players);
    const result = vm.resolveRound(players);
    expect(result.outcome).toBe('EXECUTION');
    if (result.outcome === 'EXECUTION') expect(result.targetId).toBe('e');
  });

  it('returns TIE_REVOTE with tied candidates on first tie', () => {
    vm.castVote('a', 'b', players);
    vm.castVote('b', 'a', players);
    vm.castVote('c', 'b', players);
    vm.castVote('d', 'a', players);
    const result = vm.resolveRound(players);
    expect(result.outcome).toBe('TIE_REVOTE');
    if (result.outcome === 'TIE_REVOTE') {
      expect(result.candidates).toContain('a');
      expect(result.candidates).toContain('b');
      expect(vm.currentRound).toBe(2);
    }
  });

  it('returns NO_EXECUTION when second round is also a tie', () => {
    // Round 1: tie between a and b
    vm.castVote('a', 'b', players);
    vm.castVote('b', 'a', players);
    vm.castVote('c', 'b', players);
    vm.castVote('d', 'a', players);
    const r1 = vm.resolveRound(players);
    expect(r1.outcome).toBe('TIE_REVOTE');

    // Round 2: still a tie
    vm.castVote('a', 'b', players);
    vm.castVote('b', 'a', players);
    vm.castVote('c', 'b', players);
    vm.castVote('d', 'a', players);
    const r2 = vm.resolveRound(players, (r1 as { outcome: 'TIE_REVOTE'; candidates: string[] }).candidates);
    expect(r2.outcome).toBe('NO_EXECUTION');
  });

  it('reset clears all records and resets round to 1', () => {
    vm.castVote('a', 'b', players);
    vm.reset();
    expect(vm.getRecords()).toHaveLength(0);
    expect(vm.currentRound).toBe(1);
  });
});
