/**
 * Vitest configuration for integration tests
 *
 * This configuration is used when running integration tests only.
 * It includes only integration tests and configures the test environment
 * appropriately for database integration testing.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration-tests',
    globals: true,
    environment: 'node',
    include: ['**/*.integration.test.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/backup/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Run tests sequentially to avoid connection pool issues
    pool: 'forks',
    poolOptions: {
      forks: {
        // Use a single fork to avoid connection issues
        singleFork: true
      }
    },
    // Run tests sequentially (one at a time)
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    // Setup files for integration tests
    setupFiles: [
      './tests/setup/global.ts',
    ],
    // Global setup and teardown files
    globalSetup: './tests/setup/globalSetup.ts',
    // Increase timeout for integration tests
    testTimeout: 30000,
  },
});
