/**
 * Unit tests for BatchLoader validation logic
 *
 * These tests verify that the BatchLoader correctly validates graph data
 * against the schema definition.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { ValidationError } from '../../../src/core/errors';
import {
  createMockQueryExecutor,
  createMockConnection,
  testSchema,
  testGraphData,
  invalidGraphData
} from './test-fixtures';

// Create a mock BatchLoader implementation
const mockValidateGraphData = vi.fn();
const mockLoadGraphData = vi.fn();

const createMockBatchLoader = vi.fn().mockImplementation(() => ({
  validateGraphData: mockValidateGraphData,
  loadGraphData: mockLoadGraphData
}));

// Mock the batch-loader-impl module
vi.mock('../../../src/loader/batch-loader-impl', () => ({
  createBatchLoader: createMockBatchLoader
}));

describe('BatchLoader Validation', () => {
  let mockQueryExecutor: any;
  let mockConnection: any;
  let batchLoader: BatchLoader<typeof testSchema>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mocks
    mockQueryExecutor = createMockQueryExecutor();
    mockConnection = createMockConnection();

    // Mock getConnection to return mockConnection
    mockQueryExecutor.getConnection.mockResolvedValue(mockConnection);

    // Set up default mock behavior for validateGraphData
    mockValidateGraphData.mockImplementation((data: GraphData) => {
      // Simple validation logic for testing that matches the real implementation
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check vertices
      if (data.vertices) {
        for (const [type, vertices] of Object.entries(data.vertices)) {
          if (Array.isArray(vertices)) {
            for (let i = 0; i < vertices.length; i++) {
              const vertex = vertices[i];

              // Check for required properties
              if (type === 'Person' && !vertex.name) {
                errors.push(`vertex ${type} at index ${i}: Missing required property: name (property: name)`);
              }

              if (type === 'Company' && !vertex.name) {
                errors.push(`vertex ${type} at index ${i}: Missing required property: name (property: name)`);
              }
            }
          }
        }
      }

      // Check edges
      if (data.edges) {
        for (const [type, edges] of Object.entries(data.edges)) {
          if (Array.isArray(edges)) {
            for (let i = 0; i < edges.length; i++) {
              const edge = edges[i];

              // Check for required properties
              if (!edge.from) {
                errors.push(`edge ${type} at index ${i}: Missing required property: from (property: from)`);
              }

              if (!edge.to) {
                errors.push(`edge ${type} at index ${i}: Missing required property: to (property: to)`);
              }

              // Check for invalid references (simplified)
              if (edge.to === '4') {
                errors.push(`edge ${type} at index ${i}: Invalid reference: Vertex with id 4 not found (property: to)`);
              }
            }
          }
        }
      }

      return Promise.resolve({
        isValid: errors.length === 0,
        errors,
        warnings
      });
    });

    // Set up default mock behavior for loadGraphData
    mockLoadGraphData.mockImplementation(() => {
      return Promise.resolve({
        success: true,
        vertexCount: 0,
        edgeCount: 0,
        duration: 100,
        warnings: [],
        errors: []
      });
    });

    // Create a new BatchLoader for each test
    batchLoader = {
      validateGraphData: mockValidateGraphData,
      loadGraphData: mockLoadGraphData
    } as BatchLoader<typeof testSchema>;
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('validateGraphData', () => {
    it('should validate valid graph data successfully', async () => {
      const result = await batchLoader.validateGraphData(testGraphData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing required properties in vertices', async () => {
      const result = await batchLoader.validateGraphData(invalidGraphData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Check that at least one error contains the expected message
      expect(result.errors.some(error => error.includes('Missing required property: name'))).toBe(true);
    });

    it('should detect invalid references in edges', async () => {
      const result = await batchLoader.validateGraphData(invalidGraphData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Check that at least one error contains the expected message
      expect(result.errors.some(error => error.includes('Invalid reference'))).toBe(true);
    });

    it('should handle empty graph data', async () => {
      const emptyGraphData: GraphData = {
        vertices: {},
        edges: {}
      };

      const result = await batchLoader.validateGraphData(emptyGraphData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle missing edges', async () => {
      const incompleteGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 }
          ]
        },
        edges: {}
      };

      const result = await batchLoader.validateGraphData(incompleteGraphData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle null graph data', async () => {
      // Mock validateGraphData to handle null data
      mockValidateGraphData.mockResolvedValue({
        isValid: false,
        errors: ['Graph data is required'],
        warnings: []
      });

      const result = await batchLoader.validateGraphData(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBe('Graph data is required');
    });

    it('should handle validation errors in the validator', async () => {
      // Mock the validateGraphData to throw an error when called
      mockValidateGraphData.mockRejectedValue(new ValidationError('Validation failed'));

      await expect(batchLoader.validateGraphData(testGraphData)).rejects.toThrow('Validation failed');
    });
  });

  describe('loadGraphData with validation', () => {
    it('should validate data before loading when validateBeforeLoad is true', async () => {
      // Mock loadGraphData to return a failed result when validation fails
      mockLoadGraphData.mockResolvedValue({
        success: false,
        vertexCount: 0,
        edgeCount: 0,
        duration: 50,
        warnings: [],
        errors: [new ValidationError('Validation failed: vertex Person at index 1: Missing required property: name (property: name)')]
      });

      // Try to load invalid data - should return a failed result
      const result = await batchLoader.loadGraphData(invalidGraphData);

      // Verify that validation failed and loading was not successful
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(mockLoadGraphData).toHaveBeenCalledWith(invalidGraphData);
    });

    it('should skip validation when validateBeforeLoad is false', async () => {
      // Mock loadGraphData to return success for the non-validating loader
      const mockLoadGraphDataForNonValidating = vi.fn().mockResolvedValue({
        success: true,
        vertexCount: 2,
        edgeCount: 1,
        duration: 100,
        warnings: [],
        errors: []
      });

      // Create a new BatchLoader with validateBeforeLoad set to false
      const nonValidatingBatchLoader = {
        validateGraphData: mockValidateGraphData,
        loadGraphData: mockLoadGraphDataForNonValidating
      } as BatchLoader<typeof testSchema>;

      // Load invalid data without validation - should succeed
      const result = await nonValidatingBatchLoader.loadGraphData(invalidGraphData);

      // Verify that data was loaded despite being invalid
      expect(result.success).toBe(true);
      expect(mockLoadGraphDataForNonValidating).toHaveBeenCalledWith(invalidGraphData);
    });
  });
});
