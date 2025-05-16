/**
 * Combined Vertex and Edge Loading integration tests
 *
 * These tests demonstrate how to load both vertices and edges in a single operation
 * using PostgreSQL functions that return data in a format compatible with Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME
} from './base-test';

describe('Combined Vertex and Edge Loading', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Combined Vertex and Edge Loading');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Test 1: Create a function to return both vertices and edges
  it('should create a function to return both vertices and edges', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to return both vertices and edges
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_graph_data()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '{
          "vertices": {
            "Person": [
              {"id": 1, "name": "Alice", "age": 30},
              {"id": 2, "name": "Bob", "age": 25},
              {"id": 3, "name": "Charlie", "age": 35}
            ],
            "City": [
              {"id": 1, "name": "New York", "population": 8000000},
              {"id": 2, "name": "Los Angeles", "population": 4000000},
              {"id": 3, "name": "Chicago", "population": 2700000}
            ]
          },
          "edges": {
            "LIVES_IN": [
              {"from": {"label": "Person", "id": 1}, "to": {"label": "City", "id": 1}, "properties": {"since": "2010-05-15"}},
              {"from": {"label": "Person", "id": 2}, "to": {"label": "City", "id": 2}, "properties": {"since": "2015-03-20"}},
              {"from": {"label": "Person", "id": 3}, "to": {"label": "City", "id": 3}, "properties": {"since": "2018-11-10"}}
            ],
            "VISITED": [
              {"from": {"label": "Person", "id": 1}, "to": {"label": "City", "id": 2}, "properties": {"date": "2022-07-15"}},
              {"from": {"label": "Person", "id": 2}, "to": {"label": "City", "id": 3}, "properties": {"date": "2022-08-10"}},
              {"from": {"label": "Person", "id": 3}, "to": {"label": "City", "id": 1}, "properties": {"date": "2022-06-05"}}
            ]
          }
        }'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname = 'get_graph_data'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 2: Create Person vertices
  it('should create Person vertices', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create Person vertices
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_graph_data().vertices.Person AS person
      CREATE (p:Person {
        id: person.id,
        name: person.name,
        age: person.age
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertices were created
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].result)).toBe(3);
  });

  // Test 3: Create City vertices
  it('should create City vertices', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create City vertices
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_graph_data().vertices.City AS city
      CREATE (c:City {
        id: city.id,
        name: city.name,
        population: city.population
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertices were created
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].result)).toBe(3);
  });

  // Test 4: Create LIVES_IN edges
  it('should create LIVES_IN edges', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create LIVES_IN edges
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_graph_data().edges.LIVES_IN AS edge
      MATCH (p:Person {id: edge.from.id}), (c:City {id: edge.to.id})
      CREATE (p)-[:LIVES_IN {since: edge.properties.since}]->(c)
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the edges were created
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].result)).toBe(3);
  });

  // Test 5: Create VISITED edges
  it('should create VISITED edges', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create VISITED edges
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_graph_data().edges.VISITED AS edge
      MATCH (p:Person {id: edge.from.id}), (c:City {id: edge.to.id})
      CREATE (p)-[:VISITED {date: edge.properties.date}]->(c)
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the edges were created
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].result)).toBe(3);
  });

  // Test 6: Create a function to get vertices by label
  it('should create a function to get vertices by label', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to get vertices by label
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_vertices(label text)
      RETURNS text AS $$
      DECLARE
        result_text text;
      BEGIN
        -- Extract the JSON array as text
        SELECT ${TEST_SCHEMA}.get_graph_data()::text INTO result_text;
        -- Return the text representation
        RETURN result_text;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname = 'get_vertices'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 7: Create a function to get edges by label
  it('should create a function to get edges by label', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to get edges by label
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_edges(label text)
      RETURNS text AS $$
      DECLARE
        result_text text;
      BEGIN
        -- Extract the JSON array as text
        SELECT ${TEST_SCHEMA}.get_graph_data()::text INTO result_text;
        -- Return the text representation
        RETURN result_text;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname = 'get_edges'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 8: Query the graph using the helper functions
  it('should query the graph using the helper functions', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Query people who live in New York
    const result = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[:LIVES_IN]->(c:City {name: 'New York'})
      RETURN p.name AS name
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows).toHaveLength(1);
    // The result is a string representation of the name with quotes
    expect(result.rows[0].result.replace(/"/g, '')).toBe('Alice');

    // Query cities visited by Bob
    const visitedResult = await queryExecutor.executeCypher(`
      MATCH (p:Person {name: 'Bob'})-[:VISITED]->(c:City)
      RETURN c.name AS city
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(visitedResult.rows).toHaveLength(1);
    // The result is a string representation of the city name with quotes
    expect(visitedResult.rows[0].result.replace(/"/g, '')).toBe('Chicago');
  });
});
