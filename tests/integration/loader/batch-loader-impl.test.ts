/**
 * Integration tests for the BatchLoaderImpl class
 *
 * These tests verify that the BatchLoaderImpl correctly loads graph data
 * into Apache AGE using the temporary table approach.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { createQueryExecutor } from '../../../src/db/query-executor';
import { PgConnectionManager } from '../../../src/db/pg-connection-manager';
import { createConnectionManager } from '../../../src/db/connection-manager';
import { createSchema } from '../../../src/schema/schema';
import { QueryBuilder } from '../../../src/query/builder';

// Test connection manager
let connectionManager: PgConnectionManager;
let queryExecutor: QueryExecutor;
let batchLoader: BatchLoader<typeof testSchema>;

// Sample schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
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

// Test graph name
const testGraphName = 'test_batch_loader_graph';

describe('BatchLoaderImpl Integration Tests', () => {
  beforeAll(async () => {
    // Create connection manager
    connectionManager = createConnectionManager({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'age-integration',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }) as PgConnectionManager;

    // Create query executor
    queryExecutor = createQueryExecutor(connectionManager);

    // Create batch loader
    batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: testGraphName,
      validateBeforeLoad: true,
      defaultBatchSize: 1000,
      schemaName: 'age_schema_client'
    });

    // Create test graph
    const connection = await connectionManager.getConnection();
    try {
      await connection.query(`
        SELECT * FROM ag_catalog.drop_graph('${testGraphName}', true);
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    try {
      await connection.query(`
        SELECT * FROM ag_catalog.create_graph('${testGraphName}');
      `);
    } finally {
      await connectionManager.releaseConnection(connection);
    }
  });

  afterAll(async () => {
    // Drop test graph
    const connection = await connectionManager.getConnection();
    try {
      await connection.query(`
        SELECT * FROM ag_catalog.drop_graph('${testGraphName}', true);
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
    } finally {
      await connectionManager.releaseConnection(connection);
    }

    // Close connection pool
    await connectionManager.end();
  });

  beforeEach(async () => {
    // Clear test graph
    const connection = await connectionManager.getConnection();
    try {
      await connection.query(`
        SELECT * FROM cypher('${testGraphName}', $$
          MATCH (n)
          DETACH DELETE n
        $$) as (result agtype);
      `);
    } finally {
      await connectionManager.releaseConnection(connection);
    }
  });

  describe('loadGraphData', () => {
    it('should load graph data successfully', async () => {
      // Load graph data
      const result = await batchLoader.loadGraphData(testGraphData);

      // Verify that the data was loaded successfully
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(3); // 2 Person + 1 Company
      expect(result.edgeCount).toBe(2); // 2 WORKS_AT

      // Verify that the vertices were created
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, testGraphName);
      const personResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('p')
        .execute();

      expect(personResult.rows.length).toBe(2);

      const companyResult = await queryBuilder
        .match('Company', 'c')
        .done()
        .return('c')
        .execute();

      expect(companyResult.rows.length).toBe(1);

      // Verify that the edges were created
      const edgeResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .match('Company', 'c')
        .done()
        .match('p', 'WORKS_AT', 'c', 'e')
        .done()
        .return('p.id AS personId, c.id AS companyId, e.since AS since, e.position AS position')
        .execute();

      expect(edgeResult.rows.length).toBe(2);
    });

    it('should validate data before loading', async () => {
      // Create invalid graph data
      const invalidGraphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '2', age: 25 } // Missing required name property
          ]
        },
        edges: {}
      };

      // Attempt to load invalid data
      await expect(batchLoader.loadGraphData(invalidGraphData)).rejects.toThrow('Missing required property');
    });

    it('should handle large datasets with batching', async () => {
      // Create a large dataset
      const largeGraphData: GraphData = {
        vertices: {
          Person: Array(50).fill(0).map((_, i) => ({
            id: `person-${i}`,
            name: `Person ${i}`,
            age: 20 + (i % 50)
          }))
        },
        edges: {}
      };

      // Load the large dataset
      const result = await batchLoader.loadGraphData(largeGraphData, { batchSize: 10 });

      // Verify that all vertices were loaded
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(50);

      // Verify that the vertices were created
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, testGraphName);
      const personResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();

      expect(parseInt(personResult.rows[0].count, 10)).toBe(50);
    });
  });
});
