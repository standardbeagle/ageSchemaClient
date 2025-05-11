/**
 * Integration test setup for ageSchemaClient
 * 
 * This file sets up the test environment for integration tests
 * that connect to a real PostgreSQL database with the AGE extension.
 */

import { PgConnectionManager, QueryExecutor } from '../../src/db';
import { afterAll, beforeAll } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Connection configuration from environment variables
const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  pool: {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
};

// Graph name for AGE tests
export const AGE_GRAPH_NAME = process.env.AGE_GRAPH_NAME || 'test_graph';

// Shared connection manager and query executor for tests
export let connectionManager: PgConnectionManager;
export let queryExecutor: QueryExecutor;

// Setup and teardown for integration tests
beforeAll(async () => {
  // Create connection manager
  connectionManager = new PgConnectionManager(connectionConfig);
  
  // Get a connection
  const connection = await connectionManager.getConnection();
  
  // Create query executor
  queryExecutor = new QueryExecutor(connection);
  
  // Initialize AGE graph for tests
  try {
    // Drop graph if it exists
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
  } catch (error) {
    // Ignore error if graph doesn't exist
  }
  
  // Create a new graph
  await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${AGE_GRAPH_NAME}')`);
  
  console.log(`Integration test setup complete. Connected to ${connectionConfig.database} and created graph ${AGE_GRAPH_NAME}`);
});

afterAll(async () => {
  // Clean up resources
  if (connectionManager) {
    try {
      // Drop the test graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
    } catch (error) {
      console.error('Error dropping test graph:', error);
    }
    
    // Close all connections
    await connectionManager.closeAll();
    console.log('Integration test teardown complete. All connections closed.');
  }
});

// Helper function to create a test vertex
export async function createTestVertex(label: string, properties: Record<string, any>) {
  const result = await queryExecutor.executeCypher(
    `CREATE (n:${label} $props) RETURN n`,
    { props: properties },
    AGE_GRAPH_NAME
  );
  return result.rows[0];
}

// Helper function to create a test edge
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
