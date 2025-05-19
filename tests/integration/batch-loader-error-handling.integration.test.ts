/**
 * Integration tests for batch loader error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBatchLoader } from '../../src/loader/batch-loader-impl';
import { BatchLoaderError, ValidationError } from '../../src/core/errors';
import { SchemaDefinition } from '../../src/schema/types';
import { QueryExecutor } from '../../src/db/query';
import { GraphData } from '../../src/loader/batch-loader';
import { PgConnectionManager } from '../../src/db/connector';
import { getTestConnectionConfig } from '../test-utils';

describe('BatchLoader Error Handling Integration Tests', () => {
  let connectionManager: PgConnectionManager;
  let queryExecutor: QueryExecutor;
  let schema: SchemaDefinition;
  let graphName: string;

  beforeAll(async () => {
    // Create a connection manager
    connectionManager = new PgConnectionManager(getTestConnectionConfig());

    // Create a query executor
    queryExecutor = new QueryExecutor(await connectionManager.getConnection());

    // Create a test graph
    graphName = `test_graph_${Date.now()}`;

    try {
      // Create the graph
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.create_graph('${graphName}');
      `);
    } catch (error) {
      console.error('Error creating test graph:', error);
      throw error;
    }

    // Define a schema
    schema = {
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
        },
        KNOWS: {
          from: 'Person',
          to: 'Person',
          properties: {
            from: { type: 'string', required: true },
            to: { type: 'string', required: true },
            since: { type: 'number' }
          }
        }
      }
    };
  });

  afterAll(async () => {
    try {
      // Drop the test graph
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${graphName}', true);
      `);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }

    // Close all connections
    await connectionManager.closeAll();
  });

  it('should handle validation errors with real data', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create invalid data (missing required name property)
    const invalidData: GraphData = {
      vertices: {
        Person: [
          { id: '1' } // Missing required name property
        ]
      },
      edges: {}
    };

    const result = await batchLoader.loadGraphData(invalidData, { graphName });

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(ValidationError);
    expect(result.errors![0].message).toContain('Validation failed');
  });

  it('should handle non-existent graph errors', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Valid data but non-existent graph
    const validData: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice' }
        ]
      },
      edges: {}
    };

    const result = await batchLoader.loadGraphData(validData, { graphName: 'non_existent_graph' });

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toBeInstanceOf(BatchLoaderError);
    expect(result.errors![0].message).toContain('Failed to load vertices');
  });

  it('should handle edge reference errors', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create data with edges referencing non-existent vertices
    const dataWithInvalidEdges: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice' }
        ],
        Company: [
          { id: '3', name: 'Acme Inc.' }
        ]
      },
      edges: {
        WORKS_AT: [
          { from: '1', to: '3', since: 2015 }, // Valid
          { from: '2', to: '3', since: 2018 }  // Invalid: Person with id '2' doesn't exist
        ]
      }
    };

    // First, load the vertices
    const loadResult = await batchLoader.loadGraphData(dataWithInvalidEdges, { graphName });

    // The operation should succeed but with warnings
    expect(loadResult.success).toBe(true);
    expect(loadResult.vertexCount).toBe(2); // 1 Person + 1 Company
    expect(loadResult.edgeCount).toBe(1);   // Only the valid edge should be created
    expect(loadResult.warnings!.length).toBeGreaterThan(0);
    expect(loadResult.warnings!.some(w => w.includes('source vertices'))).toBe(true);
  });

  it('should handle invalid edge type errors', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create data with an invalid edge type
    const dataWithInvalidEdgeType: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' }
        ]
      },
      edges: {
        INVALID_EDGE: [ // This edge type doesn't exist in the schema
          { from: '1', to: '2' }
        ]
      }
    };

    const result = await batchLoader.loadGraphData(dataWithInvalidEdgeType, { graphName });

    // The operation should succeed but with warnings
    expect(result.success).toBe(true);
    expect(result.vertexCount).toBe(2);
    expect(result.edgeCount).toBe(0); // No edges should be created
    expect(result.warnings!.length).toBeGreaterThan(0);
    expect(result.warnings!.some(w => w.includes('not found in schema'))).toBe(true);
  });

  it('should continue on error when continueOnError is true', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create data with both valid and invalid parts
    const mixedData: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' }
        ],
        InvalidType: [ // This vertex type doesn't exist in the schema
          { id: '3', name: 'Invalid' }
        ]
      },
      edges: {
        KNOWS: [
          { from: '1', to: '2', since: 2010 } // Valid edge
        ]
      }
    };

    const result = await batchLoader.loadGraphData(mixedData, {
      graphName,
      continueOnError: true
    });

    // The operation should succeed with the valid parts
    expect(result.success).toBe(true);
    expect(result.vertexCount).toBe(2); // Only the valid vertices
    expect(result.edgeCount).toBe(1);   // The valid edge
    expect(result.warnings!.length).toBeGreaterThan(0);
  });

  it('should provide detailed error context', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create data with an invalid vertex (missing required property)
    const invalidData: GraphData = {
      vertices: {
        Person: [
          { id: '1' } // Missing required name property
        ]
      },
      edges: {}
    };

    const result = await batchLoader.loadGraphData(invalidData, { graphName });

    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);

    // Check if the error is a ValidationError
    if (result.errors![0] instanceof ValidationError) {
      expect(result.errors![0].message).toContain('Validation failed');
    } else if (result.errors![0] instanceof BatchLoaderError) {
      // Or check if it's a BatchLoaderError with context
      const error = result.errors![0] as BatchLoaderError;
      expect(error.context).toBeDefined();
      expect(error.context!.phase).toBe('validation');
    }
  });
});
