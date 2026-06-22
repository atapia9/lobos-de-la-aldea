import { TeamType, RoleType, PhaseType, ActionType, EventType } from './types.js';

export interface RoleConfig {
  id: string;
  team: TeamType;
  roleType: RoleType;
  nightAction: boolean;
  priority: number;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  difficulty: number;
  triggers: TriggerConfig[];
}

export interface TriggerConfig {
  on: string;
  action: ActionType;
  target: string;
  priority: number;
}

export interface Player {
  id: string;
  name: string;
  role: RoleConfig;
  alive: boolean;
  protected: boolean;
  silenced: boolean;
  cursed: boolean;
  votes: number;
  executionCount: number;
}

export interface GameAction {
  id: string;
  actorId: string;
  targetId: string;
  actionType: ActionType;
  priority: number;
  timestamp: number;
}

export interface GameEvent {
  id: string;
  type: EventType;
  payload: Record<string, unknown>;
  timestamp: number;
  gameId: string;
}

export interface GameState {
  id: string;
  players: Player[];
  phase: PhaseType;
  dayNumber: number;
  events: GameEvent[];
  seed: number;
  winner: TeamType | null;
  votes: Map<string, string>;
  pendingActions: GameAction[];
}
