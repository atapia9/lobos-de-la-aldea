import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameGateway } from '../src/websocket/game.gateway.js';
import { EventType } from '@lobos/game-engine';
import type { GameEvent } from '@lobos/game-engine';
import type { Socket } from 'socket.io';

function makeSocket(id = 'client-1'): Socket {
  return {
    id,
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
    rooms: new Set(),
  } as unknown as Socket;
}

function makeServer() {
  return {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  };
}

function makeEvent(type: EventType, gameId = 'g1'): GameEvent {
  return { id: 'e1', type, payload: { foo: 'bar' }, timestamp: 1000, gameId };
}

describe('GameGateway', () => {
  let gateway: GameGateway;

  beforeEach(() => {
    gateway = new GameGateway();
    (gateway as any).server = makeServer();
  });

  describe('connection lifecycle', () => {
    it('logs on connection without throwing', () => {
      expect(() => gateway.handleConnection(makeSocket())).not.toThrow();
    });

    it('logs on disconnection without throwing', () => {
      expect(() => gateway.handleDisconnect(makeSocket())).not.toThrow();
    });
  });

  describe('join_game', () => {
    it('joins the correct game room', () => {
      const client = makeSocket();
      gateway.handleJoinGame({ gameId: 'g1', playerId: 'p1' }, client);
      expect(client.join).toHaveBeenCalledWith('game:g1');
    });

    it('emits joined confirmation to client', () => {
      const client = makeSocket();
      gateway.handleJoinGame({ gameId: 'g1', playerId: 'p1' }, client);
      expect(client.emit).toHaveBeenCalledWith('joined', { gameId: 'g1', playerId: 'p1' });
    });

    it('different players can join different rooms', () => {
      const c1 = makeSocket('c1');
      const c2 = makeSocket('c2');
      gateway.handleJoinGame({ gameId: 'g1', playerId: 'p1' }, c1);
      gateway.handleJoinGame({ gameId: 'g2', playerId: 'p2' }, c2);
      expect(c1.join).toHaveBeenCalledWith('game:g1');
      expect(c2.join).toHaveBeenCalledWith('game:g2');
    });
  });

  describe('leave_game', () => {
    it('leaves the correct game room', () => {
      const client = makeSocket();
      gateway.handleLeaveGame({ gameId: 'g1' }, client);
      expect(client.leave).toHaveBeenCalledWith('game:g1');
    });
  });

  describe('broadcastGameEvent', () => {
    it('broadcasts to correct game room', () => {
      const event = makeEvent(EventType.PLAYER_KILLED, 'g42');
      gateway.broadcastGameEvent(event);
      expect((gateway as any).server.to).toHaveBeenCalledWith('game:g42');
    });

    it('emits game_event with correct shape', () => {
      const event = makeEvent(EventType.NIGHT_STARTED);
      gateway.broadcastGameEvent(event);
      const server = (gateway as any).server;
      expect(server.emit).toHaveBeenCalledWith('game_event', {
        type: EventType.NIGHT_STARTED,
        payload: { foo: 'bar' },
        timestamp: 1000,
        gameId: 'g1',
      });
    });

    it('broadcasts PLAYER_EXECUTED as distinct from PLAYER_KILLED', () => {
      const executed = makeEvent(EventType.PLAYER_EXECUTED);
      const killed = makeEvent(EventType.PLAYER_KILLED);
      gateway.broadcastGameEvent(executed);
      gateway.broadcastGameEvent(killed);
      const server = (gateway as any).server;
      const calls = server.emit.mock.calls;
      const types = calls.map((c: any[]) => c[1].type);
      expect(types).toContain(EventType.PLAYER_EXECUTED);
      expect(types).toContain(EventType.PLAYER_KILLED);
      expect(EventType.PLAYER_EXECUTED).not.toBe(EventType.PLAYER_KILLED);
    });

    it('broadcasts all major event types without throwing', () => {
      const eventsToTest = [
        EventType.GAME_CREATED, EventType.ROLE_ASSIGNED, EventType.NIGHT_STARTED,
        EventType.PLAYER_KILLED, EventType.PLAYER_PROTECTED, EventType.DAY_STARTED,
        EventType.VOTE_CAST, EventType.PLAYER_EXECUTED, EventType.GAME_ENDED,
      ];
      for (const type of eventsToTest) {
        expect(() => gateway.broadcastGameEvent(makeEvent(type))).not.toThrow();
      }
    });
  });
});
