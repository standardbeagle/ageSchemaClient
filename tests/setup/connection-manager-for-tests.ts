/**
 * Test connection manager for ageSchemaClient
 *
 * This file provides a singleton connection pool that can be shared across
 * test files. It ensures that:
 * 1. Only one pool is created and shared across all tests
 * 2. Connections are properly configured for Apache AGE
 * 3. Connections are properly released between tests
 * 4. The pool is properly closed when tests are complete
 * 5. AGE extension is loaded automatically for each new connection
 * 6. Search path is set to include ag_catalog
 * 7. Connections are properly tracked for cleanup
 * 8. Connection leaks are detected and reported
 */

import { PgConnectionManager, Connection, ConnectionEvent } from '../../src/db/connector';

/**
 * Connection manager for tests that implements the singleton pattern.
 * This class manages real database connections used during tests.
 */
export class ConnectionManagerForTests {
  private static instance: ConnectionManagerForTests | null = null;
  private connectionManager: PgConnectionManager;
  private activeConnections: Set<Connection> = new Set();

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    this.connectionManager = new PgConnectionManager(connectionConfig);

    // Register hooks to track connections and ensure AGE is loaded
    this.connectionManager.registerHooks({
      afterConnect: this.afterConnectHook.bind(this),
      beforeDisconnect: this.beforeDisconnectHook.bind(this),
    });

    // Check for connection leaks periodically
    setInterval(() => {
      const activeCount = this.activeConnections.size;
      if (activeCount > 0) {
        console.warn(`Warning: ${activeCount} connections are still active and may be leaking`);
        this.activeConnections.forEach((conn, index) => {
          console.warn(`  Connection ${index + 1}: acquired at ${conn['_acquiredAt']}`);
        });
      }
    }, 60000); // Check every minute

    // Register cleanup handler for process exit
    process.on('exit', () => {
      console.log('Process exiting, closing test connection pool...');
      try {
        // We can't use async functions in exit handlers, so we just try our best
        // @ts-ignore - We know this is synchronous, but TypeScript doesn't
        this.connectionManager.pool.end();
        console.log('Test connection pool closed.');

        // Log any active connections that weren't properly released
        const activeCount = this.activeConnections.size;
        if (activeCount > 0) {
          console.warn(`Warning: ${activeCount} connections were not properly released`);
        }
      } catch (error) {
        console.error(`Error closing test connection pool: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Get the singleton instance
   * If it doesn't exist, it will be created
   *
   * @returns The singleton instance
   */
  public static getInstance(): ConnectionManagerForTests {
    if (!ConnectionManagerForTests.instance) {
      ConnectionManagerForTests.instance = new ConnectionManagerForTests();
    }
    return ConnectionManagerForTests.instance;
  }

  /**
   * Get a connection from the pool
   * The connection will be automatically configured for Apache AGE
   *
   * @returns A connection
   */
  public async getConnection(): Promise<Connection> {
    const connection = await this.connectionManager.getConnection();

    // Add acquisition timestamp for tracking
    connection['_acquiredAt'] = new Date().toISOString();
    connection['_acquiredBy'] = new Error().stack?.split('\n')[2]?.trim() || 'unknown';

    // Track the connection
    this.activeConnections.add(connection);

    return connection;
  }

  /**
   * Release a connection back to the pool
   *
   * @param connection - Connection to release
   */
  public async releaseConnection(connection: Connection): Promise<void> {
    await this.connectionManager.releaseConnection(connection);

    // Remove from tracked connections
    this.activeConnections.delete(connection);
  }

  /**
   * Release all connections in the pool
   * This is useful for test cleanup between test files
   */
  public async releaseAllConnections(): Promise<void> {
    // Only log if there are more than 1 active connections to reduce noise
    const activeCount = this.activeConnections.size;
    if (activeCount > 1) {
      console.warn(`Releasing ${activeCount} active connections`);
    }

    await this.connectionManager.releaseAllConnections();

    // Clear tracked connections
    this.activeConnections.clear();
  }


  /**
   * Get the number of active connections
   *
   * @returns The number of active connections
   */
  public getActiveConnectionCount(): number {
    return this.activeConnections.size;
  }

  /**
   * Get pool statistics
   *
   * @returns Pool statistics
   */
  public getPoolStats(): any {
    return this.connectionManager.getPoolStats();
  }

  /**
   * After connect hook
   * This is called after a connection is acquired from the pool
   * It ensures that AGE is loaded and search_path is set
   *
   * @param connection - Connection
   * @param _event - Connection event
   */
  private async afterConnectHook(connection: Connection, _event: ConnectionEvent): Promise<void> {
    try {
      // Note: AGE extension loading and search_path are now handled by PgConnectionManager
      // We only need to verify that everything is set up correctly

      // Verify search_path includes ag_catalog (for debugging purposes only)
      const result = await connection.query('SHOW search_path');
      const searchPath = result.rows[0].search_path;

      if (!searchPath.includes('ag_catalog')) {
        console.warn(`Warning: search_path does not include ag_catalog: ${searchPath}`);
        console.warn('This should have been set automatically by the PgConnectionManager');
      }
    } catch (error) {
      console.error(`Error in afterConnect hook: ${(error as Error).message}`);
    }
  }

  /**
   * Before disconnect hook
   * This is called before a connection is released back to the pool
   *
   * @param connection - Connection
   * @param _event - Connection event
   */
  private async beforeDisconnectHook(connection: Connection, _event: ConnectionEvent): Promise<void> {
    // Remove from tracked connections
    this.activeConnections.delete(connection);
    // Note: The age_params table is truncated by the release event handler in the PgConnectionManager
  }
}

// Connection configuration for test database
export const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  pool: {
    max: 10, // Increase the pool size to handle more concurrent connections
    idleTimeoutMillis: 60000, // How long a connection can be idle before being closed
    connectionTimeoutMillis: 5000, // Increased timeout for more reliable connections
    allowExitOnIdle: true, // Allow the pool to exit when idle
  },
  retry: {
    maxAttempts: 3, // Reasonable number of retry attempts
    delay: 1000, // Initial delay between retries
    maxDelay: 5000, // Maximum delay between retries
    factor: 2, // Use exponential backoff
    jitter: 0.2, // Add jitter to avoid thundering herd
  },
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-tests',
    statementTimeout: 30000, // 30 seconds
  },
};

/**
 * Get the connection manager singleton for tests
 * This is the function that should be used by tests to get a connection manager
 *
 * @returns The connection manager singleton for tests
 */
export function getConnectionManagerForTests(): ConnectionManagerForTests {
  return ConnectionManagerForTests.getInstance();
}

/**
 * Release all connections used in tests
 * This is the function that should be used by tests to release all connections
 */
export async function releaseAllConnections(): Promise<void> {
  await ConnectionManagerForTests.getInstance().releaseAllConnections();
}
