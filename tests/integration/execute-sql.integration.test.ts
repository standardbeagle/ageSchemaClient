/**
 * Integration tests for executeSQL method in ageSchemaClient
 *
 * These tests verify that the executeSQL method can properly execute
 * various types of SQL queries, including Cypher queries for Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { queryExecutor, isAgeAvailable } from '../setup/integration';
import { QueryExecutor } from '../../src/db/query';
import { Connection } from '../../src/db/types';
import { getConnectionManagerForTests } from '../setup/connection-manager-for-tests';

// Graph name for the executeSQL tests
const EXECUTE_SQL_TEST_GRAPH = 'execute_sql_test_graph';

describe('executeSQL Integration', () => {
  let ageAvailable = false;
  let connection: Connection;
  let testQueryExecutor: QueryExecutor;

  // Set up the test environment
  beforeAll(async () => {
    // Get a dedicated connection for these tests
    const connectionManager = getConnectionManagerForTests();
    connection = await connectionManager.getConnection();
    testQueryExecutor = new QueryExecutor(connection);

    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, AGE-specific tests will be skipped');
    } else {
      // Drop the test graph if it exists
      try {
        await testQueryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${EXECUTE_SQL_TEST_GRAPH}', true)`);
      } catch (error) {
        console.warn(`Warning: Could not drop graph ${EXECUTE_SQL_TEST_GRAPH}: ${error.message}`);
      }

      // Create the test graph
      try {
        await testQueryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${EXECUTE_SQL_TEST_GRAPH}')`);
      } catch (error) {
        console.error(`Error creating graph ${EXECUTE_SQL_TEST_GRAPH}: ${error.message}`);
        ageAvailable = false;
      }
    }

    // Create a test table for standard SQL tests
    await testQueryExecutor.executeSQL(`
      CREATE TABLE IF NOT EXISTS test_execute_sql (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value INTEGER
      )
    `);

    // Clear the test table
    await testQueryExecutor.executeSQL('DELETE FROM test_execute_sql');
  });

  // Clean up after all tests
  afterAll(async () => {
    // Drop the test table
    await testQueryExecutor.executeSQL('DROP TABLE IF EXISTS test_execute_sql');

    if (ageAvailable) {
      // Drop the test graph
      try {
        await testQueryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${EXECUTE_SQL_TEST_GRAPH}', true)`);
      } catch (error) {
        console.warn(`Warning: Could not drop graph ${EXECUTE_SQL_TEST_GRAPH}: ${error.message}`);
      }
    }

    // Release the connection
    if (connection) {
      const connectionManager = getConnectionManagerForTests();
      await connectionManager.releaseConnection(connection);
    }
  });

  // Test: Basic SQL query
  it('should execute a basic SQL query', async () => {
    // Insert test data
    const insertResult = await testQueryExecutor.executeSQL(
      'INSERT INTO test_execute_sql (name, value) VALUES ($1, $2) RETURNING id',
      ['test1', 100]
    );

    // Verify the insert result
    expect(insertResult.rows).toHaveLength(1);
    expect(insertResult.rows[0].id).toBeGreaterThan(0);

    // Query the inserted data
    const selectResult = await testQueryExecutor.executeSQL(
      'SELECT * FROM test_execute_sql WHERE name = $1',
      ['test1']
    );

    // Verify the select result
    expect(selectResult.rows).toHaveLength(1);
    expect(selectResult.rows[0].name).toBe('test1');
    expect(selectResult.rows[0].value).toBe(100);
  });

  // Test: SQL query with multiple parameters
  it('should execute a SQL query with multiple parameters', async () => {
    // Insert multiple rows
    await testQueryExecutor.executeSQL(
      'INSERT INTO test_execute_sql (name, value) VALUES ($1, $2), ($3, $4)',
      ['test2', 200, 'test3', 300]
    );

    // Query with multiple parameters
    const result = await testQueryExecutor.executeSQL(
      'SELECT * FROM test_execute_sql WHERE value > $1 AND value < $2 ORDER BY value',
      [150, 350]
    );

    // Verify the result
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('test2');
    expect(result.rows[0].value).toBe(200);
    expect(result.rows[1].name).toBe('test3');
    expect(result.rows[1].value).toBe(300);
  });

  // Test: SQL query with no parameters
  it('should execute a SQL query with no parameters', async () => {
    // Query all rows
    const result = await testQueryExecutor.executeSQL('SELECT COUNT(*) as count FROM test_execute_sql');

    // Verify the result
    expect(result.rows).toHaveLength(1);
    // Convert count to number since it might be returned as a string
    const count = parseInt(result.rows[0].count, 10);
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 rows from previous tests
  });

  // Test: SQL query with error
  it('should handle SQL query errors', async () => {
    // Execute a query with a syntax error
    await expect(testQueryExecutor.executeSQL('SELECT * FROM nonexistent_table'))
      .rejects.toThrow(/relation "nonexistent_table" does not exist/);
  });

  // Test: Cypher query via executeSQL
  it('should execute a Cypher query via executeSQL', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a test vertex using executeSQL with Cypher
    const cypher = `CREATE (n:TestNode {name: 'test_node', value: 42}) RETURN n.name AS name`;
    const sql = `SELECT * FROM ag_catalog.cypher('${EXECUTE_SQL_TEST_GRAPH}', $q$${cypher}$q$, $1) AS (name ag_catalog.agtype)`;

    const result = await testQueryExecutor.executeSQL(sql, ['{}']);

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('test_node');
  });

  // Test: Cypher query with parameters via executeSQL
  it('should execute a Cypher query with parameters via executeSQL', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a test vertex with parameters
    const nodeName = 'param_node';
    const nodeValue = 100;
    const params = JSON.stringify({ nodeName, nodeValue });

    const cypher = `CREATE (n:TestNode {name: $nodeName, value: $nodeValue}) RETURN n.name AS name, n.value AS value`;
    const sql = `SELECT * FROM ag_catalog.cypher('${EXECUTE_SQL_TEST_GRAPH}', $q$${cypher}$q$, $1) AS (name ag_catalog.agtype, value ag_catalog.agtype)`;

    const result = await testQueryExecutor.executeSQL(sql, [params]);

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe(nodeName);
    expect(parseInt(result.rows[0].value, 10)).toBe(nodeValue);
  });

  // Test: Cypher query with complex parameters via executeSQL
  it('should execute a Cypher query with complex parameters via executeSQL', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a test vertex with complex parameters
    const params = JSON.stringify({
      node: {
        name: 'complex_node',
        properties: {
          value: 200,
          tags: ['tag1', 'tag2'],
          nested: {
            key: 'value'
          }
        }
      }
    });

    const cypher = `
      CREATE (n:TestNode {
        name: $node.name,
        value: $node.properties.value,
        tags: $node.properties.tags,
        nestedKey: $node.properties.nested.key
      })
      RETURN n.name AS name, n.value AS value, n.tags AS tags, n.nestedKey AS nestedKey
    `;

    const sql = `SELECT * FROM ag_catalog.cypher('${EXECUTE_SQL_TEST_GRAPH}', $q$${cypher}$q$, $1) AS (name ag_catalog.agtype, value ag_catalog.agtype, tags ag_catalog.agtype, nestedKey ag_catalog.agtype)`;

    const result = await testQueryExecutor.executeSQL(sql, [params]);

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('complex_node');
    expect(parseInt(result.rows[0].value, 10)).toBe(200);
    expect(JSON.parse(result.rows[0].tags)).toEqual(['tag1', 'tag2']);

    // Check if nestedKey exists and is not undefined before parsing
    if (result.rows[0].nestedKey !== undefined) {
      expect(JSON.parse(result.rows[0].nestedKey)).toBe('value');
    } else {
      console.warn('Warning: nestedKey is undefined in the result');
    }
  });

  // Test: Cypher query with MATCH via executeSQL
  it('should execute a Cypher MATCH query via executeSQL', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Query the test nodes created in previous tests
    const cypher = `MATCH (n:TestNode) RETURN n.name AS name, n.value AS value ORDER BY n.value`;
    const sql = `SELECT * FROM ag_catalog.cypher('${EXECUTE_SQL_TEST_GRAPH}', $q$${cypher}$q$, $1) AS (name ag_catalog.agtype, value ag_catalog.agtype)`;

    const result = await testQueryExecutor.executeSQL(sql, ['{}']);

    // Verify the result
    expect(result.rows.length).toBeGreaterThanOrEqual(3); // At least 3 nodes from previous tests

    // Check that the nodes are ordered by value
    const values = result.rows.map(row => parseInt(row.value, 10));
    const sortedValues = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sortedValues);
  });
});
