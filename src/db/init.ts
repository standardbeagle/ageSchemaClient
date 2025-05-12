/**
 * Database initialization module for the ageSchemaClient library
 *
 * @packageDocumentation
 */

import { SQLGenerator } from '../sql/generator';
import { extendSQLGeneratorWithBatchOperations } from '../sql/batch';

/**
 * Initialize the database module
 * 
 * This function extends the SQLGenerator with batch operations
 */
export function initializeDatabase(): void {
  // Extend SQLGenerator with batch operations
  extendSQLGeneratorWithBatchOperations(SQLGenerator);
}

// Initialize the database module when this file is imported
initializeDatabase();
