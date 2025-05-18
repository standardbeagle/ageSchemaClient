/**
 * Integration tests for the DataStorageManager class
 *
 * These tests verify that the DataStorageManager correctly stores vertex and edge data
 * in the age_params temporary table and that the data can be retrieved using the
 * get_vertices and get_edges functions in Cypher queries.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';
import { QueryBuilder } from '../../../src/query/builder';
import { DataStorageManager, GraphData } from '../../../src/loader/data-storage-manager';
import { ValidationError } from '../../../src/core/errors';

// Graph name for the data storage tests
const DATA_STORAGE_TEST_GRAPH = 'data_storage_test_graph';

// Define a simple schema for testing
const testSchema = {
  vertices: {},
  edges: {},
  version: '1.0.0'
};

describe('DataStorageManager Integration Tests', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder;
  let dataStorageManager: DataStorageManager;

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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${DATA_STORAGE_TEST_GRAPH}', true)`);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    // Create the test graph
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${DATA_STORAGE_TEST_GRAPH}')`);

    // Create a query builder
    queryBuilder = new QueryBuilder(testSchema, queryExecutor, DATA_STORAGE_TEST_GRAPH);

    // Create a data storage manager
    dataStorageManager = new DataStorageManager(queryBuilder);

    // Create the get_vertices and get_edges functions if they don't exist
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

        -- Get the data for the specified vertex type and convert to ag_catalog.agtype
        SELECT value
        INTO result_array
        FROM age_params
        WHERE key = 'vertex_' || vertex_type_text;

        -- Return null if no data found
        IF result_array IS NULL THEN
          RETURN '[]'::jsonb::text::ag_catalog.agtype;
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

        -- Get the data for the specified edge type and convert to ag_catalog.agtype
        SELECT value
        INTO result_array
        FROM age_params
        WHERE key = 'edge_' || edge_type_text;

        -- Return null if no data found
        IF result_array IS NULL THEN
          RETURN '[]'::jsonb::text::ag_catalog.agtype;
        END IF;

        -- Return as agtype
        RETURN result_array::text::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${DATA_STORAGE_TEST_GRAPH}', true)`);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }
  });

  // Test: Store vertex data
  it('should store vertex data in the age_params table', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data
    const personData = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ];

    // Store the vertex data
    await dataStorageManager.storeVertexData('Person', personData);

    // Verify the data was stored in the age_params table
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'vertex_Person'
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].key).toBe('vertex_Person');

    // Parse the value if it's a string
    const value = typeof result.rows[0].value === 'string'
      ? JSON.parse(result.rows[0].value)
      : result.rows[0].value;

    expect(value).toHaveLength(2);
    expect(value[0].id).toBe(1);
    expect(value[0].name).toBe('Alice');
    expect(value[1].id).toBe(2);
    expect(value[1].name).toBe('Bob');

    // Verify the data can be retrieved using the get_vertices function
    const cypherResult = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Person') AS person
      RETURN person.id AS id, person.name AS name, person.age AS age
      ORDER BY person.id
    `, {}, DATA_STORAGE_TEST_GRAPH);

    expect(cypherResult.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const parsedRows = cypherResult.rows.map(row => ({
      id: typeof row.id === 'string' ? JSON.parse(row.id) : row.id,
      name: typeof row.name === 'string' ? JSON.parse(row.name) : row.name,
      age: typeof row.age === 'string' ? JSON.parse(row.age) : row.age
    }));

    expect(parsedRows[0].id).toBe(1);
    expect(parsedRows[0].name).toBe('Alice');
    expect(parsedRows[0].age).toBe(30);
    expect(parsedRows[1].id).toBe(2);
    expect(parsedRows[1].name).toBe('Bob');
    expect(parsedRows[1].age).toBe(25);
  });

  // Test: Store edge data
  it('should store edge data in the age_params table', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test edge data
    const friendsWithData = [
      { from: 1, to: 2, since: 2015 },
      { from: 2, to: 1, since: 2015 }
    ];

    // Store the edge data
    await dataStorageManager.storeEdgeData('FRIENDS_WITH', friendsWithData);

    // Verify the data was stored in the age_params table
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'edge_FRIENDS_WITH'
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].key).toBe('edge_FRIENDS_WITH');

    // Parse the value if it's a string
    const value = typeof result.rows[0].value === 'string'
      ? JSON.parse(result.rows[0].value)
      : result.rows[0].value;

    expect(value).toHaveLength(2);
    expect(value[0].from).toBe(1);
    expect(value[0].to).toBe(2);
    expect(value[0].since).toBe(2015);
    expect(value[1].from).toBe(2);
    expect(value[1].to).toBe(1);
    expect(value[1].since).toBe(2015);

    // Verify the data can be retrieved using the get_edges function
    const cypherResult = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_edges('FRIENDS_WITH') AS edge
      RETURN edge.from AS source, edge.to AS target, edge.since AS since
      ORDER BY edge.from
    `, {}, DATA_STORAGE_TEST_GRAPH);

    expect(cypherResult.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const parsedRows = cypherResult.rows.map(row => ({
      from: typeof row.source === 'string' ? JSON.parse(row.source) : row.source,
      to: typeof row.target === 'string' ? JSON.parse(row.target) : row.target,
      since: typeof row.since === 'string' ? JSON.parse(row.since) : row.since
    }));

    expect(parsedRows[0].from).toBe(1);
    expect(parsedRows[0].to).toBe(2);
    expect(parsedRows[0].since).toBe(2015);
    expect(parsedRows[1].from).toBe(2);
    expect(parsedRows[1].to).toBe(1);
    expect(parsedRows[1].since).toBe(2015);
  });

  // Test: Store all graph data
  it('should store all graph data in the age_params table', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test graph data
    const graphData: GraphData = {
      vertices: {
        Department: [
          { id: 1, name: 'Engineering', budget: 1000000 },
          { id: 2, name: 'Marketing', budget: 500000 }
        ],
        Employee: [
          { id: 1, name: 'Alice Smith', title: 'Engineer' },
          { id: 2, name: 'Bob Johnson', title: 'Manager' }
        ]
      },
      edges: {
        WORKS_IN: [
          { from: 1, to: 1, since: 2018 },
          { from: 2, to: 2, since: 2019 }
        ],
        REPORTS_TO: [
          { from: 1, to: 2, since: 2018 }
        ]
      }
    };

    // Store all graph data
    await dataStorageManager.storeAllData(graphData);

    // Verify vertex data was stored
    for (const [vertexType, vertices] of Object.entries(graphData.vertices)) {
      const result = await queryExecutor.executeSQL(`
        SELECT * FROM age_params WHERE key = 'vertex_${vertexType}'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].key).toBe(`vertex_${vertexType}`);

      // Parse the value if it's a string
      const value = typeof result.rows[0].value === 'string'
        ? JSON.parse(result.rows[0].value)
        : result.rows[0].value;

      expect(value).toHaveLength(vertices.length);
    }

    // Verify edge data was stored
    for (const [edgeType, edges] of Object.entries(graphData.edges)) {
      const result = await queryExecutor.executeSQL(`
        SELECT * FROM age_params WHERE key = 'edge_${edgeType}'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].key).toBe(`edge_${edgeType}`);

      // Parse the value if it's a string
      const value = typeof result.rows[0].value === 'string'
        ? JSON.parse(result.rows[0].value)
        : result.rows[0].value;

      expect(value).toHaveLength(edges.length);
    }
  });

  // Test: Validation errors
  it('should throw validation errors for invalid data', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Test invalid vertex type
    await expect(dataStorageManager.storeVertexData('', [])).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeVertexData(null as any, [])).rejects.toThrow(ValidationError);

    // Test invalid vertices
    await expect(dataStorageManager.storeVertexData('Person', null as any)).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeVertexData('Person', {} as any)).rejects.toThrow(ValidationError);

    // Test invalid edge type
    await expect(dataStorageManager.storeEdgeData('', [])).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeEdgeData(null as any, [])).rejects.toThrow(ValidationError);

    // Test invalid edges
    await expect(dataStorageManager.storeEdgeData('FRIENDS_WITH', null as any)).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeEdgeData('FRIENDS_WITH', {} as any)).rejects.toThrow(ValidationError);

    // Test invalid edge data structure
    await expect(dataStorageManager.storeEdgeData('FRIENDS_WITH', [{}])).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeEdgeData('FRIENDS_WITH', [{ from: 1 }])).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeEdgeData('FRIENDS_WITH', [{ to: 1 }])).rejects.toThrow(ValidationError);

    // Test invalid graph data
    await expect(dataStorageManager.storeAllData(null as any)).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeAllData({} as any)).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeAllData({ vertices: {} } as any)).rejects.toThrow(ValidationError);
    await expect(dataStorageManager.storeAllData({ edges: {} } as any)).rejects.toThrow(ValidationError);
  });
});
