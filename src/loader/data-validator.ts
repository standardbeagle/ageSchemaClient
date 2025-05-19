/**
 * Data validation logic for batch loading
 *
 * This module provides functions for validating vertex and edge data
 * against the schema before loading into Apache AGE.
 *
 * @packageDocumentation
 */

import { SchemaDefinition, VertexDefinition, EdgeDefinition } from '../schema/types';
import {
  validateEdgeProperties,
  validateEdgeReferences,
  validatePropertyType
} from './data-validator-methods';
import {
  ValidationResult,
  ValidationError,
  GraphData
} from './data-validator-types';

// Re-export types
export { ValidationResult, ValidationError, GraphData } from './data-validator-types';

/**
 * Data validator class
 *
 * This class provides methods for validating vertex and edge data
 * against the schema before loading into Apache AGE.
 */
export class DataValidator<T extends SchemaDefinition> {
  /**
   * Create a new DataValidator
   *
   * @param schema - Schema definition
   */
  constructor(private schema: T) {}

  /**
   * Validate graph data against the schema
   *
   * @param graphData - Graph data to validate
   * @returns Validation result
   */
  validateData(graphData: GraphData): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    // Validate vertices
    this.validateVertices(graphData.vertices, result);

    // Validate edges and references
    this.validateEdges(graphData.edges, graphData.vertices, result);

    return result;
  }

  /**
   * Validate vertices against the schema
   *
   * @param vertices - Vertices to validate
   * @param result - Validation result to update
   */
  private validateVertices(
    vertices: Record<string, any[]>,
    result: ValidationResult
  ): void {
    // Check if vertices is defined
    if (!vertices) {
      result.valid = false;
      result.errors.push({
        type: 'vertex',
        entityType: 'unknown',
        index: -1,
        message: 'Vertices are not defined'
      });
      return;
    }

    // Validate each vertex type
    for (const [vertexType, vertexArray] of Object.entries(vertices)) {
      // Check if vertex type exists in schema
      const vertexDef = this.schema.vertices[vertexType];
      if (!vertexDef) {
        result.valid = false;
        result.errors.push({
          type: 'vertex',
          entityType: vertexType,
          index: -1,
          message: `Unknown vertex type: ${vertexType}`
        });
        continue;
      }

      // Check if vertex array is defined and is an array
      if (!Array.isArray(vertexArray)) {
        result.valid = false;
        result.errors.push({
          type: 'vertex',
          entityType: vertexType,
          index: -1,
          message: `Vertex data for type ${vertexType} is not an array`
        });
        continue;
      }

      // Validate each vertex
      this.validateVertexArray(vertexType, vertexDef, vertexArray, result);
    }
  }

  /**
   * Validate an array of vertices of a specific type
   *
   * @param vertexType - Vertex type
   * @param vertexDef - Vertex definition
   * @param vertexArray - Array of vertices
   * @param result - Validation result to update
   */
  private validateVertexArray(
    vertexType: string,
    vertexDef: VertexDefinition,
    vertexArray: any[],
    result: ValidationResult
  ): void {
    // Check for duplicate IDs
    const idSet = new Set<string>();
    const duplicateIds = new Set<string>();

    // Validate each vertex
    vertexArray.forEach((vertex, index) => {
      // Validate vertex has an ID
      if (!vertex.id) {
        result.valid = false;
        result.errors.push({
          type: 'vertex',
          entityType: vertexType,
          index,
          message: `Vertex at index ${index} is missing an ID`
        });
        return;
      }

      // Check for duplicate IDs
      const id = String(vertex.id);
      if (idSet.has(id)) {
        duplicateIds.add(id);
        result.warnings.push(`Duplicate vertex ID: ${id} in type ${vertexType}`);
      } else {
        idSet.add(id);
      }

      // Validate vertex properties
      this.validateVertexProperties(vertexType, vertexDef, vertex, index, result);
    });

    // Add warning for duplicate IDs
    if (duplicateIds.size > 0) {
      result.warnings.push(
        `Found ${duplicateIds.size} duplicate vertex IDs in type ${vertexType}. ` +
        `Later vertices will overwrite earlier ones.`
      );
    }
  }

  /**
   * Validate vertex properties against the schema
   *
   * @param vertexType - Vertex type
   * @param vertexDef - Vertex definition
   * @param vertex - Vertex to validate
   * @param index - Index of the vertex in the array
   * @param result - Validation result to update
   */
  private validateVertexProperties(
    vertexType: string,
    vertexDef: VertexDefinition,
    vertex: any,
    index: number,
    result: ValidationResult
  ): void {
    // Check required properties
    for (const [propName, propDef] of Object.entries(vertexDef.properties)) {
      if (propDef.required && vertex[propName] === undefined) {
        result.valid = false;
        result.errors.push({
          type: 'vertex',
          entityType: vertexType,
          index,
          message: `Missing required property: ${propName}`,
          path: propName
        });
      }
    }

    // Check property types
    for (const [propName, propValue] of Object.entries(vertex)) {
      const propDef = vertexDef.properties[propName];

      // Skip if property is not defined in schema
      if (!propDef) {
        result.warnings.push(
          `Unknown property: ${propName} in vertex type ${vertexType} at index ${index}`
        );
        continue;
      }

      // Skip if property is null or undefined
      if (propValue === null || propValue === undefined) {
        continue;
      }

      // Validate property type
      const expectedType = propDef.type;
      const actualType = typeof propValue;

      if (!validatePropertyType(expectedType, actualType, propValue)) {
        result.valid = false;
        result.errors.push({
          type: 'vertex',
          entityType: vertexType,
          index,
          message: `Invalid type for property ${propName}: expected ${expectedType}, got ${actualType}`,
          path: propName
        });
      }
    }
  }

  /**
   * Validate edges against the schema
   *
   * @param edges - Edges to validate
   * @param vertices - Vertices to validate references against
   * @param result - Validation result to update
   */
  private validateEdges(
    edges: Record<string, any[]>,
    vertices: Record<string, any[]>,
    result: ValidationResult
  ): void {
    // Check if edges is defined
    if (!edges) {
      result.warnings.push('No edges defined');
      return;
    }

    // Validate each edge type
    for (const [edgeType, edgeArray] of Object.entries(edges)) {
      // Check if edge type exists in schema
      const edgeDef = this.schema.edges[edgeType];
      if (!edgeDef) {
        result.valid = false;
        result.errors.push({
          type: 'edge',
          entityType: edgeType,
          index: -1,
          message: `Unknown edge type: ${edgeType}`
        });
        continue;
      }

      // Check if edge array is defined and is an array
      if (!Array.isArray(edgeArray)) {
        result.valid = false;
        result.errors.push({
          type: 'edge',
          entityType: edgeType,
          index: -1,
          message: `Edge data for type ${edgeType} is not an array`
        });
        continue;
      }

      // Validate each edge
      this.validateEdgeArray(edgeType, edgeDef, edgeArray, vertices, result);
    }
  }

  /**
   * Validate an array of edges of a specific type
   *
   * @param edgeType - Edge type
   * @param edgeDef - Edge definition
   * @param edgeArray - Array of edges
   * @param vertices - Vertices to validate references against
   * @param result - Validation result to update
   */
  private validateEdgeArray(
    edgeType: string,
    edgeDef: EdgeDefinition,
    edgeArray: any[],
    vertices: Record<string, any[]>,
    result: ValidationResult
  ): void {
    // Validate each edge
    edgeArray.forEach((edge, index) => {
      // Validate edge has from and to properties
      if (!edge.from) {
        result.valid = false;
        result.errors.push({
          type: 'edge',
          entityType: edgeType,
          index,
          message: `Edge at index ${index} is missing a 'from' property`,
          path: 'from'
        });
      }

      if (!edge.to) {
        result.valid = false;
        result.errors.push({
          type: 'edge',
          entityType: edgeType,
          index,
          message: `Edge at index ${index} is missing a 'to' property`,
          path: 'to'
        });
      }

      // Skip further validation if from or to is missing
      if (!edge.from || !edge.to) {
        return;
      }

      // Validate edge properties
      validateEdgeProperties(edgeType, edgeDef, edge, index, result);

      // Validate edge references
      validateEdgeReferences(edgeType, edgeDef, edge, index, vertices, result, this.schema);
    });
  }
}