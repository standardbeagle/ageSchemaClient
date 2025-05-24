/**
 * Singleton connection pool manager for ageSchemaClient
 *
 * This file provides a singleton connection pool that can be shared across
 * the application, including tests. It ensures that only one pool is created
 * and that it's properly closed when the process exits.
 */

import { PgConnectionManager } from './connector';
import { ConnectionConfig } from './types';

// The singleton instance
let instance: PgConnectionManager | null = null;

/**
 * Get the singleton connection manager instance
 * If it doesn't exist, it will be created with the provided config
 *
 * @param config The connection configuration
 * @returns The singleton connection manager instance
 */
export function getConnectionManager(config: ConnectionConfig): PgConnectionManager {
  if (!instance) {
    console.log('Creating singleton connection manager...');
    instance = new PgConnectionManager(config);

    // Note: Process exit handler removed - pool closure is handled by global teardown
  }

  return instance;
}

/**
 * Release all connections in the singleton pool without closing it
 * This is useful for test cleanup between test files
 */
export async function releaseAllConnections(): Promise<void> {
  if (instance) {
    await instance.releaseAllConnections();
  }
}

/**
 * Reset the singleton instance (for testing only)
 * This will close the pool and remove the instance
 */
export async function resetConnectionManager(): Promise<void> {
  if (instance) {
    console.log('Resetting singleton connection manager...');
    try {
      await instance.closeAll();
      instance = null;
      console.log('Singleton connection manager reset.');
    } catch (error) {
      console.error(`Error resetting connection manager: ${(error as Error).message}`);
      throw error;
    }
  }
}
