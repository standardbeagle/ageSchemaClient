/**
 * Integration tests for DataStorage class in ageSchemaClient
 *
 * These tests verify that the DataStorage class can properly store vertex and edge data
 * in the age_params temporary table and retrieve it using the get_vertices and get_edges functions.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';
import { QueryBuilder } from '../../src/query/builder';
import { DataStorage } from '../../src/data/storage';

// Graph name for the data storage tests
const DATA_STORAGE_TEST_GRAPH = 'data_storage_test_graph';

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

describe('DataStorage Integration Tests', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof testSchema>;
  let dataStorage: DataStorage;

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
        SELECT * FROM ag_catalog.drop_graph('${DATA_STORAGE_TEST_GRAPH}', true);
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.create_graph('${DATA_STORAGE_TEST_GRAPH}');
    `);

    // Create a query builder and data storage instance
    queryBuilder = new QueryBuilder(testSchema, queryExecutor, DATA_STORAGE_TEST_GRAPH);
    dataStorage = new DataStorage(queryBuilder, { debug: true });
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${DATA_STORAGE_TEST_GRAPH}', true);
      `);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }
  });

  // Test: Storing vertex data
  it('should store vertex data in the age_params table', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create test data
    const personVertices = [
      { id: 'p1', name: 'Alice', age: 30 },
      { id: 'p2', name: 'Bob', age: 25 },
      { id: 'p3', name: 'Charlie', age: 35 }
    ];

    // Store vertex data
    const result = await dataStorage.storeVertexData('Person', personVertices);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.keys).toContain('vertex_Person');

    // Verify the data was stored in the age_params table
    const paramsResult = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'vertex_Person'
    `);

    expect(paramsResult.rows).toHaveLength(1);
    expect(paramsResult.rows[0].key).toBe('vertex_Person');

    // Get the stored data
    const storedData = paramsResult.rows[0].value;
    expect(storedData).toBeDefined();
    expect(Array.isArray(storedData) || typeof storedData === 'object').toBe(true);

    // Convert to array if needed
    const dataArray = Array.isArray(storedData) ? storedData : Object.values(storedData);
    expect(dataArray.length).toBe(3);

    // Find items by ID
    const alice = dataArray.find(item => item.id === 'p1');
    const bob = dataArray.find(item => item.id === 'p2');
    const charlie = dataArray.find(item => item.id === 'p3');

    expect(alice).toBeDefined();
    expect(bob).toBeDefined();
    expect(charlie).toBeDefined();
    expect(alice.name).toBe('Alice');
    expect(bob.name).toBe('Bob');
    expect(charlie.age).toBe(35);

    // Test retrieving the data using the get_vertices function
    const vertexResult = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Person') AS vertex
      RETURN vertex.id AS id, vertex.name AS name, vertex.age AS age
      ORDER BY vertex.id
    `, {}, DATA_STORAGE_TEST_GRAPH);

    // Verify the result
    expect(vertexResult.rows).toHaveLength(3);

    // Parse the JSON strings if needed
    const ids = vertexResult.rows.map(row =>
      typeof row.id === 'string' ? JSON.parse(row.id) : row.id
    );

    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).toContain('p3');
  });

  // Test: Storing edge data
  it('should store edge data in the age_params table', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create test data
    const worksInEdges = [
      { from: 'p1', to: 'd1', since: 2020 },
      { from: 'p2', to: 'd1', since: 2021 },
      { from: 'p3', to: 'd2', since: 2019 }
    ];

    // Store edge data
    const result = await dataStorage.storeEdgeData('WORKS_IN', worksInEdges);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.keys).toContain('edge_WORKS_IN');

    // Verify the data was stored in the age_params table
    const paramsResult = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'edge_WORKS_IN'
    `);

    expect(paramsResult.rows).toHaveLength(1);
    expect(paramsResult.rows[0].key).toBe('edge_WORKS_IN');

    // Get the stored data
    const storedData = paramsResult.rows[0].value;
    expect(storedData).toBeDefined();
    expect(Array.isArray(storedData) || typeof storedData === 'object').toBe(true);

    // Convert to array if needed
    const dataArray = Array.isArray(storedData) ? storedData : Object.values(storedData);
    expect(dataArray.length).toBe(3);

    // Find items by from/to
    const edge1 = dataArray.find(item => item.from === 'p1');
    const edge2 = dataArray.find(item => item.from === 'p2');
    const edge3 = dataArray.find(item => item.from === 'p3');

    expect(edge1).toBeDefined();
    expect(edge2).toBeDefined();
    expect(edge3).toBeDefined();
    expect(edge1.to).toBe('d1');
    expect(edge2.to).toBe('d1');
    expect(edge3.since).toBe(2019);

    // Test retrieving the data using the get_edges function
    const edgeResult = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_edges('WORKS_IN') AS edge
      RETURN edge.from AS source_id, edge.to AS target_id, edge.since AS since
      ORDER BY edge.from
    `, {}, DATA_STORAGE_TEST_GRAPH);

    // Verify the result
    expect(edgeResult.rows).toHaveLength(3);

    // Parse the JSON strings if needed
    const sourceIds = edgeResult.rows.map(row =>
      typeof row.source_id === 'string' ? JSON.parse(row.source_id) : row.source_id
    );

    expect(sourceIds).toContain('p1');
    expect(sourceIds).toContain('p2');
    expect(sourceIds).toContain('p3');
  });

  // Test: Storing large datasets with chunking
  it('should store large datasets with chunking', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a large dataset
    const largeDataset = Array.from({ length: 2500 }, (_, i) => ({
      id: `item_${i}`,
      value: `value_${i}`,
      index: i
    }));

    // Create a data storage instance with a small batch size
    const smallBatchStorage = new DataStorage(queryBuilder, { batchSize: 500, debug: true });

    // Store the large dataset
    const result = await smallBatchStorage.storeVertexData('LargeData', largeDataset);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.count).toBe(2500);
    expect(result.chunks).toBe(5);
    expect(result.keys).toHaveLength(6); // 5 chunks + 1 metadata

    // Verify the metadata was stored
    const metadataResult = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'vertex_LargeData_metadata'
    `);

    expect(metadataResult.rows).toHaveLength(1);

    // Get the metadata
    const metadata = metadataResult.rows[0].value;
    expect(metadata).toBeDefined();
    expect(metadata.totalCount).toBe(2500);
    expect(metadata.chunks).toBe(5);
    expect(metadata.chunkSize).toBe(500);
    expect(Array.isArray(metadata.keys)).toBe(true);
    expect(metadata.keys.length).toBe(5);

    // Verify the first chunk
    const chunk0Result = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'vertex_LargeData_chunk_0'
    `);

    expect(chunk0Result.rows).toHaveLength(1);

    // Get the chunk data
    const chunk0 = chunk0Result.rows[0].value;
    expect(chunk0).toBeDefined();
    expect(Array.isArray(chunk0) || typeof chunk0 === 'object').toBe(true);

    // Convert to array if needed
    const chunkArray = Array.isArray(chunk0) ? chunk0 : Object.values(chunk0);
    expect(chunkArray.length).toBe(500);

    // Check first and last items
    const firstItem = chunkArray.find(item => item.index === 0);
    const lastItem = chunkArray.find(item => item.index === 499);

    expect(firstItem).toBeDefined();
    expect(lastItem).toBeDefined();
    expect(firstItem.id).toBe('item_0');
    expect(lastItem.id).toBe('item_499');
  });

  // Test: Handling empty arrays
  it('should handle empty arrays', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Store an empty array
    const result = await dataStorage.storeVertexData('EmptyData', []);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.keys).toContain('vertex_EmptyData');

    // Verify the data was stored in the age_params table
    const paramsResult = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'vertex_EmptyData'
    `);

    expect(paramsResult.rows).toHaveLength(1);
    expect(paramsResult.rows[0].key).toBe('vertex_EmptyData');

    // Get the stored data
    const storedData = paramsResult.rows[0].value;
    expect(storedData).toBeDefined();
    expect(Array.isArray(storedData)).toBe(true);
    expect(storedData.length).toBe(0);
  });
});
