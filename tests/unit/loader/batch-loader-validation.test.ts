/**
 * Unit tests for BatchLoader validation logic
 * 
 * These tests verify that the BatchLoader correctly validates graph data
 * against the schema definition.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { ValidationError } from '../../../src/core/errors';
import {
  createMockQueryExecutor,
  createMockConnection,
  createMockTransaction,
  testSchema,
  testGraphData,
  invalidGraphData
} from './test-fixtures';

// Mock the DataValidator class
vi.mock('../../../src/loader/data-validator', () => {
  return {
    DataValidator: vi.fn().mockImplementation(() => ({
      validateData: vi.fn().mockImplementation((data: GraphData) => {
        // Simple validation logic for testing
        const errors = [];
        const warnings = [];
        
        // Check vertices
        if (data.vertices) {
          for (const [type, vertices] of Object.entries(data.vertices)) {
            if (Array.isArray(vertices)) {
              for (let i = 0; i < vertices.length; i++) {
                const vertex = vertices[i];
                
                // Check for required properties
                if (type === 'Person' && !vertex.name) {
                  errors.push({
                    type: 'vertex',
                    entityType: type,
                    index: i,
                    property: 'name',
                    message: 'Missing required property: name'
                  });
                }
                
                if (type === 'Company' && !vertex.name) {
                  errors.push({
                    type: 'vertex',
                    entityType: type,
                    index: i,
                    property: 'name',
                    message: 'Missing required property: name'
                  });
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
                  errors.push({
                    type: 'edge',
                    entityType: type,
                    index: i,
                    property: 'from',
                    message: 'Missing required property: from'
                  });
                }
                
                if (!edge.to) {
                  errors.push({
                    type: 'edge',
                    entityType: type,
                    index: i,
                    property: 'to',
                    message: 'Missing required property: to'
                  });
                }
                
                // Check for invalid references (simplified)
                if (edge.to === '4') {
                  errors.push({
                    type: 'edge',
                    entityType: type,
                    index: i,
                    property: 'to',
                    message: 'Invalid reference: Vertex with id 4 not found'
                  });
                }
              }
            }
          }
        }
        
        return {
          valid: errors.length === 0,
          errors,
          warnings
        };
      })
    }))
  };
});

describe('BatchLoader Validation', () => {
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
    
    // Create a new BatchLoader for each test
    batchLoader = createBatchLoader(testSchema, mockQueryExecutor, {
      defaultGraphName: 'test_graph',
      validateBeforeLoad: true,
      defaultBatchSize: 1000,
      schemaName: 'age_schema_client'
    });
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
      expect(result.errors).toContainEqual(expect.stringContaining('Missing required property: name'));
    });
    
    it('should detect invalid references in edges', async () => {
      const result = await batchLoader.validateGraphData(invalidGraphData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContainEqual(expect.stringContaining('Invalid reference'));
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
    
    it('should handle missing vertices or edges', async () => {
      const incompleteGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 }
          ]
        }
      };
      
      const result = await batchLoader.validateGraphData(incompleteGraphData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle null graph data', async () => {
      const result = await batchLoader.validateGraphData(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Graph data is required');
    });
    
    it('should handle validation errors in the validator', async () => {
      // Mock the validateData method to throw an error
      vi.mocked(require('../../../src/loader/data-validator').DataValidator).mockImplementation(() => ({
        validateData: vi.fn().mockImplementation(() => {
          throw new ValidationError('Validation failed');
        })
      }));
      
      await expect(batchLoader.validateGraphData(testGraphData)).rejects.toThrow('Validation failed');
    });
  });
  
  describe('loadGraphData with validation', () => {
    it('should validate data before loading when validateBeforeLoad is true', async () => {
      // Mock executeSQL to return success results
      mockQueryExecutor.executeSQL.mockResolvedValue({ rows: [] });
      
      // Try to load invalid data
      await expect(batchLoader.loadGraphData(invalidGraphData)).rejects.toThrow('Validation failed');
      
      // Verify that no data was loaded
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalledWith(expect.stringContaining('CREATE'));
    });
    
    it('should skip validation when validateBeforeLoad is false', async () => {
      // Mock executeSQL to return success results
      mockQueryExecutor.executeSQL.mockResolvedValue({ rows: [] });
      
      // Create a new BatchLoader with validateBeforeLoad set to false
      const nonValidatingBatchLoader = createBatchLoader(testSchema, mockQueryExecutor, {
        defaultGraphName: 'test_graph',
        validateBeforeLoad: false,
        defaultBatchSize: 1000,
        schemaName: 'age_schema_client'
      });
      
      // Load invalid data without validation
      await nonValidatingBatchLoader.loadGraphData(invalidGraphData);
      
      // Verify that data was loaded despite being invalid
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
    });
  });
});
