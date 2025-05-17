/**
 * Database teardown for ageSchemaClient
 *
 * This file manages a registry of connection pools that need to be released
 * at the end of all tests. The actual closing of pools is handled by the
 * process exit handler.
 *
 * It also provides utilities for detecting connection leaks and ensuring
 * proper cleanup of database resources.
 */

import { PgConnectionManager } from '../../src/db/connector';

// Registry of connection managers that need to be released
const connectionManagers: PgConnectionManager[] = [];

/**
 * Register a connection manager for cleanup
 * @param manager The connection manager to register
 */
export function registerConnectionManager(manager: PgConnectionManager): void {
  if (!connectionManagers.includes(manager)) {
    connectionManagers.push(manager);
    console.log(`Registered connection manager (total: ${connectionManagers.length})`);
  }
}

/**
 * Release all connections from registered connection managers
 * This function is called by the afterAll hook in global.ts
 * It does NOT close the pools, just releases connections back to the pool
 */
export async function releaseAllConnectionManagerConnections(): Promise<void> {
  if (connectionManagers.length > 0) {
    console.log(`Releasing connections from ${connectionManagers.length} connection managers at the end of all tests...`);

    let totalConnections = 0;
    let totalErrors = 0;

    for (const manager of connectionManagers) {
      try {
        // Get pool stats before releasing
        const beforeStats = manager.getPoolStats();
        totalConnections += beforeStats.total - beforeStats.idle;

        // Release all connections
        await manager.releaseAllConnections();

        // Get pool stats after releasing
        const afterStats = manager.getPoolStats();

        console.log(`Connection manager stats: before=${JSON.stringify(beforeStats)}, after=${JSON.stringify(afterStats)}`);
      } catch (error) {
        totalErrors++;
        console.error(`Error releasing connections: ${error.message}`);
      }
    }

    console.log(`Released ${totalConnections} connections with ${totalErrors} errors (pools will be closed when process exits).`);
  }
}

/**
 * Check for connection leaks in all registered connection managers
 * This function can be called periodically to detect connection leaks
 *
 * @returns True if there are connection leaks, false otherwise
 */
export function checkForConnectionLeaks(): boolean {
  if (connectionManagers.length === 0) {
    return false;
  }

  let hasLeaks = false;
  let totalActive = 0;

  for (const manager of connectionManagers) {
    const stats = manager.getPoolStats();
    const activeConnections = stats.total - stats.idle;

    if (activeConnections > 0) {
      console.warn(`Connection manager has ${activeConnections} active connections`);
      totalActive += activeConnections;
      hasLeaks = true;
    }
  }

  if (hasLeaks) {
    console.warn(`Total active connections across all managers: ${totalActive}`);
  }

  return hasLeaks;
}

/**
 * Close all connection pools
 * This function should be called at the end of all tests
 */
export async function closeAllConnectionPools(): Promise<void> {
  if (connectionManagers.length > 0) {
    console.log(`Closing ${connectionManagers.length} connection pools...`);

    for (const manager of connectionManagers) {
      try {
        await manager.closeAll();
      } catch (error) {
        console.error(`Error closing connection pool: ${error.message}`);
      }
    }

    // Clear the registry
    connectionManagers.length = 0;

    console.log('All connection pools closed.');
  }
}
