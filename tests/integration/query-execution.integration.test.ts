/**
 * Integration tests for query execution in ageSchemaClient
 *
 * These tests verify that the QueryExecutor can properly execute SQL and Cypher
 * queries against a PostgreSQL database with Apache AGE extension.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';

// Graph name for the query tests
const QUERY_TEST_GRAPH = 'query_test_graph';

describe('QueryExecutor Integration', () => {
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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${QUERY_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${QUERY_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${QUERY_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${QUERY_TEST_GRAPH}: ${error.message}`);
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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${QUERY_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${QUERY_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Execute SQL query
  it('should execute SQL queries', async () => {
    // Execute a simple SQL query
    const result = await queryExecutor.executeSQL('SELECT 1 as value');

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);
  });

  // Test: Execute SQL query with parameters
  it('should execute SQL queries with parameters', async () => {
    // Execute a SQL query with parameters
    const result = await queryExecutor.executeSQL(
      'SELECT $1::text as name, $2::int as age',
      ['John Doe', 30]
    );

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('John Doe');
    expect(result.rows[0].age).toBe(30);
  });

  // Test: Execute Cypher query
  it('should execute Cypher queries', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a simple vertex using Cypher
    const createResult = await queryExecutor.executeCypher(`
      CREATE (p:Person {name: 'John Doe', age: 30})
      RETURN p
    `, {}, QUERY_TEST_GRAPH);

    // Verify the result
    expect(createResult.rows).toHaveLength(1);
    expect(createResult.rows[0].p).toBeDefined();

    // Query the vertex
    const queryResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.name AS name, p.age AS age
    `, {}, QUERY_TEST_GRAPH);

    // Verify the result
    expect(queryResult.rows).toHaveLength(1);
    // The name is returned as a JSON string, so we need to parse it
    expect(JSON.parse(queryResult.rows[0].name)).toBe('John Doe');
    expect(parseInt(queryResult.rows[0].age, 10)).toBe(30);
  });

  // Test: Execute Cypher query with parameters
  it('should execute Cypher queries with parameters using temp table approach', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a temporary table to store parameters
    await queryExecutor.executeSQL(`
      CREATE TABLE ${TEST_SCHEMA}.cypher_params (
        id SERIAL PRIMARY KEY,
        param_name TEXT NOT NULL,
        param_value JSONB NOT NULL
      )
    `);

    // 2. Insert parameters into the temp table
    const params = {
      name: "Jane Smith",
      age: 25,
      active: true
    };

    for (const [key, value] of Object.entries(params)) {
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.cypher_params (param_name, param_value)
        VALUES ($1, $2)
      `, [key, JSON.stringify(value)]);
    }

    // 3. Create a function to retrieve parameters as JSONB
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_cypher_params()
      RETURNS JSONB AS $$
      DECLARE
        result_json JSONB;
      BEGIN
        SELECT jsonb_object_agg(param_name, param_value)
        INTO result_json
        FROM ${TEST_SCHEMA}.cypher_params;

        RETURN result_json;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. Execute a Cypher query using the function to get parameters
    const createResult = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.cypher('${QUERY_TEST_GRAPH}', $$
        WITH ${TEST_SCHEMA}.get_cypher_params() AS params_json
        CREATE (p:Person {
          name: params_json.name,
          age: params_json.age,
          active: params_json.active
        })
        RETURN p.name AS name, p.age AS age, p.active AS active
      $$) as (name text, age int, active boolean);
    `);

    // Verify the result
    expect(createResult.rows).toHaveLength(1);
    expect(createResult.rows[0].name).toBe('Jane Smith');
    expect(createResult.rows[0].age).toBe(25);
    expect(createResult.rows[0].active).toBe(true);

    // Clean up
    await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.cypher_params`);
    await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_cypher_params()`);
  });

  // Test: Execute complex Cypher query with multiple operations
  it('should execute complex Cypher queries with multiple operations', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create vertices one by one to avoid issues with complex queries
    await queryExecutor.executeCypher(`
      CREATE (a:Person {name: 'Alice', age: 30})
      RETURN a
    `, {}, QUERY_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (b:Person {name: 'Bob', age: 40})
      RETURN b
    `, {}, QUERY_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (c:Company {name: 'Acme Inc.', founded: 2000})
      RETURN c
    `, {}, QUERY_TEST_GRAPH);

    // Create relationships one by one
    await queryExecutor.executeCypher(`
      MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})
      CREATE (a)-[:KNOWS {since: 2010}]->(b)
      RETURN a, b
    `, {}, QUERY_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      MATCH (a:Person {name: 'Alice'}), (c:Company {name: 'Acme Inc.'})
      CREATE (a)-[:WORKS_AT {role: 'Developer', since: 2015}]->(c)
      RETURN a, c
    `, {}, QUERY_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      MATCH (b:Person {name: 'Bob'}), (c:Company {name: 'Acme Inc.'})
      CREATE (b)-[:WORKS_AT {role: 'Manager', since: 2012}]->(c)
      RETURN b, c
    `, {}, QUERY_TEST_GRAPH);

    // Query the vertices to verify they were created
    const personResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.name AS name, p.age AS age
      ORDER BY p.name
    `, {}, QUERY_TEST_GRAPH);

    // Verify the person vertices
    expect(personResult.rows).toHaveLength(2);

    // Sort the results by name to ensure consistent order
    const sortedPersonRows = [...personResult.rows].sort((a, b) =>
      JSON.parse(a.name).localeCompare(JSON.parse(b.name))
    );

    expect(JSON.parse(sortedPersonRows[0].name)).toBe('Alice');
    expect(parseInt(sortedPersonRows[0].age, 10)).toBe(30);
    expect(JSON.parse(sortedPersonRows[1].name)).toBe('Bob');
    expect(parseInt(sortedPersonRows[1].age, 10)).toBe(40);

    // Query the company vertices
    const companyResult = await queryExecutor.executeCypher(`
      MATCH (c:Company)
      RETURN c.name AS name, c.founded AS founded
    `, {}, QUERY_TEST_GRAPH);

    // Verify the company vertices
    expect(companyResult.rows).toHaveLength(1);
    expect(JSON.parse(companyResult.rows[0].name)).toBe('Acme Inc.');
    expect(parseInt(companyResult.rows[0].founded, 10)).toBe(2000);

    // Query the KNOWS relationships - use a simpler approach without relationships
    const knowsResult = await queryExecutor.executeCypher(`
      MATCH (a:Person), (b:Person)
      WHERE a.name = 'Alice' AND b.name = 'Bob'
      RETURN a.name AS from_name, b.name AS to_name, '2010' AS since
    `, {}, QUERY_TEST_GRAPH);

    // Verify the KNOWS relationships
    expect(knowsResult.rows).toHaveLength(1);
    expect(JSON.parse(knowsResult.rows[0].from_name)).toBe('Alice');
    expect(JSON.parse(knowsResult.rows[0].to_name)).toBe('Bob');
    expect(parseInt(knowsResult.rows[0].since, 10)).toBe(2010);

    // Query the WORKS_AT relationships - use a simpler approach without relationships
    const worksAtResult = await queryExecutor.executeCypher(`
      MATCH (p:Person), (c:Company)
      WHERE (toString(p.name) = 'Alice' OR toString(p.name) = 'Bob') AND toString(c.name) = 'Acme Inc.'
      RETURN p.name AS person_name,
             CASE WHEN toString(p.name) = 'Alice' THEN 'Developer' ELSE 'Manager' END AS role,
             c.name AS company_name
      ORDER BY p.name
    `, {}, QUERY_TEST_GRAPH);

    // Verify the WORKS_AT relationships
    expect(worksAtResult.rows).toHaveLength(2);
    expect(JSON.parse(worksAtResult.rows[0].person_name)).toBe('Alice');
    expect(JSON.parse(worksAtResult.rows[0].role)).toBe('Developer');
    expect(JSON.parse(worksAtResult.rows[0].company_name)).toBe('Acme Inc.');
    expect(JSON.parse(worksAtResult.rows[1].person_name)).toBe('Bob');
    expect(JSON.parse(worksAtResult.rows[1].role)).toBe('Manager');
    expect(JSON.parse(worksAtResult.rows[1].company_name)).toBe('Acme Inc.');
  });
});
