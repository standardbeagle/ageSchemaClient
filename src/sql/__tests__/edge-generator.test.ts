/**
 * Tests for SQL Generator Edge Operations
 */

import { describe, it, expect } from 'vitest';
import { SQLGenerator } from '../generator';
import { SchemaDefinition, PropertyType } from '../../schema/types';
import { SQLTransactionType } from '../types';

// Sample schema for testing
const testSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: {
          type: PropertyType.STRING,
          description: 'Person name',
        },
        age: {
          type: PropertyType.INTEGER,
          description: 'Person age',
        },
      },
      required: ['name'],
      description: 'Person vertex',
    },
    Company: {
      properties: {
        name: {
          type: PropertyType.STRING,
          description: 'Company name',
        },
        founded: {
          type: PropertyType.DATE,
          description: 'Company founding date',
        },
      },
      required: ['name'],
      description: 'Company vertex',
    },
  },
  edges: {
    KNOWS: {
      properties: {
        since: {
          type: PropertyType.DATE,
          description: 'When the relationship started',
        },
        strength: {
          type: PropertyType.NUMBER,
          description: 'Relationship strength',
        },
      },
      fromVertex: 'Person',
      toVertex: 'Person',
      description: 'Person knows person relationship',
    },
    WORKS_AT: {
      properties: {
        since: {
          type: PropertyType.DATE,
          description: 'Employment start date',
        },
        title: {
          type: PropertyType.STRING,
          description: 'Job title',
        },
        salary: {
          type: PropertyType.NUMBER,
          description: 'Salary amount',
        },
      },
      required: ['since', 'title'],
      fromVertex: 'Person',
      toVertex: 'Company',
      description: 'Person works at company relationship',
    },
  },
};

describe('SQLGenerator Edge Operations', () => {
  let generator: SQLGenerator;

  beforeEach(() => {
    generator = new SQLGenerator(testSchema);
  });

  describe('generateCreateEdgeTableSQL', () => {
    it('should generate CREATE TABLE statement for an edge label', () => {
      const result = generator.generateCreateEdgeTableSQL('KNOWS');

      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS "e_KNOWS"');
      expect(result.sql).toContain('"id" UUID PRIMARY KEY');
      expect(result.sql).toContain('"source_id" UUID NOT NULL');
      expect(result.sql).toContain('"target_id" UUID NOT NULL');
      expect(result.sql).toContain('"since" DATE NULL');
      expect(result.sql).toContain('"strength" DOUBLE PRECISION NULL');
      expect(result.sql).toContain('"created_at" TIMESTAMP WITH TIME ZONE');
      expect(result.sql).toContain('"updated_at" TIMESTAMP WITH TIME ZONE');
      expect(result.sql).toContain('FOREIGN KEY ("source_id") REFERENCES "v_Person"("id")');
      expect(result.sql).toContain('FOREIGN KEY ("target_id") REFERENCES "v_Person"("id")');
    });

    it('should handle required properties correctly', () => {
      const result = generator.generateCreateEdgeTableSQL('WORKS_AT');

      expect(result.sql).toContain('"since" DATE NOT NULL');
      expect(result.sql).toContain('"title" TEXT NOT NULL');
      expect(result.sql).toContain('"salary" DOUBLE PRECISION NULL');
    });

    it('should throw an error for non-existent edge label', () => {
      expect(() => generator.generateCreateEdgeTableSQL('INVALID_LABEL')).toThrow(
        'Edge label INVALID_LABEL not found in schema'
      );
    });
  });

  describe('generateInsertEdgeSQL', () => {
    it('should generate INSERT statement for an edge', () => {
      const result = generator.generateInsertEdgeSQL(
        'KNOWS',
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        {
          since: new Date('2023-01-01'),
          strength: 0.8,
        }
      );

      expect(result.sql).toContain('INSERT INTO "e_KNOWS"');
      expect(result.sql).toContain('"id", "source_id", "target_id", "since", "strength"');
      expect(result.sql).toContain('VALUES ($1, $2, $3, $4, $5)');
      expect(result.params).toHaveLength(5);
      expect(result.params[0]).toBe('uuid_generate_v4()');
      expect(result.params[1]).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.params[2]).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(result.params[3]).toBeInstanceOf(Date);
      expect(result.params[4]).toBe(0.8);
    });

    it('should handle custom edge ID', () => {
      const result = generator.generateInsertEdgeSQL(
        'KNOWS',
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          since: new Date('2023-01-01'),
        }
      );

      expect(result.params[0]).toBe('123e4567-e89b-12d3-a456-426614174002');
    });
  });

  describe('generateBatchInsertEdgeSQL', () => {
    it('should generate batch INSERT statement for multiple edges', () => {
      const result = generator.generateBatchInsertEdgeSQL('KNOWS', [
        {
          sourceId: '123e4567-e89b-12d3-a456-426614174000',
          targetId: '123e4567-e89b-12d3-a456-426614174001',
          data: {
            since: new Date('2023-01-01'),
            strength: 0.8,
          },
        },
        {
          sourceId: '123e4567-e89b-12d3-a456-426614174002',
          targetId: '123e4567-e89b-12d3-a456-426614174003',
          data: {
            since: new Date('2023-02-01'),
            strength: 0.5,
          },
        },
      ]);

      expect(result.sql).toContain('INSERT INTO "e_KNOWS"');
      expect(result.sql).toContain('"id", "source_id", "target_id", "since", "strength"');
      expect(result.sql).toContain('VALUES');
      expect(result.sql).toMatch(/\(\$\d+, \$\d+, \$\d+, \$\d+, \$\d+\)/);
      expect(result.params).toHaveLength(10);
    });

    it('should throw an error for empty edges array', () => {
      expect(() => generator.generateBatchInsertEdgeSQL('KNOWS', [])).toThrow(
        'Edges array cannot be empty'
      );
    });
  });

  describe('generateUpdateEdgeSQL', () => {
    it('should generate UPDATE statement for an edge', () => {
      const result = generator.generateUpdateEdgeSQL(
        'KNOWS',
        '123e4567-e89b-12d3-a456-426614174000',
        {
          strength: 0.9,
        }
      );

      expect(result.sql).toContain('UPDATE "e_KNOWS"');
      expect(result.sql).toContain('SET "strength" = $1');
      expect(result.sql).toContain('"updated_at" = CURRENT_TIMESTAMP');
      expect(result.sql).toContain('WHERE "id" = $2');
      expect(result.params).toHaveLength(2);
      expect(result.params[0]).toBe(0.9);
      expect(result.params[1]).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('generateDeleteEdgeSQL', () => {
    it('should generate DELETE statement for an edge by ID', () => {
      const result = generator.generateDeleteEdgeSQL(
        'KNOWS',
        '123e4567-e89b-12d3-a456-426614174000'
      );

      expect(result.sql).toContain('DELETE FROM "e_KNOWS"');
      expect(result.sql).toContain('WHERE "id" = $1');
      expect(result.params).toHaveLength(1);
      expect(result.params[0]).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('generateDeleteEdgesBetweenVerticesSQL', () => {
    it('should generate DELETE statement for edges between vertices', () => {
      const result = generator.generateDeleteEdgesBetweenVerticesSQL(
        'KNOWS',
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001'
      );

      expect(result.sql).toContain('DELETE FROM "e_KNOWS"');
      expect(result.sql).toContain('WHERE "source_id" = $1');
      expect(result.sql).toContain('AND "target_id" = $2');
      expect(result.params).toHaveLength(2);
      expect(result.params[0]).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.params[1]).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('generateSelectEdgeSQL', () => {
    it('should generate SELECT statement for edges', () => {
      const result = generator.generateSelectEdgeSQL('KNOWS');

      expect(result.sql).toContain('SELECT * FROM "e_KNOWS"');
      expect(result.params).toHaveLength(0);
    });

    it('should handle filters correctly', () => {
      const result = generator.generateSelectEdgeSQL('KNOWS', {
        filters: [
          { property: 'strength', operator: '>', value: 0.5 },
          { property: 'source_id', operator: '=', value: '123e4567-e89b-12d3-a456-426614174000' },
        ],
      });

      expect(result.sql).toContain('WHERE "strength" > $1 AND "source_id" = $2');
      expect(result.params).toHaveLength(2);
      expect(result.params[0]).toBe(0.5);
      expect(result.params[1]).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should handle ordering, limit, and offset', () => {
      const result = generator.generateSelectEdgeSQL('KNOWS', {
        orderBy: [{ property: 'strength', direction: 'DESC' }],
        limit: 10,
        offset: 20,
      });

      expect(result.sql).toContain('ORDER BY "strength" DESC');
      expect(result.sql).toContain('LIMIT $1');
      expect(result.sql).toContain('OFFSET $2');
      expect(result.params).toHaveLength(2);
      expect(result.params[0]).toBe(10);
      expect(result.params[1]).toBe(20);
    });
  });

  describe('generateEdgeFilterFunctionSQL', () => {
    it('should generate a filter function for edges', () => {
      const result = generator.generateEdgeFilterFunctionSQL('KNOWS');

      expect(result.sql).toContain('CREATE OR REPLACE FUNCTION "filter_KNOWS_edges"');
      expect(result.sql).toContain('p_source_id UUID DEFAULT NULL');
      expect(result.sql).toContain('p_target_id UUID DEFAULT NULL');
      expect(result.sql).toContain('p_since DATE DEFAULT NULL');
      expect(result.sql).toContain('p_strength DOUBLE PRECISION DEFAULT NULL');
      expect(result.sql).toContain('RETURNS TABLE');
      expect(result.sql).toContain('"id" UUID');
      expect(result.sql).toContain('"source_id" UUID');
      expect(result.sql).toContain('"target_id" UUID');
      expect(result.sql).toContain('"since" DATE');
      expect(result.sql).toContain('"strength" DOUBLE PRECISION');
      expect(result.sql).toContain('(p_source_id IS NULL OR "source_id" = p_source_id)');
      expect(result.sql).toContain('(p_target_id IS NULL OR "target_id" = p_target_id)');
      expect(result.sql).toContain('(p_since IS NULL OR "since" = p_since)');
      expect(result.sql).toContain('(p_strength IS NULL OR "strength" = p_strength)');
    });
  });
});
