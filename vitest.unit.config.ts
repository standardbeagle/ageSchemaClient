/**
 * Vitest configuration for unit tests
 * 
 * This configuration is used when running unit tests only.
 * It excludes integration tests and configures the test environment
 * appropriately for unit testing.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit-tests',
    globals: true,
    environment: 'node',
    include: ['**/*.test.{js,ts}', '!**/*.integration.test.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Use a single process for unit tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Run tests sequentially
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Setup files for unit tests
    setupFiles: [
      './tests/setup/global.ts',
    ],
    // No global setup needed for unit tests
    globalSetup: undefined,
  },
});
