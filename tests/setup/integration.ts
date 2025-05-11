/**
 * Integration test setup for ageSchemaClient
 *
 * This file sets up the test environment for integration tests
 * that connect to a real PostgreSQL database with the AGE extension.
 */

import { PgConnectionManager, QueryExecutor, TransactionManager } from '../../src/db';
import { afterAll, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Schema } from '../../src/schema/types';

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
export let transactionManager: TransactionManager;

// Setup and teardown for integration tests
beforeAll(async () => {
  try {
    // Create connection manager
    connectionManager = new PgConnectionManager(connectionConfig);

    // Get a connection
    const connection = await connectionManager.getConnection();

    // Create query executor
    queryExecutor = new QueryExecutor(connection);

    // Create transaction manager
    transactionManager = new TransactionManager(connectionManager);

    // Check if AGE extension is available
    let ageAvailable = false;
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.age_version()`);
      ageAvailable = true;
      console.log('Apache AGE extension is available');
    } catch (error) {
      console.warn('Apache AGE extension is not available or not properly installed');
      console.warn(`Error: ${error.message}`);
      console.warn('Integration tests requiring AGE will be skipped');
    }

    // Only try to initialize AGE graph if the extension is available
    if (ageAvailable) {
      try {
        // Drop graph if it exists
        await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
      } catch (error) {
        // Ignore error if graph doesn't exist
        console.warn(`Warning: Could not drop graph ${AGE_GRAPH_NAME}: ${error.message}`);
      }

      try {
        // Create a new graph
        await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${AGE_GRAPH_NAME}')`);
        console.log(`Integration test setup complete. Connected to ${connectionConfig.database} and created graph ${AGE_GRAPH_NAME}`);
      } catch (error) {
        console.warn(`Warning: Could not create graph ${AGE_GRAPH_NAME}: ${error.message}`);
        console.warn('Integration tests requiring graph operations will be skipped.');
      }
    }
  } catch (error) {
    console.error(`Error setting up integration tests: ${error.message}`);
    console.warn('All integration tests will be skipped.');
    // Skip all tests in this file
    // This is handled by the testNamePattern in vite.config.ts
  }
}, 15000); // Increase timeout to 15 seconds

afterAll(async () => {
  // Clean up resources
  if (connectionManager) {
    try {
      if (queryExecutor) {
        try {
          // Check if AGE is available before trying to drop the graph
          try {
            await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.age_version()`);
            // Only try to drop the graph if AGE is available
            await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
          } catch (ageError) {
            console.warn(`Warning: Apache AGE extension not available, skipping graph cleanup`);
          }
        } catch (error) {
          console.warn(`Warning: Could not drop graph ${AGE_GRAPH_NAME}: ${error.message}`);
        }
      }

      // Close all connections with a timeout to prevent hanging
      const closePromise = connectionManager.closeAll();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection close timed out')), 5000);
      });

      await Promise.race([closePromise, timeoutPromise])
        .then(() => console.log('Integration test teardown complete. All connections closed.'))
        .catch(error => console.error(`Error during connection close: ${error.message}`));
    } catch (error) {
      console.error(`Error during integration test teardown: ${error.message}`);
    }
  }
}, 15000); // Increase timeout to 15 seconds

// Helper function to check if AGE is available
export async function isAgeAvailable(): Promise<boolean> {
  try {
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.age_version()`);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to create a test vertex
export async function createTestVertex(label: string, properties: Record<string, any>) {
  // Check if AGE is available
  if (!(await isAgeAvailable())) {
    throw new Error('Apache AGE extension is not available');
  }

  try {
    const result = await queryExecutor.executeCypher(
      `CREATE (n:${label} $props) RETURN n`,
      { props: properties },
      AGE_GRAPH_NAME
    );
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to create test vertex: ${error.message}`);
  }
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
  // Check if AGE is available
  if (!(await isAgeAvailable())) {
    throw new Error('Apache AGE extension is not available');
  }

  try {
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
  } catch (error) {
    throw new Error(`Failed to create test edge: ${error.message}`);
  }
}

// Export connection configuration for tests
export { connectionConfig };

// Import and re-export the loadSchemaFixture function from fixtures
import { loadSchemaFixture as loadFixture } from '../fixtures';
export const loadSchemaFixture = loadFixture;