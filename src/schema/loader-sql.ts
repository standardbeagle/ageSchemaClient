/**
 * Schema loader SQL generation for the ageSchemaClient library
 * 
 * This file implements the SQL generation functionality for the SchemaLoader class.
 * 
 * @packageDocumentation
 */

import { SchemaDefinition } from './types';
import { GraphData, VertexData, EdgeData } from './loader-types';

/**
 * Generate SQL for creating a temporary table to store graph data
 * 
 * @returns SQL statement
 */
export function generateTempTableSQL(tableName: string): string {
  return `
    DROP TABLE IF EXISTS ${tableName};
    CREATE TEMPORARY TABLE ${tableName} (
      id SERIAL PRIMARY KEY,
      data_type TEXT NOT NULL,
      data_key TEXT NOT NULL,
      data_value JSONB NOT NULL
    )
  `;
}

/**
 * Generate SQL for inserting vertex data into the temporary table
 * 
 * @param tableName - Temporary table name
 * @param vertexType - Vertex type
 * @param vertexData - Vertex data
 * @returns SQL statement and parameters
 */
export function generateVertexInsertSQL(
  tableName: string,
  vertexType: string,
  vertexData: any[]
): { sql: string; params: any[] } {
  return {
    sql: `
      INSERT INTO ${tableName} (data_type, data_key, data_value)
      VALUES ($1, $2, $3)
    `,
    params: ['vertex', vertexType, JSON.stringify(vertexData)]
  };
}

/**
 * Generate SQL for inserting edge data into the temporary table
 * 
 * @param tableName - Temporary table name
 * @param edgeType - Edge type
 * @param edgeData - Edge data
 * @returns SQL statement and parameters
 */
export function generateEdgeInsertSQL(
  tableName: string,
  edgeType: string,
  edgeData: any[]
): { sql: string; params: any[] } {
  return {
    sql: `
      INSERT INTO ${tableName} (data_type, data_key, data_value)
      VALUES ($1, $2, $3)
    `,
    params: ['edge', edgeType, JSON.stringify(edgeData)]
  };
}

/**
 * Generate SQL for creating a function to retrieve vertices by type
 * 
 * @param functionName - Function name
 * @param tableName - Temporary table name
 * @returns SQL statement
 */
export function generateGetVerticesFunctionSQL(
  functionName: string,
  tableName: string
): string {
  return `
    CREATE OR REPLACE FUNCTION ${functionName}(vertex_type ag_catalog.agtype)
    RETURNS ag_catalog.agtype AS $$
    DECLARE
      vertex_type_text TEXT;
      result_array ag_catalog.agtype;
    BEGIN
      -- Extract the text value from the agtype parameter
      SELECT vertex_type::text INTO vertex_type_text;
      -- Remove quotes if present
      vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

      SELECT data_value::text::ag_catalog.agtype
      INTO result_array
      FROM ${tableName}
      WHERE data_type = 'vertex' AND data_key = vertex_type_text;

      RETURN result_array;
    END;
    $$ LANGUAGE plpgsql;
  `;
}

/**
 * Generate SQL for creating a function to retrieve edges by type
 * 
 * @param functionName - Function name
 * @param tableName - Temporary table name
 * @returns SQL statement
 */
export function generateGetEdgesFunctionSQL(
  functionName: string,
  tableName: string
): string {
  return `
    CREATE OR REPLACE FUNCTION ${functionName}(edge_type ag_catalog.agtype)
    RETURNS ag_catalog.agtype AS $$
    DECLARE
      edge_type_text TEXT;
      result_array ag_catalog.agtype;
    BEGIN
      -- Extract the text value from the agtype parameter
      SELECT edge_type::text INTO edge_type_text;
      -- Remove quotes if present
      edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

      SELECT data_value::text::ag_catalog.agtype
      INTO result_array
      FROM ${tableName}
      WHERE data_type = 'edge' AND data_key = edge_type_text;

      RETURN result_array;
    END;
    $$ LANGUAGE plpgsql;
  `;
}

/**
 * Generate SQL for dropping temporary tables and functions
 * 
 * @param tableName - Temporary table name
 * @param functionNames - Function names to drop
 * @returns SQL statement
 */
export function generateCleanupSQL(
  tableName: string,
  functionNames: string[]
): string {
  const dropFunctions = functionNames
    .map(name => `DROP FUNCTION IF EXISTS ${name}(ag_catalog.agtype)`)
    .join(';\n');

  return `
    DROP TABLE IF EXISTS ${tableName};
    ${dropFunctions};
  `;
}

/**
 * Generate a unique name for a temporary table
 * 
 * @returns Temporary table name
 */
export function generateTempTableName(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `temp_graph_data_${timestamp}_${random}`;
}

/**
 * Generate a unique name for a function
 * 
 * @param prefix - Function name prefix
 * @returns Function name
 */
export function generateFunctionName(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${prefix}_${timestamp}_${random}`;
}
