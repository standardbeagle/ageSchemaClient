/**
 * Apache AGE verification utilities for ageSchemaClient
 *
 * This module provides functions to verify that Apache AGE is properly installed
 * and configured in the PostgreSQL database.
 */

import { QueryExecutor } from './query';
import { Connection } from './types';

/**
 * Result of AGE verification
 */
export interface AgeVerificationResult {
  /** Whether AGE is available */
  available: boolean;
  /** AGE version if available */
  version?: string;
  /** AGE schema if available */
  schema?: string;
  /** Detailed error message if not available */
  error?: string;
  /** Detailed diagnostics information */
  diagnostics: {
    /** Whether the AGE extension is installed */
    extensionInstalled: boolean;
    /** Whether the ag_catalog schema exists */
    schemaExists: boolean;
    /** Whether the current user has usage privilege on ag_catalog */
    hasUsagePrivilege: boolean;
    /** Whether the current user has execute privilege on cypher function */
    hasCypherExecutePrivilege: boolean;
    /** Whether ag_catalog is in the search path */
    inSearchPath: boolean;
    /** Whether a test graph could be created */
    canCreateGraph: boolean;
  };
}

/**
 * Verify that Apache AGE is properly installed and configured
 *
 * This function performs a comprehensive check of the Apache AGE installation
 * and configuration, including:
 * 1. Checking if the AGE extension is installed
 * 2. Checking if the ag_catalog schema exists
 * 3. Checking if the current user has the necessary privileges
 * 4. Checking if ag_catalog is in the search path
 * 5. Checking if a test graph can be created
 *
 * @param queryExecutor - Query executor to use for verification
 * @returns Verification result
 */
export async function verifyAgeInstallation(
  queryExecutor: QueryExecutor
): Promise<AgeVerificationResult> {
  const result: AgeVerificationResult = {
    available: false,
    diagnostics: {
      extensionInstalled: false,
      schemaExists: false,
      hasUsagePrivilege: false,
      hasCypherExecutePrivilege: false,
      inSearchPath: false,
      canCreateGraph: false
    }
  };

  try {
    // Step 1: Check if the AGE extension is installed
    const extensionResult = await queryExecutor.executeSQL(`
      SELECT COUNT(*) > 0 as extension_installed
      FROM pg_catalog.pg_extension
      WHERE extname = 'age'
    `);

    result.diagnostics.extensionInstalled = extensionResult.rows[0].extension_installed;

    if (!result.diagnostics.extensionInstalled) {
      result.error = 'Apache AGE extension is not installed in the database';
      return result;
    }

    // Step 2: Get AGE extension details
    const extensionDetailsResult = await queryExecutor.executeSQL(`
      SELECT e.extversion AS version, n.nspname AS schema
      FROM pg_catalog.pg_extension e
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname = 'age'
    `);

    if (extensionDetailsResult.rows.length > 0) {
      result.version = extensionDetailsResult.rows[0].version;
      result.schema = extensionDetailsResult.rows[0].schema;
    }

    // Step 3: Check if ag_catalog schema exists
    const schemaResult = await queryExecutor.executeSQL(`
      SELECT COUNT(*) > 0 as schema_exists
      FROM pg_catalog.pg_namespace
      WHERE nspname = 'ag_catalog'
    `);

    result.diagnostics.schemaExists = schemaResult.rows[0].schema_exists;

    if (!result.diagnostics.schemaExists) {
      result.error = 'ag_catalog schema does not exist';
      return result;
    }

    // Step 4: Check if the current user has usage privilege on ag_catalog
    const usagePrivilegeResult = await queryExecutor.executeSQL(`
      SELECT pg_catalog.has_schema_privilege(current_user, 'ag_catalog', 'USAGE') as has_usage_privilege
    `);

    result.diagnostics.hasUsagePrivilege = usagePrivilegeResult.rows[0].has_usage_privilege;

    if (!result.diagnostics.hasUsagePrivilege) {
      result.error = 'Current user does not have USAGE privilege on ag_catalog schema';
      return result;
    }

    // Step 5: Check if the current user has execute privilege on cypher function
    const cypherPrivilegeResult = await queryExecutor.executeSQL(`
      SELECT p.proname,
             pg_catalog.has_function_privilege(current_user, p.oid, 'EXECUTE') as has_execute_privilege
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'ag_catalog' AND p.proname = 'cypher'
    `);

    if (cypherPrivilegeResult.rows.length > 0) {
      result.diagnostics.hasCypherExecutePrivilege = cypherPrivilegeResult.rows[0].has_execute_privilege;
    }

    if (!result.diagnostics.hasCypherExecutePrivilege) {
      result.error = 'Current user does not have EXECUTE privilege on ag_catalog.cypher function';
      return result;
    }

    // Step 6: Check if ag_catalog is in the search path
    const searchPathResult = await queryExecutor.executeSQL(`
      SELECT current_setting('search_path') AS search_path
    `);

    const searchPath = searchPathResult.rows[0].search_path;
    result.diagnostics.inSearchPath = searchPath.includes('ag_catalog');

    if (!result.diagnostics.inSearchPath) {
      console.warn(`Warning: ag_catalog is not in the search path: ${searchPath}`);
      console.warn('Attempting to set search path to include ag_catalog');

      // Try to set the search path to include ag_catalog
      try {
        await queryExecutor.executeSQL(`SET search_path TO ag_catalog, ${searchPath}`);

        // Verify the search path was set correctly
        const verifyResult = await queryExecutor.executeSQL(`
          SELECT current_setting('search_path') AS search_path
        `);

        const updatedSearchPath = verifyResult.rows[0].search_path;
        result.diagnostics.inSearchPath = updatedSearchPath.includes('ag_catalog');

        if (result.diagnostics.inSearchPath) {
          console.log(`Successfully set search path to include ag_catalog: ${updatedSearchPath}`);
        } else {
          result.error = `Failed to include ag_catalog in search path: ${updatedSearchPath}`;
          // Don't return yet, we'll still try to create a test graph
        }
      } catch (searchPathError) {
        console.error(`Error setting search path: ${searchPathError.message}`);
        result.error = `Failed to set search path: ${searchPathError.message}`;
        // Don't return yet, we'll still try to create a test graph
      }
    }

    // Step 7: Try to create a test graph
    try {
      // Generate a unique test graph name
      const testGraphName = `test_verify_${Math.random().toString(36).substring(2, 8)}_${Math.random().toString(16).substring(2, 8)}`;

      // Create the test graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${testGraphName}')`);
      console.log(`Successfully created test graph ${testGraphName}`);

      // Drop the test graph
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${testGraphName}', true)`);
      console.log(`Successfully dropped test graph ${testGraphName}`);

      result.diagnostics.canCreateGraph = true;
    } catch (graphError) {
      result.diagnostics.canCreateGraph = false;
      result.error = `Failed to create test graph: ${graphError.message}`;
      return result;
    }

    // If we got here, AGE is available
    result.available = true;
    result.error = undefined;
    return result;
  } catch (error) {
    result.available = false;
    result.error = `Error verifying AGE installation: ${error.message}`;
    return result;
  }
}

/**
 * Verify that Apache AGE is properly installed and configured using a connection
 *
 * @param connection - Database connection
 * @returns Verification result
 */
export async function verifyAgeInstallationWithConnection(
  connection: Connection
): Promise<AgeVerificationResult> {
  const queryExecutor = new QueryExecutor(connection);
  return verifyAgeInstallation(queryExecutor);
}
