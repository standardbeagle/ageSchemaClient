/**
 * Database connectivity module for the ageSchemaClient library
 *
 * @packageDocumentation
 */

// Export database types
export * from './types';

// Export connection manager
export * from './connector';

// Export transaction manager
export * from './transaction';

// Export query executor
export * from './query';

// Export vertex operations
export * from './vertex';

// Export edge operations
export * from './edge';

// Export batch operations
export * from './batch';

// Version information
export const dbVersion = '0.1.0';
