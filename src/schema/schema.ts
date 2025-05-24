/**
 * Schema interface and implementation for accessing schema information
 * 
 * This module provides a Schema interface for accessing vertex and edge schema information
 * that will be used for query generation.
 * 
 * @packageDocumentation
 */

import {
  SchemaDefinition,
  VertexLabel,
  EdgeLabel
} from './types';

/**
 * Schema interface for accessing schema information
 */
export interface Schema {
  /**
   * Get the vertex schema for a specific vertex type
   * 
   * @param vertexType - The vertex type to get the schema for
   * @returns The vertex schema or undefined if not found
   */
  getVertexSchema(vertexType: string): VertexLabel | undefined;

  /**
   * Get the edge schema for a specific edge type
   * 
   * @param edgeType - The edge type to get the schema for
   * @returns The edge schema or undefined if not found
   */
  getEdgeSchema(edgeType: string): EdgeLabel | undefined;

  /**
   * Get all vertex types defined in the schema
   * 
   * @returns Array of vertex type names
   */
  getVertexTypes(): string[];

  /**
   * Get all edge types defined in the schema
   * 
   * @returns Array of edge type names
   */
  getEdgeTypes(): string[];

  /**
   * Get the schema definition
   * 
   * @returns The schema definition
   */
  getSchemaDefinition(): SchemaDefinition;
}

/**
 * Schema implementation that wraps a SchemaDefinition
 */
export class SchemaImpl implements Schema {
  private schemaDefinition: SchemaDefinition;

  /**
   * Create a new SchemaImpl
   * 
   * @param schemaDefinition - Schema definition
   */
  constructor(schemaDefinition: SchemaDefinition) {
    this.schemaDefinition = schemaDefinition;
  }

  /**
   * Get the vertex schema for a specific vertex type
   * 
   * @param vertexType - The vertex type to get the schema for
   * @returns The vertex schema or undefined if not found
   */
  getVertexSchema(vertexType: string): VertexLabel | undefined {
    return this.schemaDefinition.vertices[vertexType];
  }

  /**
   * Get the edge schema for a specific edge type
   * 
   * @param edgeType - The edge type to get the schema for
   * @returns The edge schema or undefined if not found
   */
  getEdgeSchema(edgeType: string): EdgeLabel | undefined {
    return this.schemaDefinition.edges[edgeType];
  }

  /**
   * Get all vertex types defined in the schema
   * 
   * @returns Array of vertex type names
   */
  getVertexTypes(): string[] {
    return Object.keys(this.schemaDefinition.vertices);
  }

  /**
   * Get all edge types defined in the schema
   * 
   * @returns Array of edge type names
   */
  getEdgeTypes(): string[] {
    return Object.keys(this.schemaDefinition.edges);
  }

  /**
   * Get the schema definition
   * 
   * @returns The schema definition
   */
  getSchemaDefinition(): SchemaDefinition {
    return this.schemaDefinition;
  }
}
