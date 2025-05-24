/**
 * SQL generation module for the ageSchemaClient library
 *
 * @packageDocumentation
 */

// Initialize SQL module
import './init';

// Export SQL types from db/types
export type {
  SQLResult,
  SQLParameters,
  SQLQueryOptions,
  SQLFilterCondition,
  SQLOrderBy,
  SQLVertexTableOptions,
  SQLEdgeTableOptions
} from '../db/types';

export {
  SQLOrderDirection,
  SQLFilterOperator,
  SQLTransactionType,
  SQLStatementType
} from '../db/types';

// Export SQL utilities
export * from './utils';

// Export SQL generator
export * from './generator';

// Export batch operations extensions
export * from './batch';

// Export migration extensions
export * from './migration';

// Version information
export const sqlVersion = '0.1.0';
