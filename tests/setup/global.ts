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
import { releaseAllConnectionManagerConnections, checkForConnectionLeaks, closeAllConnectionPools } from './dbTeardown';
import { getResourceRegistry } from './resource-registry';

// Check for connection leaks periodically
const connectionLeakInterval = setInterval(() => {
  checkForConnectionLeaks();
}, 60000); // Check every minute

// Global teardown to release all connections at the end of all tests
afterAll(async () => {
  // Clear the connection leak check interval
  clearInterval(connectionLeakInterval);

  // Check for connection leaks before cleanup
  const hasLeaks = checkForConnectionLeaks();
  if (hasLeaks) {
    console.warn('Connection leaks detected before cleanup');
  }

  // Clean up any remaining resources
  const resourceRegistry = getResourceRegistry();
  const resourceCount = resourceRegistry.getResourceCount();
  if (resourceCount > 0) {
    console.warn(`Found ${resourceCount} resources that weren't properly cleaned up`);
    await resourceRegistry.cleanupAll();
  }

  // Release all connections from registered connection managers
  await releaseAllConnectionManagerConnections();

  // Close all connection pools
  await closeAllConnectionPools();

  console.log('Global teardown complete');
}, 30000); // 30 second timeout for releasing all connections
