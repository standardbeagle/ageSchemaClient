/**
 * Tests for SQL Generator
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
        active: {
          type: PropertyType.BOOLEAN,
          description: 'Whether the person is active',
        },
        metadata: {
          type: PropertyType.OBJECT,
          description: 'Additional metadata',
        },
      },
      required: ['name'],
      description: 'Person vertex',
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
  },
};

describe('SQLGenerator', () => {
  it('should create a SQLGenerator instance', () => {
    const generator = new SQLGenerator(testSchema);
    expect(generator).toBeDefined();
  });

  it('should throw an error for invalid schema', () => {
    expect(() => new SQLGenerator({} as any)).toThrow('Invalid schema definition');
  });

  it('should generate CREATE TABLE statement for a vertex', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateCreateVertexTableSQL('Person');

    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS');
    expect(result.sql).toContain('"v_Person"');
    expect(result.sql).toContain('"id" UUID PRIMARY KEY');
    expect(result.sql).toContain('"name" TEXT NOT NULL');
    expect(result.sql).toContain('"age" INTEGER NULL');
    expect(result.sql).toContain('"active" BOOLEAN NULL');
    expect(result.sql).toContain('"metadata" JSONB NULL');
    expect(result.sql).toContain('"created_at" TIMESTAMP WITH TIME ZONE');
    expect(result.sql).toContain('"updated_at" TIMESTAMP WITH TIME ZONE');
    expect(result.params).toEqual([]);
  });

  it('should throw an error for non-existent vertex label', () => {
    const generator = new SQLGenerator(testSchema);
    expect(() => generator.generateCreateVertexTableSQL('NonExistent')).toThrow(
      'Vertex label NonExistent not found in schema'
    );
  });

  it('should generate INSERT statement for a vertex', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateInsertVertexSQL('Person', {
      name: 'John Doe',
      age: 30,
      active: true,
    });

    expect(result.sql).toContain('INSERT INTO "v_Person"');
    expect(result.sql).toContain('("id", "name", "age", "active")');
    expect(result.sql).toContain('VALUES ($1, $2, $3, $4)');
    expect(result.sql).toContain('RETURNING *');
    expect(result.params[0]).toContain('uuid_generate_v4()');
    expect(result.params[1]).toBe('John Doe');
    expect(result.params[2]).toBe(30);
    expect(result.params[3]).toBe(true);
  });

  it('should generate batch INSERT statement for vertices', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateBatchInsertVertexSQL('Person', [
      {
        name: 'John Doe',
        age: 30,
        active: true,
      },
      {
        name: 'Jane Smith',
        age: 25,
        active: false,
      },
    ]);

    expect(result.sql).toContain('INSERT INTO "v_Person"');
    expect(result.sql).toContain('("id", "name", "age", "active")');
    expect(result.sql).toContain('VALUES ($1, $2, $3, $4)');
    expect(result.sql).toContain('($5, $6, $7, $8)');
    expect(result.sql).toContain('RETURNING *');
    expect(result.params.length).toBe(8);
    expect(result.params[1]).toBe('John Doe');
    expect(result.params[2]).toBe(30);
    expect(result.params[3]).toBe(true);
    expect(result.params[5]).toBe('Jane Smith');
    expect(result.params[6]).toBe(25);
    expect(result.params[7]).toBe(false);
  });

  it('should generate UPDATE statement for a vertex', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateUpdateVertexSQL('Person', '123e4567-e89b-12d3-a456-426614174000', {
      name: 'Updated Name',
      age: 31,
    });

    expect(result.sql).toContain('UPDATE "v_Person"');
    expect(result.sql).toContain('SET "name" = $1');
    expect(result.sql).toContain('"age" = $2');
    expect(result.sql).toContain('"updated_at" = CURRENT_TIMESTAMP');
    expect(result.sql).toContain('WHERE "id" = $3');
    expect(result.sql).toContain('RETURNING *');
    expect(result.params[0]).toBe('Updated Name');
    expect(result.params[1]).toBe(31);
    expect(result.params[2]).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should generate DELETE statement for a vertex', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateDeleteVertexSQL('Person', '123e4567-e89b-12d3-a456-426614174000');

    expect(result.sql).toContain('DELETE FROM "v_Person"');
    expect(result.sql).toContain('WHERE "id" = $1');
    expect(result.sql).toContain('RETURNING *');
    expect(result.params[0]).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should generate SELECT statement for vertices with filters', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateSelectVertexSQL('Person', {
      filters: [
        { property: 'name', operator: '=', value: 'John Doe' },
        { property: 'age', operator: '>', value: 25 },
      ],
      orderBy: [{ property: 'name', direction: 'ASC' }],
      limit: 10,
      offset: 0,
    });

    expect(result.sql).toContain('SELECT * FROM "v_Person"');
    expect(result.sql).toContain('WHERE "name" = $1 AND "age" > $2');
    expect(result.sql).toContain('ORDER BY "name" ASC');
    expect(result.sql).toContain('LIMIT $3');
    expect(result.sql).toContain('OFFSET $4');
    expect(result.params[0]).toBe('John Doe');
    expect(result.params[1]).toBe(25);
    expect(result.params[2]).toBe(10);
    expect(result.params[3]).toBe(0);
  });

  it('should generate vertex filter function SQL', () => {
    const generator = new SQLGenerator(testSchema);
    const result = generator.generateVertexFilterFunctionSQL('Person');

    expect(result.sql).toContain('CREATE OR REPLACE FUNCTION "filter_Person_vertices"');
    expect(result.sql).toContain('p_name TEXT DEFAULT NULL');
    expect(result.sql).toContain('p_age INTEGER DEFAULT NULL');
    expect(result.sql).toContain('p_active BOOLEAN DEFAULT NULL');
    expect(result.sql).toContain('p_metadata JSONB DEFAULT NULL');
    expect(result.sql).toContain('RETURNS TABLE');
    expect(result.sql).toContain('"id" UUID');
    expect(result.sql).toContain('WHERE (p_name IS NULL OR "name" = p_name)');
    expect(result.sql).toContain('AND (p_age IS NULL OR "age" = p_age)');
    expect(result.sql).toContain('LANGUAGE plpgsql');
    expect(result.params).toEqual([]);
  });

  it('should generate transaction SQL statements', () => {
    const generator = new SQLGenerator(testSchema);

    const beginResult = generator.generateTransactionSQL(SQLTransactionType.BEGIN);
    expect(beginResult.sql).toBe('BEGIN');
    expect(beginResult.params).toEqual([]);

    const commitResult = generator.generateTransactionSQL(SQLTransactionType.COMMIT);
    expect(commitResult.sql).toBe('COMMIT');
    expect(commitResult.params).toEqual([]);

    const rollbackResult = generator.generateTransactionSQL(SQLTransactionType.ROLLBACK);
    expect(rollbackResult.sql).toBe('ROLLBACK');
    expect(rollbackResult.params).toEqual([]);

    const savepointResult = generator.generateTransactionSQL(SQLTransactionType.SAVEPOINT, 'save1');
    expect(savepointResult.sql).toBe('SAVEPOINT "save1"');
    expect(savepointResult.params).toEqual([]);

    const rollbackToResult = generator.generateTransactionSQL(SQLTransactionType.ROLLBACK, 'save1');
    expect(rollbackToResult.sql).toBe('ROLLBACK TO SAVEPOINT "save1"');
    expect(rollbackToResult.params).toEqual([]);

    const releaseResult = generator.generateTransactionSQL(SQLTransactionType.RELEASE, 'save1');
    expect(releaseResult.sql).toBe('RELEASE SAVEPOINT "save1"');
    expect(releaseResult.params).toEqual([]);
  });

  it('should throw an error for savepoint operations without a name', () => {
    const generator = new SQLGenerator(testSchema);

    expect(() => generator.generateTransactionSQL(SQLTransactionType.SAVEPOINT)).toThrow('Savepoint name is required');
    expect(() => generator.generateTransactionSQL(SQLTransactionType.RELEASE)).toThrow('Savepoint name is required');
  });

  it('should generate batch SQL with multiple operations', () => {
    const generator = new SQLGenerator(testSchema);

    const insertResult = generator.generateInsertVertexSQL('Person', {
      name: 'John Doe',
      age: 30,
    });

    const updateResult = generator.generateUpdateVertexSQL('Person', '123e4567-e89b-12d3-a456-426614174000', {
      age: 31,
    });

    const batchResult = generator.generateBatchSQL([insertResult, updateResult]);

    expect(batchResult.sql).toContain('BEGIN');
    expect(batchResult.sql).toContain('INSERT INTO "v_Person"');
    expect(batchResult.sql).toContain('UPDATE "v_Person"');
    expect(batchResult.sql).toContain('COMMIT');

    // Check parameter adjustment
    expect(batchResult.sql).toContain('VALUES ($1, $2, $3)');
    expect(batchResult.sql).toContain('SET "age" = $4');
    expect(batchResult.sql).toContain('WHERE "id" = $5');

    expect(batchResult.params.length).toBe(5);
    expect(batchResult.params[0]).toContain('uuid_generate_v4()');
    expect(batchResult.params[1]).toBe('John Doe');
    expect(batchResult.params[2]).toBe(30);
    expect(batchResult.params[3]).toBe(31);
    expect(batchResult.params[4]).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw an error for empty batch operations', () => {
    const generator = new SQLGenerator(testSchema);
    expect(() => generator.generateBatchSQL([])).toThrow('Operations array cannot be empty');
  });
});
