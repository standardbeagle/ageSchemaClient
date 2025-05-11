/**
 * Vertex operations implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition, VertexLabel, PropertyType } from '../schema/types';
import { QueryExecutor, QueryResult } from './query';
import { SQLGenerator } from '../sql/generator';
import { SQLQueryOptions, SQLFilterCondition, SQLOrderDirection } from '../sql/types';
import { ValidationError } from '../core/errors';

/**
 * Vertex data type
 * 
 * Type-safe interface for vertex data based on schema definition
 */
export type VertexData<
  T extends SchemaDefinition,
  L extends keyof T['vertices']
> = {
  [K in keyof T['vertices'][L]['properties']]?: 
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.STRING ? string :
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.INTEGER ? number :
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.FLOAT ? number :
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.BOOLEAN ? boolean :
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.DATE ? Date :
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.OBJECT ? Record<string, any> :
    T['vertices'][L]['properties'][K]['type'] extends PropertyType.ARRAY ? any[] :
    any
} & {
  id?: string;
};

/**
 * Vertex type
 * 
 * Type-safe interface for vertex objects based on schema definition
 */
export type Vertex<
  T extends SchemaDefinition,
  L extends keyof T['vertices']
> = {
  id: string;
  label: L;
} & VertexData<T, L> & {
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Vertex query options
 */
export interface VertexQueryOptions {
  /**
   * Filter conditions
   */
  filters?: Array<{
    property: string;
    operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN';
    value: any;
  }>;
  
  /**
   * Order by clauses
   */
  orderBy?: Array<{
    property: string;
    direction: 'ASC' | 'DESC';
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
 * Vertex operations class
 * 
 * Provides type-safe methods for vertex creation, retrieval, update, and deletion
 */
export class VertexOperations<T extends SchemaDefinition> {
  /**
   * Create a new vertex operations instance
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
   * Create a new vertex
   * 
   * @param label - Vertex label
   * @param data - Vertex data
   * @returns Created vertex
   */
  async createVertex<L extends keyof T['vertices']>(
    label: L,
    data: VertexData<T, L>
  ): Promise<Vertex<T, L>> {
    // Validate data against schema
    this.validateVertexData(label, data);
    
    // Generate and execute SQL
    const { sql, params } = this.sqlGenerator.generateInsertVertexSQL(label as string, data);
    const result = await this.queryExecutor.executeSQL(sql, params);
    
    // Transform and return result
    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Get a vertex by ID
   * 
   * @param label - Vertex label
   * @param id - Vertex ID
   * @returns Vertex or null if not found
   */
  async getVertexById<L extends keyof T['vertices']>(
    label: L,
    id: string
  ): Promise<Vertex<T, L> | null> {
    const { sql, params } = this.sqlGenerator.generateSelectVertexSQL(label as string, {
      filters: [
        { property: 'id', operator: '=', value: id }
      ]
    });
    
    const result = await this.queryExecutor.executeSQL(sql, params);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Get vertices by label
   * 
   * @param label - Vertex label
   * @param options - Query options
   * @returns Array of vertices
   */
  async getVerticesByLabel<L extends keyof T['vertices']>(
    label: L,
    options: VertexQueryOptions = {}
  ): Promise<Vertex<T, L>[]> {
    // Convert query options to SQL query options
    const sqlOptions: SQLQueryOptions = {
      filters: options.filters?.map(filter => ({
        property: filter.property,
        operator: filter.operator,
        value: filter.value
      })),
      orderBy: options.orderBy?.map(order => ({
        property: order.property,
        direction: order.direction === 'ASC' ? SQLOrderDirection.ASC : SQLOrderDirection.DESC
      })),
      limit: options.limit,
      offset: options.offset
    };
    
    const { sql, params } = this.sqlGenerator.generateSelectVertexSQL(label as string, sqlOptions);
    const result = await this.queryExecutor.executeSQL(sql, params);
    
    return result.rows.map(row => this.transformToVertex(label, row));
  }

  /**
   * Update a vertex
   * 
   * @param label - Vertex label
   * @param id - Vertex ID
   * @param data - Vertex data to update
   * @returns Updated vertex
   */
  async updateVertex<L extends keyof T['vertices']>(
    label: L,
    id: string,
    data: Partial<VertexData<T, L>>
  ): Promise<Vertex<T, L>> {
    // Validate data against schema
    this.validateVertexData(label, data, true);
    
    // Generate and execute SQL
    const { sql, params } = this.sqlGenerator.generateUpdateVertexSQL(label as string, id, data);
    const result = await this.queryExecutor.executeSQL(sql, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Vertex with ID ${id} not found`);
    }
    
    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Delete a vertex
   * 
   * @param label - Vertex label
   * @param id - Vertex ID
   * @returns Deleted vertex
   */
  async deleteVertex<L extends keyof T['vertices']>(
    label: L,
    id: string
  ): Promise<Vertex<T, L>> {
    const { sql, params } = this.sqlGenerator.generateDeleteVertexSQL(label as string, id);
    const result = await this.queryExecutor.executeSQL(sql, params);
    
    if (result.rows.length === 0) {
      throw new Error(`Vertex with ID ${id} not found`);
    }
    
    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Create multiple vertices in a batch operation
   * 
   * @param label - Vertex label
   * @param dataArray - Array of vertex data
   * @returns Array of created vertices
   */
  async createVerticesBatch<L extends keyof T['vertices']>(
    label: L,
    dataArray: VertexData<T, L>[]
  ): Promise<Vertex<T, L>[]> {
    if (dataArray.length === 0) {
      return [];
    }
    
    // Validate all data items against schema
    dataArray.forEach(data => this.validateVertexData(label, data));
    
    // Generate and execute SQL
    const { sql, params } = this.sqlGenerator.generateBatchInsertVertexSQL(label as string, dataArray);
    const result = await this.queryExecutor.executeSQL(sql, params);
    
    return result.rows.map(row => this.transformToVertex(label, row));
  }

  /**
   * Validate vertex data against schema
   * 
   * @param label - Vertex label
   * @param data - Vertex data
   * @param isPartial - Whether this is a partial update
   */
  private validateVertexData<L extends keyof T['vertices']>(
    label: L,
    data: Partial<VertexData<T, L>>,
    isPartial: boolean = false
  ): void {
    const vertexDef = this.schema.vertices[label as string] as VertexLabel;
    
    if (!vertexDef) {
      throw new ValidationError(`Vertex label ${String(label)} not found in schema`);
    }
    
    // Check required properties
    if (!isPartial && vertexDef.required) {
      for (const requiredProp of vertexDef.required) {
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
      
      const propDef = vertexDef.properties[propName];
      
      if (!propDef) {
        throw new ValidationError(`Property '${propName}' is not defined in schema for vertex label ${String(label)}`);
      }
      
      // Skip null values if property is nullable
      if (propValue === null || propValue === undefined) {
        if (propDef.nullable !== true && vertexDef.required?.includes(propName)) {
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
   * Transform database row to vertex object
   * 
   * @param label - Vertex label
   * @param row - Database row
   * @returns Vertex object
   */
  private transformToVertex<L extends keyof T['vertices']>(
    label: L,
    row: Record<string, any>
  ): Vertex<T, L> {
    const vertex = {
      id: row.id,
      label,
    } as Vertex<T, L>;
    
    // Copy properties from row to vertex
    const vertexDef = this.schema.vertices[label as string] as VertexLabel;
    
    for (const propName of Object.keys(vertexDef.properties)) {
      if (propName in row) {
        (vertex as any)[propName] = row[propName];
      }
    }
    
    // Add metadata fields if present
    if ('created_at' in row) {
      vertex.createdAt = new Date(row.created_at);
    }
    
    if ('updated_at' in row) {
      vertex.updatedAt = new Date(row.updated_at);
    }
    
    return vertex;
  }
}
