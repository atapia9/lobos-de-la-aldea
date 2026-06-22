import crypto from 'crypto';
import { GameState, Player, RoleConfig, GameAction, GameEvent } from './models.js';
import { PhaseType, TeamType, EventType } from './types.js';
import { EventBus } from './EventBus.js';
import { PhaseManager } from './PhaseManager.js';
import { SeededRandom } from './SeededRandom.js';
import { VictoryEngine } from './VictoryEngine.js';
import { NightResolver } from './NightResolver.js';
import { RoleFactory } from './RoleFactory.js';

export interface StartGameOptions {
  playerNames: string[];
  seed?: number;
  roleIds?: string[];
}

export class GameEngine {
  private state: GameState | null = null;
  private readonly phaseManager = new PhaseManager();
  private readonly victoryEngine = new VictoryEngine();
  private nightResolver: NightResolver;
  private rng: SeededRandom | null = null;

  constructor(
    readonly bus: EventBus = new EventBus(),
    readonly roleFactory: RoleFactory = new RoleFactory()
  ) {
    this.nightResolver = new NightResolver(this.bus);
  }

  startGame(options: StartGameOptions): GameState {
    const seed = options.seed ?? Date.now();
    this.rng = new SeededRandom(seed);
    const gameId = crypto.randomUUID();

    this.state = {
      id: gameId,
      players: [],
      phase: PhaseType.SETUP,
      dayNumber: 0,
      events: [],
      seed,
      winner: null,
      votes: new Map(),
      pendingActions: [],
    };

    this.emit(EventType.GAME_CREATED, {
      gameId,
      playerCount: options.playerNames.length,
      seed,
    });

    this.assignRoles(options.playerNames, options.roleIds);
    return this.state;
  }

  private assignRoles(playerNames: string[], roleIds?: string[]): void {
    const state = this.assertState();
    const rng = this.assertRng();

    const availableRoles = this.buildRoleList(playerNames.length, roleIds);
    const shuffled = rng.shuffle(availableRoles);

    state.players = playerNames.map((name, i) => {
      const player: Player = {
        id: crypto.randomUUID(),
        name,
        role: shuffled[i],
        alive: true,
        protected: false,
        silenced: false,
        cursed: false,
        votes: 0,
        executionCount: 0,
      };
      this.emit(EventType.ROLE_ASSIGNED, { playerId: player.id, roleId: player.role.id });
      return player;
    });
  }

  private buildRoleList(count: number, roleIds?: string[]): RoleConfig[] {
    if (roleIds && roleIds.length === count) {
      return roleIds.map((id) => this.roleFactory.get(id));
    }
    // Default: ~1 werewolf per 4 players, rest villagers
    const werewolfCount = Math.max(1, Math.floor(count / 4));
    const roles: RoleConfig[] = [];
    for (let i = 0; i < werewolfCount; i++) roles.push(this.roleFactory.get('werewolf'));
    while (roles.length < count) roles.push(this.roleFactory.get('villager'));
    return roles;
  }

  startNight(): GameState {
    const state = this.assertState();
    state.phase = PhaseType.NIGHT;
    state.dayNumber += 1;
    state.pendingActions = [];
    this.emit(EventType.NIGHT_STARTED, { dayNumber: state.dayNumber });
    this.emit(EventType.PHASE_STARTED, { phase: PhaseType.NIGHT, dayNumber: state.dayNumber });
    return state;
  }

  queueAction(action: Omit<GameAction, 'id' | 'timestamp'>): void {
    const state = this.assertState();
    state.pendingActions.push({
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
  }

  resolveNight(): GameState {
    const state = this.assertState();
    this.nightResolver.resolve(state, state.pendingActions);
    state.pendingActions = [];
    this.emit(EventType.PHASE_ENDED, { phase: PhaseType.NIGHT });

    const result = this.victoryEngine.evaluate(state);
    this.emit(EventType.VICTORY_EVALUATED, { winner: result.winner, reason: result.reason });
    if (result.winner !== null) {
      state.winner = result.winner;
      state.phase = PhaseType.GAME_OVER;
      this.emit(EventType.GAME_ENDED, { winner: result.winner });
    }

    return state;
  }

  startDay(): GameState {
    const state = this.assertState();
    state.phase = PhaseType.DISCUSSION;
    state.votes = new Map();
    this.emit(EventType.DAY_STARTED, { dayNumber: state.dayNumber });
    this.emit(EventType.PHASE_STARTED, { phase: PhaseType.DISCUSSION, dayNumber: state.dayNumber });
    return state;
  }

  vote(voterId: string, targetId: string): void {
    const state = this.assertState();
    if (state.phase !== PhaseType.VOTING) throw new Error('Not in voting phase');

    const voter = state.players.find((p) => p.id === voterId);
    if (!voter?.alive) throw new Error('Only alive players can vote');

    state.votes.set(voterId, targetId);
    this.emit(EventType.VOTE_CAST, { voterId, targetId });
  }

  startVoting(): GameState {
    const state = this.assertState();
    state.phase = PhaseType.VOTING;
    this.emit(EventType.PHASE_STARTED, { phase: PhaseType.VOTING, dayNumber: state.dayNumber });
    return state;
  }

  executePlayer(): GameState {
    const state = this.assertState();
    const tally = this.tallyVotes(state);

    if (!tally.winner) {
      // Tie: no execution
      state.votes = new Map();
      this.emit(EventType.PHASE_ENDED, { phase: PhaseType.VOTING, result: 'TIE_NO_EXECUTION' });
      return state;
    }

    const target = state.players.find((p) => p.id === tally.winner);
    if (!target) throw new Error('Voted player not found');

    target.alive = false;
    target.executionCount += 1;

    // PLAYER_EXECUTED is distinct from PLAYER_KILLED (critical for Jester)
    this.emit(EventType.PLAYER_EXECUTED, { playerId: target.id, roleId: target.role.id });
    this.emit(EventType.PHASE_ENDED, { phase: PhaseType.VOTING, executedId: target.id });
    state.votes = new Map();

    const result = this.victoryEngine.evaluate(state);
    this.emit(EventType.VICTORY_EVALUATED, { winner: result.winner, reason: result.reason });
    if (result.winner !== null) {
      state.winner = result.winner;
      state.phase = PhaseType.GAME_OVER;
      this.emit(EventType.GAME_ENDED, { winner: result.winner });
    }

    return state;
  }

  endGame(winner: TeamType): GameState {
    const state = this.assertState();
    state.winner = winner;
    state.phase = PhaseType.GAME_OVER;
    this.emit(EventType.GAME_ENDED, { winner });
    return state;
  }

  getState(): GameState {
    return this.assertState();
  }

  private tallyVotes(state: GameState): { winner: string | null } {
    const counts = new Map<string, number>();
    for (const targetId of state.votes.values()) {
      counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
    }
    let maxVotes = 0;
    let winner: string | null = null;
    let tie = false;
    for (const [id, count] of counts) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = id;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }
    return { winner: tie ? null : winner };
  }

  private emit(type: EventType, payload: Record<string, unknown>): void {
    const state = this.assertState();
    const event: GameEvent = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      gameId: state.id,
    };
    state.events.push(event);
    this.bus.publish(event);
  }

  private assertState(): GameState {
    if (!this.state) throw new Error('Game not started');
    return this.state;
  }

  private assertRng(): SeededRandom {
    if (!this.rng) throw new Error('RNG not initialized');
    return this.rng;
  }
}
