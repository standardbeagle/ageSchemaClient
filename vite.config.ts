import { defineConfig } from 'vite';
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
    // Include patterns are set dynamically below based on TEST_TYPE
    setupFiles: [
      // Global setup file for all tests
      './tests/setup/global.ts',
      // Integration setup file only loaded for integration tests
      ...(process.env.TEST_TYPE === 'integration' ? ['./tests/setup/integration.ts'] : []),
    ],
    // Global setup and teardown files
    globalSetup: './tests/setup/globalSetup.ts',
    // Filter tests based on TEST_TYPE environment variable
    include: process.env.TEST_TYPE === 'integration'
      ? ['**/*.integration.test.{js,ts}'] // Only run integration tests
      : process.env.TEST_TYPE === 'unit'
        ? ['**/*.test.{js,ts}', '!**/*.integration.test.{js,ts}'] // Run all tests except integration tests
        : ['**/*.test.{js,ts}'], // Run all tests
    environmentMatchGlobs: [
      // Match integration test files to use the integration setup
      ['**/integration/**/*.test.{js,ts}', 'node']
    ],
  },
});
