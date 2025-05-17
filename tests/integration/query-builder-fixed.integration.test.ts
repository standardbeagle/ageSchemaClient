/**
 * Integration tests for the QueryBuilder class
 *
 * These tests verify that the QueryBuilder correctly generates and executes
 * Cypher queries against an Apache AGE database.
 *
 * This file tests both raw Cypher execution and the QueryBuilder API.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME,
  createQueryBuilder
} from './base-test';
import { SchemaDefinition } from '../../src/schema/types';
import { QueryBuilder } from '../../src/query/builder';
import { OrderDirection } from '../../src/query/types';

describe('Query Builder', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof movieSchema>;
  let testSchema: string;

  // Define a schema for the test data
  const movieSchema: SchemaDefinition = {
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
          role: { type: 'string', required: true }
        }
      },
      DIRECTED: {
        properties: {}
      }
    }
  };

  beforeAll(async () => {
    // Setup test environment
    const setup = await setupIntegrationTest('Query Builder');
    ageAvailable = setup.ageAvailable;
    testSchema = setup.testSchema;

    // Create test data if AGE is available
    if (ageAvailable) {
      await createTestData();
    }
  }, 30000);

  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  async function createTestData() {
    // Create Movie vertices with properties in the correct format for Apache AGE
    const movies = [
      { id: 1, title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', rating: 9.3 },
      { id: 2, title: 'The Godfather', year: 1972, genre: 'Crime', rating: 9.2 },
      { id: 3, title: 'The Dark Knight', year: 2008, genre: 'Action', rating: 9.0 },
      { id: 4, title: 'Pulp Fiction', year: 1994, genre: 'Crime', rating: 8.9 },
      { id: 5, title: 'Forrest Gump', year: 1994, genre: 'Drama', rating: 8.8 }
    ];

    // Create a function to return movie data as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies()
      RETURNS ag_catalog.agtype AS $$
      SELECT jsonb_build_array(
        ${movies.map(movie => `
          jsonb_build_object(
            'id', ${movie.id},
            'title', '${movie.title}',
            'year', ${movie.year},
            'genre', '${movie.genre}',
            'rating', ${movie.rating}
          )
        `).join(',')}
      )::text::ag_catalog.agtype;
      $$ LANGUAGE SQL IMMUTABLE;
    `);

    // Create Movie vertices using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${testSchema}.get_movies() AS movie
      CREATE (m:Movie {properties: movie})
    `, {}, AGE_GRAPH_NAME);

    // Create Person vertices
    const people = [
      { id: 1, name: 'Tim Robbins', birthYear: 1958 },
      { id: 2, name: 'Morgan Freeman', birthYear: 1937 },
      { id: 3, name: 'Frank Darabont', birthYear: 1959 },
      { id: 4, name: 'Marlon Brando', birthYear: 1924 },
      { id: 5, name: 'Al Pacino', birthYear: 1940 },
      { id: 6, name: 'Francis Ford Coppola', birthYear: 1939 },
      { id: 7, name: 'Christian Bale', birthYear: 1974 },
      { id: 8, name: 'Heath Ledger', birthYear: 1979 },
      { id: 9, name: 'Christopher Nolan', birthYear: 1970 },
      { id: 10, name: 'John Travolta', birthYear: 1954 },
      { id: 11, name: 'Samuel L. Jackson', birthYear: 1948 },
      { id: 12, name: 'Quentin Tarantino', birthYear: 1963 },
      { id: 13, name: 'Tom Hanks', birthYear: 1956 },
      { id: 14, name: 'Robert Zemeckis', birthYear: 1952 }
    ];

    // Create a function to return person data as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_people()
      RETURNS ag_catalog.agtype AS $$
      SELECT jsonb_build_array(
        ${people.map(person => `
          jsonb_build_object(
            'id', ${person.id},
            'name', '${person.name}',
            'birthYear', ${person.birthYear}
          )
        `).join(',')}
      )::text::ag_catalog.agtype;
      $$ LANGUAGE SQL IMMUTABLE;
    `);

    // Create Person vertices using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${testSchema}.get_people() AS person
      CREATE (p:Person {properties: person})
    `, {}, AGE_GRAPH_NAME);

    // Create ACTED_IN relationships
    const actedIn = [
      { personId: 1, movieId: 1, role: 'Andy Dufresne' },
      { personId: 2, movieId: 1, role: 'Ellis Boyd Redding' },
      { personId: 4, movieId: 2, role: 'Vito Corleone' },
      { personId: 5, movieId: 2, role: 'Michael Corleone' },
      { personId: 7, movieId: 3, role: 'Bruce Wayne' },
      { personId: 8, movieId: 3, role: 'Joker' },
      { personId: 10, movieId: 4, role: 'Vincent Vega' },
      { personId: 11, movieId: 4, role: 'Jules Winnfield' },
      { personId: 13, movieId: 5, role: 'Forrest Gump' }
    ];

    // Create a function to return acted_in relationship data as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_acted_in()
      RETURNS ag_catalog.agtype AS $$
      SELECT jsonb_build_array(
        ${actedIn.map(rel => `
          jsonb_build_object(
            'personId', ${rel.personId},
            'movieId', ${rel.movieId},
            'role', '${rel.role}'
          )
        `).join(',')}
      )::text::ag_catalog.agtype;
      $$ LANGUAGE SQL IMMUTABLE;
    `);

    // Create ACTED_IN relationships using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${testSchema}.get_acted_in() AS rel
      MATCH (p:Person), (m:Movie)
      WHERE p.properties.id = rel.personId AND m.properties.id = rel.movieId
      CREATE (p)-[:ACTED_IN {properties: {role: rel.role}}]->(m)
    `, {}, AGE_GRAPH_NAME);

    // Create DIRECTED relationships
    const directed = [
      { personId: 3, movieId: 1 },
      { personId: 6, movieId: 2 },
      { personId: 9, movieId: 3 },
      { personId: 12, movieId: 4 },
      { personId: 14, movieId: 5 }
    ];

    // Create a function to return directed relationship data as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_directed()
      RETURNS ag_catalog.agtype AS $$
      SELECT jsonb_build_array(
        ${directed.map(rel => `
          jsonb_build_object(
            'personId', ${rel.personId},
            'movieId', ${rel.movieId}
          )
        `).join(',')}
      )::text::ag_catalog.agtype;
      $$ LANGUAGE SQL IMMUTABLE;
    `);

    // Create DIRECTED relationships using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${testSchema}.get_directed() AS rel
      MATCH (p:Person), (m:Movie)
      WHERE p.properties.id = rel.personId AND m.properties.id = rel.movieId
      CREATE (p)-[:DIRECTED {properties: {}}]->(m)
    `, {}, AGE_GRAPH_NAME);
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

    // Verify Person vertices were created
    const personResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN count(p) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(personResult.rows.length).toBe(1);
    expect(personResult.rows[0].count).toBe("14");

    // Verify ACTED_IN edges were created
    const actedInResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[a:ACTED_IN]->(:Movie)
      RETURN count(a) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(actedInResult.rows.length).toBe(1);
    expect(actedInResult.rows[0].count).toBe("9");

    // Verify DIRECTED edges were created
    const directedResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[d:DIRECTED]->(:Movie)
      RETURN count(d) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(directedResult.rows.length).toBe(1);
    expect(directedResult.rows[0].count).toBe("5");
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

  // Test: MATCH query with ORDER BY clause
  it('should execute a MATCH query with ORDER BY clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to execute the query and return results
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies_ordered_by_rating()
      RETURNS TABLE(title text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          (m.properties->>'title')::text AS title,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT *
          FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
            MATCH (m:Movie)
            RETURN m
            ORDER BY m.properties.rating DESC
          $$) AS (m ag_catalog.agtype)
        ) AS cypher_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies_ordered_by_rating()`);

    expect(result.rows.length).toBe(5);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
    expect(result.rows[3].title).toBe('Pulp Fiction');
    expect(result.rows[4].title).toBe('Forrest Gump');
  });

  // Test: MATCH query with LIMIT clause
  it('should execute a MATCH query with LIMIT clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to execute the query and return results
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies_with_limit()
      RETURNS TABLE(title text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          (m.properties->>'title')::text AS title,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT *
          FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
            MATCH (m:Movie)
            RETURN m
            ORDER BY m.properties.rating DESC
            LIMIT 3
          $$) AS (m ag_catalog.agtype)
        ) AS cypher_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies_with_limit()`);

    expect(result.rows.length).toBe(3);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
  });

  // Test: MATCH query with SKIP clause
  it('should execute a MATCH query with SKIP clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to execute the query and return results
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies_with_skip()
      RETURNS TABLE(title text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          (m.properties->>'title')::text AS title,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT *
          FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
            MATCH (m:Movie)
            RETURN m
            ORDER BY m.properties.rating DESC
            SKIP 2
          $$) AS (m ag_catalog.agtype)
        ) AS cypher_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies_with_skip()`);

    expect(result.rows.length).toBe(3);
    expect(result.rows[0].title).toBe('The Dark Knight');
    expect(result.rows[1].title).toBe('Pulp Fiction');
    expect(result.rows[2].title).toBe('Forrest Gump');
  });

  // Test: MATCH query with SKIP and LIMIT for pagination
  it('should execute a MATCH query with SKIP and LIMIT for pagination', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a function to execute the query and return results
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchema}.get_movies_with_pagination()
      RETURNS TABLE(title text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          (m.properties->>'title')::text AS title,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT *
          FROM ag_catalog.cypher('${AGE_GRAPH_NAME}', $$
            MATCH (m:Movie)
            RETURN m
            ORDER BY m.properties.rating DESC
            SKIP 1
            LIMIT 2
          $$) AS (m ag_catalog.agtype)
        ) AS cypher_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Execute the function to get the results
    const result = await queryExecutor.executeSQL(`SELECT * FROM ${testSchema}.get_movies_with_pagination()`);

    expect(result.rows.length).toBe(2);
    expect(result.rows[0].title).toBe('The Godfather');
    expect(result.rows[1].title).toBe('The Dark Knight');
  });

  // ========== QueryBuilder API Tests ==========

  // Test: Basic MATCH query using QueryBuilder
  it('should execute a basic MATCH query using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.properties.title AS title', 'm.properties.year AS year', 'm.properties.rating AS rating')
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

  // Test: MATCH query with WHERE clause using QueryBuilder
  it('should execute a MATCH query with WHERE clause using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.properties.year = 1994')
      .return('m.properties.title AS title', 'm.properties.genre AS genre')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: MATCH query with ORDER BY clause using QueryBuilder
  it('should execute a MATCH query with ORDER BY clause using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.properties.title AS title', 'm.properties.rating AS rating')
      .orderBy('m.properties.rating', OrderDirection.DESC)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(5);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
    expect(result.rows[3].title).toBe('Pulp Fiction');
    expect(result.rows[4].title).toBe('Forrest Gump');
  });

  // Test: MATCH query with LIMIT clause using QueryBuilder
  it('should execute a MATCH query with LIMIT clause using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.properties.title AS title', 'm.properties.rating AS rating')
      .orderBy('m.properties.rating', OrderDirection.DESC)
      .limit(3)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
  });

  // Test: MATCH query with SKIP clause using QueryBuilder
  it('should execute a MATCH query with SKIP clause using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.properties.title AS title', 'm.properties.rating AS rating')
      .orderBy('m.properties.rating', OrderDirection.DESC)
      .skip(2)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].title).toBe('The Dark Knight');
    expect(result.rows[1].title).toBe('Pulp Fiction');
    expect(result.rows[2].title).toBe('Forrest Gump');
  });

  // Test: MATCH query with SKIP and LIMIT for pagination using QueryBuilder
  it('should execute a MATCH query with SKIP and LIMIT for pagination using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.properties.title AS title', 'm.properties.rating AS rating')
      .orderBy('m.properties.rating', OrderDirection.DESC)
      .skip(1)
      .limit(2)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].title).toBe('The Godfather');
    expect(result.rows[1].title).toBe('The Dark Knight');
  });

  // Test: MATCH query with parameters using QueryBuilder
  it('should execute a MATCH query with parameters using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query with parameters
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.properties.year = {year}')
      .return('m.properties.title AS title', 'm.properties.genre AS genre')
      .withParam('year', 1994)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: MATCH query with multiple parameters using QueryBuilder
  it('should execute a MATCH query with multiple parameters using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute the query with multiple parameters
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.properties.year = {year} AND m.properties.genre = {genre}')
      .return('m.properties.title AS title', 'm.properties.rating AS rating')
      .withParam('year', 1994)
      .withParam('genre', 'Drama')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(2);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: Complex query with multiple MATCH clauses using QueryBuilder
  it('should execute a complex query with multiple MATCH clauses using QueryBuilder', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    queryBuilder = createQueryBuilder(movieSchema);

    // Build and execute a complex query
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Movie', 'm')
      .done()
      .where('p.properties.id = 1 AND m.properties.id = 1')
      .return('p.properties.name AS actor', 'm.properties.title AS movie')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].actor).toBe('Tim Robbins');
    expect(result.rows[0].movie).toBe('The Shawshank Redemption');
  });
});
