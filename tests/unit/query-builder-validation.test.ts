/**
 * Unit tests for query builder validation
 */

import { describe, it, expect, vi } from 'vitest';
import { QueryBuilder } from '../../src/query/builder';
import { QueryExecutor } from '../../src/db/query';
import { SchemaDefinition } from '../../src/schema/types';

// Mock schema
const mockSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        age: { type: 'integer' }
      },
      required: ['id', 'name']
    },
    Movie: {
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        year: { type: 'integer' }
      },
      required: ['id', 'title']
    }
  },
  edges: {
    DIRECTED: {
      properties: {},
      fromVertex: 'Person',
      toVertex: 'Movie'
    }
  },
  metadata: {}
};

// Mock query executor
const mockExecutor = {
  executeCypher: vi.fn().mockResolvedValue({ rows: [] }),
  executeSQL: vi.fn().mockResolvedValue({ rows: [] })
} as unknown as QueryExecutor;

describe('QueryBuilder Validation', () => {
  describe('validateQuery', () => {
    it('should detect undefined variable in RETURN clause', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .return('q.name'); // 'q' is not defined
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Variable 'q' is not defined");
      expect(errors[0]).toContain("RETURN clause");
      expect(errors[0]).toContain("Did you mean: p?");
    });

    it('should detect undefined variable in WHERE clause', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .where('q.age > 25') // 'q' is not defined
        .return('p');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Variable 'q' is not defined");
      expect(errors[0]).toContain("WHERE clause");
      expect(errors[0]).toContain("Did you mean: p?");
    });

    it('should detect multiple undefined variables', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .where('x.age > 25 AND y.name = "John"')
        .return('z.title');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(3);
      expect(errors.some(e => e.includes("Variable 'x' is not defined"))).toBe(true);
      expect(errors.some(e => e.includes("Variable 'y' is not defined"))).toBe(true);
      expect(errors.some(e => e.includes("Variable 'z' is not defined"))).toBe(true);
    });

    it('should suggest similar variable names', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'person')
        .done()
        .match('Movie', 'movie')
        .done()
        .return('persan.name, movei.title'); // Typos
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain("Did you mean: person?");
      expect(errors[1]).toContain("Did you mean: movie?");
    });

    it('should show available variables when no suggestions', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p1')
        .done()
        .match('Person', 'p2')
        .done()
        .where('xyz.id = 1')
        .return('p1, p2');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Variable 'xyz' is not defined");
      expect(errors[0]).toContain("Available variables: p1, p2");
    });

    it('should handle queries with no defined variables', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder.return('x.name'); // No MATCH clause
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Variable 'x' is not defined");
      expect(errors[0]).toContain("No variables have been defined in MATCH clauses");
    });

    it('should not report errors for valid queries', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .match('Movie', 'm')
        .done()
        .where('m.year > 2000')
        .return('p.name, m.title');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(0);
    });

    it('should recognize edge aliases', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .match('p', 'DIRECTED', 'm', 'rel')
        .where('rel.year = 2023')
        .return('p, m, rel');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(0);
    });

    it('should recognize variables defined in WITH clause', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .with('p.age AS age', 'p.name AS name')
        .return('age, name');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(0);
    });

    it('should not flag built-in functions as undefined variables', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .return('count(p), avg(p.age), collect(p.name)');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(0);
    });

    it('should not flag keywords as undefined variables', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .where('NOT exists(p.email)')
        .return('p');
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(0);
    });

    it('should handle ORDER BY validation', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .return('p')
        .orderBy('q.age'); // 'q' is not defined
      
      const errors = queryBuilder.validateQuery();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Variable 'q' is not defined");
      expect(errors[0]).toContain("ORDER BY clause");
    });
  });

  describe('execute with validation', () => {
    it('should throw error on validation failure by default', async () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .return('q.name'); // 'q' is not defined
      
      await expect(queryBuilder.execute()).rejects.toThrow('Query validation failed');
    });

    it('should skip validation when validate option is false', async () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .return('q.name'); // 'q' is not defined
      
      // Should not throw with validation disabled
      await expect(queryBuilder.execute({ validate: false })).resolves.toBeDefined();
    });

    it('should include all validation errors in exception', async () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('Person', 'p')
        .done()
        .where('x.age > 25')
        .return('y.name');
      
      try {
        await queryBuilder.execute();
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain("Variable 'x' is not defined");
        expect(error.message).toContain("Variable 'y' is not defined");
      }
    });
  });

  describe('validateSchema', () => {
    it('should still validate schema separately', () => {
      const queryBuilder = new QueryBuilder(mockSchema, mockExecutor, 'test_graph');
      
      queryBuilder
        .match('InvalidVertex', 'v') // Invalid vertex type
        .done()
        .return('v');
      
      const errors = queryBuilder.validateSchema();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid vertex label: InvalidVertex');
    });
  });
});