/**
 * Implementation of the BatchLoader interface
 *
 * This module provides an implementation of the BatchLoader interface
 * for loading graph data into Apache AGE.
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { TransactionManager } from '../db/transaction';
import { DataValidator } from './data-validator';
import { CypherQueryGenerator } from './cypher-query-generator';
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
 * for loading graph data into Apache AGE.
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
  }

  /**
   * Load graph data into the database
   *
   * @param graphData - Graph data to load
   * @param options - Load options
   * @returns Promise resolving to a LoadResult with counts of loaded vertices and edges
   */
  async loadGraphData(
    graphData: GraphData,
    options: LoadOptions = {}
  ): Promise<LoadResult> {
    const graphName = options.graphName || this.defaultGraphName;
    const validateBeforeLoad = options.validateBeforeLoad ?? this.validateBeforeLoad;
    const batchSize = options.batchSize || this.defaultBatchSize;
    const queryGenerator = new CypherQueryGenerator(this.schema);

    // Validate data if required
    if (validateBeforeLoad) {
      const validationResult = await this.validateGraphData(graphData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    // Get a connection from the pool
    const connection = await this.queryExecutor.getConnection();

    try {
      // Create a transaction
      await this.queryExecutor.executeSQL('BEGIN');

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
        const warnings: string[] = [];

        // Load vertices
        for (const [vertexType, vertexArray] of Object.entries(graphData.vertices)) {
          if (!vertexArray || !Array.isArray(vertexArray) || vertexArray.length === 0) {
            continue;
          }

          // Process vertices in batches
          for (let i = 0; i < vertexArray.length; i += batchSize) {
            const batch = vertexArray.slice(i, i + batchSize);

            // Set vertex data in the age_params table
            await this.queryExecutor.executeSQL(`
              INSERT INTO age_schema_client.age_params (key, value)
              VALUES ('vertex_${vertexType}', $1::jsonb)
              ON CONFLICT (key) DO UPDATE SET value = $1::jsonb;
            `, [JSON.stringify(batch)]);

            // Generate and execute the query for creating vertices
            const query = queryGenerator.generateCreateVerticesQuery(vertexType, graphName);
            const result = await this.queryExecutor.executeSQL(query);

            // Update vertex count
            const createdVertices = parseInt(result.rows[0].created_vertices, 10) || 0;
            vertexCount += createdVertices;

            // Report progress if callback is provided
            if (options.onProgress) {
              options.onProgress({
                phase: 'vertices',
                type: vertexType,
                processed: i + batch.length,
                total: vertexArray.length,
                percentage: Math.round(((i + batch.length) / vertexArray.length) * 100)
              });
            }
          }
        }

        // Load edges
        for (const [edgeType, edgeArray] of Object.entries(graphData.edges)) {
          if (!edgeArray || !Array.isArray(edgeArray) || edgeArray.length === 0) {
            continue;
          }

          // Process edges in batches
          for (let i = 0; i < edgeArray.length; i += batchSize) {
            const batch = edgeArray.slice(i, i + batchSize);

            // Set edge data in the age_params table
            await this.queryExecutor.executeSQL(`
              INSERT INTO age_schema_client.age_params (key, value)
              VALUES ('edge_${edgeType}', $1::jsonb)
              ON CONFLICT (key) DO UPDATE SET value = $1::jsonb;
            `, [JSON.stringify(batch)]);

            // Generate and execute the query for creating edges
            const query = queryGenerator.generateCreateEdgesQuery(edgeType, graphName);
            const result = await this.queryExecutor.executeSQL(query);

            // Update edge count
            const createdEdges = parseInt(result.rows[0].created_edges, 10) || 0;
            edgeCount += createdEdges;

            // Report progress if callback is provided
            if (options.onProgress) {
              options.onProgress({
                phase: 'edges',
                type: edgeType,
                processed: i + batch.length,
                total: edgeArray.length,
                percentage: Math.round(((i + batch.length) / edgeArray.length) * 100)
              });
            }
          }
        }

        // Commit the transaction
        await this.queryExecutor.executeSQL('COMMIT');

        return { vertexCount, edgeCount, warnings };
      } catch (error) {
        // Rollback the transaction
        await this.queryExecutor.executeSQL('ROLLBACK');
        throw error;
      } finally {
        // Release connection back to pool
        await this.queryExecutor.releaseConnection(connection);
      }
  }

  /**
   * Validate graph data against the schema
   *
   * @param graphData - Graph data to validate
   * @returns Promise resolving to a validation result with errors and warnings
   */
  async validateGraphData(graphData: GraphData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const validationResult = this.validator.validateData(graphData);

    return {
      isValid: validationResult.valid,
      errors: validationResult.errors?.map(error =>
        `${error.type} ${error.entityType} at index ${error.index}: ${error.message}`
      ) || [],
      warnings: validationResult.warnings || []
    };
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
