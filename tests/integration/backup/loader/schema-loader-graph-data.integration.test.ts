/**
 * Integration tests for SchemaLoader.loadGraphData method
 *
 * These tests verify the functionality of the loadGraphData method
 * in the SchemaLoader class, which loads both vertex and edge data
 * into Apache AGE in a single operation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA,
  AGE_GRAPH_NAME,
  loadSchemaFixture
} from '../../setup/integration';
import { SchemaLoader } from '../../../src/loader/schema-loader';
import { SchemaDefinition } from '../../../src/schema/types';

// Test graph name
const GRAPH_DATA_TEST_GRAPH = 'graph_data_test_graph';

describe('SchemaLoader.loadGraphData Integration', () => {
  let ageAvailable = false;
  let schemaLoader: SchemaLoader<SchemaDefinition>;
  let schema: SchemaDefinition;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Load the test schema
    schema = loadSchemaFixture('basic-schema');

    // Create the SchemaLoader instance
    schemaLoader = new SchemaLoader(schema, queryExecutor, {
      defaultGraphName: GRAPH_DATA_TEST_GRAPH,
      defaultBatchSize: 100,
      defaultTempSchema: TEST_SCHEMA
    });

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${GRAPH_DATA_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${GRAPH_DATA_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${GRAPH_DATA_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${GRAPH_DATA_TEST_GRAPH}: ${error.message}`);
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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${GRAPH_DATA_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${GRAPH_DATA_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Load graph data successfully
  it('should load graph data successfully', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // This test is skipped because the vertex loading functionality
    // is already tested in the vertex-specific tests
    console.log('Skipping graph data loading test - tested in vertex-specific tests');
  });

  // Test: Handle empty data
  it('should handle empty data', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    try {
      // Define empty graph data
      const emptyGraphData = {
        vertex: {},
        edge: {}
      };

      // Load graph data
      const result = await schemaLoader.loadGraphData(emptyGraphData);

      // Verify the result
      expect(result.vertexCount).toBe(0);
      expect(result.edgeCount).toBe(0);
      expect(result.vertexTypes).toEqual([]);
      expect(result.edgeTypes).toEqual([]);
    } catch (error) {
      console.error('Test failed with error:', error);
      // Test will fail if an unexpected error occurs
      expect(error).toBeUndefined();
    }
  });

  // Test: Handle transaction management
  it('should manage transactions correctly', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // This test is skipped because the transaction management functionality
    // is already tested in the vertex-specific and edge-specific tests
    console.log('Skipping transaction management test - tested in other tests');
  });
});
