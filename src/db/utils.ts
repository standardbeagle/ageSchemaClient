/**
 * Database utilities
 *
 * This file contains utility functions for working with the database,
 * particularly for parameter passing in Cypher queries.
 *
 * @packageDocumentation
 */

import { QueryExecutor } from './query';

/**
 * Create a PostgreSQL function that returns an agtype array for use with UNWIND
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param functionName - Function name
 * @param data - Data to return from the function
 * @returns Query result
 */
export async function createAgtypeArrayFunction(
  queryExecutor: QueryExecutor,
  schemaName: string,
  functionName: string,
  data: any[]
): Promise<any> {
  // Convert the data to a JSON string
  const jsonData = JSON.stringify(data);

  // Create a function that returns the data as an agtype array
  const sql = `
    CREATE OR REPLACE FUNCTION ${schemaName}.${functionName}()
    RETURNS ag_catalog.agtype AS $$
    BEGIN
      RETURN '${jsonData}'::text::ag_catalog.agtype;
    END;
    $$ LANGUAGE plpgsql;
  `;

  return queryExecutor.executeSQL(sql);
}

/**
 * Create a PostgreSQL function that returns a single agtype object for use with WITH
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param functionName - Function name
 * @param data - Data to return from the function
 * @returns Query result
 */
export async function createAgtypeObjectFunction(
  queryExecutor: QueryExecutor,
  schemaName: string,
  functionName: string,
  data: Record<string, any>
): Promise<any> {
  // Convert the data to a JSON string
  const jsonData = JSON.stringify(data);

  // Create a function that returns the data as an agtype object
  const sql = `
    CREATE OR REPLACE FUNCTION ${schemaName}.${functionName}()
    RETURNS ag_catalog.agtype AS $$
    BEGIN
      RETURN '${jsonData}'::text::ag_catalog.agtype;
    END;
    $$ LANGUAGE plpgsql;
  `;

  return queryExecutor.executeSQL(sql);
}

/**
 * Create a temporary table with parameters for use in Cypher queries
 *
 * @param queryExecutor - Query executor
 * @param tableName - Temporary table name
 * @param params - Parameters to store in the table
 * @returns Query result
 */
export async function createTempTableWithParams(
  queryExecutor: QueryExecutor,
  tableName: string,
  params: Record<string, any>
): Promise<any> {
  // Create column definitions
  const columns = Object.entries(params)
    .map(([key, value]) => {
      const type = typeof value === 'number' ? 'numeric' :
                  typeof value === 'boolean' ? 'boolean' :
                  Array.isArray(value) ? 'jsonb' :
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
      } else if (Array.isArray(value) || typeof value === 'object') {
        return `'${JSON.stringify(value)}'::jsonb`;
      } else {
        return value;
      }
    })
    .join(', ');

  // Create the temporary table
  await queryExecutor.executeSQL(`
    DROP TABLE IF EXISTS ${tableName};
    CREATE TEMP TABLE ${tableName} (${columns});
    INSERT INTO ${tableName} (${keys}) VALUES (${values});
  `);

  return queryExecutor.executeSQL(`SELECT * FROM ${tableName} LIMIT 1`);
}

/**
 * Execute a Cypher query with parameters using the UNWIND approach
 *
 * @param queryExecutor - Query executor
 * @param schemaName - Schema name
 * @param graphName - Graph name
 * @param cypher - Cypher query (should use UNWIND)
 * @param functionName - Function name to use
 * @param params - Parameters to pass to the query
 * @returns Query result
 */
export async function executeCypherWithUnwind(
  queryExecutor: QueryExecutor,
  schemaName: string,
  graphName: string,
  cypher: string,
  functionName: string,
  params: any
): Promise<any> {
  // Create the function
  if (Array.isArray(params)) {
    await createAgtypeArrayFunction(queryExecutor, schemaName, functionName, params);
  } else {
    await createAgtypeObjectFunction(queryExecutor, schemaName, functionName, params);
  }

  // Execute the Cypher query
  return queryExecutor.executeCypher(cypher, {}, graphName);
}
