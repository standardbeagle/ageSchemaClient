/**
 * SQL generation type definitions
 *
 * @packageDocumentation
 */

/**
 * SQL statement type
 */
export enum SQLStatementType {
  CREATE = 'CREATE',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SELECT = 'SELECT',
  DROP = 'DROP',
  ALTER = 'ALTER',
  TRANSACTION = 'TRANSACTION',
}

/**
 * SQL parameter type
 */
export type SQLParameter = string | number | boolean | Date | null | undefined;

/**
 * SQL parameter array
 */
export type SQLParameters = SQLParameter[];

/**
 * SQL generation result
 */
export interface SQLResult {
  /**
   * SQL statement
   */
  sql: string;

  /**
   * SQL parameters
   */
  params: SQLParameters;
}

/**
 * SQL transaction type
 */
export enum SQLTransactionType {
  BEGIN = 'BEGIN',
  COMMIT = 'COMMIT',
  ROLLBACK = 'ROLLBACK',
  SAVEPOINT = 'SAVEPOINT',
  RELEASE = 'RELEASE',
}

/**
 * SQL filter operator
 */
export enum SQLFilterOperator {
  EQUALS = '=',
  NOT_EQUALS = '<>',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUALS = '>=',
  LESS_THAN_OR_EQUALS = '<=',
  LIKE = 'LIKE',
  ILIKE = 'ILIKE',
  NOT_LIKE = 'NOT LIKE',
  IN = 'IN',
  NOT_IN = 'NOT IN',
  IS_NULL = 'IS NULL',
  IS_NOT_NULL = 'IS NOT NULL',
}

/**
 * SQL filter condition
 */
export interface SQLFilterCondition {
  /**
   * Property name
   */
  property: string;

  /**
   * Filter operator
   */
  operator: SQLFilterOperator;

  /**
   * Filter value
   */
  value?: SQLParameter | SQLParameter[];
}

/**
 * SQL order direction
 */
export enum SQLOrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * SQL order by clause
 */
export interface SQLOrderBy {
  /**
   * Property name
   */
  property: string;

  /**
   * Order direction
   */
  direction: SQLOrderDirection;
}

/**
 * SQL query options
 */
export interface SQLQueryOptions {
  /**
   * Filter conditions
   */
  filters?: SQLFilterCondition[];

  /**
   * Order by clauses
   */
  orderBy?: SQLOrderBy[];

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
 * SQL vertex table options
 */
export interface SQLVertexTableOptions {
  /**
   * Table name prefix
   */
  tablePrefix?: string;

  /**
   * Include metadata columns
   */
  includeMetadata?: boolean;

  /**
   * Primary key column name
   */
  primaryKeyColumn?: string;
}

/**
 * SQL edge table options
 */
export interface SQLEdgeTableOptions extends SQLVertexTableOptions {
  /**
   * Source vertex ID column name
   */
  sourceIdColumn?: string;

  /**
   * Target vertex ID column name
   */
  targetIdColumn?: string;
}
