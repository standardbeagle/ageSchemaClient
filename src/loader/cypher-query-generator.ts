/**
 * CypherQueryGenerator - Generates Cypher queries for loading data into Apache AGE
 * 
 * This class generates Cypher queries for loading vertices and edges into Apache AGE
 * using the temporary table approach. It uses UNWIND to process data returned by
 * PostgreSQL functions that convert data from temporary tables to ag_catalog.agtype format.
 * 
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';

/**
 * CypherQueryGenerator class
 */
export class CypherQueryGenerator<T extends SchemaDefinition> {
  /**
   * Create a new CypherQueryGenerator
   * 
   * @param schema - Schema definition
   */
  constructor(private schema: T) {}

  /**
   * Generate a Cypher query for creating vertices
   * 
   * @param functionName - Name of the PostgreSQL function that returns vertex data
   * @param agtypeConverterFn - Name of the function that converts data to ag_catalog.agtype
   * @param graphName - Name of the graph
   * @returns Cypher query string
   */
  generateCreateVerticesQuery(functionName: string, graphName: string): string {
    return `
      SET search_path = ag_catalog, "$user", public;
      
      SELECT * FROM cypher('${graphName}', $$ 
        UNWIND (SELECT ${functionName}()) AS batch
        WITH batch.label AS vertex_label, 
             batch.properties AS properties
        CREATE (v:$$||vertex_label||$$ ${this.generatePropertiesClause()})
        RETURN vertex_label, id(v) AS vertex_id
      $$) AS (vertex_label TEXT, vertex_id agtype);
    `;
  }

  /**
   * Generate a Cypher query for creating edges
   * 
   * @param functionName - Name of the PostgreSQL function that returns edge data
   * @param graphName - Name of the graph
   * @returns Cypher query string
   */
  generateCreateEdgesQuery(functionName: string, graphName: string): string {
    return `
      SET search_path = ag_catalog, "$user", public;
      
      SELECT * FROM cypher('${graphName}', $$ 
        UNWIND (SELECT ${functionName}()) AS batch
        WITH batch.type AS edge_type, 
             batch.from AS from_id, 
             batch.to AS to_id, 
             batch.properties AS properties
        MATCH (source), (target)
        WHERE id(source) = toInteger(from_id) AND id(target) = toInteger(to_id)
        CREATE (source)-[r:$$||edge_type||$$ ${this.generateEdgePropertiesClause()}]->(target)
        RETURN edge_type, id(r) AS edge_id
      $$) AS (edge_type TEXT, edge_id agtype);
    `;
  }

  /**
   * Generate a properties clause for vertex creation
   * 
   * @returns Properties clause string
   */
  private generatePropertiesClause(): string {
    return `{ CASE WHEN properties IS NOT NULL THEN properties ELSE {} END }`;
  }

  /**
   * Generate a properties clause for edge creation
   * 
   * @returns Properties clause string
   */
  private generateEdgePropertiesClause(): string {
    return `{ CASE WHEN properties IS NOT NULL THEN properties ELSE {} END }`;
  }
  
  /**
   * Generate a query that checks if vertices exist
   * 
   * @param graphName - Name of the graph
   * @returns Cypher query string
   */
  generateVertexExistenceQuery(graphName: string): string {
    return `
      SET search_path = ag_catalog, "$user", public;
      
      SELECT * FROM cypher('${graphName}', $$ 
        MATCH (v) 
        RETURN id(v) AS vertex_id 
      $$) AS (vertex_id agtype);
    `;
  }
  
  /**
   * Generate a query that validates edge endpoints
   * 
   * @param edgeTable - Name of the edge table
   * @param graphName - Name of the graph
   * @returns SQL query string
   */
  generateValidateEdgeEndpointsQuery(edgeTable: string, graphName: string): string {
    return `
      WITH vertex_ids AS (
        SELECT * FROM cypher('${graphName}', $$ 
          MATCH (v) 
          RETURN id(v) AS vertex_id 
        $$) AS (vertex_id agtype)
      ),
      edge_endpoints AS (
        SELECT from_id::bigint AS from_id, to_id::bigint AS to_id 
        FROM ${edgeTable}
      )
      SELECT 
        e.from_id, 
        e.to_id, 
        EXISTS(SELECT 1 FROM vertex_ids v WHERE v.vertex_id::text::bigint = e.from_id) AS from_exists,
        EXISTS(SELECT 1 FROM vertex_ids v WHERE v.vertex_id::text::bigint = e.to_id) AS to_exists
      FROM edge_endpoints e
      WHERE NOT EXISTS(SELECT 1 FROM vertex_ids v WHERE v.vertex_id::text::bigint = e.from_id)
         OR NOT EXISTS(SELECT 1 FROM vertex_ids v WHERE v.vertex_id::text::bigint = e.to_id);
    `;
  }
}
