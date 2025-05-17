/**
 * Integration test setup for ageSchemaClient
 *
 * This file sets up the test environment for integration tests
 * that connect to a real PostgreSQL database with the AGE extension.
 */

import { QueryExecutor, TransactionManager } from '../../src/db';
import { afterAll, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import { getConnectionManagerForTests, releaseAllConnections, ConnectionManagerForTests } from './connection-manager-for-tests';
import { getResourceRegistry } from './resource-registry';
import { generateSchemaName, generateGraphName } from './name-generator';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Get the resource registry
const resourceRegistry = getResourceRegistry();

// Generate a unique test schema name for isolation
const testSchema = generateSchemaName();

// Export the test schema name so it can be used in tests
export const TEST_SCHEMA = testSchema;

// Generate a unique graph name for AGE tests
export const AGE_GRAPH_NAME = process.env.AGE_GRAPH_NAME || generateGraphName();

// Shared connection manager and query executor for tests
// Each test file gets its own connection manager
export let connectionManager: ConnectionManagerForTests;
export let queryExecutor: QueryExecutor;
export let transactionManager: TransactionManager;

// Setup and teardown for integration tests
beforeAll(async () => {
  try {
    console.log(`Using test schema: ${testSchema}`);

    // Connect to the test database
    try {
      // Use the singleton connection manager for tests
      connectionManager = getConnectionManagerForTests();

      const connection = await connectionManager.getConnection();
      queryExecutor = new QueryExecutor(connection);
      transactionManager = new TransactionManager(connection);
    } catch (connectionError) {
      // Clearly identify this as a connection error, not an AGE configuration issue
      console.error(`DATABASE CONNECTION ERROR: ${connectionError.message}`);
      console.error('Failed to connect to the database. Check your database connection settings in .env.test');
      console.error('All integration tests will be skipped due to database connection failure.');
      throw new Error('DATABASE_CONNECTION_ERROR');
    }

    // Create a test schema for isolation
    try {
      await queryExecutor.executeSQL(`CREATE SCHEMA IF NOT EXISTS ${testSchema}`);
      console.log(`Test schema ${testSchema} created successfully`);

      // Register the schema for cleanup
      resourceRegistry.registerSchema(testSchema, queryExecutor);

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
      if (!ageAvailable) {
        console.error('AGE CONFIGURATION ERROR: Apache AGE extension is not available or not properly installed');
        console.error('All integration tests will be skipped due to missing AGE extension.');
        throw new Error('AGE_NOT_AVAILABLE');
      }
      console.log('Apache AGE extension is available');
    } catch (error) {
      if (error.message === 'AGE_NOT_AVAILABLE') {
        throw error; // Re-throw our custom error
      }
      console.error('AGE CONFIGURATION ERROR: Failed to check AGE availability');
      console.error(`Error: ${error.message}`);
      console.error('All integration tests will be skipped due to AGE configuration issues.');
      throw new Error('AGE_CONFIGURATION_ERROR');
    }

    // Only try to initialize AGE graph if we've reached this point (AGE is available)
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
      console.log(`Integration test setup complete. Created graph ${AGE_GRAPH_NAME}`);

      // Register the graph for cleanup
      resourceRegistry.registerGraph(AGE_GRAPH_NAME, queryExecutor);
    } catch (error) {
      console.error(`AGE GRAPH ERROR: Could not create graph ${AGE_GRAPH_NAME}: ${error.message}`);
      console.error('All integration tests will be skipped due to graph creation failure.');
      throw new Error('AGE_GRAPH_CREATION_ERROR');
    }
  } catch (error) {
    // This will catch any errors thrown above
    if (error.message === 'DATABASE_CONNECTION_ERROR' ||
        error.message === 'AGE_NOT_AVAILABLE' ||
        error.message === 'AGE_CONFIGURATION_ERROR' ||
        error.message === 'AGE_GRAPH_CREATION_ERROR') {
      // Error has already been logged with appropriate context
    } else {
      console.error(`UNKNOWN ERROR setting up integration tests: ${error.message}`);
      console.error('All integration tests will be skipped.');
    }
    throw error; // Re-throw to skip tests
  }
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
  console.log('Tearing down integration test environment');

  try {
    // Clean up all registered resources
    await resourceRegistry.cleanupAll();
    console.log('All test resources cleaned up');

    // Release connections but don't close the pool
    // The pool will be closed when the process exits
    try {
      // Release active connections but don't close the pool
      await releaseAllConnections();
      console.log('Test database connections released (pool will be closed when process exits).');
    } catch (error) {
      console.error(`Error releasing connections: ${error.message}`);
    }

    console.log('Integration test teardown complete.');
  } catch (error) {
    console.error(`Error during integration test teardown: ${error.message}`);
  }
}, 30000); // Increase timeout to 30 seconds

// Helper function to check if AGE is available with comprehensive diagnostics
export async function isAgeAvailable(): Promise<boolean> {
  try {
    console.log('Performing comprehensive Apache AGE availability check...');

    // Step 1: Check if the AGE extension is installed in the database
    const extensionResult = await queryExecutor.executeSQL(`
      SELECT COUNT(*) > 0 as extension_installed
      FROM pg_catalog.pg_extension
      WHERE extname = 'age'
    `);

    const extensionInstalled = extensionResult.rows[0].extension_installed;
    if (!extensionInstalled) {
      console.warn('Warning: Apache AGE extension is not installed in the database');
      console.warn('Run CREATE EXTENSION age; to install the extension');
      return false;
    }

    // Step 2: Get AGE extension details
    const extensionDetailsResult = await queryExecutor.executeSQL(`
      SELECT e.extversion AS version, n.nspname AS schema
      FROM pg_catalog.pg_extension e
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'age'
    `);

    if (extensionDetailsResult.rows.length > 0) {
      console.log(`Apache AGE extension version ${extensionDetailsResult.rows[0].version} is installed in schema ${extensionDetailsResult.rows[0].schema}`);
    }

    // Step 3: Check if ag_catalog schema exists
    const schemaResult = await queryExecutor.executeSQL(`
      SELECT COUNT(*) > 0 as schema_exists
      FROM pg_catalog.pg_namespace
      WHERE nspname = 'ag_catalog'
    `);

    const schemaExists = schemaResult.rows[0].schema_exists;
    if (!schemaExists) {
      console.warn('Warning: ag_catalog schema does not exist');
      console.warn('The AGE extension may not be properly installed');
      return false;
    }

    // Step 4: Check if the current user has access to the ag_catalog schema
    const schemaAccessResult = await queryExecutor.executeSQL(`
      SELECT pg_catalog.has_schema_privilege(current_user, 'ag_catalog', 'USAGE') as has_usage_privilege
    `);

    const hasSchemaAccess = schemaAccessResult.rows[0].has_usage_privilege;
    if (!hasSchemaAccess) {
      console.warn('Warning: Current user does not have USAGE privilege on ag_catalog schema');
      console.warn(`Run: GRANT USAGE ON SCHEMA ag_catalog TO ${process.env.PGUSER || 'current_user'};`);
      return false;
    }

    // Step 5: Check if the current user has execute privileges on key AGE functions
    const functionAccessResult = await queryExecutor.executeSQL(`
      SELECT p.proname,
             pg_catalog.has_function_privilege(current_user, p.oid, 'EXECUTE') as has_execute_privilege
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'ag_catalog' AND p.proname IN ('cypher', 'create_graph', 'drop_graph')
    `);

    let missingFunctionPrivileges = false;
    for (const row of functionAccessResult.rows) {
      if (!row.has_execute_privilege) {
        console.warn(`Warning: Current user does not have EXECUTE privilege on ag_catalog.${row.proname}`);
        console.warn(`Run: GRANT EXECUTE ON FUNCTION ag_catalog.${row.proname} TO ${process.env.PGUSER || 'current_user'};`);
        missingFunctionPrivileges = true;
      }
    }

    if (missingFunctionPrivileges) {
      return false;
    }

    // Step 6: Check if search_path includes ag_catalog
    const searchPathResult = await queryExecutor.executeSQL(`
      SELECT current_setting('search_path') AS search_path
    `);

    // Search path and AGE extension loading are now handled automatically by the connection pool
    // No need to set search_path or load AGE extension explicitly here
    const searchPath = searchPathResult.rows[0].search_path;
    if (!searchPath.includes('ag_catalog')) {
      console.warn('Warning: search_path does not include ag_catalog');
      console.warn('This should have been set automatically by the connection pool');
      console.warn('Check the connection pool configuration if this warning persists');
    }

    // Step 8: Verify AGE functionality by checking for the existence of the create_graph function
    const functionResult = await queryExecutor.executeSQL(`
      SELECT COUNT(*) > 0 as function_exists
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
    `);

    const functionExists = functionResult.rows[0].function_exists;
    if (!functionExists) {
      console.warn('Warning: AGE extension check failed: create_graph function not found in ag_catalog schema');
      console.warn('The AGE extension may not be properly loaded');
      return false;
    }

    // Step 9: Try to create and drop a test graph to verify full functionality
    try {
      const testGraphName = generateGraphName('test_verify');

      // Create test graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${testGraphName}')`);
      console.log(`Successfully created test graph ${testGraphName}`);

      // Drop test graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${testGraphName}', true)`);
      console.log(`Successfully dropped test graph ${testGraphName}`);
    } catch (graphError) {
      console.warn(`Warning: Failed to create/drop test graph: ${graphError.message}`);
      console.warn('This indicates a problem with AGE functionality');
      return false;
    }

    console.log('Apache AGE is properly installed, configured, and functional');
    return true;
  } catch (error) {
    // Check if this is a connection error
    if (error.message && (
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('terminated')
    )) {
      console.error(`DATABASE CONNECTION ERROR: ${error.message}`);
      console.error('Failed to connect to the database during AGE availability check.');
      console.error('Check your database connection settings in .env.test');
      throw new Error('DATABASE_CONNECTION_ERROR');
    } else {
      // This is likely an AGE configuration issue
      console.error(`AGE CONFIGURATION ERROR: ${error.message}`);
      console.error('The database is available, but the AGE extension is not installed or not properly configured.');
      console.error('Please make sure the AGE extension is installed on your PostgreSQL server.');
      console.error('Installation instructions: https://github.com/apache/age');
      console.error('After installing AGE, you need to create the extension in your database:');
      console.error('  CREATE EXTENSION age;');
      return false;
    }
  }
}

// Helper function to create a test vertex
export async function createTestVertex(label: string, properties: Record<string, any>) {
  // Check if AGE is available
  if (!(await isAgeAvailable())) {
    throw new Error('Apache AGE extension is not available');
  }

  try {
    // Search path is automatically set by the connection pool
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
    // Search path is automatically set by the connection pool
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

// Import and re-export the loadSchemaFixture function from fixtures
import { loadSchemaFixture as loadFixture } from '../fixtures';
export const loadSchemaFixture = loadFixture;