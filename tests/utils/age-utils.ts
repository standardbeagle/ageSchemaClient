/**
 * Utilities for working with Apache AGE in tests
 */

import { QueryExecutor } from '../../src/db/query';
import { PgConnectionManager } from '../../src/db/connector';

/**
 * Check if Apache AGE is available in the database
 *
 * @returns Whether Apache AGE is available
 */
export async function isAgeAvailable(): Promise<boolean> {
  let connectionManager: PgConnectionManager | null = null;

  try {
    // Create a connection manager
    connectionManager = new PgConnectionManager({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'age-integration',
      user: process.env.PGUSER || 'age',
      password: process.env.PGPASSWORD || 'agepassword',
      pgOptions: {
        // Ensure ag_catalog is in the search path for Apache AGE
        searchPath: 'ag_catalog, "$user", public'
      }
    });

    // Get a connection
    const connection = await connectionManager.getConnection();

    // Create a query executor with the connection
    const queryExecutor = new QueryExecutor(connection);

    // Try to load the AGE extension
    await queryExecutor.executeSQL('LOAD \'age\';');

    // Check if AGE is installed
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) AS count
      FROM pg_extension
      WHERE extname = 'age';
    `);

    // Release the connection
    await connectionManager.releaseConnection(connection);

    // Close the connection manager
    await connectionManager.closeAll();

    return result.rows[0].count > 0;
  } catch (error) {
    console.error('Error checking AGE availability:', error);

    // Clean up resources
    if (connectionManager) {
      try {
        await connectionManager.closeAll();
      } catch (closeError) {
        console.error('Error closing connection manager:', closeError);
      }
    }

    return false;
  }
}

/**
 * Create a test graph in Apache AGE
 *
 * @param graphName - Name of the graph to create
 * @param queryExecutor - Query executor to use
 */
export async function createTestGraph(graphName: string, queryExecutor: QueryExecutor): Promise<void> {
  try {
    // Try to drop the graph if it exists
    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${graphName}', true);
      `);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }

    // Create the graph
    await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.create_graph('${graphName}');
    `);
  } catch (error) {
    throw new Error(`Failed to create test graph: ${(error as Error).message}`);
  }
}

/**
 * Drop a test graph in Apache AGE
 *
 * @param graphName - Name of the graph to drop
 * @param queryExecutor - Query executor to use
 */
export async function dropTestGraph(graphName: string, queryExecutor: QueryExecutor): Promise<void> {
  try {
    await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.drop_graph('${graphName}', true);
    `);
  } catch (error) {
    console.warn(`Failed to drop test graph: ${(error as Error).message}`);
  }
}

/**
 * Get a QueryExecutor for testing
 *
 * @returns QueryExecutor and ConnectionManager (to be closed after use)
 */
export async function getTestQueryExecutor(): Promise<{
  queryExecutor: QueryExecutor;
  connectionManager: PgConnectionManager;
  connection: any;
}> {
  // Create a connection manager
  const connectionManager = new PgConnectionManager({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'age-integration',
    user: process.env.PGUSER || 'age',
    password: process.env.PGPASSWORD || 'agepassword',
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public'
    }
  });

  // Get a connection
  const connection = await connectionManager.getConnection();

  // Create a query executor with the connection
  const queryExecutor = new QueryExecutor(connection);

  // Load the AGE extension
  await queryExecutor.executeSQL('LOAD \'age\';');

  return { queryExecutor, connectionManager, connection };
}
