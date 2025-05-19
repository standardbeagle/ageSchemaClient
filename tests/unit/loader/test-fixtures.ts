/**
 * Test fixtures for BatchLoader unit tests
 * 
 * This module provides test fixtures, mock objects, and helper functions
 * for testing the BatchLoader implementation.
 */

import { vi } from 'vitest';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryExecutor } from '../../../src/db/query';
import { TransactionManager } from '../../../src/db/transaction';
import { GraphData } from '../../../src/loader/batch-loader';
import { QueryBuilder } from '../../../src/query/builder';

/**
 * Create a mock QueryExecutor
 * 
 * @returns Mock QueryExecutor
 */
export function createMockQueryExecutor(): QueryExecutor {
  return {
    getConnection: vi.fn(),
    releaseConnection: vi.fn(),
    executeSQL: vi.fn(),
    executeCypher: vi.fn()
  } as unknown as QueryExecutor;
}

/**
 * Create a mock Connection
 * 
 * @returns Mock Connection
 */
export function createMockConnection() {
  return {
    query: vi.fn(),
    release: vi.fn()
  };
}

/**
 * Create a mock Transaction
 * 
 * @returns Mock Transaction
 */
export function createMockTransaction() {
  return {
    getId: vi.fn().mockReturnValue('mock-transaction-id'),
    begin: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn().mockReturnValue('ACTIVE')
  };
}

/**
 * Create a mock TransactionManager
 * 
 * @param mockTransaction - Mock transaction to return
 * @returns Mock TransactionManager
 */
export function createMockTransactionManager(mockTransaction: any) {
  return {
    beginTransaction: vi.fn().mockResolvedValue(mockTransaction)
  };
}

/**
 * Create a mock QueryBuilder
 * 
 * @returns Mock QueryBuilder
 */
export function createMockQueryBuilder() {
  return {
    setParam: vi.fn().mockResolvedValue(undefined),
    withAgeParam: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    done: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    return: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [] })
  } as unknown as QueryBuilder<any>;
}

/**
 * Sample schema for testing
 */
export const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' }
      }
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' }
      }
    }
  }
};

/**
 * Sample graph data for testing
 */
export const testGraphData: GraphData = {
  vertices: {
    Person: [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 }
    ],
    Company: [
      { id: '3', name: 'Acme Inc.', founded: 1990 }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: '1', to: '3', since: 2015, position: 'Manager' },
      { from: '2', to: '3', since: 2018, position: 'Developer' }
    ],
    KNOWS: [
      { from: '1', to: '2', since: 2010 }
    ]
  }
};

/**
 * Sample invalid graph data for testing
 */
export const invalidGraphData: GraphData = {
  vertices: {
    Person: [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', age: 25 } // Missing required name property
    ],
    Company: [
      { id: '3', founded: 1990 } // Missing required name property
    ]
  },
  edges: {
    WORKS_AT: [
      { from: '1', to: '3', since: 2015, position: 'Manager' },
      { from: '2', to: '4', since: 2018, position: 'Developer' } // Invalid to reference
    ]
  }
};

/**
 * Sample large graph data for testing
 * 
 * @param count - Number of vertices to generate
 * @returns Large graph data
 */
export function createLargeGraphData(count: number = 1000): GraphData {
  return {
    vertices: {
      Person: Array(count).fill(0).map((_, i) => ({
        id: `person-${i}`,
        name: `Person ${i}`,
        age: 20 + (i % 50)
      }))
    },
    edges: {
      KNOWS: Array(Math.floor(count / 2)).fill(0).map((_, i) => ({
        from: `person-${i}`,
        to: `person-${(i + 1) % count}`,
        since: 2000 + (i % 20)
      }))
    }
  };
}

/**
 * Setup mock for successful vertex and edge creation
 * 
 * @param mockQueryExecutor - Mock QueryExecutor
 */
export function setupSuccessfulLoadMocks(mockQueryExecutor: QueryExecutor) {
  mockQueryExecutor.executeSQL = vi.fn().mockImplementation((query) => {
    if (query.includes('vertex')) {
      return Promise.resolve({
        rows: [{ created_vertices: '2' }]
      });
    } else if (query.includes('edge')) {
      return Promise.resolve({
        rows: [{ created_edges: '2' }]
      });
    } else {
      return Promise.resolve({
        rows: []
      });
    }
  });
}

/**
 * Setup mock for transaction management
 * 
 * @param mockTransaction - Mock Transaction
 */
export function setupTransactionMocks(mockTransaction: any) {
  vi.spyOn(TransactionManager.prototype, 'beginTransaction').mockImplementation(() => {
    return Promise.resolve(mockTransaction as any);
  });
}

/**
 * Setup mock for QueryBuilder
 * 
 * @param mockQueryBuilder - Mock QueryBuilder
 */
export function setupQueryBuilderMocks(mockQueryBuilder: any) {
  vi.mock('../../../src/query/builder', () => {
    return {
      QueryBuilder: vi.fn().mockImplementation(() => mockQueryBuilder)
    };
  });
}
