/**
 * Simplified Organization Chart Example Integration Test
 *
 * This test demonstrates the proper way to use Apache AGE with the library.
 * It follows best practices for:
 * - Loading AGE extension
 * - Setting search_path to include ag_catalog
 * - Creating vertex and edge labels
 * - Using direct Cypher queries with proper syntax
 * - Handling query results
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { QueryExecutor } from '../../../src/db/query';
import { PgConnectionManager } from '../../../src/db/connector';
import { randomBytes } from 'crypto';
import { getTestConnectionManager } from '../../setup/test-connection-manager';

// Test configuration
const TEST_GRAPH = 'simplified_org_chart';
const TEST_SCHEMA = `test_${randomBytes(3).toString('hex')}`;

describe('Simplified Organization Chart Example', () => {
  let queryExecutor: QueryExecutor;
  let connectionManager: PgConnectionManager;
  let ageAvailable = false;

  // Setup: Create connection, schema, and graph
  beforeAll(async () => {
    console.log(`Using test schema: ${TEST_SCHEMA}`);
    console.log('Creating test connection manager...');

    // Use the shared connection manager from integration setup
    connectionManager = getTestConnectionManager();

    // Get a connection from the pool
    const connection = await connectionManager.getConnection();

    // Create query executor
    queryExecutor = new QueryExecutor(connectionManager);

    // Create schema
    await queryExecutor.executeSQL(`CREATE SCHEMA IF NOT EXISTS ${TEST_SCHEMA}`);
    console.log(`Test schema ${TEST_SCHEMA} created successfully`);

    // Set search path
    await queryExecutor.executeSQL(`SET search_path TO ${TEST_SCHEMA}, public`);

    // Check if AGE is available
    try {
      const result = await queryExecutor.executeSQL(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'cypher'
      `);

      ageAvailable = result.rows[0].age_available;
      console.log('Apache AGE extension is available');
    } catch (error) {
      console.error('Apache AGE extension is not available:', error);
      return;
    }

    // Drop existing graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${TEST_GRAPH}: ${(error as Error).message}`);
    }

    // Create graph
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${TEST_GRAPH}')`);
    console.log(`Integration test setup complete. Created graph ${TEST_GRAPH}`);
  });

  // Cleanup: Drop graph and schema
  afterAll(async () => {
    if (ageAvailable) {
      try {
        await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH}', true)`);
        console.log(`Dropped test graph ${TEST_GRAPH}`);
      } catch (error) {
        console.warn(`Warning: Could not drop graph ${TEST_GRAPH}: ${(error as Error).message}`);
      }
    }

    // Connection pool is managed by the test setup
  });

  // Test: Create Employee vertex label
  it('should create Employee vertex label', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create Employee vertex label
    // The connection pool automatically loads AGE and sets the search path
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.create_vlabel('${TEST_GRAPH}', 'Employee');
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].create_vlabel).toBe('v');
  });

  // Test: Create MANAGED_BY edge label
  it('should create MANAGED_BY edge label', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create MANAGED_BY edge label
    // The connection pool automatically loads AGE and sets the search path
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.create_elabel('${TEST_GRAPH}', 'MANAGED_BY');
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].create_elabel).toBe('e');
  });

  // Test: Create employee vertices
  it('should create employee vertices', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create employee vertices using Cypher
    // The connection pool automatically loads AGE and sets the search path
    const result = await queryExecutor.executeCypher(`
      CREATE (e1:Employee {id: 1, name: 'John Smith', title: 'CEO', department: 'Executive'})
      CREATE (e2:Employee {id: 2, name: 'Jane Doe', title: 'CTO', department: 'Technology'})
      CREATE (e3:Employee {id: 3, name: 'Bob Johnson', title: 'CFO', department: 'Finance'})
      RETURN count(*) AS created_employees
    `, {}, TEST_GRAPH);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].result.created_employees).toBe(3);
  });

  // Test: Create management relationships
  it('should create management relationships', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create management relationships using Cypher
    // The connection pool automatically loads AGE and sets the search path
    const result = await queryExecutor.executeCypher(`
      MATCH (cto:Employee {title: 'CTO'}), (ceo:Employee {title: 'CEO'})
      CREATE (cto)-[:MANAGED_BY {since: '2020-01-15'}]->(ceo)
      MATCH (cfo:Employee {title: 'CFO'}), (ceo:Employee {title: 'CEO'})
      CREATE (cfo)-[:MANAGED_BY {since: '2019-05-10'}]->(ceo)
      RETURN count(*) AS created_relationships
    `, {}, TEST_GRAPH);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].result.created_relationships).toBe(2);
  });

  // Test: Query employees and their managers
  it('should query employees and their managers', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Query employees and their managers using Cypher
    // The connection pool automatically loads AGE and sets the search path
    const result = await queryExecutor.executeCypher(`
      MATCH (e:Employee)
      OPTIONAL MATCH (e)-[r:MANAGED_BY]->(m:Employee)
      RETURN e.name AS employee_name, e.title AS title,
             m.name AS manager_name, r.since AS managed_since
      ORDER BY e.name
    `, {}, TEST_GRAPH);

    expect(result.rows.length).toBe(3);

    // CEO has no manager
    const ceo = result.rows.find(row => row.result.title === 'CEO');
    expect(ceo).toBeDefined();
    expect(ceo!.result.employee_name).toBe('John Smith');
    expect(ceo!.result.manager_name).toBeNull();

    // CTO is managed by CEO
    const cto = result.rows.find(row => row.result.title === 'CTO');
    expect(cto).toBeDefined();
    expect(cto!.result.employee_name).toBe('Jane Doe');
    expect(cto!.result.manager_name).toBe('John Smith');
    expect(cto!.result.managed_since).toBe('2020-01-15');
  });
});
