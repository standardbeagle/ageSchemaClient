/**
 * Schema validator implementation for validating vertex and edge data against schema definitions
 *
 * This module provides functionality to validate data against schema definitions before loading
 * into the graph database. It supports validation of property types, required properties, and
 * constraints.
 *
 * @packageDocumentation
 */

import {
  SchemaDefinition,
  VertexLabel,
  EdgeLabel,
  PropertyDefinition,
  PropertyType,
} from './types';
import { ValidationResult, createSuccessResult, createFailureResult } from './validator-result';

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
}

/**
 * Schema validator configuration
 */
export interface SchemaValidatorConfig {
  /**
   * Whether to collect all validation errors instead of failing on the first error
   */
  collectAllErrors?: boolean;

  /**
   * Whether to validate data types
   */
  validateTypes?: boolean;

  /**
   * Whether to validate required properties
   */
  validateRequired?: boolean;

  /**
   * Whether to validate constraints
   */
  validateConstraints?: boolean;

  /**
   * Whether to allow unknown properties
   */
  allowUnknownProperties?: boolean;
}

/**
 * Default schema validator configuration
 */
const DEFAULT_CONFIG: SchemaValidatorConfig = {
  collectAllErrors: true,
  validateTypes: true,
  validateRequired: true,
  validateConstraints: true,
  allowUnknownProperties: false,
};

/**
 * Validation error information
 */
export interface ValidationErrorInfo {
  /**
   * Index of the item in the array (if validating an array)
   */
  index?: number;

  /**
   * ID of the item (if available)
   */
  id?: string;

  /**
   * From ID for edges
   */
  from?: string;

  /**
   * To ID for edges
   */
  to?: string;

  /**
   * List of error messages
   */
  errors: string[];
}

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: ValidationErrorInfo[];
}

/**
 * Schema validator for validating data against schema definitions
 */
export class SchemaValidator {
  private schema: Schema;
  private config: SchemaValidatorConfig;

  /**
   * Create a new SchemaValidator
   *
   * @param schema - Schema to validate against
   * @param config - Validator configuration
   */
  constructor(schema: Schema, config: SchemaValidatorConfig = {}) {
    this.schema = schema;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate vertices against the schema
   *
   * @param vertexType - Vertex type
   * @param vertices - Array of vertices to validate
   * @returns Validation result
   */
  validateVertices(vertexType: string, vertices: any[]): ValidationResult {
    const vertexSchema = this.schema.getVertexSchema(vertexType);
    if (!vertexSchema) {
      return {
        valid: false,
        errors: [{ errors: [`Unknown vertex type: ${vertexType}`] }]
      };
    }

    const errors: ValidationErrorInfo[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];
      const vertexErrors = this.validateObject(vertex, vertexSchema.properties, vertexSchema.required);

      if (vertexErrors.length > 0) {
        errors.push({
          index: i,
          id: vertex.id,
          errors: vertexErrors
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate edges against the schema
   *
   * @param edgeType - Edge type
   * @param edges - Array of edges to validate
   * @returns Validation result
   */
  validateEdges(edgeType: string, edges: any[]): ValidationResult {
    const edgeSchema = this.schema.getEdgeSchema(edgeType);
    if (!edgeSchema) {
      return {
        valid: false,
        errors: [{ errors: [`Unknown edge type: ${edgeType}`] }]
      };
    }

    const errors: ValidationErrorInfo[] = [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const edgeErrors: string[] = [];

      // Ensure from and to properties exist
      if (!edge.from) edgeErrors.push('Missing required property: from');
      if (!edge.to) edgeErrors.push('Missing required property: to');

      // Validate properties against schema
      const propertyErrors = this.validateObject(edge, edgeSchema.properties, edgeSchema.required);
      edgeErrors.push(...propertyErrors);

      if (edgeErrors.length > 0) {
        errors.push({
          index: i,
          from: edge.from,
          to: edge.to,
          errors: edgeErrors
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate an object against a schema
   *
   * @param obj - Object to validate
   * @param schema - Schema to validate against
   * @param required - List of required properties
   * @returns Array of validation error messages
   */
  private validateObject(obj: any, schema: Record<string, PropertyDefinition>, required?: string[]): string[] {
    const errors: string[] = [];

    // Check required properties
    if (this.config.validateRequired && required) {
      for (const prop of required) {
        if (obj[prop] === undefined || obj[prop] === null) {
          errors.push(`Missing required property: ${prop}`);
        }
      }
    }

    // Validate properties
    for (const [prop, value] of Object.entries(obj)) {
      // Skip from/to properties as they are handled separately for edges
      if (prop === 'from' || prop === 'to') {
        continue;
      }

      const propSchema = schema[prop];

      if (!propSchema) {
        if (!this.config.allowUnknownProperties) {
          errors.push(`Unknown property: ${prop}`);
        }
        continue;
      }

      if (value !== undefined && value !== null) {
        // Validate property type
        if (this.config.validateTypes) {
          const typeErrors = this.validatePropertyType(value, propSchema.type);
          if (typeErrors) {
            errors.push(`${prop}: ${typeErrors}`);
          }
        }

        // Validate constraints
        if (this.config.validateConstraints) {
          const constraintErrors = this.validatePropertyConstraints(prop, value, propSchema);
          errors.push(...constraintErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Validate a property value against a property type
   *
   * @param value - Property value
   * @param type - Property type
   * @returns Error message or undefined if valid
   */
  private validatePropertyType(value: any, type: PropertyType | PropertyType[]): string | undefined {
    // Handle array of types
    if (Array.isArray(type)) {
      for (const t of type) {
        if (!this.validatePropertyType(value, t)) {
          return undefined; // Valid if it matches any type
        }
      }
      return `Invalid type: expected one of [${type.join(', ')}]`;
    }

    // Handle single type
    switch (type) {
      case PropertyType.STRING:
        return typeof value === 'string' ? undefined : `Invalid type: expected string`;
      case PropertyType.NUMBER:
      case PropertyType.INTEGER:
      case PropertyType.FLOAT:
        return typeof value === 'number' ? undefined : `Invalid type: expected number`;
      case PropertyType.BOOLEAN:
        return typeof value === 'boolean' ? undefined : `Invalid type: expected boolean`;
      case PropertyType.DATE:
      case PropertyType.DATETIME:
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))
          ? undefined
          : `Invalid type: expected date`;
      case PropertyType.OBJECT:
        return typeof value === 'object' && value !== null && !Array.isArray(value)
          ? undefined
          : `Invalid type: expected object`;
      case PropertyType.ARRAY:
        return Array.isArray(value) ? undefined : `Invalid type: expected array`;
      case PropertyType.ANY:
        return undefined; // Always valid
      default:
        return `Unknown type: ${type}`;
    }
  }

  /**
   * Validate property constraints
   *
   * @param property - Property name
   * @param value - Property value
   * @param definition - Property definition
   * @returns Array of validation error messages
   */
  private validatePropertyConstraints(property: string, value: any, definition: PropertyDefinition): string[] {
    const errors: string[] = [];

    // String constraints
    if (typeof value === 'string' && definition.stringConstraints) {
      const { minLength, maxLength, pattern, enum: enumValues, format } = definition.stringConstraints;

      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${property}: String length must be at least ${minLength}`);
      }

      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${property}: String length must be at most ${maxLength}`);
      }

      if (pattern && !new RegExp(pattern).test(value)) {
        errors.push(`${property}: String must match pattern ${pattern}`);
      }

      if (enumValues && !enumValues.includes(value)) {
        errors.push(`${property}: String must be one of [${enumValues.join(', ')}]`);
      }

      // Basic format validation
      if (format) {
        if (format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${property}: Invalid email format`);
        } else if (format === 'uri' && !/^https?:\/\//.test(value)) {
          errors.push(`${property}: Invalid URI format`);
        }
      }
    }

    // Number constraints
    if (typeof value === 'number' && definition.numberConstraints) {
      const {
        minimum,
        maximum,
        exclusiveMinimum,
        exclusiveMaximum,
        multipleOf,
        enum: enumValues
      } = definition.numberConstraints;

      if (minimum !== undefined) {
        if (exclusiveMinimum && value <= minimum) {
          errors.push(`${property}: Number must be greater than ${minimum}`);
        } else if (!exclusiveMinimum && value < minimum) {
          errors.push(`${property}: Number must be at least ${minimum}`);
        }
      }

      if (maximum !== undefined) {
        if (exclusiveMaximum && value >= maximum) {
          errors.push(`${property}: Number must be less than ${maximum}`);
        } else if (!exclusiveMaximum && value > maximum) {
          errors.push(`${property}: Number must be at most ${maximum}`);
        }
      }

      if (multipleOf !== undefined && value % multipleOf !== 0) {
        errors.push(`${property}: Number must be a multiple of ${multipleOf}`);
      }

      if (enumValues && !enumValues.includes(value)) {
        errors.push(`${property}: Number must be one of [${enumValues.join(', ')}]`);
      }
    }

    // Array constraints
    if (Array.isArray(value) && definition.arrayConstraints) {
      const { minItems, maxItems, uniqueItems, items } = definition.arrayConstraints;

      if (minItems !== undefined && value.length < minItems) {
        errors.push(`${property}: Array must have at least ${minItems} items`);
      }

      if (maxItems !== undefined && value.length > maxItems) {
        errors.push(`${property}: Array must have at most ${maxItems} items`);
      }

      if (uniqueItems && new Set(value).size !== value.length) {
        errors.push(`${property}: Array items must be unique`);
      }

      // Validate array items if item schema is provided
      if (items) {
        for (let i = 0; i < value.length; i++) {
          const itemValue = value[i];
          if (this.config.validateTypes) {
            const typeError = this.validatePropertyType(itemValue, items.type);
            if (typeError) {
              errors.push(`${property}[${i}]: ${typeError}`);
            }
          }
        }
      }
    }

    return errors;
  }
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
}
