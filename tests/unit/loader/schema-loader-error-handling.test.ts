/**
 * Unit tests for SchemaLoader error handling and logging
 *
 * These tests verify that the SchemaLoader class correctly handles errors
 * and logs appropriate messages.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchemaLoader, Logger, SchemaLoaderError, SchemaValidationError, SchemaLoaderDatabaseError, SchemaLoaderTransactionError } from '../../../src/loader/schema-loader';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { DatabaseError, DatabaseErrorType } from '../../../src/db/types';

// Mock fs module
vi.mock('fs', () => {
  return {
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  };
});

// Mock path module
vi.mock('path', () => {
  return {
    resolve: vi.fn((p) => p)
  };
});

describe('SchemaLoader Error Handling', () => {
  let schemaLoader: SchemaLoader<SchemaDefinition>;
  let queryExecutor: QueryExecutor;
  let mockLogger: Logger;
  let mockSchema: SchemaDefinition;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    // Create mock schema
    mockSchema = {
      vertices: {
        Person: {
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        }
      },
      edges: {
        KNOWS: {
          properties: {
            since: { type: 'number' }
          },
          from: 'Person',
          to: 'Person'
        }
      }
    };

    // Create mock query executor with mock methods
    queryExecutor = {
      beginTransaction: vi.fn(),
      executeSQL: vi.fn(),
      executeQuery: vi.fn(),
      close: vi.fn()
    } as unknown as QueryExecutor;

    // Create SchemaLoader instance
    schemaLoader = new SchemaLoader(mockSchema, queryExecutor, {
      logger: mockLogger
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with a logger', () => {
      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing SchemaLoader');
      expect(mockLogger.debug).toHaveBeenCalledWith('SchemaLoader initialized');
    });

    it('should use console logger if none provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const schemaLoaderWithoutLogger = new SchemaLoader(mockSchema, queryExecutor);

      // Trigger a warning
      schemaLoaderWithoutLogger['logger'].warn('Test warning');

      expect(consoleSpy).toHaveBeenCalledWith('Test warning');
    });
  });

  describe('loadFromFile', () => {
    it('should handle file not found errors', async () => {
      // Mock fs.existsSync to return false
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);

      const result = await schemaLoader.loadFromFile('nonexistent.json');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBeInstanceOf(SchemaLoaderError);
      expect(result.errors![0].message).toContain('File not found');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    });

    it('should handle JSON parsing errors', async () => {
      // Mock fs.existsSync to return true
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);

      // Mock fs.readFileSync to return invalid JSON
      fs.readFileSync.mockReturnValue('{ invalid json }');

      const result = await schemaLoader.loadFromFile('invalid.json');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBeInstanceOf(SchemaLoaderError);
      expect(result.errors![0].message).toContain('Failed to parse JSON file');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to parse JSON content'), expect.any(Error));
    });

    it('should handle invalid data structure', async () => {
      // Mock fs.existsSync to return true
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);

      // Mock fs.readFileSync to return non-object JSON
      fs.readFileSync.mockReturnValue('"string data"');

      const result = await schemaLoader.loadFromFile('invalid-structure.json');

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBeInstanceOf(SchemaLoaderError);
      expect(result.errors![0].message).toContain('Invalid file format');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid file format'));
    });
  });

  describe('loadGraphData', () => {
    it('should handle transaction creation errors', async () => {
      // Mock beginTransaction to throw an error
      (queryExecutor.beginTransaction as jest.Mock).mockRejectedValue(new Error('Connection error'));

      const result = await schemaLoader.loadGraphData({ vertex: {}, edge: {} });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBeInstanceOf(SchemaLoaderTransactionError);
      expect(result.errors![0].message).toContain('Failed to create transaction');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create transaction'), expect.any(Error));
    });

    it('should handle transaction commit errors', async () => {
      // Mock transaction with commit that throws an error
      const mockTransaction = {
        commit: vi.fn().mockRejectedValue(new Error('Commit error')),
        rollback: vi.fn().mockResolvedValue(undefined)
      };

      // Mock beginTransaction to return the mock transaction
      (queryExecutor.beginTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await schemaLoader.loadGraphData({ vertex: {}, edge: {} });

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBeInstanceOf(SchemaLoaderTransactionError);
      expect(result.errors![0].message).toContain('Failed to commit transaction');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to commit transaction'), expect.any(Error));
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock transaction
      const mockTransaction = {
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined)
      };

      // Mock beginTransaction to return the mock transaction
      (queryExecutor.beginTransaction as jest.Mock).mockResolvedValue(mockTransaction);

      // Mock executeSQL to throw a database error
      (queryExecutor.executeSQL as jest.Mock).mockRejectedValue(new DatabaseError('Query failed', DatabaseErrorType.QUERY));

      // Create test data with vertices
      const testData = {
        vertex: {
          Person: [{ name: 'Test Person', age: 30 }]
        },
        edge: {}
      };

      const result = await schemaLoader.loadGraphData(testData);

      expect(result.success).toBe(false);
      expect(result.errors![0]).toBeInstanceOf(Error); // Just check for any error
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
