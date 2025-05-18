/**
 * Integration tests for the EdgeCreator class
 *
 * These tests verify that the EdgeCreator correctly creates edges in bulk
 * using direct Cypher queries.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';
import { EdgeCreator } from '../../../src/loader/edge-creator';
import { VertexCreator } from '../../../src/loader/vertex-creator';
import { SchemaDefinition } from '../../../src/schema/types';
import { PropertyType } from '../../../src/schema/types';
import { ValidationError } from '../../../src/core/errors';

// Graph name for the edge creator tests
const EDGE_CREATOR_TEST_GRAPH = 'edge_creator_test_graph';

// Define a test schema for validation
const testSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER, minimum: 0, maximum: 120 },
        email: { type: PropertyType.STRING, format: 'email' }
      },
      required: ['id', 'name']
    },
    Department: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        budget: { type: PropertyType.NUMBER, minimum: 0 }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    WORKS_IN: {
      properties: {
        since: { type: PropertyType.NUMBER, minimum: 1900, maximum: 2100 },
        role: { type: PropertyType.STRING }
      },
      fromVertex: 'Person',
      toVertex: 'Department',
      required: ['since']
    },
    MANAGES: {
      properties: {
        since: { type: PropertyType.NUMBER, minimum: 1900, maximum: 2100 }
      },
      fromVertex: 'Person',
      toVertex: 'Person',
      required: ['since']
    }
  }
};

describe('EdgeCreator Integration Tests', () => {
  let ageAvailable = false;
  let edgeCreator: EdgeCreator<typeof testSchema>;
  let vertexCreator: VertexCreator<typeof testSchema>;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${EDGE_CREATOR_TEST_GRAPH}', true)`);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    // Create the test graph
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${EDGE_CREATOR_TEST_GRAPH}')`);

    // Create an edge creator
    edgeCreator = new EdgeCreator(testSchema, queryExecutor, EDGE_CREATOR_TEST_GRAPH);

    // Create a vertex creator for setting up test data
    vertexCreator = new VertexCreator(testSchema, queryExecutor, EDGE_CREATOR_TEST_GRAPH);

    // Create test vertices
    const personData = [
      { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
      { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' },
      { id: '3', name: 'Charlie', age: 35, email: 'charlie@example.com' },
      { id: '4', name: 'Dave', age: 40, email: 'dave@example.com' }
    ];

    const departmentData = [
      { id: '1', name: 'Engineering', budget: 1000000 },
      { id: '2', name: 'Marketing', budget: 500000 }
    ];

    // Create vertices for testing
    await vertexCreator.createVertices('Person', personData);
    await vertexCreator.createVertices('Department', departmentData);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${EDGE_CREATOR_TEST_GRAPH}', true)`);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }
  });

  // Test: Create edges for a specific edge type
  it('should create edges for a specific edge type', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test edge data
    const worksInData = [
      { from: '1', to: '1', since: 2020, role: 'Developer' },
      { from: '2', to: '1', since: 2019, role: 'Designer' }
    ];

    // Create edges
    const result = await edgeCreator.createEdges('WORKS_IN', worksInData);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.errors).toBe(0);

    // Verify the edges were created in the graph
    const queryResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[r:WORKS_IN]->(d:Department)
      RETURN p.id AS personId, d.id AS departmentId, r.since AS since, r.role AS role
      ORDER BY p.id
    `, {}, EDGE_CREATOR_TEST_GRAPH);

    expect(queryResult.rows).toHaveLength(2);

    // Log the actual results for debugging
    console.log('Query result rows:', JSON.stringify(queryResult.rows, null, 2));

    // Verify that we have the expected number of rows
    expect(queryResult.rows.length).toBe(2);

    // Verify that the first row has the expected properties
    expect(queryResult.rows[0]).toBeDefined();
    expect(queryResult.rows[0].personid).toBeDefined();
    expect(queryResult.rows[0].departmentid).toBeDefined();
    expect(queryResult.rows[0].since).toBeDefined();
    expect(queryResult.rows[0].role).toBeDefined();

    // Verify that the second row has the expected properties
    expect(queryResult.rows[1]).toBeDefined();
    expect(queryResult.rows[1].personid).toBeDefined();
    expect(queryResult.rows[1].departmentid).toBeDefined();
    expect(queryResult.rows[1].since).toBeDefined();
    expect(queryResult.rows[1].role).toBeDefined();
  });

  // Test: Create edges with validation errors
  it('should handle validation errors when creating edges', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test edge data with validation errors
    const worksInData = [
      { from: '3', to: '2', since: 2200, role: 'Manager' }, // Invalid since (above max of 2100)
      { from: '4', to: '2', since: 2020, role: 'Analyst' } // Valid
    ];

    // Create edges with validation but don't throw on errors
    const result = await edgeCreator.createEdges('WORKS_IN', worksInData, {
      validateData: true,
      throwOnValidationError: false
    });

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(2); // Both edges are created despite validation errors
    expect(result.errors).toBeGreaterThan(0);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.length).toBeGreaterThan(0);

    // Verify that throwing on validation errors works
    await expect(
      edgeCreator.createEdges('WORKS_IN', worksInData, {
        validateData: true,
        throwOnValidationError: true
      })
    ).rejects.toThrow(ValidationError);
  });

  // Test: Create edges for multiple edge types
  it('should create edges for multiple edge types', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test edge data for multiple types
    const edgeData = {
      WORKS_IN: [
        { from: '3', to: '1', since: 2018, role: 'Manager' }
      ],
      MANAGES: [
        { from: '3', to: '1', since: 2019 },
        { from: '3', to: '2', since: 2020 }
      ]
    };

    // Create edges for all types
    const result = await edgeCreator.createAllEdges(edgeData);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(3);
    expect(result.errors).toBe(0);

    // Verify the WORKS_IN edges were created
    const worksInResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[r:WORKS_IN]->(d:Department)
      WHERE p.id = '3'
      RETURN p.id AS personId, d.id AS departmentId, r.since AS since
    `, {}, EDGE_CREATOR_TEST_GRAPH);

    // Log the actual results for debugging
    console.log('WORKS_IN result rows:', JSON.stringify(worksInResult.rows, null, 2));

    // We expect at least one row, but there might be more from previous tests
    expect(worksInResult.rows.length).toBeGreaterThan(0);

    // Verify the MANAGES edges were created
    const managesResult = await queryExecutor.executeCypher(`
      MATCH (m:Person)-[r:MANAGES]->(p:Person)
      WHERE m.id = '3'
      RETURN m.id AS managerId, p.id AS personId, r.since AS since
      ORDER BY p.id
    `, {}, EDGE_CREATOR_TEST_GRAPH);

    expect(managesResult.rows).toHaveLength(2);
  });

  // Test: Progress reporting
  it('should report progress when creating edges', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test edge data
    const managesData = [
      { from: '4', to: '3', since: 2021 }
    ];

    // Create a progress callback
    const progressCallbacks: any[] = [];
    const progressCallback = (
      edgeType: string,
      created: number,
      total: number,
      message?: string
    ) => {
      progressCallbacks.push({ edgeType, created, total, message });
    };

    // Create edges with progress reporting
    const result = await edgeCreator.createEdges('MANAGES', managesData, {
      progressCallback
    });

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.errors).toBe(0);

    // Verify the progress callbacks
    expect(progressCallbacks).toHaveLength(1);
    expect(progressCallbacks[0].edgeType).toBe('MANAGES');
    expect(progressCallbacks[0].created).toBe(1);
    expect(progressCallbacks[0].total).toBe(1);
    expect(progressCallbacks[0].message).toContain('Created 1 edges of type MANAGES');
  });
});
