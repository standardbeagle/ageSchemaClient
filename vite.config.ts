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
      external: [],
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
    include: [
      '**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '**/*.integration.test.?(c|m)[jt]s?(x)'
    ],
    setupFiles: [
      // Add setup files for specific test types
      // The integration setup file will only be loaded for integration tests
    ],
    testNamePattern: process.env.TEST_TYPE === 'integration' ? /\.integration\.test\.[jt]s$/ : /(?<!\.integration)\.test\.[jt]s$/,
    environmentMatchGlobs: [
      // Match integration test files to use the integration setup
      ['**/integration/**/*.test.{js,ts}', 'node']
    ],
  },
});
