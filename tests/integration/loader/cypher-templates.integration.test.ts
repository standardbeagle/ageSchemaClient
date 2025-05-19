/**
 * Integration tests for Cypher query templates
 *
 * These tests verify that the Cypher query templates work correctly with
 * the PostgreSQL functions for batch loading data into Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createParameterizedVertexTemplate,
  createParameterizedEdgeTemplate
} from '../../../src/loader/cypher-templates';
import { CypherQueryGenerator } from '../../../src/loader/cypher-query-generator';
import { SchemaDefinition } from '../../../src/schema/types';
import {
  queryExecutor,
  isAgeAvailable
} from '../../setup/integration';

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

// Test data
const testData = {
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

describe('Cypher Query Templates Integration Tests', () => {
  let ageAvailable = false;
  let graphName: string;

  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Create a unique graph name for this test run
    graphName = `test_cypher_templates_${Date.now()}`;

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
  }, 30000); // Increase timeout to 30 seconds

  it('should load vertex data using the templates', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Insert test data into the age_params table
    await queryExecutor.executeSQL(`
      INSERT INTO age_schema_client.age_params (key, value)
      VALUES
        ('vertex_Person', '${JSON.stringify(testData.vertices.Person)}'::jsonb),
        ('vertex_Company', '${JSON.stringify(testData.vertices.Company)}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `);

    // Create a CypherQueryGenerator
    const generator = new CypherQueryGenerator(testSchema);

    // Generate and execute the query for Person vertices
    const personQuery = generator.generateCreateVerticesQuery('Person', graphName);
    const personResult = await queryExecutor.executeSQL(personQuery);

    // Generate and execute the query for Company vertices
    const companyQuery = generator.generateCreateVerticesQuery('Company', graphName);
    const companyResult = await queryExecutor.executeSQL(companyQuery);

    // Verify that the vertices were created
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (v)
        RETURN labels(v) AS label, v.id AS id, v.name AS name
        ORDER BY v.id
      $$) AS (label agtype, id agtype, name agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // Check that we have the expected number of vertices
    expect(verifyResult.rows.length).toBe(3);

    // Check that the vertices have the expected properties
    expect(verifyResult.rows[0].label.toString()).toContain('Person');
    expect(verifyResult.rows[0].id.toString()).toBe('"1"');
    expect(verifyResult.rows[0].name.toString()).toBe('"Alice"');

    expect(verifyResult.rows[1].label.toString()).toContain('Person');
    expect(verifyResult.rows[1].id.toString()).toBe('"2"');
    expect(verifyResult.rows[1].name.toString()).toBe('"Bob"');

    expect(verifyResult.rows[2].label.toString()).toContain('Company');
    expect(verifyResult.rows[2].id.toString()).toBe('"3"');
    expect(verifyResult.rows[2].name.toString()).toBe('"Acme Inc."');
  });

  it('should load edge data using the templates', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Insert test data into the age_params table
    await queryExecutor.executeSQL(`
      INSERT INTO age_schema_client.age_params (key, value)
      VALUES
        ('edge_WORKS_AT', '${JSON.stringify(testData.edges.WORKS_AT)}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `);

    // Create a CypherQueryGenerator
    const generator = new CypherQueryGenerator(testSchema);

    // Generate and execute the query for WORKS_AT edges
    const edgeQuery = generator.generateCreateEdgesQuery('WORKS_AT', graphName);
    const edgeResult = await queryExecutor.executeSQL(edgeQuery);

    // Verify that the edges were created
    const verifyQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (p)-[r:WORKS_AT]->(c)
        RETURN p.id AS person_id, c.id AS company_id, r.since AS since, r.position AS position
        ORDER BY p.id
      $$) AS (person_id agtype, company_id agtype, since agtype, position agtype);
    `;

    const verifyResult = await queryExecutor.executeSQL(verifyQuery);

    // Check that we have the expected number of edges
    expect(verifyResult.rows.length).toBe(2);

    // Check that the edges have the expected properties
    expect(verifyResult.rows[0].person_id.toString()).toBe('"1"');
    expect(verifyResult.rows[0].company_id.toString()).toBe('"3"');
    expect(verifyResult.rows[0].since.toString()).toBe('2015');
    expect(verifyResult.rows[0].position.toString()).toBe('"Manager"');

    expect(verifyResult.rows[1].person_id.toString()).toBe('"2"');
    expect(verifyResult.rows[1].company_id.toString()).toBe('"3"');
    expect(verifyResult.rows[1].since.toString()).toBe('2018');
    expect(verifyResult.rows[1].position.toString()).toBe('"Developer"');
  });
});
