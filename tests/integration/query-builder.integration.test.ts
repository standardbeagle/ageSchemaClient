/**
 * Query Builder integration tests
 *
 * These tests verify that the query builder can generate and execute
 * various types of queries with different features.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  AGE_GRAPH_NAME,
  createQueryBuilder
} from './base-test';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryBuilder } from '../../../src/query/builder';

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

describe('Query Builder', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof testSchema>;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Query Builder');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Initialize query builder before each test
  beforeEach(() => {
    queryBuilder = createQueryBuilder(testSchema);
  });

  // Helper function to create test data
  async function createTestData() {
    if (!ageAvailable) {
      return { movies: [], people: [] };
    }

    // Create Movie vertices
    const movies = [
      { id: 1, title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', rating: 9.3 },
      { id: 2, title: 'The Godfather', year: 1972, genre: 'Crime', rating: 9.2 },
      { id: 3, title: 'The Dark Knight', year: 2008, genre: 'Action', rating: 9.0 },
      { id: 4, title: 'Pulp Fiction', year: 1994, genre: 'Crime', rating: 8.9 },
      { id: 5, title: 'Forrest Gump', year: 1994, genre: 'Drama', rating: 8.8 }
    ];

    for (const movie of movies) {
      await queryExecutor.executeCypher(`
        CREATE (m:Movie {
          id: ${movie.id},
          title: '${movie.title}',
          year: ${movie.year},
          genre: '${movie.genre}',
          rating: ${movie.rating}
        })
      `, {}, AGE_GRAPH_NAME);
    }

    // Create Person vertices
    const people = [
      { id: 1, name: 'Tim Robbins', birthYear: 1958 },
      { id: 2, name: 'Morgan Freeman', birthYear: 1937 },
      { id: 3, name: 'Marlon Brando', birthYear: 1924 },
      { id: 4, name: 'Al Pacino', birthYear: 1940 },
      { id: 5, name: 'Christian Bale', birthYear: 1974 },
      { id: 6, name: 'Heath Ledger', birthYear: 1979 },
      { id: 7, name: 'John Travolta', birthYear: 1954 },
      { id: 8, name: 'Samuel L. Jackson', birthYear: 1948 },
      { id: 9, name: 'Tom Hanks', birthYear: 1956 },
      { id: 10, name: 'Frank Darabont', birthYear: 1959 },
      { id: 11, name: 'Francis Ford Coppola', birthYear: 1939 },
      { id: 12, name: 'Christopher Nolan', birthYear: 1970 },
      { id: 13, name: 'Quentin Tarantino', birthYear: 1963 },
      { id: 14, name: 'Robert Zemeckis', birthYear: 1952 }
    ];

    for (const person of people) {
      await queryExecutor.executeCypher(`
        CREATE (p:Person {
          id: ${person.id},
          name: '${person.name}',
          birthYear: ${person.birthYear}
        })
      `, {}, AGE_GRAPH_NAME);
    }

    // Create ACTED_IN edges
    const actedIn = [
      { from: 1, to: 1, role: 'Andy Dufresne', performance: 9.5 },
      { from: 2, to: 1, role: 'Ellis Boyd Redding', performance: 9.6 },
      { from: 3, to: 2, role: 'Vito Corleone', performance: 9.8 },
      { from: 4, to: 2, role: 'Michael Corleone', performance: 9.7 },
      { from: 5, to: 3, role: 'Bruce Wayne', performance: 9.3 },
      { from: 6, to: 3, role: 'Joker', performance: 9.9 },
      { from: 7, to: 4, role: 'Vincent Vega', performance: 9.4 },
      { from: 8, to: 4, role: 'Jules Winnfield', performance: 9.5 },
      { from: 9, to: 5, role: 'Forrest Gump', performance: 9.7 }
    ];

    for (const edge of actedIn) {
      await queryExecutor.executeCypher(`
        MATCH (p:Person {id: ${edge.from}}), (m:Movie {id: ${edge.to}})
        CREATE (p)-[:ACTED_IN {
          role: '${edge.role}',
          performance: ${edge.performance}
        }]->(m)
      `, {}, AGE_GRAPH_NAME);
    }

    // Create DIRECTED edges
    const directed = [
      { from: 10, to: 1, year: 1994 },
      { from: 11, to: 2, year: 1972 },
      { from: 12, to: 3, year: 2008 },
      { from: 13, to: 4, year: 1994 },
      { from: 14, to: 5, year: 1994 }
    ];

    for (const edge of directed) {
      await queryExecutor.executeCypher(`
        MATCH (p:Person {id: ${edge.from}}), (m:Movie {id: ${edge.to}})
        CREATE (p)-[:DIRECTED {
          year: ${edge.year}
        }]->(m)
      `, {}, AGE_GRAPH_NAME);
    }

    return { movies, people };
  }

  // Test: Create test data
  it('should create test data', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    const { movies, people } = await createTestData();
    expect(movies.length).toBe(5);
    expect(people.length).toBe(14);

    // Verify Movie vertices were created
    const movieResult = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('count(m) AS count')
      .execute();

    expect(movieResult.rows.length).toBe(1);
    expect(movieResult.rows[0].count).toBe(5);

    // Verify Person vertices were created
    const personResult = await queryBuilder
      .match('Person', 'p')
      .done()
      .return('count(p) AS count')
      .execute();

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
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title', 'm.year', 'm.rating')
      .execute();

    expect(result.rows.length).toBe(5);
    expect(result.rows[0].m.title).toBeDefined();
    expect(result.rows[0].m.year).toBeDefined();
    expect(result.rows[0].m.rating).toBeDefined();
  });

  // Test: MATCH with WHERE clause
  it('should execute a MATCH query with WHERE clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .where('m.year = 1994')
      .return('m.title', 'm.genre')
      .execute();

    expect(result.rows.length).toBe(3);
    const titles = result.rows.map(row => row.m.title);
    expect(titles).toContain('The Shawshank Redemption');
    expect(titles).toContain('Pulp Fiction');
    expect(titles).toContain('Forrest Gump');
  });

  // Test: MATCH with ORDER BY clause
  it('should execute a MATCH query with ORDER BY clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title', 'm.rating')
      .orderBy('m.rating', 'DESC')
      .execute();

    expect(result.rows.length).toBe(5);
    expect(result.rows[0].m.title).toBe('The Shawshank Redemption');
    expect(result.rows[1].m.title).toBe('The Godfather');
    expect(result.rows[2].m.title).toBe('The Dark Knight');
    expect(result.rows[3].m.title).toBe('Pulp Fiction');
    expect(result.rows[4].m.title).toBe('Forrest Gump');
  });

  // Test: MATCH with LIMIT clause
  it('should execute a MATCH query with LIMIT clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title', 'm.rating')
      .orderBy('m.rating', 'DESC')
      .limit(3)
      .execute();

    expect(result.rows.length).toBe(3);
    expect(result.rows[0].m.title).toBe('The Shawshank Redemption');
    expect(result.rows[1].m.title).toBe('The Godfather');
    expect(result.rows[2].m.title).toBe('The Dark Knight');
  });

  // Test: MATCH with SKIP clause
  it('should execute a MATCH query with SKIP clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title', 'm.rating')
      .orderBy('m.rating', 'DESC')
      .skip(2)
      .execute();

    expect(result.rows.length).toBe(3);
    expect(result.rows[0].m.title).toBe('The Dark Knight');
    expect(result.rows[1].m.title).toBe('Pulp Fiction');
    expect(result.rows[2].m.title).toBe('Forrest Gump');
  });

  // Test: MATCH with SKIP and LIMIT for pagination
  it('should execute a MATCH query with SKIP and LIMIT for pagination', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Movie', 'm')
      .done()
      .return('m.title', 'm.rating')
      .orderBy('m.rating', 'DESC')
      .skip(1)
      .limit(2)
      .execute();

    expect(result.rows.length).toBe(2);
    expect(result.rows[0].m.title).toBe('The Godfather');
    expect(result.rows[1].m.title).toBe('The Dark Knight');
  });
});
