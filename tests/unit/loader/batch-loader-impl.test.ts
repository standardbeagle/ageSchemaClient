/**
 * Unit tests for the BatchLoaderImpl class
 *
 * These tests verify that the BatchLoaderImpl correctly loads graph data
 * into Apache AGE using the temporary table approach.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { TransactionManager } from '../../../src/db/transaction';

// Mock QueryExecutor
const mockQueryExecutor = {
  getConnection: vi.fn(),
  releaseConnection: vi.fn(),
  executeSQL: vi.fn()
} as unknown as QueryExecutor;

// Mock Connection
const mockConnection = {
  query: vi.fn(),
  release: vi.fn()
};

// We don't need to mock TransactionManager anymore

// Sample schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' }
      }
    }
  }
};

// Sample graph data for testing
const testGraphData: GraphData = {
  vertices: {
    Person: [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 }
    ],
    Company: [
      { id: '3', name: 'Acme Inc.', founded: 1990 }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: '1', to: '3', since: 2015, position: 'Manager' },
      { from: '2', to: '3', since: 2018, position: 'Developer' }
    ]
  }
};

describe('BatchLoaderImpl', () => {
  let batchLoader: BatchLoader<typeof testSchema>;

  beforeEach(() => {
    // Reset mock function calls
    vi.resetAllMocks();

    // Mock getConnection to return mockConnection
    mockQueryExecutor.getConnection.mockResolvedValue(mockConnection);

    // Mock executeSQL to return success results
    mockQueryExecutor.executeSQL.mockImplementation((query) => {
      if (query.includes('vertex')) {
        return Promise.resolve({
          rows: [{ created_vertices: '2' }]
        });
      } else if (query.includes('edge')) {
        return Promise.resolve({
          rows: [{ created_edges: '2' }]
        });
      } else {
        return Promise.resolve({
          rows: []
        });
      }
    });

    // Create a new BatchLoader for each test
    batchLoader = createBatchLoader(testSchema, mockQueryExecutor, {
      defaultGraphName: 'test_graph',
      validateBeforeLoad: true,
      defaultBatchSize: 1000
    });
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('loadGraphData', () => {
    it('should load graph data successfully', async () => {
      const result = await batchLoader.loadGraphData(testGraphData);

      // Verify that the connection was obtained and released
      expect(mockQueryExecutor.getConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledWith(mockConnection);

      // Verify that transaction was started and committed
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledWith('BEGIN');
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledWith('COMMIT');

      // Verify that executeSQL was called for transaction, AGE setup, and data operations
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(9); // BEGIN, AGE setup, 3 data inserts, 3 Cypher queries, COMMIT

      // Verify that the result contains the correct counts
      expect(result.vertexCount).toBe(4); // 2 for Person + 2 for Company (mocked)
      expect(result.edgeCount).toBe(0); // The mock returns 0 for edge count
    });

    it('should report progress if onProgress callback is provided', async () => {
      const onProgress = vi.fn();

      await batchLoader.loadGraphData(testGraphData, { onProgress });

      // Verify that onProgress was called for each vertex and edge type
      expect(onProgress).toHaveBeenCalledTimes(3); // Person, Company, WORKS_AT

      // Verify that onProgress was called with the correct progress information
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'vertices',
        type: 'Person',
        processed: 2,
        total: 2,
        percentage: 100
      }));

      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'vertices',
        type: 'Company',
        processed: 1,
        total: 1,
        percentage: 100
      }));

      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
        phase: 'edges',
        type: 'WORKS_AT',
        processed: 2,
        total: 2,
        percentage: 100
      }));
    });

    it('should use custom graph name if provided', async () => {
      await batchLoader.loadGraphData(testGraphData, { graphName: 'custom_graph' });

      // Verify that executeSQL was called with the custom graph name
      // The 4th, 6th, and 8th calls should contain the custom graph name
      const calls = mockQueryExecutor.executeSQL.mock.calls;
      expect(calls[3][0]).toContain('custom_graph');
      expect(calls[5][0]).toContain('custom_graph');
      expect(calls[7][0]).toContain('custom_graph');
    });

    it('should use custom batch size if provided', async () => {
      // Create test data with more items
      const largeGraphData: GraphData = {
        vertices: {
          Person: Array(2000).fill(0).map((_, i) => ({
            id: `${i}`,
            name: `Person ${i}`,
            age: 30
          }))
        },
        edges: {}
      };

      // Mock executeSQL to track batch sizes
      mockQueryExecutor.executeSQL.mockImplementation((query, params) => {
        if (query.includes('INSERT INTO age_schema_client.age_params')) {
          const data = JSON.parse(params[0]);
          expect(data.length).toBeLessThanOrEqual(500); // Custom batch size
        }

        return Promise.resolve({
          rows: [{ created_vertices: '500' }]
        });
      });

      await batchLoader.loadGraphData(largeGraphData, { batchSize: 500 });

      // Verify that executeSQL was called multiple times for batches
      // We expect at least 11 calls (BEGIN, AGE setup, 4 data inserts, 4 Cypher queries, COMMIT)
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(11);
    });
  });

  describe('validateGraphData', () => {
    it('should validate graph data successfully', async () => {
      const result = await batchLoader.validateGraphData(testGraphData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '2', age: 25 } // Missing required name property
          ]
        },
        edges: {}
      };

      const result = await batchLoader.validateGraphData(invalidGraphData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required property: name');
    });
  });
});
