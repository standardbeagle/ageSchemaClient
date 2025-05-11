/**
 * SQL generation utilities
 * 
 * @packageDocumentation
 */

import { PropertyType } from '../schema/types';
import { SQLParameter, SQLParameters } from './types';

/**
 * Escape a SQL string value
 * 
 * @param value - String value to escape
 * @returns Escaped string value
 */
export function escapeSQLString(value: string): string {
  // Replace single quotes with two single quotes
  return value.replace(/'/g, "''");
}

/**
 * Quote a SQL identifier (table name, column name, etc.)
 * 
 * @param identifier - SQL identifier to quote
 * @returns Quoted identifier
 */
export function quoteIdentifier(identifier: string): string {
  // Use double quotes for SQL identifiers
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Format a SQL value based on its type
 * 
 * @param value - Value to format
 * @returns Formatted value
 */
export function formatSQLValue(value: SQLParameter): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'string') {
    return `'${escapeSQLString(value)}'`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  return String(value);
}

/**
 * Convert a JavaScript value to a PostgreSQL value based on property type
 * 
 * @param value - Value to convert
 * @param type - Property type
 * @returns Converted value
 */
export function convertToPostgresValue(value: any, type: PropertyType): SQLParameter {
  if (value === null || value === undefined) {
    return null;
  }
  
  switch (type) {
    case PropertyType.STRING:
      return String(value);
    
    case PropertyType.NUMBER:
    case PropertyType.INTEGER:
      return Number(value);
    
    case PropertyType.BOOLEAN:
      return Boolean(value);
    
    case PropertyType.DATE:
    case PropertyType.DATETIME:
      return value instanceof Date ? value : new Date(value);
    
    case PropertyType.OBJECT:
    case PropertyType.ARRAY:
      return JSON.stringify(value);
    
    case PropertyType.ANY:
    default:
      return value;
  }
}

/**
 * Get PostgreSQL data type for a property type
 * 
 * @param type - Property type
 * @returns PostgreSQL data type
 */
export function getPostgresDataType(type: PropertyType): string {
  switch (type) {
    case PropertyType.STRING:
      return 'TEXT';
    
    case PropertyType.NUMBER:
      return 'DOUBLE PRECISION';
    
    case PropertyType.INTEGER:
      return 'INTEGER';
    
    case PropertyType.BOOLEAN:
      return 'BOOLEAN';
    
    case PropertyType.DATE:
      return 'DATE';
    
    case PropertyType.DATETIME:
      return 'TIMESTAMP WITH TIME ZONE';
    
    case PropertyType.OBJECT:
    case PropertyType.ARRAY:
      return 'JSONB';
    
    case PropertyType.ANY:
    default:
      return 'TEXT';
  }
}

/**
 * Generate a parameterized SQL statement with placeholders
 * 
 * @param sql - SQL statement with $1, $2, etc. placeholders
 * @param params - Parameters to bind
 * @returns SQL statement with parameters
 */
export function parameterize(sql: string, params: SQLParameters): string {
  return sql.replace(/\$(\d+)/g, (_, index) => {
    const paramIndex = parseInt(index, 10) - 1;
    if (paramIndex >= 0 && paramIndex < params.length) {
      return formatSQLValue(params[paramIndex]);
    }
    return 'NULL';
  });
}

/**
 * Generate a table name for a vertex label
 * 
 * @param label - Vertex label
 * @param prefix - Optional table prefix
 * @returns Table name
 */
export function getVertexTableName(label: string, prefix: string = 'v_'): string {
  return quoteIdentifier(`${prefix}${label}`);
}

/**
 * Generate a table name for an edge label
 * 
 * @param label - Edge label
 * @param prefix - Optional table prefix
 * @returns Table name
 */
export function getEdgeTableName(label: string, prefix: string = 'e_'): string {
  return quoteIdentifier(`${prefix}${label}`);
}

/**
 * Generate a temporary table name
 * 
 * @param baseName - Base table name
 * @returns Temporary table name
 */
export function getTempTableName(baseName: string): string {
  return quoteIdentifier(`temp_${baseName}_${Date.now()}`);
}
