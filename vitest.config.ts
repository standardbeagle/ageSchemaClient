/**
 * Main Vitest configuration
 *
 * This configuration defines workspaces for different test types:
 * - unit: for unit tests only
 * - integration: for integration tests only
 * - default: for all tests
 *
 * Use the appropriate workspace when running tests:
 * - pnpm test:unit -- --workspace=unit
 * - pnpm test:integration -- --workspace=integration
 * - pnpm test -- --workspace=default
 *
 * NOTE: Documentation builds (website/) are NOT tested by unit or integration tests.
 * These tests should only focus on the core library functionality.
 * Documentation builds are handled separately by GitHub Actions.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AgeSchemaClient',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'pg',
        'pg-pool',
        'perf_hooks',
        'events',
        'net',
        'dns',
        'tls',
        'path',
        'fs',
        'util',
        'crypto',
        'stream',
        'string_decoder',
        /^cloudflare:.*/
      ],
      output: {
        exports: 'named',
        globals: {},
      },
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
  },
  test: {
    name: 'default',
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    // Run tests sequentially to avoid connection pool issues
    pool: 'forks', // Using forks for better isolation in database tests
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
    // Include all test files (core library only, not documentation)
    include: ['**/*.test.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/website/**'],
    // Setup files for all tests
    setupFiles: [
      './tests/setup/global.ts',
    ],
    // Global setup and teardown files
    globalSetup: './tests/setup/globalSetup.ts',
    // Match integration test files to use the integration setup
    environmentMatchGlobs: [
      ['**/*.integration.test.{js,ts}', 'node']
    ],
    // Define workspaces
    workspaceFor: (filename) => {
      if (filename.includes('.integration.test.')) {
        return 'integration';
      }
      return 'unit';
    },
    workspace: {
      default: {},
      unit: {
        name: 'unit-tests',
        include: ['**/*.test.{js,ts}', '!**/*.integration.test.{js,ts}'],
        setupFiles: ['./tests/setup/global.ts'],
        globalSetup: undefined,
      },
      integration: {
        name: 'integration-tests',
        include: ['**/*.integration.test.{js,ts}'],
        setupFiles: ['./tests/setup/global.ts', './tests/setup/integration.ts'],
        globalSetup: './tests/setup/globalSetup.ts',
        testTimeout: 30000,
      }
    }
  },
});
