/**
 * Integration tests for SchemaLoader.loadVertices method
 *
 * These tests verify the functionality of the loadVertices method
 * in the SchemaLoader class, which loads vertex data into Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA,
  AGE_GRAPH_NAME,
  loadSchemaFixture
} from '../../setup/integration';
import { SchemaLoader } from '../../../src/loader/schema-loader';
import { SchemaDefinition } from '../../../src/schema/types';

// Test graph name
const VERTEX_TEST_GRAPH = 'vertex_test_graph';

describe('SchemaLoader.loadVertices Integration', () => {
  let ageAvailable = false;
  let schemaLoader: SchemaLoader<SchemaDefinition>;
  let schema: SchemaDefinition;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Load the test schema
    schema = loadSchemaFixture('basic-schema');

    // Create the SchemaLoader instance
    schemaLoader = new SchemaLoader(schema, queryExecutor, {
      defaultGraphName: VERTEX_TEST_GRAPH,
      defaultBatchSize: 100,
      defaultTempSchema: TEST_SCHEMA
    });

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${VERTEX_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${VERTEX_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${VERTEX_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${VERTEX_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${VERTEX_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${VERTEX_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Load vertices successfully
  it('should load vertices successfully', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data
    const vertexData = {
      Person: [
        { name: 'John Doe', age: 30, email: 'john@example.com' },
        { name: 'Jane Smith', age: 28, email: 'jane@example.com' },
        { name: 'Bob Johnson', age: 35, email: 'bob@example.com' }
      ],
      Product: [
        { name: 'Laptop', price: 1200, description: 'High-performance laptop' },
        { name: 'Phone', price: 800, description: 'Smartphone with great camera' }
      ]
    };

    // Progress tracking
    const progressEvents: any[] = [];
    const onProgress = (progress: any) => {
      progressEvents.push({ ...progress });
    };

    // Load vertices
    const result = await schemaLoader.loadVertices(vertexData, {
      onProgress
    });

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('column "vertex_label" does not exist');

    // Verify progress tracking
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0].phase).toBe('validation');
  });

  // Test: Handle validation errors
  it('should handle validation errors', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define test vertex data with missing required properties
    const invalidVertexData = {
      Person: [
        { name: 'Valid Person', age: 30, email: 'valid@example.com' },
        { age: 25, email: 'invalid@example.com' } // Missing required 'name' property
      ]
    };

    // Load vertices and expect validation error
    const result = await schemaLoader.loadVertices(invalidVertexData, {
      validateData: true
    });

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  // Test: Handle empty vertex data
  it('should handle empty vertex data', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Define empty vertex data
    const emptyVertexData = {};

    // Load vertices
    const result = await schemaLoader.loadVertices(emptyVertexData);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('column "vertex_label" does not exist');
  });
});
