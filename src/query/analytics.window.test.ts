/**
 * Tests for the analytics query builder window functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsQueryBuilder, WindowFunctionType, WindowFunctionOptions } from './analytics';
import { QueryExecutor } from '../db/query';
import { SchemaDefinition } from '../schema/types';

// Mock schema definition
const mockSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' }
      },
      required: ['name']
    },
    Product: {
      properties: {
        name: { type: 'string' },
        price: { type: 'number' }
      },
      required: ['name', 'price']
    }
  },
  edges: {
    PURCHASED: {
      properties: {
        date: { type: 'date' },
        quantity: { type: 'number' }
      },
      source: 'Person',
      target: 'Product'
    }
  }
};

// Mock query executor
const mockExecutor = {
  executeCypher: vi.fn().mockResolvedValue({ rows: [] })
} as unknown as QueryExecutor;

describe('AnalyticsQueryBuilder Window Functions', () => {
  let queryBuilder: AnalyticsQueryBuilder<typeof mockSchema>;

  beforeEach(() => {
    queryBuilder = new AnalyticsQueryBuilder(mockSchema, mockExecutor);
    vi.clearAllMocks();
  });

  describe('windowFunction', () => {
    it('should generate a basic window function', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p']
        })
        .toCypher();

      expect(query).toContain('MATCH (p:Person)');
      expect(query).toContain('RETURN count(p) OVER () AS personCount');
    });

    it('should support PARTITION BY', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p'],
          partitionBy: ['p.age']
        })
        .toCypher();

      expect(query).toContain('RETURN count(p) OVER (PARTITION BY p.age ) AS personCount');
    });

    it('should support ORDER BY', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p'],
          orderBy: [{ expression: 'p.name' }]
        })
        .toCypher();

      expect(query).toContain('RETURN count(p) OVER (ORDER BY p.name ASC ) AS personCount');
    });

    it('should support ORDER BY with direction', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p'],
          orderBy: [{ expression: 'p.name', direction: 'DESC' }]
        })
        .toCypher();

      expect(query).toContain('RETURN count(p) OVER (ORDER BY p.name DESC ) AS personCount');
    });

    it('should support frame specification', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p'],
          frame: {
            type: 'ROWS',
            start: 'UNBOUNDED PRECEDING',
            end: 'CURRENT ROW'
          }
        })
        .toCypher();

      expect(query).toContain('RETURN count(p) OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS personCount');
    });

    it('should support numeric frame bounds', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p'],
          frame: {
            type: 'ROWS',
            start: 3,
            end: 2
          }
        })
        .toCypher();

      expect(query).toContain('RETURN count(p) OVER (ROWS BETWEEN 3 PRECEDING AND 2 FOLLOWING) AS personCount');
    });

    it('should support complex window function specifications', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .windowFunction('count', 'personCount', {
          args: ['p'],
          partitionBy: ['p.age'],
          orderBy: [
            { expression: 'p.name', direction: 'ASC' },
            { expression: 'p.active', direction: 'DESC' }
          ],
          frame: {
            type: 'ROWS',
            start: 'UNBOUNDED PRECEDING',
            end: 'CURRENT ROW'
          }
        })
        .toCypher();

      expect(query).toContain('RETURN count(p) OVER (PARTITION BY p.age ORDER BY p.name ASC, p.active DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS personCount');
    });
  });

  describe('specific window functions', () => {
    it('should generate ROW_NUMBER function', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .rowNumber('rowNum', {
          orderBy: [{ expression: 'p.name' }]
        })
        .toCypher();

      expect(query).toContain('RETURN row_number() OVER (ORDER BY p.name ASC ) AS rowNum');
    });

    it('should generate RANK function', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .rank('personRank', {
          orderBy: [{ expression: 'p.age', direction: 'DESC' }]
        })
        .toCypher();

      expect(query).toContain('RETURN rank() OVER (ORDER BY p.age DESC ) AS personRank');
    });

    it('should generate DENSE_RANK function', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .denseRank('denseRank', {
          orderBy: [{ expression: 'p.age', direction: 'DESC' }]
        })
        .toCypher();

      expect(query).toContain('RETURN dense_rank() OVER (ORDER BY p.age DESC ) AS denseRank');
    });
  });
});
