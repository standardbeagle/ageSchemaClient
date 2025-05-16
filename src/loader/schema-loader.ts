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
import fs from 'fs';
import path from 'path';

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
   * Vertex data
   */
  vertex: Record<string, any[]>;
  /**
   * Edge data
   */
  edge: Record<string, any[]>;
}

/**
 * SchemaLoader class
 */
export class SchemaLoader<T extends SchemaDefinition> {
  private cypherQueryGenerator: CypherQueryGenerator<T>;
  private schemaValidator: SchemaValidator;
  private options: SchemaLoaderOptions;

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
      ...options
    };

    this.cypherQueryGenerator = new CypherQueryGenerator<T>(schema);
    this.schemaValidator = new SchemaValidator(schema, options.validatorConfig);
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
    const errors: Error[] = [];
    const warnings: string[] = [];

    try {
      // Load vertices first
      const vertexResult = await this.loadVertices(data.vertex, options);

      // Then load edges
      const edgeResult = await this.loadEdges(data.edge, {
        ...options,
        transaction: options.transaction // Use the same transaction
      });

      return {
        success: vertexResult.success && edgeResult.success,
        vertexCount: vertexResult.vertexCount,
        edgeCount: edgeResult.edgeCount,
        vertexTypes: vertexResult.vertexTypes,
        edgeTypes: edgeResult.edgeTypes,
        errors: [...(vertexResult.errors || []), ...(edgeResult.errors || [])],
        warnings: [...(vertexResult.warnings || []), ...(edgeResult.warnings || [])],
        duration: Date.now() - startTime
      };
    } catch (error) {
      errors.push(error as Error);

      return {
        success: false,
        vertexCount: 0,
        edgeCount: 0,
        vertexTypes: [],
        edgeTypes: [],
        errors,
        warnings,
        duration: Date.now() - startTime
      };
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

    try {
      // Validate vertex data if required
      if (mergedOptions.validateData) {
        this.validateVertexData(vertices);
      }

      // Report progress for validation phase
      mergedOptions.onProgress({
        phase: 'validation',
        current: 1,
        total: 3, // validation, storing, creating
        percentage: 33,
        vertexCount: 0
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

      for (const [vertexType, vertexList] of Object.entries(vertices)) {
        if (!vertexList || !Array.isArray(vertexList) || vertexList.length === 0) {
          continue;
        }

        vertexTypes.push(vertexType);

        // Validate vertex type against schema
        if (!this.schema.vertices[vertexType]) {
          warnings.push(`Vertex type '${vertexType}' not found in schema`);
        }

        // Insert vertices in batches
        for (let i = 0; i < vertexList.length; i += mergedOptions.batchSize) {
          const batch = vertexList.slice(i, i + mergedOptions.batchSize);

          // Report progress
          mergedOptions.onProgress({
            phase: 'storing',
            current: i + batch.length,
            total: vertexList.length,
            percentage: 33 + Math.round(((i + batch.length) / vertexList.length) * 33),
            vertexCount: vertexCount + batch.length
          });

          // Insert batch
          for (const vertex of batch) {
            await this.queryExecutor.executeSQL(`
              INSERT INTO ${tempTableName} (vertex_label, properties)
              VALUES ($1, $2)
            `, [
              vertexType,
              JSON.stringify(this.extractVertexProperties(vertex, vertexType))
            ], { transaction });

            vertexCount++;
          }
        }
      }

      // Create a function to convert vertex data to ag_catalog.agtype
      const functionName = `get_vertices_${Date.now()}`;
      await this.queryExecutor.executeSQL(`
        CREATE OR REPLACE FUNCTION ${mergedOptions.tempSchema}.${functionName}()
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          result_array ag_catalog.agtype;
        BEGIN
          SELECT jsonb_agg(jsonb_build_object(
            'label', vertex_label::text,
            'properties', properties
          ))::text::ag_catalog.agtype
          INTO result_array
          FROM ${tempTableName};

          RETURN result_array;
        END;
        $$ LANGUAGE plpgsql;
      `, [], { transaction });

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
      mergedOptions.onProgress({
        phase: 'creating',
        current: 3,
        total: 3,
        percentage: 100,
        vertexCount
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
        if (success && !options.transaction) {
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

    try {
      // Validate edge data if required
      if (mergedOptions.validateData) {
        this.validateEdgeData(edges);
      }

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

      for (const [edgeType, edgeList] of Object.entries(edges)) {
        if (!edgeList || !Array.isArray(edgeList) || edgeList.length === 0) {
          continue;
        }

        edgeTypes.push(edgeType);

        // Validate edge type against schema
        if (!this.schema.edges[edgeType]) {
          warnings.push(`Edge type '${edgeType}' not found in schema`);
        }

        // Insert edges in batches
        for (let i = 0; i < edgeList.length; i += mergedOptions.batchSize) {
          const batch = edgeList.slice(i, i + mergedOptions.batchSize);

          // Report progress
          mergedOptions.onProgress({
            phase: 'storing',
            current: i + batch.length,
            total: edgeList.length,
            percentage: Math.round(((i + batch.length) / edgeList.length) * 100),
            edgeCount: edgeCount + batch.length
          });

          // Insert batch
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

            edgeCount++;
          }
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
        for (const row of validationResult.rows) {
          warnings.push(`Edge endpoint validation failed: from_id=${row.from_id}, to_id=${row.to_id}, from_exists=${row.from_exists}, to_exists=${row.to_exists}`);
        }
      }

      // Create a function to convert edge data to ag_catalog.agtype
      const functionName = `get_edges_${Date.now()}`;
      await this.queryExecutor.executeSQL(`
        CREATE OR REPLACE FUNCTION ${mergedOptions.tempSchema}.${functionName}()
        RETURNS ag_catalog.agtype AS $$
        DECLARE
          result_array ag_catalog.agtype;
        BEGIN
          SELECT jsonb_agg(jsonb_build_object(
            'type', edge_type,
            'from', from_id,
            'to', to_id,
            'properties', properties
          ))::text::ag_catalog.agtype
          INTO result_array
          FROM ${tempTableName};

          RETURN result_array;
        END;
        $$ LANGUAGE plpgsql;
      `, [], { transaction });

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
        if (success && !options.transaction) {
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
    try {
      const fileContent = fs.readFileSync(path.resolve(filePath), 'utf-8');
      const data = JSON.parse(fileContent) as GraphData;

      return this.loadGraphData(data, options);
    } catch (error) {
      return {
        success: false,
        vertexCount: 0,
        edgeCount: 0,
        vertexTypes: [],
        edgeTypes: [],
        errors: [error as Error],
        warnings: [],
        duration: 0
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
}
