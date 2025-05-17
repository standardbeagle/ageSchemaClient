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
   * Add MATCH clause
   */
  match<L extends keyof T['vertices']>(label: L, alias: string): IMatchClause<T, L>;

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
  L extends keyof T['vertices']
> {
  /**
   * Add property constraint
   */
  where(property: keyof T['vertices'][L]['properties'], operator: string, value: any): this;

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
