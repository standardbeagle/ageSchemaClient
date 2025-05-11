/**
 * Integration tests for transaction management
 * 
 * These tests verify transaction behavior with a real PostgreSQL database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IsolationLevel } from '../../../src/db';
import { connectionManager, queryExecutor, transactionManager, AGE_GRAPH_NAME } from '../../setup/integration';

describe('Transaction Integration', () => {
  // Create a temporary table for transaction tests
  beforeEach(async () => {
    try {
      // Drop the table if it exists
      await queryExecutor.executeSQL('DROP TABLE IF EXISTS transaction_test');
      
      // Create a new table
      await queryExecutor.executeSQL(`
        CREATE TABLE transaction_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          value INTEGER NOT NULL
        )
      `);
    } catch (error) {
      console.error('Error setting up transaction test table:', error);
      throw error;
    }
  });
  
  it('should commit a transaction', async () => {
    // Begin a transaction
    const transaction = await transactionManager.beginTransaction();
    
    // Insert data
    await queryExecutor.executeSQL(
      'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
      ['test1', 100]
    );
    
    await queryExecutor.executeSQL(
      'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
      ['test2', 200]
    );
    
    // Commit the transaction
    await transaction.commit();
    
    // Verify data was committed
    const result = await queryExecutor.executeSQL('SELECT * FROM transaction_test ORDER BY id');
    
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('test1');
    expect(result.rows[0].value).toBe(100);
    expect(result.rows[1].name).toBe('test2');
    expect(result.rows[1].value).toBe(200);
  });
  
  it('should rollback a transaction', async () => {
    // Begin a transaction
    const transaction = await transactionManager.beginTransaction();
    
    // Insert data
    await queryExecutor.executeSQL(
      'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
      ['test1', 100]
    );
    
    // Rollback the transaction
    await transaction.rollback();
    
    // Verify data was not committed
    const result = await queryExecutor.executeSQL('SELECT * FROM transaction_test');
    
    expect(result.rows).toHaveLength(0);
  });
  
  it('should support different isolation levels', async () => {
    // Test each isolation level
    const isolationLevels = [
      IsolationLevel.READ_UNCOMMITTED,
      IsolationLevel.READ_COMMITTED,
      IsolationLevel.REPEATABLE_READ,
      IsolationLevel.SERIALIZABLE
    ];
    
    for (const level of isolationLevels) {
      // Begin a transaction with the specified isolation level
      const transaction = await transactionManager.beginTransaction(level);
      
      // Verify the isolation level
      const currentLevel = await transactionManager.getCurrentIsolationLevel();
      
      // PostgreSQL treats READ UNCOMMITTED the same as READ COMMITTED
      if (level === IsolationLevel.READ_UNCOMMITTED) {
        expect(currentLevel).toBe(IsolationLevel.READ_COMMITTED);
      } else {
        expect(currentLevel).toBe(level);
      }
      
      // Rollback the transaction
      await transaction.rollback();
    }
  });
  
  it('should handle nested transactions (savepoints)', async () => {
    // Begin an outer transaction
    const outerTransaction = await transactionManager.beginTransaction();
    
    // Insert data in the outer transaction
    await queryExecutor.executeSQL(
      'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
      ['outer', 100]
    );
    
    // Begin a savepoint (nested transaction)
    await queryExecutor.executeSQL('SAVEPOINT nested_transaction');
    
    // Insert data in the nested transaction
    await queryExecutor.executeSQL(
      'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
      ['nested', 200]
    );
    
    // Rollback to the savepoint
    await queryExecutor.executeSQL('ROLLBACK TO SAVEPOINT nested_transaction');
    
    // Commit the outer transaction
    await outerTransaction.commit();
    
    // Verify only the outer transaction data was committed
    const result = await queryExecutor.executeSQL('SELECT * FROM transaction_test');
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('outer');
    expect(result.rows[0].value).toBe(100);
  });
  
  it('should handle transaction errors', async () => {
    // Begin a transaction
    const transaction = await transactionManager.beginTransaction();
    
    // Insert valid data
    await queryExecutor.executeSQL(
      'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
      ['valid', 100]
    );
    
    try {
      // Try to insert invalid data (violate NOT NULL constraint)
      await queryExecutor.executeSQL(
        'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
        [null, 200]
      );
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // This is expected
      expect(error).toBeDefined();
      expect(error.message).toContain('Query execution failed');
    }
    
    // Rollback the transaction
    await transaction.rollback();
    
    // Verify no data was committed
    const result = await queryExecutor.executeSQL('SELECT * FROM transaction_test');
    expect(result.rows).toHaveLength(0);
  });
  
  it('should support the withTransaction helper', async () => {
    // Use the withTransaction helper
    await transactionManager.withTransaction(async () => {
      // Insert data
      await queryExecutor.executeSQL(
        'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
        ['test1', 100]
      );
      
      await queryExecutor.executeSQL(
        'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
        ['test2', 200]
      );
    });
    
    // Verify data was committed
    const result = await queryExecutor.executeSQL('SELECT * FROM transaction_test ORDER BY id');
    
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('test1');
    expect(result.rows[1].name).toBe('test2');
  });
  
  it('should rollback automatically on error in withTransaction', async () => {
    try {
      // Use the withTransaction helper with an error
      await transactionManager.withTransaction(async () => {
        // Insert valid data
        await queryExecutor.executeSQL(
          'INSERT INTO transaction_test (name, value) VALUES ($1, $2)',
          ['valid', 100]
        );
        
        // Throw an error
        throw new Error('Test error');
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // This is expected
      expect(error).toBeDefined();
      expect(error.message).toBe('Test error');
    }
    
    // Verify no data was committed
    const result = await queryExecutor.executeSQL('SELECT * FROM transaction_test');
    expect(result.rows).toHaveLength(0);
  });
});
