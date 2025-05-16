/**
 * Connection integration tests
 *
 * These tests verify that the connection pool is properly configured and
 * that AGE is available and properly loaded.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  connectionManager,
  AGE_GRAPH_NAME
} from './base-test';

describe('Connection Integration', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Connection Integration');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Test: Basic database connection
  it('should connect to the database', async () => {
    // Execute a simple query to verify connection
    const result = await queryExecutor.executeSQL('SELECT 1 as value');

    // Verify the result
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);
  });

  // Test: Connection pool statistics
  it('should get pool statistics', () => {
    const stats = connectionManager.getPoolStats();

    expect(stats).toBeDefined();
    expect(stats.max).toBeGreaterThan(0);
  });

  // Test: AGE extension is loaded automatically
  it('should have AGE extension loaded automatically', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // This query will fail if AGE is not loaded
    const result = await queryExecutor.executeSQL(`SELECT '"test"'::ag_catalog.agtype as test_value`);

    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    // Check for the test_value column
    expect(result.rows[0].test_value).toBeDefined();
  });

  // Test: Search path includes ag_catalog
  it('should have ag_catalog in search_path', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Check if search_path includes ag_catalog
    const result = await queryExecutor.executeSQL('SHOW search_path');

    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].search_path).toContain('ag_catalog');
  });

  // Test: Can execute Cypher query without manually loading AGE
  it('should execute Cypher query without manually loading AGE', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a simple Cypher query
    // The connection pool should automatically load AGE and set search_path
    const result = await queryExecutor.executeCypher(`
      CREATE (n:TestNode {name: 'Test Node'})
      RETURN n
    `, {}, AGE_GRAPH_NAME);

    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);

    // The result is a string representation of a vertex
    const resultStr = result.rows[0].result;
    expect(resultStr).toContain('TestNode');
    expect(resultStr).toContain('Test Node');
  });

  // Test: Can execute parameterized Cypher query
  it('should execute parameterized Cypher query', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a parameterized Cypher query
    const params = { name: 'Parameterized Node' };
    const result = await queryExecutor.executeCypher(`
      CREATE (n:TestNode {name: $name})
      RETURN n
    `, params, AGE_GRAPH_NAME);

    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);

    // The result is a string representation of a vertex
    const resultStr = result.rows[0].result;
    expect(resultStr).toContain('TestNode');
    expect(resultStr).toContain('Parameterized Node');
  });

  // Test: Can execute multiple Cypher queries in sequence
  it('should execute multiple Cypher queries in sequence', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create multiple nodes
    for (let i = 1; i <= 3; i++) {
      const result = await queryExecutor.executeCypher(`
        CREATE (n:SequenceNode {id: ${i}, name: 'Node ${i}'})
        RETURN n
      `, {}, AGE_GRAPH_NAME);

      expect(result.rows).toHaveLength(1);

      // The result is a string representation of a vertex
      const resultStr = result.rows[0].result;
      expect(resultStr).toContain('SequenceNode');
      expect(resultStr).toContain(`"id": ${i}`);
    }

    // Query all created nodes
    const result = await queryExecutor.executeCypher(`
      MATCH (n:SequenceNode)
      RETURN n
      ORDER BY n.properties.id
    `, {}, AGE_GRAPH_NAME);

    expect(result.rows).toHaveLength(3);

    // Check each result contains the expected data
    for (let i = 0; i < 3; i++) {
      const resultStr = result.rows[i].result;
      expect(resultStr).toContain('SequenceNode');
      expect(resultStr).toContain(`"id": ${i+1}`);
    }
  });
});
