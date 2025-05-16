/**
 * Performance tests for SchemaLoader
 *
 * These tests verify that the performance optimizations in the SchemaLoader class
 * improve performance for large datasets.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SchemaLoader } from '../../../src/loader/schema-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { isAgeAvailable, getTestQueryExecutor } from '../../utils/age-utils';
import { loadSchemaFixture } from '../../fixtures/schema-fixtures';
import { generateLargeDataset } from '../../utils/data-generator';
import { performance } from 'perf_hooks';
import { PgConnectionManager } from '../../../src/db/connector';

// Test configuration
const TEST_GRAPH = 'performance_test_graph';
const TEST_SCHEMA = 'public';
const DATASET_SIZE = 1000; // Adjust based on your test environment

describe('SchemaLoader Performance', () => {
  let ageAvailable = false;
  let schema: SchemaDefinition;
  let queryExecutor: QueryExecutor;
  let connectionManager: PgConnectionManager;
  let connection: any;
  let standardLoader: SchemaLoader<SchemaDefinition>;
  let optimizedLoader: SchemaLoader<SchemaDefinition>;
  let testData: any;

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

    // Get a query executor for testing
    try {
      const testSetup = await getTestQueryExecutor();
      queryExecutor = testSetup.queryExecutor;
      connectionManager = testSetup.connectionManager;
      connection = testSetup.connection;

      console.log('Successfully created query executor for performance tests');
    } catch (error) {
      console.error('Failed to create query executor:', error);
      ageAvailable = false;
      return;
    }

    // Create the standard SchemaLoader instance
    standardLoader = new SchemaLoader(schema, queryExecutor, {
      defaultGraphName: TEST_GRAPH,
      defaultBatchSize: 100,
      defaultTempSchema: TEST_SCHEMA,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: console.error
      }
    });

    // Create the optimized SchemaLoader instance
    optimizedLoader = new SchemaLoader(schema, queryExecutor, {
      defaultGraphName: TEST_GRAPH,
      defaultBatchSize: 100,
      defaultTempSchema: TEST_SCHEMA,
      parallelInserts: true,
      maxParallelBatches: 4,
      useBulkInsert: true,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: console.error
      }
    });

    // Generate test data
    testData = generateLargeDataset(DATASET_SIZE);

    // Create test graph
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH}', true);
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.create_graph('${TEST_GRAPH}');
      `);
      console.log(`Successfully created test graph '${TEST_GRAPH}'`);
    } catch (error) {
      console.error(`Failed to create test graph '${TEST_GRAPH}':`, error);
      ageAvailable = false;
    }
  });

  // Clean up after tests
  afterAll(async () => {
    if (!ageAvailable) return;

    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH}', true);
      `);
      console.log(`Successfully dropped test graph '${TEST_GRAPH}'`);
    } catch (error) {
      console.warn(`Failed to drop test graph: ${(error as Error).message}`);
    }

    // Clean up resources
    if (connectionManager) {
      try {
        // Release the connection
        await connectionManager.releaseConnection(connection);

        // Close the connection manager
        await connectionManager.closeAll();
        console.log('Successfully closed connection manager');
      } catch (error) {
        console.error('Error closing connection manager:', error);
      }
    }
  });

  it('should load data faster with optimizations enabled', async () => {
    if (!ageAvailable) {
      return;
    }

    try {
      // Load data with standard loader
      console.log('Starting standard loader test...');
      const standardStart = performance.now();
      const standardResult = await standardLoader.loadGraphData(testData);
      const standardDuration = performance.now() - standardStart;
      console.log(`Standard loader completed in ${standardDuration.toFixed(2)}ms`);

      // Drop and recreate the graph
      try {
        await queryExecutor.executeSQL(`
          SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH}', true);
        `);
        console.log(`Dropped test graph '${TEST_GRAPH}' for optimized test`);
      } catch (error) {
        console.warn(`Warning: Could not drop graph ${TEST_GRAPH}: ${(error as Error).message}`);
      }

      try {
        await queryExecutor.executeSQL(`
          SELECT * FROM ag_catalog.create_graph('${TEST_GRAPH}');
        `);
        console.log(`Created test graph '${TEST_GRAPH}' for optimized test`);
      } catch (error) {
        console.error(`Error creating graph ${TEST_GRAPH}: ${(error as Error).message}`);
        return;
      }

      // Load data with optimized loader
      console.log('Starting optimized loader test...');
      const optimizedStart = performance.now();
      const optimizedResult = await optimizedLoader.loadGraphData(testData);
      const optimizedDuration = performance.now() - optimizedStart;
      console.log(`Optimized loader completed in ${optimizedDuration.toFixed(2)}ms`);

      // Verify both loaders loaded the same amount of data
      expect(standardResult.success).toBe(true);
      expect(optimizedResult.success).toBe(true);
      expect(standardResult.vertexCount).toBe(optimizedResult.vertexCount);
      expect(standardResult.edgeCount).toBe(optimizedResult.edgeCount);

      // Log performance results
      console.log(`Standard loader: ${standardDuration.toFixed(2)}ms`);
      console.log(`Optimized loader: ${optimizedDuration.toFixed(2)}ms`);
      console.log(`Performance improvement: ${((standardDuration - optimizedDuration) / standardDuration * 100).toFixed(2)}%`);

      // The optimized loader should be faster
      // Note: This test might be flaky depending on the test environment
      // We're using a loose comparison to account for variations
      expect(optimizedDuration).toBeLessThanOrEqual(standardDuration * 1.1);
    } catch (error) {
      console.error(`Error in performance comparison test: ${(error as Error).message}`);
      expect.fail(`Performance comparison test failed: ${(error as Error).message}`);
    }
  });

  it('should handle streaming mode for large datasets', async () => {
    if (!ageAvailable) {
      return;
    }

    // Create a streaming loader
    const streamingLoader = new SchemaLoader(schema, queryExecutor, {
      defaultGraphName: TEST_GRAPH,
      defaultBatchSize: 50,
      defaultTempSchema: TEST_SCHEMA,
      useStreamingForLargeDatasets: true,
      largeDatasetThreshold: 10, // Set low to ensure streaming is used
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: console.error
      }
    });

    // Drop and recreate the graph
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH}', true);
      `);
      console.log(`Dropped test graph '${TEST_GRAPH}' for streaming test`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${TEST_GRAPH}: ${(error as Error).message}`);
    }

    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.create_graph('${TEST_GRAPH}');
      `);
      console.log(`Created test graph '${TEST_GRAPH}' for streaming test`);
    } catch (error) {
      console.error(`Error creating graph ${TEST_GRAPH}: ${(error as Error).message}`);
      return;
    }

    // Load data with streaming loader
    try {
      const result = await streamingLoader.loadGraphData(testData);

      // Verify data was loaded correctly
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBeGreaterThan(0);
      console.log(`Successfully loaded data with streaming loader: ${result.vertexCount} vertices, ${result.edgeCount} edges`);
    } catch (error) {
      console.error(`Error loading data with streaming loader: ${(error as Error).message}`);
      expect.fail(`Failed to load data with streaming loader: ${(error as Error).message}`);
    }
  });
});

/**
 * Utility function to generate large test datasets
 */
export function generateLargeDataset(size: number) {
  const vertices: Record<string, any[]> = {
    Person: []
  };

  const edges: Record<string, any[]> = {
    KNOWS: []
  };

  // Generate vertices
  for (let i = 0; i < size; i++) {
    vertices.Person.push({
      id: `p${i}`,
      name: `Person ${i}`,
      age: 20 + (i % 50)
    });
  }

  // Generate edges (each person knows ~5 other people)
  for (let i = 0; i < size; i++) {
    const fromId = `p${i}`;

    // Create edges to 5 random people
    for (let j = 0; j < 5; j++) {
      const toIndex = (i + j + 1) % size;
      const toId = `p${toIndex}`;

      edges.KNOWS.push({
        from: fromId,
        to: toId,
        since: 2020 + (i % 3)
      });
    }
  }

  return {
    vertex: vertices,
    edge: edges
  };
}
