/**
 * Integration tests for vertex and edge operations in ageSchemaClient
 *
 * These tests verify that the VertexOperations and EdgeOperations classes
 * can properly create, read, update, and delete vertices and edges in a
 * PostgreSQL database with Apache AGE extension.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';
import { VertexOperations, EdgeOperations } from '../../src/db';
import { SQLGenerator } from '../../src/sql/generator';

// Graph name for the vertex and edge tests
const VERTEX_EDGE_TEST_GRAPH = 'vertex_edge_test_graph';

// Import schema types
import { SchemaDefinition, PropertyType } from '../../src/schema/types';

// Define a simple schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      properties: {
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER }
      },
      required: ['name']
    },
    Company: {
      properties: {
        name: { type: PropertyType.STRING },
        founded: { type: PropertyType.NUMBER }
      },
      required: ['name']
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: PropertyType.NUMBER }
      },
      fromVertex: 'Person',
      toVertex: 'Person'
    },
    WORKS_AT: {
      properties: {
        role: { type: PropertyType.STRING },
        since: { type: PropertyType.NUMBER }
      },
      fromVertex: 'Person',
      toVertex: 'Company'
    }
  },
  version: '1.0.0'
};

describe('Vertex and Edge Operations Integration', () => {
  let ageAvailable = false;
  let vertexOperations: VertexOperations<typeof testSchema>;
  let edgeOperations: EdgeOperations<typeof testSchema>;
  let sqlGenerator: SQLGenerator;

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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${VERTEX_EDGE_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${VERTEX_EDGE_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${VERTEX_EDGE_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${VERTEX_EDGE_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
      return;
    }

    // Create SQL generator and operations
    sqlGenerator = new SQLGenerator(testSchema);
    vertexOperations = new VertexOperations(testSchema, queryExecutor, sqlGenerator, 'vertex_edge_test_graph');
    edgeOperations = new EdgeOperations(testSchema, queryExecutor, sqlGenerator, 'vertex_edge_test_graph');
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${VERTEX_EDGE_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${VERTEX_EDGE_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Create a vertex
  it('should create a vertex', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a vertex
    const vertex = await vertexOperations.createVertex(
      'Person',
      { name: 'Alice', age: 30 },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Verify the vertex was created
    expect(vertex).toBeDefined();
    expect(vertex.label).toBe('Person');
    expect(vertex.properties.name).toBe('Alice');
    expect(vertex.properties.age).toBe(30);

    // Query the vertex
    const result = await queryExecutor.executeCypher(`
      MATCH (p:Person {name: 'Alice'})
      RETURN p.name AS name, p.age AS age
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Verify the result
    expect(result.rows).toHaveLength(1);

    // Helper function to parse AGE values
    const parseAgeValue = (value: any): any => {
      if (typeof value !== 'string') return value;

      try {
        // If it's a JSON string (starts with quote), parse it
        if (value.startsWith('"')) {
          return JSON.parse(value);
        }
        // If it's a number string, parse it as a number
        if (!isNaN(Number(value))) {
          return parseInt(value, 10);
        }
        return value;
      } catch (e) {
        return value;
      }
    };

    const name = parseAgeValue(result.rows[0].name);
    const age = parseAgeValue(result.rows[0].age);

    expect(name).toBe('Alice');
    expect(age).toBe(30);
  });

  // Test: Get a vertex
  it('should get a vertex', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a vertex
    await queryExecutor.executeCypher(`
      CREATE (p:Person {name: 'Bob', age: 40})
      RETURN p
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Get the vertex
    const vertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Bob' },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Verify the vertex
    expect(vertex).toBeDefined();
    expect(vertex.label).toBe('Person');
    expect(vertex.properties.name).toBe('Bob');
    expect(vertex.properties.age).toBe(40);
  });

  // Test: Update a vertex
  it('should update a vertex', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a vertex
    await queryExecutor.executeCypher(`
      CREATE (p:Person {name: 'Charlie', age: 25})
      RETURN p
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Update the vertex
    const updatedVertex = await vertexOperations.updateVertex(
      'Person',
      { name: 'Charlie' },
      { age: 26 },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Verify the vertex was updated
    expect(updatedVertex).toBeDefined();
    expect(updatedVertex.label).toBe('Person');
    expect(updatedVertex.properties.name).toBe('Charlie');
    expect(updatedVertex.properties.age).toBe(26);

    // Query the vertex
    const result = await queryExecutor.executeCypher(`
      MATCH (p:Person {name: 'Charlie'})
      RETURN p.name AS name, p.age AS age
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Verify the result
    expect(result.rows).toHaveLength(1);

    // Helper function to parse AGE values
    const parseAgeValue = (value: any): any => {
      if (typeof value !== 'string') return value;

      try {
        // If it's a JSON string (starts with quote), parse it
        if (value.startsWith('"')) {
          return JSON.parse(value);
        }
        // If it's a number string, parse it as a number
        if (!isNaN(Number(value))) {
          return parseInt(value, 10);
        }
        return value;
      } catch (e) {
        return value;
      }
    };

    const name = parseAgeValue(result.rows[0].name);
    const age = parseAgeValue(result.rows[0].age);

    expect(name).toBe('Charlie');
    expect(age).toBe(26);
  });

  // Test: Delete a vertex
  it('should delete a vertex', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a vertex
    await queryExecutor.executeCypher(`
      CREATE (p:Person {name: 'Dave', age: 35})
      RETURN p
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Delete the vertex
    await vertexOperations.deleteVertex(
      'Person',
      { name: 'Dave' },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Query the vertex
    const result = await queryExecutor.executeCypher(`
      MATCH (p:Person {name: 'Dave'})
      RETURN p
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Verify the vertex was deleted
    expect(result.rows).toHaveLength(0);
  });

  // Test: Create an edge
  it('should create an edge', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create vertices
    await queryExecutor.executeCypher(`
      CREATE (p1:Person {name: 'Eve', age: 28})
      CREATE (p2:Person {name: 'Frank', age: 32})
      RETURN p1, p2
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // First get the vertices to get their full information including labels
    const fromVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Eve' },
      VERTEX_EDGE_TEST_GRAPH
    );

    const toVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Frank' },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Create an edge using the full vertex objects
    const edge = await edgeOperations.createEdge(
      'KNOWS',
      fromVertex,
      toVertex,
      { since: 2020 },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Verify the edge was created
    expect(edge).toBeDefined();
    expect(edge.label).toBe('KNOWS');
    expect(edge.properties.since).toBe(2020);

    // Query the edge
    const result = await queryExecutor.executeCypher(`
      MATCH (p1:Person {name: 'Eve'})-[r:KNOWS]->(p2:Person {name: 'Frank'})
      RETURN r.since AS since
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(parseInt(result.rows[0].since, 10)).toBe(2020);
  });

  // Test: Get an edge
  it.skip('should get an edge', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create vertices and edge
    await queryExecutor.executeCypher(`
      CREATE (p1:Person {name: 'Grace', age: 29})
      CREATE (p2:Person {name: 'Hank', age: 33})
      CREATE (p1)-[r:KNOWS {since: 2019}]->(p2)
      RETURN p1, p2, r
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // First get the vertices to get their full information including labels
    const fromVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Grace' },
      VERTEX_EDGE_TEST_GRAPH
    );

    const toVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Hank' },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Get the edge using the full vertex objects
    const edge = await edgeOperations.getEdge(
      'KNOWS',
      fromVertex,
      toVertex,
      VERTEX_EDGE_TEST_GRAPH
    );

    // Verify the edge
    expect(edge).toBeDefined();
    expect(edge.label).toBe('KNOWS');
    expect(edge.properties.since).toBe(2019);
  });

  // Test: Update an edge
  it.skip('should update an edge', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create vertices and edge
    await queryExecutor.executeCypher(`
      CREATE (p1:Person {name: 'Ivy', age: 27})
      CREATE (p2:Person {name: 'Jack', age: 31})
      CREATE (p1)-[r:KNOWS {since: 2018}]->(p2)
      RETURN p1, p2, r
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // First get the vertices to get their full information including labels
    const fromVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Ivy' },
      VERTEX_EDGE_TEST_GRAPH
    );

    const toVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Jack' },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Update the edge using the full vertex objects
    const updatedEdge = await edgeOperations.updateEdge(
      'KNOWS',
      fromVertex,
      toVertex,
      { since: 2021 },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Verify the edge was updated
    expect(updatedEdge).toBeDefined();
    expect(updatedEdge.label).toBe('KNOWS');
    expect(updatedEdge.properties.since).toBe(2021);

    // Query the edge
    const result = await queryExecutor.executeCypher(`
      MATCH (p1:Person {name: 'Ivy'})-[r:KNOWS]->(p2:Person {name: 'Jack'})
      RETURN r.since AS since
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(parseInt(result.rows[0].since, 10)).toBe(2021);
  });

  // Test: Delete an edge
  it.skip('should delete an edge', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create vertices and edge
    await queryExecutor.executeCypher(`
      CREATE (p1:Person {name: 'Kelly', age: 26})
      CREATE (p2:Person {name: 'Liam', age: 30})
      CREATE (p1)-[r:KNOWS {since: 2017}]->(p2)
      RETURN p1, p2, r
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // First get the vertices to get their full information including labels
    const fromVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Kelly' },
      VERTEX_EDGE_TEST_GRAPH
    );

    const toVertex = await vertexOperations.getVertex(
      'Person',
      { name: 'Liam' },
      VERTEX_EDGE_TEST_GRAPH
    );

    // Delete the edge using the full vertex objects
    await edgeOperations.deleteEdge(
      'KNOWS',
      fromVertex,
      toVertex,
      VERTEX_EDGE_TEST_GRAPH
    );

    // Query the edge
    const result = await queryExecutor.executeCypher(`
      MATCH (p1:Person {name: 'Kelly'})-[r:KNOWS]->(p2:Person {name: 'Liam'})
      RETURN r
    `, {}, VERTEX_EDGE_TEST_GRAPH);

    // Verify the edge was deleted
    expect(result.rows).toHaveLength(0);
  });
});
