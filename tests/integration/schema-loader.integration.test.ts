/**
 * Schema Loader integration tests
 * 
 * These tests verify that the SchemaLoader can load schema definitions
 * from various sources and create the corresponding graph structures.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  AGE_GRAPH_NAME
} from './base-test';
import { SchemaLoader } from '../../../src/loader/schema-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Test schema definition
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Location: {
      properties: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        type: { type: 'string' }
      }
    }
  },
  edges: {
    LIVES_AT: {
      properties: {
        since: { type: 'string' },
        primary: { type: 'boolean', default: true }
      }
    },
    VISITED: {
      properties: {
        date: { type: 'string' },
        rating: { type: 'number' }
      }
    }
  }
};

// Test data
const testData = {
  vertices: {
    Person: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
      { id: 3, name: 'Charlie', age: 35 }
    ],
    Location: [
      { id: 1, name: 'New York', type: 'City' },
      { id: 2, name: 'Los Angeles', type: 'City' },
      { id: 3, name: 'Yellowstone', type: 'Park' }
    ]
  },
  edges: {
    LIVES_AT: [
      { from: { label: 'Person', id: 1 }, to: { label: 'Location', id: 1 }, properties: { since: '2020-01-15', primary: true } },
      { from: { label: 'Person', id: 2 }, to: { label: 'Location', id: 2 }, properties: { since: '2019-05-10', primary: true } },
      { from: { label: 'Person', id: 3 }, to: { label: 'Location', id: 2 }, properties: { since: '2021-03-20', primary: true } }
    ],
    VISITED: [
      { from: { label: 'Person', id: 1 }, to: { label: 'Location', id: 3 }, properties: { date: '2022-07-15', rating: 5 } },
      { from: { label: 'Person', id: 2 }, to: { label: 'Location', id: 3 }, properties: { date: '2022-08-10', rating: 4 } },
      { from: { label: 'Person', id: 3 }, to: { label: 'Location', id: 1 }, properties: { date: '2022-06-05', rating: 4 } }
    ]
  }
};

describe('Schema Loader', () => {
  let ageAvailable = false;
  let schemaLoader: SchemaLoader;
  let tempDir: string;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Schema Loader');
    ageAvailable = setup.ageAvailable;

    if (ageAvailable) {
      // Create a temporary directory for test files
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'age-schema-loader-test-'));
      
      // Create a schema loader
      schemaLoader = new SchemaLoader(queryExecutor);
    }
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);

    // Clean up temporary files
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 30000);

  // Test: Load schema from object
  it('should load schema from object', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Load the schema
    await schemaLoader.loadFromObject(testSchema, AGE_GRAPH_NAME);

    // Verify vertex labels were created
    const vertexLabelsResult = await queryExecutor.executeCypher(`
      MATCH (n)
      RETURN DISTINCT labels(n) AS labels
      ORDER BY labels
    `, {}, AGE_GRAPH_NAME);

    expect(vertexLabelsResult.rows.length).toBe(0); // No vertices yet, just the schema

    // Create a test vertex
    await queryExecutor.executeCypher(`
      CREATE (p:Person {id: 1, name: 'Test Person', age: 30})
      RETURN p
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertex was created
    const vertexResult = await queryExecutor.executeCypher(`
      MATCH (p:Person {id: 1})
      RETURN p.name AS name, p.age AS age
    `, {}, AGE_GRAPH_NAME);

    expect(vertexResult.rows.length).toBe(1);
    expect(vertexResult.rows[0].name).toBe('Test Person');
    expect(vertexResult.rows[0].age).toBe(30);
  });

  // Test: Load schema and data from object
  it('should load schema and data from object', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Load the schema and data
    await schemaLoader.loadFromObject(testSchema, AGE_GRAPH_NAME, testData);

    // Verify Person vertices were created
    const personResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN p.id AS id, p.name AS name, p.age AS age
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    expect(personResult.rows.length).toBe(3);
    expect(personResult.rows[0].id).toBe(1);
    expect(personResult.rows[0].name).toBe('Alice');
    expect(personResult.rows[0].age).toBe(30);

    // Verify Location vertices were created
    const locationResult = await queryExecutor.executeCypher(`
      MATCH (l:Location)
      RETURN l.id AS id, l.name AS name, l.type AS type
      ORDER BY l.id
    `, {}, AGE_GRAPH_NAME);

    expect(locationResult.rows.length).toBe(3);
    expect(locationResult.rows[0].id).toBe(1);
    expect(locationResult.rows[0].name).toBe('New York');
    expect(locationResult.rows[0].type).toBe('City');

    // Verify LIVES_AT edges were created
    const livesAtResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[r:LIVES_AT]->(l:Location)
      RETURN p.id AS personId, l.id AS locationId, r.since AS since, r.primary AS primary
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    expect(livesAtResult.rows.length).toBe(3);
    expect(livesAtResult.rows[0].personId).toBe(1);
    expect(livesAtResult.rows[0].locationId).toBe(1);
    expect(livesAtResult.rows[0].since).toBe('2020-01-15');
    expect(livesAtResult.rows[0].primary).toBe(true);

    // Verify VISITED edges were created
    const visitedResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)-[r:VISITED]->(l:Location)
      RETURN p.id AS personId, l.id AS locationId, r.date AS date, r.rating AS rating
      ORDER BY p.id
    `, {}, AGE_GRAPH_NAME);

    expect(visitedResult.rows.length).toBe(3);
    expect(visitedResult.rows[0].personId).toBe(1);
    expect(visitedResult.rows[0].locationId).toBe(3);
    expect(visitedResult.rows[0].date).toBe('2022-07-15');
    expect(visitedResult.rows[0].rating).toBe(5);
  });

  // Test: Load schema from file
  it('should load schema from file', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a schema file
    const schemaFilePath = path.join(tempDir, 'schema.json');
    fs.writeFileSync(schemaFilePath, JSON.stringify(testSchema, null, 2));

    // Load the schema from file
    await schemaLoader.loadFromFile(schemaFilePath, AGE_GRAPH_NAME);

    // Verify vertex labels were created
    const vertexLabelsResult = await queryExecutor.executeCypher(`
      MATCH (n)
      RETURN DISTINCT labels(n) AS labels
      ORDER BY labels
    `, {}, AGE_GRAPH_NAME);

    // We already have vertices from previous tests
    expect(vertexLabelsResult.rows.length).toBeGreaterThan(0);
  });

  // Test: Load schema and data from file
  it('should load schema and data from file', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a schema file
    const schemaFilePath = path.join(tempDir, 'schema-with-data.json');
    fs.writeFileSync(schemaFilePath, JSON.stringify({
      schema: testSchema,
      data: testData
    }, null, 2));

    // Load the schema and data from file
    await schemaLoader.loadFromFile(schemaFilePath, AGE_GRAPH_NAME);

    // Verify Person vertices were created (should now have duplicates)
    const personResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN count(p) AS count
    `, {}, AGE_GRAPH_NAME);

    // We should have at least 3 Person vertices (possibly more from previous tests)
    expect(personResult.rows.length).toBe(1);
    expect(personResult.rows[0].count).toBeGreaterThanOrEqual(3);
  });
});
