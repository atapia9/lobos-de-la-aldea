import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lobos/game-engine': path.resolve(__dirname, '../game-engine/src/index.ts'),
      '@lobos/rules-engine': path.resolve(__dirname, '../rules-engine/src/index.ts'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
});
