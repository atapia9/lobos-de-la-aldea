import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiNarrator } from '../AiNarrator.js';
import { NarratorEngine } from '../NarratorEngine.js';
import { EventType, PhaseType, TeamType } from '@lobos/game-engine';
import type { GameEvent, GameState } from '@lobos/game-engine';

// Minimal stubs
function makeEvent(type: EventType = EventType.NIGHT_STARTED): GameEvent {
  return { id: 'e1', type, gameId: 'g1', payload: {}, timestamp: Date.now() };
}

function makeState(): GameState {
  return {
    id: 'g1',
    phase: PhaseType.NIGHT,
    dayNumber: 1,
    players: [],
    events: [],
    seed: 42,
    winner: undefined,
  } as unknown as GameState;
}

// Mock @anthropic-ai/sdk
vi.mock('@anthropic-ai/sdk', () => {
  const create = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create },
    })),
    __create: create,
  };
});

async function getCreateMock() {
  const mod = await import('@anthropic-ai/sdk');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).__create as ReturnType<typeof vi.fn>;
}

describe('AiNarrator', () => {
  let createMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createMock = await getCreateMock();
    createMock.mockReset();
  });

  it('returns AI-generated text on success', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'La noche cae sobre la aldea.' }],
    });

    const narrator = new AiNarrator({ apiKey: 'test-key' });
    const result = await narrator.generate(makeEvent(), makeState());
    expect(result).toBe('La noche cae sobre la aldea.');
  });

  it('returns empty string when content has no text block', async () => {
    createMock.mockResolvedValueOnce({ content: [{ type: 'thinking', thinking: '...' }] });

    const narrator = new AiNarrator({ apiKey: 'test-key' });
    const result = await narrator.generate(makeEvent(), makeState());
    expect(result).toBe('');
  });

  it('throws when API call rejects', async () => {
    createMock.mockRejectedValueOnce(new Error('API error'));

    const narrator = new AiNarrator({ apiKey: 'test-key' });
    await expect(narrator.generate(makeEvent(), makeState())).rejects.toThrow('API error');
  });

  it('throws when request is aborted (timeout)', async () => {
    createMock.mockImplementationOnce((_body: unknown, opts: { signal?: AbortSignal }) => {
      return new Promise((_res, rej) => {
        opts?.signal?.addEventListener('abort', () => rej(new Error('aborted')));
      });
    });

    const narrator = new AiNarrator({ apiKey: 'test-key', timeoutMs: 50 });
    await expect(narrator.generate(makeEvent(), makeState())).rejects.toThrow();
  });
});

describe('NarratorEngine.narrateAsync', () => {
  let createMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createMock = await getCreateMock();
    createMock.mockReset();
  });

  it('uses AI text when AI succeeds, marks aiGenerated=true', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Los lobos aúllan en la noche.' }],
    });

    const ai = new AiNarrator({ apiKey: 'test-key' });
    const engine = new NarratorEngine({ aiNarrator: ai });
    const result = await engine.narrateAsync(makeEvent(), makeState());

    expect(result.aiGenerated).toBe(true);
    expect(result.text).toBe('Los lobos aúllan en la noche.');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to phrase bank when AI throws, marks aiGenerated=false', async () => {
    createMock.mockRejectedValueOnce(new Error('timeout'));

    const ai = new AiNarrator({ apiKey: 'test-key' });
    const engine = new NarratorEngine({ aiNarrator: ai });
    engine.loadPhrases('night', { NIGHT_STARTED: ['La aldea duerme.'] });

    const result = await engine.narrateAsync(makeEvent(EventType.NIGHT_STARTED), makeState());
    expect(result.aiGenerated).toBe(false);
    expect(result.text).toBe('La aldea duerme.');
  });

  it('falls back to phrase bank when AI returns empty string', async () => {
    createMock.mockResolvedValueOnce({ content: [] });

    const ai = new AiNarrator({ apiKey: 'test-key' });
    const engine = new NarratorEngine({ aiNarrator: ai });
    engine.loadPhrases('night', { NIGHT_STARTED: ['Silencio en la aldea.'] });

    const result = await engine.narrateAsync(makeEvent(EventType.NIGHT_STARTED), makeState());
    expect(result.aiGenerated).toBe(false);
    expect(result.text).toBe('Silencio en la aldea.');
  });

  it('uses phrase bank directly when no AI configured', async () => {
    const engine = new NarratorEngine();
    engine.loadPhrases('night', { NIGHT_STARTED: ['Noche oscura.'] });

    const result = await engine.narrateAsync(makeEvent(EventType.NIGHT_STARTED), makeState());
    expect(result.aiGenerated).toBe(false);
    expect(result.text).toBe('Noche oscura.');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('result durationMs is within reasonable bounds', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Rápido.' }],
    });

    const ai = new AiNarrator({ apiKey: 'test-key' });
    const engine = new NarratorEngine({ aiNarrator: ai });
    const result = await engine.narrateAsync(makeEvent(), makeState());
    expect(result.durationMs).toBeLessThan(5000);
  });

  it('getBank returns the internal PhraseBank', () => {
    const engine = new NarratorEngine();
    const bank = engine.getBank();
    expect(bank).toBeDefined();
    expect(typeof bank.pick).toBe('function');
  });
});
