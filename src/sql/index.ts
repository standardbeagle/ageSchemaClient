/**
 * SQL generation module for the ageSchemaClient library
 *
 * @packageDocumentation
 */

// Initialize SQL module
import './init';

// Export SQL types
export * from './types';

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
