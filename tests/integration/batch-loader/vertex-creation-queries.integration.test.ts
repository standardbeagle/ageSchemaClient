/**
 * Integration tests for the vertex creation Cypher queries
 * 
 * These tests verify that the Cypher queries for creating vertices in bulk
 * using the get_vertices function work correctly.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PgConnectionManager } from '../../../src/db/connector';
import { QueryExecutor } from '../../../src/db/query';
import { QueryBuilder } from '../../../src/query/builder';
import { generateCreateVerticesQuery } from '../../../src/loader/cypher-templates';

// Test graph name
const TEST_GRAPH_NAME = 'test_vertex_creation_graph';

// Test schema
const testSchema = {
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
  edges: {}
};

// Connection manager
let connectionManager: PgConnectionManager;
// Query executor
let queryExecutor: QueryExecutor;
// Flag to indicate if AGE is available
let ageAvailable = false;

// Setup before all tests
beforeAll(async () => {
  // Create connection manager
  connectionManager = new PgConnectionManager({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'age-integration',
    user: process.env.PGUSER || 'age',
    password: process.env.PGPASSWORD || 'agepassword',
    pool: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    // PostgreSQL-specific options
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'ageSchemaClient-integration-test',
    },
  });

  try {
    // Get a connection
    const connection = await connectionManager.getConnection();
    
    // Create query executor
    queryExecutor = new QueryExecutor(connection);
    
    // Check if AGE is available
    try {
      // Try to create the test graph
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.create_graph('${TEST_GRAPH_NAME}');
      `);
      
      // Create the age_schema_client schema if it doesn't exist
      await queryExecutor.executeSQL(`
        CREATE SCHEMA IF NOT EXISTS age_schema_client;
      `);
      
      // Create the get_vertices function
      await queryExecutor.executeSQL(`
        -- Function to retrieve vertex data by type from the age_params table
        CREATE OR REPLACE FUNCTION age_schema_client.get_vertices(vertex_type ag_catalog.agtype)
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          vertex_type_text TEXT;
          result_array JSONB;
        BEGIN
          -- Extract the text value from the agtype parameter
          SELECT vertex_type::text INTO vertex_type_text;
          
          -- Remove quotes if present
          vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

          -- Get the data for the specified vertex type and convert to ag_catalog.agtype
          SELECT value
          INTO result_array
          FROM age_params
          WHERE key = 'vertex_' || vertex_type_text;

          -- Return null if no data found
          IF result_array IS NULL THEN
            RETURN '[]'::jsonb::text::ag_catalog.agtype;
          END IF;

          -- Return as agtype
          RETURN result_array::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      ageAvailable = true;
    } catch (error) {
      console.warn('AGE not available:', error);
      ageAvailable = false;
    }
  } catch (error) {
    console.error('Error setting up tests:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (ageAvailable) {
    try {
      // Drop the test graph
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${TEST_GRAPH_NAME}', true);
      `);
    } catch (error) {
      console.warn('Error dropping test graph:', error);
    }
  }
  
  // Don't close the connection pool here - let global teardown handle it
  // Just release the connection back to the pool
  if (queryExecutor && queryExecutor.connection) {
    await connectionManager.releaseConnection(queryExecutor.connection);
  }
});

// Clean up the graph before each test
beforeEach(async () => {
  if (ageAvailable) {
    try {
      // Delete all vertices
      await queryExecutor.executeCypher(`
        MATCH (n)
        DETACH DELETE n
      `, {}, TEST_GRAPH_NAME);
    } catch (error) {
      console.warn('Error cleaning up graph:', error);
    }
  }
});

// Test suite
describe('Vertex creation Cypher queries', () => {
  // Skip all tests if AGE is not available
  if (!ageAvailable) {
    it.skip('AGE not available, skipping tests', () => {});
    return;
  }
  
  // Test creating vertices with the generateCreateVerticesQuery function
  it('should create vertices using the generateCreateVerticesQuery function', async () => {
    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, TEST_GRAPH_NAME);
    
    // Set vertex data in the age_params table
    const personData = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 }
    ];
    await queryBuilder.setParam('vertex_Person', personData);
    
    // Generate the Cypher query for creating vertices
    const createVerticesQuery = generateCreateVerticesQuery('Person');
    
    // Execute the query
    const result = await queryExecutor.executeCypher(
      createVerticesQuery,
      { vertex_type: 'Person' },
      TEST_GRAPH_NAME
    );
    
    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(parseInt(result.rows[0].created_vertices)).toBe(2);
    
    // Verify the vertices were created
    const verifyResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.id AS id, p.name AS name, p.age AS age
      ORDER BY p.id
    `, {}, TEST_GRAPH_NAME);
    
    // Verify the result
    expect(verifyResult.rows).toHaveLength(2);
    
    // Parse the JSON strings if needed
    const parsedRows = verifyResult.rows.map(row => ({
      id: typeof row.id === 'string' ? JSON.parse(row.id) : row.id,
      name: typeof row.name === 'string' ? JSON.parse(row.name) : row.name,
      age: typeof row.age === 'string' ? JSON.parse(row.age) : row.age
    }));
    
    expect(parsedRows[0].id).toBe('1');
    expect(parsedRows[0].name).toBe('Alice');
    expect(parsedRows[0].age).toBe(30);
    
    expect(parsedRows[1].id).toBe('2');
    expect(parsedRows[1].name).toBe('Bob');
    expect(parsedRows[1].age).toBe(25);
  });
  
  // Test creating vertices with a specific property subset
  it('should create vertices with a specific property subset', async () => {
    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, TEST_GRAPH_NAME);
    
    // Set vertex data in the age_params table
    const personData = [
      { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
      { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' }
    ];
    await queryBuilder.setParam('vertex_Person', personData);
    
    // Generate the Cypher query for creating vertices with specific properties
    const createVerticesQuery = `
      UNWIND age_schema_client.get_vertices($vertex_type) AS vertex_data
      CREATE (v:Person {
        id: vertex_data.id,
        name: vertex_data.name,
        age: vertex_data.age
        -- email is intentionally excluded
      })
      RETURN count(v) AS created_vertices
    `;
    
    // Execute the query
    const result = await queryExecutor.executeCypher(
      createVerticesQuery,
      { vertex_type: 'Person' },
      TEST_GRAPH_NAME
    );
    
    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(parseInt(result.rows[0].created_vertices)).toBe(2);
    
    // Verify the vertices were created with only the specified properties
    const verifyResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.id AS id, p.name AS name, p.age AS age, p.email AS email
      ORDER BY p.id
    `, {}, TEST_GRAPH_NAME);
    
    // Verify the result
    expect(verifyResult.rows).toHaveLength(2);
    
    // Parse the JSON strings if needed
    const parsedRows = verifyResult.rows.map(row => ({
      id: typeof row.id === 'string' ? JSON.parse(row.id) : row.id,
      name: typeof row.name === 'string' ? JSON.parse(row.name) : row.name,
      age: typeof row.age === 'string' ? JSON.parse(row.age) : row.age,
      email: row.email // Should be null or undefined
    }));
    
    expect(parsedRows[0].id).toBe('1');
    expect(parsedRows[0].name).toBe('Alice');
    expect(parsedRows[0].age).toBe(30);
    expect(parsedRows[0].email).toBeNull();
    
    expect(parsedRows[1].id).toBe('2');
    expect(parsedRows[1].name).toBe('Bob');
    expect(parsedRows[1].age).toBe(25);
    expect(parsedRows[1].email).toBeNull();
  });
});
