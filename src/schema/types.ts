/**
 * Type definitions for schema components
 * 
 * @packageDocumentation
 */

/**
 * Schema version information
 */
export interface SchemaVersion {
  /**
   * Major version number (incremented for breaking changes)
   */
  major: number;
  
  /**
   * Minor version number (incremented for backwards-compatible feature additions)
   */
  minor: number;
  
  /**
   * Patch version number (incremented for backwards-compatible bug fixes)
   */
  patch: number;
  
  /**
   * Pre-release identifier (e.g., 'alpha', 'beta')
   */
  prerelease?: string;
  
  /**
   * Build metadata
   */
  build?: string;
}

/**
 * Schema metadata information
 */
export interface SchemaMetadata {
  /**
   * Schema author
   */
  author?: string;
  
  /**
   * Schema description
   */
  description?: string;
  
  /**
   * Creation timestamp
   */
  created?: string;
  
  /**
   * Last updated timestamp
   */
  updated?: string;
  
  /**
   * Additional custom metadata
   */
  [key: string]: unknown;
}

/**
 * Property data types
 */
export enum PropertyType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  OBJECT = 'object',
  ARRAY = 'array',
  ANY = 'any',
}

/**
 * String property constraints
 */
export interface StringConstraints {
  /**
   * Minimum string length
   */
  minLength?: number;
  
  /**
   * Maximum string length
   */
  maxLength?: number;
  
  /**
   * Regular expression pattern
   */
  pattern?: string;
  
  /**
   * Enumerated allowed values
   */
  enum?: string[];
  
  /**
   * Format validation (e.g., 'email', 'uri')
   */
  format?: string;
}

/**
 * Number property constraints
 */
export interface NumberConstraints {
  /**
   * Minimum value
   */
  minimum?: number;
  
  /**
   * Maximum value
   */
  maximum?: number;
  
  /**
   * Whether the minimum value is exclusive
   */
  exclusiveMinimum?: boolean;
  
  /**
   * Whether the maximum value is exclusive
   */
  exclusiveMaximum?: boolean;
  
  /**
   * Multiple of value
   */
  multipleOf?: number;
  
  /**
   * Enumerated allowed values
   */
  enum?: number[];
}

/**
 * Array property constraints
 */
export interface ArrayConstraints {
  /**
   * Minimum array length
   */
  minItems?: number;
  
  /**
   * Maximum array length
   */
  maxItems?: number;
  
  /**
   * Whether array items must be unique
   */
  uniqueItems?: boolean;
  
  /**
   * Item type definition
   */
  items?: PropertyDefinition;
}

/**
 * Object property constraints
 */
export interface ObjectConstraints {
  /**
   * Required properties
   */
  required?: string[];
  
  /**
   * Property definitions
   */
  properties?: Record<string, PropertyDefinition>;
  
  /**
   * Additional properties schema
   */
  additionalProperties?: boolean | PropertyDefinition;
}

/**
 * Property definition
 */
export interface PropertyDefinition {
  /**
   * Property data type
   */
  type: PropertyType | PropertyType[];
  
  /**
   * Property description
   */
  description?: string;
  
  /**
   * Default value
   */
  default?: unknown;
  
  /**
   * Whether the property can be null
   */
  nullable?: boolean;
  
  /**
   * String constraints (for string properties)
   */
  stringConstraints?: StringConstraints;
  
  /**
   * Number constraints (for number properties)
   */
  numberConstraints?: NumberConstraints;
  
  /**
   * Array constraints (for array properties)
   */
  arrayConstraints?: ArrayConstraints;
  
  /**
   * Object constraints (for object properties)
   */
  objectConstraints?: ObjectConstraints;
  
  /**
   * Custom validation function name
   */
  customValidator?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Edge multiplicity types
 */
export enum EdgeMultiplicity {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
  MANY_TO_MANY = 'MANY_TO_MANY',
}

/**
 * Edge direction types
 */
export enum EdgeDirection {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

/**
 * Vertex connection constraint
 */
export interface VertexConnectionConstraint {
  /**
   * Vertex label
   */
  label: string;
  
  /**
   * Optional property constraints
   */
  properties?: Record<string, unknown>;
}

/**
 * Vertex label definition
 */
export interface VertexLabel {
  /**
   * Vertex properties
   */
  properties: Record<string, PropertyDefinition>;
  
  /**
   * Required properties
   */
  required?: string[];
  
  /**
   * Vertex description
   */
  description?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Edge label definition
 */
export interface EdgeLabel {
  /**
   * Edge properties
   */
  properties: Record<string, PropertyDefinition>;
  
  /**
   * Required properties
   */
  required?: string[];
  
  /**
   * Source vertex constraint
   */
  fromVertex: VertexConnectionConstraint | string;
  
  /**
   * Target vertex constraint
   */
  toVertex: VertexConnectionConstraint | string;
  
  /**
   * Edge multiplicity
   */
  multiplicity?: EdgeMultiplicity;
  
  /**
   * Edge direction
   */
  direction?: EdgeDirection;
  
  /**
   * Edge description
   */
  description?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Top-level schema definition
 */
export interface SchemaDefinition {
  /**
   * Schema version
   */
  version: string | SchemaVersion;
  
  /**
   * Vertex label definitions
   */
  vertices: Record<string, VertexLabel>;
  
  /**
   * Edge label definitions
   */
  edges: Record<string, EdgeLabel>;
  
  /**
   * Schema metadata
   */
  metadata?: SchemaMetadata;
}
