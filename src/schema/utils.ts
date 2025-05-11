/**
 * Utility types for schema traversal and manipulation
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
} from './types';

/**
 * Extract a vertex type from a schema
 * 
 * @template S - Schema definition type
 * @template L - Vertex label
 */
export type ExtractVertexType<
  S extends SchemaDefinition,
  L extends keyof S['vertices']
> = S['vertices'][L];

/**
 * Extract an edge type from a schema
 * 
 * @template S - Schema definition type
 * @template L - Edge label
 */
export type ExtractEdgeType<
  S extends SchemaDefinition,
  L extends keyof S['edges']
> = S['edges'][L];

/**
 * Extract property type from a property definition
 * 
 * @template P - Property definition
 */
export type PropertyTypeOf<P extends PropertyDefinition> =
  P['type'] extends PropertyType.STRING ? string :
  P['type'] extends PropertyType.NUMBER ? number :
  P['type'] extends PropertyType.INTEGER ? number :
  P['type'] extends PropertyType.BOOLEAN ? boolean :
  P['type'] extends PropertyType.DATE ? Date :
  P['type'] extends PropertyType.DATETIME ? Date :
  P['type'] extends PropertyType.OBJECT ? Record<string, unknown> :
  P['type'] extends PropertyType.ARRAY ? Array<unknown> :
  P['type'] extends PropertyType.ANY ? unknown :
  P['type'] extends (infer U)[] ? U extends PropertyType ? PropertyTypeOf<{ type: U }> : never :
  unknown;

/**
 * Extract vertex property types
 * 
 * @template V - Vertex label
 */
export type VertexProperties<V extends VertexLabel> = {
  [K in keyof V['properties']]: PropertyTypeOf<V['properties'][K]>;
};

/**
 * Extract edge property types
 * 
 * @template E - Edge label
 */
export type EdgeProperties<E extends EdgeLabel> = {
  [K in keyof E['properties']]: PropertyTypeOf<E['properties'][K]>;
};

/**
 * Extract connected vertex labels for an edge
 * 
 * @template S - Schema definition
 * @template E - Edge label
 */
export type ConnectedVertices<
  S extends SchemaDefinition,
  E extends keyof S['edges']
> = {
  from: S['edges'][E]['fromVertex'] extends string ? S['edges'][E]['fromVertex'] : never;
  to: S['edges'][E]['toVertex'] extends string ? S['edges'][E]['toVertex'] : never;
};

/**
 * Make certain properties required
 * 
 * @template T - Object type
 * @template K - Keys to make required
 */
export type RequiredProperties<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/**
 * Parse version string into SchemaVersion object
 * 
 * @param version - Version string (e.g., '1.0.0', '2.1.0-alpha.1')
 * @returns Parsed version object
 */
export function parseVersion(version: string): SchemaVersion {
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = version.match(regex);
  
  if (!match) {
    throw new Error(`Invalid version string: ${version}`);
  }
  
  const [, major, minor, patch, prerelease, build] = match;
  
  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
    build,
  };
}

/**
 * Format SchemaVersion object as a string
 * 
 * @param version - Version object
 * @returns Formatted version string
 */
export function formatVersion(version: SchemaVersion): string {
  let versionString = `${version.major}.${version.minor}.${version.patch}`;
  
  if (version.prerelease) {
    versionString += `-${version.prerelease}`;
  }
  
  if (version.build) {
    versionString += `+${version.build}`;
  }
  
  return versionString;
}
