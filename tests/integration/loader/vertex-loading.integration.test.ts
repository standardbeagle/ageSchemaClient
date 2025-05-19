/**
 * Integration tests for vertex loading
 *
 * These tests verify that the vertex loading logic correctly loads vertices
 * into Apache AGE using the temporary table approach.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBatchLoader } from '../../../src/loader/batch-loader-impl';
import { GraphData } from '../../../src/loader/batch-loader-types';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { PgConnectionManager } from '../../../src/db/connector';
import { isAgeAvailable } from '../../setup/integration';

// Sample schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' },
        active: { type: 'boolean' },
        tags: { type: 'array' },
        metadata: { type: 'object' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' },
        industry: { type: 'string' }
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
      {
        id: '1',
        name: 'Alice',
        age: 30,
        active: true,
        tags: ['developer', 'manager'],
        metadata: { department: 'Engineering', level: 'Senior' }
      },
      {
        id: '2',
        name: 'Bob',
        age: 25,
        active: true,
        tags: ['developer'],
        metadata: { department: 'Engineering', level: 'Junior' }
      }
    ],
    Company: [
      { id: '3', name: 'Acme Inc.', founded: 1990, industry: 'Technology' }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: '1', to: '3', since: 2015, position: 'Manager' },
      { from: '2', to: '3', since: 2018, position: 'Developer' }
    ]
  }
};

describe('Vertex Loading Integration Tests', () => {
  let connectionManager: PgConnectionManager;
  let queryExecutor: QueryExecutor;
  let graphName: string;
  let ageAvailable = false;

  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Create a connection manager
    connectionManager = new PgConnectionManager({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'age-integration',
      user: process.env.PGUSER || 'age',
      password: process.env.PGPASSWORD || 'agepassword',
      max: 1,
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 1000
    });

    // Create a query executor
    queryExecutor = new QueryExecutor(connectionManager);

    // Create a unique graph name for this test run
    graphName = `test_vertex_loading_${Date.now()}`;

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${graphName}')`);
    } catch (error) {
      console.error(`Error creating graph ${graphName}: ${error.message}`);
      ageAvailable = false;
      return;
    }

    // Create the age_schema_client schema if it doesn't exist
    try {
      await queryExecutor.executeSQL(`
        CREATE SCHEMA IF NOT EXISTS age_schema_client;

        -- Create the age_params table if it doesn't exist
        CREATE TABLE IF NOT EXISTS age_schema_client.age_params (
          key TEXT PRIMARY KEY,
          value JSONB
        );
      `);
    } catch (error) {
      console.error(`Error creating schema and table: ${error.message}`);
      ageAvailable = false;
      return;
    }

    // Create the get_vertices and get_edges functions
    try {
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
          FROM age_schema_client.age_params
          WHERE key = 'vertex_' || vertex_type_text;

          -- Return empty array if no data found
          IF result_array IS NULL THEN
            RETURN '[]'::jsonb::text::ag_catalog.agtype;
          END IF;

          -- Return as agtype
          RETURN result_array::text::ag_catalog.agtype;
        EXCEPTION
          WHEN others THEN
            -- Log the error
            RAISE NOTICE 'Error in get_vertices: %', SQLERRM;
            -- Return empty array on error
            RETURN '[]'::jsonb::text::ag_catalog.agtype;
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
          FROM age_schema_client.age_params
          WHERE key = 'edge_' || edge_type_text;

          -- Return empty array if no data found
          IF result_array IS NULL THEN
            RETURN '[]'::jsonb::text::ag_catalog.agtype;
          END IF;

          -- Return as agtype
          RETURN result_array::text::ag_catalog.agtype;
        EXCEPTION
          WHEN others THEN
            -- Log the error
            RAISE NOTICE 'Error in get_edges: %', SQLERRM;
            -- Return empty array on error
            RETURN '[]'::jsonb::text::ag_catalog.agtype;
        END;
        $$ LANGUAGE plpgsql;
      `);
    } catch (error) {
      console.error(`Error creating functions: ${error.message}`);
      ageAvailable = false;
      return;
    }
  }, 30000); // Increase timeout to 30 seconds

  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${graphName}: ${error.message}`);
    }

    // Drop the functions
    try {
      await queryExecutor.executeSQL(`
        DROP FUNCTION IF EXISTS age_schema_client.get_vertices(ag_catalog.agtype);
        DROP FUNCTION IF EXISTS age_schema_client.get_edges(ag_catalog.agtype);
      `);
    } catch (error) {
      console.warn(`Warning: Could not drop functions: ${error.message}`);
    }

    // Close the connection manager
    await connectionManager.close();
  }, 30000); // Increase timeout to 30 seconds

  it('should load vertices with various property types', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true
    });

    // Load only the vertices
    const result = await batchLoader.loadGraphData({
      vertices: testGraphData.vertices,
      edges: {}
    });

    // Verify that the vertices were loaded
    expect(result.vertexCount).toBeGreaterThan(0);

    // Verify that the vertices exist in the graph
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (v)
        RETURN labels(v) AS label, v.id AS id, v.name AS name,
               v.age AS age, v.active AS active, v.tags AS tags,
               v.metadata AS metadata
        ORDER BY v.id
      $$) AS (label agtype, id agtype, name agtype, age agtype,
              active agtype, tags agtype, metadata agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // Check that we have the expected number of vertices
    expect(verifyResult.rows.length).toBe(3);

    // Check that the vertices have the expected properties
    const person1 = verifyResult.rows[0];
    expect(person1.label.toString()).toContain('Person');
    expect(person1.id.toString()).toBe('"1"');
    expect(person1.name.toString()).toBe('"Alice"');
    expect(person1.age.toString()).toBe('30');
    expect(person1.active.toString()).toBe('true');
    expect(JSON.parse(person1.tags.toString())).toEqual(['developer', 'manager']);
    expect(JSON.parse(person1.metadata.toString())).toEqual({ department: 'Engineering', level: 'Senior' });

    const person2 = verifyResult.rows[1];
    expect(person2.label.toString()).toContain('Person');
    expect(person2.id.toString()).toBe('"2"');
    expect(person2.name.toString()).toBe('"Bob"');
    expect(person2.age.toString()).toBe('25');
    expect(person2.active.toString()).toBe('true');
    expect(JSON.parse(person2.tags.toString())).toEqual(['developer']);
    expect(JSON.parse(person2.metadata.toString())).toEqual({ department: 'Engineering', level: 'Junior' });

    const company = verifyResult.rows[2];
    expect(company.label.toString()).toContain('Company');
    expect(company.id.toString()).toBe('"3"');
    expect(company.name.toString()).toBe('"Acme Inc."');
  });

  it('should handle empty vertex lists gracefully', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true
    });

    // Load empty vertex lists
    const result = await batchLoader.loadGraphData({
      vertices: {
        Person: [],
        Company: [],
        NonExistentType: [] // This should be ignored
      },
      edges: {}
    });

    // Verify that no vertices were loaded
    expect(result.vertexCount).toBe(0);

    // Verify that no new vertices were created
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (v)
        RETURN count(v) AS vertex_count
      $$) AS (vertex_count agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // The count should be the same as before (3 from the previous test)
    expect(parseInt(verifyResult.rows[0].vertex_count.toString())).toBe(3);
  });

  it('should report progress during vertex loading', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true,
      defaultBatchSize: 1 // Set batch size to 1 to test progress reporting
    });

    // Create a progress callback
    const progressUpdates: any[] = [];
    const onProgress = (progress: any) => {
      progressUpdates.push({ ...progress });
    };

    // Load vertices with progress reporting
    await batchLoader.loadGraphData({
      vertices: {
        Person: [
          { id: '4', name: 'Charlie', age: 35 },
          { id: '5', name: 'Diana', age: 28 }
        ]
      },
      edges: {}
    }, { onProgress });

    // Verify that progress was reported
    expect(progressUpdates.length).toBeGreaterThan(0);

    // Verify that progress updates have the expected format
    const personUpdates = progressUpdates.filter(p => p.phase === 'vertices' && p.type === 'Person');
    expect(personUpdates.length).toBeGreaterThan(0);

    // Check the first update
    const firstUpdate = personUpdates[0];
    expect(firstUpdate.phase).toBe('vertices');
    expect(firstUpdate.type).toBe('Person');
    expect(firstUpdate.processed).toBeGreaterThan(0);
    expect(firstUpdate.total).toBe(2);
    expect(firstUpdate.percentage).toBeGreaterThan(0);

    // If we have multiple updates, check that the last one shows 100%
    if (personUpdates.length > 1) {
      const lastUpdate = personUpdates[personUpdates.length - 1];
      expect(lastUpdate.percentage).toBe(100);
      expect(lastUpdate.processed).toBe(2);
    }
  });
});
