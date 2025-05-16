/**
 * Integration tests for Apache AGE parameter passing
 *
 * These tests demonstrate different approaches to passing parameters to Cypher queries
 * in Apache AGE, focusing on the limitations of agtype and parameter passing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA,
  connectionManager
} from '../../setup/integration';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'param_test_graph';

describe('Apache AGE Parameter Passing', () => {
  let ageAvailable = false;

  // Check if AGE is properly installed and configured
  beforeAll(async () => {
    try {
      // Check if AGE is available by checking for the existence of the ag_catalog schema
      // and a known AGE function (create_graph)
      const result = await queryExecutor.executeSQL(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
      `);

      ageAvailable = result.rows[0].age_available;

      if (!ageAvailable) {
        throw new Error('AGE extension not properly installed');
      }
    } catch (error) {
      throw new Error(
        'Apache AGE extension is not properly installed or configured. ' +
        'This library requires AGE to function. ' +
        'Please ensure AGE is installed and properly configured in your database.'
      );
    }
  });

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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${PARAM_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${PARAM_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  }, 15000); // Increase timeout to 15 seconds

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) return;

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }

    // Drop the test functions
    try {
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_test_params()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_person_params()`);
    } catch (error) {
      console.warn(`Warning: Could not drop functions: ${error.message}`);
    }
  });

  // Test 1: Create a function to return parameters as agtype
  it('should create a function to return parameters as agtype', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to return test parameters
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_test_params()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '{"name": "Test Person", "age": 30, "tags": ["test", "person"]}'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'get_test_params'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 2: Use UNWIND with function return value to create a vertex
  it('should create a vertex using UNWIND with function return value', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a vertex using UNWIND with function return value
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_test_params() AS params
      CREATE (p:Person {
        name: params.name,
        age: params.age,
        tags: params.tags
      })
      RETURN p
    `, {}, PARAM_TEST_GRAPH);

    // Verify the vertex was created
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result.p.properties.name).toBe('Test Person');
    expect(result.rows[0].result.p.properties.age).toBe(30);
    expect(result.rows[0].result.p.properties.tags).toEqual(['test', 'person']);
  });

  // Test 3: Create a dynamic function with parameters
  it('should create a dynamic function with parameters', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Parameters to pass to the Cypher query
    const params = {
      name: 'Dynamic Person',
      age: 25,
      active: true,
      skills: ['coding', 'testing']
    };

    // Create a function to return the parameters
    const paramsJson = JSON.stringify(params);
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_person_params()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '${paramsJson}'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a vertex using the dynamic function
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_person_params() AS params
      CREATE (p:Person {
        name: params.name,
        age: params.age,
        active: params.active,
        skills: params.skills
      })
      RETURN p
    `, {}, PARAM_TEST_GRAPH);

    // Verify the vertex was created
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result.p.properties.name).toBe('Dynamic Person');
    expect(result.rows[0].result.p.properties.age).toBe(25);
    expect(result.rows[0].result.p.properties.active).toBe(true);
    expect(result.rows[0].result.p.properties.skills).toEqual(['coding', 'testing']);
  });

  // Test 4: Query vertices with parameters
  it('should query vertices with parameters', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function with query parameters
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_query_params()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '{"name": "Test Person"}'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Query vertices using the function parameters
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_query_params() AS params
      MATCH (p:Person {name: params.name})
      RETURN p
    `, {}, PARAM_TEST_GRAPH);

    // Verify the query returned the expected vertex
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result.p.properties.name).toBe('Test Person');
    expect(result.rows[0].result.p.properties.age).toBe(30);
  });

  // Test 5: Create a helper function to simplify parameter passing
  it('should use a helper function to simplify parameter passing', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Parameters to pass to the Cypher query
    const params = {
      minAge: 20,
      maxAge: 35
    };

    // Create a temporary function name
    const functionName = `${TEST_SCHEMA}.temp_params_${Date.now().toString(36)}`;

    try {
      // Create a temporary function that returns the parameters as agtype
      const paramsJson = JSON.stringify(params);
      await queryExecutor.executeSQL(`
        CREATE OR REPLACE FUNCTION ${functionName}()
        RETURNS ag_catalog.agtype AS $$
        BEGIN
          RETURN '${paramsJson}'::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Query vertices using the temporary function
      const result = await queryExecutor.executeCypher(`
        UNWIND ${functionName}() AS params
        MATCH (p:Person)
        WHERE p.age >= params.minAge AND p.age <= params.maxAge
        RETURN p.name AS name, p.age AS age
      `, {}, PARAM_TEST_GRAPH);

      // Verify the query returned the expected vertices
      expect(result.rows.length).toBeGreaterThan(0);

      // Check that all returned vertices match the age criteria
      for (const row of result.rows) {
        const age = row.result.age;
        expect(age).toBeGreaterThanOrEqual(params.minAge);
        expect(age).toBeLessThanOrEqual(params.maxAge);
      }
    } finally {
      // Clean up the temporary function
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${functionName}()`);
    }
  });
});
