/**
 * Test connection manager for ageSchemaClient
 *
 * This file provides a singleton connection pool that can be shared across
 * test files. It ensures that only one pool is created and that connections
 * are properly released between tests.
 */

import { PgConnectionManager } from '../../src/db/connector';

// The singleton instance
let instance: PgConnectionManager | null = null;

// Connection configuration for test database
export const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  pool: {
    max: 5, // Increase the pool size to handle more concurrent connections
    idleTimeoutMillis: 60000, // How long a connection can be idle before being closed
    connectionTimeoutMillis: 100, // Reduced timeout for local PostgreSQL server
  },
  retry: {
    maxAttempts: 5, // Fewer retry attempts for local server
    delay: 100, // Very short delay for local server
    maxDelay: 500, // Shorter maximum delay for local server
    factor: 1.5, // Use exponential backoff
    jitter: 0.2, // Add jitter to avoid thundering herd
  },
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-tests',
  },
};

/**
 * Get the singleton connection manager instance
 * If it doesn't exist, it will be created
 *
 * @returns The singleton connection manager instance
 */
export function getTestConnectionManager(): PgConnectionManager {
  if (!instance) {
    console.log('Creating test connection manager...');
    instance = new PgConnectionManager(connectionConfig);

    // Register cleanup handler for process exit
    process.on('exit', () => {
      if (instance) {
        console.log('Process exiting, closing test connection pool...');
        // We can't use async functions in exit handlers, so we just try our best
        try {
          // @ts-ignore - We know this is synchronous, but TypeScript doesn't
          instance.pool.end();
          console.log('Test connection pool closed.');
        } catch (error) {
          console.error(`Error closing test connection pool: ${(error as Error).message}`);
        }
      }
    });
  }

  return instance;
}

/**
 * Release all connections in the singleton pool without closing it
 * This is useful for test cleanup between test files
 */
export async function releaseAllTestConnections(): Promise<void> {
  if (instance) {
    await instance.releaseAllConnections();
  }
}
