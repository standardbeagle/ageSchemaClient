/**
 * Tests for the enhanced transaction manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransactionManager, SavepointTransaction, BatchOptions } from '../../src/db/transaction-manager';
import { Connection, ConnectionManager, TransactionError } from '../../src/db/types';

describe('SavepointTransaction', () => {
  let mockConnection: any;
  let mockTransactionManager: any;
  let transaction: SavepointTransaction;

  beforeEach(() => {
    mockConnection = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    };
    
    mockTransactionManager = {
      updateStats: vi.fn(),
    };
    
    transaction = new SavepointTransaction(mockConnection, mockTransactionManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a transaction', () => {
    expect(transaction).toBeDefined();
  });

  it('should begin a transaction', async () => {
    await transaction.begin();
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN');
    expect(transaction.isActive()).toBe(true);
  });

  it('should begin a transaction with options', async () => {
    await transaction.begin({ isolationLevel: 'SERIALIZABLE', readOnly: true, deferrable: true });
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE');
    expect(transaction.isActive()).toBe(true);
  });

  it('should commit a transaction', async () => {
    await transaction.begin();
    await transaction.commit();
    expect(mockConnection.query).toHaveBeenCalledWith('COMMIT');
    expect(transaction.isActive()).toBe(false);
  });

  it('should rollback a transaction', async () => {
    await transaction.begin();
    await transaction.rollback();
    expect(mockConnection.query).toHaveBeenCalledWith('ROLLBACK');
    expect(transaction.isActive()).toBe(false);
  });

  it('should create a savepoint for nested transactions', async () => {
    await transaction.begin();
    await transaction.begin();
    
    // First call is BEGIN, second call should be SAVEPOINT
    expect(mockConnection.query.mock.calls[0][0]).toBe('BEGIN');
    expect(mockConnection.query.mock.calls[1][0]).toMatch(/^SAVEPOINT sp_\d+_[a-z0-9]+$/);
    expect(transaction.getNestingLevel()).toBe(1);
  });

  it('should release a savepoint when committing a nested transaction', async () => {
    await transaction.begin();
    await transaction.begin();
    await transaction.commit();
    
    // Third call should be RELEASE SAVEPOINT
    expect(mockConnection.query.mock.calls[2][0]).toMatch(/^RELEASE SAVEPOINT sp_\d+_[a-z0-9]+$/);
    expect(transaction.getNestingLevel()).toBe(0);
    expect(transaction.isActive()).toBe(true);
  });

  it('should rollback to a savepoint when rolling back a nested transaction', async () => {
    await transaction.begin();
    await transaction.begin();
    await transaction.rollback();
    
    // Third call should be ROLLBACK TO SAVEPOINT
    expect(mockConnection.query.mock.calls[2][0]).toMatch(/^ROLLBACK TO SAVEPOINT sp_\d+_[a-z0-9]+$/);
    expect(transaction.getNestingLevel()).toBe(0);
    expect(transaction.isActive()).toBe(true);
  });
});

describe('TransactionManager', () => {
  let mockConnectionManager: ConnectionManager;
  let mockConnection: Connection;
  let transactionManager: TransactionManager;

  beforeEach(() => {
    mockConnection = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    };
    
    mockConnectionManager = {
      getConnection: vi.fn().mockResolvedValue(mockConnection),
      releaseConnection: vi.fn().mockResolvedValue(undefined),
      closeAll: vi.fn().mockResolvedValue(undefined),
      getPoolStats: vi.fn().mockReturnValue({ total: 0, idle: 0, active: 0, waiting: 0, max: 10 }),
      registerHooks: vi.fn(),
    };
    
    transactionManager = new TransactionManager(mockConnectionManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a transaction manager', () => {
    expect(transactionManager).toBeDefined();
  });

  it('should execute a function within a transaction', async () => {
    const result = await transactionManager.executeInTransaction(async (connection) => {
      return 'result';
    });
    
    expect(result).toBe('result');
    expect(mockConnectionManager.getConnection).toHaveBeenCalled();
    expect(mockConnectionManager.releaseConnection).toHaveBeenCalled();
  });

  it('should rollback a transaction on error', async () => {
    await expect(
      transactionManager.executeInTransaction(async (connection) => {
        throw new Error('Test error');
      })
    ).rejects.toThrow(TransactionError);
    
    expect(mockConnectionManager.getConnection).toHaveBeenCalled();
    expect(mockConnectionManager.releaseConnection).toHaveBeenCalled();
  });

  it('should execute a batch operation', async () => {
    const items = [1, 2, 3, 4, 5];
    const batchSize = 2;
    
    const results = await transactionManager.executeInBatch(
      items,
      batchSize,
      async (batch, connection) => {
        return batch.length;
      }
    );
    
    expect(results).toEqual([2, 2, 1]);
    expect(mockConnectionManager.getConnection).toHaveBeenCalledTimes(3);
    expect(mockConnectionManager.releaseConnection).toHaveBeenCalledTimes(3);
  });

  it('should handle empty batch', async () => {
    const items: number[] = [];
    const batchSize = 2;
    
    const results = await transactionManager.executeInBatch(
      items,
      batchSize,
      async (batch, connection) => {
        return batch.length;
      }
    );
    
    expect(results).toEqual([]);
    expect(mockConnectionManager.getConnection).not.toHaveBeenCalled();
    expect(mockConnectionManager.releaseConnection).not.toHaveBeenCalled();
  });

  it('should stop batch processing on error by default', async () => {
    const items = [1, 2, 3, 4, 5];
    const batchSize = 2;
    
    await expect(
      transactionManager.executeInBatch(
        items,
        batchSize,
        async (batch, connection) => {
          if (batch.includes(3)) {
            throw new Error('Test error');
          }
          return batch.length;
        }
      )
    ).rejects.toThrow(TransactionError);
    
    expect(mockConnectionManager.getConnection).toHaveBeenCalledTimes(2);
    expect(mockConnectionManager.releaseConnection).toHaveBeenCalledTimes(2);
  });

  it('should continue batch processing on error when continueOnError is true', async () => {
    const items = [1, 2, 3, 4, 5];
    const batchSize = 2;
    const options: BatchOptions = { continueOnError: true };
    
    await expect(
      transactionManager.executeInBatch(
        items,
        batchSize,
        async (batch, connection) => {
          if (batch.includes(3)) {
            throw new Error('Test error');
          }
          return batch.length;
        },
        options
      )
    ).rejects.toThrow(TransactionError);
    
    expect(mockConnectionManager.getConnection).toHaveBeenCalledTimes(3);
    expect(mockConnectionManager.releaseConnection).toHaveBeenCalledTimes(3);
  });

  it('should call progress callback during batch processing', async () => {
    const items = [1, 2, 3, 4, 5];
    const batchSize = 2;
    const progressCallback = vi.fn();
    const options: BatchOptions = { progressCallback };
    
    await transactionManager.executeInBatch(
      items,
      batchSize,
      async (batch, connection) => {
        return batch.length;
      },
      options
    );
    
    expect(progressCallback).toHaveBeenCalledTimes(3);
    expect(progressCallback).toHaveBeenNthCalledWith(1, 2, 5);
    expect(progressCallback).toHaveBeenNthCalledWith(2, 4, 5);
    expect(progressCallback).toHaveBeenNthCalledWith(3, 5, 5);
  });

  it('should track transaction statistics', async () => {
    await transactionManager.executeInTransaction(async (connection) => {
      return 'result';
    });
    
    const stats = transactionManager.getStats();
    expect(stats.total).toBe(1);
    expect(stats.committed).toBe(1);
    expect(stats.rolledBack).toBe(0);
    expect(stats.failed).toBe(0);
  });

  it('should reset transaction statistics', async () => {
    await transactionManager.executeInTransaction(async (connection) => {
      return 'result';
    });
    
    transactionManager.resetStats();
    
    const stats = transactionManager.getStats();
    expect(stats.total).toBe(0);
    expect(stats.committed).toBe(0);
    expect(stats.rolledBack).toBe(0);
    expect(stats.failed).toBe(0);
  });
});
