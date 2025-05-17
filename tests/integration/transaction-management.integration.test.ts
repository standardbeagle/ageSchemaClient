/**
 * Integration tests for transaction management in ageSchemaClient
 *
 * These tests verify that the TransactionManager can properly manage
 * transactions in a PostgreSQL database with Apache AGE extension.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  transactionManager,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';

// Graph name for the transaction tests
const TRANSACTION_TEST_GRAPH = 'transaction_test_graph';

describe('TransactionManager Integration', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${TRANSACTION_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${TRANSACTION_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${TRANSACTION_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${TRANSACTION_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${TRANSACTION_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${TRANSACTION_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Execute a successful transaction
  it('should execute a successful transaction', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a transaction
    await transactionManager.withTransaction(async (transaction) => {
      // Create a test table
      await queryExecutor.executeSQL(`
        CREATE TABLE IF NOT EXISTS ${TEST_SCHEMA}.transaction_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // Insert data
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.transaction_test (name)
        VALUES ($1), ($2), ($3)
      `, ['Alice', 'Bob', 'Charlie']);

      // Create a vertex in the graph
      await queryExecutor.executeCypher(`
        CREATE (p:Person {name: 'Alice', age: 30})
        RETURN p
      `, {}, TRANSACTION_TEST_GRAPH);
    });

    // Verify the data was committed
    const sqlResult = await queryExecutor.executeSQL(`
      SELECT * FROM ${TEST_SCHEMA}.transaction_test
      ORDER BY id
    `);

    expect(sqlResult.rows).toHaveLength(3);
    expect(sqlResult.rows[0].name).toBe('Alice');
    expect(sqlResult.rows[1].name).toBe('Bob');
    expect(sqlResult.rows[2].name).toBe('Charlie');

    // Verify the vertex was created
    const cypherResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.name AS name, p.age AS age
    `, {}, TRANSACTION_TEST_GRAPH);

    expect(cypherResult.rows).toHaveLength(1);
    expect(JSON.parse(cypherResult.rows[0].name)).toBe('Alice');
    expect(parseInt(cypherResult.rows[0].age, 10)).toBe(30);

    // Clean up
    await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.transaction_test`);
  });

  // Test: Execute a transaction with rollback
  it('should rollback a transaction on error', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a test table
    await queryExecutor.executeSQL(`
      CREATE TABLE IF NOT EXISTS ${TEST_SCHEMA}.transaction_rollback_test (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    // Execute a transaction that will fail
    try {
      await transactionManager.withTransaction(async (transaction) => {
        // Insert data
        await queryExecutor.executeSQL(`
          INSERT INTO ${TEST_SCHEMA}.transaction_rollback_test (name)
          VALUES ($1), ($2), ($3)
        `, ['Dave', 'Eve', 'Frank']);

        // Create a vertex in the graph
        await queryExecutor.executeCypher(`
          CREATE (p:Person {name: 'Dave', age: 40})
          RETURN p
        `, {}, TRANSACTION_TEST_GRAPH);

        // Throw an error to trigger rollback
        throw new Error('Intentional error to trigger rollback');
      });
    } catch (error) {
      // Expected error
    }

    // Verify the data was rolled back
    const sqlResult = await queryExecutor.executeSQL(`
      SELECT * FROM ${TEST_SCHEMA}.transaction_rollback_test
    `);

    expect(sqlResult.rows).toHaveLength(0);

    // Clean up
    await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.transaction_rollback_test`);
  });

  // Test: Execute a transaction with a specific isolation level
  it('should execute a transaction with a specific isolation level', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a transaction with READ COMMITTED isolation level
    await transactionManager.withTransaction(async (transaction) => {
      // Create a test table
      await queryExecutor.executeSQL(`
        CREATE TABLE IF NOT EXISTS ${TEST_SCHEMA}.isolation_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // Insert data
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.isolation_test (name)
        VALUES ($1), ($2), ($3)
      `, ['Grace', 'Hank', 'Ivy']);

      // Verify the isolation level
      const isolationResult = await queryExecutor.executeSQL(`
        SHOW transaction_isolation
      `);

      expect(isolationResult.rows).toHaveLength(1);
      expect(isolationResult.rows[0].transaction_isolation).toBe('read committed');
    });

    // Clean up
    await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.isolation_test`);
  });

  // Test: Execute nested transactions
  it('should handle nested transactions', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute an outer transaction
    await transactionManager.withTransaction(async (outerTransaction) => {
      // Create a test table
      await queryExecutor.executeSQL(`
        CREATE TABLE IF NOT EXISTS ${TEST_SCHEMA}.nested_transaction_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          level TEXT NOT NULL
        )
      `);

      // Insert data in the outer transaction
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.nested_transaction_test (name, level)
        VALUES ($1, $2)
      `, ['Outer', 'Level 1']);

      // Execute an inner transaction
      await transactionManager.withTransaction(async (innerTransaction) => {
        // Insert data in the inner transaction
        await queryExecutor.executeSQL(`
          INSERT INTO ${TEST_SCHEMA}.nested_transaction_test (name, level)
          VALUES ($1, $2)
        `, ['Inner', 'Level 2']);
      });

      // Insert more data in the outer transaction
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.nested_transaction_test (name, level)
        VALUES ($1, $2)
      `, ['Outer Again', 'Level 1']);
    });

    // Verify all data was committed
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM ${TEST_SCHEMA}.nested_transaction_test
      ORDER BY id
    `);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].name).toBe('Outer');
    expect(result.rows[0].level).toBe('Level 1');
    expect(result.rows[1].name).toBe('Inner');
    expect(result.rows[1].level).toBe('Level 2');
    expect(result.rows[2].name).toBe('Outer Again');
    expect(result.rows[2].level).toBe('Level 1');

    // Clean up
    await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.nested_transaction_test`);
  });
});
