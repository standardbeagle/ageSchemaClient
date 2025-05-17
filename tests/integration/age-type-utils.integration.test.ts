/**
 * Integration tests for Apache AGE Type Utilities
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME
} from './base-test';
import {
  createArrayFunction,
  createObjectFunction,
  createTempTableWithParams,
  createParamFunctionFromTable,
  executeCypherWithParams
} from '../../src/utils/age-type-utils';

describe('AGE Type Utilities Integration Tests', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('AGE Type Utilities Integration Tests');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Test 1: Create and use an array function
  it('should create and use an array function', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create an array of people
    const people = [
      { id: 1, name: 'John', age: 30 },
      { id: 2, name: 'Jane', age: 25 },
      { id: 3, name: 'Bob', age: 40 }
    ];

    // Create a function to return the array
    const functionName = 'get_people_array';
    await createArrayFunction(queryExecutor, TEST_SCHEMA, functionName, people);

    // Create Person vertices using UNWIND with the function
    const createResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.${functionName}() AS person
      CREATE (p:Person {
        id: person.id,
        name: person.name,
        age: person.age
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify that 3 vertices were created
    expect(createResult.rows[0].created).toBe(3);

    // Query the vertices to verify the data
    const queryResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.id AS id, p.name AS name, p.age AS age
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(queryResult.rows.length).toBe(3);
    expect(queryResult.rows[0].id).toBe(1);
    expect(queryResult.rows[0].name).toBe('John');
    expect(queryResult.rows[0].age).toBe(30);
    expect(queryResult.rows[1].id).toBe(2);
    expect(queryResult.rows[1].name).toBe('Jane');
    expect(queryResult.rows[1].age).toBe(25);
    expect(queryResult.rows[2].id).toBe(3);
    expect(queryResult.rows[2].name).toBe('Bob');
    expect(queryResult.rows[2].age).toBe(40);
  });

  // Test 2: Create and use an object function
  it('should create and use an object function', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query parameters object
    const params = {
      minAge: 30,
      maxAge: 50,
      departments: ['Engineering', 'Marketing']
    };

    // Create a function to return the parameters
    const functionName = 'get_query_params';
    await createObjectFunction(queryExecutor, TEST_SCHEMA, functionName, params);

    // Query vertices using the parameters
    const result = await queryExecutor.executeCypher(`
      WITH ${TEST_SCHEMA}.${functionName}() AS params
      MATCH (p:Person)
      WHERE p.age >= params.minAge AND p.age <= params.maxAge
      RETURN p.id AS id, p.name AS name, p.age AS age
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].id).toBe(1);
    expect(result.rows[0].name).toBe('John');
    expect(result.rows[0].age).toBe(30);
    expect(result.rows[1].id).toBe(3);
    expect(result.rows[1].name).toBe('Bob');
    expect(result.rows[1].age).toBe(40);
  });

  // Test 3: Create and use a temp table with parameters
  it('should create and use a temp table with parameters', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query parameters object
    const params = {
      minAge: 20,
      maxAge: 35,
      departments: ['Engineering', 'Marketing'],
      active: true,
      createdAt: new Date('2023-01-01T00:00:00.000Z')
    };

    // Create a temp table with parameters
    const tableName = 'temp_params';
    await createTempTableWithParams(queryExecutor, TEST_SCHEMA, tableName, params);

    // Create a function to return the parameters
    const functionName = 'get_params_from_table';
    await createParamFunctionFromTable(queryExecutor, TEST_SCHEMA, functionName, tableName);

    // Query vertices using the parameters
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.${functionName}() AS params
      MATCH (p:Person)
      WHERE p.age >= params.minAge AND p.age <= params.maxAge
      RETURN p.id AS id, p.name AS name, p.age AS age
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].id).toBe(1);
    expect(result.rows[0].name).toBe('John');
    expect(result.rows[0].age).toBe(30);
    expect(result.rows[1].id).toBe(2);
    expect(result.rows[1].name).toBe('Jane');
    expect(result.rows[1].age).toBe(25);
  });

  // Test 4: Execute a Cypher query with parameters
  it('should execute a Cypher query with parameters', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query parameters object
    const params = {
      minAge: 20,
      maxAge: 35,
      departments: ['Engineering', 'Marketing'],
      active: true,
      createdAt: new Date('2023-01-01T00:00:00.000Z')
    };

    // Execute a Cypher query with parameters
    const result = await executeCypherWithParams(
      queryExecutor,
      TEST_SCHEMA,
      AGE_GRAPH_NAME,
      `
        UNWIND ${TEST_SCHEMA}.get_params_${Date.now()}() AS params
        MATCH (p:Person)
        WHERE p.age >= params.minAge AND p.age <= params.maxAge
        RETURN p.id AS id, p.name AS name, p.age AS age
        ORDER BY p.id
      `,
      params
    );

    // Verify the query results
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].id).toBe(1);
    expect(result.rows[0].name).toBe('John');
    expect(result.rows[0].age).toBe(30);
    expect(result.rows[1].id).toBe(2);
    expect(result.rows[1].name).toBe('Jane');
    expect(result.rows[1].age).toBe(25);
  });
});
