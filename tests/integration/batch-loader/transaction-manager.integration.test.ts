/**
 * Integration tests for the BatchLoaderTransactionManager
 * 
 * These tests verify that the BatchLoaderTransactionManager correctly manages transactions
 * with commit and rollback support.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PgConnectionManager } from '../../../src/db/connector';
import { QueryExecutor } from '../../../src/db/query';
import { BatchLoaderConnectionManager } from '../../../src/loader/connection-manager';
import { BatchLoaderTransactionManager, Transaction, TransactionState } from '../../../src/loader/transaction-manager';

// Connection manager
let connectionManager: PgConnectionManager;
// Batch loader connection manager
let batchLoaderConnectionManager: BatchLoaderConnectionManager;
// Batch loader transaction manager
let transactionManager: BatchLoaderTransactionManager;
// Flag to indicate if AGE is available
let ageAvailable = false;

// Setup before all tests
beforeAll(async () => {
  // Create connection manager
  connectionManager = new PgConnectionManager({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'age-integration',
    user: process.env.PGUSER || 'age',
    password: process.env.PGPASSWORD || 'agepassword',
    pool: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    // PostgreSQL-specific options
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'ageSchemaClient-integration-test',
    },
  });

  // Create batch loader connection manager
  batchLoaderConnectionManager = new BatchLoaderConnectionManager(connectionManager);
  
  // Create batch loader transaction manager
  transactionManager = new BatchLoaderTransactionManager(batchLoaderConnectionManager);

  try {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Check if AGE is available
    try {
      // Try to check if AGE is installed
      const result = await queryExecutor.executeSQL(`
        SELECT 1 FROM pg_extension WHERE extname = 'age'
      `);
      
      if (result.rows.length > 0) {
        ageAvailable = true;
      } else {
        console.warn('AGE extension not found');
        ageAvailable = false;
      }
    } catch (error) {
      console.warn('Error checking AGE availability:', error);
      ageAvailable = false;
    }
    
    // Create a test table for transaction tests
    await queryExecutor.executeSQL(`
      CREATE TABLE IF NOT EXISTS transaction_test (
        id SERIAL PRIMARY KEY,
        value TEXT
      )
    `);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  } catch (error) {
    console.error('Error setting up tests:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Drop the test table
    await queryExecutor.executeSQL(`
      DROP TABLE IF EXISTS transaction_test
    `);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  } catch (error) {
    console.warn('Error cleaning up tests:', error);
  }
  
  // Close all connections
  await batchLoaderConnectionManager.closeAll();
});

// Test suite
describe('BatchLoaderTransactionManager', () => {
  // Skip all tests if AGE is not available
  if (!ageAvailable) {
    it.skip('AGE not available, skipping tests', () => {});
    return;
  }
  
  // Test beginning a transaction
  it('should begin a transaction', async () => {
    // Begin a transaction
    const transaction = await transactionManager.beginTransaction();
    
    // Verify the transaction is active
    expect(transaction.getState()).toBe(TransactionState.ACTIVE);
    
    // Rollback the transaction
    await transaction.rollback();
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(transaction.getConnection());
  });
  
  // Test committing a transaction
  it('should commit a transaction', async () => {
    // Begin a transaction
    const transaction = await transactionManager.beginTransaction();
    
    // Get the connection
    const connection = transaction.getConnection();
    
    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);
    
    // Insert a row in the test table
    await queryExecutor.executeSQL(`
      INSERT INTO transaction_test (value) VALUES ('test_commit')
    `);
    
    // Commit the transaction
    await transaction.commit();
    
    // Verify the transaction is committed
    expect(transaction.getState()).toBe(TransactionState.COMMITTED);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
    
    // Get a new connection
    const newConnection = await batchLoaderConnectionManager.getConnection();
    
    // Create a new query executor
    const newQueryExecutor = new QueryExecutor(newConnection);
    
    // Verify the row was inserted
    const result = await newQueryExecutor.executeSQL(`
      SELECT * FROM transaction_test WHERE value = 'test_commit'
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(newConnection);
  });
  
  // Test rolling back a transaction
  it('should rollback a transaction', async () => {
    // Begin a transaction
    const transaction = await transactionManager.beginTransaction();
    
    // Get the connection
    const connection = transaction.getConnection();
    
    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);
    
    // Insert a row in the test table
    await queryExecutor.executeSQL(`
      INSERT INTO transaction_test (value) VALUES ('test_rollback')
    `);
    
    // Rollback the transaction
    await transaction.rollback();
    
    // Verify the transaction is rolled back
    expect(transaction.getState()).toBe(TransactionState.ROLLED_BACK);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
    
    // Get a new connection
    const newConnection = await batchLoaderConnectionManager.getConnection();
    
    // Create a new query executor
    const newQueryExecutor = new QueryExecutor(newConnection);
    
    // Verify the row was not inserted
    const result = await newQueryExecutor.executeSQL(`
      SELECT * FROM transaction_test WHERE value = 'test_rollback'
    `);
    
    expect(result.rows.length).toBe(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(newConnection);
  });
  
  // Test executing a function in a transaction with commit
  it('should execute a function in a transaction with commit', async () => {
    // Execute a function in a transaction
    await transactionManager.executeInTransaction(async (transaction) => {
      // Get the connection
      const connection = transaction.getConnection();
      
      // Create a query executor
      const queryExecutor = new QueryExecutor(connection);
      
      // Insert a row in the test table
      await queryExecutor.executeSQL(`
        INSERT INTO transaction_test (value) VALUES ('test_execute_commit')
      `);
    });
    
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create a query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Verify the row was inserted
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM transaction_test WHERE value = 'test_execute_commit'
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  });
  
  // Test executing a function in a transaction with rollback
  it('should execute a function in a transaction with rollback', async () => {
    // Execute a function in a transaction that throws an error
    try {
      await transactionManager.executeInTransaction(async (transaction) => {
        // Get the connection
        const connection = transaction.getConnection();
        
        // Create a query executor
        const queryExecutor = new QueryExecutor(connection);
        
        // Insert a row in the test table
        await queryExecutor.executeSQL(`
          INSERT INTO transaction_test (value) VALUES ('test_execute_rollback')
        `);
        
        // Throw an error to trigger a rollback
        throw new Error('Test error');
      });
    } catch (error) {
      // Ignore the error
    }
    
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create a query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Verify the row was not inserted
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM transaction_test WHERE value = 'test_execute_rollback'
    `);
    
    expect(result.rows.length).toBe(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  });
});
