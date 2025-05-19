/**
 * Additional methods for the DataValidator class
 */

import { ValidationResult } from './data-validator-types';
import { EdgeDefinition } from '../schema/types';

/**
 * Validate edge properties against the schema
 *
 * @param edgeType - Edge type
 * @param edgeDef - Edge definition
 * @param edge - Edge to validate
 * @param index - Index of the edge in the array
 * @param result - Validation result to update
 */
export function validateEdgeProperties(
  edgeType: string,
  edgeDef: EdgeDefinition,
  edge: any,
  index: number,
  result: ValidationResult
): void {
  // Check required properties
  for (const [propName, propDef] of Object.entries(edgeDef.properties)) {
    // Skip from and to properties as they are handled separately
    if (propName === 'from' || propName === 'to') {
      continue;
    }

    if (propDef.required && edge[propName] === undefined) {
      result.valid = false;
      result.errors.push({
        type: 'edge',
        entityType: edgeType,
        index,
        message: `Missing required property: ${propName}`,
        path: propName
      });
    }
  }

  // Check property types
  for (const [propName, propValue] of Object.entries(edge)) {
    // Skip from and to properties as they are handled separately
    if (propName === 'from' || propName === 'to') {
      continue;
    }

    const propDef = edgeDef.properties[propName];

    // Skip if property is not defined in schema
    if (!propDef) {
      result.warnings.push(
        `Unknown property: ${propName} in edge type ${edgeType} at index ${index}`
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
        type: 'edge',
        entityType: edgeType,
        index,
        message: `Invalid type for property ${propName}: expected ${expectedType}, got ${actualType}`,
        path: propName
      });
    }
  }
}

/**
 * Validate edge references against the vertices
 *
 * @param edgeType - Edge type
 * @param edgeDef - Edge definition
 * @param edge - Edge to validate
 * @param index - Index of the edge in the array
 * @param vertices - Vertices to validate references against
 * @param result - Validation result to update
 * @param schema - Schema definition
 */
export function validateEdgeReferences(
  edgeType: string,
  edgeDef: EdgeDefinition,
  edge: any,
  index: number,
  vertices: Record<string, any[]>,
  result: ValidationResult,
  schema: any
): void {
  const fromType = edgeDef.from;
  const toType = edgeDef.to;

  // Check if from vertex type exists in schema
  if (!schema.vertices[fromType]) {
    result.valid = false;
    result.errors.push({
      type: 'edge',
      entityType: edgeType,
      index,
      message: `Unknown from vertex type: ${fromType}`,
      path: 'from'
    });
    return;
  }

  // Check if to vertex type exists in schema
  if (!schema.vertices[toType]) {
    result.valid = false;
    result.errors.push({
      type: 'edge',
      entityType: edgeType,
      index,
      message: `Unknown to vertex type: ${toType}`,
      path: 'to'
    });
    return;
  }

  // Check if from vertex exists
  const fromId = String(edge.from);
  const fromVertices = vertices[fromType] || [];
  const fromVertex = fromVertices.find(v => String(v.id) === fromId);

  if (!fromVertex) {
    result.warnings.push(
      `Edge at index ${index} references non-existent from vertex: ${fromId} of type ${fromType}`
    );
  }

  // Check if to vertex exists
  const toId = String(edge.to);
  const toVertices = vertices[toType] || [];
  const toVertex = toVertices.find(v => String(v.id) === toId);

  if (!toVertex) {
    result.warnings.push(
      `Edge at index ${index} references non-existent to vertex: ${toId} of type ${toType}`
    );
  }
}

/**
 * Validate property type
 *
 * @param expectedType - Expected type from schema
 * @param actualType - Actual type of the property
 * @param value - Property value
 * @returns Whether the property type is valid
 */
export function validatePropertyType(
  expectedType: string,
  actualType: string,
  value: any
): boolean {
  switch (expectedType) {
    case 'string':
      return actualType === 'string';

    case 'number':
      return actualType === 'number' && !isNaN(value);

    case 'boolean':
      return actualType === 'boolean';

    case 'object':
      return actualType === 'object' && value !== null;

    case 'array':
      return Array.isArray(value);

    case 'any':
      return true;

    default:
      // For custom types, just check that it's not null or undefined
      return value !== null && value !== undefined;
  }
}
