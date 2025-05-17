/**
 * Query Builder Example
 * 
 * This example demonstrates how to use the QueryBuilder with Apache AGE correctly.
 */

// Use require instead of import for CommonJS compatibility
const { PgConnectionManager } = require('../dist/db/connection.cjs');
const { QueryExecutor } = require('../dist/db/query.cjs');
const { QueryBuilder } = require('../dist/query/builder.cjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

// Define a schema for the test data
const testSchema = {
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

// Main function
async function main() {
  // Create a connection manager
  const connectionManager = new PgConnectionManager({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'age-integration',
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
    options: {
      search_path: 'ag_catalog, public'
    }
  });

  // Create a query executor
  const queryExecutor = new QueryExecutor(connectionManager);

  // Create a test schema
  const testSchemaName = `test_${Math.random().toString(36).substring(2, 8)}`;
  await queryExecutor.executeSQL(`CREATE SCHEMA IF NOT EXISTS ${testSchemaName}`);
  console.log(`Created test schema: ${testSchemaName}`);

  // Create a test graph
  const graphName = 'test_graph';
  try {
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
  } catch (error) {
    console.warn(`Could not drop graph ${graphName}: ${error}`);
  }
  await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${graphName}')`);
  console.log(`Created graph: ${graphName}`);

  // Create a query builder
  const queryBuilder = new QueryBuilder(queryExecutor, graphName);

  try {
    // Step 1: Create a function to return movie data
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
    console.log('Created function to return movie data');

    // Step 2: Create Movie vertices
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
    `, {}, graphName);
    console.log('Created Movie vertices');

    // Step 3: Create a function to execute a basic MATCH query
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_all_movies()
      RETURNS TABLE(id int, title text, year int, genre text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.properties->>'id')::int AS id,
          (m.properties->>'title')::text AS title,
          (m.properties->>'year')::int AS year,
          (m.properties->>'genre')::text AS genre,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT (m).properties AS m
          FROM (
            SELECT m
            FROM ag_catalog.cypher('${graphName}', $$
              MATCH (m:Movie)
              RETURN m
            $$) AS (m ag_catalog.agtype)
          ) AS cypher_result
        ) AS movie_data;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created function to execute a basic MATCH query');

    // Step 4: Execute the function to get all movies
    const allMoviesResult = await queryExecutor.executeSQL(`SELECT * FROM ${testSchemaName}.get_all_movies()`);
    console.log('All movies:');
    console.table(allMoviesResult.rows);

    // Step 5: Create a function to execute a MATCH query with WHERE clause
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_movies_by_year(year_param int)
      RETURNS TABLE(id int, title text, genre text) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.properties->>'id')::int AS id,
          (m.properties->>'title')::text AS title,
          (m.properties->>'genre')::text AS genre
        FROM (
          SELECT (m).properties AS m
          FROM (
            SELECT m
            FROM ag_catalog.cypher('${graphName}', $$
              MATCH (m:Movie)
              WHERE m.properties.year = $$ || year_param || $$
              RETURN m
            $$) AS (m ag_catalog.agtype)
          ) AS cypher_result
        ) AS movie_data;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created function to execute a MATCH query with WHERE clause');

    // Step 6: Execute the function to get movies by year
    const moviesByYearResult = await queryExecutor.executeSQL(`SELECT * FROM ${testSchemaName}.get_movies_by_year(1994)`);
    console.log('Movies from 1994:');
    console.table(moviesByYearResult.rows);

    // Step 7: Create a function to execute a MATCH query with ORDER BY clause
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${testSchemaName}.get_movies_ordered_by_rating()
      RETURNS TABLE(id int, title text, rating float) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (m.properties->>'id')::int AS id,
          (m.properties->>'title')::text AS title,
          (m.properties->>'rating')::float AS rating
        FROM (
          SELECT (m).properties AS m
          FROM (
            SELECT m
            FROM ag_catalog.cypher('${graphName}', $$
              MATCH (m:Movie)
              RETURN m
              ORDER BY m.properties.rating DESC
            $$) AS (m ag_catalog.agtype)
          ) AS cypher_result
        ) AS movie_data;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Created function to execute a MATCH query with ORDER BY clause');

    // Step 8: Execute the function to get movies ordered by rating
    const moviesOrderedByRatingResult = await queryExecutor.executeSQL(`SELECT * FROM ${testSchemaName}.get_movies_ordered_by_rating()`);
    console.log('Movies ordered by rating:');
    console.table(moviesOrderedByRatingResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
      await queryExecutor.executeSQL(`DROP SCHEMA IF EXISTS ${testSchemaName} CASCADE`);
      console.log('Cleaned up test resources');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }

    // Close connections
    await connectionManager.close();
    console.log('Closed database connections');
  }
}

// Run the example
main().catch(console.error);
