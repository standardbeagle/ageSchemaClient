/**
 * Vertex operations
 *
 * This file contains operations for working with vertices in a graph database.
 * It provides methods for creating, reading, updating, and deleting vertices.
 *
 * Prompt log:
 * - Fixed boolean type casting issues in Cypher queries
 * - Added graph name validation to prevent errors
 */

import { QueryExecutor, QueryResult } from './query';
import { SQLGenerator } from './sql';
import { PropertyType, Schema, VertexLabel } from '../schema/types';
import { ValidationError } from '../core/errors';
import { SQLFilterOperator, SQLOrderDirection } from './types';

/**
 * Vertex query options
 */
export interface VertexQueryOptions {
  /**
   * Filters to apply
   */
  filters?: {
    /**
     * Property to filter on
     */
    property: string;
    /**
     * Operator to use
     */
    operator: SQLFilterOperator;
    /**
     * Value to compare against
     */
    value: any;
  }[];

  /**
   * Properties to order by
   */
  orderBy?: {
    /**
     * Property to order by
     */
    property: string;
    /**
     * Direction to order in
     */
    direction: SQLOrderDirection;
  }[];

  /**
   * Maximum number of results to return
   */
  limit?: number;

  /**
   * Number of results to skip
   */
  offset?: number;
}

/**
 * Vertex data
 */
export type VertexData<T extends Schema, L extends keyof T['vertices']> = {
  [K in keyof T['vertices'][L]['properties']]?: any;
};

/**
 * Vertex
 */
export type Vertex<T extends Schema, L extends keyof T['vertices']> = {
  /**
   * Vertex ID
   */
  id: string;

  /**
   * Vertex label
   */
  label: L;

  /**
   * Vertex properties
   */
  properties?: Record<string, any>;
} & VertexData<T, L>;

/**
 * Vertex operations
 */
export class VertexOperations<T extends Schema> {
  /**
   * Create a new VertexOperations instance
   *
   * @param schema - Schema
   * @param queryExecutor - Query executor
   * @param sqlGenerator - SQL generator
   * @param graphName - Graph name
   */
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    private sqlGenerator: SQLGenerator,
    private graphName?: string
  ) {}

  /**
   * Create a new vertex
   *
   * @param label - Vertex label
   * @param data - Vertex data
   * @param graphName - Optional graph name to override the default
   * @returns Created vertex
   */
  async createVertex<L extends keyof T['vertices']>(
    label: L,
    data: VertexData<T, L>,
    graphName?: string
  ): Promise<Vertex<T, L>> {
    // Validate data against schema
    this.validateVertexData(label, data);

    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to create a vertex');
    }

    // Generate properties string for Cypher query
    const propsString = this.formatPropertiesForCypher(data);

    // Generate and execute Cypher query with hardcoded properties
    const query = `
      CREATE (v:${String(label)} ${propsString})
      RETURN v
    `;

    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

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
    id: string,
    graphName?: string
  ): Promise<Vertex<T, L> | null> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get a vertex');
    }

    // Use Cypher query to get vertex by ID
    const query = `
      MATCH (v:${String(label)})
      WHERE id(v) = ${id}
      RETURN v
      LIMIT 1
    `;

    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Get a vertex by properties
   *
   * @param label - Vertex label
   * @param properties - Properties to match
   * @param graphName - Graph name
   * @returns Vertex or null if not found
   */
  async getVertex<L extends keyof T['vertices']>(
    label: L,
    properties: Record<string, any>,
    graphName?: string
  ): Promise<Vertex<T, L> | null> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get a vertex');
    }

    // Build WHERE conditions with hardcoded values
    const conditions = this.buildPropertyConditions('v', properties);

    // Build Cypher query
    const query = `
      MATCH (v:${String(label)})
      WHERE ${conditions}
      RETURN v
      LIMIT 1
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Build property conditions for Cypher queries using direct parameters
   *
   * @param variableName - Cypher variable name
   * @param properties - Properties to match
   * @returns Cypher WHERE conditions
   */
  private buildPropertyConditionsForParams(
    variableName: string,
    properties: Record<string, any>
  ): string {
    if (!properties || Object.keys(properties).length === 0) {
      return 'true';
    }

    return Object.entries(properties)
      .map(([key, value]) => {
        if (value === null) {
          return `${variableName}.${key} IS NULL`;
        } else if (typeof value === 'boolean') {
          return `${variableName}.${key} = ${value}`;
        } else if (typeof value === 'number') {
          return `${variableName}.${key} = ${value}`;
        } else {
          return `${variableName}.${key} = $props.${key}`;
        }
      })
      .join(' AND ');
  }

  /**
   * Build property conditions for Cypher queries
   *
   * @param variableName - Cypher variable name
   * @param properties - Properties to match
   * @returns Cypher WHERE conditions
   */
  private buildPropertyConditions(
    variableName: string,
    properties: Record<string, any>
  ): string {
    if (!properties || Object.keys(properties).length === 0) {
      return 'true';
    }

    return Object.entries(properties)
      .map(([key, value]) => {
        if (value === null) {
          return `${variableName}.${key} IS NULL`;
        } else if (typeof value === 'boolean') {
          return `${variableName}.${key} = ${value}`;
        } else if (typeof value === 'number') {
          return `${variableName}.${key} = ${value}`;
        } else {
          return `${variableName}.${key} = '${String(value)}'`;
        }
      })
      .join(' AND ');
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
    options: VertexQueryOptions = {},
    graphName?: string
  ): Promise<Vertex<T, L>[]> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get vertices');
    }

    // Build Cypher query with options
    let query = `
      MATCH (v:${String(label)})
    `;

    // Add WHERE clause for filters
    if (options.filters && options.filters.length > 0) {
      const filterConditions = options.filters.map(filter => {
        const operator = this.mapFilterOperator(filter.operator);
        // Handle boolean values specially to avoid type casting issues
        if (typeof filter.value === 'boolean') {
          return `v.${filter.property} ${operator} ${filter.value}`;
        }
        return `toString(v.${filter.property}) ${operator} '${String(filter.value)}'`;
      }).join(' AND ');

      query += `\nWHERE ${filterConditions}`;
    }

    // Add RETURN clause
    query += `\nRETURN v`;

    // Add ORDER BY clause
    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map(order => {
        const direction = order.direction === SQLOrderDirection.ASC ? 'ASC' : 'DESC';
        return `v.${order.property} ${direction}`;
      }).join(', ');

      query += `\nORDER BY ${orderClauses}`;
    }

    // Add LIMIT clause
    if (options.limit !== undefined) {
      query += `\nLIMIT ${options.limit}`;
    }

    // Add SKIP clause
    if (options.offset !== undefined) {
      query += `\nSKIP ${options.offset}`;
    }

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    // Transform results to Vertex objects
    return result.rows.map(row => this.transformToVertex(label, row));
  }

  /**
   * Map SQL filter operator to Cypher operator
   *
   * @param operator - SQL filter operator
   * @returns Cypher operator
   */
  private mapFilterOperator(operator: SQLFilterOperator): string {
    switch (operator) {
      case SQLFilterOperator.EQUALS:
        return '=';
      case SQLFilterOperator.NOT_EQUALS:
        return '<>';
      case SQLFilterOperator.GREATER_THAN:
        return '>';
      case SQLFilterOperator.GREATER_THAN_OR_EQUALS:
        return '>=';
      case SQLFilterOperator.LESS_THAN:
        return '<';
      case SQLFilterOperator.LESS_THAN_OR_EQUALS:
        return '<=';
      case SQLFilterOperator.LIKE:
        return 'CONTAINS';
      case SQLFilterOperator.NOT_LIKE:
        return 'NOT CONTAINS';
      case SQLFilterOperator.IN:
        return 'IN';
      case SQLFilterOperator.NOT_IN:
        return 'NOT IN';
      default:
        return '=';
    }
  }

  /**
   * Update a vertex by ID
   *
   * @param label - Vertex label
   * @param id - Vertex ID
   * @param data - Vertex data to update
   * @returns Updated vertex
   */
  async updateVertexById<L extends keyof T['vertices']>(
    label: L,
    id: string,
    data: Partial<VertexData<T, L>>,
    graphName?: string
  ): Promise<Vertex<T, L>> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to update a vertex');
    }

    // Validate data against schema
    this.validateVertexData(label, data, true);

    // Convert data to Cypher SET clauses
    const setClauses = Object.entries(data)
      .map(([key, value]) => {
        const valueStr = typeof value === 'string'
          ? `'${value}'`
          : (typeof value === 'object' ? JSON.stringify(value) : value);
        return `v.${key} = ${valueStr}`;
      })
      .join(', ');

    // Build Cypher query
    const query = `
      MATCH (v:${String(label)})
      WHERE id(v) = ${id}
      SET ${setClauses}
      RETURN v
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      throw new Error(`Vertex with ID ${id} not found`);
    }

    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Delete a vertex by ID
   *
   * @param label - Vertex label
   * @param id - Vertex ID
   * @param graphName - Graph name
   * @returns Deleted vertex
   */
  async deleteVertexById<L extends keyof T['vertices']>(
    label: L,
    id: string,
    graphName?: string
  ): Promise<Vertex<T, L>> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to delete a vertex');
    }

    // First get the vertex to return it after deletion
    const getQuery = `
      MATCH (v:${String(label)})
      WHERE id(v) = ${id}
      RETURN v
    `;

    const getResult = await this.queryExecutor.executeCypher(
      getQuery,
      {},
      targetGraph
    );

    if (getResult.rows.length === 0) {
      throw new Error(`Vertex with ID ${id} not found`);
    }

    // Store the vertex data
    const vertex = this.transformToVertex(label, getResult.rows[0]);

    // Now delete the vertex
    const deleteQuery = `
      MATCH (v:${String(label)})
      WHERE id(v) = ${id}
      DETACH DELETE v
    `;

    await this.queryExecutor.executeCypher(
      deleteQuery,
      {},
      targetGraph
    );

    return vertex;
  }

  /**
   * Delete a vertex by properties
   *
   * @param label - Vertex label
   * @param properties - Properties to match
   * @param graphName - Graph name
   * @returns True if the vertex was deleted
   */
  async deleteVertex<L extends keyof T['vertices']>(
    label: L,
    properties: Record<string, any>,
    graphName?: string
  ): Promise<boolean> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to delete a vertex');
    }

    // Build WHERE conditions with hardcoded values
    const conditions = this.buildPropertyConditions('v', properties);

    // Build Cypher query
    const query = `
      MATCH (v:${String(label)})
      WHERE ${conditions}
      DETACH DELETE v
      RETURN count(*) AS deleted
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    // Check if any vertices were deleted
    return parseInt(result.rows[0].deleted, 10) > 0;
  }

  /**
   * Update a vertex by properties
   *
   * @param label - Vertex label
   * @param properties - Properties to match
   * @param data - Vertex data to update
   * @param graphName - Graph name
   * @returns Updated vertex or null if not found
   */
  async updateVertex<L extends keyof T['vertices']>(
    label: L,
    properties: Record<string, any>,
    data: Partial<VertexData<T, L>>,
    graphName?: string
  ): Promise<Vertex<T, L> | null> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to update a vertex');
    }

    // Validate data against schema
    this.validateVertexData(label, data, true);

    // Build SET clauses for Cypher query with hardcoded values
    const setClauses = this.buildSetClauses('v', data);

    // Build WHERE conditions with hardcoded values
    const conditions = this.buildPropertyConditions('v', properties);

    // Build Cypher query
    const query = `
      MATCH (v:${String(label)})
      WHERE ${conditions}
      SET ${setClauses}
      RETURN v
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.transformToVertex(label, result.rows[0]);
  }

  /**
   * Build SET clauses for Cypher queries with parameters
   *
   * @param variableName - Cypher variable name
   * @param data - Data to set
   * @returns Cypher SET clauses
   */
  private buildSetClausesForParams(
    variableName: string,
    data: Record<string, any>
  ): string {
    if (!data || Object.keys(data).length === 0) {
      return `${variableName} = ${variableName}`;
    }

    return Object.entries(data)
      .map(([key, value]) => {
        if (value === null) {
          return `${variableName}.${key} = null`;
        } else if (typeof value === 'boolean') {
          return `${variableName}.${key} = ${value}`;
        } else if (typeof value === 'number') {
          return `${variableName}.${key} = ${value}`;
        } else {
          return `${variableName}.${key} = $updateData.${key}`;
        }
      })
      .join(', ');
  }

  /**
   * Build SET clauses for Cypher queries
   *
   * @param variableName - Cypher variable name
   * @param data - Data to set
   * @returns Cypher SET clauses
   */
  private buildSetClauses(
    variableName: string,
    data: Record<string, any>
  ): string {
    if (!data || Object.keys(data).length === 0) {
      return `${variableName} = ${variableName}`;
    }

    return Object.entries(data)
      .map(([key, value]) => {
        if (value === null) {
          return `${variableName}.${key} = null`;
        } else if (typeof value === 'boolean') {
          return `${variableName}.${key} = ${value}`;
        } else if (typeof value === 'number') {
          return `${variableName}.${key} = ${value}`;
        } else if (typeof value === 'string') {
          return `${variableName}.${key} = '${value}'`;
        } else {
          return `${variableName}.${key} = ${JSON.stringify(value)}`;
        }
      })
      .join(', ');
  }

  /**
   * Format properties for Cypher query
   *
   * @param data - Properties to format
   * @returns Formatted properties string for Cypher query
   */
  private formatPropertiesForCypher(data: Record<string, any>): string {
    if (!data || Object.keys(data).length === 0) {
      return '{}';
    }

    const props = Object.entries(data).map(([key, value]) => {
      if (value === null) {
        return `${key}: null`;
      } else if (typeof value === 'boolean') {
        return `${key}: ${value}`;
      } else if (typeof value === 'number') {
        return `${key}: ${value}`;
      } else if (typeof value === 'string') {
        return `${key}: '${value.replace(/'/g, "\\'")}'`;
      } else {
        return `${key}: ${JSON.stringify(value)}`;
      }
    });

    return `{${props.join(', ')}}`;
  }

  /**
   * Validate vertex data against schema
   *
   * @param label - Vertex label
   * @param data - Vertex data
   * @param isPartial - Whether this is a partial update
   */
  public validateVertexData<L extends keyof T['vertices']>(
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
  public transformToVertex<L extends keyof T['vertices']>(
    label: L,
    row: Record<string, any>
  ): Vertex<T, L> {
    // Handle Cypher query result
    if (row.v) {
      try {
        // Apache AGE returns data in a specific format that might include type annotations
        // We need to handle it specially
        let vertexData;

        if (typeof row.v === 'string') {
          // Try to parse as JSON first
          try {
            vertexData = JSON.parse(row.v);
          } catch (jsonError) {
            // If JSON parsing fails, it might be an AGE-specific format with type annotations
            // Example: {"id": 844424930131969, "label": "Person", "properties": {"age": 30, "name": "Alice"}}::vertex
            // Strip the type annotation and try again
            const cleanedStr = row.v.replace(/::vertex$/, '');
            try {
              vertexData = JSON.parse(cleanedStr);
            } catch (cleanedJsonError) {
              // If that still fails, try to extract data using regex
              const str = String(row.v);
              const idMatch = str.match(/id[=:]\s*(\d+)/);
              const propsMatch = str.match(/properties[=:]\s*({.*?})/);

              vertexData = {
                identity: idMatch ? parseInt(idMatch[1]) : 0,
                properties: propsMatch ? JSON.parse(propsMatch[1].replace(/'/g, '"')) : {}
              };
            }
          }
        } else if (typeof row.v === 'object') {
          vertexData = row.v;
        } else {
          // For other types, convert to string and extract data
          const str = String(row.v);
          const idMatch = str.match(/id[=:]\s*(\d+)/);

          vertexData = {
            identity: idMatch ? parseInt(idMatch[1]) : 0,
            properties: {}
          };
        }

        return {
          id: vertexData.id || (vertexData.identity ? vertexData.identity.toString() : '0'),
          label,
          properties: vertexData.properties || {}
        } as Vertex<T, L>;
      } catch (error) {
        console.error('Error parsing vertex data:', error, row.v);

        // Last resort fallback
        return {
          id: '0',
          label,
          properties: {}
        } as Vertex<T, L>;
      }
    }

    // Handle SQL query result
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
