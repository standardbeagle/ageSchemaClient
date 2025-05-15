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

// Use the database specified in the environment variables
// This is a test database that should be configured in .env.test
// It should always be available for testing
const testSchema = `test_${Date.now().toString(36).substring(2, 8)}`;

// Export the test schema name so it can be used in tests
export const TEST_SCHEMA = testSchema;

// Connection configuration for test database
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
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-tests',
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
    console.log(`Using test schema: ${testSchema}`);

    // Connect to the test database
    connectionManager = new PgConnectionManager(connectionConfig);
    const connection = await connectionManager.getConnection();
    queryExecutor = new QueryExecutor(connection);
    transactionManager = new TransactionManager(connectionManager);

    // Create a test schema for isolation
    try {
      await queryExecutor.executeSQL(`CREATE SCHEMA IF NOT EXISTS ${testSchema}`);
      console.log(`Test schema ${testSchema} created successfully`);

      // Set the search path to use our test schema first
      await queryExecutor.executeSQL(`SET search_path TO ${testSchema}, public`);
    } catch (error) {
      console.error(`Error creating test schema: ${error.message}`);
      throw error;
    }

    // Try to verify AGE extension is available
    let ageAvailable = false;
    try {
      // Verify AGE is available by checking for the existence of the ag_catalog schema
      // and a known AGE function (create_graph)
      const result = await queryExecutor.executeSQL(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
      `);
      ageAvailable = result.rows[0].age_available;
      if (ageAvailable) {
        console.log('Apache AGE extension is available');
      } else {
        console.warn('Apache AGE extension is not available or not properly installed');
        console.warn('Integration tests requiring AGE will be skipped');
      }
    } catch (error) {
      console.warn('Apache AGE extension is not available or not properly installed');
      console.warn(`Error: ${error.message}`);
      console.warn('Integration tests requiring AGE will be skipped');
    }

    // Only try to initialize AGE graph if the extension is available
    if (ageAvailable) {
      try {
        // Drop the graph if it exists
        try {
          await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
        } catch (error) {
          // Ignore error if graph doesn't exist
          console.warn(`Warning: Could not drop graph ${AGE_GRAPH_NAME}: ${error.message}`);
        }

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
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
  // Clean up resources
  if (connectionManager) {
    try {
      if (queryExecutor) {
        try {
          // Check if AGE is available before trying to drop the graph
          try {
            // Verify AGE is available by checking for the existence of the ag_catalog schema
            // and a known AGE function (create_graph)
            const result = await queryExecutor.executeSQL(`
              SELECT COUNT(*) > 0 as age_available
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
            `);
            const ageAvailable = result.rows[0].age_available;

            if (ageAvailable) {
              // Only try to drop the graph if AGE is available
              await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${AGE_GRAPH_NAME}', true)`);
            } else {
              console.warn(`Warning: Apache AGE extension not available, skipping graph cleanup`);
            }
          } catch (ageError) {
            console.warn(`Warning: Apache AGE extension not available, skipping graph cleanup`);
            console.warn(`Error: ${ageError.message}`);
          }
        } catch (error) {
          console.warn(`Warning: Could not drop graph ${AGE_GRAPH_NAME}: ${error.message}`);
        }

        // Drop the test schema
        try {
          await queryExecutor.executeSQL(`DROP SCHEMA IF EXISTS ${testSchema} CASCADE`);
          console.log(`Test schema ${testSchema} dropped successfully`);
        } catch (error) {
          console.warn(`Warning: Could not drop test schema: ${error.message}`);
        }
      }

      // Close all connections with a timeout to prevent hanging
      const closePromise = connectionManager.closeAll();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection close timed out')), 5000);
      });

      await Promise.race([closePromise, timeoutPromise])
        .then(() => console.log('Test database connections closed.'))
        .catch(error => console.error(`Error during connection close: ${error.message}`));

      console.log('Integration test teardown complete.');
    } catch (error) {
      console.error(`Error during integration test teardown: ${error.message}`);
    }
  }
}, 30000); // Increase timeout to 30 seconds

// Helper function to check if AGE is available
export async function isAgeAvailable(): Promise<boolean> {
  try {
    // Ensure search_path includes ag_catalog
    await queryExecutor.executeSQL('SET search_path TO ag_catalog, "$user", public');

    // Verify AGE is available by checking for the existence of the ag_catalog schema
    // and a known AGE function (create_graph)
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) > 0 as age_available
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
    `);
    const ageAvailable = result.rows[0].age_available;

    if (!ageAvailable) {
      console.warn('Warning: AGE extension check failed: create_graph function not found in ag_catalog schema');
      console.warn('The test is using the database specified in .env.test file.');
      console.warn('The database should be available, but the AGE extension is not installed or not properly configured.');
      console.warn('Please make sure the AGE extension is installed on your PostgreSQL server.');
      console.warn('Installation instructions: https://github.com/apache/age');
      console.warn('After installing AGE, you need to create the extension in your database:');
      console.warn('  CREATE EXTENSION age;');
    }

    return ageAvailable;
  } catch (error) {
    console.warn(`Warning: AGE extension check failed: ${error.message}`);
    console.warn('The test is using the database specified in .env.test file.');
    console.warn('The database should be available, but the AGE extension is not installed or not properly configured.');
    console.warn('Please make sure the AGE extension is installed on your PostgreSQL server.');
    console.warn('Installation instructions: https://github.com/apache/age');
    console.warn('After installing AGE, you need to create the extension in your database:');
    console.warn('  CREATE EXTENSION age;');
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
    // Ensure search_path includes ag_catalog
    await queryExecutor.executeSQL('SET search_path TO ag_catalog, "$user", public');

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
    // Ensure search_path includes ag_catalog
    await queryExecutor.executeSQL('SET search_path TO ag_catalog, "$user", public');

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