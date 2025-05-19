/**
 * Unit tests for BatchLoader transaction management
 * 
 * These tests verify that the BatchLoader correctly manages transactions
 * when loading graph data.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader } from '../../../src/loader/batch-loader';
import { TransactionManager } from '../../../src/db/transaction';
import { BatchLoaderError } from '../../../src/core/errors';
import {
  createMockQueryExecutor,
  createMockConnection,
  createMockTransaction,
  testSchema,
  testGraphData,
  setupSuccessfulLoadMocks
} from './test-fixtures';

describe('BatchLoader Transaction Management', () => {
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
    
    // Setup successful load mocks
    setupSuccessfulLoadMocks(mockQueryExecutor);
    
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
  
  describe('Transaction Begin', () => {
    it('should begin a transaction when loading graph data', async () => {
      await batchLoader.loadGraphData(testGraphData);
      
      // Verify that transaction was started
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledTimes(1);
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledWith(expect.objectContaining({
        timeout: 60000, // Default timeout
        isolationLevel: 'READ COMMITTED'
      }));
    });
    
    it('should use custom transaction timeout if provided', async () => {
      await batchLoader.loadGraphData(testGraphData, { transactionTimeout: 120000 });
      
      // Verify that transaction was started with custom timeout
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledTimes(1);
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledWith(expect.objectContaining({
        timeout: 120000,
        isolationLevel: 'READ COMMITTED'
      }));
    });
    
    it('should handle transaction begin errors', async () => {
      // Mock beginTransaction to throw an error
      vi.spyOn(TransactionManager.prototype, 'beginTransaction').mockImplementation(() => {
        throw new Error('Transaction begin failed');
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Transaction begin failed');
      
      // Verify that the connection was obtained and released
      expect(mockQueryExecutor.getConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Transaction Commit', () => {
    it('should commit the transaction after successful loading', async () => {
      await batchLoader.loadGraphData(testGraphData);
      
      // Verify that transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
    
    it('should handle transaction commit errors', async () => {
      // Mock commit to throw an error
      mockTransaction.commit.mockImplementation(() => {
        throw new Error('Commit failed');
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Commit failed');
      
      // Verify that the connection was obtained and released
      expect(mockQueryExecutor.getConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Transaction Rollback', () => {
    it('should rollback the transaction on error during vertex loading', async () => {
      // Mock executeSQL to throw an error during vertex creation
      mockQueryExecutor.executeSQL.mockImplementation((query) => {
        if (query.includes('vertex_Person')) {
          throw new Error('Vertex loading failed');
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Vertex loading failed');
      
      // Verify that transaction was started and rolled back
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      
      // Verify that the connection was obtained and released
      expect(mockQueryExecutor.getConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledTimes(1);
    });
    
    it('should rollback the transaction on error during edge loading', async () => {
      // Mock executeSQL to throw an error during edge creation
      mockQueryExecutor.executeSQL.mockImplementation((query) => {
        if (query.includes('edge_WORKS_AT')) {
          throw new Error('Edge loading failed');
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Edge loading failed');
      
      // Verify that transaction was started and rolled back
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
    
    it('should handle transaction rollback errors', async () => {
      // Mock executeSQL to throw an error during vertex creation
      mockQueryExecutor.executeSQL.mockImplementation((query) => {
        if (query.includes('vertex_Person')) {
          throw new Error('Vertex loading failed');
        }
        return Promise.resolve({ rows: [] });
      });
      
      // Mock rollback to throw an error
      mockTransaction.rollback.mockImplementation(() => {
        throw new Error('Rollback failed');
      });
      
      // Expect the loadGraphData call to throw the original error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Vertex loading failed');
      
      // Verify that transaction was started and rollback was attempted
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });
  
  describe('Connection Management', () => {
    it('should get and release a connection', async () => {
      await batchLoader.loadGraphData(testGraphData);
      
      // Verify that the connection was obtained and released
      expect(mockQueryExecutor.getConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledWith(mockConnection);
    });
    
    it('should handle connection acquisition errors', async () => {
      // Mock getConnection to throw an error
      mockQueryExecutor.getConnection.mockImplementation(() => {
        throw new Error('Connection acquisition failed');
      });
      
      // Expect the loadGraphData call to throw an error
      await expect(batchLoader.loadGraphData(testGraphData)).rejects.toThrow('Connection acquisition failed');
      
      // Verify that no transaction was started
      expect(TransactionManager.prototype.beginTransaction).not.toHaveBeenCalled();
    });
    
    it('should handle connection release errors', async () => {
      // Mock releaseConnection to throw an error
      mockQueryExecutor.releaseConnection.mockImplementation(() => {
        throw new Error('Connection release failed');
      });
      
      // The operation should still succeed despite the release error
      const result = await batchLoader.loadGraphData(testGraphData);
      
      // Verify that the operation succeeded
      expect(result.success).toBe(true);
      
      // Verify that the connection was obtained and release was attempted
      expect(mockQueryExecutor.getConnection).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.releaseConnection).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Transaction Options', () => {
    it('should use default transaction options if not provided', async () => {
      await batchLoader.loadGraphData(testGraphData);
      
      // Verify that transaction was started with default options
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledWith(expect.objectContaining({
        timeout: 60000,
        isolationLevel: 'READ COMMITTED'
      }));
    });
    
    it('should use custom transaction timeout if provided', async () => {
      await batchLoader.loadGraphData(testGraphData, { transactionTimeout: 120000 });
      
      // Verify that transaction was started with custom timeout
      expect(TransactionManager.prototype.beginTransaction).toHaveBeenCalledWith(expect.objectContaining({
        timeout: 120000,
        isolationLevel: 'READ COMMITTED'
      }));
    });
  });
});
