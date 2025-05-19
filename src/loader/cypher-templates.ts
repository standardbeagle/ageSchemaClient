/**
 * Cypher query templates for batch operations
 * 
 * This module provides templates for Cypher queries used in batch operations
 * with Apache AGE. The templates use the UNWIND operator with PostgreSQL functions
 * to efficiently load data from the age_params temporary table.
 * 
 * @packageDocumentation
 */

/**
 * Template for creating vertices in batch
 * 
 * This template uses the UNWIND operator with the get_vertices function
 * to create vertices with the specified type and properties.
 * 
 * @param vertexType - The type of vertex to create
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template
 * 
 * @example
 * ```typescript
 * const template = createVertexTemplate('Person', 'age_schema_client');
 * // Returns:
 * // UNWIND age_schema_client.get_vertices($vertex_type) AS vertex_data
 * // CREATE (v:Person {
 * //   id: vertex_data.id,
 * //   ...vertex_data
 * // })
 * // RETURN count(v) AS created_vertices
 * ```
 */
export function createVertexTemplate(
  vertexType: string,
  schemaName: string = 'age_schema_client'
): string {
  return `
    UNWIND ${schemaName}.get_vertices($vertex_type) AS vertex_data
    CREATE (v:${vertexType} {
      id: vertex_data.id,
      name: CASE WHEN vertex_data.name IS NOT NULL THEN vertex_data.name ELSE NULL END
      /* Additional properties will be added dynamically */
    })
    RETURN count(v) AS created_vertices
  `;
}

/**
 * Template for creating edges in batch
 * 
 * This template uses the UNWIND operator with the get_edges function
 * to create edges between vertices with the specified type and properties.
 * 
 * @param edgeType - The type of edge to create
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template
 * 
 * @example
 * ```typescript
 * const template = createEdgeTemplate('KNOWS', 'age_schema_client');
 * // Returns:
 * // UNWIND age_schema_client.get_edges($edge_type) AS edge_data
 * // MATCH (from {id: edge_data.from})
 * // MATCH (to {id: edge_data.to})
 * // CREATE (from)-[:KNOWS {
 * //   ...edge_data
 * // }]->(to)
 * // RETURN count(*) AS created_edges
 * ```
 */
export function createEdgeTemplate(
  edgeType: string,
  schemaName: string = 'age_schema_client'
): string {
  return `
    UNWIND ${schemaName}.get_edges($edge_type) AS edge_data
    MATCH (from {id: edge_data.from})
    MATCH (to {id: edge_data.to})
    CREATE (from)-[:${edgeType} {
      /* Properties will be added dynamically */
    }]->(to)
    RETURN count(*) AS created_edges
  `;
}

/**
 * Generate a dynamic property mapping for a vertex or edge
 * 
 * This function generates a Cypher property mapping string for a vertex or edge
 * based on the provided property names. The mapping includes conditional logic
 * to handle null values and type conversions.
 * 
 * @param propertyNames - Array of property names to include in the mapping
 * @param prefix - Prefix for the property access (e.g., 'vertex_data' or 'edge_data')
 * @returns Cypher property mapping string
 * 
 * @example
 * ```typescript
 * const mapping = generatePropertyMapping(['name', 'age', 'email'], 'vertex_data');
 * // Returns:
 * // name: CASE WHEN vertex_data.name IS NOT NULL THEN vertex_data.name ELSE NULL END,
 * // age: CASE WHEN vertex_data.age IS NOT NULL THEN vertex_data.age ELSE NULL END,
 * // email: CASE WHEN vertex_data.email IS NOT NULL THEN vertex_data.email ELSE NULL END
 * ```
 */
export function generatePropertyMapping(
  propertyNames: string[],
  prefix: string = 'vertex_data'
): string {
  return propertyNames
    .map(prop => {
      // Skip 'id', 'from', and 'to' properties as they are handled separately
      if (prop === 'id' || prop === 'from' || prop === 'to') {
        return null;
      }
      
      return `${prop}: CASE WHEN ${prefix}.${prop} IS NOT NULL THEN ${prefix}.${prop} ELSE NULL END`;
    })
    .filter(Boolean) // Remove null entries
    .join(',\n      ');
}

/**
 * Create a parameterized vertex template with dynamic property mapping
 * 
 * This function creates a Cypher query template for creating vertices with
 * dynamic property mapping based on the provided property names.
 * 
 * @param vertexType - The type of vertex to create
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template with dynamic property mapping
 * 
 * @example
 * ```typescript
 * const template = createParameterizedVertexTemplate(
 *   'Person',
 *   ['id', 'name', 'age', 'email'],
 *   'age_schema_client'
 * );
 * ```
 */
export function createParameterizedVertexTemplate(
  vertexType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generatePropertyMapping(propertyNames, 'vertex_data');
  
  return `
    UNWIND ${schemaName}.get_vertices($vertex_type) AS vertex_data
    CREATE (v:${vertexType} {
      id: vertex_data.id,
      ${propertyMapping}
    })
    RETURN count(v) AS created_vertices
  `;
}

/**
 * Create a parameterized edge template with dynamic property mapping
 * 
 * This function creates a Cypher query template for creating edges with
 * dynamic property mapping based on the provided property names.
 * 
 * @param edgeType - The type of edge to create
 * @param propertyNames - Array of property names to include in the mapping
 * @param schemaName - The schema name for the PostgreSQL functions
 * @returns Cypher query template with dynamic property mapping
 * 
 * @example
 * ```typescript
 * const template = createParameterizedEdgeTemplate(
 *   'KNOWS',
 *   ['from', 'to', 'since', 'strength'],
 *   'age_schema_client'
 * );
 * ```
 */
export function createParameterizedEdgeTemplate(
  edgeType: string,
  propertyNames: string[],
  schemaName: string = 'age_schema_client'
): string {
  const propertyMapping = generatePropertyMapping(propertyNames, 'edge_data');
  
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
