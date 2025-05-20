/**
 * SchemaLoader - Loads data into Apache AGE graph databases
 *
 * This class provides functionality for loading data into Apache AGE graph databases
 * using the temporary table approach. It validates data against the schema before loading
 * and provides methods for loading vertices, edges, or both.
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { CypherQueryGenerator } from './cypher-query-generator';
import { SchemaValidator } from '../schema/validator';
import { ValidationErrorCollection } from '../schema/errors';
import { DatabaseError as DbError, DatabaseErrorType } from '../db/types';
import { createArrayFunction, toAgType } from '../utils/age-type-utils';
import fs from 'fs';
import path from 'path';

/**
 * Logger interface for SchemaLoader
 */
export interface Logger {
  /**
   * Log a debug message
   *
   * @param message - Debug message
   * @param args - Additional arguments
   */
  debug(message: string, ...args: any[]): void;

  /**
   * Log an info message
   *
   * @param message - Info message
   * @param args - Additional arguments
   */
  info(message: string, ...args: any[]): void;

  /**
   * Log a warning message
   *
   * @param message - Warning message
   * @param args - Additional arguments
   */
  warn(message: string, ...args: any[]): void;

  /**
   * Log an error message
   *
   * @param message - Error message
   * @param args - Additional arguments
   */
  error(message: string, ...args: any[]): void;
}

/**
 * Base error class for SchemaLoader errors
 */
export class SchemaLoaderError extends Error {
  /**
   * Create a new SchemaLoaderError
   *
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SchemaLoaderError';

    // Maintain proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when validation fails
 */
export class SchemaValidationError extends SchemaLoaderError {
  /**
   * Create a new SchemaValidationError
   *
   * @param message - Error message
   * @param validationErrors - Validation errors
   */
  constructor(message: string, public readonly validationErrors: any[]) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Error thrown when a database operation fails
 */
export class SchemaLoaderDatabaseError extends SchemaLoaderError {
  /**
   * Create a new SchemaLoaderDatabaseError
   *
   * @param message - Error message
   * @param originalError - Original error
   */
  constructor(message: string, public readonly originalError: Error) {
    super(message, originalError);
    this.name = 'SchemaLoaderDatabaseError';
  }
}

/**
 * Error thrown when a transaction fails
 */
export class SchemaLoaderTransactionError extends SchemaLoaderDatabaseError {
  /**
   * Create a new SchemaLoaderTransactionError
   *
   * @param message - Error message
   * @param originalError - Original error
   */
  constructor(message: string, originalError: Error) {
    super(message, originalError);
    this.name = 'SchemaLoaderTransactionError';
  }
}

/**
 * Error thrown when a temporary resource operation fails
 */
export class TempResourceError extends SchemaLoaderError {
  /**
   * Create a new TempResourceError
   *
   * @param message - Error message
   * @param originalError - Original error
   */
  constructor(message: string, public readonly originalError: Error) {
    super(message, originalError);
    this.name = 'TempResourceError';
  }
}

/**
 * Options for the SchemaLoader
 */
export interface SchemaLoaderOptions {
  /**
   * Schema validator configuration
   */
  validatorConfig?: {
    /**
     * Whether to collect all errors or stop on first error
     */
    collectAllErrors?: boolean;
    /**
     * Whether to validate types
     */
    validateTypes?: boolean;
    /**
     * Whether to validate required properties
     */
    validateRequired?: boolean;
    /**
     * Whether to validate constraints
     */
    validateConstraints?: boolean;
    /**
     * Whether to allow unknown properties
     */
    allowUnknownProperties?: boolean;
  };
  /**
   * Default graph name
   */
  defaultGraphName?: string;
  /**
   * Default batch size
   */
  defaultBatchSize?: number;
  /**
   * Default schema for temporary tables
   */
  defaultTempSchema?: string;
  /**
   * Logger instance
   */
  logger?: Logger;
  /**
   * Whether to validate data before loading
   */
  validateBeforeLoad?: boolean;
  /**
   * Whether to use parallel inserts for batch processing
   */
  parallelInserts?: boolean;
  /**
   * Maximum number of batches to process in parallel
   */
  maxParallelBatches?: number;
  /**
   * Whether to use streaming for large datasets
   */
  useStreamingForLargeDatasets?: boolean;
  /**
   * Number of items that triggers streaming mode
   */
  largeDatasetThreshold?: number;
  /**
   * Whether to use bulk insert for batch processing
   */
  useBulkInsert?: boolean;
  /**
   * Whether to reuse temporary tables
   */
  reuseTemporaryTables?: boolean;
}

/**
 * Options for loading data
 */
export interface LoadOptions {
  /**
   * Transaction to use
   */
  transaction?: any;
  /**
   * Graph name
   */
  graphName?: string;
  /**
   * Batch size
   */
  batchSize?: number;
  /**
   * Progress callback
   */
  onProgress?: (progress: ProgressInfo) => void;
  /**
   * Whether to validate data
   */
  validateData?: boolean;
  /**
   * Schema for temporary tables
   */
  tempSchema?: string;
}

/**
 * Progress information
 */
export interface ProgressInfo {
  /**
   * Current phase
   */
  phase: 'validation' | 'storing' | 'creating';
  /**
   * Current progress
   */
  current: number;
  /**
   * Total items
   */
  total: number;
  /**
   * Percentage complete
   */
  percentage: number;
  /**
   * Number of vertices
   */
  vertexCount?: number;
  /**
   * Number of edges
   */
  edgeCount?: number;
  /**
   * Current type being processed (vertex or edge type)
   */
  currentType?: string;
  /**
   * Current batch number
   */
  currentBatch?: number;
  /**
   * Total number of batches
   */
  totalBatches?: number;
  /**
   * Elapsed time in milliseconds
   */
  elapsedTime?: number;
  /**
   * Estimated time remaining in milliseconds
   */
  estimatedTimeRemaining?: number;
}

/**
 * Result of loading data
 */
export interface LoadResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  /**
   * Number of vertices loaded
   */
  vertexCount: number;
  /**
   * Number of edges loaded
   */
  edgeCount: number;
  /**
   * Types of vertices loaded
   */
  vertexTypes: string[];
  /**
   * Types of edges loaded
   */
  edgeTypes: string[];
  /**
   * Errors encountered
   */
  errors?: Error[];
  /**
   * Warnings encountered
   */
  warnings?: string[];
  /**
   * Duration of the operation in milliseconds
   */
  duration: number;
}

/**
 * Graph data structure
 */
export interface GraphData {
  /**
   * Vertices data
   */
  vertices: Record<string, any[]>;
  /**
   * Edges data
   */
  edges: Record<string, any[]>;
}

/**
 * SchemaLoader class
 */
export class SchemaLoader<T extends SchemaDefinition> {
  private cypherQueryGenerator: CypherQueryGenerator<T>;
  private schemaValidator: SchemaValidator;
  private options: SchemaLoaderOptions;
  private logger: Logger;

  /**
   * Create a new SchemaLoader
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param options - SchemaLoader options
   */
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    options: SchemaLoaderOptions = {}
  ) {
    this.options = {
      defaultGraphName: 'default',
      defaultBatchSize: 1000,
      defaultTempSchema: 'public',
      validateBeforeLoad: true,
      parallelInserts: false,
      maxParallelBatches: 4,
      useStreamingForLargeDatasets: false,
      largeDatasetThreshold: 10000,
      useBulkInsert: false,
      reuseTemporaryTables: false,
      ...options
    };

    // Set up logger
    this.logger = options.logger || {
      debug: () => {},
      info: () => {},
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };

    this.logger.debug('Initializing SchemaLoader');
    this.cypherQueryGenerator = new CypherQueryGenerator<T>(schema);
    this.schemaValidator = new SchemaValidator(schema, options.validatorConfig);
    this.logger.debug('SchemaLoader initialized with performance options:', {
      parallelInserts: this.options.parallelInserts,
      maxParallelBatches: this.options.maxParallelBatches,
      useStreamingForLargeDatasets: this.options.useStreamingForLargeDatasets,
      largeDatasetThreshold: this.options.largeDatasetThreshold,
      useBulkInsert: this.options.useBulkInsert,
      reuseTemporaryTables: this.options.reuseTemporaryTables
    });
  }

  /**
   * Load graph data (vertices and edges)
   *
   * @param data - Graph data
   * @param options - Load options
   * @returns Load result
   */
  async loadGraphData(
    data: GraphData,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const startTime = Date.now();
    const graphName = options?.graphName || this.options.defaultGraphName!;

    // Get vertices and edges data
    const verticesData = data.vertices;
    const edgesData = data.edges;

    this.logger.info(`Starting to load graph data for graph '${graphName}'`);
    this.logger.debug('Graph data summary:', {
      vertexTypes: Object.keys(verticesData),
      edgeTypes: Object.keys(edgesData),
      vertexCount: Object.values(verticesData).reduce((sum, list) => sum + list.length, 0),
      edgeCount: Object.values(edgesData).reduce((sum, list) => sum + list.length, 0)
    });

    // Merge options with defaults
    const mergedOptions: Required<LoadOptions> = {
      transaction: options.transaction,
      graphName,
      batchSize: options.batchSize || this.options.defaultBatchSize!,
      onProgress: options.onProgress || (() => {}),
      validateData: options.validateData ?? this.options.validateBeforeLoad ?? true,
      tempSchema: options.tempSchema || this.options.defaultTempSchema!
    };

    // Initialize result
    const result: LoadResult = {
      success: true,
      vertexCount: 0,
      edgeCount: 0,
      vertexTypes: Object.keys(verticesData),
      edgeTypes: Object.keys(edgesData),
      duration: 0,
      errors: [],
      warnings: []
    };

    // Create a transaction if one wasn't provided
    let transaction = mergedOptions.transaction;
    let createdTransaction = false;

    if (!transaction) {
      this.logger.debug('Creating new transaction');
      try {
        transaction = await this.queryExecutor.beginTransaction();
        createdTransaction = true;
        this.logger.debug('Transaction created successfully');
      } catch (error) {
        this.logger.error('Failed to create transaction', error);
        result.success = false;
        result.errors = [new SchemaLoaderTransactionError('Failed to create transaction', error as Error)];
        result.duration = Date.now() - startTime;
        return result;
      }
    } else {
      this.logger.debug('Using provided transaction');
    }

    try {
      // Load vertices first
      if (Object.keys(verticesData).length > 0) {
        this.logger.info(`Loading vertices for graph '${graphName}'`);
        const vertexOptions = {
          ...options,
          transaction,
          onProgress: options.onProgress ?
            (progress: ProgressInfo) => {
              // Adjust progress to account for both vertex and edge loading
              const adjustedProgress: ProgressInfo = {
                ...progress,
                phase: progress.phase,
                current: progress.current,
                total: progress.total * 2, // Double the total steps
                percentage: Math.floor(progress.percentage / 2) // Half the percentage
              };

              options.onProgress!(adjustedProgress);
            } : undefined
        };

        const vertexResult = await this.loadVertices(verticesData, vertexOptions);

        if (!vertexResult.success) {
          this.logger.error('Failed to load vertices', vertexResult.errors);
          result.success = false;
          result.errors = vertexResult.errors || [];
          result.warnings = vertexResult.warnings || [];

          // Rollback if we created the transaction
          if (createdTransaction) {
            this.logger.debug('Rolling back transaction due to vertex loading failure');
            try {
              await transaction.rollback();
              this.logger.debug('Transaction rolled back successfully');
            } catch (rollbackError) {
              this.logger.error('Failed to rollback transaction', rollbackError);
              result.warnings = [...(result.warnings || []), `Rollback error: ${(rollbackError as Error).message}`];
            }
          }

          result.duration = Date.now() - startTime;
          this.logger.info(`Graph data loading failed after ${result.duration}ms`);
          return result;
        }

        result.vertexCount = vertexResult.vertexCount;
        result.vertexTypes = vertexResult.vertexTypes;
        this.logger.info(`Successfully loaded ${vertexResult.vertexCount} vertices`);

        if (vertexResult.warnings && vertexResult.warnings.length > 0) {
          this.logger.warn('Vertex loading warnings:', vertexResult.warnings);
          result.warnings = [...(result.warnings || []), ...vertexResult.warnings];
        }
      }

      // Then load edges
      if (Object.keys(edgesData).length > 0) {
        this.logger.info(`Loading edges for graph '${graphName}'`);
        const edgeOptions = {
          ...options,
          transaction,
          onProgress: options.onProgress ?
            (progress: ProgressInfo) => {
              // Adjust progress to account for both vertex and edge loading
              const adjustedProgress: ProgressInfo = {
                ...progress,
                phase: progress.phase,
                current: progress.current + progress.total, // Offset by the total steps for vertices
                total: progress.total * 2, // Double the total steps
                percentage: 50 + Math.floor(progress.percentage / 2) // Start at 50% and add half the percentage
              };

              options.onProgress!(adjustedProgress);
            } : undefined
        };

        const edgeResult = await this.loadEdges(edgesData, edgeOptions);

        if (!edgeResult.success) {
          this.logger.error('Failed to load edges', edgeResult.errors);
          result.success = false;
          result.errors = [...(result.errors || []), ...(edgeResult.errors || [])];
          result.warnings = [...(result.warnings || []), ...(edgeResult.warnings || [])];

          // Rollback if we created the transaction
          if (createdTransaction) {
            this.logger.debug('Rolling back transaction due to edge loading failure');
            try {
              await transaction.rollback();
              this.logger.debug('Transaction rolled back successfully');
            } catch (rollbackError) {
              this.logger.error('Failed to rollback transaction', rollbackError);
              result.warnings = [...(result.warnings || []), `Rollback error: ${(rollbackError as Error).message}`];
            }
          }

          result.duration = Date.now() - startTime;
          this.logger.info(`Graph data loading failed after ${result.duration}ms`);
          return result;
        }

        result.edgeCount = edgeResult.edgeCount;
        result.edgeTypes = edgeResult.edgeTypes;
        this.logger.info(`Successfully loaded ${edgeResult.edgeCount} edges`);

        if (edgeResult.warnings && edgeResult.warnings.length > 0) {
          this.logger.warn('Edge loading warnings:', edgeResult.warnings);
          result.warnings = [...(result.warnings || []), ...edgeResult.warnings];
        }
      }

      // Commit if we created the transaction
      if (createdTransaction) {
        this.logger.debug('Committing transaction');
        try {
          await transaction.commit();
          this.logger.debug('Transaction committed successfully');
        } catch (commitError) {
          this.logger.error('Failed to commit transaction', commitError);
          result.success = false;
          result.errors = [new SchemaLoaderTransactionError('Failed to commit transaction', commitError as Error)];

          try {
            await transaction.rollback();
            this.logger.debug('Transaction rolled back successfully after commit failure');
          } catch (rollbackError) {
            this.logger.error('Failed to rollback transaction after commit failure', rollbackError);
            result.warnings = [...(result.warnings || []), `Rollback error: ${(rollbackError as Error).message}`];
          }

          result.duration = Date.now() - startTime;
          this.logger.info(`Graph data loading failed after ${result.duration}ms`);
          return result;
        }
      }

      result.duration = Date.now() - startTime;
      this.logger.info(`Graph data loading completed in ${result.duration}ms`);
      this.logger.debug('Graph data loading result:', {
        vertexCount: result.vertexCount,
        edgeCount: result.edgeCount,
        vertexTypes: result.vertexTypes,
        edgeTypes: result.edgeTypes
      });

      // Clean up empty arrays
      if (result.warnings && result.warnings.length === 0) {
        delete result.warnings;
      }

      if (result.errors && result.errors.length === 0) {
        delete result.errors;
      }

      return result;
    } catch (error) {
      this.logger.error('Unexpected error during graph data loading', error);
      result.success = false;

      // Wrap the error in a SchemaLoaderError if it's not already one
      if (error instanceof SchemaLoaderError) {
        result.errors = [error];
      } else if (error instanceof DbError) {
        result.errors = [new SchemaLoaderDatabaseError(`Database error: ${error.message}`, error)];
      } else {
        result.errors = [new SchemaLoaderError(`Unexpected error: ${(error as Error).message}`, error)];
      }

      // Rollback if we created the transaction
      if (createdTransaction) {
        this.logger.debug('Rolling back transaction due to unexpected error');
        try {
          await transaction.rollback();
          this.logger.debug('Transaction rolled back successfully');
        } catch (rollbackError) {
          this.logger.error('Failed to rollback transaction', rollbackError);
          result.warnings = [`Rollback error: ${(rollbackError as Error).message}`];
        }
      }

      result.duration = Date.now() - startTime;
      this.logger.info(`Graph data loading failed after ${result.duration}ms`);
      return result;
    }
  }

  /**
   * Load vertices
   *
   * @param vertices - Vertex data
   * @param options - Load options
   * @returns Load result
   */
  async loadVertices(
    vertices: Record<string, any[]>,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const startTime = Date.now();
    const errors: Error[] = [];
    const warnings: string[] = [];

    // Merge options with defaults
    const mergedOptions: Required<LoadOptions> = {
      transaction: options.transaction,
      graphName: options.graphName || this.options.defaultGraphName!,
      batchSize: options.batchSize || this.options.defaultBatchSize!,
      onProgress: options.onProgress || (() => {}),
      validateData: options.validateData !== false,
      tempSchema: options.tempSchema || this.options.defaultTempSchema!
    };

    // Start a transaction if one wasn't provided
    const transaction = mergedOptions.transaction || await this.queryExecutor.beginTransaction();
    let success = false;
    let tempTableName = '';

    try {
      // Validate vertex data if required
      if (mergedOptions.validateData) {
        this.validateVertexData(vertices);
      }

      // Report progress for validation phase
      this.trackProgress(options, 'validation', 1, 3, {
        vertexCount: 0,
        elapsedTime: Date.now() - startTime
      });

      // Create a temporary table to store the vertex data
      const tempTableName = `temp_vertices_${Date.now()}`;
      await this.queryExecutor.executeSQL(`
        CREATE TEMPORARY TABLE ${tempTableName} (
          id SERIAL PRIMARY KEY,
          vertex_label TEXT NOT NULL,
          properties JSONB
        )
      `, [], { transaction });

      // Insert vertex data into the temporary table
      let vertexCount = 0;
      const vertexTypes: string[] = [];

      // Calculate total vertices for progress tracking
      const totalVertices = Object.values(vertices).reduce((sum, list) => {
        if (Array.isArray(list)) {
          return sum + list.length;
        }
        return sum;
      }, 0);

      // Determine if we should use streaming
      const useStreaming = this.shouldUseStreaming(totalVertices);
      const useParallelInserts = this.options.parallelInserts ?? false;
      const useBulkInsert = this.options.useBulkInsert ?? false;

      if (useStreaming) {
        this.logger.info(`Using streaming mode for ${totalVertices} vertices`);
      }

      if (useParallelInserts) {
        this.logger.info(`Using parallel inserts for vertices with max ${this.options.maxParallelBatches} batches`);
      }

      if (useBulkInsert) {
        this.logger.info(`Using bulk insert for vertices`);
      }

      for (const [vertexType, vertexList] of Object.entries(vertices)) {
        if (!vertexList || !Array.isArray(vertexList) || vertexList.length === 0) {
          continue;
        }

        vertexTypes.push(vertexType);

        // Validate vertex type against schema
        if (!this.schema.vertices[vertexType]) {
          warnings.push(`Vertex type '${vertexType}' not found in schema`);
        }

        this.logger.debug(`Processing ${vertexList.length} vertices of type ${vertexType}`);

        // Calculate total batches for this vertex type
        const totalBatches = Math.ceil(vertexList.length / mergedOptions.batchSize);

        if (useStreaming) {
          // Process vertices in streaming mode
          const insertedCount = await this.processDataStream(
            vertexList,
            mergedOptions.batchSize,
            async (batch) => {
              if (useBulkInsert) {
                return await this.bulkInsertVertexData(tempTableName, vertexType, batch, transaction);
              } else {
                return await this.insertVertexDataBatch(tempTableName, vertexType, batch, transaction);
              }
            },
            {
              onProgress: (processed, total) => {
                this.trackProgress(options, 'storing', processed, total, {
                  vertexCount: vertexCount + processed,
                  currentType: vertexType,
                  elapsedTime: Date.now() - startTime,
                  percentage: 33 + Math.round((processed / total) * 33)
                });
              }
            }
          );

          vertexCount += insertedCount;
          this.logger.debug(`Inserted ${insertedCount} vertices for ${vertexType} in streaming mode`);
        } else if (useParallelInserts) {
          // Process vertices in parallel
          const insertedCount = await this.processBatchesInParallel(
            vertexList,
            mergedOptions.batchSize,
            async (batch) => {
              if (useBulkInsert) {
                return await this.bulkInsertVertexData(tempTableName, vertexType, batch, transaction);
              } else {
                return await this.insertVertexDataBatch(tempTableName, vertexType, batch, transaction);
              }
            },
            {
              maxParallelBatches: this.options.maxParallelBatches,
              onProgress: (processed, total) => {
                this.trackProgress(options, 'storing', processed, total, {
                  vertexCount: vertexCount + processed,
                  currentType: vertexType,
                  elapsedTime: Date.now() - startTime,
                  percentage: 33 + Math.round((processed / total) * 33)
                });
              }
            }
          );

          vertexCount += insertedCount;
          this.logger.debug(`Inserted ${insertedCount} vertices for ${vertexType} in parallel`);
        } else {
          // Process vertices sequentially (original implementation)
          let processedCount = 0;

          // Insert vertices in batches
          for (let i = 0; i < vertexList.length; i += mergedOptions.batchSize) {
            const batch = vertexList.slice(i, i + mergedOptions.batchSize);
            const currentBatch = Math.floor(i / mergedOptions.batchSize) + 1;

            // Report progress
            this.trackProgress(options, 'storing', i + batch.length, vertexList.length, {
              vertexCount: vertexCount + processedCount + batch.length,
              currentType: vertexType,
              currentBatch,
              totalBatches,
              elapsedTime: Date.now() - startTime,
              percentage: 33 + Math.round(((i + batch.length) / vertexList.length) * 33)
            });

            // Insert batch
            if (useBulkInsert) {
              const insertedCount = await this.bulkInsertVertexData(tempTableName, vertexType, batch, transaction);
              processedCount += insertedCount;
            } else {
              for (const vertex of batch) {
                await this.queryExecutor.executeSQL(`
                  INSERT INTO ${tempTableName} (vertex_label, properties)
                  VALUES ($1, $2)
                `, [
                  vertexType,
                  JSON.stringify(this.extractVertexProperties(vertex, vertexType))
                ], { transaction });

                processedCount++;
              }
            }
          }

          vertexCount += processedCount;
          this.logger.debug(`Inserted ${processedCount} vertices for ${vertexType} sequentially`);
        }
      }

      // Get vertex data from the temporary table
      const vertexDataResult = await this.queryExecutor.executeSQL(`
        SELECT jsonb_agg(jsonb_build_object(
          'label', vertex_label::text,
          'properties', properties
        )) AS vertices
        FROM ${tempTableName}
      `, [], { transaction });

      // Extract the vertex data
      const vertexData = vertexDataResult.rows[0]?.vertices || [];

      // Create a function to convert vertex data to ag_catalog.agtype
      const functionName = `get_vertices_${Date.now()}`;
      await createArrayFunction(
        this.queryExecutor,
        mergedOptions.tempSchema,
        functionName,
        vertexData,
        { transaction }
      );

      // Generate and execute Cypher query to create vertices
      const createVerticesQuery = this.cypherQueryGenerator.generateCreateVerticesQuery(
        `${mergedOptions.tempSchema}.${functionName}()`,
        mergedOptions.graphName
      );

      await this.queryExecutor.executeSQL(
        createVerticesQuery,
        [],
        { transaction }
      );

      // Report progress for creating phase
      this.trackProgress(options, 'creating', 3, 3, {
        vertexCount,
        elapsedTime: Date.now() - startTime,
        percentage: 100
      });

      // Commit transaction if we created it
      if (!options.transaction) {
        await transaction.commit();
      }

      success = true;

      return {
        success,
        vertexCount,
        edgeCount: 0,
        vertexTypes,
        edgeTypes: [],
        warnings: warnings.length > 0 ? warnings : undefined,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // Rollback transaction if we created it
      if (!options.transaction) {
        await transaction.rollback();
      }

      errors.push(error as Error);

      return {
        success: false,
        vertexCount: 0,
        edgeCount: 0,
        vertexTypes: [],
        edgeTypes: [],
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
        duration: Date.now() - startTime
      };
    } finally {
      // Clean up temporary objects
      try {
        if (success && !options.transaction && tempTableName) {
          await this.queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${tempTableName}`);
        }
      } catch (error) {
        console.warn(`Failed to clean up temporary objects: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Load edges
   *
   * @param edges - Edge data
   * @param options - Load options
   * @returns Load result
   */
  async loadEdges(
    edges: Record<string, any[]>,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const startTime = Date.now();
    const errors: Error[] = [];
    const warnings: string[] = [];

    // Merge options with defaults
    const mergedOptions: Required<LoadOptions> = {
      transaction: options.transaction,
      graphName: options.graphName || this.options.defaultGraphName!,
      batchSize: options.batchSize || this.options.defaultBatchSize!,
      onProgress: options.onProgress || (() => {}),
      validateData: options.validateData !== false,
      tempSchema: options.tempSchema || this.options.defaultTempSchema!
    };

    // Start a transaction if one wasn't provided
    const transaction = mergedOptions.transaction || await this.queryExecutor.beginTransaction();
    let success = false;
    let tempTableName = '';

    try {
      // Validate edge data if required
      if (mergedOptions.validateData) {
        this.validateEdgeData(edges);
      }

      // Report progress for validation phase
      this.trackProgress(options, 'validation', 1, 3, {
        edgeCount: 0,
        elapsedTime: Date.now() - startTime
      });

      // Create a temporary table to store the edge data
      const tempTableName = `temp_edges_${Date.now()}`;
      await this.queryExecutor.executeSQL(`
        CREATE TEMPORARY TABLE ${tempTableName} (
          id SERIAL PRIMARY KEY,
          edge_type TEXT NOT NULL,
          from_id TEXT NOT NULL,
          to_id TEXT NOT NULL,
          properties JSONB
        )
      `, [], { transaction });

      // Insert edge data into the temporary table
      let edgeCount = 0;
      const edgeTypes: string[] = [];

      // Calculate total edges for progress tracking
      const totalEdges = Object.values(edges).reduce((sum, list) => {
        if (Array.isArray(list)) {
          return sum + list.length;
        }
        return sum;
      }, 0);

      // Determine if we should use streaming
      const useStreaming = this.shouldUseStreaming(totalEdges);
      const useParallelInserts = this.options.parallelInserts ?? false;
      const useBulkInsert = this.options.useBulkInsert ?? false;

      if (useStreaming) {
        this.logger.info(`Using streaming mode for ${totalEdges} edges`);
      }

      if (useParallelInserts) {
        this.logger.info(`Using parallel inserts for edges with max ${this.options.maxParallelBatches} batches`);
      }

      if (useBulkInsert) {
        this.logger.info(`Using bulk insert for edges`);
      }

      for (const [edgeType, edgeList] of Object.entries(edges)) {
        if (!edgeList || !Array.isArray(edgeList) || edgeList.length === 0) {
          continue;
        }

        edgeTypes.push(edgeType);

        // Validate edge type against schema
        if (!this.schema.edges[edgeType]) {
          warnings.push(`Edge type '${edgeType}' not found in schema`);
        }

        this.logger.debug(`Processing ${edgeList.length} edges of type ${edgeType}`);

        // Calculate total batches for this edge type
        const totalBatches = Math.ceil(edgeList.length / mergedOptions.batchSize);

        if (useStreaming) {
          // Process edges in streaming mode
          const insertedCount = await this.processDataStream(
            edgeList,
            mergedOptions.batchSize,
            async (batch) => {
              if (useBulkInsert) {
                return await this.bulkInsertEdgeData(tempTableName, edgeType, batch, transaction, warnings);
              } else {
                return await this.insertEdgeDataBatch(tempTableName, edgeType, batch, transaction, warnings);
              }
            },
            {
              onProgress: (processed, total) => {
                this.trackProgress(options, 'storing', processed, total, {
                  edgeCount: edgeCount + processed,
                  currentType: edgeType,
                  elapsedTime: Date.now() - startTime,
                  percentage: 33 + Math.round((processed / total) * 33)
                });
              }
            }
          );

          edgeCount += insertedCount;
          this.logger.debug(`Inserted ${insertedCount} edges for ${edgeType} in streaming mode`);
        } else if (useParallelInserts) {
          // Process edges in parallel
          const insertedCount = await this.processBatchesInParallel(
            edgeList,
            mergedOptions.batchSize,
            async (batch) => {
              if (useBulkInsert) {
                return await this.bulkInsertEdgeData(tempTableName, edgeType, batch, transaction, warnings);
              } else {
                return await this.insertEdgeDataBatch(tempTableName, edgeType, batch, transaction, warnings);
              }
            },
            {
              maxParallelBatches: this.options.maxParallelBatches,
              onProgress: (processed, total) => {
                this.trackProgress(options, 'storing', processed, total, {
                  edgeCount: edgeCount + processed,
                  currentType: edgeType,
                  elapsedTime: Date.now() - startTime,
                  percentage: 33 + Math.round((processed / total) * 33)
                });
              }
            }
          );

          edgeCount += insertedCount;
          this.logger.debug(`Inserted ${insertedCount} edges for ${edgeType} in parallel`);
        } else {
          // Process edges sequentially (original implementation)
          let processedCount = 0;

          // Insert edges in batches
          for (let i = 0; i < edgeList.length; i += mergedOptions.batchSize) {
            const batch = edgeList.slice(i, i + mergedOptions.batchSize);
            const currentBatch = Math.floor(i / mergedOptions.batchSize) + 1;

            // Report progress
            this.trackProgress(options, 'storing', i + batch.length, edgeList.length, {
              edgeCount: edgeCount + processedCount + batch.length,
              currentType: edgeType,
              currentBatch,
              totalBatches,
              elapsedTime: Date.now() - startTime,
              percentage: 33 + Math.round(((i + batch.length) / edgeList.length) * 33)
            });

            // Insert batch
            if (useBulkInsert) {
              const insertedCount = await this.bulkInsertEdgeData(tempTableName, edgeType, batch, transaction, warnings);
              processedCount += insertedCount;
            } else {
              for (const edge of batch) {
                if (!edge.from || !edge.to) {
                  warnings.push(`Edge in '${edgeType}' missing from or to property`);
                  continue;
                }

                await this.queryExecutor.executeSQL(`
                  INSERT INTO ${tempTableName} (edge_type, from_id, to_id, properties)
                  VALUES ($1, $2, $3, $4)
                `, [
                  edgeType,
                  edge.from.toString(),
                  edge.to.toString(),
                  JSON.stringify(this.extractEdgeProperties(edge, edgeType))
                ], { transaction });

                processedCount++;
              }
            }
          }

          edgeCount += processedCount;
          this.logger.debug(`Inserted ${processedCount} edges for ${edgeType} sequentially`);
        }
      }

      // Validate edge endpoints
      const validateQuery = this.cypherQueryGenerator.generateValidateEdgeEndpointsQuery(
        tempTableName,
        mergedOptions.graphName
      );

      const validationResult = await this.queryExecutor.executeSQL(
        validateQuery,
        [],
        { transaction }
      );

      if (validationResult.rows.length > 0) {
        // Some endpoints don't exist
        const missingEndpoints = validationResult.rows.map(row =>
          `Edge endpoint validation failed: from_id=${row.from_id} (exists: ${row.from_exists}), to_id=${row.to_id} (exists: ${row.to_exists})`
        );

        errors.push(new Error(`Edge endpoints validation failed: ${missingEndpoints.length} edges have invalid endpoints. First error: ${missingEndpoints[0]}`));

        // Add detailed warnings for each missing endpoint
        for (const message of missingEndpoints) {
          warnings.push(message);
        }

        // Rollback transaction if we created it
        if (!options.transaction) {
          await transaction.rollback();
        }

        return {
          success: false,
          vertexCount: 0,
          edgeCount: 0,
          vertexTypes: [],
          edgeTypes,
          errors,
          warnings: warnings.length > 0 ? warnings : undefined,
          duration: Date.now() - startTime
        };
      }

      // Report progress for endpoint validation phase
      this.trackProgress(options, 'validation', 2, 3, {
        edgeCount,
        elapsedTime: Date.now() - startTime,
        percentage: 66
      });

      // Get edge data from the temporary table
      const edgeDataResult = await this.queryExecutor.executeSQL(`
        SELECT jsonb_agg(jsonb_build_object(
          'type', edge_type,
          'from', from_id,
          'to', to_id,
          'properties', properties
        )) AS edges
        FROM ${tempTableName}
      `, [], { transaction });

      // Extract the edge data
      const edgeData = edgeDataResult.rows[0]?.edges || [];

      // Create a function to convert edge data to ag_catalog.agtype
      const functionName = `get_edges_${Date.now()}`;
      await createArrayFunction(
        this.queryExecutor,
        mergedOptions.tempSchema,
        functionName,
        edgeData,
        { transaction }
      );

      // Generate and execute Cypher query to create edges
      const createEdgesQuery = this.cypherQueryGenerator.generateCreateEdgesQuery(
        `${mergedOptions.tempSchema}.${functionName}()`,
        mergedOptions.graphName
      );

      await this.queryExecutor.executeSQL(
        createEdgesQuery,
        [],
        { transaction }
      );

      // Report progress for creating phase
      this.trackProgress(options, 'creating', 3, 3, {
        edgeCount,
        elapsedTime: Date.now() - startTime,
        percentage: 100
      });

      // Commit transaction if we created it
      if (!options.transaction) {
        await transaction.commit();
      }

      success = true;

      return {
        success,
        vertexCount: 0,
        edgeCount,
        vertexTypes: [],
        edgeTypes,
        warnings: warnings.length > 0 ? warnings : undefined,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // Rollback transaction if we created it
      if (!options.transaction) {
        await transaction.rollback();
      }

      errors.push(error as Error);

      return {
        success: false,
        vertexCount: 0,
        edgeCount: 0,
        vertexTypes: [],
        edgeTypes: [],
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
        duration: Date.now() - startTime
      };
    } finally {
      // Clean up temporary objects
      try {
        if (success && !options.transaction && tempTableName) {
          await this.queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${tempTableName}`);
        }
      } catch (error) {
        console.warn(`Failed to clean up temporary objects: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Load data from a JSON file
   *
   * @param filePath - Path to the JSON file
   * @param options - Load options
   * @returns Load result
   */
  async loadFromFile(
    filePath: string,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const startTime = Date.now();
    const resolvedPath = path.resolve(filePath);

    this.logger.info(`Loading graph data from file: ${resolvedPath}`);

    try {
      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        this.logger.error(`File not found: ${resolvedPath}`);
        return {
          success: false,
          vertexCount: 0,
          edgeCount: 0,
          vertexTypes: [],
          edgeTypes: [],
          errors: [new SchemaLoaderError(`File not found: ${resolvedPath}`)],
          warnings: [],
          duration: Date.now() - startTime
        };
      }

      // Read file content
      this.logger.debug(`Reading file: ${resolvedPath}`);
      let fileContent: string;
      try {
        fileContent = fs.readFileSync(resolvedPath, 'utf-8');
        this.logger.debug(`File read successfully, size: ${fileContent.length} bytes`);
      } catch (readError) {
        this.logger.error(`Failed to read file: ${resolvedPath}`, readError);
        return {
          success: false,
          vertexCount: 0,
          edgeCount: 0,
          vertexTypes: [],
          edgeTypes: [],
          errors: [new SchemaLoaderError(`Failed to read file: ${(readError as Error).message}`, readError)],
          warnings: [],
          duration: Date.now() - startTime
        };
      }

      // Parse JSON content
      this.logger.debug('Parsing JSON content');
      let data: GraphData;
      try {
        data = JSON.parse(fileContent) as GraphData;
        this.logger.debug('JSON parsed successfully');
      } catch (parseError) {
        this.logger.error('Failed to parse JSON content', parseError);
        return {
          success: false,
          vertexCount: 0,
          edgeCount: 0,
          vertexTypes: [],
          edgeTypes: [],
          errors: [new SchemaLoaderError(`Failed to parse JSON file: ${(parseError as Error).message}`, parseError)],
          warnings: [],
          duration: Date.now() - startTime
        };
      }

      // Validate data structure
      if (!data || typeof data !== 'object') {
        this.logger.error('Invalid file format: expected an object');
        return {
          success: false,
          vertexCount: 0,
          edgeCount: 0,
          vertexTypes: [],
          edgeTypes: [],
          errors: [new SchemaLoaderError('Invalid file format: expected an object')],
          warnings: [],
          duration: Date.now() - startTime
        };
      }

      // Ensure vertices and edges properties exist
      const graphData: GraphData = {
        vertices: data.vertices || {},
        edges: data.edges || {}
      };

      this.logger.debug('File content validated, loading graph data');

      // Load the data
      return this.loadGraphData(graphData, options);
    } catch (error) {
      this.logger.error('Unexpected error during file loading', error);
      return {
        success: false,
        vertexCount: 0,
        edgeCount: 0,
        vertexTypes: [],
        edgeTypes: [],
        errors: [new SchemaLoaderError(`Unexpected error: ${(error as Error).message}`, error)],
        warnings: [],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Validate edge data against schema
   *
   * @param edges - Edge data
   * @throws Error if validation fails
   */
  private validateEdgeData(edges: Record<string, any[]>): void {
    for (const [edgeType, edgeList] of Object.entries(edges)) {
      // Skip empty edge lists
      if (!edgeList || !Array.isArray(edgeList) || edgeList.length === 0) {
        continue;
      }

      // Check if edge type exists in schema
      const edgeDef = this.schema.edges[edgeType];
      if (!edgeDef) {
        continue; // Skip validation for edge types not in schema
      }

      // Validate each edge
      for (const edge of edgeList) {
        // Check required properties
        if (!edge.from) {
          throw new Error(`Edge in '${edgeType}' missing required 'from' property`);
        }

        if (!edge.to) {
          throw new Error(`Edge in '${edgeType}' missing required 'to' property`);
        }

        // Validate properties against schema
        const properties = this.extractEdgeProperties(edge, edgeType);

        if (edgeDef.required) {
          for (const requiredProp of edgeDef.required) {
            if (!(requiredProp in properties)) {
              throw new Error(`Edge in '${edgeType}' missing required property '${requiredProp}'`);
            }
          }
        }
      }
    }
  }

  /**
   * Extract edge properties from edge data
   *
   * @param edge - Edge data
   * @param edgeType - Edge type
   * @returns Edge properties
   */
  private extractEdgeProperties(edge: any, edgeType: string): Record<string, any> {
    const properties: Record<string, any> = {};
    const edgeDef = this.schema.edges[edgeType];

    if (!edgeDef) {
      // If edge type is not in schema, include all properties except from and to
      for (const [key, value] of Object.entries(edge)) {
        if (key !== 'from' && key !== 'to') {
          properties[key] = value;
        }
      }

      return properties;
    }

    // Include only properties defined in schema
    for (const propName of Object.keys(edgeDef.properties)) {
      if (propName in edge) {
        properties[propName] = edge[propName];
      }
    }

    return properties;
  }

  /**
   * Validate vertex data against schema
   *
   * @param vertices - Vertex data
   * @throws Error if validation fails
   */
  private validateVertexData(vertices: Record<string, any[]>): void {
    for (const [vertexType, vertexList] of Object.entries(vertices)) {
      // Skip empty vertex lists
      if (!vertexList || !Array.isArray(vertexList) || vertexList.length === 0) {
        continue;
      }

      // Check if vertex type exists in schema
      const vertexDef = this.schema.vertices[vertexType];
      if (!vertexDef) {
        continue; // Skip validation for vertex types not in schema
      }

      // Validate each vertex
      for (const vertex of vertexList) {
        // Validate properties against schema
        const properties = this.extractVertexProperties(vertex, vertexType);

        if (vertexDef.required) {
          for (const requiredProp of vertexDef.required) {
            if (!(requiredProp in properties)) {
              throw new Error(`Vertex in '${vertexType}' missing required property '${requiredProp}'`);
            }
          }
        }
      }
    }
  }

  /**
   * Extract vertex properties from vertex data
   *
   * @param vertex - Vertex data
   * @param vertexType - Vertex type
   * @returns Vertex properties
   */
  private extractVertexProperties(vertex: any, vertexType: string): Record<string, any> {
    const properties: Record<string, any> = {};
    const vertexDef = this.schema.vertices[vertexType];

    if (!vertexDef) {
      // If vertex type is not in schema, include all properties
      for (const [key, value] of Object.entries(vertex)) {
        properties[key] = value;
      }

      return properties;
    }

    // Include only properties defined in schema
    for (const propName of Object.keys(vertexDef.properties)) {
      if (propName in vertex) {
        properties[propName] = vertex[propName];
      }
    }

    return properties;
  }

  /**
   * Track progress of an operation
   *
   * @param options - Load options
   * @param phase - Current phase
   * @param current - Current progress
   * @param total - Total items
   * @param additionalInfo - Additional progress information
   */
  private trackProgress(
    options: LoadOptions,
    phase: 'validation' | 'storing' | 'creating',
    current: number,
    total: number,
    additionalInfo: Partial<ProgressInfo> = {}
  ): void {
    if (!options?.onProgress) return;

    const percentage = Math.floor((current / total) * 100);
    const startTime = additionalInfo.elapsedTime ? Date.now() - additionalInfo.elapsedTime : undefined;

    // Calculate estimated time remaining if we have elapsed time and progress > 0
    let estimatedTimeRemaining: number | undefined = undefined;
    if (startTime && current > 0 && current < total) {
      const elapsedTime = Date.now() - startTime;
      estimatedTimeRemaining = Math.floor((elapsedTime / current) * (total - current));
    }

    options.onProgress({
      phase,
      current,
      total,
      percentage,
      elapsedTime: startTime ? Date.now() - startTime : undefined,
      estimatedTimeRemaining,
      ...additionalInfo
    });
  }

  /**
   * Determine if streaming should be used based on data size
   *
   * @param dataSize - Size of the data to process
   * @returns Whether streaming should be used
   */
  private shouldUseStreaming(dataSize: number): boolean {
    if (!this.options.useStreamingForLargeDatasets) return false;

    const threshold = this.options.largeDatasetThreshold || 10000;
    return dataSize >= threshold;
  }

  /**
   * Process batches in parallel
   *
   * @param items - Items to process
   * @param batchSize - Size of each batch
   * @param processor - Function to process each batch
   * @param options - Processing options
   * @returns Number of processed items
   */
  private async processBatchesInParallel<TItem>(
    items: TItem[],
    batchSize: number,
    processor: (batch: TItem[]) => Promise<number>,
    options?: {
      maxParallelBatches?: number;
      onProgress?: (processed: number, total: number) => void;
    }
  ): Promise<number> {
    const maxParallelBatches = options?.maxParallelBatches || this.options.maxParallelBatches || 4;
    const totalItems = items.length;
    const totalBatches = Math.ceil(totalItems / batchSize);
    let processedItems = 0;

    this.logger.debug(`Processing ${totalItems} items in ${totalBatches} batches with max ${maxParallelBatches} parallel batches`);

    // Process batches in chunks to limit parallelism
    for (let batchStart = 0; batchStart < totalBatches; batchStart += maxParallelBatches) {
      const batchPromises: Promise<number>[] = [];

      // Create a promise for each batch in this chunk
      for (let i = 0; i < maxParallelBatches && batchStart + i < totalBatches; i++) {
        const start = (batchStart + i) * batchSize;
        const end = Math.min(start + batchSize, totalItems);
        const batch = items.slice(start, end);

        batchPromises.push(processor(batch));
      }

      // Wait for all batches in this chunk to complete
      const results = await Promise.all(batchPromises);
      const batchProcessedItems = results.reduce((sum, count) => sum + count, 0);
      processedItems += batchProcessedItems;

      // Report progress
      if (options?.onProgress) {
        options.onProgress(processedItems, totalItems);
      }
    }

    return processedItems;
  }

  /**
   * Process a stream of data
   *
   * @param items - Items to process as a stream
   * @param batchSize - Size of each batch
   * @param processor - Function to process each batch
   * @param options - Processing options
   * @returns Number of processed items
   */
  private async processDataStream<TItem>(
    items: TItem[],
    batchSize: number,
    processor: (batch: TItem[]) => Promise<number>,
    options?: {
      onProgress?: (processed: number, total: number) => void;
    }
  ): Promise<number> {
    const totalItems = items.length;
    let processedItems = 0;
    let currentBatch: TItem[] = [];

    this.logger.debug(`Processing ${totalItems} items in streaming mode with batch size ${batchSize}`);

    for (let i = 0; i < totalItems; i++) {
      currentBatch.push(items[i]);

      // Process batch when it reaches the batch size or at the end
      if (currentBatch.length >= batchSize || i === totalItems - 1) {
        if (currentBatch.length > 0) {
          const batchProcessedItems = await processor(currentBatch);
          processedItems += batchProcessedItems;

          // Report progress
          if (options?.onProgress) {
            options.onProgress(processedItems, totalItems);
          }

          // Reset batch
          currentBatch = [];
        }
      }
    }

    return processedItems;
  }

  /**
   * Insert vertex data into a temporary table
   *
   * @param tempTableName - Name of the temporary table
   * @param vertexType - Type of vertex
   * @param vertices - Vertex data to insert
   * @param transaction - Transaction to use
   * @returns Number of inserted vertices
   */
  private async insertVertexDataBatch(
    tempTableName: string,
    vertexType: string,
    vertices: any[],
    transaction: any
  ): Promise<number> {
    let insertedCount = 0;

    for (const vertex of vertices) {
      await this.queryExecutor.executeSQL(`
        INSERT INTO ${tempTableName} (vertex_label, properties)
        VALUES ($1, $2)
      `, [
        vertexType,
        JSON.stringify(this.extractVertexProperties(vertex, vertexType))
      ], { transaction });

      insertedCount++;
    }

    return insertedCount;
  }

  /**
   * Insert edge data into a temporary table
   *
   * @param tempTableName - Name of the temporary table
   * @param edgeType - Type of edge
   * @param edges - Edge data to insert
   * @param transaction - Transaction to use
   * @param warnings - Array to collect warnings
   * @returns Number of inserted edges
   */
  private async insertEdgeDataBatch(
    tempTableName: string,
    edgeType: string,
    edges: any[],
    transaction: any,
    warnings: string[]
  ): Promise<number> {
    let insertedCount = 0;

    for (const edge of edges) {
      if (!edge.from || !edge.to) {
        warnings.push(`Edge in '${edgeType}' missing from or to property`);
        continue;
      }

      await this.queryExecutor.executeSQL(`
        INSERT INTO ${tempTableName} (edge_type, from_id, to_id, properties)
        VALUES ($1, $2, $3, $4)
      `, [
        edgeType,
        edge.from.toString(),
        edge.to.toString(),
        JSON.stringify(this.extractEdgeProperties(edge, edgeType))
      ], { transaction });

      insertedCount++;
    }

    return insertedCount;
  }

  /**
   * Bulk insert vertex data into a temporary table
   *
   * @param tempTableName - Name of the temporary table
   * @param vertexType - Type of vertex
   * @param vertices - Vertex data to insert
   * @param transaction - Transaction to use
   * @returns Number of inserted vertices
   */
  private async bulkInsertVertexData(
    tempTableName: string,
    vertexType: string,
    vertices: any[],
    transaction: any
  ): Promise<number> {
    if (vertices.length === 0) return 0;

    // Prepare values for bulk insert
    const values = vertices.map(vertex => {
      const properties = this.extractVertexProperties(vertex, vertexType);
      return `('${vertexType}', '${JSON.stringify(properties).replace(/'/g, "''")}'::jsonb)`;
    }).join(',');

    // Execute bulk insert
    await this.queryExecutor.executeSQL(`
      INSERT INTO ${tempTableName} (vertex_label, properties)
      VALUES ${values}
    `, [], { transaction });

    return vertices.length;
  }

  /**
   * Bulk insert edge data into a temporary table
   *
   * @param tempTableName - Name of the temporary table
   * @param edgeType - Type of edge
   * @param edges - Edge data to insert
   * @param transaction - Transaction to use
   * @param warnings - Array to collect warnings
   * @returns Number of inserted edges
   */
  private async bulkInsertEdgeData(
    tempTableName: string,
    edgeType: string,
    edges: any[],
    transaction: any,
    warnings: string[]
  ): Promise<number> {
    if (edges.length === 0) return 0;

    // Filter out edges missing from or to properties
    const validEdges = edges.filter(edge => {
      if (!edge.from || !edge.to) {
        warnings.push(`Edge in '${edgeType}' missing from or to property`);
        return false;
      }
      return true;
    });

    if (validEdges.length === 0) return 0;

    // Prepare values for bulk insert
    const values = validEdges.map(edge => {
      const properties = this.extractEdgeProperties(edge, edgeType);
      return `('${edgeType}', '${edge.from.toString().replace(/'/g, "''")}', '${edge.to.toString().replace(/'/g, "''")}', '${JSON.stringify(properties).replace(/'/g, "''")}'::jsonb)`;
    }).join(',');

    // Execute bulk insert
    await this.queryExecutor.executeSQL(`
      INSERT INTO ${tempTableName} (edge_type, from_id, to_id, properties)
      VALUES ${values}
    `, [], { transaction });

    return validEdges.length;
  }
}
