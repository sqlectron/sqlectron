import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/e2e/**/*.test.ts'],
    // Each test launches a real Electron app, so run them one at a time.
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
