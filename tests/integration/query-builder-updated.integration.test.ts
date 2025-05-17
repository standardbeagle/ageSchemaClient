/**
 * Updated Query Builder Integration Tests
 *
 * These tests verify that the QueryBuilder correctly generates and executes
 * Cypher queries against an Apache AGE database. It uses the new utilities
 * for proper test isolation and resource cleanup.
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
import { ResourceRegistry, getResourceRegistry, ResourceType } from '../setup/resource-registry';
import { createArrayFunction } from '../../src/utils/age-type-utils';

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
        role: { type: 'string' }
      },
      from: ['Person'],
      to: ['Movie']
    },
    DIRECTED: {
      properties: {},
      from: ['Person'],
      to: ['Movie']
    }
  }
};

describe('Query Builder Updated', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof testSchema>;
  const resourceRegistry = getResourceRegistry();

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Query Builder Updated');
    ageAvailable = setup.ageAvailable;

    // Create a query builder with the test schema
    queryBuilder = createQueryBuilder(testSchema);

    // Create test data if AGE is available
    if (ageAvailable) {
      await createTestData();
    }
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  async function createTestData() {
    // Create Movie vertices with properties
    const movies = [
      { id: 1, title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', rating: 9.3 },
      { id: 2, title: 'The Godfather', year: 1972, genre: 'Crime', rating: 9.2 },
      { id: 3, title: 'The Dark Knight', year: 2008, genre: 'Action', rating: 9.0 },
      { id: 4, title: 'Pulp Fiction', year: 1994, genre: 'Crime', rating: 8.9 },
      { id: 5, title: 'Forrest Gump', year: 1994, genre: 'Drama', rating: 8.8 }
    ];

    // Create a function to return movie data as agtype
    const moviesFunctionName = 'get_movies';
    await createArrayFunction(queryExecutor, TEST_SCHEMA, moviesFunctionName, movies);

    // Register the function for cleanup
    resourceRegistry.registerCustomResource(
      `function:${TEST_SCHEMA}.${moviesFunctionName}`,
      moviesFunctionName,
      ResourceType.FUNCTION,
      async () => {
        try {
          await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.${moviesFunctionName}()`);
        } catch (error) {
          console.warn(`Warning: Could not drop function ${TEST_SCHEMA}.${moviesFunctionName}: ${error.message}`);
        }
      },
      5 // Priority
    );

    // Create Movie vertices using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.${moviesFunctionName}() AS movie
      CREATE (m:Movie {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        rating: movie.rating
      })
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
    const peopleFunctionName = 'get_people';
    await createArrayFunction(queryExecutor, TEST_SCHEMA, peopleFunctionName, people);

    // Register the function for cleanup
    resourceRegistry.registerCustomResource(
      `function:${TEST_SCHEMA}.${peopleFunctionName}`,
      peopleFunctionName,
      ResourceType.FUNCTION,
      async () => {
        try {
          await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.${peopleFunctionName}()`);
        } catch (error) {
          console.warn(`Warning: Could not drop function ${TEST_SCHEMA}.${peopleFunctionName}: ${error.message}`);
        }
      },
      5 // Priority
    );

    // Create Person vertices using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.${peopleFunctionName}() AS person
      CREATE (p:Person {
        id: person.id,
        name: person.name,
        birthYear: person.birthYear
      })
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
    const actedInFunctionName = 'get_acted_in';
    await createArrayFunction(queryExecutor, TEST_SCHEMA, actedInFunctionName, actedIn);

    // Register the function for cleanup
    resourceRegistry.registerCustomResource(
      `function:${TEST_SCHEMA}.${actedInFunctionName}`,
      actedInFunctionName,
      ResourceType.FUNCTION,
      async () => {
        try {
          await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.${actedInFunctionName}()`);
        } catch (error) {
          console.warn(`Warning: Could not drop function ${TEST_SCHEMA}.${actedInFunctionName}: ${error.message}`);
        }
      },
      5 // Priority
    );

    // Create ACTED_IN relationships using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.${actedInFunctionName}() AS rel
      MATCH (p:Person {id: rel.personId}), (m:Movie {id: rel.movieId})
      CREATE (p)-[:ACTED_IN {role: rel.role}]->(m)
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
    const directedFunctionName = 'get_directed';
    await createArrayFunction(queryExecutor, TEST_SCHEMA, directedFunctionName, directed);

    // Register the function for cleanup
    resourceRegistry.registerCustomResource(
      `function:${TEST_SCHEMA}.${directedFunctionName}`,
      directedFunctionName,
      ResourceType.FUNCTION,
      async () => {
        try {
          await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.${directedFunctionName}()`);
        } catch (error) {
          console.warn(`Warning: Could not drop function ${TEST_SCHEMA}.${directedFunctionName}: ${error.message}`);
        }
      },
      5 // Priority
    );

    // Create DIRECTED relationships using UNWIND with function
    await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.${directedFunctionName}() AS rel
      MATCH (p:Person {id: rel.personId}), (m:Movie {id: rel.movieId})
      CREATE (p)-[:DIRECTED]->(m)
    `, {}, AGE_GRAPH_NAME);
  }

  // Test: Verify data was created correctly
  it('should verify test data was created correctly', async () => {
    // Skip if AGE is not available
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
    expect(movieResult.rows[0].count).toBe(5);

    // Verify Person vertices were created
    const personResult = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      RETURN count(p) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(personResult.rows.length).toBe(1);
    expect(personResult.rows[0].count).toBe(14);

    // Verify ACTED_IN edges were created
    const actedInResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[a:ACTED_IN]->(:Movie)
      RETURN count(a) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(actedInResult.rows.length).toBe(1);
    expect(actedInResult.rows[0].count).toBe(9);

    // Verify DIRECTED edges were created
    const directedResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[d:DIRECTED]->(:Movie)
      RETURN count(d) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(directedResult.rows.length).toBe(1);
    expect(directedResult.rows[0].count).toBe(5);
  });

  // Test: Basic MATCH query
  it('should execute a basic MATCH query', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

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

  // Test: MATCH query with WHERE clause
  it('should execute a MATCH query with WHERE clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

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

  // Test: MATCH query with ORDER BY clause
  it('should execute a MATCH query with ORDER BY clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title AS title', 'm.rating AS rating')
      .orderBy('m.rating', 'DESC')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(5);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
    expect(result.rows[3].title).toBe('Pulp Fiction');
    expect(result.rows[4].title).toBe('Forrest Gump');
  });

  // Test: MATCH query with LIMIT clause
  it('should execute a MATCH query with LIMIT clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title AS title', 'm.rating AS rating')
      .orderBy('m.rating', 'DESC')
      .limit(3)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].title).toBe('The Shawshank Redemption');
    expect(result.rows[1].title).toBe('The Godfather');
    expect(result.rows[2].title).toBe('The Dark Knight');
  });

  // Test: MATCH query with SKIP clause
  it('should execute a MATCH query with SKIP clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title AS title', 'm.rating AS rating')
      .orderBy('m.rating', 'DESC')
      .skip(2)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].title).toBe('The Dark Knight');
    expect(result.rows[1].title).toBe('Pulp Fiction');
    expect(result.rows[2].title).toBe('Forrest Gump');
  });

  // Test: MATCH query with SKIP and LIMIT for pagination
  it('should execute a MATCH query with SKIP and LIMIT for pagination', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title AS title', 'm.rating AS rating')
      .orderBy('m.rating', 'DESC')
      .skip(1)
      .limit(2)
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].title).toBe('The Godfather');
    expect(result.rows[1].title).toBe('The Dark Knight');
  });

  // Test: MATCH query with WITH clause
  it('should execute a MATCH query with WITH clause', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .with('m.year AS year, count(*) AS movie_count')
      .return('year', 'movie_count')
      .orderBy('year')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    expect(result.rows[0].year).toBe(1972);
    expect(result.rows[0].movie_count).toBe(1);
    expect(result.rows[1].year).toBe(1994);
    expect(result.rows[1].movie_count).toBe(3);
    expect(result.rows[2].year).toBe(2008);
    expect(result.rows[2].movie_count).toBe(1);
  });

  // Test: MATCH query with parameters
  it('should execute a MATCH query with parameters', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const query = queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.year = {year}')
      .return('m.title AS title', 'm.genre AS genre')
      .withParam('year', 1994);

    // Log the query and parameters for debugging
    console.log('Cypher query:', query.toCypher());
    console.log('Parameters:', query.getParameters());

    const result = await query.execute();

    // Verify the query results
    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: MATCH query with multiple parameters
  it('should execute a MATCH query with multiple parameters', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.year = {year} AND m.genre = {genre}')
      .return('m.title AS title', 'm.rating AS rating')
      .withParam('year', 1994)
      .withParam('genre', 'Drama')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(2);
    const titles = result.rows.map(row => row.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: Complex query with multiple MATCH clauses
  it('should execute a complex query with multiple MATCH clauses', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Movie', 'm')
      .done()
      .where('(p)-[:DIRECTED]->(m)')
      .return('p.name AS director', 'm.title AS movie')
      .orderBy('p.name')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(5);
    expect(result.rows[0].director).toBe('Christopher Nolan');
    expect(result.rows[0].movie).toBe('The Dark Knight');
    expect(result.rows[1].director).toBe('Francis Ford Coppola');
    expect(result.rows[1].movie).toBe('The Godfather');
    expect(result.rows[2].director).toBe('Frank Darabont');
    expect(result.rows[2].movie).toBe('The Shawshank Redemption');
    expect(result.rows[3].director).toBe('Quentin Tarantino');
    expect(result.rows[3].movie).toBe('Pulp Fiction');
    expect(result.rows[4].director).toBe('Robert Zemeckis');
    expect(result.rows[4].movie).toBe('Forrest Gump');
  });

  // Test: Query with relationship properties
  it('should execute a query with relationship properties', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build and execute the query
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Movie', 'm')
      .done()
      .where('(p)-[r:ACTED_IN]->(m)')
      .return('p.name AS actor', 'm.title AS movie', 'r.role AS role')
      .orderBy('p.name')
      .execute();

    // Verify the query results
    expect(result.rows.length).toBe(9);

    // Check a few specific results
    const timRobbins = result.rows.find(row => row.actor === 'Tim Robbins');
    expect(timRobbins).toBeDefined();
    expect(timRobbins.movie).toBe('The Shawshank Redemption');
    expect(timRobbins.role).toBe('Andy Dufresne');

    const morganFreeman = result.rows.find(row => row.actor === 'Morgan Freeman');
    expect(morganFreeman).toBeDefined();
    expect(morganFreeman.movie).toBe('The Shawshank Redemption');
    expect(morganFreeman.role).toBe('Ellis Boyd Redding');
  });

  // Test: Error handling for invalid queries
  it('should handle errors for invalid queries', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Build an invalid query (missing RETURN clause)
    const invalidQuery = queryBuilder
      .match('Movie', 'm')
      .done();

    // Execute the query and expect an error
    await expect(invalidQuery.execute()).rejects.toThrow();
  });
});
