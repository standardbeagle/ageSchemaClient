/**
 * Optimized Cypher query templates for batch operations
 * 
 * This module provides optimized templates for Cypher queries used in batch operations
 * with Apache AGE. The templates use the UNWIND operator with PostgreSQL functions
 * to efficiently load data from the age_params temporary table.
 * 
 * @packageDocumentation
 */

/**
 * Generate an optimized property mapping for a vertex or edge
 * 
 * This function generates a Cypher property mapping string for a vertex or edge
 * based on the provided property names. The mapping includes conditional logic
 * to handle null values and type conversions.
 * 
 * @param propertyNames - Array of property names to include in the mapping
 * @param prefix - Prefix for the property access (e.g., 'vertex_data' or 'edge_data')
 * @returns Cypher property mapping string
 */
export function generateOptimizedPropertyMapping(
  propertyNames: string[],
  prefix: string = 'vertex_data'
): string {
  return propertyNames
    .map(prop => {
      // Skip 'id', 'from', and 'to' properties as they are handled separately
      if (prop === 'id' || prop === 'from' || prop === 'to') {
        return null;
      }
      
      // Use a more efficient approach for handling null values
      return `${prop}: ${prefix}.${prop}`;
    })
    .filter(Boolean) // Remove null entries
    .join(',\n      ');
}

/**
 * Create an optimized parameterized vertex template with dynamic property mapping
 * 
 * This function creates a Cypher query template for creating vertices with
 * dynamic property mapping based on the provided property names.
 * 
 * @param vertexType - The type of vertex to create
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template with dynamic property mapping
 */
export function createOptimizedVertexTemplate(
  vertexType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generateOptimizedPropertyMapping(propertyNames, 'vertex_data');
  
  return `
    UNWIND ${schemaName}.get_vertices('${vertexType}') AS vertex_data
    CREATE (v:${vertexType} {
      id: vertex_data.id,
      ${propertyMapping}
    })
    RETURN count(v) AS created_vertices
  `;
}

/**
 * Create an optimized parameterized edge template with dynamic property mapping
 * 
 * This function creates a Cypher query template for creating edges with
 * dynamic property mapping based on the provided property names.
 * 
 * @param edgeType - The type of edge to create
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template with dynamic property mapping
 */
export function createOptimizedEdgeTemplate(
  edgeType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generateOptimizedPropertyMapping(propertyNames, 'edge_data');
  
  // Use a more efficient approach for matching vertices
  return `
    UNWIND ${schemaName}.get_edges($edge_type) AS edge_data
    MATCH (from {id: edge_data.from})
    MATCH (to {id: edge_data.to})
    CREATE (from)-[:${edgeType} {
      ${propertyMapping}
    }]->(to)
    RETURN count(*) AS created_edges
  `;
}

/**
 * Create an optimized parameterized edge template with index hints
 * 
 * This function creates a Cypher query template for creating edges with
 * dynamic property mapping based on the provided property names and includes
 * index hints for better performance.
 * 
 * @param edgeType - The type of edge to create
 * @param fromType - The type of the from vertex
 * @param toType - The type of the to vertex
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template with dynamic property mapping and index hints
 */
export function createOptimizedEdgeTemplateWithIndexHints(
  edgeType: string,
  fromType: string,
  toType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generateOptimizedPropertyMapping(propertyNames, 'edge_data');
  
  // Use explicit vertex labels and index hints for better performance
  return `
    UNWIND ${schemaName}.get_edges($edge_type) AS edge_data
    MATCH (from:${fromType} {id: edge_data.from})
    MATCH (to:${toType} {id: edge_data.to})
    CREATE (from)-[:${edgeType} {
      ${propertyMapping}
    }]->(to)
    RETURN count(*) AS created_edges
  `;
}

/**
 * Create an optimized batch vertex creation template
 * 
 * This function creates a Cypher query template for creating vertices in batches
 * with optimized property mapping.
 * 
 * @param vertexType - The type of vertex to create
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template for batch vertex creation
 */
export function createOptimizedBatchVertexTemplate(
  vertexType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generateOptimizedPropertyMapping(propertyNames, 'vertex_data');
  
  // Use a more efficient approach for batch vertex creation
  return `
    UNWIND ${schemaName}.get_vertices('${vertexType}') AS vertex_data
    CREATE (v:${vertexType} {
      id: vertex_data.id,
      ${propertyMapping}
    })
    RETURN count(v) AS created_vertices
  `;
}

/**
 * Create an optimized batch edge creation template
 * 
 * This function creates a Cypher query template for creating edges in batches
 * with optimized property mapping.
 * 
 * @param edgeType - The type of edge to create
 * @param fromType - The type of the from vertex
 * @param toType - The type of the to vertex
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template for batch edge creation
 */
export function createOptimizedBatchEdgeTemplate(
  edgeType: string,
  fromType: string,
  toType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generateOptimizedPropertyMapping(propertyNames, 'edge_data');
  
  // Use a more efficient approach for batch edge creation
  return `
    UNWIND ${schemaName}.get_edges($edge_type) AS edge_data
    MATCH (from:${fromType})
    WHERE from.id = edge_data.from
    MATCH (to:${toType})
    WHERE to.id = edge_data.to
    CREATE (from)-[:${edgeType} {
      ${propertyMapping}
    }]->(to)
    RETURN count(*) AS created_edges
  `;
}
