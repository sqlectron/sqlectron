import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/vitest.setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    exclude: ['test/e2e/**', 'node_modules/**'],
    // test/browser/config.test.ts and test/browser/servers.test.ts share the
    // same tmp fixture file via utils-stub.ts, so files must run sequentially.
    fileParallelism: false,
  },
});
