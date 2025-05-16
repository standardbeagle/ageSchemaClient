/**
 * Schema loader validation functionality for the ageSchemaClient library
 * 
 * This file implements the validation functionality for the SchemaLoader class.
 * 
 * @packageDocumentation
 */

import { SchemaDefinition, VertexLabel, EdgeLabel } from './types';
import { SchemaValidator } from './validator';
import { ValidationError } from '../core/errors';
import { ValidationErrorInfo } from './loader-types';

/**
 * Validate vertex data against the schema
 * 
 * @param schema - Schema definition
 * @param validator - Schema validator
 * @param vertexData - Vertex data to validate
 * @returns Validation errors
 */
export function validateVertexData(
  schema: SchemaDefinition,
  validator: SchemaValidator,
  vertexData: Record<string, any[]>
): ValidationErrorInfo[] {
  const errors: ValidationErrorInfo[] = [];

  // Validate each vertex label
  for (const [label, vertices] of Object.entries(vertexData)) {
    // Check if the vertex label exists in the schema
    if (!schema.vertices[label]) {
      errors.push({
        entityType: 'vertex',
        label,
        index: -1,
        message: `Vertex label '${label}' does not exist in the schema`,
      });
      continue;
    }

    const vertexLabel = schema.vertices[label];

    // Validate each vertex
    vertices.forEach((vertex, index) => {
      try {
        // Validate the vertex against the schema
        const validationErrors = validateVertex(vertexLabel, vertex);
        
        // Add any validation errors to the list
        errors.push(...validationErrors.map(error => ({
          entityType: 'vertex' as const,
          label,
          index,
          message: error.message,
          property: error.property,
          value: error.value
        })));
      } catch (error) {
        // Add any unexpected errors to the list
        errors.push({
          entityType: 'vertex',
          label,
          index,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  return errors;
}

/**
 * Validate edge data against the schema
 * 
 * @param schema - Schema definition
 * @param validator - Schema validator
 * @param edgeData - Edge data to validate
 * @returns Validation errors
 */
export function validateEdgeData(
  schema: SchemaDefinition,
  validator: SchemaValidator,
  edgeData: Record<string, any[]>
): ValidationErrorInfo[] {
  const errors: ValidationErrorInfo[] = [];

  // Validate each edge label
  for (const [label, edges] of Object.entries(edgeData)) {
    // Check if the edge label exists in the schema
    if (!schema.edges[label]) {
      errors.push({
        entityType: 'edge',
        label,
        index: -1,
        message: `Edge label '${label}' does not exist in the schema`,
      });
      continue;
    }

    const edgeLabel = schema.edges[label];

    // Validate each edge
    edges.forEach((edge, index) => {
      try {
        // Validate the edge against the schema
        const validationErrors = validateEdge(edgeLabel, edge);
        
        // Add any validation errors to the list
        errors.push(...validationErrors.map(error => ({
          entityType: 'edge' as const,
          label,
          index,
          message: error.message,
          property: error.property,
          value: error.value
        })));
      } catch (error) {
        // Add any unexpected errors to the list
        errors.push({
          entityType: 'edge',
          label,
          index,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  return errors;
}

/**
 * Validate a vertex against a vertex label
 * 
 * @param vertexLabel - Vertex label
 * @param vertex - Vertex data
 * @returns Validation errors
 */
function validateVertex(
  vertexLabel: VertexLabel,
  vertex: any
): Array<{ message: string; property?: string; value?: any }> {
  const errors: Array<{ message: string; property?: string; value?: any }> = [];

  // Check if vertex is an object
  if (!vertex || typeof vertex !== 'object') {
    errors.push({
      message: 'Vertex must be an object',
      value: vertex
    });
    return errors;
  }

  // Check required properties
  if (vertexLabel.required) {
    for (const requiredProp of vertexLabel.required) {
      if (vertex[requiredProp] === undefined) {
        errors.push({
          message: `Required property '${requiredProp}' is missing`,
          property: requiredProp
        });
      }
    }
  }

  // Check property types
  if (vertexLabel.properties) {
    for (const [propName, propDef] of Object.entries(vertexLabel.properties)) {
      if (vertex[propName] !== undefined) {
        // Check property type
        if (propDef.type && !validatePropertyType(propDef.type, vertex[propName])) {
          errors.push({
            message: `Property '${propName}' has invalid type, expected ${propDef.type}`,
            property: propName,
            value: vertex[propName]
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate an edge against an edge label
 * 
 * @param edgeLabel - Edge label
 * @param edge - Edge data
 * @returns Validation errors
 */
function validateEdge(
  edgeLabel: EdgeLabel,
  edge: any
): Array<{ message: string; property?: string; value?: any }> {
  const errors: Array<{ message: string; property?: string; value?: any }> = [];

  // Check if edge is an object
  if (!edge || typeof edge !== 'object') {
    errors.push({
      message: 'Edge must be an object',
      value: edge
    });
    return errors;
  }

  // Check for from and to properties
  if (edge.from === undefined) {
    errors.push({
      message: "Edge must have a 'from' property",
      property: 'from'
    });
  }

  if (edge.to === undefined) {
    errors.push({
      message: "Edge must have a 'to' property",
      property: 'to'
    });
  }

  // Check required properties
  if (edgeLabel.required) {
    for (const requiredProp of edgeLabel.required) {
      if (edge[requiredProp] === undefined) {
        errors.push({
          message: `Required property '${requiredProp}' is missing`,
          property: requiredProp
        });
      }
    }
  }

  // Check property types
  if (edgeLabel.properties) {
    for (const [propName, propDef] of Object.entries(edgeLabel.properties)) {
      if (edge[propName] !== undefined) {
        // Check property type
        if (propDef.type && !validatePropertyType(propDef.type, edge[propName])) {
          errors.push({
            message: `Property '${propName}' has invalid type, expected ${propDef.type}`,
            property: propName,
            value: edge[propName]
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate a property value against a type
 * 
 * @param type - Property type
 * @param value - Property value
 * @returns Whether the value is valid
 */
function validatePropertyType(type: string, value: any): boolean {
  switch (type.toLowerCase()) {
    case 'string':
      return typeof value === 'string';
    case 'number':
    case 'integer':
    case 'float':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
      return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true; // Unknown type, assume valid
  }
}
