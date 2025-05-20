/**
 * Query clauses implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import {
  IQueryBuilder,
  IMatchClause,
  IEdgeMatchClause,
  IReturnClause,
  MatchPatternType,
  VertexPattern,
  EdgePattern,
  OrderDirection,
  QueryExecutionOptions,
  QueryBuilderResult,
} from './types';
import { MatchPart, ReturnPart } from './parts';

/**
 * Match clause implementation
 */
export class MatchClause<
  T extends SchemaDefinition,
  L extends keyof T['vertices']
> implements IMatchClause<T, L> {
  /**
   * Create a new match clause
   *
   * @param queryBuilder - Query builder
   * @param matchPart - Match part
   * @param vertexPattern - Vertex pattern
   */
  constructor(
    private queryBuilder: IQueryBuilder<T>,
    private matchPart: MatchPart,
    private vertexPattern: VertexPattern
  ) {}

  /**
   * Add property constraints to the vertex pattern
   *
   * @param properties - Object with property-value pairs
   * @returns This match clause
   * @throws Error if any property value is null, undefined, or NaN
   */
  constraint(properties: Record<string, any>): this {
    // Add properties to vertex pattern
    if (!this.vertexPattern.properties) {
      this.vertexPattern.properties = {};
    }

    // Validate property values - Cypher doesn't support null values
    // and can only express missing properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
        throw new Error(
          `Invalid property value for '${key}': ${value}. ` +
          `Cypher doesn't support null, undefined, or NaN values. ` +
          `To match vertices without a specific property, use a WHERE clause with NOT exists(alias.${key}).`
        );
      }
    }

    // Merge the provided properties with existing ones
    this.vertexPattern.properties = {
      ...this.vertexPattern.properties,
      ...properties
    };

    return this;
  }

  /**
   * Add WHERE clause
   *
   * @param condition - Condition expression
   * @param params - Parameters
   * @returns This match clause
   */
  where(condition: string, params?: Record<string, any>): this {
    // Add WHERE clause to the query builder
    this.queryBuilder.where(condition, params);
    return this;
  }

  /**
   * Add outgoing edge
   *
   * @param label - Edge label
   * @param alias - Edge alias
   * @param targetLabel - Target vertex label
   * @param targetAlias - Target vertex alias
   * @returns This match clause
   */
  outgoing<E extends keyof T['edges']>(
    label: E,
    alias: string,
    targetLabel: keyof T['vertices'],
    targetAlias: string
  ): this {
    // Create target vertex pattern
    const targetVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: targetLabel as string,
      alias: targetAlias,
      properties: {},
      toCypher: () => {
        const labelStr = targetLabel ? `:${String(targetLabel)}` : '';
        return `(${targetAlias}${labelStr})`;
      }
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: label as string,
      alias,
      fromVertex: this.vertexPattern,
      toVertex: targetVertex,
      direction: 'OUTGOING',
      properties: {},
      toCypher: () => {
        const sourceStr = this.vertexPattern.toCypher();
        const targetStr = targetVertex.toCypher();
        const labelStr = label ? `:${String(label)}` : '';
        return `${sourceStr}-[${alias}${labelStr}]->${targetStr}`;
      }
    };

    // Add pattern to match part
    this.matchPart.addPattern(edgePattern);

    return this;
  }

  /**
   * Add incoming edge
   *
   * @param label - Edge label
   * @param alias - Edge alias
   * @param sourceLabel - Source vertex label
   * @param sourceAlias - Source vertex alias
   * @returns This match clause
   */
  incoming<E extends keyof T['edges']>(
    label: E,
    alias: string,
    sourceLabel: keyof T['vertices'],
    sourceAlias: string
  ): this {
    // Create source vertex pattern
    const sourceVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: sourceLabel as string,
      alias: sourceAlias,
      properties: {},
      toCypher: () => {
        const labelStr = sourceLabel ? `:${String(sourceLabel)}` : '';
        return `(${sourceAlias}${labelStr})`;
      }
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: label as string,
      alias,
      fromVertex: sourceVertex,
      toVertex: this.vertexPattern,
      direction: 'INCOMING',
      properties: {},
      toCypher: () => {
        const sourceStr = sourceVertex.toCypher();
        const targetStr = this.vertexPattern.toCypher();
        const labelStr = label ? `:${String(label)}` : '';
        return `${sourceStr}-[${alias}${labelStr}]->${targetStr}`;
      }
    };

    // Add pattern to match part
    this.matchPart.addPattern(edgePattern);

    return this;
  }

  /**
   * Add bidirectional edge
   *
   * @param label - Edge label
   * @param alias - Edge alias
   * @param otherLabel - Other vertex label
   * @param otherAlias - Other vertex alias
   * @returns This match clause
   */
  related<E extends keyof T['edges']>(
    label: E,
    alias: string,
    otherLabel: keyof T['vertices'],
    otherAlias: string
  ): this {
    // Create other vertex pattern
    const otherVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: otherLabel as string,
      alias: otherAlias,
      properties: {},
      toCypher: () => {
        const labelStr = otherLabel ? `:${String(otherLabel)}` : '';
        return `(${otherAlias}${labelStr})`;
      }
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: label as string,
      alias,
      fromVertex: this.vertexPattern,
      toVertex: otherVertex,
      direction: 'BIDIRECTIONAL',
      properties: {},
      toCypher: () => {
        const thisStr = this.vertexPattern.toCypher();
        const otherStr = otherVertex.toCypher();
        const labelStr = label ? `:${String(label)}` : '';
        return `${thisStr}-[${alias}${labelStr}]-${otherStr}`;
      }
    };

    // Add pattern to match part
    this.matchPart.addPattern(edgePattern);

    return this;
  }

  /**
   * Return to the main query builder
   *
   * @returns Query builder
   */
  done(): IQueryBuilder<T> {
    return this.queryBuilder;
  }
}

/**
 * Edge match clause implementation
 */
export class EdgeMatchClause<T extends SchemaDefinition> implements IEdgeMatchClause<T> {
  /**
   * Create a new edge match clause
   *
   * @param queryBuilder - Query builder
   * @param matchPart - Match part
   * @param edgePattern - Edge pattern
   */
  constructor(
    private queryBuilder: IQueryBuilder<T>,
    private matchPart: MatchPart,
    private edgePattern: EdgePattern
  ) {}

  /**
   * Add property constraints to the edge pattern
   *
   * @param properties - Object with property-value pairs
   * @returns This edge match clause
   * @throws Error if any property value is null, undefined, or NaN
   */
  constraint(properties: Record<string, any>): this {
    // Add properties to edge pattern
    if (!this.edgePattern.properties) {
      this.edgePattern.properties = {};
    }

    // Validate property values - Cypher doesn't support null values
    // and can only express missing properties
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
        throw new Error(
          `Invalid property value for '${key}': ${value}. ` +
          `Cypher doesn't support null, undefined, or NaN values. ` +
          `To match edges without a specific property, use a WHERE clause with NOT exists(alias.${key}).`
        );
      }
    }

    // Merge the provided properties with existing ones
    this.edgePattern.properties = {
      ...this.edgePattern.properties,
      ...properties
    };

    return this;
  }

  /**
   * Add WHERE clause
   *
   * @param condition - Condition expression
   * @param params - Parameters
   * @returns This edge match clause
   */
  where(condition: string, params?: Record<string, any>): this {
    // Add WHERE clause to the query builder
    this.queryBuilder.where(condition, params);
    return this;
  }

  /**
   * Add RETURN clause
   *
   * @param expressions - Return expressions
   * @returns This edge match clause
   */
  return(...expressions: string[]): this {
    this.queryBuilder.return(...expressions);
    return this;
  }

  /**
   * Add ORDER BY clause
   *
   * @param expression - Expression to order by
   * @param direction - Order direction
   * @returns This edge match clause
   */
  orderBy(expression: string, direction?: OrderDirection): this {
    this.queryBuilder.orderBy(expression, direction);
    return this;
  }

  /**
   * Add LIMIT clause
   *
   * @param count - Limit count
   * @returns This edge match clause
   */
  limit(count: number): this {
    this.queryBuilder.limit(count);
    return this;
  }

  /**
   * Add SKIP clause
   *
   * @param count - Skip count
   * @returns This edge match clause
   */
  skip(count: number): this {
    this.queryBuilder.skip(count);
    return this;
  }

  /**
   * Add WITH clause
   *
   * @param expressions - With expressions
   * @returns This edge match clause
   */
  with(...expressions: string[]): this {
    this.queryBuilder.with(...expressions);
    return this;
  }

  /**
   * Add UNWIND clause
   *
   * @param expression - Expression to unwind
   * @param alias - Alias for unwound items
   * @returns This edge match clause
   */
  unwind(expression: string, alias: string): this {
    this.queryBuilder.unwind(expression, alias);
    return this;
  }

  /**
   * Add a parameter to the query
   *
   * @param name - Parameter name
   * @param value - Parameter value
   * @returns This edge match clause
   */
  withParam(name: string, value: any): this {
    this.queryBuilder.withParam(name, value);
    return this;
  }

  /**
   * Execute the query
   *
   * @param options - Query execution options
   * @returns Query result
   */
  execute<R = any>(options?: QueryExecutionOptions): QueryBuilderResult<R> {
    return this.queryBuilder.execute<R>(options);
  }

  /**
   * Get the Cypher query string
   *
   * @returns Cypher query string
   */
  toCypher(): string {
    return this.queryBuilder.toCypher();
  }

  /**
   * Return to the main query builder
   *
   * @returns Query builder
   */
  done(): IQueryBuilder<T> {
    return this.queryBuilder;
  }
}

/**
 * Return clause implementation
 */
export class ReturnClause<T extends SchemaDefinition> implements IReturnClause<T> {
  /**
   * Create a new return clause
   *
   * @param queryBuilder - Query builder
   * @param returnPart - Return part
   */
  constructor(
    private queryBuilder: IQueryBuilder<T>,
    private returnPart: ReturnPart
  ) {}

  /**
   * Add GROUP BY clause
   *
   * @param expressions - Group by expressions
   * @returns Query builder
   */
  groupBy(...expressions: string[]): IQueryBuilder<T> {
    this.returnPart.addGroupBy(expressions);
    return this.queryBuilder;
  }

  /**
   * Return to the main query builder
   *
   * @returns Query builder
   */
  done(): IQueryBuilder<T> {
    return this.queryBuilder;
  }
}
