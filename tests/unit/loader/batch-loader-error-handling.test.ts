/**
 * Unit tests for batch loader error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoaderError, ValidationError } from '../../../src/core/errors';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { GraphData } from '../../../src/loader/batch-loader';

// Mock the QueryExecutor
vi.mock('../../../src/db/query', () => {
  return {
    QueryExecutor: vi.fn().mockImplementation(() => ({
      getConnection: vi.fn().mockResolvedValue({}),
      releaseConnection: vi.fn().mockResolvedValue(undefined),
      executeSQL: vi.fn().mockResolvedValue({ rows: [{ created_vertices: '0', created_edges: '0' }] }),
      executeCypher: vi.fn().mockResolvedValue({ rows: [] })
    }))
  };
});

// Mock the DataValidator class
class MockDataValidator {
  validateData() {
    return { valid: true, errors: [], warnings: [] };
  }
}

// Mock the module
vi.mock('../../../src/loader/data-validator', () => {
  return {
    DataValidator: vi.fn().mockImplementation(() => new MockDataValidator())
  };
}, { virtual: true });

// Mock the CypherQueryGenerator
vi.mock('../../../src/loader/cypher-query-generator', () => {
  return {
    CypherQueryGenerator: vi.fn().mockImplementation(() => ({
      generateCreateVerticesQuery: vi.fn().mockReturnValue('CREATE VERTEX QUERY'),
      generateCreateEdgesQuery: vi.fn().mockReturnValue('CREATE EDGE QUERY')
    }))
  };
});

describe('BatchLoader Error Handling', () => {
  let mockSchema: SchemaDefinition;
  let mockQueryExecutor: QueryExecutor;
  let testData: GraphData;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a mock schema
    mockSchema = {
      vertices: {
        Person: {
          properties: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true }
          }
        }
      },
      edges: {
        KNOWS: {
          from: 'Person',
          to: 'Person',
          properties: {
            from: { type: 'string', required: true },
            to: { type: 'string', required: true }
          }
        }
      }
    };

    // Create a mock query executor
    mockQueryExecutor = new QueryExecutor({} as any);

    // Create test data
    testData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' }
        ]
      },
      edges: {
        KNOWS: [
          { from: '1', to: '2' }
        ]
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle validation errors', async () => {
    // Create a custom mock for this test
    const mockValidateData = vi.fn().mockReturnValue({
      valid: false,
      errors: [
        { type: 'vertex', entityType: 'Person', index: 0, message: 'Missing required property: name' }
      ],
      warnings: []
    });

    // Override the default mock for DataValidator
    vi.mocked(require('../../../src/loader/data-validator').DataValidator).mockImplementation(() => ({
      validateData: mockValidateData
    }));

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(Error);
    expect(result.errors![0].message).toContain('Validation failed');
  });

  it('should handle connection errors', async () => {
    // Mock connection failure
    const mockGetConnection = vi.fn().mockRejectedValue(new Error('Connection failed'));
    mockQueryExecutor.getConnection = mockGetConnection;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to get database connection');
    expect((result.errors![0] as BatchLoaderError).context?.phase).toBe('transaction');
  });

  it('should handle transaction begin errors', async () => {
    // Mock transaction begin failure
    const mockExecuteSQL = vi.fn()
      .mockImplementationOnce(() => { throw new Error('Transaction begin failed'); })
      .mockResolvedValue({ rows: [] });
    mockQueryExecutor.executeSQL = mockExecuteSQL;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to begin transaction');
    expect((result.errors![0] as BatchLoaderError).context?.phase).toBe('transaction');
    expect((result.errors![0] as BatchLoaderError).context?.type).toBe('begin');
  });

  it('should handle vertex loading errors', async () => {
    // Mock vertex loading failure
    const mockExecuteSQL = vi.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // AGE setup
      .mockImplementationOnce(() => { throw new Error('Vertex loading failed'); }) // Insert into age_params
      .mockResolvedValue({ rows: [] });
    mockQueryExecutor.executeSQL = mockExecuteSQL;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to load vertices');
    expect((result.errors![0] as BatchLoaderError).context?.phase).toBe('vertices');
  });

  it('should handle edge loading errors', async () => {
    // Mock edge loading failure after successful vertex loading
    const mockExecuteSQL = vi.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // AGE setup
      .mockResolvedValueOnce({}) // Insert vertex data
      .mockResolvedValueOnce({ rows: [{ created_vertices: '2' }] }) // Create vertices
      .mockImplementationOnce(() => { throw new Error('Edge loading failed'); }) // Insert edge data
      .mockResolvedValue({ rows: [] });
    mockQueryExecutor.executeSQL = mockExecuteSQL;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to load edges');
    expect((result.errors![0] as BatchLoaderError).context?.phase).toBe('edges');
  });

  it('should handle transaction commit errors', async () => {
    // Mock transaction commit failure
    const mockExecuteSQL = vi.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // AGE setup
      .mockResolvedValueOnce({}) // Insert vertex data
      .mockResolvedValueOnce({ rows: [{ created_vertices: '2' }] }) // Create vertices
      .mockResolvedValueOnce({}) // Insert edge data
      .mockResolvedValueOnce({ rows: [{ created_edges: '1' }] }) // Create edges
      .mockImplementationOnce(() => { throw new Error('Commit failed'); }) // COMMIT
      .mockResolvedValue({});
    mockQueryExecutor.executeSQL = mockExecuteSQL;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to commit transaction');
    expect((result.errors![0] as BatchLoaderError).context?.phase).toBe('transaction');
    expect((result.errors![0] as BatchLoaderError).context?.type).toBe('commit');
  });

  it('should handle transaction rollback errors', async () => {
    // Mock transaction rollback failure
    const mockExecuteSQL = vi.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // AGE setup
      .mockImplementationOnce(() => { throw new Error('Vertex loading failed'); }) // Insert vertex data
      .mockImplementationOnce(() => { throw new Error('Rollback failed'); }) // ROLLBACK
      .mockResolvedValue({});
    mockQueryExecutor.executeSQL = mockExecuteSQL;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBe(2); // Both original error and rollback error
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to load vertices');
    expect(result.errors![1]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![1].message).toContain('Failed to rollback transaction');
  });

  it('should handle connection release errors', async () => {
    // Mock connection release failure
    mockQueryExecutor.releaseConnection = vi.fn().mockRejectedValue(new Error('Release failed'));

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData);

    expect(result.success).toBe(true); // The operation succeeded despite release error
    expect(result.errors!.length).toBe(1);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to release connection');
    expect((result.errors![0] as BatchLoaderError).context?.phase).toBe('cleanup');
  });

  it('should continue on error when continueOnError is true', async () => {
    // Mock edge loading failure but continue
    const mockExecuteSQL = vi.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // AGE setup
      .mockResolvedValueOnce({}) // Insert vertex data
      .mockResolvedValueOnce({ rows: [{ created_vertices: '2' }] }) // Create vertices
      .mockImplementationOnce(() => { throw new Error('Edge loading failed'); }) // Insert edge data
      .mockResolvedValueOnce({}) // COMMIT
      .mockResolvedValue({});
    mockQueryExecutor.executeSQL = mockExecuteSQL;

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);
    const result = await batchLoader.loadGraphData(testData, { continueOnError: true });

    // Even with edge loading error, the operation should succeed with continueOnError
    expect(result.success).toBe(true);
    expect(result.vertexCount).toBe(2);
    expect(result.edgeCount).toBe(0);
    expect(result.warnings!.length).toBeGreaterThan(0);
    expect(result.warnings![0]).toContain('Error loading edge type');
  });
});
