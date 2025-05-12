/**
 * SQL module initialization for the ageSchemaClient library
 *
 * @packageDocumentation
 */

import { SQLGenerator } from './generator';
import { extendSQLGeneratorWithBatchOperations } from './batch';
import { extendSQLGeneratorWithMigrationMethods } from './migration';

/**
 * Initialize the SQL module
 * 
 * This function extends the SQLGenerator with batch operations and migration methods
 */
export function initializeSQL(): void {
  // Extend SQLGenerator with batch operations
  extendSQLGeneratorWithBatchOperations(SQLGenerator);
  
  // Extend SQLGenerator with migration methods
  extendSQLGeneratorWithMigrationMethods(SQLGenerator);
}

// Initialize the SQL module when this file is imported
initializeSQL();
