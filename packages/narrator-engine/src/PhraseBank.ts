import { SeededRandom } from '@lobos/game-engine';

export type PhraseKey = string;

export interface PhraseBankEntry {
  [key: string]: string[];
}

export class PhraseBank {
  private phrases = new Map<string, string[]>();
  private rng: SeededRandom;

  constructor(seed: number = Date.now()) {
    this.rng = new SeededRandom(seed);
  }

  load(category: string, entries: PhraseBankEntry): void {
    for (const [key, templates] of Object.entries(entries)) {
      const fullKey = `${category}.${key}`;
      this.phrases.set(fullKey, templates);
    }
  }

  pick(key: PhraseKey): string {
    const templates = this.phrases.get(key);
    if (!templates || templates.length === 0) {
      return `[${key}]`;
    }
    const idx = Math.floor(this.rng.next() * templates.length);
    return templates[idx];
  }

  has(key: PhraseKey): boolean {
    return this.phrases.has(key);
  }

  setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
  }
}
