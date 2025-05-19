/**
 * Unit tests for progress timing in the batch loader
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { SchemaDefinition } from '../../../src/schema/types';
import { GraphData, LoadProgress } from '../../../src/loader/batch-loader';

// Mock dependencies
const mockQueryExecutor = {
  executeSQL: vi.fn(),
  executeCypher: vi.fn(),
  getConnection: vi.fn(),
  releaseConnection: vi.fn()
};

const mockValidator = {
  validateData: vi.fn()
};

// Mock the DataValidator class
vi.mock('../../../src/loader/data-validator', () => ({
  DataValidator: vi.fn().mockImplementation(() => mockValidator)
}));

describe('Progress Timing Tests', () => {
  let schema: SchemaDefinition;
  let testData: GraphData;
  let progressCallbacks: LoadProgress[];
  let progressCallback: (progress: LoadProgress) => void;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset progress callbacks
    progressCallbacks = [];
    progressCallback = (progress: LoadProgress) => {
      progressCallbacks.push(progress);
    };
    
    // Mock the current time
    const now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    
    // Define a schema
    schema = {
      vertices: {
        Person: {
          properties: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true }
          }
        }
      },
      edges: {}
    };
    
    // Define test data
    testData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice' }
        ]
      },
      edges: {}
    };
    
    // Mock successful validation
    mockValidator.validateData.mockReturnValue({
      valid: true,
      errors: [],
      warnings: []
    });
    
    // Mock successful query execution
    mockQueryExecutor.executeSQL.mockResolvedValue({
      rows: [{ created_vertices: '1' }]
    });
    
    // Mock successful connection management
    mockQueryExecutor.getConnection.mockResolvedValue({});
    mockQueryExecutor.releaseConnection.mockResolvedValue(undefined);
  });
  
  it('should include elapsed time in progress reports', async () => {
    // Mock Date.now to advance by 1 second on each call
    let time = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => {
      time += 1000;
      return time;
    });
    
    const batchLoader = createBatchLoader(schema, mockQueryExecutor);
    
    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });
    
    // Verify that all progress reports include elapsed time
    for (const progress of progressCallbacks) {
      expect(progress.elapsedTime).toBeDefined();
      expect(progress.elapsedTime).toBeGreaterThan(0);
    }
    
    // Verify that elapsed time increases with each progress report
    for (let i = 1; i < progressCallbacks.length; i++) {
      expect(progressCallbacks[i].elapsedTime).toBeGreaterThan(progressCallbacks[i-1].elapsedTime!);
    }
  });
  
  it('should include estimated time remaining in progress reports', async () => {
    // Mock Date.now to advance by 1 second on each call
    let time = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => {
      time += 1000;
      return time;
    });
    
    // Create test data with multiple items to process
    const largeTestData: GraphData = {
      vertices: {
        Person: Array(10).fill(0).map((_, i) => ({ id: `${i}`, name: `Person ${i}` }))
      },
      edges: {}
    };
    
    // Mock successful query execution for multiple items
    mockQueryExecutor.executeSQL.mockResolvedValue({
      rows: [{ created_vertices: '1' }]
    });
    
    const batchLoader = createBatchLoader(schema, mockQueryExecutor, {
      defaultBatchSize: 2 // Small batch size to generate multiple progress reports
    });
    
    await batchLoader.loadGraphData(largeTestData, {
      onProgress: progressCallback
    });
    
    // Find progress reports for vertex loading phase with partial progress
    const vertexProgressReports = progressCallbacks.filter(p => 
      p.phase === 'vertices' && p.processed > 0 && p.processed < p.total
    );
    
    // Verify that these reports include estimated time remaining
    for (const progress of vertexProgressReports) {
      expect(progress.estimatedTimeRemaining).toBeDefined();
      expect(progress.estimatedTimeRemaining).toBeGreaterThan(0);
    }
  });
  
  it('should not include estimated time remaining when processing is complete', async () => {
    // Mock Date.now to advance by 1 second on each call
    let time = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => {
      time += 1000;
      return time;
    });
    
    const batchLoader = createBatchLoader(schema, mockQueryExecutor);
    
    await batchLoader.loadGraphData(testData, {
      onProgress: progressCallback
    });
    
    // Find progress reports for completed phases
    const completedProgressReports = progressCallbacks.filter(p => 
      p.processed === p.total && p.percentage === 100
    );
    
    // Verify that these reports either have estimatedTimeRemaining = 0 or undefined
    for (const progress of completedProgressReports) {
      if (progress.estimatedTimeRemaining !== undefined) {
        expect(progress.estimatedTimeRemaining).toBe(0);
      }
    }
  });
});
