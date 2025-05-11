/**
 * Tests for the schema migration executor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SchemaMigrationExecutor, MigrationPlan, MigrationStep } from '../../src/schema/migration-executor';
import { SchemaDefinition } from '../../src/schema/types';
import { SQLGenerator } from '../../src/sql/generator';
import { QueryExecutor } from '../../src/db/query';
import { extendSQLGeneratorWithMigrationMethods } from '../../src/sql/migration';

// Extend SQLGenerator with migration methods
extendSQLGeneratorWithMigrationMethods(SQLGenerator);

describe('SchemaMigrationExecutor', () => {
  let mockQueryExecutor: any;
  let sqlGenerator: SQLGenerator;
  let migrationExecutor: SchemaMigrationExecutor;

  // Sample schemas for testing
  const sourceSchema: SchemaDefinition = {
    version: '1.0.0',
    vertices: {
      Person: {
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
        required: ['name'],
      },
    },
    edges: {
      KNOWS: {
        properties: {
          since: { type: 'date' },
        },
        fromVertex: 'Person',
        toVertex: 'Person',
      },
    },
  };

  const targetSchema: SchemaDefinition = {
    version: '1.1.0',
    vertices: {
      Person: {
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          email: { type: 'string' }, // Added property
        },
        required: ['name', 'email'], // Added required property
      },
      Company: { // Added vertex
        properties: {
          name: { type: 'string' },
          founded: { type: 'date' },
        },
        required: ['name'],
      },
    },
    edges: {
      KNOWS: {
        properties: {
          since: { type: 'date' },
          strength: { type: 'integer' }, // Added property
        },
        fromVertex: 'Person',
        toVertex: 'Person',
      },
      WORKS_AT: { // Added edge
        properties: {
          since: { type: 'date' },
          position: { type: 'string' },
        },
        fromVertex: 'Person',
        toVertex: 'Company',
        required: ['position'],
      },
    },
  };

  beforeEach(() => {
    // Create mocks
    const mockTransaction = {
      commit: vi.fn().mockResolvedValue({}),
      rollback: vi.fn().mockResolvedValue({}),
    };

    mockQueryExecutor = {
      executeSQL: vi.fn().mockResolvedValue({ rows: [] }),
      beginTransaction: vi.fn().mockResolvedValue(mockTransaction),
    };

    // Create SQL generator with the target schema to handle new entities
    sqlGenerator = new SQLGenerator(targetSchema);

    // Create migration executor with default options
    migrationExecutor = new SchemaMigrationExecutor(mockQueryExecutor, sqlGenerator, {
      vertexTablePrefix: 'v_',
      edgeTablePrefix: 'e_'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createMigrationPlan', () => {
    it('should create a migration plan with steps for schema changes', () => {
      const plan = migrationExecutor.createMigrationPlan(sourceSchema, targetSchema, { allowDataLoss: true });

      expect(plan).toBeDefined();
      expect(plan.sourceVersion).toBe('1.0.0');
      expect(plan.targetVersion).toBe('1.1.0');
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.canCauseDataLoss).toBe(true);

      // Check for specific migration steps
      const stepDescriptions = plan.steps.map(step => step.description);

      // Vertex changes
      expect(stepDescriptions).toContain("Create vertex table for label 'Company'");
      expect(stepDescriptions).toContain("Add column 'email' to vertex table 'Person'");
      expect(stepDescriptions).toContain("Add NOT NULL constraint to column 'email' in vertex table 'Person'");

      // Edge changes
      expect(stepDescriptions).toContain("Create edge table for label 'WORKS_AT'");
      expect(stepDescriptions).toContain("Add column 'strength' to edge table 'KNOWS'");
    });

    it('should throw an error when data loss is possible and not allowed', () => {
      expect(() => {
        migrationExecutor.createMigrationPlan(sourceSchema, targetSchema, { allowDataLoss: false });
      }).toThrow(/Migration contains changes that can cause data loss/);
    });
  });

  describe('executeMigrationPlan', () => {
    it('should execute a migration plan', async () => {
      const plan: MigrationPlan = {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        steps: [
          {
            description: 'Test step 1',
            sql: 'SELECT 1',
            params: [],
            canCauseDataLoss: false,
          },
          {
            description: 'Test step 2',
            sql: 'SELECT 2',
            params: [],
            canCauseDataLoss: false,
          },
        ],
        canCauseDataLoss: false,
      };

      const result = await migrationExecutor.executeMigrationPlan(plan, { execute: true });

      expect(result.success).toBe(true);
      expect(result.executedSteps).toBe(2);
      expect(result.totalSteps).toBe(2);
      expect(mockQueryExecutor.executeSQL).toHaveBeenCalledTimes(3); // 2 steps + 1 backup
      expect(mockQueryExecutor.beginTransaction).toHaveBeenCalledTimes(1);
    });

    it('should not execute a migration plan when execute is false', async () => {
      const plan: MigrationPlan = {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        steps: [
          {
            description: 'Test step',
            sql: 'SELECT 1',
            params: [],
            canCauseDataLoss: false,
          },
        ],
        canCauseDataLoss: false,
      };

      const result = await migrationExecutor.executeMigrationPlan(plan, { execute: false });

      expect(result.success).toBe(true);
      expect(result.executedSteps).toBe(0);
      expect(result.totalSteps).toBe(1);
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalled();
      expect(mockQueryExecutor.beginTransaction).not.toHaveBeenCalled();
    });

    it('should not execute a migration plan when data loss is possible and not allowed', async () => {
      const plan: MigrationPlan = {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        steps: [
          {
            description: 'Test step with data loss',
            sql: 'DROP TABLE test',
            params: [],
            canCauseDataLoss: true,
          },
        ],
        canCauseDataLoss: true,
      };

      const result = await migrationExecutor.executeMigrationPlan(plan, {
        execute: true,
        allowDataLoss: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Migration can cause data loss');
      expect(result.executedSteps).toBe(0);
      expect(mockQueryExecutor.executeSQL).not.toHaveBeenCalled();
    });

    it('should handle errors during migration execution', async () => {
      const plan: MigrationPlan = {
        sourceVersion: '1.0.0',
        targetVersion: '1.1.0',
        steps: [
          {
            description: 'Test step that will fail',
            sql: 'INVALID SQL',
            params: [],
            canCauseDataLoss: false,
          },
        ],
        canCauseDataLoss: false,
      };

      // Mock executeSQL to throw an error
      mockQueryExecutor.executeSQL.mockRejectedValueOnce(new Error('SQL syntax error'));

      const result = await migrationExecutor.executeMigrationPlan(plan, {
        execute: true,
        createBackup: false, // Skip backup for this test
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('SQL syntax error');
      expect(result.executedSteps).toBe(0);
      expect(mockQueryExecutor.beginTransaction).toHaveBeenCalledTimes(1);

      // Get the mock transaction that was returned by beginTransaction
      const mockTransaction = await mockQueryExecutor.beginTransaction();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
  });
});
