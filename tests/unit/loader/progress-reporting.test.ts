/**
 * Unit tests for progress reporting in the batch loader
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { GraphData, LoadProgress } from '../../../src/loader/batch-loader';

// Mock the QueryExecutor
vi.mock('../../../src/db/query', () => {
  return {
    QueryExecutor: vi.fn().mockImplementation(() => ({
      getConnection: vi.fn().mockResolvedValue({}),
      releaseConnection: vi.fn().mockResolvedValue(undefined),
      executeSQL: vi.fn().mockImplementation((query) => {
        if (query.includes('CREATE VERTEX QUERY')) {
          return Promise.resolve({ rows: [{ created_vertices: '2' }] });
        } else if (query.includes('CREATE EDGE QUERY')) {
          return Promise.resolve({ rows: [{ created_edges: '1' }] });
        } else {
          return Promise.resolve({ rows: [] });
        }
      }),
      executeCypher: vi.fn().mockResolvedValue({ rows: [] })
    }))
  };
});

// Create a mock for DataValidator
const mockValidateData = vi.fn().mockReturnValue({ valid: true, errors: [], warnings: [] });
const MockDataValidator = vi.fn().mockImplementation(() => ({
  validateData: mockValidateData
}));

// Mock the module
vi.mock('../../../src/loader/data-validator', () => {
  return {
    DataValidator: MockDataValidator
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

describe('BatchLoader Progress Reporting', () => {
  let mockSchema: SchemaDefinition;
  let mockQueryExecutor: QueryExecutor;
  let testData: GraphData;
  let progressCallback: vi.Mock;

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
        },
        Company: {
          properties: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true }
          }
        }
      },
      edges: {
        WORKS_AT: {
          from: 'Person',
          to: 'Company',
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
        ],
        Company: [
          { id: '3', name: 'Acme Inc.' }
        ]
      },
      edges: {
        WORKS_AT: [
          { from: '1', to: '3' }
        ]
      }
    };

    // Create a mock progress callback
    progressCallback = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report progress during validation phase', async () => {
    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);

    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });

    // Check that the progress callback was called for validation phase
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'validation',
      type: 'schema',
      processed: 0,
      total: 1,
      percentage: 0
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'validation',
      type: 'schema',
      processed: 1,
      total: 1,
      percentage: 100
    }));
  });

  it('should report progress during vertex loading phase', async () => {
    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);

    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });

    // Check that the progress callback was called for vertex loading phase
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Person',
      processed: 2,
      total: 2,
      percentage: 100
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Company',
      processed: 1,
      total: 1,
      percentage: 100
    }));
  });

  it('should report progress during edge loading phase', async () => {
    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);

    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });

    // Check that the progress callback was called for edge loading phase
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'edges',
      type: 'WORKS_AT',
      processed: 1,
      total: 1,
      percentage: 100
    }));
  });

  it('should report progress during cleanup phase', async () => {
    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);

    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });

    // Check that the progress callback was called for cleanup phase
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'cleanup',
      type: 'connection',
      processed: 0,
      total: 1,
      percentage: 0
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'cleanup',
      type: 'connection',
      processed: 1,
      total: 1,
      percentage: 100
    }));
  });

  it('should report errors in progress callback', async () => {
    // Mock validation failure
    mockValidateData.mockReturnValueOnce({
      valid: false,
      errors: [
        { type: 'vertex', entityType: 'Person', index: 0, message: 'Missing required property: name' }
      ],
      warnings: []
    });

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor);

    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });

    // Check that the progress callback was called with error information
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'validation',
      type: 'schema',
      processed: 0,
      total: 1,
      percentage: 0,
      error: expect.objectContaining({
        message: expect.stringContaining('Validation failed'),
        type: expect.any(String),
        recoverable: false
      })
    }));
  });

  it('should include percentage information in progress reports', async () => {
    // Create test data with more items to test percentage calculation
    const largeTestData: GraphData = {
      vertices: {
        Person: Array(100).fill(0).map((_, i) => ({ id: `${i}`, name: `Person ${i}` }))
      },
      edges: {}
    };

    // Mock the executeSQL to handle batches
    mockQueryExecutor.executeSQL = vi.fn().mockImplementation((query) => {
      if (query.includes('CREATE VERTEX QUERY')) {
        return Promise.resolve({ rows: [{ created_vertices: '25' }] });
      } else {
        return Promise.resolve({ rows: [] });
      }
    });

    const batchLoader = createBatchLoader(mockSchema, mockQueryExecutor, { defaultBatchSize: 25 });

    await batchLoader.loadGraphData(largeTestData, {
      onProgress: progressCallback
    });

    // Check that the progress callback was called with correct percentage values
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Person',
      processed: 25,
      total: 100,
      percentage: 25
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Person',
      processed: 50,
      total: 100,
      percentage: 50
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Person',
      processed: 75,
      total: 100,
      percentage: 75
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Person',
      processed: 100,
      total: 100,
      percentage: 100
    }));
  });
});
