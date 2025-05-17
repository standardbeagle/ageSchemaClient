/**
 * Apache AGE Type Utilities
 *
 * This file provides utility functions for converting between JavaScript values
 * and Apache AGE compatible values. It ensures that:
 * 1. JavaScript values are properly converted to AGE-compatible values
 * 2. AGE values are properly converted to JavaScript values
 * 3. Arrays are properly formatted for use with UNWIND
 * 4. Type conversions are handled consistently throughout the codebase
 */

import { QueryExecutor } from '../db/query';

/**
 * Convert a JavaScript value to an AGE-compatible value
 *
 * @param value - JavaScript value to convert
 * @returns AGE-compatible value
 */
export function toAgType(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(toAgType);
  }

  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }

    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = toAgType(val);
    }
    return result;
  }

  // Handle primitive types
  return value;
}

/**
 * Convert an AGE value to a JavaScript value
 *
 * @param value - AGE value to convert
 * @returns JavaScript value
 */
export function fromAgType(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle AGE's string representation
  if (typeof value === 'string') {
    // Handle date strings
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
      return new Date(value);
    }

    // Handle AGE's JSON string representation
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Try parsing as a JSON string with the braces
        try {
          return JSON.parse(value);
        } catch (e2) {
          return value;
        }
      }
    }

    // Handle double-quoted strings (e.g., "\"David Anderson\"")
    if (value.startsWith('"\\') && value.endsWith('\\"')) {
      return value.substring(2, value.length - 2);
    }

    // Handle regular quoted strings (e.g., "David Anderson")
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.substring(1, value.length - 1);
    }
  }

  if (Array.isArray(value)) {
    return value.map(fromAgType);
  }

  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      // Special handling for string values that might be JSON
      if (typeof val === 'string' &&
          ((val.startsWith('{') && val.endsWith('}')) ||
           (val.startsWith('[') && val.endsWith(']')))) {
        try {
          result[key] = JSON.parse(val);
        } catch (e) {
          result[key] = fromAgType(val);
        }
      } else {
        result[key] = fromAgType(val);
      }
    }
    return result;
  }

  // Handle primitive types
  return value;
}

/**
 * Format an array for use with UNWIND in AGE
 *
 * @param array - Array to format
 * @param itemName - Name for each item in the array
 * @returns Formatted UNWIND expression
 */
export function formatArrayForUnwind(array: any[], itemName: string): string {
  const agTypeArray = toAgType(array);
  return `[${agTypeArray.map(item => JSON.stringify(item)).join(', ')}] AS ${itemName}`;
}

/**
 * Create a PostgreSQL function that returns an AGE-compatible array
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param functionName - Function name
 * @param array - Array to return from the function
 * @param options - Query options
 * @returns Promise that resolves when the function is created
 */
export async function createArrayFunction(
  queryExecutor: QueryExecutor,
  schemaName: string,
  functionName: string,
  array: any[],
  options?: { transaction?: any }
): Promise<void> {
  const agTypeArray = toAgType(array);
  const arrayJson = JSON.stringify(agTypeArray);

  await queryExecutor.executeSQL(`
    CREATE OR REPLACE FUNCTION ${schemaName}.${functionName}()
    RETURNS ag_catalog.agtype AS $$
    SELECT '${arrayJson}'::text::ag_catalog.agtype;
    $$ LANGUAGE SQL IMMUTABLE;
  `, [], options);
}

/**
 * Create a PostgreSQL function that returns an AGE-compatible object
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param functionName - Function name
 * @param object - Object to return from the function
 * @param options - Query options
 * @returns Promise that resolves when the function is created
 */
export async function createObjectFunction(
  queryExecutor: QueryExecutor,
  schemaName: string,
  functionName: string,
  object: Record<string, any>,
  options?: { transaction?: any }
): Promise<void> {
  const agTypeObject = toAgType(object);
  const objectJson = JSON.stringify(agTypeObject);

  await queryExecutor.executeSQL(`
    CREATE OR REPLACE FUNCTION ${schemaName}.${functionName}()
    RETURNS ag_catalog.agtype AS $$
    SELECT '${objectJson}'::text::ag_catalog.agtype;
    $$ LANGUAGE SQL IMMUTABLE;
  `, [], options);
}

/**
 * Create a temporary table with parameters for use in Cypher queries
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param tableName - Temporary table name
 * @param params - Parameters to store in the table
 * @param options - Query options
 * @returns Promise that resolves when the table is created
 */
export async function createTempTableWithParams(
  queryExecutor: QueryExecutor,
  schemaName: string,
  tableName: string,
  params: Record<string, any>,
  options?: { transaction?: any }
): Promise<void> {
  // Create column definitions
  const columns = Object.entries(params)
    .map(([key, value]) => {
      const type = typeof value === 'number' ? 'numeric' :
                  typeof value === 'boolean' ? 'boolean' :
                  Array.isArray(value) ? 'jsonb' :
                  typeof value === 'object' && value instanceof Date ? 'timestamp with time zone' :
                  typeof value === 'object' ? 'jsonb' :
                  'text';
      return `${key} ${type}`;
    })
    .join(', ');

  // Create values
  const keys = Object.keys(params).join(', ');
  const values = Object.values(params)
    .map(value => {
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      } else if (value instanceof Date) {
        return `'${value.toISOString()}'::timestamp with time zone`;
      } else if (Array.isArray(value) || typeof value === 'object') {
        return `'${JSON.stringify(value)}'::jsonb`;
      } else {
        return value;
      }
    })
    .join(', ');

  // Create the temporary table
  await queryExecutor.executeSQL(`
    DROP TABLE IF EXISTS ${schemaName}.${tableName};
    CREATE TABLE ${schemaName}.${tableName} (${columns});
    INSERT INTO ${schemaName}.${tableName} (${keys}) VALUES (${values});
  `, [], options);
}

/**
 * Create a function that returns parameters from a temporary table as an AGE-compatible array
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param functionName - Function name
 * @param tableName - Temporary table name
 * @param options - Query options
 * @returns Promise that resolves when the function is created
 */
export async function createParamFunctionFromTable(
  queryExecutor: QueryExecutor,
  schemaName: string,
  functionName: string,
  tableName: string,
  options?: { transaction?: any }
): Promise<void> {
  await queryExecutor.executeSQL(`
    CREATE OR REPLACE FUNCTION ${schemaName}.${functionName}()
    RETURNS ag_catalog.agtype AS $$
    DECLARE
      result_array ag_catalog.agtype;
    BEGIN
      SELECT jsonb_agg(row_to_json(t)::jsonb)::text::ag_catalog.agtype
      INTO result_array
      FROM ${schemaName}.${tableName} t;

      RETURN result_array;
    END;
    $$ LANGUAGE plpgsql;
  `, [], options);
}

/**
 * Execute a Cypher query with parameters using the temp table approach
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param graphName - Graph name
 * @param cypher - Cypher query (should use UNWIND)
 * @param params - Parameters to pass to the query
 * @param options - Query options
 * @returns Query result
 */
export async function executeCypherWithParams(
  queryExecutor: QueryExecutor,
  schemaName: string,
  graphName: string,
  cypher: string,
  params: Record<string, any>,
  options?: { transaction?: any }
): Promise<any> {
  // Generate unique names for the temp table and function
  const timestamp = Date.now();
  const tableName = `temp_params_${timestamp}`;
  const functionName = `get_params_${timestamp}`;

  // Create the temp table with parameters
  await createTempTableWithParams(queryExecutor, schemaName, tableName, params, options);

  // Create the function to return parameters as agtype
  await createParamFunctionFromTable(queryExecutor, schemaName, functionName, tableName, options);

  try {
    // Execute the Cypher query
    return await queryExecutor.executeCypher(cypher, {}, graphName, options);
  } finally {
    // Clean up the temp table and function
    await queryExecutor.executeSQL(`
      DROP TABLE IF EXISTS ${schemaName}.${tableName};
      DROP FUNCTION IF EXISTS ${schemaName}.${functionName}();
    `, [], options);
  }
}
