/**
 * Integration tests for the database connector
 *
 * These tests connect to a real PostgreSQL database with the AGE extension.
 * They verify connection management, pooling, and basic query execution.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConnectionState, PgConnectionManager } from '../../../src/db';
import { connectionManager, queryExecutor, AGE_GRAPH_NAME, connectionConfig } from '../../setup/integration';

describe('PgConnectionManager Integration', () => {
  // Test-specific connection manager
  let testConnectionManager: PgConnectionManager;

  beforeEach(() => {
    // Create a new connection manager for each test
    testConnectionManager = new PgConnectionManager(connectionConfig);
  });

  afterEach(async () => {
    // Clean up resources
    if (testConnectionManager) {
      await testConnectionManager.closeAll();
    }
  });

  it('should connect to the database', async () => {
    // Get a connection from the pool
    const connection = await connectionManager.getConnection();

    // Execute a simple query to verify connection
    const result = await connection.query('SELECT 1 as value');

    // Verify the result
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);

    // Release the connection back to the pool
    await connectionManager.releaseConnection(connection);
  });

  it('should get pool statistics', () => {
    const stats = connectionManager.getPoolStats();

    expect(stats).toBeDefined();
    expect(stats.max).toBeGreaterThan(0);
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.idle).toBeGreaterThanOrEqual(0);
    expect(stats.active).toBeGreaterThanOrEqual(0);
    expect(stats.waiting).toBeGreaterThanOrEqual(0);
  });

  it('should handle multiple connections', async () => {
    // Get multiple connections
    const connections = await Promise.all([
      testConnectionManager.getConnection(),
      testConnectionManager.getConnection(),
      testConnectionManager.getConnection()
    ]);

    // Verify we got 3 connections
    expect(connections).toHaveLength(3);

    // Check pool stats
    const stats = testConnectionManager.getPoolStats();
    expect(stats.active).toBeGreaterThanOrEqual(3);

    // Execute a query on each connection
    const results = await Promise.all(
      connections.map(conn => conn.query('SELECT 1 as value'))
    );

    // Verify results
    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.rows[0].value).toBe(1);
    }

    // Release all connections
    await Promise.all(
      connections.map(conn => testConnectionManager.releaseConnection(conn))
    );

    // Check pool stats after release
    const statsAfterRelease = testConnectionManager.getPoolStats();
    expect(statsAfterRelease.idle).toBeGreaterThanOrEqual(3);
  });

  it('should handle connection errors gracefully', async () => {
    // Create a connection manager with invalid credentials
    const invalidConnectionManager = new PgConnectionManager({
      ...connectionConfig,
      password: 'wrong_password',
      retry: {
        maxAttempts: 1, // Only try once to speed up the test
        delay: 100
      }
    });

    // Attempt to get a connection
    try {
      await invalidConnectionManager.getConnection();
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Failed to get connection');
    } finally {
      // Clean up
      await invalidConnectionManager.closeAll();
    }
  });

  it('should close all connections', async () => {
    // Get a few connections
    const conn1 = await testConnectionManager.getConnection();
    const conn2 = await testConnectionManager.getConnection();

    // Execute queries to verify they work
    await conn1.query('SELECT 1');
    await conn2.query('SELECT 1');

    // Close all connections
    await testConnectionManager.closeAll();

    // Check pool stats
    const stats = testConnectionManager.getPoolStats();
    expect(stats.total).toBe(0);

    // Attempting to use a closed connection should fail
    try {
      await conn1.query('SELECT 1');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // This is expected
      expect(error).toBeDefined();
    }
  });
});

describe('QueryExecutor Integration', () => {
  it('should execute a SQL query', async () => {
    const result = await queryExecutor.executeSQL('SELECT 1 as value');

    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);
  });

  it('should execute a SQL query with parameters', async () => {
    const result = await queryExecutor.executeSQL(
      'SELECT $1::text as message',
      ['Hello from integration test']
    );

    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].message).toBe('Hello from integration test');
  });

  it('should execute multiple SQL queries in sequence', async () => {
    // Execute a series of queries
    const results = await Promise.all([
      queryExecutor.executeSQL('SELECT 1 as value'),
      queryExecutor.executeSQL('SELECT 2 as value'),
      queryExecutor.executeSQL('SELECT 3 as value')
    ]);

    // Verify results
    expect(results).toHaveLength(3);
    expect(results[0].rows[0].value).toBe(1);
    expect(results[1].rows[0].value).toBe(2);
    expect(results[2].rows[0].value).toBe(3);
  });

  it('should handle SQL query errors', async () => {
    try {
      // Execute an invalid SQL query
      await queryExecutor.executeSQL('SELECT * FROM nonexistent_table');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
    }
  });

  it('should execute a Cypher query', async () => {
    // Create a test vertex
    const createResult = await queryExecutor.executeCypher(
      'CREATE (n:Person {name: $name, age: $age}) RETURN n',
      { name: 'Test Person', age: 30 },
      AGE_GRAPH_NAME
    );

    expect(createResult).toBeDefined();
    expect(createResult.rows).toHaveLength(1);

    // Query the vertex
    const queryResult = await queryExecutor.executeCypher(
      'MATCH (n:Person {name: $name}) RETURN n',
      { name: 'Test Person' },
      AGE_GRAPH_NAME
    );

    expect(queryResult).toBeDefined();
    expect(queryResult.rows).toHaveLength(1);

    // The result structure depends on AGE's response format
    // This is a basic check that we got something back
    const person = queryResult.rows[0];
    expect(person).toBeDefined();
  });

  it('should handle Cypher query errors', async () => {
    try {
      // Execute an invalid Cypher query
      await queryExecutor.executeCypher(
        'INVALID CYPHER QUERY',
        {},
        AGE_GRAPH_NAME
      );
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
    }
  });

  it('should handle query timeouts', async () => {
    try {
      // Execute a query with a very short timeout
      await queryExecutor.executeSQL(
        'SELECT pg_sleep(1)', // Sleep for 1 second
        [],
        { timeout: 10 } // 10ms timeout (should trigger timeout)
      );
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
    }
  });

  it('should transform query results', async () => {
    // Execute a query
    const result = await queryExecutor.executeSQL(
      'SELECT 1 as id, \'test\' as name'
    );

    // Transform the result
    const transformed = queryExecutor.transformResult(result, row => ({
      id: row.id,
      name: row.name.toUpperCase()
    }));

    // Verify transformation
    expect(transformed).toHaveLength(1);
    expect(transformed[0].id).toBe(1);
    expect(transformed[0].name).toBe('TEST');
  });
});
