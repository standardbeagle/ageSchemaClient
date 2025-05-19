/**
 * Implementation of the BatchLoader interface
 *
 * This module provides an implementation of the BatchLoader interface
 * for loading graph data into Apache AGE using the temporary table approach.
 * It uses the age_params temporary table to store data and PostgreSQL
 * functions to retrieve the data for use with UNWIND in Cypher queries.
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { TransactionManager } from '../db/transaction';
import { DataValidator } from './data-validator';
import { CypherQueryGenerator } from './cypher-query-generator';
import { QueryBuilder } from '../query/builder';
import { BatchLoaderError, BatchLoaderErrorContext, ValidationError } from '../core/errors';
import {
  BatchLoader,
  BatchLoaderOptions,
  GraphData,
  LoadOptions,
  LoadProgress,
  LoadResult
} from './batch-loader';

/**
 * Implementation of the BatchLoader interface
 *
 * This class provides an implementation of the BatchLoader interface
 * for loading graph data into Apache AGE using the temporary table approach.
 *
 * The implementation uses the age_params temporary table to store data and
 * PostgreSQL functions to retrieve the data for use with UNWIND in Cypher queries.
 * This approach minimizes the number of transactions and improves performance
 * for large datasets.
 */
class BatchLoaderImpl<T extends SchemaDefinition> implements BatchLoader<T> {
  /**
   * Data validator
   */
  private validator: DataValidator<T>;

  /**
   * Default graph name
   */
  private defaultGraphName: string;

  /**
   * Default batch size
   */
  private defaultBatchSize: number;

  /**
   * Default validation flag
   */
  private validateBeforeLoad: boolean;

  /**
   * Schema name for PostgreSQL functions
   */
  private schemaName: string;

  /**
   * Create a new BatchLoaderImpl
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param options - Batch loader options
   */
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    options: BatchLoaderOptions = {}
  ) {
    this.validator = new DataValidator(schema);
    this.defaultGraphName = options.defaultGraphName || 'default';
    this.defaultBatchSize = options.defaultBatchSize || 1000;
    this.validateBeforeLoad = options.validateBeforeLoad !== false;
    this.schemaName = options.schemaName || 'age_schema_client';
  }

  /**
   * Load graph data into the database
   *
   * This method loads vertices and edges into the graph database using the temporary table approach.
   * It stores data in the age_params temporary table and uses PostgreSQL functions to retrieve
   * the data for use with UNWIND in Cypher queries.
   *
   * The loading process follows these steps:
   * 1. Validate the data against the schema (if validateBeforeLoad is true)
   * 2. Begin a transaction
   * 3. Load vertices in batches
   * 4. Load edges in batches
   * 5. Commit the transaction
   * 6. Return the result with counts of loaded vertices and edges
   *
   * @param graphData - Graph data to load
   * @param options - Load options
   * @returns Promise resolving to a LoadResult with counts of loaded vertices and edges
   */
  async loadGraphData(
    graphData: GraphData,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const startTime = Date.now();
    const graphName = options.graphName || this.defaultGraphName;
    const validateBeforeLoad = options.validateBeforeLoad ?? this.validateBeforeLoad;
    const batchSize = options.batchSize || this.defaultBatchSize;
    const queryGenerator = new CypherQueryGenerator(this.schema, {
      schemaName: this.schemaName
    });

    // Function to calculate elapsed time and estimated time remaining
    const calculateTiming = (processed: number, total: number) => {
      const elapsedTime = Date.now() - startTime;
      let estimatedTimeRemaining: number | undefined = undefined;

      if (processed > 0 && processed < total) {
        // Calculate estimated time remaining based on elapsed time and progress
        estimatedTimeRemaining = Math.round((elapsedTime / processed) * (total - processed));
      }

      return { elapsedTime, estimatedTimeRemaining };
    };

    // Initialize result
    const result: LoadResult = {
      success: false,
      vertexCount: 0,
      edgeCount: 0,
      warnings: [],
      errors: [],
      duration: 0
    };

    let connection;

    try {
      // Validate data if required
      if (validateBeforeLoad) {
        try {
          // Report validation progress
          if (options.onProgress) {
            const timing = calculateTiming(0, 1);
            options.onProgress({
              phase: 'validation',
              type: 'schema',
              processed: 0,
              total: 1,
              percentage: 0,
              elapsedTime: timing.elapsedTime,
              estimatedTimeRemaining: timing.estimatedTimeRemaining
            });
          }

          const validationResult = await this.validateGraphData(graphData);

          // Report validation completion
          if (options.onProgress) {
            const timing = calculateTiming(1, 1);
            options.onProgress({
              phase: 'validation',
              type: 'schema',
              processed: 1,
              total: 1,
              percentage: 100,
              elapsedTime: timing.elapsedTime,
              estimatedTimeRemaining: 0,
              warnings: validationResult.warnings
            });
          }

          if (!validationResult.isValid) {
            throw new ValidationError(`Validation failed: ${validationResult.errors.join(', ')}`);
          }

          // Add any validation warnings to the result
          if (validationResult.warnings.length > 0) {
            result.warnings!.push(...validationResult.warnings);
          }
        } catch (error) {
          // Create a BatchLoaderError with validation context
          const context: BatchLoaderErrorContext = {
            phase: 'validation',
            type: 'schema'
          };

          // Report validation error
          if (options.onProgress) {
            const timing = calculateTiming(0, 1);
            options.onProgress({
              phase: 'validation',
              type: 'schema',
              processed: 0,
              total: 1,
              percentage: 0,
              elapsedTime: timing.elapsedTime,
              estimatedTimeRemaining: undefined,
              error: {
                message: error instanceof Error ? error.message : String(error),
                type: error instanceof Error ? error.constructor.name : 'Unknown',
                recoverable: false
              }
            });
          }

          // Add error to result
          if (error instanceof Error) {
            result.errors!.push(error);
          } else {
            result.errors!.push(new BatchLoaderError('Validation failed', context, error));
          }

          // Set duration and return result
          result.duration = Date.now() - startTime;
          return result;
        }
      }

      // Get a connection from the pool
      try {
        connection = await this.queryExecutor.getConnection();
      } catch (error) {
        const context: BatchLoaderErrorContext = {
          phase: 'transaction',
          type: 'connection'
        };

        const connectionError = new BatchLoaderError(
          `Failed to get database connection: ${error instanceof Error ? error.message : String(error)}`,
          context,
          error
        );

        result.errors!.push(connectionError);
        result.duration = Date.now() - startTime;
        return result;
      }

      try {
        // Create a transaction manager
        const transactionManager = new TransactionManager(connection);
        let transaction;

        try {
          // Begin a transaction
          transaction = await transactionManager.beginTransaction({
            timeout: options.transactionTimeout || 60000, // Default to 60 seconds
            isolationLevel: 'READ COMMITTED'
          });

          // Log transaction start
          console.log(`Transaction started with ID: ${transaction.getId()}`);
        } catch (error) {
          const context: BatchLoaderErrorContext = {
            phase: 'transaction',
            type: 'begin',
            sql: 'BEGIN TRANSACTION'
          };

          throw new BatchLoaderError(
            `Failed to begin transaction: ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }

        // Ensure AGE is loaded and in search path
        try {
          await this.queryExecutor.executeSQL(`
            -- Check if AGE is loaded
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'age'
              ) THEN
                EXECUTE 'LOAD ''age''';
              END IF;
            END $$;

            -- Set search path
            SET search_path TO ag_catalog, "$user", public;
          `);
        } catch (error) {
          // Rollback the transaction if AGE setup fails
          if (transaction) {
            try {
              await transaction.rollback();
              console.log('Transaction rolled back due to AGE setup failure');
            } catch (rollbackError) {
              console.error('Error rolling back transaction:', rollbackError);
            }
          }

          const context: BatchLoaderErrorContext = {
            phase: 'transaction',
            type: 'setup',
            sql: 'LOAD AGE and set search_path'
          };

          throw new BatchLoaderError(
            `Failed to load AGE extension or set search path: ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }

        // Process data
        let vertexCount = 0;
        let edgeCount = 0;

        // Initialize warnings array
        const warnings: string[] = [];

        // Set up warnings collection if enabled
        if (options.collectWarnings) {
          if (!Array.isArray(options.warnings)) {
            options.warnings = [];
          }
        }

        // Load vertices
        try {
          vertexCount = await this.loadVertices(
            graphData.vertices,
            queryGenerator,
            graphName,
            batchSize,
            options
          );

          result.vertexCount = vertexCount;
        } catch (error) {
          // Create a context for the error
          const context: BatchLoaderErrorContext = {
            phase: 'vertices',
            data: graphData.vertices
          };

          // Wrap the error in a BatchLoaderError
          throw new BatchLoaderError(
            `Failed to load vertices: ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }

        // Load edges
        try {
          edgeCount = await this.loadEdges(
            graphData.edges,
            queryGenerator,
            graphName,
            batchSize,
            options
          );

          result.edgeCount = edgeCount;
        } catch (error) {
          // Create a context for the error
          const context: BatchLoaderErrorContext = {
            phase: 'edges',
            data: graphData.edges
          };

          // Wrap the error in a BatchLoaderError
          throw new BatchLoaderError(
            `Failed to load edges: ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }

        // Commit the transaction
        try {
          if (transaction) {
            await transaction.commit();
            console.log('Transaction committed successfully');
          } else {
            // Fallback to direct SQL if transaction object is not available
            await this.queryExecutor.executeSQL('COMMIT');
            console.log('Transaction committed via direct SQL');
          }
        } catch (error) {
          const context: BatchLoaderErrorContext = {
            phase: 'transaction',
            type: 'commit',
            sql: 'COMMIT'
          };

          throw new BatchLoaderError(
            `Failed to commit transaction: ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }

        // Set success and add warnings to result
        result.success = true;
        if (warnings.length > 0) {
          result.warnings!.push(...warnings);
        }

        // Add warnings from options if they exist
        if (options.collectWarnings && Array.isArray(options.warnings) && options.warnings.length > 0) {
          result.warnings!.push(...options.warnings);
        }

        // Set duration
        result.duration = Date.now() - startTime;

        return result;
      } catch (error) {
        // Rollback the transaction
        try {
          if (transaction) {
            await transaction.rollback();
            console.log('Transaction rolled back due to error');
          } else {
            // Fallback to direct SQL if transaction object is not available
            await this.queryExecutor.executeSQL('ROLLBACK');
            console.log('Transaction rolled back via direct SQL');
          }
        } catch (rollbackError) {
          // Log rollback error but don't throw it
          console.error('Error rolling back transaction:', rollbackError);

          // Add rollback error to result
          const rollbackContext: BatchLoaderErrorContext = {
            phase: 'transaction',
            type: 'rollback',
            sql: 'ROLLBACK'
          };

          result.errors!.push(new BatchLoaderError(
            `Failed to rollback transaction: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
            rollbackContext,
            rollbackError
          ));
        }

        // Add the original error to result
        if (error instanceof Error) {
          result.errors!.push(error);
        } else {
          result.errors!.push(new BatchLoaderError('Unknown error during batch loading', undefined, error));
        }

        // Set duration
        result.duration = Date.now() - startTime;

        return result;
      } finally {
        // Release connection back to pool
        if (connection) {
          try {
            // Report cleanup progress
            if (options.onProgress) {
              const timing = calculateTiming(0, 1);
              options.onProgress({
                phase: 'cleanup',
                type: 'connection',
                processed: 0,
                total: 1,
                percentage: 0,
                elapsedTime: timing.elapsedTime,
                estimatedTimeRemaining: timing.estimatedTimeRemaining
              });
            }

            await this.queryExecutor.releaseConnection(connection);

            // Report cleanup completion
            if (options.onProgress) {
              const timing = calculateTiming(1, 1);
              options.onProgress({
                phase: 'cleanup',
                type: 'connection',
                processed: 1,
                total: 1,
                percentage: 100,
                elapsedTime: timing.elapsedTime,
                estimatedTimeRemaining: 0
              });
            }
          } catch (error) {
            console.error('Error releasing connection:', error);

            // Report cleanup error
            if (options.onProgress) {
              const timing = calculateTiming(0, 1);
              options.onProgress({
                phase: 'cleanup',
                type: 'connection',
                processed: 0,
                total: 1,
                percentage: 0,
                elapsedTime: timing.elapsedTime,
                estimatedTimeRemaining: undefined,
                error: {
                  message: error instanceof Error ? error.message : String(error),
                  type: 'ConnectionError',
                  recoverable: true
                }
              });
            }

            // Add error to result
            const context: BatchLoaderErrorContext = {
              phase: 'cleanup',
              type: 'connection'
            };

            result.errors!.push(new BatchLoaderError(
              `Failed to release connection: ${error instanceof Error ? error.message : String(error)}`,
              context,
              error
            ));
          }
        }
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error('Unexpected error in loadGraphData:', error);

      // Add error to result
      if (error instanceof Error) {
        result.errors!.push(error);
      } else {
        result.errors!.push(new BatchLoaderError('Unexpected error during batch loading', undefined, error));
      }

      // Set duration
      result.duration = Date.now() - startTime;

      return result;
    }
  }

  /**
   * Load vertices into the graph database
   *
   * @param vertices - Vertices to load, grouped by type
   * @param queryGenerator - Cypher query generator
   * @param graphName - Graph name
   * @param batchSize - Batch size for loading
   * @param options - Load options
   * @returns Number of vertices loaded
   */
  private async loadVertices(
    vertices: Record<string, any[]>,
    queryGenerator: CypherQueryGenerator,
    graphName: string,
    batchSize: number,
    options: LoadOptions
  ): Promise<number> {
    let vertexCount = 0;
    const warnings: string[] = [];

    // Create a QueryBuilder for setting parameters
    const queryBuilder = new QueryBuilder(this.schema, this.queryExecutor, graphName);

    // Process each vertex type
    for (const [vertexType, vertexArray] of Object.entries(vertices)) {
      if (!vertexArray || !Array.isArray(vertexArray) || vertexArray.length === 0) {
        continue;
      }

      // Process vertices in batches
      for (let i = 0; i < vertexArray.length; i += batchSize) {
        try {
          const batch = vertexArray.slice(i, i + batchSize);
          const batchNumber = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(vertexArray.length / batchSize);

          // Set vertex data in the age_params table using QueryBuilder's setParam method
          try {
            const paramKey = `vertex_${vertexType}`;
            await queryBuilder.setParam(paramKey, batch);
          } catch (error) {
            // Create context for the error
            const context: BatchLoaderErrorContext = {
              phase: 'vertices',
              type: vertexType,
              index: i,
              sql: `Setting parameter 'vertex_${vertexType}' in age_params table`,
              data: { batchSize, batchNumber, totalBatches }
            };

            throw new BatchLoaderError(
              `Failed to store vertex data for type ${vertexType} (batch ${batchNumber}/${totalBatches}): ${error instanceof Error ? error.message : String(error)}`,
              context,
              error
            );
          }

          // Generate and execute the query for creating vertices
          try {
            // Generate the Cypher query for creating vertices
            const query = queryGenerator.generateCreateVerticesQuery(vertexType, graphName);

            // Log the query for debugging
            if (options.debug) {
              console.log(`Executing vertex creation query for ${vertexType}:`, query);
            }

            // Execute the query
            const result = await this.queryExecutor.executeSQL(query);

            // Update vertex count
            const createdVertices = parseInt(result.rows[0].created_vertices, 10) || 0;
            vertexCount += createdVertices;

            // Check if all vertices were created
            if (createdVertices < batch.length) {
              const warning = `Warning: Only ${createdVertices} of ${batch.length} vertices of type ${vertexType} were created in batch ${batchNumber}/${totalBatches}`;
              console.warn(warning);
              warnings.push(warning);
            } else {
              // Log success
              console.log(`Successfully created ${createdVertices} vertices of type ${vertexType} in batch ${batchNumber}/${totalBatches}`);
            }
          } catch (error) {
            // Create context for the error
            const context: BatchLoaderErrorContext = {
              phase: 'vertices',
              type: vertexType,
              index: i,
              sql: queryGenerator.generateCreateVerticesQuery(vertexType, graphName),
              data: { batchSize, batchNumber, totalBatches }
            };

            throw new BatchLoaderError(
              `Failed to create vertices of type ${vertexType} (batch ${batchNumber}/${totalBatches}): ${error instanceof Error ? error.message : String(error)}`,
              context,
              error
            );
          }

          // Report progress if callback is provided
          if (options.onProgress) {
            const timing = calculateTiming(i + batch.length, vertexArray.length);
            const percentage = Math.round(((i + batch.length) / vertexArray.length) * 100);

            // Collect any warnings for this batch
            const batchWarnings = warnings.length > 0 ?
              warnings.slice(Math.max(0, warnings.length - batch.length)) :
              undefined;

            options.onProgress({
              phase: 'vertices',
              type: vertexType,
              processed: i + batch.length,
              total: vertexArray.length,
              percentage,
              batchNumber,
              totalBatches,
              elapsedTime: timing.elapsedTime,
              estimatedTimeRemaining: timing.estimatedTimeRemaining,
              warnings: batchWarnings
            });
          }
        } catch (error) {
          // Report error in progress if callback is provided
          if (options.onProgress) {
            const timing = calculateTiming(i, vertexArray.length);
            const percentage = Math.round((i / vertexArray.length) * 100);

            options.onProgress({
              phase: 'vertices',
              type: vertexType,
              processed: i,
              total: vertexArray.length,
              percentage,
              batchNumber,
              totalBatches,
              elapsedTime: timing.elapsedTime,
              estimatedTimeRemaining: undefined,
              error: {
                message: error instanceof Error ? error.message : String(error),
                type: error instanceof Error ? error.constructor.name : 'Unknown',
                index: i,
                recoverable: false
              }
            });
          }

          // Re-throw the error to be handled by the caller
          throw error;
        }
      }
    }

    // Add warnings to the options if provided
    if (options.collectWarnings && Array.isArray(options.warnings)) {
      options.warnings.push(...warnings);
    }

    return vertexCount;
  }

  /**
   * Load edges into the graph database
   *
   * @param edges - Edges to load, grouped by type
   * @param queryGenerator - Cypher query generator
   * @param graphName - Graph name
   * @param batchSize - Batch size for loading
   * @param options - Load options
   * @returns Number of edges loaded
   */
  private async loadEdges(
    edges: Record<string, any[]>,
    queryGenerator: CypherQueryGenerator,
    graphName: string,
    batchSize: number,
    options: LoadOptions
  ): Promise<number> {
    let edgeCount = 0;
    const warnings: string[] = [];

    // Create a QueryBuilder for setting parameters
    const queryBuilder = new QueryBuilder(this.schema, this.queryExecutor, graphName);

    // Process each edge type
    for (const [edgeType, edgeArray] of Object.entries(edges)) {
      try {
        if (!edgeArray || !Array.isArray(edgeArray) || edgeArray.length === 0) {
          continue;
        }

        // Get edge definition from schema
        const edgeDef = this.schema.edges[edgeType];
        if (!edgeDef) {
          const warning = `Edge type ${edgeType} not found in schema, skipping`;
          console.warn(warning);
          warnings.push(warning);
          continue;
        }

        // Validate vertex references if validateBeforeLoad is enabled
        if (options.validateBeforeLoad !== false) {
          try {
            const validationWarnings = await this.validateEdgeReferences(edgeType, edgeDef, edgeArray, graphName);
            warnings.push(...validationWarnings);
          } catch (error) {
            // Create context for the error
            const context: BatchLoaderErrorContext = {
              phase: 'edges',
              type: edgeType,
              data: { edgeDef }
            };

            throw new BatchLoaderError(
              `Failed to validate edge references for type ${edgeType}: ${error instanceof Error ? error.message : String(error)}`,
              context,
              error
            );
          }
        }

        // Skip if no edges left after validation
        if (edgeArray.length === 0) {
          const warning = `No valid edges of type ${edgeType} after validation, skipping`;
          console.warn(warning);
          warnings.push(warning);
          continue;
        }

        // Track batch progress
        let processedCount = 0;
        const totalCount = edgeArray.length;

        // Process edges in batches
        for (let i = 0; i < edgeArray.length; i += batchSize) {
          try {
            const batch = edgeArray.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(edgeArray.length / batchSize);

            // Set edge data in the age_params table using QueryBuilder's setParam method
            try {
              const paramKey = `edge_${edgeType}`;
              await queryBuilder.setParam(paramKey, batch);
            } catch (error) {
              // Create context for the error
              const context: BatchLoaderErrorContext = {
                phase: 'edges',
                type: edgeType,
                index: i,
                sql: `Setting parameter 'edge_${edgeType}' in age_params table`,
                data: { batchSize, batchNumber, totalBatches }
              };

              throw new BatchLoaderError(
                `Failed to store edge data for type ${edgeType} (batch ${batchNumber}/${totalBatches}): ${error instanceof Error ? error.message : String(error)}`,
                context,
                error
              );
            }

            // Generate and execute the query for creating edges
            try {
              // Generate the Cypher query for creating edges
              const query = queryGenerator.generateCreateEdgesQuery(edgeType, graphName);

              // Log the query for debugging
              if (options.debug) {
                console.log(`Executing edge creation query for ${edgeType}:`, query);
              }

              // Execute the query
              const result = await this.queryExecutor.executeSQL(query);

              // Update edge count
              const createdEdges = parseInt(result.rows[0].created_edges, 10) || 0;
              edgeCount += createdEdges;

              // Update processed count
              processedCount += batch.length;

              // Log warning if not all edges were created
              if (createdEdges < batch.length) {
                const warning = `Warning: Only ${createdEdges} of ${batch.length} edges of type ${edgeType} were created in batch ${batchNumber}/${totalBatches}`;
                console.warn(warning);
                warnings.push(warning);
              } else {
                // Log success
                console.log(`Successfully created ${createdEdges} edges of type ${edgeType} in batch ${batchNumber}/${totalBatches}`);
              }
            } catch (error) {
              // Create context for the error
              const context: BatchLoaderErrorContext = {
                phase: 'edges',
                type: edgeType,
                index: i,
                sql: queryGenerator.generateCreateEdgesQuery(edgeType, graphName),
                data: { batchSize, batchNumber, totalBatches }
              };

              throw new BatchLoaderError(
                `Failed to create edges of type ${edgeType} (batch ${batchNumber}/${totalBatches}): ${error instanceof Error ? error.message : String(error)}`,
                context,
                error
              );
            }

            // Report progress if callback is provided
            if (options.onProgress) {
              const timing = calculateTiming(processedCount, totalCount);
              const percentage = Math.round((processedCount / totalCount) * 100);

              // Collect any warnings for this batch
              const batchWarnings = warnings.length > 0 ?
                warnings.slice(Math.max(0, warnings.length - batch.length)) :
                undefined;

              options.onProgress({
                phase: 'edges',
                type: edgeType,
                processed: processedCount,
                total: totalCount,
                percentage,
                batchNumber,
                totalBatches,
                elapsedTime: timing.elapsedTime,
                estimatedTimeRemaining: timing.estimatedTimeRemaining,
                warnings: batchWarnings
              });
            }
          } catch (error) {
            // Report error in progress if callback is provided
            if (options.onProgress) {
              const timing = calculateTiming(processedCount, totalCount);
              const percentage = Math.round((processedCount / totalCount) * 100);

              options.onProgress({
                phase: 'edges',
                type: edgeType,
                processed: processedCount,
                total: totalCount,
                percentage,
                batchNumber,
                totalBatches,
                elapsedTime: timing.elapsedTime,
                estimatedTimeRemaining: undefined,
                error: {
                  message: error instanceof Error ? error.message : String(error),
                  type: error instanceof Error ? error.constructor.name : 'Unknown',
                  index: i,
                  recoverable: options.continueOnError === true
                }
              });
            }

            // If continueOnError is true, log the error and continue
            if (options.continueOnError === true) {
              const batchNumber = Math.floor(i / batchSize) + 1;
              const totalBatches = Math.ceil(edgeArray.length / batchSize);
              const errorMessage = `Error loading batch ${batchNumber}/${totalBatches} of edge type ${edgeType}: ${error instanceof Error ? error.message : String(error)}`;
              console.error(errorMessage);
              warnings.push(errorMessage);
            } else {
              // Otherwise, re-throw the error to be handled by the caller
              throw error;
            }
          }
        }
      } catch (error) {
        // Create context for the error
        const context: BatchLoaderErrorContext = {
          phase: 'edges',
          type: edgeType,
          data: { edgeCount, processedTypes: Object.keys(edges).indexOf(edgeType) }
        };

        // If continueOnError is true, log the error and continue
        if (options.continueOnError === true) {
          const errorMessage = `Error loading edge type ${edgeType}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMessage);
          warnings.push(errorMessage);
        } else {
          // Otherwise, throw a BatchLoaderError
          throw new BatchLoaderError(
            `Failed to load edges of type ${edgeType}: ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }
      }
    }

    // Add warnings to the result if provided in options
    if (options.collectWarnings && Array.isArray(options.warnings)) {
      options.warnings.push(...warnings);
    }

    return edgeCount;
  }

  /**
   * Validate edge references against existing vertices
   *
   * @param edgeType - Edge type
   * @param edgeDef - Edge definition from schema
   * @param edgeArray - Array of edges to validate
   * @param graphName - Graph name
   * @returns Promise that resolves to an array of warning messages
   * @throws BatchLoaderError if validation fails
   */
  private async validateEdgeReferences(
    edgeType: string,
    edgeDef: any,
    edgeArray: any[],
    graphName: string
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Get the from and to vertex types from the edge definition
    const fromType = edgeDef.from;
    const toType = edgeDef.to;

    if (!fromType || !toType) {
      const context: BatchLoaderErrorContext = {
        phase: 'validation',
        type: edgeType,
        data: { edgeDef }
      };

      throw new BatchLoaderError(
        `Edge type ${edgeType} is missing from or to vertex type in schema`,
        context
      );
    }

    // Extract all from and to IDs from the edge array
    const fromIds = edgeArray.map(edge => edge.from);
    const toIds = edgeArray.map(edge => edge.to);

    // Create a QueryBuilder for setting and retrieving parameters
    const queryBuilder = new QueryBuilder(this.schema, this.queryExecutor, graphName);

    // Check if the from vertices exist
    try {
      // Store the from IDs in the age_params table
      await queryBuilder.setParam('from_ids', fromIds);

      // Build a query to find the from vertices
      const fromResult = await queryBuilder
        .withAgeParam('from_ids', 'ids')
        .match(fromType, 'v')
        .done()
        .where('v.id IN ids')
        .return('v.id AS id')
        .execute();

      const existingFromIds = fromResult.rows.map(row =>
        typeof row.id === 'string' ? JSON.parse(row.id) : row.id
      );

      // Store the to IDs in the age_params table
      await queryBuilder.setParam('to_ids', toIds);

      // Build a query to find the to vertices
      const toResult = await queryBuilder
        .withAgeParam('to_ids', 'ids')
        .match(toType, 'v')
        .done()
        .where('v.id IN ids')
        .return('v.id AS id')
        .execute();

      const existingToIds = toResult.rows.map(row =>
        typeof row.id === 'string' ? JSON.parse(row.id) : row.id
      );

      // Find missing from and to IDs
      const missingFromIds = fromIds.filter(id => !existingFromIds.includes(id));
      const missingToIds = toIds.filter(id => !existingToIds.includes(id));

      // Log warnings for missing vertices
      if (missingFromIds.length > 0) {
        const warning = `Warning: ${missingFromIds.length} source vertices of type ${fromType} not found for edge type ${edgeType}`;
        console.warn(warning);
        warnings.push(warning);

        // Add detailed warnings for each missing ID (limit to first 10)
        const detailedIds = missingFromIds.slice(0, 10);
        if (detailedIds.length > 0) {
          const detailedWarning = `Missing source vertex IDs: ${detailedIds.join(', ')}${missingFromIds.length > 10 ? ' and more...' : ''}`;
          console.warn(detailedWarning);
          warnings.push(detailedWarning);
        }
      }

      if (missingToIds.length > 0) {
        const warning = `Warning: ${missingToIds.length} target vertices of type ${toType} not found for edge type ${edgeType}`;
        console.warn(warning);
        warnings.push(warning);

        // Add detailed warnings for each missing ID (limit to first 10)
        const detailedIds = missingToIds.slice(0, 10);
        if (detailedIds.length > 0) {
          const detailedWarning = `Missing target vertex IDs: ${detailedIds.join(', ')}${missingToIds.length > 10 ? ' and more...' : ''}`;
          console.warn(detailedWarning);
          warnings.push(detailedWarning);
        }
      }

      // Count edges before filtering
      const originalCount = edgeArray.length;

      // Filter out edges with missing vertices
      const validEdges = edgeArray.filter(edge =>
        existingFromIds.includes(edge.from) && existingToIds.includes(edge.to)
      );

      // Replace the edge array with the filtered array
      edgeArray.length = 0;
      edgeArray.push(...validEdges);

      // Log warning if edges were filtered out
      if (validEdges.length < originalCount) {
        const warning = `Warning: Filtered out ${originalCount - validEdges.length} invalid edges of type ${edgeType}`;
        console.warn(warning);
        warnings.push(warning);
      }

      return warnings;
    } catch (error) {
      // Create context for the error
      const context: BatchLoaderErrorContext = {
        phase: 'validation',
        type: edgeType,
        sql: `Cypher query to validate edge references for ${edgeType}`,
        data: { fromType, toType, fromIds, toIds }
      };

      throw new BatchLoaderError(
        `Failed to validate edge references for type ${edgeType}: ${error instanceof Error ? error.message : String(error)}`,
        context,
        error
      );
    }
  }

  /**
   * Validate graph data against the schema
   *
   * This method validates the graph data against the schema definition.
   * It checks that all vertices and edges have the required properties
   * and that the property types match the schema definition.
   *
   * For edges, it also validates that the from and to vertex types
   * match the schema definition.
   *
   * @param graphData - Graph data to validate
   * @returns Promise resolving to a validation result with errors and warnings
   * @throws BatchLoaderError if validation fails
   */
  async validateGraphData(graphData: GraphData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      // Validate the data structure first
      if (!graphData) {
        return {
          isValid: false,
          errors: ['Graph data is required'],
          warnings: []
        };
      }

      if (!graphData.vertices || typeof graphData.vertices !== 'object') {
        return {
          isValid: false,
          errors: ['Graph data must contain a vertices object'],
          warnings: []
        };
      }

      if (!graphData.edges || typeof graphData.edges !== 'object') {
        return {
          isValid: false,
          errors: ['Graph data must contain an edges object'],
          warnings: []
        };
      }

      // Use the data validator to validate the data against the schema
      const validationResult = this.validator.validateData(graphData);

      // Format the errors for better readability
      const formattedErrors = validationResult.errors?.map(error => {
        let message = `${error.type} ${error.entityType}`;

        if (error.index !== undefined) {
          message += ` at index ${error.index}`;
        }

        message += `: ${error.message}`;

        if (error.property) {
          message += ` (property: ${error.property})`;
        }

        return message;
      }) || [];

      return {
        isValid: validationResult.valid,
        errors: formattedErrors,
        warnings: validationResult.warnings || []
      };
    } catch (error) {
      // Create context for the error
      const context: BatchLoaderErrorContext = {
        phase: 'validation',
        type: 'schema',
        data: {
          vertexTypes: Object.keys(graphData.vertices),
          edgeTypes: Object.keys(graphData.edges)
        }
      };

      throw new BatchLoaderError(
        `Failed to validate graph data: ${error instanceof Error ? error.message : String(error)}`,
        context,
        error
      );
    }
  }
}

/**
 * Create a new BatchLoader instance
 *
 * @param schema - Schema definition
 * @param queryExecutor - Query executor
 * @param options - Batch loader options
 * @returns A new BatchLoader instance
 */
export function createBatchLoader<T extends SchemaDefinition>(
  schema: T,
  queryExecutor: QueryExecutor,
  options?: BatchLoaderOptions
): BatchLoader<T> {
  return new BatchLoaderImpl(schema, queryExecutor, options);
}
