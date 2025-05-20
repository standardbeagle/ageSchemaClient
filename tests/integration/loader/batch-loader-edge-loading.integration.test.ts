/**
 * Integration tests for BatchLoader edge loading
 *
 * These tests verify that the BatchLoader correctly loads edges
 * into the graph database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { QueryBuilder } from '../../../src/query/builder';
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
describe.runIf(async () => await isAgeAvailable())('BatchLoader Edge Loading Integration Tests', () => {
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

  describe('Edge Loading', () => {
    it('should load vertices and edges successfully', async () => {
      // Load the complete test data
      const result = await batchLoader.loadGraphData(basicTestData, { continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(5); // 3 Person + 2 Company
      expect(result.edgeCount).toBe(5); // 3 WORKS_AT + 2 KNOWS
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);

      // Verify the edges were created in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check WORKS_AT edges
      const worksAtResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .return('p.id AS personId, c.id AS companyId, e.since AS since, e.position AS position')
        .execute();

      expect(worksAtResult.rows).toHaveLength(3);

      // Check KNOWS edges
      const knowsResult = await queryBuilder
        .match('Person', 'p1')
        .done()
        .match('Person', 'p2')
        .done()
        .match('p1', 'KNOWS', 'p2', 'e')
        .done()
        .return('p1.id AS person1Id, p2.id AS person2Id, e.since AS since, e.relationship AS relationship')
        .execute();

      expect(knowsResult.rows).toHaveLength(2);

      // Verify edge properties
      const edgePropsResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .where('p.id = "p1" AND c.id = "c1"')
        .return('p.id AS personId, c.id AS companyId, e.since AS since, e.position AS position, e.salary AS salary')
        .execute();

      expect(edgePropsResult.rows).toHaveLength(1);
      const edge = edgePropsResult.rows[0];
      expect(edge.personId).toBe('p1');
      expect(edge.companyId).toBe('c1');
      expect(edge.since).toBe(2015);
      expect(edge.position).toBe('Manager');
      expect(edge.salary).toBe(100000);
    });

    it('should handle edges with different property types', async () => {
      // Create test data with various property types
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
            {
              from: 'p1',
              to: 'c1',
              since: 2015, // number
              position: 'Manager', // string
              salary: 100000 // number
            }
          ],
          KNOWS: [
            {
              from: 'p1',
              to: 'p2',
              since: 2018, // number
              relationship: 'Colleague' // string
            }
          ]
        }
      };

      // Load the data with continueOnError set to false
      const result = await batchLoader.loadGraphData(testData, { continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(3);
      expect(result.edgeCount).toBe(2);

      // Verify the edge properties in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check WORKS_AT edge properties
      const worksAtResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .where('p.id = "p1" AND c.id = "c1"')
        .return('e.since AS since, e.position AS position, e.salary AS salary')
        .execute();

      expect(worksAtResult.rows).toHaveLength(1);
      const worksAtEdge = worksAtResult.rows[0];

      // Verify property types
      expect(worksAtEdge.since).toBe(2015);
      expect(typeof worksAtEdge.since).toBe('number');

      expect(worksAtEdge.position).toBe('Manager');
      expect(typeof worksAtEdge.position).toBe('string');

      expect(worksAtEdge.salary).toBe(100000);
      expect(typeof worksAtEdge.salary).toBe('number');

      // Check KNOWS edge properties
      const knowsResult = await queryBuilder
        .match('Person', 'p1')
        .done()
        .match('Person', 'p2')
        .done()
        .match('p1', 'KNOWS', 'p2', 'e')
        .done()
        .where('p1.id = "p1" AND p2.id = "p2"')
        .return('e.since AS since, e.relationship AS relationship')
        .execute();

      expect(knowsResult.rows).toHaveLength(1);
      const knowsEdge = knowsResult.rows[0];

      // Verify property types
      expect(knowsEdge.since).toBe(2018);
      expect(typeof knowsEdge.since).toBe('number');

      expect(knowsEdge.relationship).toBe('Colleague');
      expect(typeof knowsEdge.relationship).toBe('string');
    });

    it('should handle edges with missing optional properties', async () => {
      // Create test data with missing optional properties
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
            {
              from: 'p1',
              to: 'c1'
              // since, position, and salary are missing but optional
            }
          ]
        }
      };

      // Load the data with continueOnError set to false
      const result = await batchLoader.loadGraphData(testData, { continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(3);
      expect(result.edgeCount).toBe(1);

      // Verify the edge properties in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const edgeResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .where('p.id = "p1" AND c.id = "c1"')
        .return('e.since AS since, e.position AS position, e.salary AS salary')
        .execute();

      expect(edgeResult.rows).toHaveLength(1);
      const edge = edgeResult.rows[0];

      // Verify optional properties are null or undefined
      expect(edge.since).toBeNull();
      expect(edge.position).toBeNull();
      expect(edge.salary).toBeNull();
    });

    it('should handle batch loading of edges', async () => {
      // Create test data with many edges
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
          KNOWS: Array(50).fill(0).map((_, i) => ({
            from: 'p1',
            to: 'p2',
            since: 2010 + i,
            relationship: `Relationship ${i}`
          }))
        }
      };

      // Load the data with a small batch size and continueOnError set to false
      const result = await batchLoader.loadGraphData(testData, { batchSize: 10, continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(3);
      expect(result.edgeCount).toBe(50);

      // Verify the edges were created in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const countResult = await queryBuilder
        .match('Person', 'p1')
        .done()
        .match('Person', 'p2')
        .done()
        .match('p1', 'KNOWS', 'p2', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(countResult.rows).toHaveLength(1);
      expect(parseInt(countResult.rows[0].count)).toBe(50);
    });

    it('should reject edges with invalid vertex references', async () => {
      // Create test data with invalid vertex references
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
            {
              from: 'p1',
              to: 'c1', // Valid reference
              since: 2015
            },
            {
              from: 'p2', // Invalid reference
              to: 'c1',
              since: 2018
            }
          ]
        }
      };

      // Attempt to load the data with continueOnError set to false
      const result = await batchLoader.loadGraphData(testData, { continueOnError: false });

      // Verify the result
      expect(result.success).toBe(true); // The operation succeeds but with warnings
      expect(result.vertexCount).toBe(2);
      expect(result.edgeCount).toBe(1); // Only the valid edge is created
      expect(result.warnings!.length).toBeGreaterThan(0); // There should be warnings about invalid references

      // Verify only the valid edge was created
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const edgeResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .return('p.id AS personId, c.id AS companyId')
        .execute();

      expect(edgeResult.rows).toHaveLength(1);
      expect(edgeResult.rows[0].personId).toBe('p1');
      expect(edgeResult.rows[0].companyId).toBe('c1');
    });
  });
});
