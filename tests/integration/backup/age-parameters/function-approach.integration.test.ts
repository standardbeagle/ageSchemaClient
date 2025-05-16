/**
 * Integration test for Apache AGE parameter passing using functions
 *
 * This test demonstrates the approach used in the org-chart tests
 * to pass parameters to Cypher queries in Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'param_test_graph';

describe('Apache AGE Parameter Passing with Functions', () => {
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

    // Create a function to return parameters
    try {
      await queryExecutor.executeSQL(`
        CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_person_params()
        RETURNS jsonb AS $$
        BEGIN
          RETURN '{"name": "Test Person", "age": 30, "active": true, "tags": ["test", "person"]}'::jsonb;
        END;
        $$ LANGUAGE plpgsql;
      `);
    } catch (error) {
      console.error(`Error creating function: ${error.message}`);
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

    // Drop the test function
    try {
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_person_params()`);
    } catch (error) {
      console.warn(`Warning: Could not drop function: ${error.message}`);
    }
  });

  // Test: Create a vertex using function parameters
  it('should create a vertex using function parameters', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    try {
      // Create a vertex using the function parameters
      const createResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          WITH ${TEST_SCHEMA}.get_person_params() AS params
          CREATE (p:Person {
            name: params->>'name',
            age: (params->>'age')::int,
            active: (params->>'active')::boolean,
            tags: params->'tags'
          })
          RETURN 1 as success
        $$) as (success int);
      `);

      // Verify the query executed successfully
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].success).toBe(1);

      // Query the vertex to verify it was created correctly
      const queryResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (p:Person)
          RETURN p.name AS name, p.age AS age, p.active AS active
        $$) as (name text, age int, active boolean);
      `);

      // Verify the query returned the expected vertex
      expect(queryResult.rows).toHaveLength(1);
      expect(queryResult.rows[0].name).toBe('Test Person');
      expect(queryResult.rows[0].age).toBe(30);
      expect(queryResult.rows[0].active).toBe(true);
    } catch (error) {
      console.error('Error executing Cypher query:', error);
      throw error;
    }
  });
});
