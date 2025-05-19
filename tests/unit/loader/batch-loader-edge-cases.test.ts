/**
 * Unit tests for BatchLoader error handling and edge cases
 * 
 * These tests verify that the BatchLoader correctly handles error conditions
 * and edge cases when loading graph data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { TransactionManager } from '../../../src/db/transaction';
import { BatchLoaderError } from '../../../src/core/errors';
import {
  createMockQueryExecutor,
  createMockConnection,
  createMockTransaction,
  testSchema,
  testGraphData,
  createLargeGraphData
} from './test-fixtures';

describe('BatchLoader Error Handling and Edge Cases', () => {
  let mockQueryExecutor: any;
  let mockConnection: any;
  let mockTransaction: any;
  let batchLoader: BatchLoader<typeof testSchema>;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mocks
    mockQueryExecutor = createMockQueryExecutor();
    mockConnection = createMockConnection();
    mockTransaction = createMockTransaction();
    
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
  
  describe('Error Handling', () => {
    it('should handle errors during vertex loading', async () => {
      // Mock executeSQL to throw an error during vertex creation
      mockQueryExecutor.executeSQL.mockImplementation((query) => {
        if (query.includes('vertex_Person')) {
          throw new Error('Vertex loading failed');
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Vertex loading failed');
      
      // Verify that transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors during edge loading', async () => {
      // Mock executeSQL to throw an error during edge creation
      mockQueryExecutor.executeSQL.mockImplementation((query) => {
        if (query.includes('edge_WORKS_AT')) {
          throw new Error('Edge loading failed');
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Edge loading failed');
      
      // Verify that transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
    
    it('should continue on error when continueOnError is true', async () => {
      // Mock executeSQL to throw an error during edge creation
      mockQueryExecutor.executeSQL.mockImplementation((query) => {
        if (query.includes('edge_WORKS_AT')) {
          throw new Error('Edge loading failed');
        } else if (query.includes('vertex')) {
          return Promise.resolve({
            rows: [{ created_vertices: '2' }]
          });
        } else {
          return Promise.resolve({ rows: [] });
        }
      });
      
      // Load data with continueOnError set to true
      const result = await batchLoader.loadGraphData(testGraphData, { continueOnError: true });
      
      // Verify that the operation succeeded despite the error
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBe(0);
      expect(result.warnings!.length).toBeGreaterThan(0);
      
      // Verify that transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
    
    it('should handle null or undefined graph data', async () => {
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(null as any)).rejects.toThrow('Graph data is required');
      await expect(batchLoader.loadGraphData(undefined as any)).rejects.toThrow('Graph data is required');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty graph data', async () => {
      const emptyGraphData: GraphData = {
        vertices: {},
        edges: {}
      };
      
      const result = await batchLoader.loadGraphData(emptyGraphData);
      
      // Verify that the result contains zero counts
      expect(result.vertexCount).toBe(0);
      expect(result.edgeCount).toBe(0);
      expect(result.success).toBe(true);
      
      // Verify that transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
    
    it('should handle missing vertices or edges', async () => {
      const incompleteGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice' }
          ]
        }
      };
      
      const result = await batchLoader.loadGraphData(incompleteGraphData);
      
      // Verify that the result contains correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBe(0);
      expect(result.success).toBe(true);
      
      // Verify that transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
    
    it('should handle very large batch sizes', async () => {
      const largeGraphData = createLargeGraphData(100);
      
      const result = await batchLoader.loadGraphData(largeGraphData, { batchSize: 10000 });
      
      // Verify that the result contains correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      
      // Verify that transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
    
    it('should handle very small batch sizes', async () => {
      const largeGraphData = createLargeGraphData(100);
      
      const result = await batchLoader.loadGraphData(largeGraphData, { batchSize: 1 });
      
      // Verify that the result contains correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      
      // Verify that transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      
      // Verify that executeSQL was called multiple times
      expect(mockQueryExecutor.executeSQL.mock.calls.length).toBeGreaterThan(100);
    });
    
    it('should handle custom graph names', async () => {
      const result = await batchLoader.loadGraphData(testGraphData, { graphName: 'custom_graph' });
      
      // Verify that the result contains correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      
      // Verify that executeSQL was called with the custom graph name
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledWith(expect.stringContaining('custom_graph'));
    });
    
    it('should handle debug mode', async () => {
      // Mock console.log
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await batchLoader.loadGraphData(testGraphData, { debug: true });
      
      // Verify that the result contains correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      
      // Verify that console.log was called
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore console.log
      consoleSpy.mockRestore();
    });
  });
  
  describe('Boundary Conditions', () => {
    it('should handle vertices with minimum required properties', async () => {
      const minimalGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice' } // Only required properties
          ]
        },
        edges: {}
      };
      
      const result = await batchLoader.loadGraphData(minimalGraphData);
      
      // Verify that the result contains correct counts
      expect(result.vertexCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
    
    it('should handle edges with minimum required properties', async () => {
      const minimalGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' }
          ]
        },
        edges: {
          KNOWS: [
            { from: '1', to: '2' } // Only required properties
          ]
        }
      };
      
      const result = await batchLoader.loadGraphData(minimalGraphData);
      
      // Verify that the result contains correct counts
      expect(result.edgeCount).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
  });
});
