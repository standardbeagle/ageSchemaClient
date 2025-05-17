/**
 * ageSchemaClient - A TypeScript library for Apache AGE graph databases with schema validation
 *
 * This library provides a type-safe client for working with Apache AGE graph databases.
 * It allows developers to define graph schemas and use them to validate and optimize database operations.
 *
 * @packageDocumentation
 */

// Core exports
export * from './core';

// Schema exports
export * from './schema';

// SQL exports
export * from './sql';

// Database exports
export {
  // Re-export specific types from db to avoid conflicts
  PgConnectionManager,
  QueryExecutor,
  VertexOperations,
  EdgeOperations,
  BatchOperations,
  TransactionManager,
  // Types
  DatabaseError,
} from './db';

// Type exports
export type {
  Connection,
  QueryOptions,
  QueryResult,
} from './db';

// Query exports
export * from './query';

// Loader exports
export {
  SchemaLoader,
  CypherQueryGenerator,
  SchemaLoaderError,
  SchemaLoaderDatabaseError,
  SchemaLoaderTransactionError,
  TempResourceError,
  loaderVersion
} from './loader';
