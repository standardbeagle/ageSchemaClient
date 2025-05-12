/**
 * Edge operations implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition, EdgeLabel, PropertyType } from '../schema/types';
import { QueryExecutor, QueryResult } from './query';
import { SQLGenerator } from '../sql/generator';
import { SQLQueryOptions, SQLFilterCondition, SQLOrderDirection, SQLFilterOperator } from '../sql/types';
import { ValidationError } from '../core/errors';
import { Vertex } from './vertex';

/**
 * Edge data type
 *
 * Type-safe interface for edge data based on schema definition
 */
export type EdgeData<
  T extends SchemaDefinition,
  L extends keyof T['edges']
> = {
  [K in keyof T['edges'][L]['properties']]?:
    T['edges'][L]['properties'][K]['type'] extends PropertyType.STRING ? string :
    T['edges'][L]['properties'][K]['type'] extends PropertyType.INTEGER ? number :
    T['edges'][L]['properties'][K]['type'] extends PropertyType.FLOAT ? number :
    T['edges'][L]['properties'][K]['type'] extends PropertyType.BOOLEAN ? boolean :
    T['edges'][L]['properties'][K]['type'] extends PropertyType.DATE ? Date :
    T['edges'][L]['properties'][K]['type'] extends PropertyType.OBJECT ? Record<string, any> :
    T['edges'][L]['properties'][K]['type'] extends PropertyType.ARRAY ? any[] :
    any
} & {
  id?: string;
};

/**
 * Edge type
 *
 * Type-safe interface for edge objects based on schema definition
 */
export type Edge<
  T extends SchemaDefinition,
  L extends keyof T['edges']
> = {
  id: string;
  label: L;
  fromId: string;
  toId: string;
} & EdgeData<T, L> & {
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Edge query options
 */
export interface EdgeQueryOptions {
  /**
   * Filter conditions
   */
  filters?: Array<{
    property: string;
    operator: SQLFilterOperator;
    value: any;
  }>;

  /**
   * Order by clauses
   */
  orderBy?: Array<{
    property: string;
    direction: SQLOrderDirection;
  }>;

  /**
   * Limit results
   */
  limit?: number;

  /**
   * Offset results
   */
  offset?: number;
}

/**
 * Edge operations class
 *
 * Provides type-safe methods for edge creation, retrieval, update, and deletion
 */
export class EdgeOperations<T extends SchemaDefinition> {
  /**
   * Create a new edge operations instance
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param sqlGenerator - SQL generator
   */
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    private sqlGenerator: SQLGenerator
  ) {}

  /**
   * Create a new edge
   *
   * @param label - Edge label
   * @param fromVertex - Source vertex
   * @param toVertex - Target vertex
   * @param data - Edge data
   * @returns Created edge
   */
  async createEdge<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>,
    data: EdgeData<T, L> = {}
  ): Promise<Edge<T, L>> {
    // Validate data against schema
    this.validateEdgeData(label, data);

    // Validate vertex types against edge constraints
    this.validateVertexTypes(label, fromVertex, toVertex);

    // Generate and execute SQL
    const { sql, params } = this.sqlGenerator.generateInsertEdgeSQL(
      label as string,
      fromVertex.id,
      toVertex.id,
      data
    );
    const result = await this.queryExecutor.executeSQL(sql, params);

    // Transform and return result
    return this.transformToEdge(label, result.rows[0]);
  }

  /**
   * Get an edge by ID
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @returns Edge or null if not found
   */
  async getEdgeById<L extends keyof T['edges']>(
    label: L,
    id: string
  ): Promise<Edge<T, L> | null> {
    const { sql, params } = this.sqlGenerator.generateSelectEdgeSQL(label as string, {
      filters: [
        { property: 'id', operator: SQLFilterOperator.EQUALS, value: id }
      ]
    });

    const result = await this.queryExecutor.executeSQL(sql, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.transformToEdge(label, result.rows[0]);
  }

  /**
   * Get edges by label
   *
   * @param label - Edge label
   * @param options - Query options
   * @returns Array of edges
   */
  async getEdgesByLabel<L extends keyof T['edges']>(
    label: L,
    options: EdgeQueryOptions = {}
  ): Promise<Edge<T, L>[]> {
    // Convert query options to SQL query options
    const sqlOptions: SQLQueryOptions = {
      filters: options.filters?.map(filter => ({
        property: filter.property,
        operator: filter.operator,
        value: filter.value
      })),
      orderBy: options.orderBy?.map(order => ({
        property: order.property,
        direction: order.direction
      })),
      limit: options.limit,
      offset: options.offset
    };

    const { sql, params } = this.sqlGenerator.generateSelectEdgeSQL(label as string, sqlOptions);
    const result = await this.queryExecutor.executeSQL(sql, params);

    return result.rows.map(row => this.transformToEdge(label, row));
  }

  /**
   * Get edges between vertices
   *
   * @param label - Edge label
   * @param fromVertex - Source vertex
   * @param toVertex - Target vertex
   * @returns Array of edges
   */
  async getEdgesBetweenVertices<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>
  ): Promise<Edge<T, L>[]> {
    const { sql, params } = this.sqlGenerator.generateSelectEdgeSQL(label as string, {
      filters: [
        { property: 'source_id', operator: SQLFilterOperator.EQUALS, value: fromVertex.id },
        { property: 'target_id', operator: SQLFilterOperator.EQUALS, value: toVertex.id }
      ]
    });

    const result = await this.queryExecutor.executeSQL(sql, params);

    return result.rows.map(row => this.transformToEdge(label, row));
  }

  /**
   * Update an edge
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @param data - Edge data to update
   * @returns Updated edge
   */
  async updateEdge<L extends keyof T['edges']>(
    label: L,
    id: string,
    data: Partial<EdgeData<T, L>>
  ): Promise<Edge<T, L>> {
    // Validate data against schema
    this.validateEdgeData(label, data, true);

    // Generate and execute SQL
    const { sql, params } = this.sqlGenerator.generateUpdateEdgeSQL(label as string, id, data);
    const result = await this.queryExecutor.executeSQL(sql, params);

    if (result.rows.length === 0) {
      throw new Error(`Edge with ID ${id} not found`);
    }

    return this.transformToEdge(label, result.rows[0]);
  }

  /**
   * Delete an edge
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @returns Deleted edge
   */
  async deleteEdge<L extends keyof T['edges']>(
    label: L,
    id: string
  ): Promise<Edge<T, L>> {
    const { sql, params } = this.sqlGenerator.generateDeleteEdgeSQL(label as string, id);
    const result = await this.queryExecutor.executeSQL(sql, params);

    if (result.rows.length === 0) {
      throw new Error(`Edge with ID ${id} not found`);
    }

    return this.transformToEdge(label, result.rows[0]);
  }

  /**
   * Delete edges between vertices
   *
   * @param label - Edge label
   * @param fromVertex - Source vertex
   * @param toVertex - Target vertex
   * @returns Array of deleted edges
   */
  async deleteEdgesBetweenVertices<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>
  ): Promise<Edge<T, L>[]> {
    const { sql, params } = this.sqlGenerator.generateDeleteEdgesBetweenVerticesSQL(
      label as string,
      fromVertex.id,
      toVertex.id
    );

    const result = await this.queryExecutor.executeSQL(sql, params);

    return result.rows.map(row => this.transformToEdge(label, row));
  }

  /**
   * Create multiple edges in a batch operation
   *
   * @param label - Edge label
   * @param edges - Array of edge data with source and target vertices
   * @returns Array of created edges
   */
  async createEdgesBatch<L extends keyof T['edges']>(
    label: L,
    edges: Array<{
      fromVertex: Vertex<T, any>;
      toVertex: Vertex<T, any>;
      data?: EdgeData<T, L>;
    }>
  ): Promise<Edge<T, L>[]> {
    if (edges.length === 0) {
      return [];
    }

    // Validate all data items against schema
    edges.forEach(edge => {
      this.validateEdgeData(label, edge.data || {});
      this.validateVertexTypes(label, edge.fromVertex, edge.toVertex);
    });

    // Convert to format expected by SQL generator
    const edgeData = edges.map(edge => ({
      sourceId: edge.fromVertex.id,
      targetId: edge.toVertex.id,
      data: edge.data || {}
    }));

    // Generate and execute SQL
    const { sql, params } = this.sqlGenerator.generateBatchInsertEdgeSQL(label as string, edgeData);
    const result = await this.queryExecutor.executeSQL(sql, params);

    return result.rows.map(row => this.transformToEdge(label, row));
  }

  /**
   * Validate edge data against schema
   *
   * @param label - Edge label
   * @param data - Edge data
   * @param isPartial - Whether this is a partial update
   */
  public validateEdgeData<L extends keyof T['edges']>(
    label: L,
    data: Partial<EdgeData<T, L>>,
    isPartial: boolean = false
  ): void {
    const edgeDef = this.schema.edges[label as string] as EdgeLabel;

    if (!edgeDef) {
      throw new ValidationError(`Edge label ${String(label)} not found in schema`);
    }

    // Check required properties
    if (!isPartial && edgeDef.required) {
      for (const requiredProp of edgeDef.required) {
        if (!(requiredProp in data)) {
          throw new ValidationError(`Required property '${requiredProp}' is missing`);
        }
      }
    }

    // Validate property types
    for (const [propName, propValue] of Object.entries(data)) {
      // Skip id and metadata fields
      if (propName === 'id' || propName === 'createdAt' || propName === 'updatedAt') {
        continue;
      }

      const propDef = edgeDef.properties[propName];

      if (!propDef) {
        throw new ValidationError(`Property '${propName}' is not defined in schema for edge label ${String(label)}`);
      }

      // Skip null values if property is nullable
      if (propValue === null || propValue === undefined) {
        if (propDef.nullable !== true && edgeDef.required?.includes(propName)) {
          throw new ValidationError(`Property '${propName}' cannot be null or undefined`);
        }
        continue;
      }

      // Validate property type
      this.validatePropertyType(propName, propValue, propDef.type as PropertyType);
    }
  }

  /**
   * Validate property type
   *
   * @param propName - Property name
   * @param propValue - Property value
   * @param propType - Property type
   */
  private validatePropertyType(
    propName: string,
    propValue: any,
    propType: PropertyType
  ): void {
    switch (propType) {
      case PropertyType.STRING:
        if (typeof propValue !== 'string') {
          throw new ValidationError(`Property '${propName}' must be a string`);
        }
        break;
      case PropertyType.INTEGER:
        if (typeof propValue !== 'number' || !Number.isInteger(propValue)) {
          throw new ValidationError(`Property '${propName}' must be an integer`);
        }
        break;
      case PropertyType.FLOAT:
      case PropertyType.NUMBER:
        if (typeof propValue !== 'number') {
          throw new ValidationError(`Property '${propName}' must be a number`);
        }
        break;
      case PropertyType.BOOLEAN:
        if (typeof propValue !== 'boolean') {
          throw new ValidationError(`Property '${propName}' must be a boolean`);
        }
        break;
      case PropertyType.DATE:
        if (!(propValue instanceof Date) && typeof propValue !== 'string') {
          throw new ValidationError(`Property '${propName}' must be a Date or date string`);
        }
        break;
      case PropertyType.OBJECT:
        if (typeof propValue !== 'object' || propValue === null || Array.isArray(propValue)) {
          throw new ValidationError(`Property '${propName}' must be an object`);
        }
        break;
      case PropertyType.ARRAY:
        if (!Array.isArray(propValue)) {
          throw new ValidationError(`Property '${propName}' must be an array`);
        }
        break;
    }
  }

  /**
   * Validate vertex types against edge constraints
   *
   * @param label - Edge label
   * @param fromVertex - Source vertex
   * @param toVertex - Target vertex
   */
  public validateVertexTypes<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>
  ): void {
    const edgeDef = this.schema.edges[label as string] as EdgeLabel;

    // Validate source vertex
    if (typeof edgeDef.fromVertex === 'string') {
      if (fromVertex.label !== edgeDef.fromVertex) {
        throw new ValidationError(
          `Source vertex must have label '${edgeDef.fromVertex}', got '${String(fromVertex.label)}'`
        );
      }
    } else {
      // TODO: Implement complex vertex constraint validation
    }

    // Validate target vertex
    if (typeof edgeDef.toVertex === 'string') {
      if (toVertex.label !== edgeDef.toVertex) {
        throw new ValidationError(
          `Target vertex must have label '${edgeDef.toVertex}', got '${String(toVertex.label)}'`
        );
      }
    } else {
      // TODO: Implement complex vertex constraint validation
    }
  }

  /**
   * Transform database row to edge object
   *
   * @param label - Edge label
   * @param row - Database row
   * @returns Edge object
   */
  public transformToEdge<L extends keyof T['edges']>(
    label: L,
    row: Record<string, any>
  ): Edge<T, L> {
    const edge = {
      id: row.id,
      label,
      fromId: row.source_id,
      toId: row.target_id,
    } as Edge<T, L>;

    // Copy properties from row to edge
    const edgeDef = this.schema.edges[label as string] as EdgeLabel;

    for (const propName of Object.keys(edgeDef.properties)) {
      if (propName in row) {
        (edge as any)[propName] = row[propName];
      }
    }

    // Add metadata fields if present
    if ('created_at' in row) {
      edge.createdAt = new Date(row.created_at);
    }

    if ('updated_at' in row) {
      edge.updatedAt = new Date(row.updated_at);
    }

    return edge;
  }
}
