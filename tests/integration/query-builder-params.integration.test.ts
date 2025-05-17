/**
 * Integration tests for query builder with parameters in ageSchemaClient
 *
 * These tests demonstrate how to use the QueryBuilder with parameters
 * in a way that's compatible with Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';
import { QueryBuilder } from '../../src/query/builder';
import { OrderDirection } from '../../src/query/types';

// Graph name for the query builder parameter tests
const PARAM_TEST_GRAPH = 'param_test_graph';

// Import the schema types
import { SchemaDefinition, PropertyType } from '../../src/schema/types';

// Define a simple schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      properties: {
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER }
      },
      required: ['name']
    }
  },
  edges: {},
  version: '1.0.0'
};

describe('QueryBuilder Parameter Integration', () => {
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
      return;
    }

    // Create test data
    await queryExecutor.executeCypher(`
      CREATE (a:Person {name: 'Alice', age: 30})
    `, {}, PARAM_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (b:Person {name: 'Bob', age: 25})
    `, {}, PARAM_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (c:Person {name: 'Charlie', age: 35})
    `, {}, PARAM_TEST_GRAPH);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Basic MATCH query with parameter using WITH clause
  it('should execute a MATCH query with parameter using WITH clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function in the test schema to return parameters
    // Note: The function must accept ag_catalog.agtype and return ag_catalog.agtype
    await queryExecutor.executeSQL(`
      SET search_path = ag_catalog, public;

      -- Create function with integer parameter
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_age_param(age_value int)
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN jsonb_build_object('age', age_value)::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;

      -- Create function with agtype parameter (needed for Cypher queries)
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_age_param(age_value ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        v_age int;
      BEGIN
        -- Extract the integer value from agtype
        v_age := age_value::text::int;
        RETURN jsonb_build_object('age', v_age)::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    try {
      // Execute a Cypher query with a parameter using WITH clause
      const result = await queryExecutor.executeCypher(`
        WITH ${TEST_SCHEMA}.get_age_param(30) AS params
        MATCH (p:Person)
        WHERE p.age = params.age
        RETURN p.name AS name, p.age AS age
      `, {}, PARAM_TEST_GRAPH);

      // Verify the result
      expect(result.rows).toHaveLength(1);
      expect(JSON.parse(result.rows[0].name)).toBe('Alice');
      expect(JSON.parse(result.rows[0].age)).toBe(30);
    } finally {
      // Clean up the functions
      await queryExecutor.executeSQL(`
        DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_age_param(int);
        DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_age_param(ag_catalog.agtype);
      `);
    }
  });

  // Test: Using QueryBuilder with parameters
  it('should use QueryBuilder with parameters', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function in the test schema to return parameters
    // Note: The function must return ag_catalog.agtype for Apache AGE
    await queryExecutor.executeSQL(`
      SET search_path = ag_catalog, public;

      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_query_params()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN jsonb_build_object('min_age', 30)::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    try {
      // Create a query builder
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PARAM_TEST_GRAPH);

      // Build a query with the withParamFunction method
      // This adds a WITH clause that calls the function to get parameters
      const result = await queryBuilder
        .withParamFunction(`${TEST_SCHEMA}.get_query_params`, 'params')
        .match('Person', 'p')
        .done()
        .where('p.age >= params.min_age')
        .return('p.name AS name', 'p.age AS age')
        .orderBy('p.age', OrderDirection.ASC)
        .execute();

      // Verify the result
      expect(result.rows).toHaveLength(2);
      expect(JSON.parse(result.rows[0].name)).toBe('Alice');
      expect(JSON.parse(result.rows[0].age)).toBe(30);
      expect(JSON.parse(result.rows[1].name)).toBe('Charlie');
      expect(JSON.parse(result.rows[1].age)).toBe(35);
    } finally {
      // Clean up the function
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_query_params()`);
    }
  });
});
