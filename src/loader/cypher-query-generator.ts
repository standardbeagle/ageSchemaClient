/**
 * CypherQueryGenerator - Generates Cypher queries for loading data into Apache AGE
 *
 * This class generates Cypher queries for loading vertices and edges into Apache AGE
 * using the temporary table approach. It uses UNWIND to process data returned by
 * PostgreSQL functions that convert data from temporary tables to ag_catalog.agtype format.
 *
 * @packageDocumentation
 */

import { SchemaDefinition, VertexDefinition, EdgeDefinition } from '../schema/types';
import {
  createParameterizedVertexTemplate,
  createParameterizedEdgeTemplate
} from './cypher-templates';

/**
 * Options for generating Cypher queries
 */
export interface CypherQueryGeneratorOptions {
  /**
   * Schema name for the PostgreSQL functions
   * @default 'age_schema_client'
   */
  schemaName?: string;

  /**
   * Whether to include comments in the generated queries
   * @default true
   */
  includeComments?: boolean;
}

/**
 * CypherQueryGenerator class
 */
export class CypherQueryGenerator<T extends SchemaDefinition> {
  /**
   * Schema name for the PostgreSQL functions
   */
  private schemaName: string;

  /**
   * Whether to include comments in the generated queries
   */
  private includeComments: boolean;

  /**
   * Create a new CypherQueryGenerator
   *
   * @param schema - Schema definition
   * @param options - Options for generating queries
   */
  constructor(
    private schema: T,
    options: CypherQueryGeneratorOptions = {}
  ) {
    this.schemaName = options.schemaName || 'age_schema_client';
    this.includeComments = options.includeComments !== false;
  }

  /**
   * Generate a Cypher query for creating vertices of a specific type
   *
   * @param vertexType - The type of vertex to create
   * @param graphName - Name of the graph
   * @returns Cypher query string
   */
  generateCreateVerticesQuery(vertexType: string, graphName: string): string {
    // Get the vertex definition from the schema
    const vertexDef = this.schema.vertices[vertexType];

    if (!vertexDef) {
      throw new Error(`Vertex type "${vertexType}" not found in schema`);
    }

    // Get the property names from the vertex definition
    const propertyNames = Object.keys(vertexDef.properties);

    // Make sure 'id' is included
    if (!propertyNames.includes('id')) {
      propertyNames.unshift('id');
    }

    // Generate the template
    const template = createParameterizedVertexTemplate(vertexType, propertyNames, this.schemaName);

    // Add comments if requested
    const query = this.includeComments
      ? this.addCommentsToQuery(template, vertexDef, 'vertex')
      : template;

    // Wrap the query in the PostgreSQL function call
    return `
      LOAD 'age';
      SET search_path = ag_catalog, "$user", public;

      SELECT * FROM cypher('${graphName}', $$
        ${query.trim()}
      $$, '{"vertex_type": "${vertexType}"}') AS (created_vertices agtype);
    `;
  }

  /**
   * Generate a Cypher query for creating edges of a specific type
   *
   * @param edgeType - The type of edge to create
   * @param graphName - Name of the graph
   * @returns Cypher query string
   */
  generateCreateEdgesQuery(edgeType: string, graphName: string): string {
    // Get the edge definition from the schema
    const edgeDef = this.schema.edges[edgeType];

    if (!edgeDef) {
      throw new Error(`Edge type "${edgeType}" not found in schema`);
    }

    // Get the property names from the edge definition
    const propertyNames = Object.keys(edgeDef.properties);

    // Make sure 'from' and 'to' are included
    if (!propertyNames.includes('from')) {
      propertyNames.unshift('from');
    }
    if (!propertyNames.includes('to')) {
      propertyNames.push('to');
    }

    // Generate the template
    const template = createParameterizedEdgeTemplate(edgeType, propertyNames, this.schemaName);

    // Add comments if requested
    const query = this.includeComments
      ? this.addCommentsToQuery(template, edgeDef, 'edge')
      : template;

    // Wrap the query in the PostgreSQL function call
    return `
      LOAD 'age';
      SET search_path = ag_catalog, "$user", public;

      SELECT * FROM cypher('${graphName}', $$
        ${query.trim()}
      $$, '{"edge_type": "${edgeType}"}') AS (created_edges agtype);
    `;
  }

  /**
   * Add comments to a Cypher query
   *
   * @param query - The Cypher query to add comments to
   * @param def - The vertex or edge definition
   * @param type - The type of definition ('vertex' or 'edge')
   * @returns Cypher query with comments
   */
  private addCommentsToQuery(
    query: string,
    def: VertexDefinition | EdgeDefinition,
    type: 'vertex' | 'edge'
  ): string {
    const comments = [
      `/* Cypher query for creating ${type}s of type "${def.label}" */`,
      `/* Generated from schema definition */`,
    ];

    if (type === 'vertex') {
      const vertexDef = def as VertexDefinition;
      comments.push(`/* Vertex properties: ${Object.keys(vertexDef.properties).join(', ')} */`);
    } else {
      const edgeDef = def as EdgeDefinition;
      comments.push(`/* Edge properties: ${Object.keys(edgeDef.properties).join(', ')} */`);
      comments.push(`/* From vertex type: ${edgeDef.from} */`);
      comments.push(`/* To vertex type: ${edgeDef.to} */`);
    }

    return `${comments.join('\n')}\n${query}`;
  }

  /**
   * Generate a query that checks if vertices exist
   *
   * @param graphName - Name of the graph
   * @returns Cypher query string
   */
  generateVertexExistenceQuery(graphName: string): string {
    return `
      LOAD 'age';
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
      LOAD 'age';
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
