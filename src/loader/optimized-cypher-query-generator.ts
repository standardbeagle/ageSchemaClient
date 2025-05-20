/**
 * OptimizedCypherQueryGenerator - Generates optimized Cypher queries for loading data into Apache AGE
 * 
 * This class generates optimized Cypher queries for loading vertices and edges into Apache AGE
 * using the temporary table approach. It uses UNWIND to process data returned by
 * PostgreSQL functions that convert data from temporary tables to ag_catalog.agtype format.
 * 
 * @packageDocumentation
 */

import { SchemaDefinition, VertexDefinition, EdgeDefinition } from '../schema/types';
import {
  createOptimizedVertexTemplate,
  createOptimizedEdgeTemplate,
  createOptimizedEdgeTemplateWithIndexHints,
  createOptimizedBatchVertexTemplate,
  createOptimizedBatchEdgeTemplate
} from './optimized-cypher-templates';

/**
 * Options for generating optimized Cypher queries
 */
export interface OptimizedCypherQueryGeneratorOptions {
  /**
   * Schema name for the PostgreSQL functions
   * @default 'age_schema_client'
   */
  schemaName?: string;

  /**
   * Whether to include comments in the generated queries
   * @default false
   */
  includeComments?: boolean;

  /**
   * Whether to use index hints for better performance
   * @default true
   */
  useIndexHints?: boolean;

  /**
   * Whether to use optimized batch templates
   * @default true
   */
  useOptimizedBatchTemplates?: boolean;

  /**
   * Whether to include LOAD 'age' and SET search_path in the generated queries
   * @default false
   */
  includeAgeSetup?: boolean;
}

/**
 * OptimizedCypherQueryGenerator class
 */
export class OptimizedCypherQueryGenerator<T extends SchemaDefinition> {
  /**
   * Schema name for the PostgreSQL functions
   */
  private schemaName: string;

  /**
   * Whether to include comments in the generated queries
   */
  private includeComments: boolean;

  /**
   * Whether to use index hints for better performance
   */
  private useIndexHints: boolean;

  /**
   * Whether to use optimized batch templates
   */
  private useOptimizedBatchTemplates: boolean;

  /**
   * Whether to include LOAD 'age' and SET search_path in the generated queries
   */
  private includeAgeSetup: boolean;

  /**
   * Create a new OptimizedCypherQueryGenerator
   *
   * @param schema - Schema definition
   * @param options - Options for generating queries
   */
  constructor(
    private schema: T,
    options: OptimizedCypherQueryGeneratorOptions = {}
  ) {
    this.schemaName = options.schemaName || 'age_schema_client';
    this.includeComments = options.includeComments || false;
    this.useIndexHints = options.useIndexHints !== false;
    this.useOptimizedBatchTemplates = options.useOptimizedBatchTemplates !== false;
    this.includeAgeSetup = options.includeAgeSetup || false;
  }

  /**
   * Generate an optimized Cypher query for creating vertices of a specific type
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
    let template;
    if (this.useOptimizedBatchTemplates) {
      template = createOptimizedBatchVertexTemplate(vertexType, propertyNames, this.schemaName);
    } else {
      template = createOptimizedVertexTemplate(vertexType, propertyNames, this.schemaName);
    }

    // Add comments if requested
    const query = this.includeComments
      ? this.addCommentsToQuery(template, vertexDef, 'vertex')
      : template;

    // Wrap the query in the PostgreSQL function call
    const ageSetup = this.includeAgeSetup
      ? `LOAD 'age';\nSET search_path = ag_catalog, "$user", public;\n\n`
      : '';

    return `
      ${ageSetup}SELECT * FROM cypher('${graphName}', $$
        ${query.trim()}
      $$) AS (created_vertices agtype);
    `;
  }

  /**
   * Generate an optimized Cypher query for creating edges of a specific type
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
    let template;
    if (this.useOptimizedBatchTemplates) {
      template = createOptimizedBatchEdgeTemplate(
        edgeType,
        edgeDef.from,
        edgeDef.to,
        propertyNames,
        this.schemaName
      );
    } else if (this.useIndexHints) {
      template = createOptimizedEdgeTemplateWithIndexHints(
        edgeType,
        edgeDef.from,
        edgeDef.to,
        propertyNames,
        this.schemaName
      );
    } else {
      template = createOptimizedEdgeTemplate(edgeType, propertyNames, this.schemaName);
    }

    // Add comments if requested
    const query = this.includeComments
      ? this.addCommentsToQuery(template, edgeDef, 'edge')
      : template;

    // Wrap the query in the PostgreSQL function call
    const ageSetup = this.includeAgeSetup
      ? `LOAD 'age';\nSET search_path = ag_catalog, "$user", public;\n\n`
      : '';

    return `
      ${ageSetup}SELECT * FROM cypher('${graphName}', $$
        ${query.trim()}
      $$) AS (created_edges agtype);
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
      `/* Optimized Cypher query for creating ${type}s of type "${def.label}" */`,
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
}
