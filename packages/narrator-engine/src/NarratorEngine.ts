import { GameEvent, GameState, EventType, TeamType, RoleType } from '@lobos/game-engine';
import { PhraseBank } from './PhraseBank.js';
import { TemplateEngine } from './TemplateEngine.js';
import { buildContext, NarratorContext } from './NarratorContext.js';
import { AiNarrator } from './AiNarrator.js';

export interface NarrationResult {
  text: string;
  eventType: EventType;
  durationMs: number;
  aiGenerated: boolean;
}

// Maps EventType → phrase bank key
function resolvePhraseKey(ctx: NarratorContext): string {
  const { event } = ctx;

  switch (event.type) {
    case EventType.GAME_CREATED:    return 'setup.GAME_CREATED';
    case EventType.ROLE_ASSIGNED:   return 'setup.ROLE_ASSIGNED';
    case EventType.NIGHT_STARTED:   return 'night.NIGHT_STARTED';
    case EventType.PLAYER_KILLED:   return 'night.PLAYER_KILLED';
    case EventType.PLAYER_PROTECTED: return 'night.PLAYER_PROTECTED';
    case EventType.DAY_STARTED:     return 'day.DAY_STARTED';
    case EventType.VOTE_CAST:       return 'day.VOTE_CAST';
    case EventType.PLAYER_EXECUTED: return resolveExecutedKey(ctx);
    case EventType.GAME_ENDED:      return resolveVictoryKey(ctx);
    default:                        return `unknown.${event.type}`;
  }
}

function resolveExecutedKey(ctx: NarratorContext): string {
  const playerId = ctx.event.payload['playerId'] as string | undefined;
  if (playerId) {
    const player = ctx.gameState.players.find((p) => p.id === playerId);
    if (player?.role.roleType === RoleType.JESTER) return 'victory.JESTER_WINS';
  }
  return 'day.PLAYER_EXECUTED';
}

function resolveVictoryKey(ctx: NarratorContext): string {
  const winner = ctx.event.payload['winner'] as string | undefined;
  if (winner === TeamType.VILLAGE) return 'victory.VILLAGE_WINS';
  if (winner === TeamType.WEREWOLF) return 'victory.WEREWOLF_WINS';
  if (winner === TeamType.NEUTRAL) return 'victory.JESTER_WINS';
  return 'victory.VILLAGE_WINS';
}

export interface NarratorEngineOptions {
  seed?: number;
  maxDurationMs?: number;
  aiNarrator?: AiNarrator;
}

export class NarratorEngine {
  private readonly bank: PhraseBank;
  private readonly template: TemplateEngine;
  private readonly maxDurationMs: number;
  private readonly ai: AiNarrator | undefined;

  constructor(options: NarratorEngineOptions = {}) {
    this.bank = new PhraseBank(options.seed ?? 42);
    this.template = new TemplateEngine();
    this.maxDurationMs = options.maxDurationMs ?? 2000;
    this.ai = options.aiNarrator;
  }

  loadPhrases(category: string, entries: Record<string, string[]>): void {
    this.bank.load(category, entries);
  }

  narrate(event: GameEvent, state: GameState): NarrationResult {
    const start = Date.now();
    const ctx = buildContext(event, state);
    const key = resolvePhraseKey(ctx);
    const raw = this.bank.pick(key);
    const text = this.template.render(raw, ctx.resolvedVars);
    const durationMs = Date.now() - start;

    return { text, eventType: event.type, durationMs, aiGenerated: false };
  }

  async narrateAsync(event: GameEvent, state: GameState): Promise<NarrationResult> {
    const start = Date.now();

    if (this.ai) {
      try {
        const text = await this.ai.generate(event, state);
        if (text) {
          return { text, eventType: event.type, durationMs: Date.now() - start, aiGenerated: true };
        }
      } catch {
        // AI failed or timed out — fall through to phrase bank
      }
    }

    return { ...this.narrate(event, state), durationMs: Date.now() - start };
  }

  getBank(): PhraseBank {
    return this.bank;
  }
}
