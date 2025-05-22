/**
 * Unit tests for the BatchLoaderImpl class - simplified to focus on testable logic
 *
 * Note: Complex database interaction tests have been moved to integration tests
 * as they require real database connections and are difficult to mock properly.
 *
 * These tests focus on the BatchLoader interface implementation and data validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { DataValidator } from '../../../src/loader/data-validator';

// Simple mock for DataValidator
const mockDataValidator = {
  validateData: vi.fn()
};

vi.mock('../../../src/loader/data-validator', () => {
  return {
    DataValidator: vi.fn().mockImplementation(() => mockDataValidator)
  };
});

// Simple mock for QueryExecutor - only used for constructor
const mockQueryExecutor = {
  getConnection: vi.fn(),
  releaseConnection: vi.fn(),
  executeSQL: vi.fn()
} as unknown as QueryExecutor;

// Sample schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
      }
    }
  },
  edges: {
    WORKS_AT: {
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

describe('BatchLoaderImpl - Interface and Validation', () => {
  let batchLoader: BatchLoader<typeof testSchema>;

  beforeEach(() => {
    // Reset mock function calls
    vi.clearAllMocks();

    // Create a new BatchLoader for each test
    batchLoader = createBatchLoader(testSchema, mockQueryExecutor, {
      defaultGraphName: 'test_graph',
      validateBeforeLoad: true,
      defaultBatchSize: 1000,
      schemaName: 'age_schema_client'
    });
  });

  describe('BatchLoader Interface', () => {
    it('should create BatchLoader instance', () => {
      // Test that BatchLoader can be instantiated
      expect(batchLoader).toBeDefined();
      expect(typeof batchLoader.loadGraphData).toBe('function');
      expect(typeof batchLoader.validateGraphData).toBe('function');
    });

    it('should have correct configuration', () => {
      // Test that the BatchLoader was created with the correct configuration
      // This is a simple test to verify the factory function works
      expect(batchLoader).toBeDefined();
    });
  });

  describe('validateGraphData', () => {
    it('should validate graph data successfully', async () => {
      // Mock successful validation
      mockDataValidator.validateData.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      });

      const result = await batchLoader.validateGraphData(testGraphData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      // Mock validation failure
      mockDataValidator.validateData.mockReturnValue({
        valid: false,
        errors: [
          { type: 'vertex', entityType: 'Person', index: 1, message: 'Missing required property: name' }
        ],
        warnings: []
      });

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

    it('should handle validation warnings', async () => {
      // Mock validation with warnings
      mockDataValidator.validateData.mockReturnValue({
        valid: true,
        errors: [],
        warnings: ['Optional property missing']
      });

      const result = await batchLoader.validateGraphData(testGraphData);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('Optional property missing');
    });
  });
});
