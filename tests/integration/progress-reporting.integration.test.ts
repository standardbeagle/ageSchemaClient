/**
 * Integration tests for progress reporting in the batch loader
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createBatchLoader } from '../../src/loader/batch-loader-impl';
import { SchemaDefinition } from '../../src/schema/types';
import { QueryExecutor } from '../../src/db/query';
import { GraphData, LoadProgress } from '../../src/loader/batch-loader';
import { PgConnectionManager } from '../../src/db/connector';
import { getTestConnectionConfig } from '../test-utils';

describe('Progress Reporting Integration Tests', () => {
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

  it('should report progress during loading process', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create test data
    const testData: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice', age: 30 },
          { id: '2', name: 'Bob', age: 25 },
          { id: '3', name: 'Charlie', age: 35 }
        ],
        Company: [
          { id: '101', name: 'Acme Inc.', founded: 1990 },
          { id: '102', name: 'TechCorp', founded: 2005 }
        ]
      },
      edges: {
        WORKS_AT: [
          { from: '1', to: '101', since: 2015, position: 'Engineer' },
          { from: '2', to: '101', since: 2018, position: 'Manager' },
          { from: '3', to: '102', since: 2010, position: 'Developer' }
        ]
      }
    };

    // Create a mock progress callback
    const progressCallback = vi.fn();

    // Load the data with progress reporting
    const result = await batchLoader.loadGraphData(testData, {
      graphName,
      onProgress: progressCallback,
      batchSize: 2 // Small batch size to test multiple batches
    });

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.vertexCount).toBe(5);
    expect(result.edgeCount).toBe(3);

    // Verify that the progress callback was called
    expect(progressCallback).toHaveBeenCalled();

    // Verify validation phase progress
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'validation',
      type: 'schema',
      processed: 0,
      total: 1,
      percentage: 0,
      elapsedTime: expect.any(Number)
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'validation',
      type: 'schema',
      processed: 1,
      total: 1,
      percentage: 100,
      elapsedTime: expect.any(Number)
    }));

    // Verify vertex loading phase progress
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Person',
      processed: expect.any(Number),
      total: 3,
      percentage: expect.any(Number),
      elapsedTime: expect.any(Number),
      batchNumber: expect.any(Number),
      totalBatches: expect.any(Number)
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'vertices',
      type: 'Company',
      processed: expect.any(Number),
      total: 2,
      percentage: expect.any(Number),
      elapsedTime: expect.any(Number),
      batchNumber: expect.any(Number),
      totalBatches: expect.any(Number)
    }));

    // Verify edge loading phase progress
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'edges',
      type: 'WORKS_AT',
      processed: expect.any(Number),
      total: 3,
      percentage: expect.any(Number),
      elapsedTime: expect.any(Number),
      batchNumber: expect.any(Number),
      totalBatches: expect.any(Number)
    }));

    // Verify cleanup phase progress
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'cleanup',
      type: 'connection',
      processed: 0,
      total: 1,
      percentage: 0,
      elapsedTime: expect.any(Number)
    }));

    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'cleanup',
      type: 'connection',
      processed: 1,
      total: 1,
      percentage: 100,
      elapsedTime: expect.any(Number)
    }));

    // Verify that the data was loaded correctly
    const personQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (p:Person)
        RETURN p.id AS id, p.name AS name, p.age AS age
      $$) AS (id agtype, name agtype, age agtype);
    `;

    const personResult = await queryExecutor.executeSQL(personQuery);
    expect(personResult.rows.length).toBe(3);

    const companyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (c:Company)
        RETURN c.id AS id, c.name AS name, c.founded AS founded
      $$) AS (id agtype, name agtype, founded agtype);
    `;

    const companyResult = await queryExecutor.executeSQL(companyQuery);
    expect(companyResult.rows.length).toBe(2);

    const edgeQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (p:Person)-[r:WORKS_AT]->(c:Company)
        RETURN p.id AS person_id, c.id AS company_id, r.since AS since, r.position AS position
      $$) AS (person_id agtype, company_id agtype, since agtype, position agtype);
    `;

    const edgeResult = await queryExecutor.executeSQL(edgeQuery);
    expect(edgeResult.rows.length).toBe(3);
  });

  it('should report errors in progress callback', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create invalid test data (missing required name property)
    const invalidData: GraphData = {
      vertices: {
        Person: [
          { id: '1' } // Missing required name property
        ]
      },
      edges: {}
    };

    // Create a mock progress callback
    const progressCallback = vi.fn();

    // Load the data with progress reporting
    const result = await batchLoader.loadGraphData(invalidData, {
      graphName,
      onProgress: progressCallback
    });

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);

    // Verify that the progress callback was called with error information
    expect(progressCallback).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'validation',
      type: 'schema',
      elapsedTime: expect.any(Number),
      error: expect.objectContaining({
        message: expect.stringContaining('Validation failed'),
        type: expect.any(String),
        recoverable: false
      })
    }));
  });

  it('should include warnings in progress reporting', async () => {
    const batchLoader = createBatchLoader(schema, queryExecutor);

    // Create test data with invalid edge references
    const testData: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice', age: 30 }
        ],
        Company: [
          { id: '101', name: 'Acme Inc.', founded: 1990 }
        ]
      },
      edges: {
        WORKS_AT: [
          { from: '1', to: '101', since: 2015, position: 'Engineer' },
          { from: '2', to: '101', since: 2018, position: 'Manager' } // Invalid 'from' reference
        ]
      }
    };

    // Create a mock progress callback
    const progressCallback = vi.fn();

    // Load the data with progress reporting
    const result = await batchLoader.loadGraphData(testData, {
      graphName,
      onProgress: progressCallback,
      validateBeforeLoad: true,
      continueOnError: true
    });

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.warnings!.length).toBeGreaterThan(0);

    // Verify that the progress callback was called with warnings
    const progressCallWithWarnings = progressCallback.mock.calls.find(call =>
      call[0].warnings && call[0].warnings.length > 0
    );

    expect(progressCallWithWarnings).toBeDefined();
    expect(progressCallWithWarnings[0]).toMatchObject({
      warnings: expect.arrayContaining([
        expect.stringContaining('Warning')
      ])
    });
  });
});
