/**
 * Database connectivity module for the ageSchemaClient library
 *
 * @packageDocumentation
 */

// Initialize database module
import './init';

// Export database types
export * from './types';

// Export connection manager
export * from './connector';

// Export extension initializers
export * from './extensions';

// Export schema client connection manager
export * from './schema-client-connection-manager';

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

// Export utility functions
export * from './utils';

// Version information
export const dbVersion = '0.1.0';
