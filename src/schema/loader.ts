/**
 * Schema loader implementation for the ageSchemaClient library
 *
 * This file implements the SchemaLoader class that provides functionality
 * for loading graph data into Apache AGE using the single-function approach.
 *
 * The single-function approach addresses several limitations of Apache AGE:
 * - It avoids issues with dynamic string parameters in Cypher queries
 * - It provides a reliable way to pass complex data structures to Cypher
 * - It reduces the number of queries needed to load data
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from './types';
import { QueryExecutor } from '../db/query';
import { Transaction } from '../db/transaction';
import { SchemaValidator } from './validator';
import { ValidationError } from '../core/errors';
import {
  GraphData,
  VertexData,
  EdgeData,
  LoadOptions,
  LoadResult,
  ProgressInfo,
  ValidationErrorInfo
} from './loader-types';
import { validateVertexData, validateEdgeData } from './loader-validation';
import {
  generateTempTableSQL,
  generateVertexInsertSQL,
  generateEdgeInsertSQL,
  generateGetVerticesFunctionSQL,
  generateGetEdgesFunctionSQL,
  generateCleanupSQL,
  generateTempTableName,
  generateFunctionName
} from './loader-sql';
import {
  generateVertexConversionFunctionSQL,
  generateEdgeConversionFunctionSQL,
  generateCreateVerticesCypher,
  generateCreateEdgesCypher
} from './loader-functions';

/**
 * Options for the SchemaLoader
 */
export interface SchemaLoaderOptions {
  /**
   * Default graph name to use for loading operations
   */
  defaultGraphName?: string;

  /**
   * Default batch size for loading operations
   */
  defaultBatchSize?: number;

  /**
   * Whether to validate data against the schema by default
   */
  validateData?: boolean;

  /**
   * Whether to use transactions by default
   */
  useTransactions?: boolean;

  /**
   * Schema validator to use for validation
   */
  validator?: SchemaValidator;
}

/**
 * Default options for the SchemaLoader
 */
const DEFAULT_OPTIONS: SchemaLoaderOptions = {
  defaultGraphName: 'default',
  defaultBatchSize: 1000,
  validateData: true,
  useTransactions: true,
};

/**
 * SchemaLoader class for loading graph data into Apache AGE
 */
export class SchemaLoader<T extends SchemaDefinition> {
  private schema: T;
  private queryExecutor: QueryExecutor;
  private options: SchemaLoaderOptions;
  private validator: SchemaValidator;

  /**
   * Create a new SchemaLoader
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param options - SchemaLoader options
   */
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    options: SchemaLoaderOptions = {}
  ) {
    this.schema = schema;
    this.queryExecutor = queryExecutor;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Create a validator if not provided
    this.validator = options.validator || new SchemaValidator(schema);
  }

  /**
   * Validate graph data against the schema
   *
   * @param data - Graph data to validate
   * @returns Validation errors
   */
  validateGraphData(data: GraphData): ValidationErrorInfo[] {
    const errors: ValidationErrorInfo[] = [];

    // Validate vertex data
    if (data.vertex) {
      const vertexErrors = validateVertexData(this.schema, this.validator, data.vertex);
      errors.push(...vertexErrors);
    }

    // Validate edge data
    if (data.edge) {
      const edgeErrors = validateEdgeData(this.schema, this.validator, data.edge);
      errors.push(...edgeErrors);
    }

    return errors;
  }

  /**
   * Validate vertex data against the schema
   *
   * @param vertices - Vertex data to validate
   * @returns Validation errors
   */
  validateVertexData(vertices: VertexData): ValidationErrorInfo[] {
    return validateVertexData(this.schema, this.validator, vertices);
  }

  /**
   * Validate edge data against the schema
   *
   * @param edges - Edge data to validate
   * @returns Validation errors
   */
  validateEdgeData(edges: EdgeData): ValidationErrorInfo[] {
    return validateEdgeData(this.schema, this.validator, edges);
  }

  /**
   * Load both vertices and edges
   *
   * @param data - Graph data
   * @param options - Load options
   * @returns Load result
   */
  async loadGraphData(
    data: GraphData,
    options?: LoadOptions
  ): Promise<LoadResult> {
    // This will be implemented in a future task
    throw new Error('Not implemented');
  }

  /**
   * Load only vertices
   *
   * @param vertices - Vertex data
   * @param options - Load options
   * @returns Load result
   */
  async loadVertices(
    vertices: VertexData,
    options?: LoadOptions
  ): Promise<LoadResult> {
    // This will be implemented in a future task
    throw new Error('Not implemented');
  }

  /**
   * Load only edges
   *
   * @param edges - Edge data
   * @param options - Load options
   * @returns Load result
   */
  async loadEdges(
    edges: EdgeData,
    options?: LoadOptions
  ): Promise<LoadResult> {
    // This will be implemented in a future task
    throw new Error('Not implemented');
  }

  /**
   * Load from a JSON file
   *
   * @param filePath - File path
   * @param options - Load options
   * @returns Load result
   */
  async loadFromFile(
    filePath: string,
    options?: LoadOptions
  ): Promise<LoadResult> {
    // This will be implemented in a future task
    throw new Error('Not implemented');
  }

  /**
   * Create a temporary table for storing graph data
   *
   * @param transaction - Transaction to use
   * @returns Temporary table name
   */
  async createTempTable(transaction?: Transaction): Promise<string> {
    // Generate a unique name for the temporary table
    const tableName = generateTempTableName();

    // Generate SQL for creating the temporary table
    const sql = generateTempTableSQL(tableName);

    // Execute the SQL
    const executor = transaction || this.queryExecutor;
    await executor.executeSQL(sql);

    return tableName;
  }

  /**
   * Store vertex data in the temporary table
   *
   * @param tableName - Temporary table name
   * @param vertexData - Vertex data
   * @param transaction - Transaction to use
   */
  async storeVertexData(
    tableName: string,
    vertexData: VertexData,
    transaction?: Transaction
  ): Promise<void> {
    const executor = transaction || this.queryExecutor;

    // Store each vertex type
    for (const [vertexType, vertices] of Object.entries(vertexData)) {
      const { sql, params } = generateVertexInsertSQL(tableName, vertexType, vertices);
      await executor.executeSQL(sql, params);
    }
  }

  /**
   * Store edge data in the temporary table
   *
   * @param tableName - Temporary table name
   * @param edgeData - Edge data
   * @param transaction - Transaction to use
   */
  async storeEdgeData(
    tableName: string,
    edgeData: EdgeData,
    transaction?: Transaction
  ): Promise<void> {
    const executor = transaction || this.queryExecutor;

    // Store each edge type
    for (const [edgeType, edges] of Object.entries(edgeData)) {
      const { sql, params } = generateEdgeInsertSQL(tableName, edgeType, edges);
      await executor.executeSQL(sql, params);
    }
  }

  /**
   * Store graph data in the temporary table
   *
   * @param tableName - Temporary table name
   * @param graphData - Graph data
   * @param transaction - Transaction to use
   */
  async storeGraphData(
    tableName: string,
    graphData: GraphData,
    transaction?: Transaction
  ): Promise<void> {
    // Store vertex data
    if (graphData.vertex) {
      await this.storeVertexData(tableName, graphData.vertex, transaction);
    }

    // Store edge data
    if (graphData.edge) {
      await this.storeEdgeData(tableName, graphData.edge, transaction);
    }
  }

  /**
   * Create a PostgreSQL function to convert vertex data to ag_catalog.agtype
   *
   * @param tableName - Temporary table name
   * @param vertexType - Vertex type
   * @param transaction - Transaction to use
   * @returns Function name
   */
  async createVertexConversionFunction(
    tableName: string,
    vertexType: string,
    transaction?: Transaction
  ): Promise<string> {
    const executor = transaction || this.queryExecutor;

    // Check if the vertex type exists in the schema
    if (!this.schema.vertices[vertexType]) {
      throw new Error(`Vertex type '${vertexType}' does not exist in the schema`);
    }

    // Generate a unique name for the function
    const functionName = generateFunctionName(`get_${vertexType.toLowerCase()}`);

    // Generate SQL for creating the function
    const sql = generateVertexConversionFunctionSQL(
      functionName,
      tableName,
      vertexType,
      this.schema.vertices[vertexType]
    );

    // Execute the SQL
    await executor.executeSQL(sql);

    return functionName;
  }

  /**
   * Create a PostgreSQL function to convert edge data to ag_catalog.agtype
   *
   * @param tableName - Temporary table name
   * @param edgeType - Edge type
   * @param transaction - Transaction to use
   * @returns Function name
   */
  async createEdgeConversionFunction(
    tableName: string,
    edgeType: string,
    transaction?: Transaction
  ): Promise<string> {
    const executor = transaction || this.queryExecutor;

    // Check if the edge type exists in the schema
    if (!this.schema.edges[edgeType]) {
      throw new Error(`Edge type '${edgeType}' does not exist in the schema`);
    }

    // Generate a unique name for the function
    const functionName = generateFunctionName(`get_${edgeType.toLowerCase()}`);

    // Generate SQL for creating the function
    const sql = generateEdgeConversionFunctionSQL(
      functionName,
      tableName,
      edgeType,
      this.schema.edges[edgeType]
    );

    // Execute the SQL
    await executor.executeSQL(sql);

    return functionName;
  }

  /**
   * Create vertices using a Cypher query
   *
   * @param graphName - Graph name
   * @param vertexType - Vertex type
   * @param functionName - Function name
   * @param transaction - Transaction to use
   * @returns Number of vertices created
   */
  async createVertices(
    graphName: string,
    vertexType: string,
    functionName: string,
    transaction?: Transaction
  ): Promise<number> {
    const executor = transaction || this.queryExecutor;

    // Check if the vertex type exists in the schema
    if (!this.schema.vertices[vertexType]) {
      throw new Error(`Vertex type '${vertexType}' does not exist in the schema`);
    }

    // Generate Cypher query for creating vertices
    const cypher = generateCreateVerticesCypher(
      graphName,
      vertexType,
      functionName,
      this.schema.vertices[vertexType]
    );

    // Execute the Cypher query
    const result = await executor.executeCypher(cypher, {}, graphName);

    // Parse the result to get the number of vertices created
    const resultValue = result.rows[0].result;
    return parseInt(resultValue, 10);
  }

  /**
   * Create edges using a Cypher query
   *
   * @param graphName - Graph name
   * @param edgeType - Edge type
   * @param functionName - Function name
   * @param transaction - Transaction to use
   * @returns Number of edges created
   */
  async createEdges(
    graphName: string,
    edgeType: string,
    functionName: string,
    transaction?: Transaction
  ): Promise<number> {
    const executor = transaction || this.queryExecutor;

    // Check if the edge type exists in the schema
    if (!this.schema.edges[edgeType]) {
      throw new Error(`Edge type '${edgeType}' does not exist in the schema`);
    }

    const edgeLabel = this.schema.edges[edgeType];

    // Check if the edge label has fromVertex and toVertex properties
    if (!edgeLabel.fromVertex || !edgeLabel.toVertex) {
      throw new Error(`Edge type '${edgeType}' does not have fromVertex and toVertex properties`);
    }

    // Generate Cypher query for creating edges
    const cypher = generateCreateEdgesCypher(
      graphName,
      edgeType,
      functionName,
      edgeLabel,
      edgeLabel.fromVertex,
      edgeLabel.toVertex
    );

    // Execute the Cypher query
    const result = await executor.executeCypher(cypher, {}, graphName);

    // Parse the result to get the number of edges created
    const resultValue = result.rows[0].result;
    return parseInt(resultValue, 10);
  }

  /**
   * Clean up temporary resources
   *
   * @param tableName - Temporary table name
   * @param functionNames - Function names to drop
   * @param transaction - Transaction to use
   */
  async cleanupResources(
    tableName: string,
    functionNames: string[],
    transaction?: Transaction
  ): Promise<void> {
    const executor = transaction || this.queryExecutor;

    // Generate SQL for dropping temporary tables and functions
    const sql = generateCleanupSQL(tableName, functionNames);

    // Execute the SQL
    await executor.executeSQL(sql);
  }
}
