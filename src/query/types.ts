/**
 * Query builder types
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryResult } from '../db/query';

/**
 * Query part type
 */
export enum QueryPartType {
  MATCH = 'MATCH',
  WHERE = 'WHERE',
  RETURN = 'RETURN',
  ORDER_BY = 'ORDER_BY',
  LIMIT = 'LIMIT',
  SKIP = 'SKIP',
  WITH = 'WITH',
  UNWIND = 'UNWIND',
  CREATE = 'CREATE',
  MERGE = 'MERGE',
  DELETE = 'DELETE',
  SET = 'SET',
  REMOVE = 'REMOVE',
}

/**
 * Base query part interface
 */
export interface QueryPart {
  /**
   * Query part type
   */
  type: QueryPartType;

  /**
   * Convert to Cypher string
   */
  toCypher(): string;

  /**
   * Get parameters used in this query part
   */
  getParameters(): Record<string, any>;
}

/**
 * Match pattern type
 */
export enum MatchPatternType {
  VERTEX = 'VERTEX',
  EDGE = 'EDGE',
  PATH = 'PATH',
}

/**
 * Match pattern interface
 */
export interface MatchPattern {
  /**
   * Pattern type
   */
  type: MatchPatternType;

  /**
   * Convert to Cypher string
   */
  toCypher(): string;
}

/**
 * Vertex pattern
 */
export interface VertexPattern extends MatchPattern {
  /**
   * Pattern type
   */
  type: MatchPatternType.VERTEX;

  /**
   * Vertex label
   */
  label: string;

  /**
   * Vertex alias
   */
  alias: string;

  /**
   * Property constraints
   */
  properties?: Record<string, any>;
}

/**
 * Edge pattern
 */
export interface EdgePattern extends MatchPattern {
  /**
   * Pattern type
   */
  type: MatchPatternType.EDGE;

  /**
   * Edge label
   */
  label: string;

  /**
   * Edge alias
   */
  alias: string;

  /**
   * Source vertex pattern
   */
  fromVertex: VertexPattern;

  /**
   * Target vertex pattern
   */
  toVertex: VertexPattern;

  /**
   * Edge direction
   */
  direction: 'OUTGOING' | 'INCOMING' | 'BIDIRECTIONAL';

  /**
   * Property constraints
   */
  properties?: Record<string, any>;
}

/**
 * Path pattern
 */
export interface PathPattern extends MatchPattern {
  /**
   * Pattern type
   */
  type: MatchPatternType.PATH;

  /**
   * Path alias
   */
  alias: string;

  /**
   * Path segments
   */
  segments: Array<VertexPattern | EdgePattern>;
}

/**
 * Order direction
 */
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Query execution options
 */
export interface QueryExecutionOptions {
  /**
   * Graph name
   */
  graphName?: string;

  /**
   * Schema name for temp tables and functions
   */
  schemaName?: string;

  /**
   * Query timeout in milliseconds
   */
  timeout?: number;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;

  /**
   * Whether to validate the query against the schema
   *
   * @default true
   */
  validate?: boolean;
}

/**
 * Query result type
 */
export type QueryBuilderResult<T> = Promise<QueryResult<T>>;

/**
 * Query builder interface
 */
export interface IQueryBuilder<T extends SchemaDefinition> {
  /**
   * Add MATCH clause for a vertex
   */
  match<L extends keyof T['vertices']>(label: L, alias: string): IMatchClause<T, L>;

  /**
   * Add MATCH clause for an edge between two previously matched vertices
   *
   * @param sourceAlias - Source vertex alias
   * @param edgeLabel - Edge label
   * @param targetAlias - Target vertex alias
   * @returns Edge match clause
   */
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string
  ): IEdgeMatchClause<T>;

  /**
   * Add MATCH clause for an edge between two previously matched vertices with an edge alias
   *
   * @param sourceAlias - Source vertex alias
   * @param edgeLabel - Edge label
   * @param targetAlias - Target vertex alias
   * @param edgeAlias - Edge alias
   * @returns Edge match clause
   */
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string,
    edgeAlias: string
  ): IEdgeMatchClause<T>;

  /**
   * Add WHERE clause
   */
  where(condition: string, params?: Record<string, any>): this;

  /**
   * Add RETURN clause
   */
  return(...expressions: string[]): this;

  /**
   * Add ORDER BY clause
   */
  orderBy(expression: string, direction?: OrderDirection): this;

  /**
   * Add LIMIT clause
   */
  limit(count: number): this;

  /**
   * Add SKIP clause
   */
  skip(count: number): this;

  /**
   * Add WITH clause
   */
  with(...expressions: string[]): this;

  /**
   * Add UNWIND clause
   */
  unwind(expression: string, alias: string): this;

  /**
   * Add a parameter to the query
   */
  withParam(name: string, value: any): this;

  /**
   * Set a parameter in the age_params temporary table
   */
  setParam(key: string, value: any): Promise<this>;

  /**
   * Add a WITH clause that calls a function to get parameters
   */
  withParamFunction(functionName: string, alias: string): this;

  /**
   * Add a WITH clause that calls the get_age_param function
   */
  withAgeParam(key: string, alias: string): this;

  /**
   * Add a WITH clause that calls the get_all_age_params function
   */
  withAllAgeParams(alias?: string): this;

  /**
   * Execute the query
   */
  execute<R = any>(options?: QueryExecutionOptions): QueryBuilderResult<R>;

  /**
   * Get the Cypher query string
   */
  toCypher(): string;

  /**
   * Get the query parameters
   */
  getParameters(): Record<string, any>;
}

/**
 * Match clause interface
 */
export interface IMatchClause<
  T extends SchemaDefinition,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  L extends keyof T['vertices']
> {
  /**
   * Add property constraints to the vertex pattern
   *
   * @param properties - Object with property-value pairs
   * @returns This match clause
   * @throws Error if any property value is null, undefined, or NaN
   */
  constraint(properties: Record<string, any>): this;

  /**
   * Add WHERE clause
   *
   * @param condition - Condition expression
   * @param params - Parameters
   * @returns This match clause
   */
  where(condition: string, params?: Record<string, any>): this;

  /**
   * Add outgoing edge
   */
  outgoing<E extends keyof T['edges']>(
    label: E,
    alias: string,
    targetLabel: keyof T['vertices'],
    targetAlias: string
  ): this;

  /**
   * Add incoming edge
   */
  incoming<E extends keyof T['edges']>(
    label: E,
    alias: string,
    sourceLabel: keyof T['vertices'],
    sourceAlias: string
  ): this;

  /**
   * Add bidirectional edge
   */
  related<E extends keyof T['edges']>(
    label: E,
    alias: string,
    otherLabel: keyof T['vertices'],
    otherAlias: string
  ): this;

  /**
   * Return to the main query builder
   */
  done(): IQueryBuilder<T>;
}

/**
 * Edge match clause interface
 */
export interface IEdgeMatchClause<T extends SchemaDefinition> {
  /**
   * Add property constraints to the edge pattern
   *
   * @param properties - Object with property-value pairs
   * @returns This edge match clause
   * @throws Error if any property value is null, undefined, or NaN
   */
  constraint(properties: Record<string, any>): this;

  /**
   * Add WHERE clause
   *
   * @param condition - Condition expression
   * @param params - Parameters
   * @returns This edge match clause
   */
  where(condition: string, params?: Record<string, any>): this;

  /**
   * Add RETURN clause
   */
  return(...expressions: string[]): this;

  /**
   * Add ORDER BY clause
   */
  orderBy(expression: string, direction?: OrderDirection): this;

  /**
   * Add LIMIT clause
   */
  limit(count: number): this;

  /**
   * Add SKIP clause
   */
  skip(count: number): this;

  /**
   * Add WITH clause
   */
  with(...expressions: string[]): this;

  /**
   * Add UNWIND clause
   */
  unwind(expression: string, alias: string): this;

  /**
   * Add a parameter to the query
   */
  withParam(name: string, value: any): this;

  /**
   * Execute the query
   */
  execute<R = any>(options?: QueryExecutionOptions): QueryBuilderResult<R>;

  /**
   * Get the Cypher query string
   */
  toCypher(): string;

  /**
   * Return to the main query builder
   */
  done(): IQueryBuilder<T>;
}

/**
 * Return clause interface
 */
export interface IReturnClause<T extends SchemaDefinition> {
  /**
   * Add GROUP BY clause
   */
  groupBy(...expressions: string[]): IQueryBuilder<T>;

  /**
   * Return to the main query builder
   */
  done(): IQueryBuilder<T>;
}
