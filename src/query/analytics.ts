/**
 * Analytics query builder implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { QueryBuilder } from './builder';
import {
  QueryPartType,
  QueryPart,
  IQueryBuilder,
  IMatchClause,
  IEdgeMatchClause,
  VertexPattern,
  MatchPatternType
} from './types';
import { ReturnPart, MatchPart } from './parts';
import { MatchClause } from './clauses';

/**
 * Analytics match clause class
 *
 * Extends the standard match clause with analytics capabilities
 */
export class AnalyticsMatchClause<
  T extends SchemaDefinition,
  L extends keyof T['vertices']
> extends MatchClause<T, L> {
  /**
   * Create a new analytics match clause
   *
   * @param queryBuilder - Query builder
   * @param matchPart - Match part
   * @param vertexPattern - Vertex pattern
   */
  constructor(
    queryBuilder: AnalyticsQueryBuilder<T>,
    matchPart: MatchPart,
    vertexPattern: VertexPattern
  ) {
    // Cast to IQueryBuilder to satisfy the type constraint
    super(queryBuilder as unknown as IQueryBuilder<T>, matchPart, vertexPattern);
  }

  /**
   * Count vertices or edges
   *
   * @param alias - Alias of the vertex or edge to count
   * @param resultAlias - Alias for the count result (default: 'count')
   * @param distinct - Whether to count distinct elements (default: false)
   * @returns The analytics query builder
   */
  count(alias: string, resultAlias: string = 'count', distinct: boolean = false): AnalyticsQueryBuilder<T> {
    const distinctClause = distinct ? 'DISTINCT ' : '';
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(`count(${distinctClause}${alias}) AS ${resultAlias}`);
    return queryBuilder;
  }

  /**
   * Sum values of a property
   *
   * @param expression - Expression to sum (e.g., 'n.age')
   * @param resultAlias - Alias for the sum result (default: 'sum')
   * @returns The analytics query builder
   */
  sum(expression: string, resultAlias: string = 'sum'): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(`sum(${expression}) AS ${resultAlias}`);
    return queryBuilder;
  }

  /**
   * Calculate average of a property
   *
   * @param expression - Expression to average (e.g., 'n.age')
   * @param resultAlias - Alias for the average result (default: 'avg')
   * @returns The analytics query builder
   */
  avg(expression: string, resultAlias: string = 'avg'): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(`avg(${expression}) AS ${resultAlias}`);
    return queryBuilder;
  }

  /**
   * Find minimum value of a property
   *
   * @param expression - Expression to find minimum (e.g., 'n.age')
   * @param resultAlias - Alias for the minimum result (default: 'min')
   * @returns The analytics query builder
   */
  min(expression: string, resultAlias: string = 'min'): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(`min(${expression}) AS ${resultAlias}`);
    return queryBuilder;
  }

  /**
   * Find maximum value of a property
   *
   * @param expression - Expression to find maximum (e.g., 'n.age')
   * @param resultAlias - Alias for the maximum result (default: 'max')
   * @returns The analytics query builder
   */
  max(expression: string, resultAlias: string = 'max'): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(`max(${expression}) AS ${resultAlias}`);
    return queryBuilder;
  }

  /**
   * Apply a custom aggregation function
   *
   * @param functionName - Aggregation function name
   * @param expression - Expression to aggregate
   * @param resultAlias - Alias for the result
   * @returns The analytics query builder
   */
  aggregate(functionName: string, expression: string, resultAlias: string): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(`${functionName}(${expression}) AS ${resultAlias}`);
    return queryBuilder;
  }

  /**
   * Add MATCH clause - supports both vertex and edge patterns
   * This method is overloaded to match the IMatchClause interface
   */
  match<L2 extends keyof T['vertices']>(label: L2, alias: string): AnalyticsMatchClause<T, L2>;
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string
  ): IEdgeMatchClause<T>;
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string,
    edgeAlias: string
  ): IEdgeMatchClause<T>;
  match(
    labelOrSourceAlias: any,
    aliasOrEdgeLabel: string,
    targetAlias?: string,
    edgeAlias?: string
  ): any {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    if (targetAlias === undefined) {
      // Vertex match
      return queryBuilder.match(labelOrSourceAlias, aliasOrEdgeLabel) as any;
    } else if (edgeAlias === undefined) {
      // Edge match without alias
      return queryBuilder.match(labelOrSourceAlias, aliasOrEdgeLabel, targetAlias);
    } else {
      // Edge match with alias
      return queryBuilder.match(labelOrSourceAlias, aliasOrEdgeLabel, targetAlias, edgeAlias);
    }
  }

  /**
   * Add WHERE clause
   *
   * @param condition - Condition expression
   * @param params - Parameters
   * @returns This analytics match clause
   */
  where(condition: string, params?: Record<string, any>): this {
    // Call the parent method to add the WHERE clause
    super.where(condition, params);

    // Return this for method chaining
    return this;
  }

  /**
   * Add RETURN clause
   *
   * @param expressions - Return expressions
   * @returns This analytics query builder
   */
  return(...expressions: string[]): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.return(...expressions);
    return queryBuilder;
  }

  /**
   * Add GROUP BY clause
   *
   * @param fields - Fields to group by
   * @returns This analytics query builder
   */
  groupBy(...fields: string[]): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.groupBy(...fields);
    return queryBuilder;
  }

  /**
   * Add a window function to the query
   *
   * @param functionType - Window function type
   * @param resultAlias - Alias for the window function result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  windowFunction(
    functionType: WindowFunctionType | string,
    resultAlias: string,
    options: WindowFunctionOptions = {}
  ): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.windowFunction(functionType, resultAlias, options);
    return queryBuilder;
  }

  /**
   * Add ROW_NUMBER window function
   *
   * @param resultAlias - Alias for the result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  rowNumber(resultAlias: string, options: WindowFunctionOptions = {}): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.rowNumber(resultAlias, options);
    return queryBuilder;
  }

  /**
   * Add RANK window function
   *
   * @param resultAlias - Alias for the result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  rank(resultAlias: string, options: WindowFunctionOptions = {}): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.rank(resultAlias, options);
    return queryBuilder;
  }

  /**
   * Add DENSE_RANK window function
   *
   * @param resultAlias - Alias for the result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  denseRank(resultAlias: string, options: WindowFunctionOptions = {}): AnalyticsQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AnalyticsQueryBuilder<T>;
    queryBuilder.denseRank(resultAlias, options);
    return queryBuilder;
  }
}

/**
 * Window function type
 */
export enum WindowFunctionType {
  ROW_NUMBER = 'row_number',
  RANK = 'rank',
  DENSE_RANK = 'dense_rank',
  PERCENT_RANK = 'percent_rank',
  CUME_DIST = 'cume_dist',
  NTILE = 'ntile',
  LEAD = 'lead',
  LAG = 'lag',
  FIRST_VALUE = 'first_value',
  LAST_VALUE = 'last_value',
  NTH_VALUE = 'nth_value'
}

/**
 * Window function options
 */
export interface WindowFunctionOptions {
  /**
   * Partition by expressions
   */
  partitionBy?: string[];

  /**
   * Order by expressions with direction
   */
  orderBy?: Array<{
    expression: string;
    direction?: 'ASC' | 'DESC';
  }>;

  /**
   * Frame specification (for certain window functions)
   */
  frame?: {
    type: 'ROWS' | 'RANGE';
    start: 'UNBOUNDED PRECEDING' | 'CURRENT ROW' | number;
    end: 'UNBOUNDED FOLLOWING' | 'CURRENT ROW' | number;
  };

  /**
   * Additional arguments for specific window functions
   */
  args?: any[];
}

/**
 * Analytics query builder class
 *
 * Specialized query builder for aggregation and analytics operations on graph data
 */
export class AnalyticsQueryBuilder<T extends SchemaDefinition> extends QueryBuilder<T> {
  /**
   * Create a new analytics query builder
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param graphName - Graph name
   */
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    graphName: string = 'default'
  ) {
    super(schema, queryExecutor, graphName);
  }

  /**
   * Add MATCH clause for a vertex
   */
  match<L extends keyof T['vertices']>(label: L, alias: string): IMatchClause<T, L>;

  /**
   * Add MATCH clause for an edge between two previously matched vertices
   */
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string
  ): IEdgeMatchClause<T>;

  /**
   * Add MATCH clause for an edge between two previously matched vertices with an edge alias
   */
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string,
    edgeAlias: string
  ): IEdgeMatchClause<T>;

  /**
   * Implementation of the match method for analytics
   */
  match(
    labelOrSourceAlias: any,
    aliasOrEdgeLabel: string,
    targetAlias?: string,
    edgeAlias?: string
  ): any {
    // If targetAlias is provided, this is an edge match
    if (targetAlias !== undefined) {
      return super.match(labelOrSourceAlias, aliasOrEdgeLabel, targetAlias, edgeAlias);
    }

    // This is a vertex match - create analytics match clause
    const label = labelOrSourceAlias;
    const alias = aliasOrEdgeLabel;

    // Create a vertex pattern
    const vertexPattern: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: label as string,
      alias,
      properties: {},
      toCypher: () => `(${alias}:${String(label)})`
    };

    // Create a match part
    const matchPart = new MatchPart([vertexPattern]);

    // Add the match part to query parts
    (this as any).queryParts.push(matchPart);

    // Return analytics match clause
    return new AnalyticsMatchClause<T, any>(this, matchPart, vertexPattern);
  }

  /**
   * Group results by specified fields
   *
   * @param fields - Fields to group by
   * @returns This analytics query builder
   * @throws Error if no RETURN clause is specified before groupBy
   */
  groupBy(...fields: string[]): this {
    // Find the most recent RETURN part
    const returnPart = this.findReturnPart();

    if (returnPart) {
      returnPart.addGroupBy(fields);
    } else {
      throw new Error('RETURN clause must be specified before GROUP BY');
    }

    return this;
  }

  /**
   * Add a window function to the query
   *
   * @param functionType - Window function type
   * @param resultAlias - Alias for the window function result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  windowFunction(
    functionType: WindowFunctionType | string,
    resultAlias: string,
    options: WindowFunctionOptions = {}
  ): this {
    // Build the window function expression
    let expression = `${functionType}(`;

    // Add arguments if provided
    if (options.args && options.args.length > 0) {
      expression += options.args.join(', ');
    }

    expression += ') OVER (';

    // Add PARTITION BY clause if provided
    if (options.partitionBy && options.partitionBy.length > 0) {
      expression += `PARTITION BY ${options.partitionBy.join(', ')} `;
    }

    // Add ORDER BY clause if provided
    if (options.orderBy && options.orderBy.length > 0) {
      const orderByExpressions = options.orderBy.map(item => {
        const direction = item.direction || 'ASC';
        return `${item.expression} ${direction}`;
      });

      expression += `ORDER BY ${orderByExpressions.join(', ')} `;
    }

    // Add frame specification if provided
    if (options.frame) {
      expression += `${options.frame.type} BETWEEN `;

      // Start bound
      if (typeof options.frame.start === 'number') {
        expression += `${options.frame.start} PRECEDING `;
      } else {
        expression += `${options.frame.start} `;
      }

      expression += 'AND ';

      // End bound
      if (typeof options.frame.end === 'number') {
        expression += `${options.frame.end} FOLLOWING`;
      } else {
        expression += options.frame.end;
      }
    }

    expression += `)`;

    // Add the window function to the RETURN clause
    this.return(`${expression} AS ${resultAlias}`);

    return this;
  }

  /**
   * Add ROW_NUMBER window function
   *
   * @param resultAlias - Alias for the result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  rowNumber(resultAlias: string, options: WindowFunctionOptions = {}): this {
    return this.windowFunction(WindowFunctionType.ROW_NUMBER, resultAlias, options);
  }

  /**
   * Add RANK window function
   *
   * @param resultAlias - Alias for the result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  rank(resultAlias: string, options: WindowFunctionOptions = {}): this {
    return this.windowFunction(WindowFunctionType.RANK, resultAlias, options);
  }

  /**
   * Add DENSE_RANK window function
   *
   * @param resultAlias - Alias for the result
   * @param options - Window function options
   * @returns This analytics query builder
   */
  denseRank(resultAlias: string, options: WindowFunctionOptions = {}): this {
    return this.windowFunction(WindowFunctionType.DENSE_RANK, resultAlias, options);
  }

  /**
   * Find the most recent RETURN part in the query
   *
   * @returns The most recent RETURN part, or undefined if none exists
   */
  private findReturnPart(): ReturnPart | undefined {
    // Get access to queryParts (which is private in the parent class)
    const queryParts = (this as any).queryParts as QueryPart[];

    // Find the most recent RETURN part
    for (let i = queryParts.length - 1; i >= 0; i--) {
      if (queryParts[i].type === QueryPartType.RETURN) {
        return queryParts[i] as ReturnPart;
      }
    }

    return undefined;
  }
}
