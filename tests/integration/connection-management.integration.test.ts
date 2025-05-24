/**
 * Integration tests for connection management in ageSchemaClient
 *
 * These tests verify that the PgConnectionManager can properly connect to
 * a PostgreSQL database with Apache AGE extension, manage connections,
 * and handle connection lifecycle events.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PgConnectionManager } from '../../src/db/connector';
import { QueryExecutor } from '../../src/db';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Connection configuration for test database
const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  pool: {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-integration-test',
  },
};

describe('PgConnectionManager Integration', () => {
  let connectionManager: PgConnectionManager;

  beforeAll(() => {
    // Create a new connection manager for each test
    connectionManager = new PgConnectionManager(connectionConfig);
  });

  afterAll(async () => {
    // Don't do anything here - each test should release its own connections
    // and global teardown will handle pool closure
  });

  it('should connect to the database', async () => {
    // Get a connection from the pool
    const connection = await connectionManager.getConnection();

    // Verify the connection is active
    expect(connection).toBeDefined();

    // Release the connection
    await connection.release();
  });

  it('should execute a simple query', async () => {
    // Get a connection from the pool
    const connection = await connectionManager.getConnection();

    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);

    // Execute a simple query
    const result = await queryExecutor.executeSQL('SELECT 1 as value');

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);

    // Release the connection
    await connection.release();
  });

  it('should verify Apache AGE is available', async () => {
    // Get a connection from the pool
    const connection = await connectionManager.getConnection();

    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);

    try {
      // Check if AGE is available
      const result = await queryExecutor.executeSQL(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
      `);

      // Verify AGE is available
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].age_available).toBe(true);

      // AGE extension is already loaded by PgConnectionManager
      // No need to manually load it

      // Try to create a test graph
      const graphName = `test_graph_${Math.random().toString(36).substring(2, 8)}`;

      // Drop the graph if it exists - suppress console output for expected errors
      try {
        // Redirect console output temporarily
        const originalConsoleError = console.error;
        console.error = () => {}; // No-op function

        await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);

        // Restore console output
        console.error = originalConsoleError;
      } catch (error) {
        // Ignore errors if the graph doesn't exist
      }

      // Create the graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${graphName}')`);

      // Verify the graph was created
      const graphResult = await queryExecutor.executeSQL(`
        SELECT count(*) > 0 as graph_exists
        FROM ag_catalog.ag_graph
        WHERE name = '${graphName}'
      `);

      expect(graphResult.rows).toHaveLength(1);
      expect(graphResult.rows[0].graph_exists).toBe(true);

      // Clean up by dropping the graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
    } catch (error) {
      // If there's an error, it might be because AGE is not available
      // We'll fail the test with a clear message
      console.error('Error testing AGE availability:', error);
      throw new Error(`Apache AGE is not available: ${error.message}`);
    } finally {
      // Release the connection
      await connectionManager.releaseConnection(connection);
    }
  });

  it('should handle multiple connections from the pool', async () => {
    // Get multiple connections from the pool
    const connection1 = await connectionManager.getConnection();
    const connection2 = await connectionManager.getConnection();
    const connection3 = await connectionManager.getConnection();

    // Verify all connections are active
    expect(connection1).toBeDefined();
    expect(connection2).toBeDefined();
    expect(connection3).toBeDefined();

    // Release all connections
    await connectionManager.releaseConnection(connection1);
    await connectionManager.releaseConnection(connection2);
    await connectionManager.releaseConnection(connection3);

    // Get pool statistics
    const stats = connectionManager.getPoolStats();

    // Verify pool statistics
    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.idle).toBeGreaterThanOrEqual(3);
    expect(stats.waiting).toBe(0);
  });
});
