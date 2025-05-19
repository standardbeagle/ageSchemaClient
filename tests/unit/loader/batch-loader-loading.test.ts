/**
 * Unit tests for BatchLoader vertex and edge loading
 * 
 * These tests verify that the BatchLoader correctly loads vertices and edges
 * into the graph database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { TransactionManager } from '../../../src/db/transaction';
import { QueryBuilder } from '../../../src/query/builder';
import {
  createMockQueryExecutor,
  createMockConnection,
  createMockTransaction,
  createMockQueryBuilder,
  testSchema,
  testGraphData,
  createLargeGraphData
} from './test-fixtures';

// Mock the QueryBuilder class
vi.mock('../../../src/query/builder', () => {
  return {
    QueryBuilder: vi.fn().mockImplementation(() => ({
      setParam: vi.fn().mockResolvedValue(undefined),
      withAgeParam: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      done: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      return: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ rows: [] })
    }))
  };
});

// Mock the CypherQueryGenerator
vi.mock('../../../src/loader/cypher-query-generator', () => {
  return {
    CypherQueryGenerator: vi.fn().mockImplementation(() => ({
      generateCreateVerticesQuery: vi.fn().mockReturnValue('CREATE VERTEX QUERY'),
      generateCreateEdgesQuery: vi.fn().mockReturnValue('CREATE EDGE QUERY')
    }))
  };
});

describe('BatchLoader Vertex and Edge Loading', () => {
  let mockQueryExecutor: any;
  let mockConnection: any;
  let mockTransaction: any;
  let mockQueryBuilder: any;
  let batchLoader: BatchLoader<typeof testSchema>;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mocks
    mockQueryExecutor = createMockQueryExecutor();
    mockConnection = createMockConnection();
    mockTransaction = createMockTransaction();
    mockQueryBuilder = createMockQueryBuilder();
    
    // Mock getConnection to return mockConnection
    mockQueryExecutor.getConnection.mockResolvedValue(mockConnection);
    
    // Mock TransactionManager
    vi.spyOn(TransactionManager.prototype, 'beginTransaction').mockImplementation(() => {
      return Promise.resolve(mockTransaction as any);
    });
    
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
      validateBeforeLoad: false, // Skip validation for these tests
      defaultBatchSize: 1000,
      schemaName: 'age_schema_client'
    });
  });
  
  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });
  
  describe('Vertex Loading', () => {
    it('should load vertices successfully', async () => {
      const result = await batchLoader.loadGraphData(testGraphData);
      
      // Verify that the result contains the correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was called for each vertex type
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledWith(expect.stringContaining('CREATE VERTEX QUERY'));
    });
    
    it('should handle empty vertex arrays', async () => {
      const emptyVertexData: GraphData = {
        vertices: {
          Person: []
        },
        edges: {}
      };
      
      const result = await batchLoader.loadGraphData(emptyVertexData);
      
      // Verify that the result contains zero vertex count
      expect(result.vertexCount).toBe(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was not called for vertex creation
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalledWith(expect.stringContaining('CREATE VERTEX QUERY'));
    });
    
    it('should handle missing vertex types', async () => {
      const missingVertexTypeData: GraphData = {
        vertices: {
          UnknownType: [
            { id: '1', name: 'Unknown' }
          ]
        },
        edges: {}
      };
      
      const result = await batchLoader.loadGraphData(missingVertexTypeData);
      
      // Verify that the result contains zero vertex count
      expect(result.vertexCount).toBe(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was not called for vertex creation
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalledWith(expect.stringContaining('CREATE VERTEX QUERY'));
    });
    
    it('should batch vertices according to batchSize', async () => {
      const largeGraphData = createLargeGraphData(2000);
      
      await batchLoader.loadGraphData(largeGraphData, { batchSize: 500 });
      
      // Verify that executeSQL was called multiple times for vertex creation
      // We expect at least 4 calls for vertex creation (2000 / 500 = 4)
      const vertexCreationCalls = mockQueryExecutor.executeSQL.mock.calls.filter(
        call => call[0].includes('CREATE VERTEX QUERY')
      );
      expect(vertexCreationCalls.length).toBeGreaterThanOrEqual(4);
    });
  });
  
  describe('Edge Loading', () => {
    it('should load edges successfully', async () => {
      const result = await batchLoader.loadGraphData(testGraphData);
      
      // Verify that the result contains the correct counts
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was called for each edge type
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledWith(expect.stringContaining('CREATE EDGE QUERY'));
    });
    
    it('should handle empty edge arrays', async () => {
      const emptyEdgeData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice' }
          ]
        },
        edges: {
          KNOWS: []
        }
      };
      
      const result = await batchLoader.loadGraphData(emptyEdgeData);
      
      // Verify that the result contains zero edge count
      expect(result.edgeCount).toBe(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was not called for edge creation
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalledWith(expect.stringContaining('CREATE EDGE QUERY'));
    });
    
    it('should handle missing edge types', async () => {
      const missingEdgeTypeData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice' }
          ]
        },
        edges: {
          UNKNOWN_RELATION: [
            { from: '1', to: '2' }
          ]
        }
      };
      
      const result = await batchLoader.loadGraphData(missingEdgeTypeData);
      
      // Verify that the result contains zero edge count
      expect(result.edgeCount).toBe(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was not called for edge creation
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalledWith(expect.stringContaining('CREATE EDGE QUERY'));
    });
    
    it('should batch edges according to batchSize', async () => {
      const largeGraphData = createLargeGraphData(2000);
      
      await batchLoader.loadGraphData(largeGraphData, { batchSize: 500 });
      
      // Verify that executeSQL was called multiple times for edge creation
      // We expect at least 2 calls for edge creation (1000 / 500 = 2)
      const edgeCreationCalls = mockQueryExecutor.executeSQL.mock.calls.filter(
        call => call[0].includes('CREATE EDGE QUERY')
      );
      expect(edgeCreationCalls.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Progress Reporting', () => {
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
  });
});
