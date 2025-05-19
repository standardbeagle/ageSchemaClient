/**
 * BatchLoader interface for efficient loading of graph data
 *
 * This interface defines the contract for batch loading graph data into Apache AGE.
 * It uses the temporary table approach for efficient data loading with minimal transactions.
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { QueryBuilder } from '../query/builder';

/**
 * Progress information during the loading process
 *
 * This interface provides detailed information about the current progress
 * of the batch loading operation. It can be used to implement progress
 * reporting in user interfaces or logging systems.
 *
 * @example
 * ```typescript
 * const onProgress = (progress: LoadProgress) => {
 *   console.log(
 *     `Loading ${progress.phase} ${progress.type}: ` +
 *     `${progress.processed}/${progress.total} (${progress.percentage}%)`
 *   );
 * };
 * ```
 */
export interface LoadProgress {
  /**
   * Current phase of the loading process
   *
   * - 'vertices': Loading vertex data
   * - 'edges': Loading edge data
   */
  phase: 'vertices' | 'edges';

  /**
   * Current vertex or edge type being processed
   *
   * This is the label of the vertex or edge type as defined in the schema.
   * For example, 'Person', 'Company', 'WORKS_AT', etc.
   */
  type: string;

  /**
   * Number of items processed so far
   *
   * This is the count of vertices or edges that have been successfully
   * loaded into the database in the current phase and type.
   */
  processed: number;

  /**
   * Total number of items to process
   *
   * This is the total count of vertices or edges to be loaded
   * for the current phase and type.
   */
  total: number;

  /**
   * Percentage of completion (0-100)
   *
   * This is calculated as (processed / total) * 100, rounded to the nearest integer.
   */
  percentage: number;

  /**
   * Error message if an error occurred during processing
   *
   * This is only present if an error occurred during the processing of the
   * current batch. It can be used to display error information in the UI
   * without interrupting the loading process.
   */
  error?: string;
}

/**
 * Options for the loading process
 *
 * This interface defines the options that can be passed to the loadGraphData method
 * to customize the loading process. All options are optional and have sensible defaults.
 *
 * @example
 * ```typescript
 * const options: LoadOptions = {
 *   graphName: 'my_graph',
 *   validateBeforeLoad: true,
 *   batchSize: 1000,
 *   onProgress: (progress) => {
 *     console.log(`Loading ${progress.phase} ${progress.type}: ${progress.percentage}%`);
 *   }
 * };
 *
 * const result = await batchLoader.loadGraphData(graphData, options);
 * ```
 */
export interface LoadOptions {
  /**
   * Graph name to load data into
   *
   * This is the name of the Apache AGE graph to load the data into.
   * If not provided, the default graph name specified when creating
   * the BatchLoader will be used.
   *
   * The graph must already exist in the database. If it doesn't exist,
   * an error will be thrown.
   *
   * @example
   * ```typescript
   * const options = {
   *   graphName: 'my_graph'
   * };
   * ```
   */
  graphName?: string;

  /**
   * Whether to validate data against the schema before loading
   *
   * If true, the data will be validated against the schema before
   * any loading operations are performed. If validation fails,
   * an error will be thrown with details about the validation failures.
   *
   * Setting this to false can improve performance for large datasets
   * where you are confident the data is valid, but it can lead to
   * partial loading if some data is invalid.
   *
   * @default true
   *
   * @example
   * ```typescript
   * const options = {
   *   validateBeforeLoad: true
   * };
   * ```
   */
  validateBeforeLoad?: boolean;

  /**
   * Batch size for chunking large operations
   *
   * This is the maximum number of vertices or edges to process in a single
   * batch. For very large datasets, this can be adjusted to optimize performance.
   *
   * A larger batch size can improve performance by reducing the number of
   * database operations, but it also increases memory usage and can lead
   * to longer-running transactions.
   *
   * @default 1000
   *
   * @example
   * ```typescript
   * const options = {
   *   batchSize: 5000 // Process 5000 items at a time
   * };
   * ```
   */
  batchSize?: number;

  /**
   * Callback function for progress reporting
   *
   * This function will be called periodically during the loading process
   * to report progress. It receives a LoadProgress object with information
   * about the current phase, type, and progress percentage.
   *
   * This can be used to implement progress bars, logs, or other feedback
   * mechanisms for long-running loading operations.
   *
   * @example
   * ```typescript
   * const options = {
   *   onProgress: (progress) => {
   *     console.log(
   *       `Loading ${progress.phase} ${progress.type}: ` +
   *       `${progress.processed}/${progress.total} (${progress.percentage}%)`
   *     );
   *   }
   * };
   * ```
   */
  onProgress?: (progress: LoadProgress) => void;

  /**
   * Whether to collect warnings during the loading process
   *
   * If true, warnings will be collected during the loading process and
   * returned in the LoadResult. This can be useful for debugging and
   * understanding issues that occurred during loading.
   *
   * @default false
   *
   * @example
   * ```typescript
   * const options = {
   *   collectWarnings: true
   * };
   * ```
   */
  collectWarnings?: boolean;

  /**
   * Array to collect warnings during the loading process
   *
   * If provided, warnings will be added to this array during the loading process.
   * This can be useful for collecting warnings from multiple loading operations.
   *
   * This is only used if collectWarnings is true.
   *
   * @example
   * ```typescript
   * const warnings: string[] = [];
   * const options = {
   *   collectWarnings: true,
   *   warnings: warnings
   * };
   * ```
   */
  warnings?: string[];
}

/**
 * Result of the loading process
 *
 * This interface provides information about the results of a batch loading operation,
 * including counts of loaded vertices and edges, and any warnings that occurred during
 * the process.
 *
 * @example
 * ```typescript
 * const result = await batchLoader.loadGraphData(graphData);
 * console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
 *
 * if (result.warnings && result.warnings.length > 0) {
 *   console.warn('Warnings during loading:', result.warnings);
 * }
 * ```
 */
export interface LoadResult {
  /**
   * Number of vertices loaded
   *
   * This is the total count of vertices that were successfully loaded
   * into the database across all vertex types.
   *
   * @example
   * ```typescript
   * const result = await batchLoader.loadGraphData(graphData);
   * console.log(`Loaded ${result.vertexCount} vertices`);
   * ```
   */
  vertexCount: number;

  /**
   * Number of edges loaded
   *
   * This is the total count of edges that were successfully loaded
   * into the database across all edge types.
   *
   * @example
   * ```typescript
   * const result = await batchLoader.loadGraphData(graphData);
   * console.log(`Loaded ${result.edgeCount} edges`);
   * ```
   */
  edgeCount: number;

  /**
   * Warnings encountered during the loading process
   *
   * This is an array of warning messages that occurred during the loading process.
   * Warnings do not prevent the loading process from completing, but they may
   * indicate potential issues or suboptimal conditions.
   *
   * Common warnings include:
   * - Duplicate vertex IDs (later vertices overwrite earlier ones)
   * - References to non-existent vertices in edge data
   * - Schema validation warnings (e.g., unknown properties)
   *
   * @example
   * ```typescript
   * const result = await batchLoader.loadGraphData(graphData);
   *
   * if (result.warnings && result.warnings.length > 0) {
   *   console.warn('Warnings during loading:', result.warnings);
   * }
   * ```
   */
  warnings?: string[];
}

/**
 * Graph data to be loaded
 *
 * This interface defines the structure of the graph data to be loaded into the database.
 * It consists of vertices and edges, each grouped by their type.
 *
 * @example
 * ```typescript
 * const graphData: GraphData = {
 *   vertices: {
 *     Person: [
 *       { id: '1', name: 'Alice', age: 30 },
 *       { id: '2', name: 'Bob', age: 25 }
 *     ],
 *     Company: [
 *       { id: '3', name: 'Acme Inc.', founded: 1990 }
 *     ]
 *   },
 *   edges: {
 *     WORKS_AT: [
 *       { from: '1', to: '3', since: 2015, position: 'Manager' },
 *       { from: '2', to: '3', since: 2018, position: 'Developer' }
 *     ],
 *     KNOWS: [
 *       { from: '1', to: '2', since: 2010 }
 *     ]
 *   }
 * };
 * ```
 */
export interface GraphData {
  /**
   * Vertices to load, grouped by type
   *
   * This is a record where each key is a vertex type (label) as defined in the schema,
   * and the value is an array of vertex data objects. Each vertex data object must have
   * an 'id' property, and may have additional properties as defined in the schema.
   *
   * The vertex type must match a vertex type defined in the schema. The properties
   * of each vertex must match the property definitions in the schema.
   *
   * @example
   * ```typescript
   * const vertices = {
   *   Person: [
   *     { id: '1', name: 'Alice', age: 30 },
   *     { id: '2', name: 'Bob', age: 25 }
   *   ],
   *   Company: [
   *     { id: '3', name: 'Acme Inc.', founded: 1990 }
   *   ]
   * };
   * ```
   */
  vertices: Record<string, any[]>;

  /**
   * Edges to load, grouped by type
   *
   * This is a record where each key is an edge type (label) as defined in the schema,
   * and the value is an array of edge data objects. Each edge data object must have
   * 'from' and 'to' properties that reference the IDs of existing vertices, and may
   * have additional properties as defined in the schema.
   *
   * The edge type must match an edge type defined in the schema. The properties
   * of each edge must match the property definitions in the schema.
   *
   * The 'from' and 'to' properties must reference the IDs of vertices that exist
   * in the 'vertices' section of the graph data or already exist in the database.
   *
   * @example
   * ```typescript
   * const edges = {
   *   WORKS_AT: [
   *     { from: '1', to: '3', since: 2015, position: 'Manager' },
   *     { from: '2', to: '3', since: 2018, position: 'Developer' }
   *   ],
   *   KNOWS: [
   *     { from: '1', to: '2', since: 2010 }
   *   ]
   * };
   * ```
   */
  edges: Record<string, any[]>;
}

/**
 * BatchLoader interface
 *
 * This interface defines the contract for batch loading graph data into Apache AGE.
 * It uses the temporary table approach for efficient data loading with minimal transactions.
 *
 * The BatchLoader is responsible for:
 * - Validating graph data against the schema
 * - Loading vertices and edges into the graph database
 * - Managing transactions for data consistency
 * - Reporting progress during the loading process
 * - Handling errors and providing detailed error messages
 *
 * The implementation uses the age_params temporary table to store data and PostgreSQL
 * functions to retrieve the data for use with UNWIND in Cypher queries. This approach
 * minimizes the number of transactions and improves performance for large datasets.
 *
 * @example
 * ```typescript
 * // Create a batch loader
 * const batchLoader = createBatchLoader(schema, queryExecutor, {
 *   validateBeforeLoad: true,
 *   defaultGraphName: 'my_graph',
 *   defaultBatchSize: 1000
 * });
 *
 * // Load graph data
 * const result = await batchLoader.loadGraphData({
 *   vertices: {
 *     Person: [
 *       { id: '1', name: 'Alice', age: 30 },
 *       { id: '2', name: 'Bob', age: 25 }
 *     ],
 *     Company: [
 *       { id: '3', name: 'Acme Inc.', founded: 1990 }
 *     ]
 *   },
 *   edges: {
 *     WORKS_AT: [
 *       { from: '1', to: '3', since: 2015, position: 'Manager' },
 *       { from: '2', to: '3', since: 2018, position: 'Developer' }
 *     ],
 *     KNOWS: [
 *       { from: '1', to: '2', since: 2010 }
 *     ]
 *   }
 * }, {
 *   graphName: 'my_graph',
 *   validateBeforeLoad: true,
 *   batchSize: 1000,
 *   onProgress: (progress) => {
 *     console.log(`Loading ${progress.phase} ${progress.type}: ${progress.percentage}%`);
 *   }
 * });
 *
 * console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
 * ```
 *
 * @template T - Schema definition type
 */
export interface BatchLoader<T extends SchemaDefinition> {
  /**
   * Load graph data into the database
   *
   * This method loads vertices and edges into the graph database in an efficient manner.
   * It uses the temporary table approach to minimize the number of transactions and
   * improve performance for large datasets.
   *
   * The loading process follows these steps:
   * 1. Validate the graph data against the schema (if validateBeforeLoad is true)
   * 2. Begin a transaction
   * 3. Store vertex data in the age_params temporary table
   * 4. Create vertices using Cypher queries with UNWIND
   * 5. Store edge data in the age_params temporary table
   * 6. Create edges using Cypher queries with UNWIND
   * 7. Commit the transaction
   * 8. Return the result with counts of loaded vertices and edges
   *
   * If an error occurs during the loading process, the transaction is rolled back
   * and an error is thrown with details about the failure.
   *
   * @param graphData - Graph data to load, containing vertices and edges grouped by type
   * @param options - Loading options including graph name, validation, batch size, and progress callback
   * @returns Promise resolving to a LoadResult with counts of loaded vertices and edges
   * @throws Error if the loading process fails
   *
   * @example
   * ```typescript
   * const result = await batchLoader.loadGraphData({
   *   vertices: {
   *     Person: [
   *       { id: '1', name: 'Alice', age: 30 },
   *       { id: '2', name: 'Bob', age: 25 }
   *     ]
   *   },
   *   edges: {
   *     KNOWS: [
   *       { from: '1', to: '2', since: 2010 }
   *     ]
   *   }
   * });
   * ```
   */
  loadGraphData(graphData: GraphData, options?: LoadOptions): Promise<LoadResult>;

  /**
   * Validate graph data against the schema
   *
   * This method validates the graph data against the schema without loading it.
   * It can be used to check if the data is valid before attempting to load it.
   *
   * The validation process checks:
   * - Vertex and edge types exist in the schema
   * - Required properties are present
   * - Property types match the schema
   * - Edge source and target vertex types match the schema
   * - IDs are unique within each vertex type
   *
   * The method returns a validation result with:
   * - isValid: boolean indicating if the data is valid
   * - errors: array of error messages for validation failures
   * - warnings: array of warning messages for potential issues
   *
   * @param graphData - Graph data to validate, containing vertices and edges grouped by type
   * @returns Promise resolving to a validation result with errors and warnings
   *
   * @example
   * ```typescript
   * const validation = await batchLoader.validateGraphData({
   *   vertices: {
   *     Person: [
   *       { id: '1', name: 'Alice', age: 30 },
   *       { id: '2', name: 'Bob', age: 25 }
   *     ]
   *   },
   *   edges: {
   *     KNOWS: [
   *       { from: '1', to: '2', since: 2010 }
   *     ]
   *   }
   * });
   *
   * if (!validation.isValid) {
   *   console.error('Validation failed:', validation.errors);
   * }
   * ```
   */
  validateGraphData(graphData: GraphData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

/**
 * Options for creating a BatchLoader
 *
 * This interface defines the options that can be passed when creating a BatchLoader
 * instance. These options set the default behavior for the BatchLoader, which can
 * be overridden on a per-operation basis.
 *
 * @example
 * ```typescript
 * const options: BatchLoaderOptions = {
 *   validateBeforeLoad: true,
 *   defaultGraphName: 'my_graph',
 *   defaultBatchSize: 1000
 * };
 *
 * const batchLoader = createBatchLoader(schema, queryExecutor, options);
 * ```
 */
export interface BatchLoaderOptions {
  /**
   * Whether to validate data against the schema before loading
   *
   * If true, the data will be validated against the schema before
   * any loading operations are performed. If validation fails,
   * an error will be thrown with details about the validation failures.
   *
   * This default can be overridden on a per-operation basis by setting
   * the validateBeforeLoad option in the loadGraphData method.
   *
   * @default true
   *
   * @example
   * ```typescript
   * const options = {
   *   validateBeforeLoad: true
   * };
   * ```
   */
  validateBeforeLoad?: boolean;

  /**
   * Default graph name to use if not specified in the load options
   *
   * This is the name of the Apache AGE graph to load data into by default.
   * It can be overridden on a per-operation basis by setting the graphName
   * option in the loadGraphData method.
   *
   * The graph must already exist in the database. If it doesn't exist,
   * an error will be thrown when attempting to load data.
   *
   * @default 'default'
   *
   * @example
   * ```typescript
   * const options = {
   *   defaultGraphName: 'my_graph'
   * };
   * ```
   */
  defaultGraphName?: string;

  /**
   * Default batch size for chunking large operations
   *
   * This is the maximum number of vertices or edges to process in a single
   * batch by default. For very large datasets, this can be adjusted to
   * optimize performance.
   *
   * This default can be overridden on a per-operation basis by setting
   * the batchSize option in the loadGraphData method.
   *
   * @default 1000
   *
   * @example
   * ```typescript
   * const options = {
   *   defaultBatchSize: 5000 // Process 5000 items at a time by default
   * };
   * ```
   */
  defaultBatchSize?: number;
}

/**
 * Create a new BatchLoader instance
 *
 * This function creates a new BatchLoader instance with the specified schema,
 * query executor, and options. The BatchLoader can be used to load graph data
 * into an Apache AGE graph database.
 *
 * The BatchLoader uses the temporary table approach to efficiently load large
 * datasets with minimal transactions. It stores data in the age_params temporary
 * table and uses PostgreSQL functions to retrieve the data for use with UNWIND
 * in Cypher queries.
 *
 * @param schema - Schema definition that describes the structure of the graph
 * @param queryExecutor - Query executor for executing SQL and Cypher queries
 * @param options - BatchLoader options for customizing the default behavior
 * @returns A new BatchLoader instance
 *
 * @example
 * ```typescript
 * import { createBatchLoader } from './batch-loader';
 * import { SchemaLoader } from '../schema/schema-loader';
 * import { QueryExecutor } from '../db/query';
 *
 * // Create a query executor
 * const queryExecutor = new QueryExecutor(connection);
 *
 * // Create a batch loader
 * const batchLoader = createBatchLoader(schema, queryExecutor, {
 *   validateBeforeLoad: true,
 *   defaultGraphName: 'my_graph',
 *   defaultBatchSize: 1000
 * });
 *
 * // Use the batch loader to load graph data
 * const result = await batchLoader.loadGraphData({
 *   vertices: {
 *     Person: [
 *       { id: '1', name: 'Alice', age: 30 },
 *       { id: '2', name: 'Bob', age: 25 }
 *     ]
 *   },
 *   edges: {
 *     KNOWS: [
 *       { from: '1', to: '2', since: 2010 }
 *     ]
 *   }
 * });
 *
 * console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
 * ```
 */
export function createBatchLoader<T extends SchemaDefinition>(
  schema: T,
  queryExecutor: QueryExecutor,
  options?: BatchLoaderOptions
): BatchLoader<T> {
  // Import the implementation from batch-loader-impl.ts
  const { createBatchLoader: createBatchLoaderImpl } = require('./batch-loader-impl');
  return createBatchLoaderImpl(schema, queryExecutor, options);
}
