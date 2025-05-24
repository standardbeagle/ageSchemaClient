/**
 * Schema migration utilities
 * 
 * @packageDocumentation
 */

import {
  SchemaDefinition,
  VertexLabel,
  EdgeLabel,
  PropertyDefinition,

} from './types';
import { SchemaVersionError } from './errors';
import { parseVersion, formatVersion } from './utils';

/**
 * Schema change type
 */
export enum SchemaChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
}

/**
 * Schema change
 */
export interface SchemaChange {
  /**
   * Change type
   */
  type: SchemaChangeType;
  
  /**
   * Path to the changed element
   */
  path: string;
  
  /**
   * Whether the change is breaking
   */
  breaking: boolean;
  
  /**
   * Old value
   */
  oldValue?: unknown;
  
  /**
   * New value
   */
  newValue?: unknown;
}

/**
 * Schema migration options
 */
export interface SchemaMigrationOptions {
  /**
   * Whether to allow breaking changes
   */
  allowBreakingChanges?: boolean;
  
  /**
   * Whether to automatically increment the version
   */
  autoIncrementVersion?: boolean;
  
  /**
   * Whether to preserve unknown properties
   */
  preserveUnknown?: boolean;
}

/**
 * Default schema migration options
 */
const DEFAULT_OPTIONS: SchemaMigrationOptions = {
  allowBreakingChanges: false,
  autoIncrementVersion: true,
  preserveUnknown: true,
};

/**
 * Compare two schemas and identify changes
 * 
 * @param oldSchema - Old schema
 * @param newSchema - New schema
 * @returns Array of schema changes
 */
export function compareSchemas(
  oldSchema: SchemaDefinition,
  newSchema: SchemaDefinition
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  
  // Compare versions
  if (oldSchema.version !== newSchema.version) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: 'version',
      breaking: false,
      oldValue: oldSchema.version,
      newValue: newSchema.version,
    });
  }
  
  // Compare vertices
  const oldVertices = oldSchema.vertices || {};
  const newVertices = newSchema.vertices || {};
  
  // Check for removed vertices
  for (const label of Object.keys(oldVertices)) {
    if (!newVertices[label]) {
      changes.push({
        type: SchemaChangeType.REMOVED,
        path: `vertices.${label}`,
        breaking: true,
        oldValue: oldVertices[label],
      });
    }
  }
  
  // Check for added or modified vertices
  for (const label of Object.keys(newVertices)) {
    if (!oldVertices[label]) {
      changes.push({
        type: SchemaChangeType.ADDED,
        path: `vertices.${label}`,
        breaking: false,
        newValue: newVertices[label],
      });
    } else {
      // Compare vertex properties
      const vertexChanges = compareVertices(oldVertices[label], newVertices[label], `vertices.${label}`);
      changes.push(...vertexChanges);
    }
  }
  
  // Compare edges
  const oldEdges = oldSchema.edges || {};
  const newEdges = newSchema.edges || {};
  
  // Check for removed edges
  for (const label of Object.keys(oldEdges)) {
    if (!newEdges[label]) {
      changes.push({
        type: SchemaChangeType.REMOVED,
        path: `edges.${label}`,
        breaking: true,
        oldValue: oldEdges[label],
      });
    }
  }
  
  // Check for added or modified edges
  for (const label of Object.keys(newEdges)) {
    if (!oldEdges[label]) {
      changes.push({
        type: SchemaChangeType.ADDED,
        path: `edges.${label}`,
        breaking: false,
        newValue: newEdges[label],
      });
    } else {
      // Compare edge properties
      const edgeChanges = compareEdges(oldEdges[label], newEdges[label], `edges.${label}`);
      changes.push(...edgeChanges);
    }
  }
  
  return changes;
}

/**
 * Compare two vertices and identify changes
 * 
 * @param oldVertex - Old vertex
 * @param newVertex - New vertex
 * @param basePath - Base path for changes
 * @returns Array of schema changes
 */
function compareVertices(
  oldVertex: VertexLabel,
  newVertex: VertexLabel,
  basePath: string
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  
  // Compare required properties
  const oldRequired = oldVertex.required || [];
  const newRequired = newVertex.required || [];
  
  // Check for newly required properties
  for (const prop of newRequired) {
    if (!oldRequired.includes(prop)) {
      changes.push({
        type: SchemaChangeType.MODIFIED,
        path: `${basePath}.required`,
        breaking: true,
        oldValue: oldRequired,
        newValue: newRequired,
      });
      break;
    }
  }
  
  // Check for no longer required properties
  for (const prop of oldRequired) {
    if (!newRequired.includes(prop)) {
      changes.push({
        type: SchemaChangeType.MODIFIED,
        path: `${basePath}.required`,
        breaking: false,
        oldValue: oldRequired,
        newValue: newRequired,
      });
      break;
    }
  }
  
  // Compare properties
  const oldProperties = oldVertex.properties || {};
  const newProperties = newVertex.properties || {};
  
  // Check for removed properties
  for (const prop of Object.keys(oldProperties)) {
    if (!newProperties[prop]) {
      changes.push({
        type: SchemaChangeType.REMOVED,
        path: `${basePath}.properties.${prop}`,
        breaking: oldRequired.includes(prop),
        oldValue: oldProperties[prop],
      });
    }
  }
  
  // Check for added or modified properties
  for (const prop of Object.keys(newProperties)) {
    if (!oldProperties[prop]) {
      changes.push({
        type: SchemaChangeType.ADDED,
        path: `${basePath}.properties.${prop}`,
        breaking: newRequired.includes(prop),
        newValue: newProperties[prop],
      });
    } else {
      // Compare property definitions
      const propertyChanges = compareProperties(
        oldProperties[prop],
        newProperties[prop],
        `${basePath}.properties.${prop}`
      );
      changes.push(...propertyChanges);
    }
  }
  
  return changes;
}

/**
 * Compare two edges and identify changes
 * 
 * @param oldEdge - Old edge
 * @param newEdge - New edge
 * @param basePath - Base path for changes
 * @returns Array of schema changes
 */
function compareEdges(
  oldEdge: EdgeLabel,
  newEdge: EdgeLabel,
  basePath: string
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  
  // Compare from/to vertices
  if (
    JSON.stringify(oldEdge.fromVertex) !== JSON.stringify(newEdge.fromVertex)
  ) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.fromVertex`,
      breaking: true,
      oldValue: oldEdge.fromVertex,
      newValue: newEdge.fromVertex,
    });
  }
  
  if (
    JSON.stringify(oldEdge.toVertex) !== JSON.stringify(newEdge.toVertex)
  ) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.toVertex`,
      breaking: true,
      oldValue: oldEdge.toVertex,
      newValue: newEdge.toVertex,
    });
  }
  
  // Compare multiplicity and direction
  if (oldEdge.multiplicity !== newEdge.multiplicity) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.multiplicity`,
      breaking: true,
      oldValue: oldEdge.multiplicity,
      newValue: newEdge.multiplicity,
    });
  }
  
  if (oldEdge.direction !== newEdge.direction) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.direction`,
      breaking: true,
      oldValue: oldEdge.direction,
      newValue: newEdge.direction,
    });
  }
  
  // Compare required properties
  const oldRequired = oldEdge.required || [];
  const newRequired = newEdge.required || [];
  
  // Check for newly required properties
  for (const prop of newRequired) {
    if (!oldRequired.includes(prop)) {
      changes.push({
        type: SchemaChangeType.MODIFIED,
        path: `${basePath}.required`,
        breaking: true,
        oldValue: oldRequired,
        newValue: newRequired,
      });
      break;
    }
  }
  
  // Check for no longer required properties
  for (const prop of oldRequired) {
    if (!newRequired.includes(prop)) {
      changes.push({
        type: SchemaChangeType.MODIFIED,
        path: `${basePath}.required`,
        breaking: false,
        oldValue: oldRequired,
        newValue: newRequired,
      });
      break;
    }
  }
  
  // Compare properties
  const oldProperties = oldEdge.properties || {};
  const newProperties = newEdge.properties || {};
  
  // Check for removed properties
  for (const prop of Object.keys(oldProperties)) {
    if (!newProperties[prop]) {
      changes.push({
        type: SchemaChangeType.REMOVED,
        path: `${basePath}.properties.${prop}`,
        breaking: oldRequired.includes(prop),
        oldValue: oldProperties[prop],
      });
    }
  }
  
  // Check for added or modified properties
  for (const prop of Object.keys(newProperties)) {
    if (!oldProperties[prop]) {
      changes.push({
        type: SchemaChangeType.ADDED,
        path: `${basePath}.properties.${prop}`,
        breaking: newRequired.includes(prop),
        newValue: newProperties[prop],
      });
    } else {
      // Compare property definitions
      const propertyChanges = compareProperties(
        oldProperties[prop],
        newProperties[prop],
        `${basePath}.properties.${prop}`
      );
      changes.push(...propertyChanges);
    }
  }
  
  return changes;
}

/**
 * Compare two property definitions and identify changes
 * 
 * @param oldProperty - Old property definition
 * @param newProperty - New property definition
 * @param basePath - Base path for changes
 * @returns Array of schema changes
 */
function compareProperties(
  oldProperty: PropertyDefinition,
  newProperty: PropertyDefinition,
  basePath: string
): SchemaChange[] {
  const changes: SchemaChange[] = [];
  
  // Compare type
  if (JSON.stringify(oldProperty.type) !== JSON.stringify(newProperty.type)) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.type`,
      breaking: true,
      oldValue: oldProperty.type,
      newValue: newProperty.type,
    });
  }
  
  // Compare nullable
  if (oldProperty.nullable !== newProperty.nullable) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.nullable`,
      breaking: oldProperty.nullable === true && newProperty.nullable === false,
      oldValue: oldProperty.nullable,
      newValue: newProperty.nullable,
    });
  }
  
  // Compare constraints
  if (
    JSON.stringify(oldProperty.stringConstraints) !==
    JSON.stringify(newProperty.stringConstraints)
  ) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.stringConstraints`,
      breaking: true,
      oldValue: oldProperty.stringConstraints,
      newValue: newProperty.stringConstraints,
    });
  }
  
  if (
    JSON.stringify(oldProperty.numberConstraints) !==
    JSON.stringify(newProperty.numberConstraints)
  ) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.numberConstraints`,
      breaking: true,
      oldValue: oldProperty.numberConstraints,
      newValue: newProperty.numberConstraints,
    });
  }
  
  if (
    JSON.stringify(oldProperty.arrayConstraints) !==
    JSON.stringify(newProperty.arrayConstraints)
  ) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.arrayConstraints`,
      breaking: true,
      oldValue: oldProperty.arrayConstraints,
      newValue: newProperty.arrayConstraints,
    });
  }
  
  if (
    JSON.stringify(oldProperty.objectConstraints) !==
    JSON.stringify(newProperty.objectConstraints)
  ) {
    changes.push({
      type: SchemaChangeType.MODIFIED,
      path: `${basePath}.objectConstraints`,
      breaking: true,
      oldValue: oldProperty.objectConstraints,
      newValue: newProperty.objectConstraints,
    });
  }
  
  return changes;
}

/**
 * Migrate a schema to a new version
 * 
 * @param oldSchema - Old schema
 * @param newSchema - New schema
 * @param options - Migration options
 * @returns Migrated schema
 * @throws SchemaVersionError if migration is not possible
 */
export function migrateSchema(
  oldSchema: SchemaDefinition,
  newSchema: SchemaDefinition,
  options: SchemaMigrationOptions = {}
): SchemaDefinition {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Compare schemas
  const changes = compareSchemas(oldSchema, newSchema);
  
  // Check for breaking changes
  if (!opts.allowBreakingChanges) {
    const breakingChanges = changes.filter(change => change.breaking);
    
    if (breakingChanges.length > 0) {
      throw new SchemaVersionError(
        `Migration contains breaking changes: ${breakingChanges.map(c => c.path).join(', ')}`,
        typeof oldSchema.version === 'string' ? oldSchema.version : formatVersion(oldSchema.version),
        typeof newSchema.version === 'string' ? newSchema.version : formatVersion(newSchema.version)
      );
    }
  }
  
  // Update version if needed
  let migratedSchema = { ...newSchema };
  
  if (opts.autoIncrementVersion) {
    const oldVersion = typeof oldSchema.version === 'string'
      ? parseVersion(oldSchema.version)
      : oldSchema.version;
    
    const newVersion = typeof newSchema.version === 'string'
      ? parseVersion(newSchema.version)
      : newSchema.version;
    
    // Check if version needs to be updated
    if (
      oldVersion.major === newVersion.major &&
      oldVersion.minor === newVersion.minor &&
      oldVersion.patch === newVersion.patch
    ) {
      // Increment version based on changes
      const hasBreakingChanges = changes.some(change => change.breaking);
      const hasNewFeatures = changes.some(
        change => change.type === SchemaChangeType.ADDED && !change.breaking
      );
      
      if (hasBreakingChanges) {
        // Major version bump
        newVersion.major += 1;
        newVersion.minor = 0;
        newVersion.patch = 0;
      } else if (hasNewFeatures) {
        // Minor version bump
        newVersion.minor += 1;
        newVersion.patch = 0;
      } else if (changes.length > 0) {
        // Patch version bump
        newVersion.patch += 1;
      }
      
      migratedSchema = {
        ...migratedSchema,
        version: formatVersion(newVersion),
      };
    }
  }
  
  return migratedSchema;
}
