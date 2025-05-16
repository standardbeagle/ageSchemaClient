/**
 * Parameter Passing integration tests
 * 
 * These tests demonstrate different approaches to passing parameters to Cypher queries
 * in Apache AGE, focusing on the limitations of agtype and parameter passing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME
} from './base-test';

describe('Parameter Passing', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Parameter Passing');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Test 1: Create a function to return parameters as agtype
  it('should create a function to return parameters as agtype', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to return parameters as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_person_params()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '{"name": "Test Person", "age": 30, "active": true, "skills": ["coding", "testing"]}'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname = 'get_person_params'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 2: Create a vertex using UNWIND with function parameters
  it('should create a vertex using UNWIND with function parameters', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a vertex using the function parameters
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_person_params() AS params
      CREATE (p:Person {
        name: params.name,
        age: params.age,
        active: params.active,
        skills: params.skills
      })
      RETURN p
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertex was created
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result.p.properties.name).toBe('Test Person');
    expect(result.rows[0].result.p.properties.age).toBe(30);
    expect(result.rows[0].result.p.properties.active).toBe(true);
    expect(result.rows[0].result.p.properties.skills).toEqual(['coding', 'testing']);
  });

  // Test 3: Query vertices with parameters
  it('should query vertices with parameters', async () => {
    // Skip if AGE is not available
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
    `, {}, AGE_GRAPH_NAME);

    // Verify the query returned the expected vertex
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result.p.properties.name).toBe('Test Person');
    expect(result.rows[0].result.p.properties.age).toBe(30);
  });

  // Test 4: Create a function to handle arrays of objects
  it('should create a function to handle arrays of objects', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to return an array of person objects
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_people_array()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '[
          {"id": 1, "name": "Alice", "age": 30},
          {"id": 2, "name": "Bob", "age": 25},
          {"id": 3, "name": "Charlie", "age": 35}
        ]'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create vertices using the array function
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_people_array() AS person
      CREATE (p:Person {
        id: person.id,
        name: person.name,
        age: person.age
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertices were created
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].created).toBe(3);

    // Query the created vertices
    const queryResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      WHERE p.id IN [1, 2, 3]
      RETURN p.id AS id, p.name AS name, p.age AS age
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(queryResult.rows).toHaveLength(3);
    expect(queryResult.rows[0].id).toBe(1);
    expect(queryResult.rows[0].name).toBe('Alice');
    expect(queryResult.rows[0].age).toBe(30);
    expect(queryResult.rows[1].id).toBe(2);
    expect(queryResult.rows[1].name).toBe('Bob');
    expect(queryResult.rows[1].age).toBe(25);
    expect(queryResult.rows[2].id).toBe(3);
    expect(queryResult.rows[2].name).toBe('Charlie');
    expect(queryResult.rows[2].age).toBe(35);
  });

  // Test 5: Create a function to handle complex data structures
  it('should create a function to handle complex data structures', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to return a complex data structure
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_complex_data()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '{
          "vertices": [
            {"label": "Company", "properties": {"id": 1, "name": "Acme Inc.", "founded": 1985}},
            {"label": "Company", "properties": {"id": 2, "name": "TechCorp", "founded": 2000}}
          ],
          "edges": [
            {
              "from": {"label": "Person", "id": 1},
              "to": {"label": "Company", "id": 1},
              "label": "WORKS_FOR",
              "properties": {"since": "2018-05-10", "position": "Developer"}
            },
            {
              "from": {"label": "Person", "id": 2},
              "to": {"label": "Company", "id": 2},
              "label": "WORKS_FOR",
              "properties": {"since": "2020-01-15", "position": "Manager"}
            }
          ]
        }'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create Company vertices
    const vertexResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_complex_data().vertices AS vertex
      CREATE (c:Company {
        id: vertex.properties.id,
        name: vertex.properties.name,
        founded: vertex.properties.founded
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertices were created
    expect(vertexResult.rows).toHaveLength(1);
    expect(vertexResult.rows[0].created).toBe(2);

    // Create WORKS_FOR edges
    const edgeResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_complex_data().edges AS edge
      MATCH (p:Person {id: edge.from.id}), (c:Company {id: edge.to.id})
      CREATE (p)-[:WORKS_FOR {
        since: edge.properties.since,
        position: edge.properties.position
      }]->(c)
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the edges were created
    expect(edgeResult.rows).toHaveLength(1);
    expect(edgeResult.rows[0].created).toBe(2);

    // Query the created edges
    const queryResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[w:WORKS_FOR]->(c:Company)
      RETURN p.id AS personId, c.id AS companyId, w.position AS position
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(queryResult.rows).toHaveLength(2);
    expect(queryResult.rows[0].personId).toBe(1);
    expect(queryResult.rows[0].companyId).toBe(1);
    expect(queryResult.rows[0].position).toBe('Developer');
    expect(queryResult.rows[1].personId).toBe(2);
    expect(queryResult.rows[1].companyId).toBe(2);
    expect(queryResult.rows[1].position).toBe('Manager');
  });
});
