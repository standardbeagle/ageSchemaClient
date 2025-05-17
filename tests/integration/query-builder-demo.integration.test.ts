/**
 * Query Builder Demo Integration Tests
 * 
 * This file demonstrates how to use the QueryBuilder with Apache AGE correctly.
 * It uses PostgreSQL functions to handle the data conversion between Apache AGE
 * and the application.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
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
    }
  },
  edges: {}
};

describe('Query Builder Demo', () => {
  let ageAvailable = false;
  let testSchemaName: string;
  let queryExecutor: any;
  let queryBuilder: QueryBuilder<typeof testSchema>;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Query Builder Demo');
    ageAvailable = setup.ageAvailable;
    testSchemaName = setup.testSchema;
    queryExecutor = setup.queryExecutor;
    queryBuilder = new QueryBuilder(queryExecutor, AGE_GRAPH_NAME);

    // Create test data if AGE is available
    if (ageAvailable) {
      await createTestData();
    }
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Helper function to create test data
  async function createTestData() {
    // Create a function to return movie data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_movies_data()
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

    // Create Movie vertices
    await queryExecutor.executeCypher(`
      UNWIND ${testSchemaName}.get_movies_data().movies AS movie
      CREATE (m:Movie {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        rating: movie.rating
      })
      RETURN count(*) AS created
    `, {}, AGE_GRAPH_NAME);

    // Create a function to execute a basic MATCH query
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_all_movies()
      RETURNS TABLE(id int, title text, year int, genre text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.id)::int AS id,
          (m.title)::text AS title,
          (m.year)::int AS year,
          (m.genre)::text AS genre,
          (m.rating)::float AS rating
        FROM (
          SELECT (m).properties AS m
          FROM (
            SELECT m
            FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
              MATCH (m:Movie)
              RETURN m
            $$) AS (m ag_catalog.agtype)
          ) AS cypher_result
        ) AS movie_data;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function to execute a MATCH query with WHERE clause
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_movies_by_year(year_param int)
      RETURNS TABLE(id int, title text, genre text) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.id)::int AS id,
          (m.title)::text AS title,
          (m.genre)::text AS genre
        FROM (
          SELECT (m).properties AS m
          FROM (
            SELECT m
            FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
              MATCH (m:Movie)
              WHERE m.year = $$ || year_param || $$
              RETURN m
            $$) AS (m ag_catalog.agtype)
          ) AS cypher_result
        ) AS movie_data;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function to execute a MATCH query with ORDER BY clause
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_movies_ordered_by_rating()
      RETURNS TABLE(id int, title text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.id)::int AS id,
          (m.title)::text AS title,
          (m.rating)::float AS rating
        FROM (
          SELECT (m).properties AS m
          FROM (
            SELECT m
            FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
              MATCH (m:Movie)
              RETURN m
              ORDER BY m.rating DESC
            $$) AS (m ag_catalog.agtype)
          ) AS cypher_result
        ) AS movie_data;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  // Test: Basic MATCH query
  it('should execute a basic MATCH query', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchemaName}.get_all_movies()`);

    // Verify the results
    expect(result.rows.length).toBe(5);
    expect(result.rows[0].title).toBeDefined();
    expect(result.rows[0].year).toBeDefined();
    expect(result.rows[0].rating).toBeDefined();
  });

  // Test: MATCH query with WHERE clause
  it('should execute a MATCH query with WHERE clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchemaName}.get_movies_by_year(1994)`);

    // Verify the results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: MATCH query with ORDER BY clause
  it('should execute a MATCH query with ORDER BY clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchemaName}.get_movies_ordered_by_rating()`);

    // Verify the results
    expect(result.rows.length).toBe(5);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
    expect(result.rows[3].title).toBe('Pulp Fiction');
    expect(result.rows[4].title).toBe('Forrest Gump');
  });
});
