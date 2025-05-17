/**
 * Query Builder Working Integration Tests
 *
 * These tests verify that the query builder can generate and execute
 * various types of queries with different features.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME
} from './base-test';
import { QueryBuilder } from '../../src/query/builder';
import { SchemaDefinition } from '../../src/schema/types';

// Define a schema for the test data
const testSchema: SchemaDefinition = {
  vertices: {
    Movie: {
      properties: {
        id: { type: 'number', required: true },
        title: { type: 'string', required: true },
        year: { type: 'number', required: true },
        genre: { type: 'string' },
        rating: { type: 'number' }
      }
    },
    Person: {
      properties: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        birthYear: { type: 'number' }
      }
    }
  },
  edges: {
    ACTED_IN: {
      properties: {
        role: { type: 'string', required: true },
        performance: { type: 'number' }
      }
    },
    DIRECTED: {
      properties: {
        year: { type: 'number' }
      }
    }
  }
};

describe('Query Builder Working', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof testSchema>;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Query Builder Working');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Test 1: Create a function to return movie data
  it('should create a function to return movie data', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to return movie data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_movies_data()
      RETURNS ag_catalog.agtype AS $$
      BEGIN
        RETURN '{
          "movies": [
            {"id": 1, "title": "The Shawshank Redemption", "year": 1994, "genre": "Drama", "rating": 9.3},
            {"id": 2, "title": "The Godfather", "year": 1972, "genre": "Crime", "rating": 9.2},
            {"id": 3, "title": "The Dark Knight", "year": 2008, "genre": "Action", "rating": 9.0},
            {"id": 4, "title": "Pulp Fiction", "year": 1994, "genre": "Crime", "rating": 8.9},
            {"id": 5, "title": "Forrest Gump", "year": 1994, "genre": "Drama", "rating": 8.8}
          ]
        }'::ag_catalog.agtype;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname = 'get_movies_data'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 2: Create Movie vertices
  it('should create Movie vertices', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Get the movie data from the function
    const movieDataResult = await queryExecutor.executeSQL(`
      SELECT ${TEST_SCHEMA}.get_movies_data()->'movies' as movies
    `);

    // Parse the movie data
    const moviesJson = movieDataResult.rows[0].movies;
    const movies = JSON.parse(moviesJson);

    // Use the utility function to create a function that returns the movie data
    const { createAgtypeArrayFunction } = await import('../../src/db/utils');

    // Create the function
    await createAgtypeArrayFunction(queryExecutor, TEST_SCHEMA, 'get_movies_array', movies);

    // Create Movie vertices
    const result = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_movies_array() AS movie
      CREATE (m:Movie {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        rating: movie.rating
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Verify the vertices were created
    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0].created)).toBe(5);
  });

  // Test 3: Basic MATCH query
  it('should execute a basic MATCH query', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title AS title', 'm.year AS year', 'm.rating AS rating')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(5);

    // Check that each row has the expected properties
    for (const row of result.rows) {
      expect(row.title).toBeDefined();
      expect(row.year).toBeDefined();
      expect(row.rating).toBeDefined();
    }
  });

  // Test 4: MATCH query with WHERE clause
  it('should execute a MATCH query with WHERE clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = new QueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.year = 1994')
      .return('m.title AS title', 'm.genre AS genre')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });

  // Test 5: MATCH query with ORDER BY clause
  it('should execute a MATCH query with ORDER BY clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a MATCH query with ORDER BY clause
    const result = await queryExecutor.executeCypher(`
      MATCH (m:Movie)
      RETURN m.title AS title, m.rating AS rating
      ORDER BY m.rating DESC
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows.length).toBe(5);
    const titles = result.rows.map(row => row.result.title.replace(/"/g, ''));
    expect(titles[0]).toBe('The Shawshank Redemption');
    expect(titles[1]).toBe('The Godfather');
    expect(titles[2]).toBe('The Dark Knight');
    expect(titles[3]).toBe('Pulp Fiction');
    expect(titles[4]).toBe('Forrest Gump');
  });

  // Test 6: MATCH query with LIMIT clause
  it('should execute a MATCH query with LIMIT clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a MATCH query with LIMIT clause
    const result = await queryExecutor.executeCypher(`
      MATCH (m:Movie)
      RETURN m.title AS title, m.rating AS rating
      ORDER BY m.rating DESC
      LIMIT 3
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.result.title.replace(/"/g, ''));
    expect(titles[0]).toBe('The Shawshank Redemption');
    expect(titles[1]).toBe('The Godfather');
    expect(titles[2]).toBe('The Dark Knight');
  });

  // Test 7: MATCH query with SKIP clause
  it('should execute a MATCH query with SKIP clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a MATCH query with SKIP clause
    const result = await queryExecutor.executeCypher(`
      MATCH (m:Movie)
      RETURN m.title AS title, m.rating AS rating
      ORDER BY m.rating DESC
      SKIP 2
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.result.title.replace(/"/g, ''));
    expect(titles[0]).toBe('The Dark Knight');
    expect(titles[1]).toBe('Pulp Fiction');
    expect(titles[2]).toBe('Forrest Gump');
  });

  // Test 8: MATCH query with SKIP and LIMIT for pagination
  it('should execute a MATCH query with SKIP and LIMIT for pagination', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute a MATCH query with SKIP and LIMIT for pagination
    const result = await queryExecutor.executeCypher(`
      MATCH (m:Movie)
      RETURN m.title AS title, m.rating AS rating
      ORDER BY m.rating DESC
      SKIP 1
      LIMIT 2
    `, {}, AGE_GRAPH_NAME);

    // Verify the query results
    expect(result.rows.length).toBe(2);
    const titles = result.rows.map(row => row.result.title.replace(/"/g, ''));
    expect(titles[0]).toBe('The Godfather');
    expect(titles[1]).toBe('The Dark Knight');
  });
});
