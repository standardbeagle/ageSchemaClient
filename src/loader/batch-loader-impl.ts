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

        // Initialize warnings array
        const warnings: string[] = [];

        // Set up warnings collection if enabled
        if (options.collectWarnings) {
          if (!Array.isArray(options.warnings)) {
            options.warnings = [];
          }
        }

        // Load vertices
        vertexCount = await this.loadVertices(
          graphData.vertices,
          queryGenerator,
          graphName,
          batchSize,
          options
        );

        // Load edges
        edgeCount = await this.loadEdges(
          graphData.edges,
          queryGenerator,
          graphName,
          batchSize,
          options
        );

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

    // Process each vertex type
    for (const [vertexType, vertexArray] of Object.entries(vertices)) {
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
          const validationWarnings = await this.validateEdgeReferences(edgeType, edgeDef, edgeArray, graphName);
          warnings.push(...validationWarnings);
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

            // Update processed count
            processedCount += batch.length;

            // Report progress if callback is provided
            if (options.onProgress) {
              options.onProgress({
                phase: 'edges',
                type: edgeType,
                processed: processedCount,
                total: totalCount,
                percentage: Math.round((processedCount / totalCount) * 100)
              });
            }

            // Log warning if not all edges were created
            if (createdEdges < batch.length) {
              const warning = `Warning: Only ${createdEdges} of ${batch.length} edges of type ${edgeType} were created in batch ${i / batchSize + 1}`;
              console.warn(warning);
              warnings.push(warning);
            }
          } catch (error) {
            // Log error and continue with next batch
            const errorMessage = `Error loading batch ${i / batchSize + 1} of edge type ${edgeType}: ${error.message}`;
            console.error(errorMessage);
            warnings.push(errorMessage);

            // Report error in progress if callback is provided
            if (options.onProgress) {
              options.onProgress({
                phase: 'edges',
                type: edgeType,
                processed: processedCount,
                total: totalCount,
                percentage: Math.round((processedCount / totalCount) * 100),
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        // Log error and continue with next edge type
        const errorMessage = `Error loading edge type ${edgeType}: ${error.message}`;
        console.error(errorMessage);
        warnings.push(errorMessage);
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
   * @throws Error if validation fails and validateBeforeLoad is true
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
      throw new Error(`Edge type ${edgeType} is missing from or to vertex type in schema`);
    }

    // Extract all from and to IDs from the edge array
    const fromIds = edgeArray.map(edge => edge.from);
    const toIds = edgeArray.map(edge => edge.to);

    // Check if the from vertices exist
    const fromVerticesQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (v:${fromType})
        WHERE v.id IN $ids
        RETURN v.id AS id
      $$, '{"ids": ${JSON.stringify(fromIds)}}') AS (id agtype);
    `;

    const fromResult = await this.queryExecutor.executeSQL(fromVerticesQuery);
    const existingFromIds = fromResult.rows.map(row => row.id.toString().replace(/^"|"$/g, ''));

    // Check if the to vertices exist
    const toVerticesQuery = `
      SELECT * FROM cypher('${graphName}', $$
        MATCH (v:${toType})
        WHERE v.id IN $ids
        RETURN v.id AS id
      $$, '{"ids": ${JSON.stringify(toIds)}}') AS (id agtype);
    `;

    const toResult = await this.queryExecutor.executeSQL(toVerticesQuery);
    const existingToIds = toResult.rows.map(row => row.id.toString().replace(/^"|"$/g, ''));

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
