/**
 * Integration test setup for ageSchemaClient
 *
 * This file sets up the test environment for integration tests
 * that connect to a real PostgreSQL database with the AGE extension.
 *
 * Features:
 * - Configurable connection parameters via environment variables
 * - Automatic database initialization and cleanup
 * - Helper functions for common test operations
 * - Schema fixtures for testing
 */

import { PgConnectionManager, QueryExecutor, TransactionManager } from '../../src/db';
import { SchemaDefinition, SchemaValidator } from '../../src/schema';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

/**
 * Connection configuration from environment variables
 *
 * These can be overridden by setting environment variables in .env.test
 */
export const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  pool: {
    max: parseInt(process.env.PG_POOL_MAX || '5', 10),
    idleTimeoutMillis: parseInt(process.env.PG_POOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.PG_POOL_CONNECTION_TIMEOUT || '2000', 10),
  },
  retry: {
    maxAttempts: parseInt(process.env.PG_RETRY_MAX_ATTEMPTS || '3', 10),
    delay: parseInt(process.env.PG_RETRY_DELAY || '1000', 10),
  },
};

// Graph name for AGE tests
export const AGE_GRAPH_NAME = process.env.AGE_GRAPH_NAME || 'test_graph';

// Test schema fixtures directory
export const FIXTURES_DIR = path.join(__dirname, '../fixtures');

// Shared connection manager and query executor for tests
export let connectionManager: PgConnectionManager;
export let queryExecutor: QueryExecutor;

// Shared transaction manager for tests
export let transactionManager: TransactionManager;

// Setup and teardown for integration tests
beforeAll(async () => {
  console.log('Setting up integration test environment...');

  // Create connection manager
  connectionManager = new PgConnectionManager(connectionConfig);

  // Get a connection
  const connection = await connectionManager.getConnection();

  // Create query executor
  queryExecutor = new QueryExecutor(connection);

  // Create transaction manager
  transactionManager = new TransactionManager(connection);

  // Check if AGE extension is installed
  try {
    const result = await queryExecutor.executeSQL("SELECT * FROM pg_extension WHERE extname = 'age'");
    if (result.rows.length === 0) {
      console.warn('WARNING: AGE extension is not installed in the database. Some tests may fail.');
      console.warn('Run the setup_age_integration.sql script to install the AGE extension.');
    }
  } catch (error) {
    console.error('Error checking AGE extension:', error);
  }

  // Initialize AGE graph for tests
  try {
    // Drop graph if it exists
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
  } catch (error) {
    // Ignore error if graph doesn't exist or if AGE is not installed
    console.warn('Could not drop graph. This is expected if AGE is not installed or if the graph does not exist.');
  }

  try {
    // Create a new graph
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${AGE_GRAPH_NAME}')`);
    console.log(`Created graph ${AGE_GRAPH_NAME}`);
  } catch (error) {
    console.warn('Could not create graph. This is expected if AGE is not installed.');
    console.warn('Error:', error);
  }

  console.log(`Integration test setup complete. Connected to ${connectionConfig.database}`);
});

// Clean up after each test suite
afterEach(async () => {
  // Clean up any data created during the test
  try {
    // Clear all vertices and edges from the graph
    await queryExecutor.executeCypher(
      `MATCH (n) DETACH DELETE n`,
      {},
      AGE_GRAPH_NAME
    );
  } catch (error) {
    // Ignore errors if AGE is not installed
  }
});

// Final cleanup after all tests
afterAll(async () => {
  // Clean up resources
  if (connectionManager) {
    try {
      // Drop the test graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
      console.log(`Dropped graph ${AGE_GRAPH_NAME}`);
    } catch (error) {
      // Ignore errors if AGE is not installed or if the graph does not exist
    }

    // Close all connections
    await connectionManager.closeAll();
    console.log('Integration test teardown complete. All connections closed.');
  }
});

/**
 * Helper function to create a test vertex
 *
 * @param label - Vertex label
 * @param properties - Vertex properties
 * @returns Created vertex
 */
export async function createTestVertex(label: string, properties: Record<string, any>) {
  const result = await queryExecutor.executeCypher(
    `CREATE (n:${label} $props) RETURN n`,
    { props: properties },
    AGE_GRAPH_NAME
  );
  return result.rows[0];
}

/**
 * Helper function to create multiple test vertices
 *
 * @param label - Vertex label
 * @param propertiesArray - Array of vertex properties
 * @returns Created vertices
 */
export async function createTestVertices(label: string, propertiesArray: Record<string, any>[]) {
  // Use a transaction for better performance
  const transaction = await transactionManager.beginTransaction();

  try {
    const vertices = [];

    for (const properties of propertiesArray) {
      const result = await queryExecutor.executeCypher(
        `CREATE (n:${label} $props) RETURN n`,
        { props: properties },
        AGE_GRAPH_NAME
      );
      vertices.push(result.rows[0]);
    }

    await transaction.commit();
    return vertices;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Helper function to create a test edge
 *
 * @param fromLabel - Source vertex label
 * @param fromProps - Source vertex properties
 * @param toLabel - Target vertex label
 * @param toProps - Target vertex properties
 * @param edgeLabel - Edge label
 * @param edgeProps - Edge properties
 * @returns Created edge
 */
export async function createTestEdge(
  fromLabel: string,
  fromProps: Record<string, any>,
  toLabel: string,
  toProps: Record<string, any>,
  edgeLabel: string,
  edgeProps: Record<string, any>
) {
  const result = await queryExecutor.executeCypher(
    `
    MATCH (a:${fromLabel}), (b:${toLabel})
    WHERE a = $fromProps AND b = $toProps
    CREATE (a)-[r:${edgeLabel} $edgeProps]->(b)
    RETURN r
    `,
    {
      fromProps,
      toProps,
      edgeProps
    },
    AGE_GRAPH_NAME
  );
  return result.rows[0];
}

/**
 * Helper function to find a test vertex
 *
 * @param label - Vertex label
 * @param properties - Vertex properties to match
 * @returns Found vertex or null
 */
export async function findTestVertex(label: string, properties: Record<string, any>) {
  const result = await queryExecutor.executeCypher(
    `MATCH (n:${label}) WHERE n = $props RETURN n`,
    { props: properties },
    AGE_GRAPH_NAME
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Helper function to find a test edge
 *
 * @param fromLabel - Source vertex label
 * @param fromProps - Source vertex properties
 * @param toLabel - Target vertex label
 * @param toProps - Target vertex properties
 * @param edgeLabel - Edge label
 * @returns Found edge or null
 */
export async function findTestEdge(
  fromLabel: string,
  fromProps: Record<string, any>,
  toLabel: string,
  toProps: Record<string, any>,
  edgeLabel: string
) {
  const result = await queryExecutor.executeCypher(
    `
    MATCH (a:${fromLabel})-[r:${edgeLabel}]->(b:${toLabel})
    WHERE a = $fromProps AND b = $toProps
    RETURN r
    `,
    {
      fromProps,
      toProps
    },
    AGE_GRAPH_NAME
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Helper function to delete a test vertex
 *
 * @param label - Vertex label
 * @param properties - Vertex properties to match
 * @returns True if vertex was deleted, false otherwise
 */
export async function deleteTestVertex(label: string, properties: Record<string, any>) {
  const result = await queryExecutor.executeCypher(
    `MATCH (n:${label}) WHERE n = $props DETACH DELETE n RETURN count(n) as deleted`,
    { props: properties },
    AGE_GRAPH_NAME
  );

  return result.rows[0]?.deleted > 0;
}

/**
 * Helper function to delete a test edge
 *
 * @param fromLabel - Source vertex label
 * @param fromProps - Source vertex properties
 * @param toLabel - Target vertex label
 * @param toProps - Target vertex properties
 * @param edgeLabel - Edge label
 * @returns True if edge was deleted, false otherwise
 */
export async function deleteTestEdge(
  fromLabel: string,
  fromProps: Record<string, any>,
  toLabel: string,
  toProps: Record<string, any>,
  edgeLabel: string
) {
  const result = await queryExecutor.executeCypher(
    `
    MATCH (a:${fromLabel})-[r:${edgeLabel}]->(b:${toLabel})
    WHERE a = $props AND b = $toProps
    DELETE r
    RETURN count(r) as deleted
    `,
    {
      fromProps,
      toProps
    },
    AGE_GRAPH_NAME
  );

  return result.rows[0]?.deleted > 0;
}

/**
 * Load a schema fixture from the fixtures directory
 *
 * @param name - Fixture name (without .json extension)
 * @returns Schema definition
 */
export function loadSchemaFixture(name: string): SchemaDefinition {
  const fixturePath = path.join(FIXTURES_DIR, `${name}.json`);

  try {
    const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
    return JSON.parse(fixtureContent) as SchemaDefinition;
  } catch (error) {
    throw new Error(`Failed to load schema fixture '${name}': ${error}`);
  }
}

/**
 * Get a schema validator for a fixture
 *
 * @param name - Fixture name (without .json extension)
 * @returns Schema validator
 */
export function getSchemaValidator(name: string): SchemaValidator {
  const schema = loadSchemaFixture(name);
  return new SchemaValidator(schema);
}

/**
 * Create a test database with the given schema
 *
 * @param schemaName - Schema fixture name (without .json extension)
 * @returns Schema definition
 */
export async function createTestDatabase(schemaName: string): Promise<SchemaDefinition> {
  const schema = loadSchemaFixture(schemaName);

  // Clear existing data
  try {
    await queryExecutor.executeCypher(
      `MATCH (n) DETACH DELETE n`,
      {},
      AGE_GRAPH_NAME
    );
  } catch (error) {
    // Ignore errors if AGE is not installed
  }

  return schema;
}
