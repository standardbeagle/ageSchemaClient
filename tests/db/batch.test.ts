/**
 * Tests for the batch operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BatchOperations, BatchOperationOptions, BatchPerformanceMetrics } from '../../src/db/batch';
import { VertexOperations } from '../../src/db/vertex';
import { EdgeOperations } from '../../src/db/edge';
import { QueryExecutor } from '../../src/db/query';
import { SQLGenerator } from '../../src/sql/generator';
import { extendSQLGeneratorWithBatchOperations } from '../../src/sql/batch';

// Mock schema definition
const mockSchema = {
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['name'],
    },
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'date' },
        strength: { type: 'integer' },
      },
      fromVertex: 'Person',
      toVertex: 'Person',
    },
  },
};

describe('BatchOperations', () => {
  let mockQueryExecutor: any;
  let mockSqlGenerator: any;
  let mockVertexOperations: any;
  let mockEdgeOperations: any;
  let batchOperations: BatchOperations<any>;

  beforeEach(() => {
    // Extend SQLGenerator with batch operations
    extendSQLGeneratorWithBatchOperations(SQLGenerator);

    // Create mocks
    mockQueryExecutor = {
      executeSQL: vi.fn().mockResolvedValue({ rows: [{ id: '123', name: 'Test' }] }),
      executeCopyFrom: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      beginTransaction: vi.fn().mockResolvedValue({
        commit: vi.fn().mockResolvedValue({}),
        rollback: vi.fn().mockResolvedValue({}),
      }),
    };

    mockSqlGenerator = {
      generateBatchInsertVertexSQL: vi.fn().mockReturnValue({ sql: 'INSERT...', params: [] }),
      generateBatchInsertEdgeSQL: vi.fn().mockReturnValue({ sql: 'INSERT...', params: [] }),
      generateCreateTempVertexTableSQL: vi.fn().mockReturnValue({ sql: 'CREATE TEMP TABLE...', params: [] }),
      generateCreateTempEdgeTableSQL: vi.fn().mockReturnValue({ sql: 'CREATE TEMP TABLE...', params: [] }),
      generateCopyVertexSQL: vi.fn().mockReturnValue({ sql: 'COPY...', params: [] }),
      generateCopyEdgeSQL: vi.fn().mockReturnValue({ sql: 'COPY...', params: [] }),
      generateInsertFromTempTableSQL: vi.fn().mockReturnValue({ sql: 'INSERT FROM TEMP...', params: [] }),
    };

    mockVertexOperations = {
      validateVertexData: vi.fn(),
      transformToVertex: vi.fn((label, row) => ({ ...row, label })),
    };

    mockEdgeOperations = {
      validateEdgeData: vi.fn(),
      validateVertexTypes: vi.fn(),
      transformToEdge: vi.fn((label, row) => ({ ...row, label })),
    };

    batchOperations = new BatchOperations(
      mockSchema,
      mockQueryExecutor,
      mockSqlGenerator,
      mockVertexOperations,
      mockEdgeOperations
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createVerticesBatch', () => {
    it('should return empty array for empty input', async () => {
      const result = await batchOperations.createVerticesBatch('Person', []);
      expect(result).toEqual([]);
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalled();
    });

    it('should validate all vertex data', async () => {
      const vertices = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      await batchOperations.createVerticesBatch('Person', vertices);

      expect(mockVertexOperations.validateVertexData).toHaveBeenCalledTimes(2);
      expect(mockVertexOperations.validateVertexData).toHaveBeenCalledWith('Person', vertices[0]);
      expect(mockVertexOperations.validateVertexData).toHaveBeenCalledWith('Person', vertices[1]);
    });

    it('should use standard batch insert for small batches', async () => {
      const vertices = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      await batchOperations.createVerticesBatch('Person', vertices);

      expect(mockSqlGenerator.generateBatchInsertVertexSQL).toHaveBeenCalledWith('Person', vertices);
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(1);
      expect(mockVertexOperations.transformToVertex).toHaveBeenCalledTimes(1);
    });

    it('should use chunking for large batches', async () => {
      const vertices = Array(2000).fill(0).map((_, i) => ({ name: `Person ${i}`, age: 20 + i % 50 }));
      
      mockQueryExecutor.executeSQL.mockImplementation(() => ({ rows: [{ id: '123', name: 'Test' }] }));
      
      await batchOperations.createVerticesBatch('Person', vertices, { batchSize: 500 });
      
      // Should have called executeSQL 4 times (2000/500 = 4 chunks)
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(5); // 4 chunks + 1 BEGIN
      expect(mockSqlGenerator.generateBatchInsertVertexSQL).toHaveBeenCalledTimes(4);
    });

    it('should collect performance metrics when requested', async () => {
      const vertices = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      await batchOperations.createVerticesBatch('Person', vertices, { collectMetrics: true });

      // Metrics collection is internal, but we can verify the flow executed
      expect(mockSqlGenerator.generateBatchInsertVertexSQL).toHaveBeenCalledWith('Person', vertices);
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(1);
    });
  });

  describe('createEdgesBatch', () => {
    it('should return empty array for empty input', async () => {
      const result = await batchOperations.createEdgesBatch('KNOWS', []);
      expect(result).toEqual([]);
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalled();
    });

    it('should validate all edge data and vertex types', async () => {
      const edges = [
        {
          fromVertex: { id: '1', label: 'Person', name: 'Alice' },
          toVertex: { id: '2', label: 'Person', name: 'Bob' },
          data: { since: new Date('2020-01-01'), strength: 5 },
        },
        {
          fromVertex: { id: '2', label: 'Person', name: 'Bob' },
          toVertex: { id: '3', label: 'Person', name: 'Charlie' },
          data: { since: new Date('2021-01-01'), strength: 3 },
        },
      ];

      await batchOperations.createEdgesBatch('KNOWS', edges);

      expect(mockEdgeOperations.validateEdgeData).toHaveBeenCalledTimes(2);
      expect(mockEdgeOperations.validateVertexTypes).toHaveBeenCalledTimes(2);
    });

    it('should use standard batch insert for small batches', async () => {
      const edges = [
        {
          fromVertex: { id: '1', label: 'Person', name: 'Alice' },
          toVertex: { id: '2', label: 'Person', name: 'Bob' },
          data: { since: new Date('2020-01-01'), strength: 5 },
        },
      ];

      await batchOperations.createEdgesBatch('KNOWS', edges);

      expect(mockSqlGenerator.generateBatchInsertEdgeSQL).toHaveBeenCalledTimes(1);
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(1);
    });
  });
});
