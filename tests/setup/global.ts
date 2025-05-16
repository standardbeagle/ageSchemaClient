/**
 * Global test setup for ageSchemaClient
 *
 * This file sets up the global test environment for all tests
 */

import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import { PgConnectionManager } from '../../src/db/connector';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Skip integration tests if TEST_TYPE is not 'integration'
beforeAll(() => {
  // Only run this check if we're not explicitly running integration tests
  if (process.env.TEST_TYPE !== 'integration') {
    return;
  }

  // Check if we have the required environment variables for database connection
  const requiredEnvVars = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.warn(`
      ⚠️ Skipping integration tests because the following environment variables are missing:
      ${missingEnvVars.join(', ')}

      Please set these variables in .env.test to run integration tests.
    `);
    // Skip all tests in this file
    // This is handled by the testNamePattern in vite.config.ts
  }
});

// Import the database teardown utilities
import { releaseAllConnectionManagerConnections } from './dbTeardown';

// Global teardown to release all connections at the end of all tests
afterAll(async () => {
  // Release all connections from registered connection managers
  // The pools will be closed when the process exits
  await releaseAllConnectionManagerConnections();
}, 30000); // 30 second timeout for releasing all connections
