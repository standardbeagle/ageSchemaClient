/**
 * Comprehensive integration tests for BatchLoader
 *
 * These tests verify that the BatchLoader correctly loads graph data
 * into the graph database, covering all aspects of the functionality.
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
  extendedTestData,
  generateLargeTestData
} from '../../fixtures/batch-loader-test-data';

// Skip all tests if AGE is not available
describe.runIf(async () => await isAgeAvailable())('BatchLoader Comprehensive Integration Tests', () => {
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

  describe('Complete Graph Loading', () => {
    it('should load a complete graph with multiple vertex and edge types', async () => {
      // Load the extended test data with continueOnError set to true
      const result = await batchLoader.loadGraphData(extendedTestData, { continueOnError: true });

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(13); // 5 Person + 2 Company + 3 Department + 3 Project
      expect(result.edgeCount).toBe(20); // 5 WORKS_AT + 4 KNOWS + 3 BELONGS_TO + 5 WORKS_IN + 5 WORKS_ON + 3 MANAGES
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);

      // Verify the vertices and edges were created in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check vertex counts by type
      const personCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(personCountResult.rows).toHaveLength(1);
      expect(parseInt(personCountResult.rows[0].count)).toBe(5);

      const companyCountResult = await queryBuilder
        .match('Company', 'c')
        .done()
        .return('count(c) AS count')
        .execute();

      expect(companyCountResult.rows).toHaveLength(1);
      expect(parseInt(companyCountResult.rows[0].count)).toBe(2);

      const departmentCountResult = await queryBuilder
        .match('Department', 'd')
        .done()
        .return('count(d) AS count')
        .execute();

      expect(departmentCountResult.rows).toHaveLength(1);
      expect(parseInt(departmentCountResult.rows[0].count)).toBe(3);

      const projectCountResult = await queryBuilder
        .match('Project', 'pr')
        .done()
        .return('count(pr) AS count')
        .execute();

      expect(projectCountResult.rows).toHaveLength(1);
      expect(parseInt(projectCountResult.rows[0].count)).toBe(3);

      // Check edge counts by type
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
      expect(parseInt(worksAtCountResult.rows[0].count)).toBe(5);

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
      expect(parseInt(knowsCountResult.rows[0].count)).toBe(4);

      const belongsToCountResult = await queryBuilder
        .match('Department', 'd')
        .done()
        .match('Company', 'c')
        .done()
        .match('d', 'BELONGS_TO', 'c', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(belongsToCountResult.rows).toHaveLength(1);
      expect(parseInt(belongsToCountResult.rows[0].count)).toBe(3);

      const worksInCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Department', 'd')
        .done()
        .match('p', 'WORKS_IN', 'd', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(worksInCountResult.rows).toHaveLength(1);
      expect(parseInt(worksInCountResult.rows[0].count)).toBe(5);

      const worksOnCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Project', 'pr')
        .done()
        .match('p', 'WORKS_ON', 'pr', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(worksOnCountResult.rows).toHaveLength(1);
      expect(parseInt(worksOnCountResult.rows[0].count)).toBe(5);

      const managesCountResult = await queryBuilder
        .match('Department', 'd')
        .done()
        .match('Project', 'pr')
        .done()
        .match('d', 'MANAGES', 'pr', 'e')
        .done()
        .return('count(e) AS count')
        .execute();

      expect(managesCountResult.rows).toHaveLength(1);
      expect(parseInt(managesCountResult.rows[0].count)).toBe(3);
    });

    it('should handle custom graph names', async () => {
      // Create a unique graph name for this test
      const customGraphName = `test_graph_${Date.now()}`;

      try {
        // Create the custom graph
        const connection = await connectionManager.getConnection();
        try {
          await connection.query(`SELECT * FROM ag_catalog.create_graph('${customGraphName}')`);
        } finally {
          await connectionManager.releaseConnection(connection);
        }

        // Load data into the custom graph with continueOnError set to true
        const result = await batchLoader.loadGraphData(extendedTestData, { graphName: customGraphName, continueOnError: true });

        // Verify the result
        expect(result.success).toBe(true);
        expect(result.vertexCount).toBe(13);
        expect(result.edgeCount).toBe(20);

        // Verify the data was loaded into the custom graph
        const queryBuilder = new QueryBuilder(testSchema, queryExecutor, customGraphName);
        const vertexCountResult = await queryBuilder
          .match('Person', 'p')
          .done()
          .return('count(p) AS count')
          .execute();

        expect(vertexCountResult.rows).toHaveLength(1);
        expect(parseInt(vertexCountResult.rows[0].count)).toBe(5);
      } finally {
        // Clean up the custom graph
        const connection = await connectionManager.getConnection();
        try {
          await connection.query(`SELECT * FROM ag_catalog.drop_graph('${customGraphName}', true)`);
        } catch (error) {
          console.error(`Error dropping custom graph: ${error.message}`);
        } finally {
          await connectionManager.releaseConnection(connection);
        }
      }
    });
  });

  describe('Performance and Batching', () => {
    it('should handle large datasets with batching', async () => {
      // Generate a large dataset
      const largeData = generateLargeTestData(100, 5, 0.1);

      // Load the data with a small batch size and continueOnError set to true
      const result = await batchLoader.loadGraphData(largeData, { batchSize: 20, continueOnError: true });

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(105); // 100 Person + 5 Company
      expect(result.edgeCount).toBeGreaterThan(100); // 100 WORKS_AT + variable number of KNOWS edges

      // Verify the data was loaded correctly
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

      // Check vertex counts
      const personCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(personCountResult.rows).toHaveLength(1);
      expect(parseInt(personCountResult.rows[0].count)).toBe(100);

      const companyCountResult = await queryBuilder
        .match('Company', 'c')
        .done()
        .return('count(c) AS count')
        .execute();

      expect(companyCountResult.rows).toHaveLength(1);
      expect(parseInt(companyCountResult.rows[0].count)).toBe(5);

      // Check edge counts
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
      expect(parseInt(worksAtCountResult.rows[0].count)).toBe(100);
    });

    it('should report progress during loading', async () => {
      // Create a progress callback
      const progressEvents: any[] = [];
      const onProgress = (progress: any) => {
        progressEvents.push({ ...progress });
      };

      // Load the extended test data with progress reporting and continueOnError set to true
      const result = await batchLoader.loadGraphData(extendedTestData, { onProgress, continueOnError: true });

      // Verify the result
      expect(result.success).toBe(true);

      // Verify progress events were reported
      expect(progressEvents.length).toBeGreaterThan(0);

      // Verify progress events for vertices
      const personProgress = progressEvents.find(p => p.phase === 'vertices' && p.type === 'Person');
      expect(personProgress).toBeDefined();
      expect(personProgress.processed).toBe(5);
      expect(personProgress.total).toBe(5);
      expect(personProgress.percentage).toBe(100);

      // Verify progress events for edges
      const worksAtProgress = progressEvents.find(p => p.phase === 'edges' && p.type === 'WORKS_AT');
      expect(worksAtProgress).toBeDefined();
      expect(worksAtProgress.processed).toBe(5);
      expect(worksAtProgress.total).toBe(5);
      expect(worksAtProgress.percentage).toBe(100);
    });
  });

  describe('Transaction Management', () => {
    it('should commit transaction on successful loading', async () => {
      // Load the extended test data with continueOnError set to true
      const result = await batchLoader.loadGraphData(extendedTestData, { continueOnError: true });

      // Verify the result
      expect(result.success).toBe(true);

      // Verify the data was committed to the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const vertexCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(vertexCountResult.rows).toHaveLength(1);
      expect(parseInt(vertexCountResult.rows[0].count)).toBe(5);
    });

    it('should use custom transaction timeout if provided', async () => {
      // Load the extended test data with a custom transaction timeout and continueOnError set to true
      const result = await batchLoader.loadGraphData(extendedTestData, { transactionTimeout: 120000, continueOnError: true });

      // Verify the result
      expect(result.success).toBe(true);

      // Verify the data was committed to the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const vertexCountResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(vertexCountResult.rows).toHaveLength(1);
      expect(parseInt(vertexCountResult.rows[0].count)).toBe(5);
    });
  });
});
