import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '../src/game/game.service.js';
import { PhaseType, TeamType, ActionType } from '@lobos/game-engine';

const PLAYERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
const ROLES = ['werewolf', 'villager', 'villager', 'villager', 'villager'];
const SEED = 42;

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  describe('createGame', () => {
    it('creates a game and returns state in SETUP phase', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED });
      expect(state.phase).toBe(PhaseType.SETUP);
      expect(state.players).toHaveLength(5);
    });

    it('throws when fewer than 2 players provided', () => {
      expect(() => service.createGame({ playerNames: ['Solo'] })).toThrow();
    });

    it('game is retrievable by id after creation', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED });
      const fetched = service.getGame(state.id);
      expect(fetched.id).toBe(state.id);
    });

    it('assigns roleIds when provided', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      const roleIds = state.players.map((p) => p.role.id);
      expect(roleIds).toContain('werewolf');
    });
  });

  describe('getGame', () => {
    it('throws NotFoundException for unknown gameId', () => {
      expect(() => service.getGame('nonexistent')).toThrow();
    });
  });

  describe('night flow', () => {
    it('startNight transitions to NIGHT phase', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      const night = service.startNight(state.id);
      expect(night.phase).toBe(PhaseType.NIGHT);
    });

    it('queueAction accepts valid action', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      service.startNight(state.id);
      const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
      const victim = state.players.find((p) => p.id !== wolf.id)!;
      expect(() =>
        service.queueAction(state.id, {
          actorId: wolf.id, targetId: victim.id,
          actionType: ActionType.ATTACK, priority: 7,
        })
      ).not.toThrow();
    });

    it('queueAction rejects unknown actionType', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      service.startNight(state.id);
      expect(() =>
        service.queueAction(state.id, {
          actorId: 'x', targetId: 'y', actionType: 'INVALID' as ActionType, priority: 1,
        })
      ).toThrow();
    });

    it('resolveNight emits events and returns updated state', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      service.startNight(state.id);
      const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
      const victim = state.players.find((p) => p.id !== wolf.id)!;
      service.queueAction(state.id, {
        actorId: wolf.id, targetId: victim.id,
        actionType: ActionType.ATTACK, priority: 7,
      });
      const resolved = service.resolveNight(state.id);
      expect(resolved.events.length).toBeGreaterThan(0);
    });
  });

  describe('day / voting flow', () => {
    function setupVoting(svc: GameService) {
      const state = svc.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      svc.startNight(state.id);
      svc.resolveNight(state.id);
      svc.startDay(state.id);
      svc.startVoting(state.id);
      return state;
    }

    it('startDay transitions to DISCUSSION phase', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED, roleIds: ROLES });
      service.startNight(state.id);
      service.resolveNight(state.id);
      const day = service.startDay(state.id);
      expect(day.phase).toBe(PhaseType.DISCUSSION);
    });

    it('castVote records vote and returns updated state', () => {
      const state = setupVoting(service);
      const alive = state.players.filter((p) => p.alive);
      const [voter, target] = alive;
      const updated = service.castVote(state.id, { voterId: voter.id, targetId: target.id });
      expect(updated.events.some((e) => e.type === 'VOTE_CAST')).toBe(true);
    });

    it('executePlayer with majority vote kills the target', () => {
      const state = setupVoting(service);
      const wolf = state.players.find((p) => p.role.id === 'werewolf')!;
      for (const voter of state.players.filter((p) => p.alive && p.id !== wolf.id)) {
        service.castVote(state.id, { voterId: voter.id, targetId: wolf.id });
      }
      const result = service.executePlayer(state.id);
      expect(wolf.alive).toBe(false);
      // Village wins when last wolf executed
      expect(result.winner).toBe(TeamType.VILLAGE);
    });
  });

  describe('endGame', () => {
    it('sets winner and marks game GAME_OVER', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED });
      const ended = service.endGame(state.id, TeamType.WEREWOLF);
      expect(ended.winner).toBe(TeamType.WEREWOLF);
    });

    it('throws on unknown winner team', () => {
      const state = service.createGame({ playerNames: PLAYERS, seed: SEED });
      expect(() => service.endGame(state.id, 'DRAGONS')).toThrow();
    });
  });

  describe('listGames', () => {
    it('returns all created game ids', () => {
      const s1 = service.createGame({ playerNames: PLAYERS, seed: 1 });
      const s2 = service.createGame({ playerNames: PLAYERS, seed: 2 });
      const list = service.listGames();
      expect(list).toContain(s1.id);
      expect(list).toContain(s2.id);
    });
  });
});
