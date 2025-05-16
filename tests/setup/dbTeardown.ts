/**
 * Database teardown for ageSchemaClient
 *
 * This file manages a registry of connection pools that need to be released
 * at the end of all tests. The actual closing of pools is handled by the
 * process exit handler.
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

    for (const manager of connectionManagers) {
      try {
        await manager.releaseAllConnections();
      } catch (error) {
        console.error(`Error releasing connections: ${error.message}`);
      }
    }

    console.log('All connections released (pools will be closed when process exits).');
  }
}
