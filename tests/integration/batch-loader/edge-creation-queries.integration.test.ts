/**
 * Integration tests for the edge creation Cypher queries
 *
 * These tests verify that the Cypher queries for creating edges in bulk
 * using the get_edges function work correctly.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PgConnectionManager } from '../../../src/db/connector';
import { QueryExecutor } from '../../../src/db/query';
import { QueryBuilder } from '../../../src/query/builder';
import { generateCreateEdgesQuery } from '../../../src/loader/cypher-templates';
import { PropertyType } from '../../../src/schema/types';

// Test graph name
const TEST_GRAPH_NAME = 'test_edge_creation_graph';

// Test schema
const testSchema = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER }
      },
      required: ['id', 'name']
    },
    Company: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        founded: { type: PropertyType.NUMBER }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      properties: {
        since: { type: PropertyType.NUMBER },
        position: { type: PropertyType.STRING }
      },
      from: 'Person',
      to: 'Company',
      fromLabel: 'Person',
      toLabel: 'Company',
      fromVertex: 'Person',
      toVertex: 'Company'
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

// Clean up the graph before each test
beforeEach(async () => {
  if (ageAvailable) {
    try {
      // Delete all vertices and edges
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
describe('Edge creation Cypher queries', () => {
  // Skip all tests if AGE is not available
  if (!ageAvailable) {
    it.skip('AGE not available, skipping tests', () => {});
    return;
  }

  // Test creating edges with the generateCreateEdgesQuery function
  it('should create edges using the generateCreateEdgesQuery function', async () => {
    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, TEST_GRAPH_NAME);

    // First, create the vertices
    const personData = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 }
    ];
    await queryBuilder.setParam('vertex_Person', personData);

    const companyData = [
      { id: '3', name: 'Acme Inc.', founded: 1990 }
    ];
    await queryBuilder.setParam('vertex_Company', companyData);

    // Create the vertices
    await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Person') AS vertex_data
      CREATE (v:Person {
        id: vertex_data.id,
        name: vertex_data.name,
        age: vertex_data.age
      })
      RETURN count(v) AS created_vertices
    `, { vertex_type: 'Person' }, TEST_GRAPH_NAME);

    await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Company') AS vertex_data
      CREATE (v:Company {
        id: vertex_data.id,
        name: vertex_data.name,
        founded: vertex_data.founded
      })
      RETURN count(v) AS created_vertices
    `, { vertex_type: 'Company' }, TEST_GRAPH_NAME);

    // Set edge data in the age_params table
    const worksAtData = [
      { from: '1', to: '3', since: 2015, position: 'Manager' },
      { from: '2', to: '3', since: 2018, position: 'Developer' }
    ];
    await queryBuilder.setParam('edge_WORKS_AT', worksAtData);

    // Generate the Cypher query for creating edges
    const createEdgesQuery = generateCreateEdgesQuery('WORKS_AT', ['since', 'position'], 'Person', 'Company');

    // Execute the query
    const result = await queryExecutor.executeCypher(
      createEdgesQuery,
      { edge_type: 'WORKS_AT' },
      TEST_GRAPH_NAME
    );

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(parseInt(result.rows[0].created_edges)).toBe(2);

    // Verify the edges were created
    const verifyResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[w:WORKS_AT]->(c:Company)
      RETURN p.id AS person_id, c.id AS company_id, w.since AS since, w.position AS position
      ORDER BY p.id
    `, {}, TEST_GRAPH_NAME);

    // Verify the result
    expect(verifyResult.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const parsedRows = verifyResult.rows.map(row => ({
      person_id: typeof row.person_id === 'string' ? JSON.parse(row.person_id) : row.person_id,
      company_id: typeof row.company_id === 'string' ? JSON.parse(row.company_id) : row.company_id,
      since: typeof row.since === 'string' ? JSON.parse(row.since) : row.since,
      position: typeof row.position === 'string' ? JSON.parse(row.position) : row.position
    }));

    expect(parsedRows[0].person_id).toBe('1');
    expect(parsedRows[0].company_id).toBe('3');
    expect(parsedRows[0].since).toBe(2015);
    expect(parsedRows[0].position).toBe('Manager');

    expect(parsedRows[1].person_id).toBe('2');
    expect(parsedRows[1].company_id).toBe('3');
    expect(parsedRows[1].since).toBe(2018);
    expect(parsedRows[1].position).toBe('Developer');
  });

  // Test creating edges with a specific property subset
  it('should create edges with a specific property subset', async () => {
    // Create a query builder
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, TEST_GRAPH_NAME);

    // First, create the vertices
    const personData = [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 }
    ];
    await queryBuilder.setParam('vertex_Person', personData);

    const companyData = [
      { id: '3', name: 'Acme Inc.', founded: 1990 }
    ];
    await queryBuilder.setParam('vertex_Company', companyData);

    // Create the vertices
    await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Person') AS vertex_data
      CREATE (v:Person {
        id: vertex_data.id,
        name: vertex_data.name,
        age: vertex_data.age
      })
      RETURN count(v) AS created_vertices
    `, { vertex_type: 'Person' }, TEST_GRAPH_NAME);

    await queryExecutor.executeCypher(`
      UNWIND age_schema_client.get_vertices('Company') AS vertex_data
      CREATE (v:Company {
        id: vertex_data.id,
        name: vertex_data.name,
        founded: vertex_data.founded
      })
      RETURN count(v) AS created_vertices
    `, { vertex_type: 'Company' }, TEST_GRAPH_NAME);

    // Set edge data in the age_params table
    const worksAtData = [
      { from: '1', to: '3', since: 2015, position: 'Manager', department: 'Sales' },
      { from: '2', to: '3', since: 2018, position: 'Developer', department: 'Engineering' }
    ];
    await queryBuilder.setParam('edge_WORKS_AT', worksAtData);

    // Generate the Cypher query for creating edges with specific properties
    const createEdgesQuery = `
      UNWIND age_schema_client.get_edges('WORKS_AT') AS edge_data
      MATCH (from:Person {id: edge_data.from})
      MATCH (to:Company {id: edge_data.to})
      CREATE (from)-[e:WORKS_AT {
        since: edge_data.since,
        position: edge_data.position
        -- department is intentionally excluded
      }]->(to)
      RETURN count(e) AS created_edges
    `;

    // Execute the query
    const result = await queryExecutor.executeCypher(
      createEdgesQuery,
      {},
      TEST_GRAPH_NAME
    );

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(parseInt(result.rows[0].created_edges)).toBe(2);

    // Verify the edges were created with only the specified properties
    const verifyResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[w:WORKS_AT]->(c:Company)
      RETURN p.id AS person_id, c.id AS company_id, w.since AS since, w.position AS position, w.department AS department
      ORDER BY p.id
    `, {}, TEST_GRAPH_NAME);

    // Verify the result
    expect(verifyResult.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const parsedRows = verifyResult.rows.map(row => ({
      person_id: typeof row.person_id === 'string' ? JSON.parse(row.person_id) : row.person_id,
      company_id: typeof row.company_id === 'string' ? JSON.parse(row.company_id) : row.company_id,
      since: typeof row.since === 'string' ? JSON.parse(row.since) : row.since,
      position: typeof row.position === 'string' ? JSON.parse(row.position) : row.position,
      department: row.department // Should be null or undefined
    }));

    expect(parsedRows[0].person_id).toBe('1');
    expect(parsedRows[0].company_id).toBe('3');
    expect(parsedRows[0].since).toBe(2015);
    expect(parsedRows[0].position).toBe('Manager');
    expect(parsedRows[0].department).toBeNull();

    expect(parsedRows[1].person_id).toBe('2');
    expect(parsedRows[1].company_id).toBe('3');
    expect(parsedRows[1].since).toBe(2018);
    expect(parsedRows[1].position).toBe('Developer');
    expect(parsedRows[1].department).toBeNull();
  });
});
