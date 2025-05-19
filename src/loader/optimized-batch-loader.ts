/**
 * Optimized implementation of the BatchLoader interface
 *
 * This module provides an optimized implementation of the BatchLoader interface
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
import { OptimizedCypherQueryGenerator } from './optimized-cypher-query-generator';
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
 * Optimized implementation of the BatchLoader interface
 *
 * This class provides an optimized implementation of the BatchLoader interface
 * for loading graph data into Apache AGE using the temporary table approach.
 *
 * The implementation uses the age_params temporary table to store data and
 * PostgreSQL functions to retrieve the data for use with UNWIND in Cypher queries.
 * This approach minimizes the number of transactions and improves performance
 * for large datasets.
 */
class OptimizedBatchLoaderImpl<T extends SchemaDefinition> implements BatchLoader<T> {
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
   * Create a new OptimizedBatchLoaderImpl
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
   * Validate graph data against the schema
   *
   * @param graphData - Graph data to validate
   * @returns Promise resolving to a validation result
   */
  async validateGraphData(graphData: GraphData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    if (!graphData) {
      return {
        isValid: false,
        errors: ['Graph data is required'],
        warnings: []
      };
    }

    try {
      return this.validator.validateData(graphData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
    const queryGenerator = new OptimizedCypherQueryGenerator(this.schema, {
      schemaName: this.schemaName,
      includeComments: options.debug || false,
      useIndexHints: true,
      useOptimizedBatchTemplates: true,
      includeAgeSetup: false // We'll handle this at the connection level
    });

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
    let transaction;

    try {
      // Validate data if required
      if (validateBeforeLoad) {
        const validationResult = await this.validateGraphData(graphData);

        if (!validationResult.isValid) {
          throw new ValidationError(`Validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Add any validation warnings to the result
        if (validationResult.warnings.length > 0) {
          result.warnings!.push(...validationResult.warnings);
        }
      }

      // Get a connection from the pool
      connection = await this.queryExecutor.getConnection();

      // Create a transaction manager
      const transactionManager = new TransactionManager(connection);

      // Begin a transaction
      transaction = await transactionManager.beginTransaction({
        timeout: options.transactionTimeout || 60000, // Default to 60 seconds
        isolationLevel: 'READ COMMITTED'
      });

      if (options.debug) {
        console.log(`Transaction started with ID: ${transaction.getId()}`);
      }

      // Ensure AGE is loaded and in search path
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

      // Process data
      let vertexCount = 0;
      let edgeCount = 0;

      // Initialize warnings array
      const warnings: string[] = [];

      // Load vertices
      vertexCount = await this.loadVertices(
        graphData.vertices,
        queryGenerator,
        graphName,
        batchSize,
        options
      );

      result.vertexCount = vertexCount;

      // Load edges
      edgeCount = await this.loadEdges(
        graphData.edges,
        queryGenerator,
        graphName,
        batchSize,
        options
      );

      result.edgeCount = edgeCount;

      // Commit the transaction
      await transaction.commit();
      if (options.debug) {
        console.log('Transaction committed successfully');
      }

      // Set success and add warnings to result
      result.success = true;
      if (warnings.length > 0) {
        result.warnings!.push(...warnings);
      }

      // Set duration
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      // Rollback the transaction
      if (transaction) {
        try {
          await transaction.rollback();
          if (options.debug) {
            console.log('Transaction rolled back due to error');
          }
        } catch (rollbackError) {
          // Log rollback error but don't throw it
          console.error('Error rolling back transaction:', rollbackError);
        }
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
          await this.queryExecutor.releaseConnection(connection);
        } catch (error) {
          console.error('Error releasing connection:', error);
        }
      }
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
    queryGenerator: OptimizedCypherQueryGenerator<T>,
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
        const batch = vertexArray.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(vertexArray.length / batchSize);

        try {
          // Set vertex data in the age_params table using QueryBuilder's setParam method
          const paramKey = `vertex_${vertexType}`;
          await queryBuilder.setParam(paramKey, batch);

          // Generate and execute the query for creating vertices
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
            if (options.debug) {
              console.warn(warning);
            }
            warnings.push(warning);
          } else if (options.debug) {
            // Log success
            console.log(`Successfully created ${createdVertices} vertices of type ${vertexType} in batch ${batchNumber}/${totalBatches}`);
          }

          // Report progress if callback is provided
          if (options.onProgress) {
            const elapsedTime = Date.now() - startTime;
            const percentage = Math.round(((i + batch.length) / vertexArray.length) * 100);

            options.onProgress({
              phase: 'vertices',
              type: vertexType,
              processed: i + batch.length,
              total: vertexArray.length,
              percentage,
              batchNumber,
              totalBatches,
              elapsedTime,
              warnings: warnings.length > 0 ? warnings.slice(-1) : undefined
            });
          }
        } catch (error) {
          // Create context for the error
          const context: BatchLoaderErrorContext = {
            phase: 'vertices',
            type: vertexType,
            index: i,
            data: { batchSize, batchNumber, totalBatches }
          };

          throw new BatchLoaderError(
            `Failed to create vertices of type ${vertexType} (batch ${batchNumber}/${totalBatches}): ${error instanceof Error ? error.message : String(error)}`,
            context,
            error
          );
        }
      }
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
    queryGenerator: OptimizedCypherQueryGenerator<T>,
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
      if (!edgeArray || !Array.isArray(edgeArray) || edgeArray.length === 0) {
        continue;
      }

      // Get edge definition from schema
      const edgeDef = this.schema.edges[edgeType];
      if (!edgeDef) {
        const warning = `Edge type ${edgeType} not found in schema, skipping`;
        if (options.debug) {
          console.warn(warning);
        }
        warnings.push(warning);
        continue;
      }

      // Process edges in batches
      for (let i = 0; i < edgeArray.length; i += batchSize) {
        const batch = edgeArray.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(edgeArray.length / batchSize);

        try {
          // Set edge data in the age_params table using QueryBuilder's setParam method
          const paramKey = `edge_${edgeType}`;
          await queryBuilder.setParam(paramKey, batch);

          // Generate and execute the query for creating edges
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

          // Log warning if not all edges were created
          if (createdEdges < batch.length) {
            const warning = `Warning: Only ${createdEdges} of ${batch.length} edges of type ${edgeType} were created in batch ${batchNumber}/${totalBatches}`;
            if (options.debug) {
              console.warn(warning);
            }
            warnings.push(warning);
          } else if (options.debug) {
            // Log success
            console.log(`Successfully created ${createdEdges} edges of type ${edgeType} in batch ${batchNumber}/${totalBatches}`);
          }

          // Report progress if callback is provided
          if (options.onProgress) {
            const elapsedTime = Date.now() - startTime;
            const percentage = Math.round(((i + batch.length) / edgeArray.length) * 100);

            options.onProgress({
              phase: 'edges',
              type: edgeType,
              processed: i + batch.length,
              total: edgeArray.length,
              percentage,
              batchNumber,
              totalBatches,
              elapsedTime,
              warnings: warnings.length > 0 ? warnings.slice(-1) : undefined
            });
          }
        } catch (error) {
          // Create context for the error
          const context: BatchLoaderErrorContext = {
            phase: 'edges',
            type: edgeType,
            index: i,
            data: { batchSize, batchNumber, totalBatches }
          };

          // If continueOnError is true, log the error and continue
          if (options.continueOnError === true) {
            const errorMessage = `Error loading batch ${batchNumber}/${totalBatches} of edge type ${edgeType}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMessage);
            warnings.push(errorMessage);
          } else {
            // Otherwise, throw a BatchLoaderError
            throw new BatchLoaderError(
              `Failed to create edges of type ${edgeType} (batch ${batchNumber}/${totalBatches}): ${error instanceof Error ? error.message : String(error)}`,
              context,
              error
            );
          }
        }
      }
    }

    return edgeCount;
  }
}

/**
 * Create a new OptimizedBatchLoader
 *
 * @param schema - Schema definition
 * @param queryExecutor - Query executor
 * @param options - Batch loader options
 * @returns A new OptimizedBatchLoader instance
 */
export function createOptimizedBatchLoader<T extends SchemaDefinition>(
  schema: T,
  queryExecutor: QueryExecutor,
  options: BatchLoaderOptions = {}
): BatchLoader<T> {
  return new OptimizedBatchLoaderImpl(schema, queryExecutor, options);
}

// Variable to track start time for progress reporting
const startTime = Date.now();
