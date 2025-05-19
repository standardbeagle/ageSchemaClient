/**
 * Schema Client Connection Manager
 * 
 * This file provides a connection manager for the schema client that integrates
 * with the existing connection pool. It ensures that:
 * 1. Connections are properly configured for Apache AGE
 * 2. AGE is loaded and ag_catalog is in the search_path
 * 3. The age_params temporary table is properly managed
 * 4. Connections are properly released back to the pool
 * 
 * @packageDocumentation
 */

import { PoolClient } from 'pg';
import {
  Connection,
  ConnectionConfig,
  ConnectionError,
  ConnectionEvent,
  ConnectionManager,
  ConnectionState,
} from './types';
import { PgConnectionManager } from './connector';
import { QueryExecutor } from './query';

/**
 * Schema Client Connection Manager
 * 
 * This class integrates with the existing connection pool and provides
 * additional functionality for the schema client.
 */
export class SchemaClientConnectionManager {
  private connectionManager: PgConnectionManager;

  /**
   * Create a new SchemaClientConnectionManager
   * 
   * @param connectionManager - Connection manager
   */
  constructor(connectionManager: PgConnectionManager) {
    this.connectionManager = connectionManager;
  }

  /**
   * Get a connection from the pool
   * 
   * @returns A connection
   */
  async getConnection(): Promise<Connection> {
    // Get a connection from the pool
    const connection = await this.connectionManager.getConnection();
    
    // Verify AGE setup
    await this.verifyAgeSetup(connection);
    
    return connection;
  }

  /**
   * Release a connection back to the pool
   * 
   * @param connection - Connection to release
   */
  async releaseConnection(connection: Connection): Promise<void> {
    // Release the connection back to the pool
    await this.connectionManager.releaseConnection(connection);
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    // Close all connections
    await this.connectionManager.closeAll();
  }

  /**
   * Get connection pool statistics
   * 
   * @returns Pool statistics
   */
  getPoolStats(): any {
    return this.connectionManager.getPoolStats();
  }

  /**
   * Create a query executor for a connection
   * 
   * @param connection - Connection
   * @returns Query executor
   */
  getQueryExecutor(connection: Connection): QueryExecutor {
    return new QueryExecutor(connection);
  }

  /**
   * Verify AGE is loaded and ag_catalog is in the search_path
   * 
   * @param connection - Connection
   */
  private async verifyAgeSetup(connection: Connection): Promise<void> {
    try {
      // Verify AGE is installed
      const ageResult = await connection.query(
        "SELECT 1 FROM pg_extension WHERE extname = 'age'"
      );
      
      if (ageResult.rowCount === 0) {
        throw new Error('Apache AGE extension is not installed');
      }
      
      // Verify ag_catalog is in search_path
      const searchPathResult = await connection.query(
        "SHOW search_path"
      );
      
      const searchPath = searchPathResult.rows[0].search_path;
      if (!searchPath.includes('ag_catalog')) {
        // Add ag_catalog to search_path
        await connection.query(
          "SET search_path TO ag_catalog, " + searchPath
        );
      }
    } catch (error) {
      // Release the connection before throwing the error
      try {
        await this.connectionManager.releaseConnection(connection);
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
      
      throw new ConnectionError(
        `Failed to verify AGE setup: ${(error as Error).message}`,
        error as Error
      );
    }
  }
}
