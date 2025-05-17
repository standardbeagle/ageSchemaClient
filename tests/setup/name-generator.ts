/**
 * Name Generator for ageSchemaClient
 *
 * This file provides utility functions for generating unique names
 * for database objects like schemas, graphs, tables, etc.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a unique name with a prefix
 * The name will include a timestamp and random component
 * 
 * @param prefix - Prefix for the name
 * @returns Unique name
 */
export function generateUniqueName(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(3).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a unique schema name
 * 
 * @param prefix - Optional prefix (default: 'test')
 * @returns Unique schema name
 */
export function generateSchemaName(prefix: string = 'test'): string {
  return generateUniqueName(prefix);
}

/**
 * Generate a unique graph name
 * 
 * @param prefix - Optional prefix (default: 'test_graph')
 * @returns Unique graph name
 */
export function generateGraphName(prefix: string = 'test_graph'): string {
  return generateUniqueName(prefix);
}

/**
 * Generate a unique table name
 * 
 * @param prefix - Optional prefix (default: 'test_table')
 * @returns Unique table name
 */
export function generateTableName(prefix: string = 'test_table'): string {
  return generateUniqueName(prefix);
}

/**
 * Generate a unique function name
 * 
 * @param prefix - Optional prefix (default: 'test_func')
 * @returns Unique function name
 */
export function generateFunctionName(prefix: string = 'test_func'): string {
  return generateUniqueName(prefix);
}

/**
 * Generate a unique temporary table name
 * 
 * @param prefix - Optional prefix (default: 'temp')
 * @returns Unique temporary table name
 */
export function generateTempTableName(prefix: string = 'temp'): string {
  return generateUniqueName(prefix);
}
