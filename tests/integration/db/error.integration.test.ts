/**
 * Integration tests for error handling and recovery
 * 
 * These tests verify error handling and recovery mechanisms.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseError, DatabaseErrorType, PgConnectionManager, QueryExecutor } from '../../../src/db';
import { connectionConfig, queryExecutor, AGE_GRAPH_NAME } from '../../setup/integration';

describe('Error Handling and Recovery', () => {
  // Create a temporary table for error tests
  beforeEach(async () => {
    try {
      // Drop the table if it exists
      await queryExecutor.executeSQL('DROP TABLE IF EXISTS error_test');
      
      // Create a new table
      await queryExecutor.executeSQL(`
        CREATE TABLE error_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          unique_value TEXT UNIQUE,
          value INTEGER NOT NULL
        )
      `);
    } catch (error) {
      console.error('Error setting up error test table:', error);
      throw error;
    }
  });
  
  it('should handle constraint violations', async () => {
    // Insert initial data
    await queryExecutor.executeSQL(
      'INSERT INTO error_test (name, unique_value, value) VALUES ($1, $2, $3)',
      ['test1', 'unique1', 100]
    );
    
    try {
      // Try to insert data that violates the unique constraint
      await queryExecutor.executeSQL(
        'INSERT INTO error_test (name, unique_value, value) VALUES ($1, $2, $3)',
        ['test2', 'unique1', 200]
      );
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
      expect(error.originalError).toBeDefined();
      expect(error.originalError.message).toContain('unique');
    }
    
    // Verify the database is still usable
    const result = await queryExecutor.executeSQL('SELECT * FROM error_test');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('test1');
  });
  
  it('should handle syntax errors', async () => {
    try {
      // Execute a query with a syntax error
      await queryExecutor.executeSQL('SELEC * FROM error_test');
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
      expect(error.originalError).toBeDefined();
      expect(error.originalError.message).toContain('syntax error');
    }
    
    // Verify the database is still usable
    const result = await queryExecutor.executeSQL('SELECT * FROM error_test');
    expect(result).toBeDefined();
  });
  
  it('should handle query cancellation', async () => {
    // Create a connection manager with a short timeout
    const timeoutConnectionManager = new PgConnectionManager(connectionConfig);
    const connection = await timeoutConnectionManager.getConnection();
    const timeoutQueryExecutor = new QueryExecutor(connection);
    
    try {
      // Execute a long-running query with a short timeout
      await timeoutQueryExecutor.executeSQL(
        'SELECT pg_sleep(5)', // Sleep for 5 seconds
        [],
        { timeout: 100 } // 100ms timeout
      );
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
    }
    
    // Verify the connection is still usable
    const result = await timeoutQueryExecutor.executeSQL('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
    
    // Clean up
    await timeoutConnectionManager.closeAll();
  });
  
  it('should handle database errors with retry', async () => {
    // Create a query executor with retry
    const retryConnectionManager = new PgConnectionManager(connectionConfig);
    const connection = await retryConnectionManager.getConnection();
    const retryQueryExecutor = new QueryExecutor(connection);
    
    // Mock a temporary error by causing a deadlock-like situation
    let attempts = 0;
    
    // Patch the connection.query method to simulate a temporary error
    const originalQuery = connection.query;
    connection.query = async (text, params) => {
      if (text.includes('SIMULATE_ERROR') && attempts < 2) {
        attempts++;
        throw new Error('simulated temporary error');
      }
      return originalQuery.call(connection, text, params);
    };
    
    try {
      // Execute a query that will fail temporarily but succeed after retries
      const result = await retryQueryExecutor.executeSQL(
        'SELECT 1 as value -- SIMULATE_ERROR',
        [],
        { maxRetries: 3, retryDelay: 100 }
      );
      
      // Verify the query eventually succeeded
      expect(result.rows[0].value).toBe(1);
      expect(attempts).toBe(2);
    } finally {
      // Restore the original query method
      connection.query = originalQuery;
      
      // Clean up
      await retryConnectionManager.closeAll();
    }
  });
  
  it('should handle Cypher syntax errors', async () => {
    try {
      // Execute a Cypher query with a syntax error
      await queryExecutor.executeCypher(
        'MATCH (n:Person) RETRN n',
        {},
        AGE_GRAPH_NAME
      );
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
    }
    
    // Verify the database is still usable
    const result = await queryExecutor.executeSQL('SELECT 1 as value');
    expect(result.rows[0].value).toBe(1);
  });
  
  it('should handle database errors with proper error types', async () => {
    try {
      // Execute a query that will fail
      await queryExecutor.executeSQL('SELECT * FROM nonexistent_table');
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error is a DatabaseError
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.type).toBe(DatabaseErrorType.QUERY);
      expect(error.originalError).toBeDefined();
      expect(error.data).toBeDefined();
      expect(error.data.query).toContain('nonexistent_table');
    }
  });
});
