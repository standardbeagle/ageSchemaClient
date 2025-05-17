/**
 * Integration tests for query builder with age_params in ageSchemaClient
 *
 * These tests demonstrate how to use the QueryBuilder with the age_params
 * temporary table for parameter passing in a way that's compatible with Apache AGE.
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
const AGE_PARAMS_TEST_GRAPH = 'age_params_test_graph';

// Define a simple schema for testing
const testSchema = {
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' }
      },
      required: ['name']
    }
  },
  edges: {},
  version: '1.0.0'
};

describe('QueryBuilder with age_params Integration Tests', () => {
  let ageAvailable = false;

  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Create a test graph
    try {
      // Try to drop the graph if it exists
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${AGE_PARAMS_TEST_GRAPH}', true)
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
      console.log(`Graph ${AGE_PARAMS_TEST_GRAPH} doesn't exist or couldn't be dropped:`, error.message);
    }

    // Create the graph
    await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.create_graph('${AGE_PARAMS_TEST_GRAPH}')
    `);

    // Create test data
    await queryExecutor.executeCypher(`
      CREATE (p:Person {name: 'Alice', age: 30, active: true}),
             (p2:Person {name: 'Bob', age: 25, active: false}),
             (p3:Person {name: 'Charlie', age: 35, active: true})
    `, {}, AGE_PARAMS_TEST_GRAPH);

    // Create the age_schema_client schema if it doesn't exist
    await queryExecutor.executeSQL(`
      CREATE SCHEMA IF NOT EXISTS age_schema_client;
    `);

    // Create the functions to retrieve parameters from the age_params table
    await queryExecutor.executeSQL(`
      -- Function to retrieve a single parameter from the age_params table
      -- This function accepts a text parameter
      CREATE OR REPLACE FUNCTION age_schema_client.get_age_param(param_key text)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_json JSONB;
      BEGIN
        -- Get the parameter value
        SELECT value INTO result_json
        FROM age_params
        WHERE key = param_key;

        -- Return null if the parameter doesn't exist
        IF result_json IS NULL THEN
          RETURN NULL;
        END IF;

        -- Return as agtype
        RETURN result_json::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to retrieve a single parameter from the age_params table
      -- This function accepts an agtype parameter
      CREATE OR REPLACE FUNCTION age_schema_client.get_age_param(param_key ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        key_text TEXT;
        result_json JSONB;
      BEGIN
        -- Convert agtype to text
        key_text := param_key::text;
        -- Remove quotes if present
        key_text := REPLACE(key_text, '"', '');

        -- Get the parameter value
        SELECT value INTO result_json
        FROM age_params
        WHERE key = key_text;

        -- Return null if the parameter doesn't exist
        IF result_json IS NULL THEN
          RETURN NULL;
        END IF;

        -- Return as agtype
        RETURN result_json::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to retrieve all parameters from the age_params table
      CREATE OR REPLACE FUNCTION age_schema_client.get_all_age_params()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_json JSONB;
      BEGIN
        -- Use jsonb_object_agg to convert rows to a single JSONB object
        SELECT jsonb_object_agg(key, value)
        INTO result_json
        FROM age_params;

        -- Return empty object if no parameters exist
        IF result_json IS NULL THEN
          RETURN '{}'::text::ag_catalog.agtype;
        END IF;

        -- Return as agtype
        RETURN result_json::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);
  });

  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${AGE_PARAMS_TEST_GRAPH}', true)
      `);
    } catch (error) {
      console.warn(`Failed to drop graph ${AGE_PARAMS_TEST_GRAPH}:`, error.message);
    }
  });

  // Test: Using setParam and withAgeParam
  it('should use setParam and withAgeParam to pass parameters to Cypher queries', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_PARAMS_TEST_GRAPH);

    // Set a parameter in the age_params table
    await queryBuilder.setParam('min_age', 30);

    // Build a query with the withAgeParam method
    // This adds a WITH clause that calls the get_age_param function
    const result = await queryBuilder
      .withAgeParam('min_age', 'params')
      .match('Person', 'p')
      .done()
      .where('p.age >= params')
      .return('p.name AS name', 'p.age AS age')
      .orderBy('p.age', OrderDirection.ASC)
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const names = result.rows.map(row =>
      typeof row.name === 'string' ? JSON.parse(row.name) : row.name
    );

    expect(names).toContain('Alice');
    expect(names).toContain('Charlie');
  });

  // Test: Using setParam with complex object and withAgeParam
  it('should use setParam with complex object and withAgeParam', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_PARAMS_TEST_GRAPH);

    // Set a complex parameter in the age_params table
    await queryBuilder.setParam('filter', {
      min_age: 25,
      active: true
    });

    // Build a query with the withAgeParam method
    const result = await queryBuilder
      .withAgeParam('filter', 'params')
      .match('Person', 'p')
      .done()
      .where('p.age >= params.min_age AND p.active = params.active')
      .return('p.name AS name', 'p.age AS age', 'p.active AS active')
      .orderBy('p.age', OrderDirection.ASC)
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const names = result.rows.map(row =>
      typeof row.name === 'string' ? JSON.parse(row.name) : row.name
    );

    expect(names).toContain('Alice');
    expect(names).toContain('Charlie');
  });

  // Test: Using setParam with multiple parameters and withAllAgeParams
  it('should use setParam with multiple parameters and withAllAgeParams', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_PARAMS_TEST_GRAPH);

    // Set multiple parameters in the age_params table
    await queryBuilder.setParam('min_age', 25);
    await queryBuilder.setParam('active', true);

    // Build a query with the withAllAgeParams method
    const result = await queryBuilder
      .withAllAgeParams('params')
      .match('Person', 'p')
      .done()
      .where('p.age >= params.min_age AND p.active = params.active')
      .return('p.name AS name', 'p.age AS age', 'p.active AS active')
      .orderBy('p.age', OrderDirection.ASC)
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const names = result.rows.map(row =>
      typeof row.name === 'string' ? JSON.parse(row.name) : row.name
    );

    expect(names).toContain('Alice');
    expect(names).toContain('Charlie');
  });
});
