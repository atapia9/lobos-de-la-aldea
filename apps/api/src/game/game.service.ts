import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { GameEngine, EventBus } from '@lobos/game-engine';
import { ActionType, TeamType, EventType } from '@lobos/game-engine';
import type { GameState } from '@lobos/game-engine';
import { CreateGameDto, QueueActionDto, CastVoteDto } from './game.dto';
import { GameGateway } from '../websocket/game.gateway';

@Injectable()
export class GameService {
  private readonly engines = new Map<string, GameEngine>();

  constructor(@Optional() private readonly gateway?: GameGateway) {}

  createGame(dto: CreateGameDto): GameState {
    if (!dto.playerNames || dto.playerNames.length < 2) {
      throw new BadRequestException('At least 2 players required');
    }
    const bus = new EventBus();
    if (this.gateway) {
      for (const type of Object.values(EventType)) {
        bus.subscribe(type, (event) => this.gateway!.broadcastGameEvent(event));
      }
    }
    const engine = new GameEngine(bus);
    const state = engine.startGame({
      playerNames: dto.playerNames,
      seed: dto.seed,
      roleIds: dto.roleIds,
    });
    this.engines.set(state.id, engine);
    return state;
  }

  getGame(gameId: string): GameState {
    return this.getEngine(gameId).getState();
  }

  startNight(gameId: string): GameState {
    return this.getEngine(gameId).startNight();
  }

  queueAction(gameId: string, dto: QueueActionDto): void {
    const actionType = dto.actionType as ActionType;
    if (!Object.values(ActionType).includes(actionType)) {
      throw new BadRequestException(`Unknown actionType: ${dto.actionType}`);
    }
    this.getEngine(gameId).queueAction({
      actorId: dto.actorId,
      targetId: dto.targetId,
      actionType,
      priority: dto.priority,
    });
  }

  resolveNight(gameId: string): GameState {
    return this.getEngine(gameId).resolveNight();
  }

  startDay(gameId: string): GameState {
    return this.getEngine(gameId).startDay();
  }

  startVoting(gameId: string): GameState {
    return this.getEngine(gameId).startVoting();
  }

  castVote(gameId: string, dto: CastVoteDto): GameState {
    const engine = this.getEngine(gameId);
    engine.vote(dto.voterId, dto.targetId);
    return engine.getState();
  }

  executePlayer(gameId: string): GameState {
    return this.getEngine(gameId).executePlayer();
  }

  endGame(gameId: string, winner: string): GameState {
    const teamType = winner as TeamType;
    if (!Object.values(TeamType).includes(teamType)) {
      throw new BadRequestException(`Unknown winner team: ${winner}`);
    }
    return this.getEngine(gameId).endGame(teamType);
  }

  listGames(): string[] {
    return [...this.engines.keys()];
  }

  private getEngine(gameId: string): GameEngine {
    const engine = this.engines.get(gameId);
    if (!engine) throw new NotFoundException(`Game ${gameId} not found`);
    return engine;
  }
}
