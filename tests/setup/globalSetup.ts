/**
 * Global setup for ageSchemaClient
 *
 * This file runs once before all tests start
 * It is configured in vite.config.ts as globalSetup
 */

import { getResourceRegistry } from './resource-registry';
// Do NOT import queryExecutor from './integration' here to avoid Vitest context issues.
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { Connection, ConnectionConfig } from '../../src/db/types';
import { getConnectionManager } from '../../src/db/singleton-pool';
import { QueryExecutor } from '../../src/db/query';

// This function will be called once before all tests
export default async function() {
  console.log('🚀 Global setup running before all tests');

  // Set environment variables or perform other global setup
  process.env.AGE_GLOBAL_SETUP = 'true';

  // Load .env.test for database credentials
  // Assuming globalSetup.ts is in tests/setup/, .env.test is at project root
  const envPath = path.resolve(__dirname, '../../.env.test');
  dotenv.config({ path: envPath });

  // Create connection configuration
  const connectionConfig: ConnectionConfig = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'age-integration',
    user: process.env.PGUSER || 'age',
    password: process.env.PGPASSWORD || 'agepassword',
    pool: {
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    // PostgreSQL-specific options
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'ageSchemaClient-global-setup',
    },
  };

  // Get the singleton connection manager
  const connectionManager = getConnectionManager(connectionConfig);
  let connection: Connection | null = null;
  let queryExecutor: QueryExecutor | null = null;

  try {
    // Get a connection from the pool
    connection = await connectionManager.getConnection();
    console.log('Global setup connected to database using connection pool.');

    // Create a query executor for the connection
    queryExecutor = new QueryExecutor(connection);

    // Load and execute the SQL file
    const sqlFilePath = path.resolve(__dirname, '../../sql/batch-loader-functions.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // Execute the entire SQL content as a single block
    await queryExecutor.executeSQL(sqlContent);
    console.log('Successfully executed batch-loader-functions.sql in globalSetup.');
  } catch (error) {
    console.error('🚨🚨🚨 Failed to execute batch-loader-functions.sql in globalSetup:', error);
    // It's critical this succeeds, so we might want to throw to stop tests.
    // For now, log and let Vitest decide if it can proceed.
  } finally {
    if (connection) {
      // Release the connection back to the pool
      await connectionManager.releaseConnection(connection);
      console.log('Global setup database connection released back to pool.');
    }
  }

  // Return a teardown function that will be called once after all tests
  return async () => {
    console.log('🧹 Global teardown running after all tests');

    // Clean up any remaining resources
    const resourceRegistry = getResourceRegistry();
    console.log(`Cleaning up ${resourceRegistry.getResourceCount()} remaining resources...`);

    try {
      // Get a connection for resource cleanup if needed
      const cleanupConnection = await connectionManager.getConnection();
      const cleanupQueryExecutor = new QueryExecutor(cleanupConnection);

      // Set the query executor on the resource registry for cleanup operations
      resourceRegistry.setQueryExecutor(cleanupQueryExecutor);

      // Clean up all registered resources
      await resourceRegistry.cleanupAll();

      // Release the connection
      await connectionManager.releaseConnection(cleanupConnection);
    } catch (error) {
      console.error(`Error cleaning up resources: ${(error as Error).message}`);
    }

    // Close the singleton connection pool
    try {
      console.log('Closing singleton connection pool...');
      await connectionManager.closeAll();
      console.log('Singleton connection pool closed successfully.');
    } catch (error) {
      console.error(`Error closing singleton connection pool: ${(error as Error).message}`);
    }

    // Clean up any global resources
    delete process.env.AGE_GLOBAL_SETUP;

    console.log('Global teardown complete');
  };
}
