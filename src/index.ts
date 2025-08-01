/**
 * ageSchemaClient - A TypeScript library for Apache AGE graph databases with schema validation
 *
 * This library provides individual components for working with Apache AGE graph databases:
 * - Connection Pool Management (PgConnectionManager)
 * - Query Building (QueryBuilder, PathQueryBuilder, etc.)
 * - SQL Generation (SQLGenerator)
 * - Schema Loading and Validation (SchemaLoader)
 * - Batch Operations (SchemaLoader for bulk loading)
 *
 * @packageDocumentation
 */

// Core types and errors
export * from './core';

// Connection Pool Management
export {
  PgConnectionManager,
  QueryExecutor,
  VertexOperations,
  EdgeOperations,
  BatchOperations,
  TransactionManager,
} from './db';

// Connection types
export type {
  Connection,
  ConnectionConfig,
  QueryOptions,
  QueryResult,
  DatabaseError,
} from './db';

// Query Building
export {
  QueryBuilder,
  PathQueryBuilder,
  AnalyticsQueryBuilder,
  AlgorithmQueryBuilder,
} from './query';

// Query types
export type {
  IQueryBuilder,
  QueryBuilderResult,
  OrderDirection,
} from './query';

// SQL Generation
export {
  SQLGenerator,
} from './sql';

// Schema Management
export * from './schema';

// Batch Loading
export {
  SchemaLoader,
  CypherQueryGenerator,
  SchemaLoaderError,
  SchemaLoaderDatabaseError,
  SchemaLoaderTransactionError,
  TempResourceError,
  loaderVersion
} from './loader';
