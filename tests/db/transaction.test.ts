/**
 * Tests for the transaction manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Transaction, TransactionManager, IsolationLevel, TransactionStatus } from '../../src/db';

describe('Transaction', () => {
  let mockConnection: any;
  let transaction: Transaction;

  beforeEach(() => {
    mockConnection = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    };

    transaction = new Transaction(mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a transaction', () => {
    expect(transaction).toBeDefined();
  });

  it('should begin a transaction', async () => {
    await transaction.begin();
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL READ COMMITTED');
  });

  it('should begin a transaction with isolation level', async () => {
    transaction = new Transaction(mockConnection, {
      isolationLevel: IsolationLevel.SERIALIZABLE,
    });

    await transaction.begin();
    expect(mockConnection.query).toHaveBeenCalledWith(
      'BEGIN ISOLATION LEVEL SERIALIZABLE'
    );
  });

  it('should begin a read-only transaction', async () => {
    transaction = new Transaction(mockConnection, {
      readOnly: true,
    });

    await transaction.begin();
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL READ COMMITTED READ ONLY');
  });

  it('should commit a transaction', async () => {
    await transaction.begin();
    await transaction.commit();

    expect(mockConnection.query).toHaveBeenCalledWith('COMMIT');
    expect(transaction.isCommitted()).toBe(true);
  });

  it('should rollback a transaction', async () => {
    await transaction.begin();
    await transaction.rollback();

    expect(mockConnection.query).toHaveBeenCalledWith('ROLLBACK');
    expect(transaction.isRolledBack()).toBe(true);
  });

  it('should create a nested transaction', async () => {
    const nestedTransaction = transaction.createNestedTransaction();
    expect(nestedTransaction).toBeDefined();
  });

  it('should get transaction information', () => {
    const info = transaction.getInfo();
    expect(info).toBeDefined();
    expect(info.status).toBe(TransactionStatus.ACTIVE);
    expect(info.isolationLevel).toBe(IsolationLevel.READ_COMMITTED);
  });

  it('should check if transaction is active', () => {
    expect(transaction.isActive()).toBe(true);
  });
});

describe('TransactionManager', () => {
  let mockConnection: any;
  let transactionManager: TransactionManager;

  beforeEach(() => {
    mockConnection = {
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    };

    transactionManager = new TransactionManager(mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a transaction manager', () => {
    expect(transactionManager).toBeDefined();
  });

  it('should begin a transaction', async () => {
    const transaction = await transactionManager.beginTransaction();
    expect(transaction).toBeDefined();
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL READ COMMITTED');
  });

  it('should execute a function within a transaction', async () => {
    const callback = vi.fn().mockResolvedValue('result');

    const result = await transactionManager.withTransaction(callback);

    expect(result).toBe('result');
    expect(callback).toHaveBeenCalled();
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL READ COMMITTED');
    expect(mockConnection.query).toHaveBeenCalledWith('COMMIT');
  });

  it('should rollback a transaction on error', async () => {
    const error = new Error('Test error');
    const callback = vi.fn().mockRejectedValue(error);

    await expect(transactionManager.withTransaction(callback)).rejects.toThrow(error);

    expect(callback).toHaveBeenCalled();
    expect(mockConnection.query).toHaveBeenCalledWith('BEGIN ISOLATION LEVEL READ COMMITTED');
    expect(mockConnection.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('should get the current isolation level', async () => {
    mockConnection.query.mockResolvedValueOnce({
      rows: [{ transaction_isolation: 'read committed' }],
    });

    const isolationLevel = await transactionManager.getCurrentIsolationLevel();
    expect(isolationLevel).toBe(IsolationLevel.READ_COMMITTED);
  });
});
