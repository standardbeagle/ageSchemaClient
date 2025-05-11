/**
 * Type guards for schema components
 * 
 * @packageDocumentation
 */

import {
  SchemaDefinition,
  VertexLabel,
  EdgeLabel,
  PropertyDefinition,
  PropertyType,
  SchemaVersion,
  SchemaMetadata,
} from './types';

/**
 * Type guard for SchemaVersion
 * 
 * @param value - Value to check
 * @returns Whether the value is a SchemaVersion
 */
export function isSchemaVersion(value: unknown): value is SchemaVersion {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const version = value as Record<string, unknown>;
  
  return (
    typeof version.major === 'number' &&
    typeof version.minor === 'number' &&
    typeof version.patch === 'number' &&
    (version.prerelease === undefined || typeof version.prerelease === 'string') &&
    (version.build === undefined || typeof version.build === 'string')
  );
}

/**
 * Type guard for SchemaMetadata
 * 
 * @param value - Value to check
 * @returns Whether the value is a SchemaMetadata
 */
export function isSchemaMetadata(value: unknown): value is SchemaMetadata {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const metadata = value as Record<string, unknown>;
  
  return (
    (metadata.author === undefined || typeof metadata.author === 'string') &&
    (metadata.description === undefined || typeof metadata.description === 'string') &&
    (metadata.created === undefined || typeof metadata.created === 'string') &&
    (metadata.updated === undefined || typeof metadata.updated === 'string')
  );
}

/**
 * Type guard for PropertyDefinition
 * 
 * @param value - Value to check
 * @returns Whether the value is a PropertyDefinition
 */
export function isPropertyDefinition(value: unknown): value is PropertyDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const property = value as Record<string, unknown>;
  
  // Check if type is valid
  if (typeof property.type !== 'string' && !Array.isArray(property.type)) {
    return false;
  }
  
  if (typeof property.type === 'string') {
    const validTypes = Object.values(PropertyType);
    if (!validTypes.includes(property.type as PropertyType)) {
      return false;
    }
  } else if (Array.isArray(property.type)) {
    const validTypes = Object.values(PropertyType);
    for (const type of property.type) {
      if (typeof type !== 'string' || !validTypes.includes(type as PropertyType)) {
        return false;
      }
    }
  }
  
  // Check optional fields
  if (
    (property.description !== undefined && typeof property.description !== 'string') ||
    (property.nullable !== undefined && typeof property.nullable !== 'boolean') ||
    (property.customValidator !== undefined && typeof property.customValidator !== 'string') ||
    (property.metadata !== undefined && (typeof property.metadata !== 'object' || property.metadata === null))
  ) {
    return false;
  }
  
  return true;
}

/**
 * Type guard for VertexLabel
 * 
 * @param value - Value to check
 * @returns Whether the value is a VertexLabel
 */
export function isVertexLabel(value: unknown): value is VertexLabel {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const vertex = value as Record<string, unknown>;
  
  // Check if properties is a valid object
  if (
    !vertex.properties ||
    typeof vertex.properties !== 'object' ||
    vertex.properties === null
  ) {
    return false;
  }
  
  // Check if all properties are valid PropertyDefinitions
  const properties = vertex.properties as Record<string, unknown>;
  for (const prop of Object.values(properties)) {
    if (!isPropertyDefinition(prop)) {
      return false;
    }
  }
  
  // Check if required is a valid array of strings
  if (vertex.required !== undefined) {
    if (!Array.isArray(vertex.required)) {
      return false;
    }
    
    for (const prop of vertex.required) {
      if (typeof prop !== 'string') {
        return false;
      }
    }
  }
  
  // Check optional fields
  if (
    (vertex.description !== undefined && typeof vertex.description !== 'string') ||
    (vertex.metadata !== undefined && (typeof vertex.metadata !== 'object' || vertex.metadata === null))
  ) {
    return false;
  }
  
  return true;
}

/**
 * Type guard for EdgeLabel
 * 
 * @param value - Value to check
 * @returns Whether the value is an EdgeLabel
 */
export function isEdgeLabel(value: unknown): value is EdgeLabel {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const edge = value as Record<string, unknown>;
  
  // Check if properties is a valid object
  if (
    !edge.properties ||
    typeof edge.properties !== 'object' ||
    edge.properties === null
  ) {
    return false;
  }
  
  // Check if all properties are valid PropertyDefinitions
  const properties = edge.properties as Record<string, unknown>;
  for (const prop of Object.values(properties)) {
    if (!isPropertyDefinition(prop)) {
      return false;
    }
  }
  
  // Check if fromVertex and toVertex are valid
  if (
    !edge.fromVertex ||
    (typeof edge.fromVertex !== 'string' && typeof edge.fromVertex !== 'object') ||
    !edge.toVertex ||
    (typeof edge.toVertex !== 'string' && typeof edge.toVertex !== 'object')
  ) {
    return false;
  }
  
  // Check if required is a valid array of strings
  if (edge.required !== undefined) {
    if (!Array.isArray(edge.required)) {
      return false;
    }
    
    for (const prop of edge.required) {
      if (typeof prop !== 'string') {
        return false;
      }
    }
  }
  
  // Check optional fields
  if (
    (edge.description !== undefined && typeof edge.description !== 'string') ||
    (edge.metadata !== undefined && (typeof edge.metadata !== 'object' || edge.metadata === null))
  ) {
    return false;
  }
  
  return true;
}

/**
 * Type guard for SchemaDefinition
 * 
 * @param value - Value to check
 * @returns Whether the value is a SchemaDefinition
 */
export function isSchemaDefinition(value: unknown): value is SchemaDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const schema = value as Record<string, unknown>;
  
  // Check if version is valid
  if (
    !schema.version ||
    (typeof schema.version !== 'string' && !isSchemaVersion(schema.version))
  ) {
    return false;
  }
  
  // Check if vertices is a valid object
  if (
    !schema.vertices ||
    typeof schema.vertices !== 'object' ||
    schema.vertices === null
  ) {
    return false;
  }
  
  // Check if all vertices are valid VertexLabels
  const vertices = schema.vertices as Record<string, unknown>;
  for (const vertex of Object.values(vertices)) {
    if (!isVertexLabel(vertex)) {
      return false;
    }
  }
  
  // Check if edges is a valid object
  if (
    !schema.edges ||
    typeof schema.edges !== 'object' ||
    schema.edges === null
  ) {
    return false;
  }
  
  // Check if all edges are valid EdgeLabels
  const edges = schema.edges as Record<string, unknown>;
  for (const edge of Object.values(edges)) {
    if (!isEdgeLabel(edge)) {
      return false;
    }
  }
  
  // Check if metadata is valid
  if (
    schema.metadata !== undefined &&
    !isSchemaMetadata(schema.metadata)
  ) {
    return false;
  }
  
  return true;
}
