import Anthropic from '@anthropic-ai/sdk';
import { GameEvent, GameState } from '@lobos/game-engine';

export interface AiNarratorOptions {
  apiKey?: string;
  timeoutMs?: number;
  model?: string;
}

const SYSTEM_PROMPT = `Eres el narrador dramático de "Lobos de la Aldea", un juego de deducción social en español.
Narra los eventos del juego de forma breve (1-2 oraciones), dramática y en segunda persona del plural.
No uses corchetes ni variables literales. Inventa nombres de personajes si no se proporcionan.
Responde SOLO con el texto narrativo, sin explicaciones adicionales.`;

export class AiNarrator {
  private readonly client: Anthropic;
  private readonly timeoutMs: number;
  private readonly model: string;

  constructor(options: AiNarratorOptions = {}) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.timeoutMs = options.timeoutMs ?? 2000;
    this.model = options.model ?? 'claude-opus-4-8';
  }

  async generate(event: GameEvent, state: GameState): Promise<string> {
    const context = {
      eventType: event.type,
      payload: event.payload,
      dayNumber: state.dayNumber,
      aliveCount: state.players.filter((p) => p.alive).length,
      playerCount: state.players.length,
    };

    const userMessage = `Evento del juego:\n${JSON.stringify(context, null, 2)}\n\nNarra este evento.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: 150,
          thinking: { type: 'adaptive' },
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        },
        { signal: controller.signal },
      );

      const textBlock = response.content.find((b) => b.type === 'text');
      return textBlock ? textBlock.text.trim() : '';
    } finally {
      clearTimeout(timer);
    }
  }
}
