/**
 * Unit tests for the TransactionManager with Apache AGE support
 *
 * These tests verify that the TransactionManager correctly handles
 * transactions with Apache AGE support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransactionManager, Transaction, IsolationLevel, TransactionStatus } from '../../../src/db/transaction';
import { Connection } from '../../../src/db/types';

// Mock Connection
const mockConnection = {
  query: vi.fn(),
  release: vi.fn()
} as unknown as Connection;

describe('TransactionManager with Apache AGE support', () => {
  let transactionManager: TransactionManager;

  beforeEach(() => {
    // Create a new TransactionManager for each test
    transactionManager = new TransactionManager(mockConnection);

    // Reset mock function calls
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('ensureAgeSetup', () => {
    it('should load AGE and set search path if needed', async () => {
      // Mock AGE not loaded
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{ age_loaded: false }]
      }));

      // Mock search path without ag_catalog
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{ search_path: 'public, "$user"' }]
      }));

      // Mock successful LOAD and SET search_path
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({}));
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({}));

      await transactionManager.ensureAgeSetup();

      // Verify that the correct queries were executed
      expect(mockConnection.query).toHaveBeenCalledTimes(4);
      expect(mockConnection.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) > 0 as age_loaded'));
      expect(mockConnection.query).toHaveBeenNthCalledWith(2, 'SHOW search_path');
      expect(mockConnection.query).toHaveBeenNthCalledWith(3, 'LOAD \'age\';');
      expect(mockConnection.query).toHaveBeenNthCalledWith(4, 'SET search_path TO ag_catalog, "$user", public');
    });

    it('should not load AGE or set search path if already set up', async () => {
      // Mock AGE already loaded
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{ age_loaded: true }]
      }));

      // Mock search path with ag_catalog
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{ search_path: 'ag_catalog, public, "$user"' }]
      }));

      await transactionManager.ensureAgeSetup();

      // Verify that only the check queries were executed
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) > 0 as age_loaded'));
      expect(mockConnection.query).toHaveBeenNthCalledWith(2, 'SHOW search_path');
    });

    it('should handle errors when loading AGE', async () => {
      // Mock AGE not loaded
      mockConnection.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{ age_loaded: false }]
      }));

      // Mock error when loading AGE
      mockConnection.query.mockImplementationOnce(() => Promise.reject(new Error('AGE extension not available')));

      await expect(transactionManager.ensureAgeSetup()).rejects.toThrow('Failed to ensure AGE setup');
    });
  });

  describe('withAgeTransaction', () => {
    it('should ensure AGE is set up before executing the callback', async () => {
      // Mock beginTransaction
      const mockTransaction = {
        begin: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true)
      } as unknown as Transaction;

      vi.spyOn(transactionManager, 'beginTransaction').mockResolvedValue(mockTransaction);

      // Mock ensureAgeSetup
      const ensureAgeSetupSpy = vi.spyOn(transactionManager, 'ensureAgeSetup').mockResolvedValue(undefined);

      // Mock callback
      const mockCallback = vi.fn().mockResolvedValue('result');

      const result = await transactionManager.withAgeTransaction(mockCallback);

      // Verify that ensureAgeSetup was called
      expect(ensureAgeSetupSpy).toHaveBeenCalledTimes(1);

      // Verify that the callback was called with the transaction
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(mockTransaction);

      // Verify that the transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);

      // Verify that the result was returned
      expect(result).toBe('result');
    });

    it('should roll back the transaction if the callback throws an error', async () => {
      // Mock beginTransaction
      const mockTransaction = {
        begin: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true)
      } as unknown as Transaction;

      vi.spyOn(transactionManager, 'beginTransaction').mockResolvedValue(mockTransaction);

      // Mock ensureAgeSetup
      vi.spyOn(transactionManager, 'ensureAgeSetup').mockResolvedValue(undefined);

      // Mock callback that throws an error
      const mockError = new Error('Test error');
      const mockCallback = vi.fn().mockRejectedValue(mockError);

      await expect(transactionManager.withAgeTransaction(mockCallback)).rejects.toThrow(mockError);

      // Verify that the transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during AGE setup', async () => {
      // Mock beginTransaction
      const mockTransaction = {
        begin: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true)
      } as unknown as Transaction;

      vi.spyOn(transactionManager, 'beginTransaction').mockResolvedValue(mockTransaction);

      // Mock ensureAgeSetup that throws an error
      const mockError = new Error('AGE setup error');
      vi.spyOn(transactionManager, 'ensureAgeSetup').mockRejectedValue(mockError);

      // Mock callback
      const mockCallback = vi.fn().mockResolvedValue('result');

      await expect(transactionManager.withAgeTransaction(mockCallback)).rejects.toThrow(mockError);

      // Verify that the callback was not called
      expect(mockCallback).not.toHaveBeenCalled();

      // Verify that the transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
  });
});
