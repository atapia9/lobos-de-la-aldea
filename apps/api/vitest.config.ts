import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lobos/game-engine': path.resolve(__dirname, '../../packages/game-engine/src/index.ts'),
      '@lobos/rules-engine': path.resolve(__dirname, '../../packages/rules-engine/src/index.ts'),
      '@lobos/balance-engine': path.resolve(__dirname, '../../packages/balance-engine/src/index.ts'),
      '@lobos/narrator-engine': path.resolve(__dirname, '../../packages/narrator-engine/src/index.ts'),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
});
