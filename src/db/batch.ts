/**
 * Batch operations implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from './query';
import { SQLGenerator } from '../sql/generator';
import { Transaction } from './transaction';
import { VertexData, Vertex, VertexOperations } from './vertex';
import { EdgeData, Edge, EdgeOperations } from './edge';
import { getTempTableName } from '../sql/utils';
import { performance } from 'perf_hooks';

// Import SQL extensions
import '../sql/extensions';

/**
 * Batch operation options
 */
export interface BatchOperationOptions {
  /**
   * Batch size for chunking large operations
   * @default 1000
   */
  batchSize?: number;

  /**
   * Whether to use temporary tables for bulk operations
   * @default true
   */
  useTempTables?: boolean;

  /**
   * Whether to collect performance metrics
   * @default false
   */
  collectMetrics?: boolean;

  /**
   * Transaction to use for the batch operation
   * If not provided, a new transaction will be created
   */
  transaction?: Transaction;
}

/**
 * Default batch operation options
 */
const DEFAULT_BATCH_OPTIONS: BatchOperationOptions = {
  batchSize: 1000,
  useTempTables: true,
  collectMetrics: false,
};

/**
 * Performance metrics for batch operations
 */
export interface BatchPerformanceMetrics {
  /**
   * Total operation duration in milliseconds
   */
  totalDuration: number;

  /**
   * SQL generation duration in milliseconds
   */
  sqlGenerationDuration: number;

  /**
   * Database execution duration in milliseconds
   */
  dbExecutionDuration: number;

  /**
   * Validation duration in milliseconds
   */
  validationDuration: number;

  /**
   * Number of items processed
   */
  itemCount: number;

  /**
   * Number of batches processed
   */
  batchCount: number;

  /**
   * Items processed per second
   */
  itemsPerSecond: number;
}

/**
 * Batch operations class
 *
 * Provides optimized methods for batch operations on vertices and edges
 */
export class BatchOperations<T extends SchemaDefinition> {
  /**
   * Create a new batch operations instance
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param sqlGenerator - SQL generator
   * @param vertexOperations - Vertex operations
   * @param edgeOperations - Edge operations
   */
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    private sqlGenerator: SQLGenerator,
    private vertexOperations: VertexOperations<T>,
    private edgeOperations: EdgeOperations<T>
  ) {}

  /**
   * Create multiple vertices in a batch operation
   *
   * @param label - Vertex label
   * @param dataArray - Array of vertex data
   * @param options - Batch operation options
   * @returns Array of created vertices
   */
  async createVerticesBatch<L extends keyof T['vertices']>(
    label: L,
    dataArray: VertexData<T, L>[],
    options: BatchOperationOptions = {}
  ): Promise<Vertex<T, L>[]> {
    if (dataArray.length === 0) {
      return [];
    }

    const mergedOptions = { ...DEFAULT_BATCH_OPTIONS, ...options };
    const metrics: Partial<BatchPerformanceMetrics> = {};
    const startTime = performance.now();
    let validationTime = 0;

    try {
      // Validate all data items against schema
      const validationStart = performance.now();
      dataArray.forEach(data => this.vertexOperations.validateVertexData(label, data));
      validationTime = performance.now() - validationStart;

      if (mergedOptions.collectMetrics) {
        metrics.validationDuration = validationTime;
      }

      // Use temporary tables for very large batches if enabled
      if (mergedOptions.useTempTables && dataArray.length > mergedOptions.batchSize!) {
        return this.createVerticesWithTempTable(label, dataArray, mergedOptions, metrics);
      } else {
        // Process in chunks if the data array is large
        if (dataArray.length > mergedOptions.batchSize!) {
          return this.createVerticesInChunks(label, dataArray, mergedOptions, metrics);
        } else {
          // Use standard batch insert for smaller batches
          const sqlGenStart = performance.now();
          const { sql, params } = this.sqlGenerator.generateBatchInsertVertexSQL(label as string, dataArray);
          const sqlGenTime = performance.now() - sqlGenStart;

          if (mergedOptions.collectMetrics) {
            metrics.sqlGenerationDuration = sqlGenTime;
          }

          const dbExecStart = performance.now();
          const result = await this.queryExecutor.executeSQL(sql, params);
          const dbExecTime = performance.now() - dbExecStart;

          if (mergedOptions.collectMetrics) {
            metrics.dbExecutionDuration = dbExecTime;
          }

          const vertices = result.rows.map(row => this.vertexOperations.transformToVertex(label, row));

          if (mergedOptions.collectMetrics) {
            this.collectAndReturnMetrics(metrics, startTime, dataArray.length, 1);
          }

          return vertices;
        }
      }
    } catch (error) {
      throw new Error(`Batch vertex creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create multiple edges in a batch operation
   *
   * @param label - Edge label
   * @param edges - Array of edge data with source and target vertices
   * @param options - Batch operation options
   * @returns Array of created edges
   */
  async createEdgesBatch<L extends keyof T['edges']>(
    label: L,
    edges: Array<{
      fromVertex: Vertex<T, any>;
      toVertex: Vertex<T, any>;
      data?: EdgeData<T, L>;
    }>,
    options: BatchOperationOptions = {}
  ): Promise<Edge<T, L>[]> {
    if (edges.length === 0) {
      return [];
    }

    const mergedOptions = { ...DEFAULT_BATCH_OPTIONS, ...options };
    const metrics: Partial<BatchPerformanceMetrics> = {};
    const startTime = performance.now();
    let validationTime = 0;

    try {
      // Validate all data items against schema
      const validationStart = performance.now();
      edges.forEach(edge => {
        this.edgeOperations.validateEdgeData(label, edge.data || {});
        this.edgeOperations.validateVertexTypes(label, edge.fromVertex, edge.toVertex);
      });
      validationTime = performance.now() - validationStart;

      if (mergedOptions.collectMetrics) {
        metrics.validationDuration = validationTime;
      }

      // Convert to format expected by SQL generator
      const edgeData = edges.map(edge => ({
        sourceId: edge.fromVertex.id,
        targetId: edge.toVertex.id,
        data: edge.data || {}
      }));

      // Use temporary tables for very large batches if enabled
      if (mergedOptions.useTempTables && edges.length > mergedOptions.batchSize!) {
        return this.createEdgesWithTempTable(label, edgeData, mergedOptions, metrics);
      } else {
        // Process in chunks if the data array is large
        if (edges.length > mergedOptions.batchSize!) {
          return this.createEdgesInChunks(label, edgeData, mergedOptions, metrics);
        } else {
          // Use standard batch insert for smaller batches
          const sqlGenStart = performance.now();
          const { sql, params } = this.sqlGenerator.generateBatchInsertEdgeSQL(label as string, edgeData);
          const sqlGenTime = performance.now() - sqlGenStart;

          if (mergedOptions.collectMetrics) {
            metrics.sqlGenerationDuration = sqlGenTime;
          }

          const dbExecStart = performance.now();
          const result = await this.queryExecutor.executeSQL(sql, params);
          const dbExecTime = performance.now() - dbExecStart;

          if (mergedOptions.collectMetrics) {
            metrics.dbExecutionDuration = dbExecTime;
          }

          const createdEdges = result.rows.map(row => this.edgeOperations.transformToEdge(label, row));

          if (mergedOptions.collectMetrics) {
            this.collectAndReturnMetrics(metrics, startTime, edges.length, 1);
          }

          return createdEdges;
        }
      }
    } catch (error) {
      throw new Error(`Batch edge creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create vertices using a temporary table for large batches
   *
   * @param label - Vertex label
   * @param dataArray - Array of vertex data
   * @param options - Batch operation options
   * @param metrics - Performance metrics
   * @returns Array of created vertices
   * @private
   */
  private async createVerticesWithTempTable<L extends keyof T['vertices']>(
    label: L,
    dataArray: VertexData<T, L>[],
    options: BatchOperationOptions,
    metrics: Partial<BatchPerformanceMetrics>
  ): Promise<Vertex<T, L>[]> {
    const tempTableName = getTempTableName(`${label as string}_batch`);
    const transaction = options.transaction || await this.queryExecutor.beginTransaction();
    const sqlGenStart = performance.now();

    try {
      // Create temporary table
      const createTempTableSQL = (this.sqlGenerator as any).generateCreateTempVertexTableSQL(
        label as string,
        tempTableName
      );

      // Generate COPY statement for bulk loading
      const copySQL = (this.sqlGenerator as any).generateCopyVertexSQL(
        label as string,
        tempTableName,
        Object.keys(this.schema.vertices[label as string].properties)
      );

      // Generate INSERT statement to move data from temp table to actual table
      const insertFromTempSQL = (this.sqlGenerator as any).generateInsertFromTempTableSQL(
        label as string,
        tempTableName
      );

      const sqlGenTime = performance.now() - sqlGenStart;
      if (options.collectMetrics) {
        metrics.sqlGenerationDuration = sqlGenTime;
      }

      // Execute in transaction
      const dbExecStart = performance.now();

      // Create temp table
      await this.queryExecutor.executeSQL(createTempTableSQL.sql, [], { transaction });

      // Load data into temp table using COPY
      const dataString = this.formatDataForCopy(dataArray, label);
      await this.queryExecutor.executeCopyFrom(copySQL.sql, dataString, { transaction });

      // Insert from temp table to actual table
      const result = await this.queryExecutor.executeSQL(insertFromTempSQL.sql, [], { transaction });

      // Commit transaction if we created it
      if (!options.transaction) {
        await transaction.commit();
      }

      const dbExecTime = performance.now() - dbExecStart;
      if (options.collectMetrics) {
        metrics.dbExecutionDuration = dbExecTime;
      }

      const vertices = result.rows.map(row => this.vertexOperations.transformToVertex(label, row));

      if (options.collectMetrics) {
        this.collectAndReturnMetrics(metrics, performance.now() - metrics.validationDuration!, dataArray.length, 1);
      }

      return vertices;
    } catch (error) {
      // Rollback transaction if we created it
      if (!options.transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Create vertices in chunks for large batches
   *
   * @param label - Vertex label
   * @param dataArray - Array of vertex data
   * @param options - Batch operation options
   * @param metrics - Performance metrics
   * @returns Array of created vertices
   * @private
   */
  private async createVerticesInChunks<L extends keyof T['vertices']>(
    label: L,
    dataArray: VertexData<T, L>[],
    options: BatchOperationOptions,
    metrics: Partial<BatchPerformanceMetrics>
  ): Promise<Vertex<T, L>[]> {
    const batchSize = options.batchSize || DEFAULT_BATCH_OPTIONS.batchSize!;
    const transaction = options.transaction || await this.queryExecutor.beginTransaction();
    const results: Vertex<T, L>[] = [];
    let sqlGenTime = 0;
    let dbExecTime = 0;
    let batchCount = 0;

    try {
      // Process in chunks
      for (let i = 0; i < dataArray.length; i += batchSize) {
        batchCount++;
        const chunk = dataArray.slice(i, i + batchSize);

        const sqlGenStart = performance.now();
        const { sql, params } = this.sqlGenerator.generateBatchInsertVertexSQL(label as string, chunk);
        sqlGenTime += performance.now() - sqlGenStart;

        const dbExecStart = performance.now();
        const result = await this.queryExecutor.executeSQL(sql, params, { transaction });
        dbExecTime += performance.now() - dbExecStart;

        const vertices = result.rows.map(row => this.vertexOperations.transformToVertex(label, row));
        results.push(...vertices);
      }

      // Commit transaction if we created it
      if (!options.transaction) {
        await transaction.commit();
      }

      if (options.collectMetrics) {
        metrics.sqlGenerationDuration = sqlGenTime;
        metrics.dbExecutionDuration = dbExecTime;
        metrics.batchCount = batchCount;
        this.collectAndReturnMetrics(metrics, performance.now() - metrics.validationDuration!, dataArray.length, batchCount);
      }

      return results;
    } catch (error) {
      // Rollback transaction if we created it
      if (!options.transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Create edges using a temporary table for large batches
   *
   * @param label - Edge label
   * @param edgeData - Array of edge data
   * @param options - Batch operation options
   * @param metrics - Performance metrics
   * @returns Array of created edges
   * @private
   */
  private async createEdgesWithTempTable<L extends keyof T['edges']>(
    label: L,
    edgeData: Array<{
      sourceId: string;
      targetId: string;
      data?: Record<string, any>;
    }>,
    options: BatchOperationOptions,
    metrics: Partial<BatchPerformanceMetrics>
  ): Promise<Edge<T, L>[]> {
    const tempTableName = getTempTableName(`${label as string}_batch`);
    const transaction = options.transaction || await this.queryExecutor.beginTransaction();
    const sqlGenStart = performance.now();

    try {
      // Create temporary table
      const createTempTableSQL = (this.sqlGenerator as any).generateCreateTempEdgeTableSQL(
        label as string,
        tempTableName
      );

      // Generate COPY statement for bulk loading
      const copySQL = (this.sqlGenerator as any).generateCopyEdgeSQL(
        label as string,
        tempTableName,
        Object.keys(this.schema.edges[label as string].properties)
      );

      // Generate INSERT statement to move data from temp table to actual table
      const insertFromTempSQL = (this.sqlGenerator as any).generateInsertFromTempTableSQL(
        label as string,
        tempTableName,
        true // isEdge
      );

      const sqlGenTime = performance.now() - sqlGenStart;
      if (options.collectMetrics) {
        metrics.sqlGenerationDuration = sqlGenTime;
      }

      // Execute in transaction
      const dbExecStart = performance.now();

      // Create temp table
      await this.queryExecutor.executeSQL(createTempTableSQL.sql, [], { transaction });

      // Load data into temp table using COPY
      const dataString = this.formatEdgeDataForCopy(edgeData, label);
      await this.queryExecutor.executeCopyFrom(copySQL.sql, dataString, { transaction });

      // Insert from temp table to actual table
      const result = await this.queryExecutor.executeSQL(insertFromTempSQL.sql, [], { transaction });

      // Commit transaction if we created it
      if (!options.transaction) {
        await transaction.commit();
      }

      const dbExecTime = performance.now() - dbExecStart;
      if (options.collectMetrics) {
        metrics.dbExecutionDuration = dbExecTime;
      }

      const edges = result.rows.map(row => this.edgeOperations.transformToEdge(label, row));

      if (options.collectMetrics) {
        this.collectAndReturnMetrics(metrics, performance.now() - metrics.validationDuration!, edgeData.length, 1);
      }

      return edges;
    } catch (error) {
      // Rollback transaction if we created it
      if (!options.transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Create edges in chunks for large batches
   *
   * @param label - Edge label
   * @param edgeData - Array of edge data
   * @param options - Batch operation options
   * @param metrics - Performance metrics
   * @returns Array of created edges
   * @private
   */
  private async createEdgesInChunks<L extends keyof T['edges']>(
    label: L,
    edgeData: Array<{
      sourceId: string;
      targetId: string;
      data?: Record<string, any>;
    }>,
    options: BatchOperationOptions,
    metrics: Partial<BatchPerformanceMetrics>
  ): Promise<Edge<T, L>[]> {
    const batchSize = options.batchSize || DEFAULT_BATCH_OPTIONS.batchSize!;
    const transaction = options.transaction || await this.queryExecutor.beginTransaction();
    const results: Edge<T, L>[] = [];
    let sqlGenTime = 0;
    let dbExecTime = 0;
    let batchCount = 0;

    try {
      // Process in chunks
      for (let i = 0; i < edgeData.length; i += batchSize) {
        batchCount++;
        const chunk = edgeData.slice(i, i + batchSize);

        const sqlGenStart = performance.now();
        const { sql, params } = this.sqlGenerator.generateBatchInsertEdgeSQL(label as string, chunk);
        sqlGenTime += performance.now() - sqlGenStart;

        const dbExecStart = performance.now();
        const result = await this.queryExecutor.executeSQL(sql, params, { transaction });
        dbExecTime += performance.now() - dbExecStart;

        const edges = result.rows.map(row => this.edgeOperations.transformToEdge(label, row));
        results.push(...edges);
      }

      // Commit transaction if we created it
      if (!options.transaction) {
        await transaction.commit();
      }

      if (options.collectMetrics) {
        metrics.sqlGenerationDuration = sqlGenTime;
        metrics.dbExecutionDuration = dbExecTime;
        metrics.batchCount = batchCount;
        this.collectAndReturnMetrics(metrics, performance.now() - metrics.validationDuration!, edgeData.length, batchCount);
      }

      return results;
    } catch (error) {
      // Rollback transaction if we created it
      if (!options.transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Format vertex data for COPY operation
   *
   * @param dataArray - Array of vertex data
   * @param label - Vertex label
   * @returns Formatted data string
   * @private
   */
  private formatDataForCopy<L extends keyof T['vertices']>(
    dataArray: VertexData<T, L>[],
    label: L
  ): string {
    const vertexDef = this.schema.vertices[label as string];
    const propertyNames = Object.keys(vertexDef.properties);

    return dataArray.map(data => {
      const values = [data.id || 'uuid_generate_v4()'];

      for (const propName of propertyNames) {
        if (propName in data) {
          values.push(this.formatValueForCopy(data[propName as keyof typeof data]));
        } else {
          values.push('\\N'); // NULL value in COPY format
        }
      }

      return values.join('\t');
    }).join('\n');
  }

  /**
   * Format edge data for COPY operation
   *
   * @param edgeData - Array of edge data
   * @param label - Edge label
   * @returns Formatted data string
   * @private
   */
  private formatEdgeDataForCopy<L extends keyof T['edges']>(
    edgeData: Array<{
      sourceId: string;
      targetId: string;
      data?: Record<string, any>;
    }>,
    label: L
  ): string {
    const edgeDef = this.schema.edges[label as string];
    const propertyNames = Object.keys(edgeDef.properties);

    return edgeData.map(edge => {
      const values = [
        edge.data?.id || 'uuid_generate_v4()',
        edge.sourceId,
        edge.targetId
      ];

      for (const propName of propertyNames) {
        if (edge.data && propName in edge.data) {
          values.push(this.formatValueForCopy(edge.data[propName]));
        } else {
          values.push('\\N'); // NULL value in COPY format
        }
      }

      return values.join('\t');
    }).join('\n');
  }

  /**
   * Format a value for COPY operation
   *
   * @param value - Value to format
   * @returns Formatted value
   * @private
   */
  private formatValueForCopy(value: any): string {
    if (value === null || value === undefined) {
      return '\\N'; // NULL value in COPY format
    }

    if (typeof value === 'string') {
      // Escape special characters
      return value
        .replace(/\\/g, '\\\\')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
    }

    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return JSON.stringify(value)
        .replace(/\\/g, '\\\\')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
    }

    return String(value);
  }

  /**
   * Collect and return performance metrics
   *
   * @param metrics - Partial metrics object
   * @param startTime - Start time
   * @param itemCount - Number of items processed
   * @param batchCount - Number of batches processed
   * @returns Complete metrics object
   * @private
   */
  private collectAndReturnMetrics(
    metrics: Partial<BatchPerformanceMetrics>,
    startTime: number,
    itemCount: number,
    batchCount: number
  ): BatchPerformanceMetrics {
    const totalDuration = performance.now() - startTime;

    const result: BatchPerformanceMetrics = {
      totalDuration,
      sqlGenerationDuration: metrics.sqlGenerationDuration || 0,
      dbExecutionDuration: metrics.dbExecutionDuration || 0,
      validationDuration: metrics.validationDuration || 0,
      itemCount,
      batchCount: metrics.batchCount || batchCount,
      itemsPerSecond: Math.round((itemCount / totalDuration) * 1000),
    };

    return result;
  }
}
