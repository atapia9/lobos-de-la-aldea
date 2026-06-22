import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameController } from '../src/game/game.controller.js';
import { GameService } from '../src/game/game.service.js';
import { PhaseType, TeamType } from '@lobos/game-engine';
import type { GameState } from '@lobos/game-engine';

const mockState = (overrides: Partial<GameState> = {}): GameState => ({
  id: 'game-1', phase: PhaseType.SETUP, dayNumber: 0, players: [],
  events: [], seed: 42, winner: null, votes: new Map(), pendingActions: [],
  ...overrides,
});

function makeMockService(): GameService {
  return {
    createGame: vi.fn().mockReturnValue(mockState()),
    getGame: vi.fn().mockReturnValue(mockState()),
    listGames: vi.fn().mockReturnValue(['game-1']),
    startNight: vi.fn().mockReturnValue(mockState({ phase: PhaseType.NIGHT })),
    queueAction: vi.fn(),
    resolveNight: vi.fn().mockReturnValue(mockState()),
    startDay: vi.fn().mockReturnValue(mockState({ phase: PhaseType.DISCUSSION })),
    startVoting: vi.fn().mockReturnValue(mockState({ phase: PhaseType.VOTING })),
    castVote: vi.fn().mockReturnValue(mockState()),
    executePlayer: vi.fn().mockReturnValue(mockState()),
    endGame: vi.fn().mockReturnValue(mockState({ winner: TeamType.VILLAGE, phase: PhaseType.GAME_OVER })),
  } as unknown as GameService;
}

describe('GameController', () => {
  let controller: GameController;
  let service: GameService;

  beforeEach(() => {
    service = makeMockService();
    controller = new GameController(service);
  });

  it('createGame delegates to service and returns state', () => {
    const result = controller.createGame({ playerNames: ['A', 'B', 'C', 'D', 'E'] });
    expect(service.createGame).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ id: 'game-1' });
  });

  it('listGames returns list of ids', () => {
    const result = controller.listGames();
    expect(result).toEqual(['game-1']);
  });

  it('getGame delegates with correct id', () => {
    controller.getGame('game-1');
    expect(service.getGame).toHaveBeenCalledWith('game-1');
  });

  it('startNight delegates with correct id', () => {
    const result = controller.startNight('game-1');
    expect(service.startNight).toHaveBeenCalledWith('game-1');
    expect(result).toMatchObject({ phase: PhaseType.NIGHT });
  });

  it('queueAction delegates to service with id and dto', () => {
    controller.queueAction('game-1', { actorId: 'a', targetId: 'b', actionType: 'ATTACK', priority: 7 });
    expect(service.queueAction).toHaveBeenCalledWith('game-1', expect.objectContaining({ actionType: 'ATTACK' }));
  });

  it('resolveNight delegates with correct id', () => {
    controller.resolveNight('game-1');
    expect(service.resolveNight).toHaveBeenCalledWith('game-1');
  });

  it('startDay delegates with correct id', () => {
    const result = controller.startDay('game-1');
    expect(service.startDay).toHaveBeenCalledWith('game-1');
    expect(result).toMatchObject({ phase: PhaseType.DISCUSSION });
  });

  it('startVoting delegates with correct id', () => {
    const result = controller.startVoting('game-1');
    expect(service.startVoting).toHaveBeenCalledWith('game-1');
    expect(result).toMatchObject({ phase: PhaseType.VOTING });
  });

  it('castVote delegates with id and dto', () => {
    controller.castVote('game-1', { voterId: 'v1', targetId: 'v2' });
    expect(service.castVote).toHaveBeenCalledWith('game-1', { voterId: 'v1', targetId: 'v2' });
  });

  it('executePlayer delegates with correct id', () => {
    controller.executePlayer('game-1');
    expect(service.executePlayer).toHaveBeenCalledWith('game-1');
  });

  it('endGame delegates with id and winner', () => {
    const result = controller.endGame('game-1', { winner: TeamType.VILLAGE });
    expect(service.endGame).toHaveBeenCalledWith('game-1', TeamType.VILLAGE);
    expect(result).toMatchObject({ winner: TeamType.VILLAGE });
  });
});
