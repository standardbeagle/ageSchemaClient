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
    private sqlGenerator: SQLGenerator,
    private graphName?: string
  ) {}

  /**
   * Create a new edge
   *
   * @param label - Edge label
   * @param fromVertex - Source vertex
   * @param toVertex - Target vertex
   * @param data - Edge data
   * @param graphName - Optional graph name to override the default
   * @returns Created edge
   */
  async createEdge<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>,
    data: EdgeData<T, L> = {},
    graphName?: string
  ): Promise<Edge<T, L>> {
    // Validate data against schema
    this.validateEdgeData(label, data);

    // Validate vertex types against edge constraints
    this.validateVertexTypes(label, fromVertex, toVertex);

    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to create an edge');
    }

    // Format properties for Cypher query
    const propsString = this.formatPropertiesForCypher(data);

    // Use Cypher query for edge creation with hardcoded properties
    const query = `
      MATCH (a), (b)
      WHERE id(a) = ${fromVertex.id} AND id(b) = ${toVertex.id}
      CREATE (a)-[r:${String(label)} ${propsString}]->(b)
      RETURN a, r, b
    `;

    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    // Parse the edge from the result
    const edgeData = JSON.parse(result.rows[0].r);
    const fromData = JSON.parse(result.rows[0].a);
    const toData = JSON.parse(result.rows[0].b);

    // Transform to Edge object
    return {
      id: edgeData.id || edgeData.identity.toString(),
      label: label,
      fromId: fromVertex.id,
      toId: toVertex.id,
      ...data,
      properties: edgeData.properties || {}
    } as Edge<T, L>;
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
    id: string,
    graphName?: string
  ): Promise<Edge<T, L> | null> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get an edge');
    }

    // Use Cypher query to get edge by ID
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE id(r) = ${id}
      RETURN a, r, b
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

    // Parse the edge from the result
    const edgeData = JSON.parse(result.rows[0].r);
    const fromData = JSON.parse(result.rows[0].a);
    const toData = JSON.parse(result.rows[0].b);

    // Transform to Edge object
    return {
      id: edgeData.id || edgeData.identity.toString(),
      label: label,
      fromId: fromData.id || fromData.identity.toString(),
      toId: toData.id || toData.identity.toString(),
      properties: edgeData.properties || {}
    } as Edge<T, L>;
  }

  /**
   * Get an edge by properties
   *
   * @param label - Edge label
   * @param fromProperties - Properties to match for the source vertex
   * @param toProperties - Properties to match for the target vertex
   * @param edgeProperties - Properties to match for the edge
   * @param graphName - Graph name
   * @returns Edge or null if not found
   */
  async getEdge<L extends keyof T['edges']>(
    label: L,
    fromProperties: Record<string, any>,
    toProperties: Record<string, any>,
    edgeProperties?: Record<string, any>,
    graphName?: string
  ): Promise<Edge<T, L> | null> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get an edge');
    }

    // Build WHERE conditions with hardcoded values
    const fromConditions = this.buildPropertyConditions('a', fromProperties);
    const toConditions = this.buildPropertyConditions('b', toProperties);
    const edgeConditions = edgeProperties && Object.keys(edgeProperties).length > 0
      ? `AND ${this.buildPropertyConditions('r', edgeProperties)}`
      : '';

    // Build Cypher query
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE ${fromConditions}
      AND ${toConditions}
      ${edgeConditions}
      RETURN a, r, b
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

    // Parse the edge from the result
    const edgeData = JSON.parse(result.rows[0].r);
    const fromData = JSON.parse(result.rows[0].a);
    const toData = JSON.parse(result.rows[0].b);

    // Transform to Edge object
    return {
      id: edgeData.id || edgeData.identity.toString(),
      label: label,
      fromId: fromData.id || fromData.identity.toString(),
      toId: toData.id || toData.identity.toString(),
      properties: edgeData.properties || {}
    } as Edge<T, L>;
  }

  /**
   * Build property conditions for Cypher queries with parameters
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

    const propPrefix = variableName === 'a' ? 'fromProps' :
                       variableName === 'b' ? 'toProps' : 'edgeProps';

    return Object.entries(properties)
      .map(([key, value]) => {
        if (value === null) {
          return `${variableName}.${key} IS NULL`;
        } else if (typeof value === 'boolean') {
          return `${variableName}.${key} = ${value}`;
        } else if (typeof value === 'number') {
          return `${variableName}.${key} = ${value}`;
        } else {
          return `${variableName}.${key} = $${propPrefix}.${key}`;
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
        } else if (typeof value === 'string') {
          return `${variableName}.${key} = '${value}'`;
        } else {
          return `${variableName}.${key} = ${JSON.stringify(value)}`;
        }
      })
      .join(' AND ');
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
    options: EdgeQueryOptions = {},
    graphName?: string
  ): Promise<Edge<T, L>[]> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get edges');
    }

    // Build Cypher query with options
    let query = `
      MATCH (a)-[r:${String(label)}]->(b)
    `;

    // Add WHERE clause for filters
    if (options.filters && options.filters.length > 0) {
      const filterConditions = options.filters.map(filter => {
        const operator = this.mapFilterOperator(filter.operator);
        // Handle boolean values specially to avoid type casting issues
        if (typeof filter.value === 'boolean') {
          return `r.${filter.property} ${operator} ${filter.value}`;
        }
        return `toString(r.${filter.property}) ${operator} '${String(filter.value)}'`;
      }).join(' AND ');

      query += `\nWHERE ${filterConditions}`;
    }

    // Add RETURN clause
    query += `\nRETURN a, r, b`;

    // Add ORDER BY clause
    if (options.orderBy && options.orderBy.length > 0) {
      const orderClauses = options.orderBy.map(order => {
        const direction = order.direction === SQLOrderDirection.ASC ? 'ASC' : 'DESC';
        return `r.${order.property} ${direction}`;
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
      graphName || this.graphName
    );

    // Transform results to Edge objects
    return result.rows.map(row => {
      const edgeData = JSON.parse(row.r);
      const fromData = JSON.parse(row.a);
      const toData = JSON.parse(row.b);

      return {
        id: edgeData.id || edgeData.identity.toString(),
        label: label,
        fromId: fromData.id || fromData.identity.toString(),
        toId: toData.id || toData.identity.toString(),
        properties: edgeData.properties || {}
      } as Edge<T, L>;
    });
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
    toVertex: Vertex<T, any>,
    graphName?: string
  ): Promise<Edge<T, L>[]> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to get edges between vertices');
    }

    // Use Cypher query to get edges between vertices
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE id(a) = ${fromVertex.id} AND id(b) = ${toVertex.id}
      RETURN a, r, b
    `;

    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    // Transform results to Edge objects
    return result.rows.map(row => {
      const edgeData = JSON.parse(row.r);
      const fromData = JSON.parse(row.a);
      const toData = JSON.parse(row.b);

      return {
        id: edgeData.id || edgeData.identity.toString(),
        label: label,
        fromId: fromVertex.id,
        toId: toVertex.id,
        properties: edgeData.properties || {}
      } as Edge<T, L>;
    });
  }

  /**
   * Update an edge by ID
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @param data - Edge data to update
   * @returns Updated edge
   */
  async updateEdgeById<L extends keyof T['edges']>(
    label: L,
    id: string,
    data: Partial<EdgeData<T, L>>,
    graphName?: string
  ): Promise<Edge<T, L>> {
    // Validate data against schema
    this.validateEdgeData(label, data, true);

    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to update an edge');
    }

    // Convert data to Cypher SET clauses
    const setClauses = Object.entries(data)
      .map(([key, value]) => {
        const valueStr = typeof value === 'string'
          ? `'${value}'`
          : (typeof value === 'object' ? JSON.stringify(value) : value);
        return `r.${key} = ${valueStr}`;
      })
      .join(', ');

    // Build Cypher query
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE id(r) = ${id}
      SET ${setClauses}
      RETURN a, r, b
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      throw new Error(`Edge with ID ${id} not found`);
    }

    // Parse the edge from the result
    const edgeData = JSON.parse(result.rows[0].r);
    const fromData = JSON.parse(result.rows[0].a);
    const toData = JSON.parse(result.rows[0].b);

    // Transform to Edge object
    return {
      id: edgeData.id || edgeData.identity.toString(),
      label: label,
      fromId: fromData.id || fromData.identity.toString(),
      toId: toData.id || toData.identity.toString(),
      properties: edgeData.properties || {}
    } as Edge<T, L>;
  }

  /**
   * Update an edge by properties
   *
   * @param label - Edge label
   * @param fromProperties - Properties to match for the source vertex
   * @param toProperties - Properties to match for the target vertex
   * @param edgeProperties - Properties to match for the edge
   * @param data - Edge data to update
   * @param graphName - Graph name
   * @returns Updated edge or null if not found
   */
  async updateEdge<L extends keyof T['edges']>(
    label: L,
    fromProperties: Record<string, any>,
    toProperties: Record<string, any>,
    edgeProperties: Record<string, any>,
    data: Partial<EdgeData<T, L>>,
    graphName?: string
  ): Promise<Edge<T, L> | null> {
    // Validate data against schema
    this.validateEdgeData(label, data, true);

    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to update an edge');
    }

    // Convert properties to Cypher query conditions
    const fromConditions = Object.entries(fromProperties)
      .map(([key, value]) => {
        // Handle boolean values specially to avoid type casting issues
        if (typeof value === 'boolean') {
          return `a.${key} = ${value}`;
        }
        return `toString(a.${key}) = '${String(value)}'`;
      })
      .join(' AND ');

    const toConditions = Object.entries(toProperties)
      .map(([key, value]) => {
        // Handle boolean values specially to avoid type casting issues
        if (typeof value === 'boolean') {
          return `b.${key} = ${value}`;
        }
        return `toString(b.${key}) = '${String(value)}'`;
      })
      .join(' AND ');

    const edgeConditionsArray = Object.entries(edgeProperties)
      .map(([key, value]) => {
        // Handle boolean values specially to avoid type casting issues
        if (typeof value === 'boolean') {
          return `r.${key} = ${value}`;
        }
        return `toString(r.${key}) = '${String(value)}'`;
      });

    const edgeConditions = edgeConditionsArray.length > 0
      ? ' AND ' + edgeConditionsArray.join(' AND ')
      : '';

    // Convert data to Cypher SET clauses
    const setClauses = Object.entries(data)
      .map(([key, value]) => {
        const valueStr = typeof value === 'string'
          ? `'${value}'`
          : (typeof value === 'object' ? JSON.stringify(value) : value);
        return `r.${key} = ${valueStr}`;
      })
      .join(', ');

    // Build Cypher query
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE ${fromConditions} AND ${toConditions}${edgeConditions}
      SET ${setClauses}
      RETURN a, r, b
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(query, {}, graphName || this.graphName);

    if (result.rows.length === 0) {
      return null;
    }

    // Parse the edge from the result
    const edgeData = JSON.parse(result.rows[0].r);
    const fromData = JSON.parse(result.rows[0].a);
    const toData = JSON.parse(result.rows[0].b);

    // Transform to Edge object
    return {
      id: edgeData.id || edgeData.identity.toString(),
      label: label,
      properties: edgeData.properties || {},
      from: {
        id: fromData.id || fromData.identity.toString(),
        label: fromData.label,
        properties: fromData.properties || {}
      },
      to: {
        id: toData.id || toData.identity.toString(),
        label: toData.label,
        properties: toData.properties || {}
      }
    } as Edge<T, L>;
  }

  /**
   * Delete an edge by ID
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @returns Deleted edge
   */
  async deleteEdgeById<L extends keyof T['edges']>(
    label: L,
    id: string,
    graphName?: string
  ): Promise<Edge<T, L>> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to delete an edge');
    }

    // Use Cypher query to delete edge by ID
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE id(r) = ${id}
      WITH a, r, b
      DELETE r
      RETURN a, r, b
    `;

    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      throw new Error(`Edge with ID ${id} not found`);
    }

    // Parse the edge from the result
    const edgeData = JSON.parse(result.rows[0].r);
    const fromData = JSON.parse(result.rows[0].a);
    const toData = JSON.parse(result.rows[0].b);

    // Transform to Edge object
    return {
      id: edgeData.id || edgeData.identity.toString(),
      label: label,
      fromId: fromData.id || fromData.identity.toString(),
      toId: toData.id || toData.identity.toString(),
      properties: edgeData.properties || {}
    } as Edge<T, L>;
  }

  /**
   * Delete an edge by properties
   *
   * @param label - Edge label
   * @param fromProperties - Properties to match for the source vertex
   * @param toProperties - Properties to match for the target vertex
   * @param edgeProperties - Properties to match for the edge
   * @param graphName - Graph name
   * @returns True if the edge was deleted
   */
  async deleteEdge<L extends keyof T['edges']>(
    label: L,
    fromProperties: Record<string, any>,
    toProperties: Record<string, any>,
    edgeProperties?: Record<string, any>,
    graphName?: string
  ): Promise<boolean> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to delete an edge');
    }

    // Build WHERE conditions with hardcoded values
    const fromConditions = this.buildPropertyConditions('a', fromProperties);
    const toConditions = this.buildPropertyConditions('b', toProperties);
    const edgeConditions = edgeProperties && Object.keys(edgeProperties).length > 0
      ? `AND ${this.buildPropertyConditions('r', edgeProperties)}`
      : '';

    // Build Cypher query
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE ${fromConditions}
      AND ${toConditions}
      ${edgeConditions}
      DELETE r
      RETURN count(*) AS deleted
    `;

    // Execute query
    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    // Check if any edges were deleted
    return parseInt(result.rows[0].deleted, 10) > 0;
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
    toVertex: Vertex<T, any>,
    graphName?: string
  ): Promise<Edge<T, L>[]> {
    // Ensure we have a graph name
    const targetGraph = graphName || this.graphName;
    if (!targetGraph) {
      throw new ValidationError('Graph name is required to delete edges between vertices');
    }

    // Use Cypher query to delete edges between vertices
    const query = `
      MATCH (a)-[r:${String(label)}]->(b)
      WHERE id(a) = ${fromVertex.id} AND id(b) = ${toVertex.id}
      WITH a, r, b
      DELETE r
      RETURN a, r, b
    `;

    const result = await this.queryExecutor.executeCypher(
      query,
      {},
      targetGraph
    );

    if (result.rows.length === 0) {
      return [];
    }

    // Transform results to Edge objects
    return result.rows.map(row => {
      const edgeData = JSON.parse(row.r);
      const fromData = JSON.parse(row.a);
      const toData = JSON.parse(row.b);

      return {
        id: edgeData.id || edgeData.identity.toString(),
        label: label,
        fromId: fromVertex.id,
        toId: toVertex.id,
        properties: edgeData.properties || {}
      } as Edge<T, L>;
    });
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
    }>,
    graphName?: string
  ): Promise<Edge<T, L>[]> {
    if (edges.length === 0) {
      return [];
    }

    // Validate all data items against schema
    edges.forEach(edge => {
      this.validateEdgeData(label, edge.data || {});
      this.validateVertexTypes(label, edge.fromVertex, edge.toVertex);
    });

    // Process edges one by one using Cypher
    const results: Edge<T, L>[] = [];

    for (const edge of edges) {
      // Format properties for Cypher query
      const propsString = this.formatPropertiesForCypher(edge.data || {});

      const query = `
        MATCH (a), (b)
        WHERE id(a) = ${edge.fromVertex.id} AND id(b) = ${edge.toVertex.id}
        CREATE (a)-[r:${String(label)} ${propsString}]->(b)
        RETURN a, r, b
      `;

      const result = await this.queryExecutor.executeCypher(
        query,
        {},
        graphName || this.graphName
      );

      if (result.rows.length > 0) {
        const edgeData = JSON.parse(result.rows[0].r);

        results.push({
          id: edgeData.id || edgeData.identity.toString(),
          label: label,
          fromId: edge.fromVertex.id,
          toId: edge.toVertex.id,
          ...(edge.data || {}),
          properties: edgeData.properties || {}
        } as Edge<T, L>);
      }
    }

    return results;
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

    // Validate property types and constraints
    for (const [propName, propValue] of Object.entries(data)) {
      const propDef = edgeDef.properties[propName];

      if (!propDef) {
        throw new ValidationError(`Property '${propName}' is not defined in schema for edge label ${String(label)}`);
      }

      // Skip null values if property is nullable
      if (propValue === null) {
        if (propDef.nullable !== true) {
          throw new ValidationError(`Property '${propName}' cannot be null`);
        }
        continue;
      }

      // Type validation could be added here if needed
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



    if (!fromVertex || !fromVertex.label) {
      throw new ValidationError(`Source vertex is invalid or missing label`);
    }

    if (!toVertex || !toVertex.label) {
      throw new ValidationError(`Target vertex is invalid or missing label`);
    }

    // Validate source vertex
    if (typeof edgeDef.fromVertex === 'string') {
      if (fromVertex.label !== edgeDef.fromVertex) {
        throw new ValidationError(
          `Source vertex must have label '${edgeDef.fromVertex}', got '${String(fromVertex.label)}'`
        );
      }
    } else if (Array.isArray(edgeDef.fromVertex)) {
      // If fromVertex is an array of allowed labels
      if (!edgeDef.fromVertex.includes(fromVertex.label as string)) {
        throw new ValidationError(
          `Source vertex must have one of these labels: [${edgeDef.fromVertex.join(', ')}], got '${String(fromVertex.label)}'`
        );
      }
    }

    // Validate target vertex
    if (typeof edgeDef.toVertex === 'string') {
      if (toVertex.label !== edgeDef.toVertex) {
        throw new ValidationError(
          `Target vertex must have label '${edgeDef.toVertex}', got '${String(toVertex.label)}'`
        );
      }
    } else if (Array.isArray(edgeDef.toVertex)) {
      // If toVertex is an array of allowed labels
      if (!edgeDef.toVertex.includes(toVertex.label as string)) {
        throw new ValidationError(
          `Target vertex must have one of these labels: [${edgeDef.toVertex.join(', ')}], got '${String(toVertex.label)}'`
        );
      }
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
