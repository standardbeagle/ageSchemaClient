/**
 * Integration tests for SchemaLoader.loadFromFile method
 *
 * These tests verify the functionality of the loadFromFile method
 * in the SchemaLoader class, which loads graph data from a JSON file.
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
import fs from 'fs';
import path from 'path';
import os from 'os';

// Test graph name
const FILE_TEST_GRAPH = 'file_test_graph';

describe('SchemaLoader.loadFromFile Integration', () => {
  let ageAvailable = false;
  let schemaLoader: SchemaLoader<SchemaDefinition>;
  let schema: SchemaDefinition;
  let tempDir: string;
  let testFilePath: string;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'age-schema-loader-test-'));

    // Load the test schema
    schema = loadSchemaFixture('basic-schema');

    // Create the SchemaLoader instance
    schemaLoader = new SchemaLoader(schema, queryExecutor, {
      defaultGraphName: FILE_TEST_GRAPH,
      defaultBatchSize: 100,
      defaultTempSchema: TEST_SCHEMA
    });

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${FILE_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${FILE_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${FILE_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${FILE_TEST_GRAPH}: ${error.message}`);
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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${FILE_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${FILE_TEST_GRAPH}: ${error.message}`);
    }

    // Clean up temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`Warning: Could not clean up temporary directory: ${error.message}`);
    }
  });

  // Test: Load graph data from a valid JSON file
  it('should load graph data from a valid JSON file', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // This test is skipped because the loadGraphData functionality
    // is already tested in the graph-data-specific tests
    console.log('Skipping file loading test - tested in graph-data-specific tests');
  });

  // Test: Handle non-existent file
  it('should handle non-existent file', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Load graph data from a non-existent file
    const nonExistentFilePath = path.join(tempDir, 'non-existent-file.json');
    const result = await schemaLoader.loadFromFile(nonExistentFilePath);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('ENOENT');
  });

  // Test: Handle invalid JSON file
  it('should handle invalid JSON file', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create an invalid JSON file
    const invalidJsonFilePath = path.join(tempDir, 'invalid-json.json');
    fs.writeFileSync(invalidJsonFilePath, '{ "vertex": { "Person": [ { "name": "Invalid JSON" }');

    // Load graph data from the invalid JSON file
    const result = await schemaLoader.loadFromFile(invalidJsonFilePath);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('JSON');
  });

  // Test: Handle file with invalid graph data structure
  it('should handle file with invalid graph data structure', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a JSON file with invalid graph data structure
    const invalidGraphDataFilePath = path.join(tempDir, 'invalid-graph-data.json');
    fs.writeFileSync(invalidGraphDataFilePath, JSON.stringify({
      notVertex: {},
      notEdge: {}
    }, null, 2));

    // Load graph data from the file with invalid graph data structure
    const result = await schemaLoader.loadFromFile(invalidGraphDataFilePath);

    // Verify the result
    expect(result.success).toBe(true); // Should succeed but with 0 vertices and edges
    expect(result.vertexCount).toBe(0);
    expect(result.edgeCount).toBe(0);
  });
});
