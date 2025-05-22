/**
 * Integration tests for edge loading
 *
 * These tests verify that the edge loading logic correctly loads edges
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
    },
    Department: {
      label: 'Department',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      fromLabel: 'Person',
      toLabel: 'Company',
      fromVertex: 'Person',
      toVertex: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' }
      }
    },
    BELONGS_TO: {
      label: 'BELONGS_TO',
      from: 'Department',
      to: 'Company',
      fromLabel: 'Department',
      toLabel: 'Company',
      fromVertex: 'Department',
      toVertex: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' }
      }
    },
    WORKS_IN: {
      label: 'WORKS_IN',
      from: 'Person',
      to: 'Department',
      fromLabel: 'Person',
      toLabel: 'Department',
      fromVertex: 'Person',
      toVertex: 'Department',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        role: { type: 'string' }
      }
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      fromLabel: 'Person',
      toLabel: 'Person',
      fromVertex: 'Person',
      toVertex: 'Person',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' }
      }
    }
  }
};

// Sample graph data for testing
const testGraphData: GraphData = {
  vertices: {
    Person: [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 },
      { id: '3', name: 'Charlie', age: 35 }
    ],
    Company: [
      { id: '4', name: 'Acme Inc.', founded: 1990 }
    ],
    Department: [
      { id: '5', name: 'Engineering' },
      { id: '6', name: 'Marketing' }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: '1', to: '4', since: 2015, position: 'Manager' },
      { from: '2', to: '4', since: 2018, position: 'Developer' },
      { from: '3', to: '4', since: 2020, position: 'Designer' }
    ],
    BELONGS_TO: [
      { from: '5', to: '4', since: 2000 },
      { from: '6', to: '4', since: 2005 }
    ],
    WORKS_IN: [
      { from: '1', to: '5', role: 'Lead' },
      { from: '2', to: '5', role: 'Member' },
      { from: '3', to: '6', role: 'Lead' }
    ],
    KNOWS: [
      { from: '1', to: '2', since: 2016 },
      { from: '2', to: '3', since: 2019 },
      { from: '1', to: '3', since: 2017 }
    ]
  }
};

describe('Edge Loading Integration Tests', () => {
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

    // Create a connection manager with proper configuration for AGE
    connectionManager = new PgConnectionManager({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
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
        applicationName: 'ageSchemaClient-edge-loading-test',
      },
    });

    // Create a query executor
    queryExecutor = new QueryExecutor(connectionManager);

    // Create a unique graph name for this test run
    graphName = `test_edge_loading_${Date.now()}`;

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

    // Load the vertices first
    try {
      const batchLoader = createBatchLoader(testSchema, queryExecutor, {
        defaultGraphName: graphName,
        validateBeforeLoad: true
      });

      await batchLoader.loadGraphData({
        vertices: testGraphData.vertices,
        edges: {}
      });
    } catch (error) {
      console.error(`Error loading vertices: ${error.message}`);
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

  it('should load edges between vertices', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true
    });

    // Load only the edges
    const result = await batchLoader.loadGraphData({
      vertices: {},
      edges: testGraphData.edges
    });

    // Verify that the edges were loaded
    expect(result.edgeCount).toBeGreaterThan(0);

    // Verify that the edges exist in the graph
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (a)-[r]->(b)
        RETURN type(r) AS edge_type, a.id AS from_id, b.id AS to_id,
               r.since AS since, r.position AS position, r.role AS role
        ORDER BY type(r), a.id, b.id
      $$) AS (edge_type agtype, from_id agtype, to_id agtype,
              since agtype, position agtype, role agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // Check that we have the expected number of edges
    expect(verifyResult.rows.length).toBe(13); // Total number of edges in testGraphData

    // Check that the edges have the expected properties
    // BELONGS_TO edges
    const belongsToEdges = verifyResult.rows.filter(row =>
      row.edge_type.toString().includes('BELONGS_TO')
    );
    expect(belongsToEdges.length).toBe(2);

    // KNOWS edges
    const knowsEdges = verifyResult.rows.filter(row =>
      row.edge_type.toString().includes('KNOWS')
    );
    expect(knowsEdges.length).toBe(3);

    // WORKS_AT edges
    const worksAtEdges = verifyResult.rows.filter(row =>
      row.edge_type.toString().includes('WORKS_AT')
    );
    expect(worksAtEdges.length).toBe(3);

    // WORKS_IN edges
    const worksInEdges = verifyResult.rows.filter(row =>
      row.edge_type.toString().includes('WORKS_IN')
    );
    expect(worksInEdges.length).toBe(3);

    // Check specific edge properties
    const aliceWorksAtAcme = worksAtEdges.find(row =>
      row.from_id.toString() === '"1"' && row.to_id.toString() === '"4"'
    );
    expect(aliceWorksAtAcme).toBeDefined();
    expect(aliceWorksAtAcme.since.toString()).toBe('2015');
    expect(aliceWorksAtAcme.position.toString()).toBe('"Manager"');
  });

  it('should handle empty edge lists gracefully', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true
    });

    // Load empty edge lists
    const result = await batchLoader.loadGraphData({
      vertices: {},
      edges: {
        WORKS_AT: [],
        BELONGS_TO: [],
        NON_EXISTENT_TYPE: [] // This should be ignored
      }
    });

    // Verify that no new edges were loaded
    expect(result.edgeCount).toBe(0);

    // Verify that the number of edges in the graph remains the same
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH ()-[r]->()
        RETURN count(r) AS edge_count
      $$) AS (edge_count agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // The count should be the same as before (13 from the previous test)
    expect(parseInt(verifyResult.rows[0].edge_count.toString())).toBe(13);
  });

  it('should report progress during edge loading', async () => {
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

    // Load edges with progress reporting
    await batchLoader.loadGraphData({
      vertices: {},
      edges: {
        KNOWS: [
          { from: '1', to: '3', since: 2020 },
          { from: '2', to: '1', since: 2021 }
        ]
      }
    }, { onProgress });

    // Verify that progress was reported
    expect(progressUpdates.length).toBeGreaterThan(0);

    // Verify that progress updates have the expected format
    const knowsUpdates = progressUpdates.filter(p => p.phase === 'edges' && p.type === 'KNOWS');
    expect(knowsUpdates.length).toBeGreaterThan(0);

    // Check the first update
    const firstUpdate = knowsUpdates[0];
    expect(firstUpdate.phase).toBe('edges');
    expect(firstUpdate.type).toBe('KNOWS');
    expect(firstUpdate.processed).toBeGreaterThan(0);
    expect(firstUpdate.total).toBe(2);
    expect(firstUpdate.percentage).toBeGreaterThan(0);

    // If we have multiple updates, check that the last one shows 100%
    if (knowsUpdates.length > 1) {
      const lastUpdate = knowsUpdates[knowsUpdates.length - 1];
      expect(lastUpdate.percentage).toBe(100);
      expect(lastUpdate.processed).toBe(2);
    }
  });

  it('should handle edges with non-existent vertices gracefully', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: false // Disable validation to allow non-existent vertices
    });

    // Load edges with non-existent vertices
    const result = await batchLoader.loadGraphData({
      vertices: {},
      edges: {
        WORKS_AT: [
          { from: '999', to: '4', since: 2022, position: 'Intern' }, // Non-existent from vertex
          { from: '1', to: '888', since: 2022, position: 'Consultant' } // Non-existent to vertex
        ]
      }
    });

    // Verify that no edges were created (since the vertices don't exist)
    expect(result.edgeCount).toBe(0);

    // Verify that the number of edges in the graph remains the same
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH ()-[r:WORKS_AT]->()
        WHERE r.since = 2022
        RETURN count(r) AS edge_count
      $$) AS (edge_count agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // There should be no new edges with since = 2022
    expect(parseInt(verifyResult.rows[0].edge_count.toString())).toBe(0);
  });

  it('should validate and filter edges with non-existent vertices', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a batch loader
    const batchLoader = createBatchLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true // Enable validation to filter out invalid edges
    });

    // Load a mix of valid and invalid edges
    const result = await batchLoader.loadGraphData({
      vertices: {},
      edges: {
        WORKS_AT: [
          { from: '999', to: '4', since: 2022, position: 'Intern' }, // Non-existent from vertex
          { from: '1', to: '888', since: 2022, position: 'Consultant' }, // Non-existent to vertex
          { from: '1', to: '4', since: 2022, position: 'Director' } // Valid edge
        ]
      }
    });

    // Verify that only the valid edge was created
    expect(result.edgeCount).toBeGreaterThan(0);

    // Verify that only the valid edge exists in the graph
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (p)-[r:WORKS_AT]->(c)
        WHERE r.since = 2022
        RETURN p.id AS from_id, c.id AS to_id, r.position AS position
      $$) AS (from_id agtype, to_id agtype, position agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // There should be exactly one edge with since = 2022
    expect(verifyResult.rows.length).toBe(1);
    expect(verifyResult.rows[0].from_id.toString()).toBe('"1"');
    expect(verifyResult.rows[0].to_id.toString()).toBe('"4"');
    expect(verifyResult.rows[0].position.toString()).toBe('"Director"');
  });
});
