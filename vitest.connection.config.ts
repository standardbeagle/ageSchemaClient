import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'connection-tests',
    include: ['tests/connection/**/*.test.ts'],
    globals: true,
    environment: 'node',
    // No global setup or teardown
    setupFiles: [],
    // Run tests sequentially
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Use a single process
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Increase test timeout
    testTimeout: 30000,
    // Enable more verbose logging
    logLevel: 'verbose',
  },
});
