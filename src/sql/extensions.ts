/**
 * SQL Generator extensions
 *
 * @packageDocumentation
 */

import { SQLGenerator } from './generator';
import { extendSQLGeneratorWithBatchOperations } from './batch';
import { extendSQLGeneratorWithMigrationMethods } from './migration';

/**
 * Initialize the SQL Generator extensions
 * 
 * This function extends the SQLGenerator with batch operations and migration methods
 */
export function initializeSQLExtensions(): void {
  // Extend SQLGenerator with batch operations
  extendSQLGeneratorWithBatchOperations(SQLGenerator);
  
  // Extend SQLGenerator with migration methods
  extendSQLGeneratorWithMigrationMethods(SQLGenerator);
}

// Initialize the SQL Generator extensions when this file is imported
initializeSQLExtensions();
