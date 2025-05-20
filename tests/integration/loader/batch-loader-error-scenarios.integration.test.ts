/**
 * Integration tests for BatchLoader error scenarios
 *
 * These tests verify that the BatchLoader correctly handles error scenarios
 * when loading graph data.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { QueryBuilder } from '../../../src/query/builder';
import { BatchLoaderError } from '../../../src/core/errors';
import {
  connectionManager,
  queryExecutor,
  AGE_GRAPH_NAME,
  isAgeAvailable
} from '../../setup/integration';
import {
  testSchema,
  basicTestData
} from '../../fixtures/batch-loader-test-data';

// Skip all tests if AGE is not available
describe.runIf(async () => await isAgeAvailable())('BatchLoader Error Scenarios Integration Tests', () => {
  let batchLoader: BatchLoader<typeof testSchema>;

  beforeEach(async () => {
    // Create a new BatchLoader for each test
    batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: AGE_GRAPH_NAME,
      validateBeforeLoad: true,
      defaultBatchSize: 1000,
      schemaName: 'age_schema_client'
    });

    // Clear the graph before each test
    const connection = await connectionManager.getConnection();
    try {
      await connection.query(`
        SELECT * FROM cypher('${AGE_GRAPH_NAME}', $$
          MATCH (n)
          DETACH DELETE n
        $$) as (result ag_catalog.agtype);
      `);
    } finally {
      await connectionManager.releaseConnection(connection);
    }
  });

  describe('Validation Errors', () => {
    it('should reject data with missing required vertex properties', async () => {
      // Create test data with missing required properties
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1' } // Missing required 'name' property
          ]
        },
        edges: {}
      };

      // Attempt to load the data
      const result = await batchLoader.loadGraphData(testData);
      expect(result.success).toBe(false);
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].message).toMatch(/required property/i);

      // Verify no vertices were created
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const countResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(countResult.rows).toHaveLength(1);
      expect(parseInt(countResult.rows[0].count)).toBe(0);
    });

    it('should reject data with missing required edge properties', async () => {
      // Create test data with missing required edge properties
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1', name: 'Alice Smith' },
            { id: 'p2', name: 'Bob Johnson' }
          ]
        },
        edges: {
          KNOWS: [
            { from: 'p1' } // Missing required 'to' property
          ]
        }
      };

      // Attempt to load the data
      const result = await batchLoader.loadGraphData(testData);
      expect(result.success).toBe(false);
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].message).toMatch(/missing a 'to' property/i);

      // Verify vertices were created but no edges
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check vertices
      const vertexCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(vertexCountResult.rows).toHaveLength(1);
      expect(parseInt(vertexCountResult.rows[0].count)).toBe(0);

      // Check edges
      const edgeCountResult = await queryBuilder
        .match('Person', 'p1')
        .done()
        .match('Person', 'p2')
        .done()
        .match('p1', 'KNOWS', 'p2', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(edgeCountResult.rows).toHaveLength(1);
      expect(parseInt(edgeCountResult.rows[0].count)).toBe(0);
    });

    it('should reject data with invalid vertex types', async () => {
      // Create test data with invalid vertex types
      const testData: GraphData = {
        vertices: {
          InvalidType: [
            { id: 'p1', name: 'Alice Smith' }
          ]
        },
        edges: {}
      };

      // Attempt to load the data with continueOnError set to false and collect warnings
      const result = await batchLoader.loadGraphData(testData, {
        continueOnError: false,
        collectWarnings: true,
        warnings: []
      });

      // Verify the result
      expect(result.success).toBe(false); // The operation fails with errors
      expect(result.vertexCount).toBe(0); // No vertices are created
      expect(result.errors!.length).toBeGreaterThan(0); // There should be warnings about invalid vertex types
    });

    it('should reject data with invalid edge types', async () => {
      // Create test data with invalid edge types
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1', name: 'Alice Smith' },
            { id: 'p2', name: 'Bob Johnson' }
          ]
        },
        edges: {
          InvalidType: [
            { from: 'p1', to: 'p2' }
          ]
        }
      };

      // Attempt to load the data with continueOnError set to false and collect warnings
      const result = await batchLoader.loadGraphData(testData, {
        continueOnError: false,
        collectWarnings: true,
        warnings: []
      });

      // Verify the result
      expect(result.success).toBe(false); // The operation fails with errors
      expect(result.vertexCount).toBe(0); // Vertices are created
      expect(result.edgeCount).toBe(0); // No edges are created
      expect(result.errors!.length).toBeGreaterThan(0); // There should be warnings about invalid edge types
    });
  });

  describe('Reference Errors', () => {
    it('should handle edges with non-existent vertex references', async () => {
      // Create test data with non-existent vertex references
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1', name: 'Alice Smith' }
          ],
          Company: [
            { id: 'c1', name: 'Acme Inc.' }
          ]
        },
        edges: {
          WORKS_AT: [
            { from: 'p1', to: 'c1', since: 2015 }, // Valid reference
            { from: 'p2', to: 'c1', since: 2018 } // Invalid reference
          ]
        }
      };

      // Load the data with continueOnError set to false
      const result = await batchLoader.loadGraphData(testData, { continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true); // The operation succeeds but with warnings
      expect(result.vertexCount).toBe(2); // Vertices are created
      expect(result.edgeCount).toBe(1); // Only the valid edge is created
      expect(result.warnings!.length).toBeGreaterThan(0); // There should be warnings about invalid references

      // Verify only the valid edge was created
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const edgeCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(edgeCountResult.rows).toHaveLength(1);
      expect(parseInt(edgeCountResult.rows[0].count)).toBe(1);
    });

    it('should handle edges with incompatible vertex types', async () => {
      // Create test data with incompatible vertex types
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1', name: 'Alice Smith' },
            { id: 'p2', name: 'Bob Johnson' }
          ],
          Company: [
            { id: 'c1', name: 'Acme Inc.' }
          ]
        },
        edges: {
          WORKS_AT: [
            { from: 'p1', to: 'p2', since: 2015 } // Invalid: WORKS_AT should be from Person to Company
          ]
        }
      };

      // Load the data with continueOnError set to false
      const result = await batchLoader.loadGraphData(testData, { continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true); // The operation succeeds but with warnings
      expect(result.vertexCount).toBe(3); // Vertices are created
      expect(result.edgeCount).toBe(0); // No edges are created
      expect(result.warnings!.length).toBeGreaterThan(0); // There should be warnings about incompatible vertex types
    });
  });

  describe('Transaction Errors', () => {
    it('should rollback transaction on error', async () => {
      const validatingBatchLoader = createBatchLoader(testSchema, queryExecutor, {
        defaultGraphName: AGE_GRAPH_NAME,
        validateBeforeLoad: true,
        defaultBatchSize: 1000,
        schemaName: 'age_schema_client'
      });

      // Create test data with valid vertices but invalid edges
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1', name: 'Alice Smith' },
            { id: 'p2', name: 'Bob Johnson' }
          ]
        },
        edges: {
          KNOWS: [
            { from: 'p1' } // Missing required 'since' property
          ]
        }
      };

      // Attempt to load the data
      const result = await validatingBatchLoader.loadGraphData(testData);
      expect(result.success).toBe(false);
      expect(result.errors!.length).toBeGreaterThan(0);

      // Verify no vertices or edges were created (transaction was rolled back)
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check vertices
      const vertexCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(vertexCountResult.rows).toHaveLength(1);
      expect(parseInt(vertexCountResult.rows[0].count)).toBe(0);
    });
  });

  describe('Error Recovery', () => {
    it('should continue on error when continueOnError is true', async () => {
      // Create a BatchLoader with validateBeforeLoad set to false
      const nonValidatingBatchLoader = createBatchLoader(testSchema, queryExecutor, {
        defaultGraphName: AGE_GRAPH_NAME,
        validateBeforeLoad: false,
        defaultBatchSize: 1000,
        schemaName: 'age_schema_client'
      });

      // Create test data with valid vertices but some invalid edges
      const testData: GraphData = {
        vertices: {
          Person: [
            { id: 'p1', name: 'Alice Smith' },
            { id: 'p2', name: 'Bob Johnson' }
          ],
          Company: [
            { id: 'c1', name: 'Acme Inc.' }
          ]
        },
        edges: {
          WORKS_AT: [
            { from: 'p1', to: 'c1', since: 2015 } // Valid edge
          ],
          KNOWS: [
            { from: 'p1', to: 'p2', since: 2018 }, // Valid edge
            { from: 'p1' } // Invalid edge (missing 'to' property)
          ]
        }
      };

      // Load the data with continueOnError set to true
      const result = await nonValidatingBatchLoader.loadGraphData(testData, { continueOnError: true });

      // Verify the result
      expect(result.success).toBe(true); // The operation succeeds despite errors
      expect(result.vertexCount).toBe(3); // Vertices are created
      expect(result.edgeCount).toBe(2); // Only the valid WORKS_AT and KNOWS edge is created

      // Verify the valid edges were created
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check WORKS_AT edges
      const worksAtCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(worksAtCountResult.rows).toHaveLength(1);
      expect(parseInt(worksAtCountResult.rows[0].count)).toBe(1);

      // Check KNOWS edges (should be 0 due to error in the KNOWS batch)
      const knowsCountResult = await queryBuilder
        .match('Person', 'p1')
        .done()
        .match('Person', 'p2')
        .done()
        .match('p1', 'KNOWS', 'p2', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(knowsCountResult.rows).toHaveLength(1);
      expect(parseInt(knowsCountResult.rows[0].count)).toBe(1);
    });
  });
});
