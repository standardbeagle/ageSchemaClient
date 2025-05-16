/**
 * Simple test script to verify database connection
 *
 * This script tests the database connection with a reduced timeout
 * to help diagnose connection issues.
 */

import { PgConnectionManager } from '../src/db/connector';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Connection configuration for test database with reduced timeout
const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  pool: {
    max: 5, // Increased pool size
    idleTimeoutMillis: 60000, // How long a connection can be idle before being closed
    connectionTimeoutMillis: 100, // Reduced timeout for local server
  },
  retry: {
    maxAttempts: 3, // Fewer retry attempts for quicker feedback
    delay: 100, // Shorter delay between retries
    maxDelay: 500, // Shorter maximum delay
    factor: 1.5, // Use exponential backoff
    jitter: 0.2, // Add jitter to avoid thundering herd
  },
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-connection-test',
  },
};

async function testConnection() {
  console.log('Testing database connection with reduced timeout...');

  // Create a connection manager
  const connectionManager = new PgConnectionManager(connectionConfig);

  try {
    // Get a connection from the pool
    console.log('Attempting to get connection...');
    const connection = await connectionManager.getConnection();

    // Execute a simple query to verify connection
    console.log('Connection established, executing test query...');
    const result = await connection.query('SELECT 1 as value');

    // Verify the result
    console.log('Query result:', result.rows[0]);

    // Try to load AGE extension
    try {
      console.log('Testing AGE extension...');
      await connection.query('LOAD \'age\';');

      // Check if AGE is available
      const ageResult = await connection.query(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
      `);

      if (ageResult.rows[0].age_available) {
        console.log('AGE extension is available');
      } else {
        console.log('AGE extension is not properly installed');
      }
    } catch (ageError) {
      console.error('Error testing AGE extension:', ageError.message);
    }

    // Release the connection back to the pool
    console.log('Releasing connection...');
    await connectionManager.releaseConnection(connection);

    // Get pool statistics
    const stats = connectionManager.getPoolStats();
    console.log('Pool statistics:', stats);

    console.log('Connection test completed successfully');
  } catch (error) {
    console.error('Connection test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Release all connections
    console.log('Releasing all connections...');
    await connectionManager.releaseAllConnections();

    // Close the pool
    console.log('Closing connection pool...');
    await connectionManager.closeAll();

    console.log('Connection test cleanup completed');
  }
}

// Run the test
testConnection().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
});
