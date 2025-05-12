/**
 * Schema migration executor
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from './types';
import { SQLGenerator } from '../sql/generator';
import { QueryExecutor } from '../db/query';
import { Transaction } from '../db/transaction';
import { compareSchemas, SchemaChange, SchemaChangeType } from './migration';
import { ValidationError } from '../core/errors';

// Import SQL extensions
import '../sql/extensions';

/**
 * Migration step
 */
export interface MigrationStep {
  /**
   * Step description
   */
  description: string;

  /**
   * SQL statement
   */
  sql: string;

  /**
   * SQL parameters
   */
  params: any[];

  /**
   * Whether this step can cause data loss
   */
  canCauseDataLoss: boolean;
}

/**
 * Migration plan
 */
export interface MigrationPlan {
  /**
   * Source schema version
   */
  sourceVersion: string;

  /**
   * Target schema version
   */
  targetVersion: string;

  /**
   * Migration steps
   */
  steps: MigrationStep[];

  /**
   * Whether the migration can cause data loss
   */
  canCauseDataLoss: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /**
   * Whether the migration was successful
   */
  success: boolean;

  /**
   * Error message if migration failed
   */
  error?: string;

  /**
   * Migration plan
   */
  plan: MigrationPlan;

  /**
   * Executed steps
   */
  executedSteps: number;

  /**
   * Total steps
   */
  totalSteps: number;
}

/**
 * Migration options
 */
export interface MigrationOptions {
  /**
   * Whether to allow data loss
   * @default false
   */
  allowDataLoss?: boolean;

  /**
   * Whether to execute the migration
   * @default false
   */
  execute?: boolean;

  /**
   * Whether to create a backup before migration
   * @default true
   */
  createBackup?: boolean;

  /**
   * Whether to log migration steps
   * @default true
   */
  logMigration?: boolean;
}

/**
 * Default migration options
 */
const DEFAULT_MIGRATION_OPTIONS: MigrationOptions = {
  allowDataLoss: false,
  execute: false,
  createBackup: true,
  logMigration: true,
};

/**
 * Schema migration executor options
 */
export interface SchemaMigrationExecutorOptions {
  /**
   * Table prefix for vertex tables
   * @default 'v_'
   */
  vertexTablePrefix?: string;

  /**
   * Table prefix for edge tables
   * @default 'e_'
   */
  edgeTablePrefix?: string;
}

/**
 * Default schema migration executor options
 */
const DEFAULT_EXECUTOR_OPTIONS: SchemaMigrationExecutorOptions = {
  vertexTablePrefix: 'v_',
  edgeTablePrefix: 'e_',
};

/**
 * Schema migration executor
 */
export class SchemaMigrationExecutor {
  /**
   * Options for the migration executor
   */
  private options: SchemaMigrationExecutorOptions;

  /**
   * Create a new schema migration executor
   *
   * @param queryExecutor - Query executor
   * @param sqlGenerator - SQL generator
   * @param options - Migration executor options
   */
  constructor(
    private queryExecutor: QueryExecutor,
    private sqlGenerator: SQLGenerator,
    options: SchemaMigrationExecutorOptions = {}
  ) {
    this.options = { ...DEFAULT_EXECUTOR_OPTIONS, ...options };
  }

  /**
   * Create a migration plan
   *
   * @param sourceSchema - Source schema
   * @param targetSchema - Target schema
   * @param options - Migration options
   * @returns Migration plan
   */
  createMigrationPlan(
    sourceSchema: SchemaDefinition,
    targetSchema: SchemaDefinition,
    options: MigrationOptions = {}
  ): MigrationPlan {
    const mergedOptions = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
    const changes = compareSchemas(sourceSchema, targetSchema);

    // Check for breaking changes that can cause data loss
    const dataLossChanges = changes.filter(change =>
      this.canChangeResultInDataLoss(change)
    );

    if (dataLossChanges.length > 0 && !mergedOptions.allowDataLoss) {
      throw new ValidationError(
        `Migration contains changes that can cause data loss: ${dataLossChanges.map(c => c.path).join(', ')}`
      );
    }

    const steps: MigrationStep[] = [];

    // Process changes to create migration steps
    for (const change of changes) {
      const migrationSteps = this.createMigrationStepsForChange(change, sourceSchema, targetSchema);
      steps.push(...migrationSteps);
    }

    return {
      sourceVersion: String(sourceSchema.version || 'unknown'),
      targetVersion: String(targetSchema.version || 'unknown'),
      steps,
      canCauseDataLoss: dataLossChanges.length > 0,
    };
  }

  /**
   * Execute a migration plan
   *
   * @param plan - Migration plan
   * @param options - Migration options
   * @returns Migration result
   */
  async executeMigrationPlan(
    plan: MigrationPlan,
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const mergedOptions = { ...DEFAULT_MIGRATION_OPTIONS, ...options };

    // Check if migration can cause data loss
    if (plan.canCauseDataLoss && !mergedOptions.allowDataLoss) {
      return {
        success: false,
        error: 'Migration can cause data loss and allowDataLoss is not enabled',
        plan,
        executedSteps: 0,
        totalSteps: plan.steps.length,
      };
    }

    // Check if migration should be executed
    if (!mergedOptions.execute) {
      return {
        success: true,
        plan,
        executedSteps: 0,
        totalSteps: plan.steps.length,
      };
    }

    // Create a transaction
    const transaction = await this.queryExecutor.beginTransaction();

    try {
      // Create a backup if requested
      if (mergedOptions.createBackup) {
        await this.createBackup(transaction);
      }

      // Execute migration steps
      let executedSteps = 0;

      for (const step of plan.steps) {
        if (mergedOptions.logMigration) {
          console.log(`Executing migration step: ${step.description}`);
        }

        await this.queryExecutor.executeSQL(step.sql, step.params, { transaction });
        executedSteps++;
      }

      // Commit transaction
      await transaction.commit();

      return {
        success: true,
        plan,
        executedSteps,
        totalSteps: plan.steps.length,
      };
    } catch (error) {
      // Rollback transaction
      await transaction.rollback();

      return {
        success: false,
        error: `Migration failed: ${(error as Error).message}`,
        plan,
        executedSteps: 0,
        totalSteps: plan.steps.length,
      };
    }
  }

  /**
   * Check if a schema change can result in data loss
   *
   * @param change - Schema change
   * @returns Whether the change can result in data loss
   * @private
   */
  private canChangeResultInDataLoss(change: SchemaChange): boolean {
    // Removing elements can cause data loss
    if (change.type === SchemaChangeType.REMOVED) {
      return true;
    }

    // Modifying elements can cause data loss in some cases
    if (change.type === SchemaChangeType.MODIFIED) {
      // Check if the path indicates a type change
      if (change.path.endsWith('.type')) {
        return true;
      }

      // Check if the path indicates a constraint change
      if (
        change.path.endsWith('.stringConstraints') ||
        change.path.endsWith('.numberConstraints') ||
        change.path.endsWith('.arrayConstraints') ||
        change.path.endsWith('.objectConstraints')
      ) {
        return true;
      }

      // Check if the path indicates a required property change
      if (change.path.endsWith('.required')) {
        // Adding required properties can cause data loss
        const oldRequired = change.oldValue as string[] || [];
        const newRequired = change.newValue as string[] || [];

        // Check if any new required properties were added
        for (const prop of newRequired) {
          if (!oldRequired.includes(prop)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Create migration steps for a schema change
   *
   * @param change - Schema change
   * @param sourceSchema - Source schema
   * @param targetSchema - Target schema
   * @returns Migration steps
   * @private
   */
  private createMigrationStepsForChange(
    change: SchemaChange,
    sourceSchema: SchemaDefinition,
    targetSchema: SchemaDefinition
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];

    // Process change based on type and path
    if (change.path.startsWith('vertices.')) {
      steps.push(...this.createVertexMigrationSteps(change, sourceSchema, targetSchema));
    } else if (change.path.startsWith('edges.')) {
      steps.push(...this.createEdgeMigrationSteps(change, sourceSchema, targetSchema));
    }

    return steps;
  }

  /**
   * Create migration steps for vertex changes
   *
   * @param change - Schema change
   * @param sourceSchema - Source schema
   * @param targetSchema - Target schema
   * @returns Migration steps
   * @private
   */
  private createVertexMigrationSteps(
    change: SchemaChange,
    _sourceSchema: SchemaDefinition,
    targetSchema: SchemaDefinition
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];
    const pathParts = change.path.split('.');

    // Extract vertex label
    const vertexLabel = pathParts[1];

    if (pathParts.length === 2) {
      // Vertex label added or removed
      if (change.type === SchemaChangeType.ADDED) {
        // Create vertex table
        const createTableSQL = this.sqlGenerator.generateCreateVertexTableSQL(vertexLabel, {
          tablePrefix: this.options.vertexTablePrefix
        });

        steps.push({
          description: `Create vertex table for label '${vertexLabel}'`,
          sql: createTableSQL.sql,
          params: createTableSQL.params,
          canCauseDataLoss: false,
        });
      } else if (change.type === SchemaChangeType.REMOVED) {
        // Drop vertex table
        const dropTableSQL = (this.sqlGenerator as any).generateDropVertexTableSQL(vertexLabel, {
          tablePrefix: this.options.vertexTablePrefix
        });

        steps.push({
          description: `Drop vertex table for label '${vertexLabel}'`,
          sql: dropTableSQL.sql,
          params: dropTableSQL.params,
          canCauseDataLoss: true,
        });
      }
    } else if (pathParts.length >= 4 && pathParts[2] === 'properties') {
      // Property changes
      const propertyName = pathParts[3];

      if (change.type === SchemaChangeType.ADDED) {
        // Add column
        const addColumnSQL = (this.sqlGenerator as any).generateAddColumnSQL(
          vertexLabel,
          propertyName,
          targetSchema.vertices[vertexLabel].properties[propertyName],
          false, // isEdge
          { tablePrefix: this.options.vertexTablePrefix }
        );

        steps.push({
          description: `Add column '${propertyName}' to vertex table '${vertexLabel}'`,
          sql: addColumnSQL.sql,
          params: addColumnSQL.params,
          canCauseDataLoss: false,
        });
      } else if (change.type === SchemaChangeType.REMOVED) {
        // Drop column
        const dropColumnSQL = (this.sqlGenerator as any).generateDropColumnSQL(
          vertexLabel,
          propertyName,
          false, // isEdge
          { tablePrefix: this.options.vertexTablePrefix }
        );

        steps.push({
          description: `Drop column '${propertyName}' from vertex table '${vertexLabel}'`,
          sql: dropColumnSQL.sql,
          params: dropColumnSQL.params,
          canCauseDataLoss: true,
        });
      } else if (change.type === SchemaChangeType.MODIFIED) {
        // Modify column
        if (pathParts.length === 5 && pathParts[4] === 'type') {
          // Type change
          const alterColumnTypeSQL = (this.sqlGenerator as any).generateAlterColumnTypeSQL(
            vertexLabel,
            propertyName,
            targetSchema.vertices[vertexLabel].properties[propertyName],
            false, // isEdge
            { tablePrefix: this.options.vertexTablePrefix }
          );

          steps.push({
            description: `Alter column type for '${propertyName}' in vertex table '${vertexLabel}'`,
            sql: alterColumnTypeSQL.sql,
            params: alterColumnTypeSQL.params,
            canCauseDataLoss: true,
          });
        }
      }
    } else if (pathParts.length === 3 && pathParts[2] === 'required') {
      // Required properties changed
      const oldRequired = (change.oldValue as string[]) || [];
      const newRequired = (change.newValue as string[]) || [];

      // Find newly required properties
      for (const prop of newRequired) {
        if (!oldRequired.includes(prop)) {
          // Add NOT NULL constraint
          const setNotNullSQL = (this.sqlGenerator as any).generateSetNotNullSQL(
            vertexLabel,
            prop,
            false, // isEdge
            { tablePrefix: this.options.vertexTablePrefix }
          );

          steps.push({
            description: `Add NOT NULL constraint to column '${prop}' in vertex table '${vertexLabel}'`,
            sql: setNotNullSQL.sql,
            params: setNotNullSQL.params,
            canCauseDataLoss: true,
          });
        }
      }

      // Find no longer required properties
      for (const prop of oldRequired) {
        if (!newRequired.includes(prop)) {
          // Drop NOT NULL constraint
          const dropNotNullSQL = (this.sqlGenerator as any).generateDropNotNullSQL(
            vertexLabel,
            prop,
            false, // isEdge
            { tablePrefix: this.options.vertexTablePrefix }
          );

          steps.push({
            description: `Drop NOT NULL constraint from column '${prop}' in vertex table '${vertexLabel}'`,
            sql: dropNotNullSQL.sql,
            params: dropNotNullSQL.params,
            canCauseDataLoss: false,
          });
        }
      }
    }

    return steps;
  }

  /**
   * Create migration steps for edge changes
   *
   * @param change - Schema change
   * @param sourceSchema - Source schema
   * @param targetSchema - Target schema
   * @returns Migration steps
   * @private
   */
  private createEdgeMigrationSteps(
    change: SchemaChange,
    _sourceSchema: SchemaDefinition,
    targetSchema: SchemaDefinition
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];
    const pathParts = change.path.split('.');

    // Extract edge label
    const edgeLabel = pathParts[1];

    if (pathParts.length === 2) {
      // Edge label added or removed
      if (change.type === SchemaChangeType.ADDED) {
        // Create edge table
        const createTableSQL = this.sqlGenerator.generateCreateEdgeTableSQL(edgeLabel);

        steps.push({
          description: `Create edge table for label '${edgeLabel}'`,
          sql: createTableSQL.sql,
          params: createTableSQL.params,
          canCauseDataLoss: false,
        });
      } else if (change.type === SchemaChangeType.REMOVED) {
        // Drop edge table
        const dropTableSQL = (this.sqlGenerator as any).generateDropEdgeTableSQL(edgeLabel);

        steps.push({
          description: `Drop edge table for label '${edgeLabel}'`,
          sql: dropTableSQL.sql,
          params: dropTableSQL.params,
          canCauseDataLoss: true,
        });
      }
    } else if (pathParts.length >= 4 && pathParts[2] === 'properties') {
      // Property changes
      const propertyName = pathParts[3];

      if (change.type === SchemaChangeType.ADDED) {
        // Add column
        const addColumnSQL = (this.sqlGenerator as any).generateAddColumnSQL(
          edgeLabel,
          propertyName,
          targetSchema.edges[edgeLabel].properties[propertyName],
          true // isEdge
        );

        steps.push({
          description: `Add column '${propertyName}' to edge table '${edgeLabel}'`,
          sql: addColumnSQL.sql,
          params: addColumnSQL.params,
          canCauseDataLoss: false,
        });
      } else if (change.type === SchemaChangeType.REMOVED) {
        // Drop column
        const dropColumnSQL = (this.sqlGenerator as any).generateDropColumnSQL(
          edgeLabel,
          propertyName,
          true // isEdge
        );

        steps.push({
          description: `Drop column '${propertyName}' from edge table '${edgeLabel}'`,
          sql: dropColumnSQL.sql,
          params: dropColumnSQL.params,
          canCauseDataLoss: true,
        });
      } else if (change.type === SchemaChangeType.MODIFIED) {
        // Modify column
        if (pathParts.length === 5 && pathParts[4] === 'type') {
          // Type change
          const alterColumnTypeSQL = (this.sqlGenerator as any).generateAlterColumnTypeSQL(
            edgeLabel,
            propertyName,
            targetSchema.edges[edgeLabel].properties[propertyName],
            true // isEdge
          );

          steps.push({
            description: `Alter column type for '${propertyName}' in edge table '${edgeLabel}'`,
            sql: alterColumnTypeSQL.sql,
            params: alterColumnTypeSQL.params,
            canCauseDataLoss: true,
          });
        }
      }
    } else if (pathParts.length === 3 && pathParts[2] === 'required') {
      // Required properties changed
      const oldRequired = (change.oldValue as string[]) || [];
      const newRequired = (change.newValue as string[]) || [];

      // Find newly required properties
      for (const prop of newRequired) {
        if (!oldRequired.includes(prop)) {
          // Add NOT NULL constraint
          const setNotNullSQL = (this.sqlGenerator as any).generateSetNotNullSQL(
            edgeLabel,
            prop,
            true, // isEdge
            { tablePrefix: this.options.edgeTablePrefix }
          );

          steps.push({
            description: `Add NOT NULL constraint to column '${prop}' in edge table '${edgeLabel}'`,
            sql: setNotNullSQL.sql,
            params: setNotNullSQL.params,
            canCauseDataLoss: true,
          });
        }
      }

      // Find no longer required properties
      for (const prop of oldRequired) {
        if (!newRequired.includes(prop)) {
          // Drop NOT NULL constraint
          const dropNotNullSQL = (this.sqlGenerator as any).generateDropNotNullSQL(
            edgeLabel,
            prop,
            true, // isEdge
            { tablePrefix: this.options.edgeTablePrefix }
          );

          steps.push({
            description: `Drop NOT NULL constraint from column '${prop}' in edge table '${edgeLabel}'`,
            sql: dropNotNullSQL.sql,
            params: dropNotNullSQL.params,
            canCauseDataLoss: false,
          });
        }
      }
    } else if (pathParts.length === 3 && (pathParts[2] === 'fromVertex' || pathParts[2] === 'toVertex')) {
      // Vertex type constraints changed
      steps.push({
        description: `Vertex type constraint change for '${pathParts[2]}' in edge '${edgeLabel}' requires manual migration`,
        sql: '-- Manual migration required for vertex type constraint change',
        params: [],
        canCauseDataLoss: true,
      });
    }

    return steps;
  }

  /**
   * Create a backup of the database
   *
   * @param transaction - Transaction
   * @private
   */
  private async createBackup(transaction: Transaction): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const backupSQL = `
      CREATE SCHEMA IF NOT EXISTS backup;

      -- Create backup tables for vertices
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'v_%')
        LOOP
          EXECUTE 'CREATE TABLE backup.' || r.table_name || '_${timestamp} AS SELECT * FROM public.' || r.table_name;
        END LOOP;
      END $$;

      -- Create backup tables for edges
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'e_%')
        LOOP
          EXECUTE 'CREATE TABLE backup.' || r.table_name || '_${timestamp} AS SELECT * FROM public.' || r.table_name;
        END LOOP;
      END $$;
    `;

    await this.queryExecutor.executeSQL(backupSQL, [], { transaction });
  }
}
