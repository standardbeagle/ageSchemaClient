/**
 * Integration tests for BatchLoader vertex loading
 * 
 * These tests verify that the BatchLoader correctly loads vertices
 * into the graph database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { BatchLoader, GraphData } from '../../../src/loader/batch-loader';
import { QueryExecutor } from '../../../src/db/query';
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
describe.runIf(async () => await isAgeAvailable())('BatchLoader Vertex Loading Integration Tests', () => {
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
  
  describe('Vertex Loading', () => {
    it('should load vertices successfully', async () => {
      // Create a subset of the test data with only vertices
      const vertexOnlyData: GraphData = {
        vertices: { ...basicTestData.vertices },
        edges: {}
      };
      
      // Load the vertices
      const result = await batchLoader.loadGraphData(vertexOnlyData);
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(5); // 3 Person + 2 Company
      expect(result.edgeCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      
      // Verify the vertices were created in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      
      // Check Person vertices
      const personResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('p')
        .execute();
      
      expect(personResult.rows).toHaveLength(3);
      
      // Check Company vertices
      const companyResult = await queryBuilder
        .match('Company', 'c')
        .done()
        .return('c')
        .execute();
      
      expect(companyResult.rows).toHaveLength(2);
      
      // Verify vertex properties
      const personPropsResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .where('p.id = "p1"')
        .return('p.id AS id, p.name AS name, p.age AS age, p.email AS email, p.active AS active')
        .execute();
      
      expect(personPropsResult.rows).toHaveLength(1);
      const person = personPropsResult.rows[0];
      expect(person.id).toBe('p1');
      expect(person.name).toBe('Alice Smith');
      expect(person.age).toBe(30);
      expect(person.email).toBe('alice@example.com');
      expect(person.active).toBe(true);
    });
    
    it('should handle vertices with different property types', async () => {
      // Create test data with various property types
      const testData: GraphData = {
        vertices: {
          Person: [
            { 
              id: 'p1', 
              name: 'Alice Smith', 
              age: 30, // number
              email: 'alice@example.com', // string
              active: true // boolean
            }
          ]
        },
        edges: {}
      };
      
      // Load the vertices
      const result = await batchLoader.loadGraphData(testData);
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(1);
      
      // Verify the vertex properties in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const personResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .where('p.id = "p1"')
        .return('p.id AS id, p.name AS name, p.age AS age, p.email AS email, p.active AS active')
        .execute();
      
      expect(personResult.rows).toHaveLength(1);
      const person = personResult.rows[0];
      
      // Verify property types
      expect(person.id).toBe('p1');
      expect(typeof person.id).toBe('string');
      
      expect(person.name).toBe('Alice Smith');
      expect(typeof person.name).toBe('string');
      
      expect(person.age).toBe(30);
      expect(typeof person.age).toBe('number');
      
      expect(person.email).toBe('alice@example.com');
      expect(typeof person.email).toBe('string');
      
      expect(person.active).toBe(true);
      expect(typeof person.active).toBe('boolean');
    });
    
    it('should handle vertices with missing optional properties', async () => {
      // Create test data with missing optional properties
      const testData: GraphData = {
        vertices: {
          Person: [
            { 
              id: 'p1', 
              name: 'Alice Smith'
              // age, email, and active are missing but optional
            }
          ]
        },
        edges: {}
      };
      
      // Load the vertices
      const result = await batchLoader.loadGraphData(testData);
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(1);
      
      // Verify the vertex properties in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const personResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .where('p.id = "p1"')
        .return('p.id AS id, p.name AS name, p.age AS age, p.email AS email, p.active AS active')
        .execute();
      
      expect(personResult.rows).toHaveLength(1);
      const person = personResult.rows[0];
      
      // Verify required properties are present
      expect(person.id).toBe('p1');
      expect(person.name).toBe('Alice Smith');
      
      // Verify optional properties are null or undefined
      expect(person.age).toBeNull();
      expect(person.email).toBeNull();
      expect(person.active).toBeNull();
    });
    
    it('should handle batch loading of vertices', async () => {
      // Create test data with many vertices
      const testData: GraphData = {
        vertices: {
          Person: Array(50).fill(0).map((_, i) => ({
            id: `person-${i}`,
            name: `Person ${i}`,
            age: 20 + (i % 50)
          }))
        },
        edges: {}
      };
      
      // Load the vertices with a small batch size
      const result = await batchLoader.loadGraphData(testData, { batchSize: 10 });
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.vertexCount).toBe(50);
      
      // Verify the vertices were created in the database
      const queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
      const countResult = await queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p) AS count')
        .execute();
      
      expect(countResult.rows).toHaveLength(1);
      expect(parseInt(countResult.rows[0].count)).toBe(50);
    });
    
    it('should reject vertices with missing required properties', async () => {
      // Create test data with missing required properties
      const testData: GraphData = {
        vertices: {
          Person: [
            { 
              id: 'p1'
              // name is missing but required
            }
          ]
        },
        edges: {}
      };
      
      // Attempt to load the vertices
      await expect(batchLoader.loadGraphData(testData)).rejects.toThrow(/required property/i);
      
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
  });
});
