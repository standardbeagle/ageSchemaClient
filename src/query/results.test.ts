/**
 * Tests for the query result processing utilities
 */

import { describe, it, expect } from 'vitest';
import { ResultProcessor, ResultProcessingOptions } from './results';
import { QueryResult } from '../db/query';

describe('ResultProcessor', () => {
  describe('process', () => {
    it('should return an empty array for null or undefined result', () => {
      expect(ResultProcessor.process(null as any)).toEqual([]);
      expect(ResultProcessor.process(undefined as any)).toEqual([]);
      expect(ResultProcessor.process({ rows: null } as any)).toEqual([]);
    });

    it('should process a simple result', () => {
      const result: QueryResult = {
        rows: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 }
        ]
      };

      const processed = ResultProcessor.process(result);
      expect(processed).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
    });

    it('should remove null values when removeNulls is true', () => {
      const result: QueryResult = {
        rows: [
          { name: 'Alice', age: 30, email: null },
          { name: 'Bob', age: null, email: 'bob@example.com' }
        ]
      };

      const options: ResultProcessingOptions = {
        removeNulls: true
      };

      const processed = ResultProcessor.process(result, options);
      expect(processed).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', email: 'bob@example.com' }
      ]);
    });

    it('should parse date strings when parseDates is true', () => {
      const result: QueryResult = {
        rows: [
          { name: 'Alice', birthdate: '1990-01-01' },
          { name: 'Bob', birthdate: '1995-05-15T12:00:00Z' }
        ]
      };

      const options: ResultProcessingOptions = {
        parseDates: true
      };

      const processed = ResultProcessor.process(result, options);
      expect(processed[0].birthdate).toBeInstanceOf(Date);
      expect(processed[1].birthdate).toBeInstanceOf(Date);

      // Use toEqual instead of toBe for date comparison to avoid timezone issues
      expect(processed[0].birthdate.toISOString().startsWith('1990-01-01')).toBe(true);
      expect(processed[1].birthdate.toISOString().startsWith('1995-05-15')).toBe(true);
    });

    it('should parse numeric strings when parseNumbers is true', () => {
      const result: QueryResult = {
        rows: [
          { name: 'Alice', score: '95.5', id: '1001' },
          { name: 'Bob', score: '87', id: '1002' }
        ]
      };

      const options: ResultProcessingOptions = {
        parseNumbers: true
      };

      const processed = ResultProcessor.process(result, options);
      expect(processed).toEqual([
        { name: 'Alice', score: 95.5, id: 1001 },
        { name: 'Bob', score: 87, id: 1002 }
      ]);
    });

    it('should flatten nested objects when flatten is true', () => {
      const result: QueryResult = {
        rows: [
          {
            name: 'Alice',
            address: {
              city: 'New York',
              zip: '10001',
              geo: {
                lat: 40.7128,
                lng: -74.0060
              }
            }
          }
        ]
      };

      const options: ResultProcessingOptions = {
        flatten: true
      };

      const processed = ResultProcessor.process(result, options);
      expect(processed).toEqual([
        {
          name: 'Alice',
          'address.city': 'New York',
          'address.zip': '10001',
          'address.geo.lat': 40.7128,
          'address.geo.lng': -74.0060
        }
      ]);
    });

    it('should expand paths when expandPaths is true', () => {
      const result: QueryResult = {
        rows: [
          {
            path: {
              nodes: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
              relationships: [{ id: 101, type: 'KNOWS' }],
              length: 1
            }
          }
        ]
      };

      const options: ResultProcessingOptions = {
        expandPaths: true
      };

      const processed = ResultProcessor.process(result, options);
      expect(processed).toEqual([
        {
          path: {
            nodes: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
            relationships: [{ id: 101, type: 'KNOWS' }],
            length: 1
          }
        }
      ]);
    });

    it('should apply custom transformers', () => {
      const result: QueryResult = {
        rows: [
          { name: 'alice', score: 95 },
          { name: 'bob', score: 87 }
        ]
      };

      const options: ResultProcessingOptions = {
        transformers: {
          name: (value) => value.toUpperCase(),
          score: (value) => value * 2
        }
      };

      const processed = ResultProcessor.process(result, options);
      expect(processed).toEqual([
        { name: 'ALICE', score: 190 },
        { name: 'BOB', score: 174 }
      ]);
    });
  });

  describe('extractField', () => {
    it('should extract a specific field from all rows', () => {
      const result: QueryResult = {
        rows: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
          { name: 'Charlie', age: 35 }
        ]
      };

      const names = ResultProcessor.extractField(result, 'name');
      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should return an empty array for null or undefined result', () => {
      expect(ResultProcessor.extractField(null as any, 'name')).toEqual([]);
      expect(ResultProcessor.extractField(undefined as any, 'name')).toEqual([]);
      expect(ResultProcessor.extractField({ rows: null } as any, 'name')).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group results by a specific field', () => {
      const result: QueryResult = {
        rows: [
          { category: 'A', name: 'Alice', score: 95 },
          { category: 'B', name: 'Bob', score: 87 },
          { category: 'A', name: 'Charlie', score: 92 }
        ]
      };

      const grouped = ResultProcessor.groupBy(result, 'category');
      expect(Object.keys(grouped)).toEqual(['A', 'B']);
      expect(grouped['A'].length).toBe(2);
      expect(grouped['B'].length).toBe(1);
      expect(grouped['A'][0].name).toBe('Alice');
      expect(grouped['A'][1].name).toBe('Charlie');
      expect(grouped['B'][0].name).toBe('Bob');
    });

    it('should return an empty object for null or undefined result', () => {
      expect(ResultProcessor.groupBy(null as any, 'category')).toEqual({});
      expect(ResultProcessor.groupBy(undefined as any, 'category')).toEqual({});
      expect(ResultProcessor.groupBy({ rows: null } as any, 'category')).toEqual({});
    });
  });

  describe('toGraph', () => {
    it('should convert results to a graph structure', () => {
      const result: QueryResult = {
        rows: [
          {
            nodes: [
              { id: '1', name: 'Alice' },
              { id: '2', name: 'Bob' }
            ],
            relationships: [
              { id: '101', source: '1', target: '2', type: 'KNOWS' }
            ]
          },
          {
            nodes: [
              { id: '2', name: 'Bob' },
              { id: '3', name: 'Charlie' }
            ],
            relationships: [
              { id: '102', source: '2', target: '3', type: 'KNOWS' }
            ]
          }
        ]
      };

      const graph = ResultProcessor.toGraph(result);
      expect(graph.nodes.length).toBe(3); // Unique nodes
      expect(graph.edges.length).toBe(2); // Unique edges
    });

    it('should return empty arrays for null or undefined result', () => {
      expect(ResultProcessor.toGraph(null as any)).toEqual({ nodes: [], edges: [] });
      expect(ResultProcessor.toGraph(undefined as any)).toEqual({ nodes: [], edges: [] });
      expect(ResultProcessor.toGraph({ rows: null } as any)).toEqual({ nodes: [], edges: [] });
    });
  });
});
