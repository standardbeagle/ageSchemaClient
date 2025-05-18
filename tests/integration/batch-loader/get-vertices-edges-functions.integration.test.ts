/**
 * Integration tests for the get_vertices and get_edges functions
 * 
 * These tests verify that the PostgreSQL functions for retrieving vertex and edge data
 * from the age_params temporary table work correctly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PgConnectionManager } from '../../../src/db/connector';
import { QueryExecutor } from '../../../src/db/query';
import { QueryBuilder } from '../../../src/query/builder';

// Test graph name
const TEST_GRAPH_NAME = 'test_batch_loader_graph';

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
  edges: {
    WORKS_AT: {
      properties: {
        since: { type: 'number' },
        position: { type: 'string' }
      },
      from: 'Person',
      to: 'Company'
    }
  }
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
      
      // Create the get_vertices and get_edges functions
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

        -- Function to retrieve edge data by type from the age_params table
        CREATE OR REPLACE FUNCTION age_schema_client.get_edges(edge_type ag_catalog.agtype)
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          edge_type_text TEXT;
          result_array JSONB;
        BEGIN
          -- Extract the text value from the agtype parameter
          SELECT edge_type::text INTO edge_type_text;
          
          -- Remove quotes if present
          edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

          -- Get the data for the specified edge type and convert to ag_catalog.agtype
          SELECT value
          INTO result_array
          FROM age_params
          WHERE key = 'edge_' || edge_type_text;

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
  
  // Close all connections
  await connectionManager.closeAll();
});

// Test suite
describe('get_vertices and get_edges functions', () => {
  // Skip all tests if AGE is not available
  if (!ageAvailable) {
    it.skip('AGE not available, skipping tests', () => {});
    return;
  }
  
  // Test get_vertices function
  it('should retrieve vertex data from the age_params table', async () => {
    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, TEST_GRAPH_NAME);
    
    // Set vertex data in the age_params table
    const personData = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 }
    ];
    await queryBuilder.setParam('vertex_Person', personData);
    
    // Execute a Cypher query that uses the get_vertices function
    const result = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Person') AS person
      RETURN person.id AS id, person.name AS name, person.age AS age
      ORDER BY person.id
    `, {}, TEST_GRAPH_NAME);
    
    // Verify the result
    expect(result.rows).toHaveLength(2);
    
    // Parse the JSON strings if needed
    const parsedRows = result.rows.map(row => ({
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
  
  // Test get_edges function
  it('should retrieve edge data from the age_params table', async () => {
    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, TEST_GRAPH_NAME);
    
    // Set edge data in the age_params table
    const worksAtData = [
      { from: '1', to: '3', since: 2015, position: 'Manager' },
      { from: '2', to: '3', since: 2018, position: 'Developer' }
    ];
    await queryBuilder.setParam('edge_WORKS_AT', worksAtData);
    
    // Execute a Cypher query that uses the get_edges function
    const result = await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_edges('WORKS_AT') AS edge
      RETURN edge.from AS from, edge.to AS to, edge.since AS since, edge.position AS position
      ORDER BY edge.from
    `, {}, TEST_GRAPH_NAME);
    
    // Verify the result
    expect(result.rows).toHaveLength(2);
    
    // Parse the JSON strings if needed
    const parsedRows = result.rows.map(row => ({
      from: typeof row.from === 'string' ? JSON.parse(row.from) : row.from,
      to: typeof row.to === 'string' ? JSON.parse(row.to) : row.to,
      since: typeof row.since === 'string' ? JSON.parse(row.since) : row.since,
      position: typeof row.position === 'string' ? JSON.parse(row.position) : row.position
    }));
    
    expect(parsedRows[0].from).toBe('1');
    expect(parsedRows[0].to).toBe('3');
    expect(parsedRows[0].since).toBe(2015);
    expect(parsedRows[0].position).toBe('Manager');
    
    expect(parsedRows[1].from).toBe('2');
    expect(parsedRows[1].to).toBe('3');
    expect(parsedRows[1].since).toBe(2018);
    expect(parsedRows[1].position).toBe('Developer');
  });
});
