/**
 * Schema loader function generation for the ageSchemaClient library
 * 
 * This file implements the PostgreSQL function generation functionality
 * for the SchemaLoader class.
 * 
 * @packageDocumentation
 */

import { SchemaDefinition, VertexLabel, EdgeLabel } from './types';

/**
 * Generate SQL for creating a PostgreSQL function to convert vertex data to ag_catalog.agtype
 * 
 * @param functionName - Function name
 * @param tableName - Temporary table name
 * @param vertexType - Vertex type
 * @param vertexLabel - Vertex label definition
 * @returns SQL statement
 */
export function generateVertexConversionFunctionSQL(
  functionName: string,
  tableName: string,
  vertexType: string,
  vertexLabel: VertexLabel
): string {
  // Build the property mapping for the jsonb_build_object function
  const propertyMapping = Object.entries(vertexLabel.properties || {})
    .map(([propName, propDef]) => {
      const propType = propDef.type?.toLowerCase();
      
      // Handle different property types
      if (propType === 'integer' || propType === 'number') {
        return `'${propName}', (elem->>'${propName}')::numeric`;
      } else if (propType === 'boolean') {
        return `'${propName}', (elem->>'${propName}')::boolean`;
      } else if (propType === 'date') {
        return `'${propName}', (elem->>'${propName}')::text`;
      } else if (propType === 'array') {
        return `'${propName}', elem->'${propName}'`;
      } else {
        // Default to string
        return `'${propName}', elem->>'${propName}'`;
      }
    })
    .join(',\n          ');

  return `
    CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS ag_catalog.agtype AS $$
    DECLARE
      result_array ag_catalog.agtype;
    BEGIN
      SELECT jsonb_agg(jsonb_build_object(
          ${propertyMapping}
      ))::text::ag_catalog.agtype
      INTO result_array
      FROM (
        SELECT jsonb_array_elements(data_value) as elem
        FROM ${tableName}
        WHERE data_type = 'vertex' AND data_key = '${vertexType}'
      ) sub;

      RETURN result_array;
    END;
    $$ LANGUAGE plpgsql;
  `;
}

/**
 * Generate SQL for creating a PostgreSQL function to convert edge data to ag_catalog.agtype
 * 
 * @param functionName - Function name
 * @param tableName - Temporary table name
 * @param edgeType - Edge type
 * @param edgeLabel - Edge label definition
 * @returns SQL statement
 */
export function generateEdgeConversionFunctionSQL(
  functionName: string,
  tableName: string,
  edgeType: string,
  edgeLabel: EdgeLabel
): string {
  // Build the property mapping for the jsonb_build_object function
  const propertyMapping = [
    // Always include from and to properties
    `'from', (elem->>'from')`,
    `'to', (elem->>'to')`
  ];

  // Add additional properties from the edge label
  if (edgeLabel.properties) {
    Object.entries(edgeLabel.properties).forEach(([propName, propDef]) => {
      const propType = propDef.type?.toLowerCase();
      
      // Handle different property types
      if (propType === 'integer' || propType === 'number') {
        propertyMapping.push(`'${propName}', (elem->>'${propName}')::numeric`);
      } else if (propType === 'boolean') {
        propertyMapping.push(`'${propName}', (elem->>'${propName}')::boolean`);
      } else if (propType === 'date') {
        propertyMapping.push(`'${propName}', (elem->>'${propName}')::text`);
      } else if (propType === 'array') {
        propertyMapping.push(`'${propName}', elem->'${propName}'`);
      } else {
        // Default to string
        propertyMapping.push(`'${propName}', elem->>'${propName}'`);
      }
    });
  }

  return `
    CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS ag_catalog.agtype AS $$
    DECLARE
      result_array ag_catalog.agtype;
    BEGIN
      SELECT jsonb_agg(jsonb_build_object(
          ${propertyMapping.join(',\n          ')}
      ))::text::ag_catalog.agtype
      INTO result_array
      FROM (
        SELECT jsonb_array_elements(data_value) as elem
        FROM ${tableName}
        WHERE data_type = 'edge' AND data_key = '${edgeType}'
      ) sub;

      RETURN result_array;
    END;
    $$ LANGUAGE plpgsql;
  `;
}

/**
 * Generate SQL for creating a Cypher query to create vertices
 * 
 * @param graphName - Graph name
 * @param vertexType - Vertex type
 * @param functionName - Function name
 * @param vertexLabel - Vertex label definition
 * @returns Cypher query
 */
export function generateCreateVerticesCypher(
  graphName: string,
  vertexType: string,
  functionName: string,
  vertexLabel: VertexLabel
): string {
  // Build the property mapping for the CREATE clause
  const propertyMapping = Object.entries(vertexLabel.properties || {})
    .map(([propName, propDef]) => {
      return `${propName}: vertex.${propName}`;
    })
    .join(',\n        ');

  return `
    UNWIND ${functionName}() AS vertex
    CREATE (v:${vertexType} {
        ${propertyMapping}
    })
    RETURN count(v) AS created_vertices
  `;
}

/**
 * Generate SQL for creating a Cypher query to create edges
 * 
 * @param graphName - Graph name
 * @param edgeType - Edge type
 * @param functionName - Function name
 * @param edgeLabel - Edge label definition
 * @param fromVertexType - From vertex type
 * @param toVertexType - To vertex type
 * @returns Cypher query
 */
export function generateCreateEdgesCypher(
  graphName: string,
  edgeType: string,
  functionName: string,
  edgeLabel: EdgeLabel,
  fromVertexType: string,
  toVertexType: string
): string {
  // Build the property mapping for the CREATE clause
  const propertyMapping = Object.entries(edgeLabel.properties || {})
    .map(([propName, propDef]) => {
      return `${propName}: edge.${propName}`;
    })
    .join(',\n        ');

  return `
    UNWIND ${functionName}() AS edge
    MATCH (from:${fromVertexType} {id: edge.from}), (to:${toVertexType} {id: edge.to})
    CREATE (from)-[r:${edgeType} {
        ${propertyMapping}
    }]->(to)
    RETURN count(r) AS created_edges
  `;
}
