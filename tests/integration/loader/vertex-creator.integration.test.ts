/**
 * Integration tests for the VertexCreator class
 *
 * These tests verify that the VertexCreator correctly creates vertices in bulk
 * using the temp table approach.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';
import { VertexCreator } from '../../../src/loader/vertex-creator';
import { SchemaDefinition } from '../../../src/schema/types';
import { PropertyType } from '../../../src/schema/types';
import { ValidationError } from '../../../src/core/errors';

// Graph name for the vertex creator tests
const VERTEX_CREATOR_TEST_GRAPH = 'vertex_creator_test_graph';

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
    }
  }
};

describe('VertexCreator Integration Tests', () => {
  let ageAvailable = false;
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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${VERTEX_CREATOR_TEST_GRAPH}', true)`);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    // Create the test graph
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${VERTEX_CREATOR_TEST_GRAPH}')`);

    // Create a vertex creator
    vertexCreator = new VertexCreator(testSchema, queryExecutor, VERTEX_CREATOR_TEST_GRAPH);

    // Create the get_person_vertices function
    await queryExecutor.executeSQL(`
      -- Function to retrieve Person vertex data from the age_params table
      CREATE OR REPLACE FUNCTION age_schema_client.get_person_vertices()
      RETURNS SETOF ag_catalog.agtype AS $$
      DECLARE
        result_array JSONB;
        vertex_data JSONB;
      BEGIN
        -- Get the data for Person vertices
        SELECT value
        INTO result_array
        FROM age_params
        WHERE key = 'vertex_Person';

        -- Return empty set if no data found
        IF result_array IS NULL THEN
          RETURN;
        END IF;

        -- Loop through the array and return each element
        FOR vertex_data IN SELECT * FROM jsonb_array_elements(result_array)
        LOOP
          RETURN NEXT vertex_data::text::ag_catalog.agtype;
        END LOOP;

        RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create the get_department_vertices function
    await queryExecutor.executeSQL(`
      -- Function to retrieve Department vertex data from the age_params table
      CREATE OR REPLACE FUNCTION age_schema_client.get_department_vertices()
      RETURNS SETOF ag_catalog.agtype AS $$
      DECLARE
        result_array JSONB;
        vertex_data JSONB;
      BEGIN
        -- Get the data for Department vertices
        SELECT value
        INTO result_array
        FROM age_params
        WHERE key = 'vertex_Department';

        -- Return empty set if no data found
        IF result_array IS NULL THEN
          RETURN;
        END IF;

        -- Loop through the array and return each element
        FOR vertex_data IN SELECT * FROM jsonb_array_elements(result_array)
        LOOP
          RETURN NEXT vertex_data::text::ag_catalog.agtype;
        END LOOP;

        RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${VERTEX_CREATOR_TEST_GRAPH}', true)`);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }
  });

  // Test: Create vertices for a specific vertex type
  it('should create vertices for a specific vertex type', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data
    const personData = [
      { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
      { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' }
    ];

    // Create vertices
    const result = await vertexCreator.createVertices('Person', personData);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.errors).toBe(0);

    // Verify the vertices were created in the graph
    const queryResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.id AS id, p.name AS name, p.age AS age, p.email AS email
      ORDER BY p.id
    `, {}, VERTEX_CREATOR_TEST_GRAPH);

    expect(queryResult.rows).toHaveLength(2);

    // Parse the JSON strings if needed
    const parsedRows = queryResult.rows.map(row => ({
      id: typeof row.id === 'string' ? JSON.parse(row.id) : row.id,
      name: typeof row.name === 'string' ? JSON.parse(row.name) : row.name,
      age: typeof row.age === 'string' ? JSON.parse(row.age) : row.age,
      email: typeof row.email === 'string' ? JSON.parse(row.email) : row.email
    }));

    expect(parsedRows[0].id).toBe('1');
    expect(parsedRows[0].name).toBe('Alice');
    expect(parsedRows[0].age).toBe(30);
    expect(parsedRows[0].email).toBe('alice@example.com');
    expect(parsedRows[1].id).toBe('2');
    expect(parsedRows[1].name).toBe('Bob');
    expect(parsedRows[1].age).toBe(25);
    expect(parsedRows[1].email).toBe('bob@example.com');
  });

  // Test: Create vertices with validation errors
  it('should handle validation errors when creating vertices', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data with validation errors
    const personData = [
      { id: '3', name: 'Charlie', age: -5, email: 'not-an-email' }, // Invalid age and email
      { id: '4', name: 'Dave', age: 40, email: 'dave@example.com' } // Valid
    ];

    // Create vertices with validation but don't throw on errors
    const result = await vertexCreator.createVertices('Person', personData, {
      validateData: true,
      throwOnValidationError: false
    });

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(2); // Both vertices are created despite validation errors
    expect(result.errors).toBeGreaterThan(0);
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.length).toBeGreaterThan(0);

    // Verify that throwing on validation errors works
    await expect(
      vertexCreator.createVertices('Person', personData, {
        validateData: true,
        throwOnValidationError: true
      })
    ).rejects.toThrow(ValidationError);
  });

  // Test: Create vertices for multiple vertex types
  it('should create vertices for multiple vertex types', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data for multiple types
    const vertexData = {
      Person: [
        { id: '5', name: 'Eve', age: 35, email: 'eve@example.com' },
        { id: '6', name: 'Frank', age: 45, email: 'frank@example.com' }
      ],
      Department: [
        { id: '1', name: 'Engineering', budget: 1000000 },
        { id: '2', name: 'Marketing', budget: 500000 }
      ]
    };

    // Create vertices for all types
    const result = await vertexCreator.createAllVertices(vertexData);

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(4);
    expect(result.errors).toBe(0);

    // Verify the Person vertices were created
    const personResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      WHERE p.id IN ['5', '6']
      RETURN p.id AS id, p.name AS name
      ORDER BY p.id
    `, {}, VERTEX_CREATOR_TEST_GRAPH);

    expect(personResult.rows).toHaveLength(2);

    // Verify the Department vertices were created
    const departmentResult = await queryExecutor.executeCypher(`
      MATCH (d:Department)
      RETURN d.id AS id, d.name AS name, d.budget AS budget
      ORDER BY d.id
    `, {}, VERTEX_CREATOR_TEST_GRAPH);

    expect(departmentResult.rows).toHaveLength(2);
  });

  // Test: Progress reporting
  it('should report progress when creating vertices', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data
    const personData = [
      { id: '7', name: 'Grace', age: 50, email: 'grace@example.com' },
      { id: '8', name: 'Hank', age: 55, email: 'hank@example.com' }
    ];

    // Create a progress callback
    const progressCallbacks: any[] = [];
    const progressCallback = (
      vertexType: string,
      created: number,
      total: number,
      message?: string
    ) => {
      progressCallbacks.push({ vertexType, created, total, message });
    };

    // Create vertices with progress reporting
    const result = await vertexCreator.createVertices('Person', personData, {
      progressCallback
    });

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.errors).toBe(0);

    // Verify the progress callbacks
    expect(progressCallbacks).toHaveLength(1);
    expect(progressCallbacks[0].vertexType).toBe('Person');
    expect(progressCallbacks[0].created).toBe(2);
    expect(progressCallbacks[0].total).toBe(2);
    expect(progressCallbacks[0].message).toContain('Created 2 vertices of type Person');
  });
});
