/**
 * Simple Query Builder integration tests
 * 
 * These tests verify that the query builder can generate and execute
 * various types of queries with different features.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  AGE_GRAPH_NAME
} from './base-test';

describe('Simple Query Builder', () => {
  let testSchema: string;
  let queryExecutor: any;
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Simple Query Builder');
    testSchema = setup.testSchema;
    queryExecutor = setup.queryExecutor;
    ageAvailable = setup.ageAvailable;

    // Create test data
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
    // Create a function to return movie data as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies()
      RETURNS TABLE(title text, year int, genre text, rating float) AS $$
      BEGIN
        RETURN QUERY VALUES
          ('The Shawshank Redemption', 1994, 'Drama', 9.3),
          ('The Godfather', 1972, 'Crime', 9.2),
          ('The Dark Knight', 2008, 'Action', 9.0),
          ('Pulp Fiction', 1994, 'Crime', 8.9),
          ('Forrest Gump', 1994, 'Drama', 8.8);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create Movie vertices
    for (const movie of await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies()`)) {
      await queryExecutor.executeCypher(`
        CREATE (m:Movie {
          properties: {
            title: '${movie.title}',
            year: ${movie.year},
            genre: '${movie.genre}',
            rating: ${movie.rating}
          }
        })
      `, {}, AGE_GRAPH_NAME);
    }
  }

  // Test: Verify data was created correctly
  it('should verify test data was created correctly', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Verify Movie vertices were created
    const movieResult = await queryExecutor.executeCypher(`
      MATCH (m:Movie)
      RETURN count(m) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(movieResult.rows.length).toBe(1);
    expect(movieResult.rows[0].count).toBe("5");
  });

  // Test: Basic MATCH query
  it('should execute a basic MATCH query', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to execute the query and return results
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies_basic()
      RETURNS TABLE(title text, year int, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.properties->>'title')::text AS title,
          (m.properties->>'year')::int AS year,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT *
          FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
            MATCH (m:Movie)
            RETURN m
          $$) AS (m ag_catalog.agtype)
        ) AS cypher_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies_basic()`);

    expect(result.rows.length).toBe(5);
    expect(result.rows[0].title).toBeDefined();
    expect(result.rows[0].year).toBeDefined();
    expect(result.rows[0].rating).toBeDefined();
  });

  // Test: MATCH query with WHERE clause
  it('should execute a MATCH query with WHERE clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to execute the query and return results
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies_by_year(year_param int)
      RETURNS TABLE(title text, genre text) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.properties->>'title')::text AS title,
          (m.properties->>'genre')::text AS genre
        FROM (
          SELECT *
          FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
            MATCH (m:Movie)
            WHERE m.properties.year = $$ || year_param || $$
            RETURN m
          $$) AS (m ag_catalog.agtype)
        ) AS cypher_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies_by_year(1994)`);

    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });
});
