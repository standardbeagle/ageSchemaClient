/**
 * Base test file for integration tests
 *
 * This file provides common setup and utility functions for all integration tests.
 * It ensures that:
 * 1. The PgConnectionManager connection pool is properly used
 * 2. AGE extension is loaded and search_path is set automatically
 * 3. Connections are returned to the pool rather than explicitly closed
 * 4. Comprehensive AGE availability checks are performed
 * 5. Tests fail completely when there are connection issues
 * 6. Test resources are properly isolated and cleaned up
 * 7. Unique names are used for all database objects
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { QueryExecutor, TransactionManager, PgConnectionManager } from '../../src/db';
import { QueryBuilder } from '../../src/query/builder';
import { SchemaDefinition } from '../../src/schema/types';
import dotenv from 'dotenv';
import { TestConnectionManager, getTestConnectionManager, releaseAllTestConnections } from '../setup/test-connection-manager';
import { ResourceRegistry, getResourceRegistry, ResourceType } from '../setup/resource-registry';
import { generateSchemaName, generateGraphName, generateTableName } from '../setup/name-generator';

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
export let connectionManager: PgConnectionManager;
export let queryExecutor: QueryExecutor;
export let transactionManager: TransactionManager;

/**
 * Comprehensive check for AGE availability
 *
 * @returns True if AGE is available, false otherwise
 */
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

    // Step 2: Check if ag_catalog schema exists
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

    // Step 3: Check if the current user has access to the ag_catalog schema
    const schemaAccessResult = await queryExecutor.executeSQL(`
      SELECT pg_catalog.has_schema_privilege(current_user, 'ag_catalog', 'USAGE') as has_usage_privilege
    `);

    const hasSchemaAccess = schemaAccessResult.rows[0].has_usage_privilege;
    if (!hasSchemaAccess) {
      console.warn('Warning: Current user does not have USAGE privilege on ag_catalog schema');
      console.warn(`Run: GRANT USAGE ON SCHEMA ag_catalog TO ${process.env.PGUSER || 'current_user'};`);
      return false;
    }

    // Step 4: Check if the current user has execute privileges on key AGE functions
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

    // Step 5: Try to create and drop a test graph to verify full functionality
    try {
      const testGraphName = `test_graph_${Date.now().toString(36).substring(2, 8)}`;

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
      return false;
    }
  }
}

/**
 * Setup function for integration tests
 *
 * @param testName - Name of the test suite
 * @returns Setup object with ageAvailable flag and test context
 */
export async function setupIntegrationTest(testName: string): Promise<{
  ageAvailable: boolean;
  testSchema: string;
  graphName: string;
}> {
  console.log(`Setting up integration test: ${testName}`);
  console.log(`Using test schema: ${testSchema}`);
  console.log(`Using graph name: ${AGE_GRAPH_NAME}`);

  try {
    // Connect to the test database using the singleton connection manager
    connectionManager = getTestConnectionManager();
    const connection = await connectionManager.getConnection();
    queryExecutor = new QueryExecutor(connection);
    transactionManager = new TransactionManager(connection);

    // Set the query executor for the resource registry
    resourceRegistry.setQueryExecutor(queryExecutor);

    // Create a test schema for isolation
    await queryExecutor.executeSQL(`CREATE SCHEMA IF NOT EXISTS ${testSchema}`);
    console.log(`Test schema ${testSchema} created successfully`);

    // Register the schema for cleanup
    resourceRegistry.registerSchema(testSchema, queryExecutor);

    // Set the search path to include ag_catalog and our test schema
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, ${testSchema}, public`);

    // Check if AGE is available
    const ageAvailable = await isAgeAvailable();

    if (ageAvailable) {
      // Create a test graph
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
        console.log(`Created graph ${AGE_GRAPH_NAME}`);

        // Register the graph for cleanup
        resourceRegistry.registerGraph(AGE_GRAPH_NAME, queryExecutor);
      } catch (error) {
        console.error(`Error creating graph ${AGE_GRAPH_NAME}: ${error.message}`);
        return { ageAvailable: false, testSchema, graphName: AGE_GRAPH_NAME };
      }
    }

    return { ageAvailable, testSchema, graphName: AGE_GRAPH_NAME };
  } catch (error) {
    console.error(`Error setting up integration test: ${error.message}`);
    throw error;
  }
}

/**
 * Teardown function for integration tests
 *
 * @param ageAvailable - Whether AGE is available
 */
export async function teardownIntegrationTest(ageAvailable: boolean): Promise<void> {
  console.log('Tearing down integration test');

  try {
    // Clean up all registered resources
    await resourceRegistry.cleanupAll();
    console.log('All test resources cleaned up');

    // Release connections but don't close the pool
    await releaseAllTestConnections();
    console.log('Test database connections released');
  } catch (error) {
    console.error(`Error during integration test teardown: ${error.message}`);
  }
}

/**
 * Create a query builder for the test graph
 *
 * @param schema - Schema definition
 * @returns Query builder
 */
export function createQueryBuilder<T extends SchemaDefinition>(schema: T): QueryBuilder<T> {
  return new QueryBuilder<T>(schema, queryExecutor, AGE_GRAPH_NAME);
}
