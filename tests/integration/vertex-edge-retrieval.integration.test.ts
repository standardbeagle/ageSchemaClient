/**
 * Integration tests for vertex and edge retrieval functions in ageSchemaClient
 * 
 * These tests verify that the get_vertices and get_edges functions correctly
 * retrieve data from the age_params temporary table and return it as ag_catalog.agtype.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';
import { QueryBuilder } from '../../src/query/builder';

// Graph name for the vertex and edge retrieval tests
const RETRIEVAL_TEST_GRAPH = 'retrieval_test_graph';

// Define a simple schema for testing
const testSchema = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['id', 'name']
    },
    Department: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    WORKS_IN: {
      properties: {
        since: { type: 'number' }
      },
      required: []
    }
  },
  version: '1.0.0'
};

describe('Vertex and Edge Retrieval Functions Integration Tests', () => {
  let ageAvailable = false;

  // Setup before all tests
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();
    if (!ageAvailable) {
      console.warn('AGE is not available, skipping tests');
      return;
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${RETRIEVAL_TEST_GRAPH}', true);
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.create_graph('${RETRIEVAL_TEST_GRAPH}');
    `);

    // Create the vertex and edge retrieval functions
    await queryExecutor.executeSQL(`
      -- Function to retrieve vertex data by type from the age_params table
      CREATE OR REPLACE FUNCTION age_schema_client.get_vertices(vertex_type ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        vertex_type_text TEXT;
        result_array JSONB;
      BEGIN
        -- Extract the text value from the agtype parameter
        SELECT vertex_type::text INTO vertex_type_text;
        
        -- Remove quotes if present
        vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

        -- Get the data for the specified vertex type
        SELECT value
        INTO result_array
        FROM age_params
        WHERE key = 'vertex_' || vertex_type_text;

        -- Return null if no data found
        IF result_array IS NULL THEN
          RETURN NULL;
        END IF;

        -- Return as agtype
        RETURN result_array::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;

      -- Function to retrieve edge data by type from the age_params table
      CREATE OR REPLACE FUNCTION age_schema_client.get_edges(edge_type ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        edge_type_text TEXT;
        result_array JSONB;
      BEGIN
        -- Extract the text value from the agtype parameter
        SELECT edge_type::text INTO edge_type_text;
        
        -- Remove quotes if present
        edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

        -- Get the data for the specified edge type
        SELECT value
        INTO result_array
        FROM age_params
        WHERE key = 'edge_' || edge_type_text;

        -- Return null if no data found
        IF result_array IS NULL THEN
          RETURN NULL;
        END IF;

        -- Return as agtype
        RETURN result_array::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${RETRIEVAL_TEST_GRAPH}', true);
      `);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }
  });

  // Test: Retrieving vertex data
  it('should retrieve vertex data by type using get_vertices function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, RETRIEVAL_TEST_GRAPH);

    // Store vertex data in the age_params table
    const personVertices = [
      { id: 'p1', name: 'Alice', age: 30 },
      { id: 'p2', name: 'Bob', age: 25 },
      { id: 'p3', name: 'Charlie', age: 35 }
    ];

    await queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2;
    `, ['vertex_Person', JSON.stringify(personVertices)]);

    // Execute a Cypher query that uses the get_vertices function
    const result = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Person') AS vertex
      CREATE (p:Person {
        id: vertex.id,
        name: vertex.name,
        age: vertex.age
      })
      RETURN p.id AS id, p.name AS name, p.age AS age
    `, {}, RETRIEVAL_TEST_GRAPH);

    // Verify the result
    expect(result.rows).toHaveLength(3);
    
    // Parse the JSON strings if needed
    const ids = result.rows.map(row => 
      typeof row.id === 'string' ? JSON.parse(row.id) : row.id
    );
    
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).toContain('p3');
  });

  // Test: Retrieving edge data
  it('should retrieve edge data by type using get_edges function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, RETRIEVAL_TEST_GRAPH);

    // Store department vertex data in the age_params table
    const departmentVertices = [
      { id: 'd1', name: 'Engineering' },
      { id: 'd2', name: 'Marketing' }
    ];

    await queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2;
    `, ['vertex_Department', JSON.stringify(departmentVertices)]);

    // Create department vertices
    await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Department') AS vertex
      CREATE (d:Department {
        id: vertex.id,
        name: vertex.name
      })
      RETURN d
    `, {}, RETRIEVAL_TEST_GRAPH);

    // Store edge data in the age_params table
    const worksInEdges = [
      { from: 'p1', to: 'd1', since: 2020 },
      { from: 'p2', to: 'd1', since: 2021 },
      { from: 'p3', to: 'd2', since: 2019 }
    ];

    await queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2;
    `, ['edge_WORKS_IN', JSON.stringify(worksInEdges)]);

    // Create edges using the get_edges function
    const result = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_edges('WORKS_IN') AS edge
      MATCH (p:Person {id: edge.from})
      MATCH (d:Department {id: edge.to})
      CREATE (p)-[r:WORKS_IN {since: edge.since}]->(d)
      RETURN p.id AS person_id, d.id AS department_id, r.since AS since
    `, {}, RETRIEVAL_TEST_GRAPH);

    // Verify the result
    expect(result.rows).toHaveLength(3);
    
    // Parse the JSON strings if needed
    const personIds = result.rows.map(row => 
      typeof row.person_id === 'string' ? JSON.parse(row.person_id) : row.person_id
    );
    
    expect(personIds).toContain('p1');
    expect(personIds).toContain('p2');
    expect(personIds).toContain('p3');
  });
});
