/**
 * Schema parser implementation
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
  EdgeMultiplicity,
  EdgeDirection,
} from './types';
import {
  SchemaParseError,
  SchemaValidationError,
  SchemaVersionError,
  ValidationErrorCollection,
} from './errors';
import { ErrorCollector } from './error-collector';
import {
  isSchemaDefinition,
  isVertexLabel,
  isEdgeLabel,
  isPropertyDefinition,
} from './guards';
import { parseVersion, formatVersion } from './utils';

/**
 * Schema parser configuration
 */
export interface SchemaParserConfig {
  /**
   * Whether to validate the schema after parsing
   */
  validateOnParse?: boolean;

  /**
   * Whether to collect all validation errors instead of failing on the first error
   */
  collectAllErrors?: boolean;

  /**
   * Whether to validate relationship constraints
   */
  validateRelationships?: boolean;

  /**
   * Whether to detect circular dependencies
   */
  detectCircularDependencies?: boolean;

  /**
   * Minimum supported schema version
   */
  minVersion?: string;

  /**
   * Maximum supported schema version
   */
  maxVersion?: string;
}

/**
 * Default schema parser configuration
 */
const DEFAULT_CONFIG: SchemaParserConfig = {
  validateOnParse: true,
  collectAllErrors: true,
  validateRelationships: true,
  detectCircularDependencies: true,
};

/**
 * Schema parser for parsing and validating schema definitions
 */
export class SchemaParser {
  private config: SchemaParserConfig;

  /**
   * Create a new SchemaParser
   *
   * @param config - Parser configuration
   */
  constructor(config: SchemaParserConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse a JSON schema string
   *
   * @param schemaJson - JSON schema string
   * @returns Parsed schema definition
   * @throws SchemaParseError if parsing fails
   * @throws SchemaValidationError if validation fails
   */
  public parse(schemaJson: string): SchemaDefinition {
    try {
      const schema = JSON.parse(schemaJson) as unknown;

      // Check if schema is a valid object with required properties
      if (!schema || typeof schema !== 'object') {
        const error = new SchemaValidationError('Schema must be an object');
        throw new ValidationErrorCollection([error]);
      }

      const schemaObj = schema as Record<string, unknown>;
      const errors: SchemaValidationError[] = [];

      if (!schemaObj.version) {
        errors.push(new SchemaValidationError('Schema must have a version'));
      }

      if (!schemaObj.vertices) {
        errors.push(new SchemaValidationError('Schema must have vertices'));
      }

      if (!schemaObj.edges) {
        errors.push(new SchemaValidationError('Schema must have edges'));
      }

      if (errors.length > 0) {
        throw new ValidationErrorCollection(errors);
      }

      if (this.config.validateOnParse) {
        this.validate(schema);
      }

      return schema as SchemaDefinition;
    } catch (error) {
      if (error instanceof SchemaValidationError || error instanceof ValidationErrorCollection) {
        throw error;
      }

      throw new SchemaParseError('Failed to parse schema JSON', error);
    }
  }

  /**
   * Parse a schema object
   *
   * @param schema - Schema object
   * @returns Validated schema definition
   * @throws SchemaValidationError if validation fails
   */
  public parseObject(schema: unknown): SchemaDefinition {
    // Check if schema is a valid object with required properties
    if (!schema || typeof schema !== 'object') {
      const error = new SchemaValidationError('Schema must be an object');
      throw new ValidationErrorCollection([error]);
    }

    const schemaObj = schema as Record<string, unknown>;
    const errors: SchemaValidationError[] = [];

    if (!schemaObj.version) {
      errors.push(new SchemaValidationError('Schema must have a version'));
    }

    if (!schemaObj.vertices) {
      errors.push(new SchemaValidationError('Schema must have vertices'));
    }

    if (!schemaObj.edges) {
      errors.push(new SchemaValidationError('Schema must have edges'));
    }

    if (errors.length > 0) {
      throw new ValidationErrorCollection(errors);
    }

    if (this.config.validateOnParse) {
      this.validate(schema);
    }

    return schema as SchemaDefinition;
  }

  /**
   * Validate a schema object
   *
   * @param schema - Schema object to validate
   * @throws SchemaValidationError if validation fails
   */
  public validate(schema: unknown): void {
    const errorCollector = new ErrorCollector();

    // Check if schema is a valid object
    if (!schema || typeof schema !== 'object') {
      errorCollector.addValidationError('Schema must be an object');
      errorCollector.throwIfErrors();
      return;
    }

    // Check if schema has required properties
    const schemaObj = schema as Record<string, unknown>;
    if (!schemaObj.version) {
      errorCollector.addValidationError('Schema must have a version');
    }

    if (!schemaObj.vertices) {
      errorCollector.addValidationError('Schema must have vertices');
    }

    if (!schemaObj.edges) {
      errorCollector.addValidationError('Schema must have edges');
    }

    // If basic validation fails, throw immediately
    if (errorCollector.hasErrors()) {
      errorCollector.throwIfErrors();
      return;
    }

    // Perform detailed validation
    this.validateSchema(schema, errorCollector);

    if (this.config.validateRelationships) {
      this.validateRelationships(schema as SchemaDefinition, errorCollector);
    }

    if (this.config.detectCircularDependencies) {
      this.detectCircularDependencies(schema as SchemaDefinition, errorCollector);
    }

    errorCollector.throwIfErrors();
  }

  /**
   * Validate the schema structure
   *
   * @param schema - Schema object to validate
   * @param errorCollector - Error collector
   */
  private validateSchema(schema: unknown, errorCollector: ErrorCollector): void {
    if (!schema || typeof schema !== 'object') {
      errorCollector.addValidationError('Schema must be an object');
      return;
    }

    // Check if schema is a valid SchemaDefinition
    if (!isSchemaDefinition(schema)) {
      errorCollector.addValidationError('Invalid schema structure');
      return;
    }

    // Validate schema version
    this.validateVersion(schema as SchemaDefinition, errorCollector);

    // Validate vertices
    this.validateVertices(schema as SchemaDefinition, errorCollector);

    // Validate edges
    this.validateEdges(schema as SchemaDefinition, errorCollector);
  }

  /**
   * Validate the schema version
   *
   * @param schema - Schema definition
   * @param errorCollector - Error collector
   */
  private validateVersion(schema: SchemaDefinition, errorCollector: ErrorCollector): void {
    errorCollector.withPath('version', () => {
      let version: SchemaVersion;

      if (typeof schema.version === 'string') {
        try {
          version = parseVersion(schema.version);
        } catch (error) {
          errorCollector.addValidationError(`Invalid version string: ${schema.version}`);
          return;
        }
      } else if (typeof schema.version === 'object') {
        version = schema.version;
      } else {
        errorCollector.addValidationError('Version must be a string or object');
        return;
      }

      // Check min version
      if (this.config.minVersion) {
        try {
          const minVersion = parseVersion(this.config.minVersion);

          if (
            version.major < minVersion.major ||
            (version.major === minVersion.major && version.minor < minVersion.minor) ||
            (version.major === minVersion.major && version.minor === minVersion.minor && version.patch < minVersion.patch)
          ) {
            errorCollector.addValidationError(
              `Schema version ${formatVersion(version)} is less than minimum supported version ${this.config.minVersion}`
            );
          }
        } catch (error) {
          // Ignore invalid min version
        }
      }

      // Check max version
      if (this.config.maxVersion) {
        try {
          const maxVersion = parseVersion(this.config.maxVersion);

          if (
            version.major > maxVersion.major ||
            (version.major === maxVersion.major && version.minor > maxVersion.minor) ||
            (version.major === maxVersion.major && version.minor === maxVersion.minor && version.patch > maxVersion.patch)
          ) {
            errorCollector.addValidationError(
              `Schema version ${formatVersion(version)} is greater than maximum supported version ${this.config.maxVersion}`
            );
          }
        } catch (error) {
          // Ignore invalid max version
        }
      }
    });
  }

  /**
   * Validate vertices in the schema
   *
   * @param schema - Schema definition
   * @param errorCollector - Error collector
   */
  private validateVertices(schema: SchemaDefinition, errorCollector: ErrorCollector): void {
    errorCollector.withPath('vertices', () => {
      const { vertices } = schema;

      if (!vertices || typeof vertices !== 'object') {
        errorCollector.addValidationError('Vertices must be an object');
        return;
      }

      // Validate each vertex
      for (const [label, vertex] of Object.entries(vertices)) {
        errorCollector.withPath(label, () => {
          if (!isVertexLabel(vertex)) {
            errorCollector.addValidationError('Invalid vertex definition');
            return;
          }

          // Validate vertex properties
          this.validateProperties(vertex, errorCollector);

          // Validate required properties
          this.validateRequiredProperties(vertex, errorCollector);
        });
      }
    });
  }

  /**
   * Validate edges in the schema
   *
   * @param schema - Schema definition
   * @param errorCollector - Error collector
   */
  private validateEdges(schema: SchemaDefinition, errorCollector: ErrorCollector): void {
    errorCollector.withPath('edges', () => {
      const { edges } = schema;

      if (!edges || typeof edges !== 'object') {
        errorCollector.addValidationError('Edges must be an object');
        return;
      }

      // Validate each edge
      for (const [label, edge] of Object.entries(edges)) {
        errorCollector.withPath(label, () => {
          if (!isEdgeLabel(edge)) {
            errorCollector.addValidationError('Invalid edge definition');
            return;
          }

          // Validate edge properties
          this.validateProperties(edge, errorCollector);

          // Validate required properties
          this.validateRequiredProperties(edge, errorCollector);

          // Validate fromVertex and toVertex
          this.validateVertexReference(edge.fromVertex, 'fromVertex', errorCollector);
          this.validateVertexReference(edge.toVertex, 'toVertex', errorCollector);
        });
      }
    });
  }

  /**
   * Validate properties in a vertex or edge
   *
   * @param entity - Vertex or edge
   * @param errorCollector - Error collector
   */
  private validateProperties(
    entity: VertexLabel | EdgeLabel,
    errorCollector: ErrorCollector
  ): void {
    errorCollector.withPath('properties', () => {
      const { properties } = entity;

      if (!properties || typeof properties !== 'object') {
        errorCollector.addValidationError('Properties must be an object');
        return;
      }

      // Validate each property
      for (const [name, property] of Object.entries(properties)) {
        errorCollector.withPath(name, () => {
          if (!isPropertyDefinition(property)) {
            errorCollector.addValidationError('Invalid property definition');
            return;
          }

          // Validate property type
          this.validatePropertyType(property, errorCollector);

          // Validate property constraints
          this.validatePropertyConstraints(property, errorCollector);
        });
      }
    });
  }

  /**
   * Validate required properties in a vertex or edge
   *
   * @param entity - Vertex or edge
   * @param errorCollector - Error collector
   */
  private validateRequiredProperties(
    entity: VertexLabel | EdgeLabel,
    errorCollector: ErrorCollector
  ): void {
    errorCollector.withPath('required', () => {
      const { required, properties } = entity;

      if (!required) {
        return;
      }

      if (!Array.isArray(required)) {
        errorCollector.addValidationError('Required properties must be an array');
        return;
      }

      // Check that all required properties exist
      for (const property of required) {
        if (typeof property !== 'string') {
          errorCollector.addValidationError(`Required property must be a string: ${property}`);
          continue;
        }

        if (!properties[property]) {
          errorCollector.addValidationError(`Required property not found: ${property}`);
        }
      }
    });
  }

  /**
   * Validate a vertex reference
   *
   * @param reference - Vertex reference
   * @param field - Field name
   * @param errorCollector - Error collector
   */
  private validateVertexReference(
    reference: string | { label: string; properties?: Record<string, unknown> },
    field: string,
    errorCollector: ErrorCollector
  ): void {
    errorCollector.withPath(field, () => {
      if (typeof reference === 'string') {
        // Simple reference, nothing to validate here
        return;
      }

      if (!reference || typeof reference !== 'object') {
        errorCollector.addValidationError('Vertex reference must be a string or object');
        return;
      }

      if (!reference.label || typeof reference.label !== 'string') {
        errorCollector.addValidationError('Vertex reference must have a label property');
        return;
      }

      if (reference.properties && typeof reference.properties !== 'object') {
        errorCollector.addValidationError('Vertex reference properties must be an object');
      }
    });
  }

  /**
   * Validate a property type
   *
   * @param property - Property definition
   * @param errorCollector - Error collector
   */
  private validatePropertyType(
    property: PropertyDefinition,
    errorCollector: ErrorCollector
  ): void {
    errorCollector.withPath('type', () => {
      const { type } = property;

      if (Array.isArray(type)) {
        // Union type
        for (const t of type) {
          if (!Object.values(PropertyType).includes(t)) {
            errorCollector.addValidationError(`Invalid property type: ${t}`);
          }
        }
      } else if (!Object.values(PropertyType).includes(type)) {
        errorCollector.addValidationError(`Invalid property type: ${type}`);
      }
    });
  }

  /**
   * Validate property constraints
   *
   * @param property - Property definition
   * @param errorCollector - Error collector
   */
  private validatePropertyConstraints(
    property: PropertyDefinition,
    errorCollector: ErrorCollector
  ): void {
    const { type } = property;

    // Validate string constraints
    if (
      (type === PropertyType.STRING || (Array.isArray(type) && type.includes(PropertyType.STRING))) &&
      property.stringConstraints
    ) {
      errorCollector.withPath('stringConstraints', () => {
        const { stringConstraints } = property;

        if (typeof stringConstraints !== 'object') {
          errorCollector.addValidationError('String constraints must be an object');
          return;
        }

        if (
          stringConstraints.minLength !== undefined &&
          (typeof stringConstraints.minLength !== 'number' || stringConstraints.minLength < 0)
        ) {
          errorCollector.addValidationError('minLength must be a non-negative number');
        }

        if (
          stringConstraints.maxLength !== undefined &&
          (typeof stringConstraints.maxLength !== 'number' || stringConstraints.maxLength < 0)
        ) {
          errorCollector.addValidationError('maxLength must be a non-negative number');
        }

        if (
          stringConstraints.minLength !== undefined &&
          stringConstraints.maxLength !== undefined &&
          stringConstraints.minLength > stringConstraints.maxLength
        ) {
          errorCollector.addValidationError('minLength must be less than or equal to maxLength');
        }

        if (
          stringConstraints.pattern !== undefined &&
          typeof stringConstraints.pattern !== 'string'
        ) {
          errorCollector.addValidationError('pattern must be a string');
        } else if (stringConstraints.pattern !== undefined) {
          try {
            new RegExp(stringConstraints.pattern);
          } catch (error) {
            errorCollector.addValidationError(`Invalid regular expression pattern: ${stringConstraints.pattern}`);
          }
        }

        if (
          stringConstraints.enum !== undefined &&
          (!Array.isArray(stringConstraints.enum) || !stringConstraints.enum.every(v => typeof v === 'string'))
        ) {
          errorCollector.addValidationError('enum must be an array of strings');
        }
      });
    }

    // Validate number constraints
    if (
      ((type === PropertyType.NUMBER || type === PropertyType.INTEGER) ||
       (Array.isArray(type) && (type.includes(PropertyType.NUMBER) || type.includes(PropertyType.INTEGER)))) &&
      property.numberConstraints
    ) {
      errorCollector.withPath('numberConstraints', () => {
        const { numberConstraints } = property;

        if (typeof numberConstraints !== 'object') {
          errorCollector.addValidationError('Number constraints must be an object');
          return;
        }

        if (
          numberConstraints.minimum !== undefined &&
          typeof numberConstraints.minimum !== 'number'
        ) {
          errorCollector.addValidationError('minimum must be a number');
        }

        if (
          numberConstraints.maximum !== undefined &&
          typeof numberConstraints.maximum !== 'number'
        ) {
          errorCollector.addValidationError('maximum must be a number');
        }

        if (
          numberConstraints.minimum !== undefined &&
          numberConstraints.maximum !== undefined &&
          numberConstraints.minimum > numberConstraints.maximum
        ) {
          errorCollector.addValidationError('minimum must be less than or equal to maximum');
        }

        if (
          numberConstraints.exclusiveMinimum !== undefined &&
          typeof numberConstraints.exclusiveMinimum !== 'boolean'
        ) {
          errorCollector.addValidationError('exclusiveMinimum must be a boolean');
        }

        if (
          numberConstraints.exclusiveMaximum !== undefined &&
          typeof numberConstraints.exclusiveMaximum !== 'boolean'
        ) {
          errorCollector.addValidationError('exclusiveMaximum must be a boolean');
        }

        if (
          numberConstraints.multipleOf !== undefined &&
          (typeof numberConstraints.multipleOf !== 'number' || numberConstraints.multipleOf <= 0)
        ) {
          errorCollector.addValidationError('multipleOf must be a positive number');
        }

        if (
          numberConstraints.enum !== undefined &&
          (!Array.isArray(numberConstraints.enum) || !numberConstraints.enum.every(v => typeof v === 'number'))
        ) {
          errorCollector.addValidationError('enum must be an array of numbers');
        }
      });
    }

    // Validate array constraints
    if (
      (type === PropertyType.ARRAY || (Array.isArray(type) && type.includes(PropertyType.ARRAY))) &&
      property.arrayConstraints
    ) {
      errorCollector.withPath('arrayConstraints', () => {
        const { arrayConstraints } = property;

        if (typeof arrayConstraints !== 'object') {
          errorCollector.addValidationError('Array constraints must be an object');
          return;
        }

        if (
          arrayConstraints.minItems !== undefined &&
          (typeof arrayConstraints.minItems !== 'number' || arrayConstraints.minItems < 0)
        ) {
          errorCollector.addValidationError('minItems must be a non-negative number');
        }

        if (
          arrayConstraints.maxItems !== undefined &&
          (typeof arrayConstraints.maxItems !== 'number' || arrayConstraints.maxItems < 0)
        ) {
          errorCollector.addValidationError('maxItems must be a non-negative number');
        }

        if (
          arrayConstraints.minItems !== undefined &&
          arrayConstraints.maxItems !== undefined &&
          arrayConstraints.minItems > arrayConstraints.maxItems
        ) {
          errorCollector.addValidationError('minItems must be less than or equal to maxItems');
        }

        if (
          arrayConstraints.uniqueItems !== undefined &&
          typeof arrayConstraints.uniqueItems !== 'boolean'
        ) {
          errorCollector.addValidationError('uniqueItems must be a boolean');
        }

        if (arrayConstraints.items !== undefined) {
          errorCollector.withPath('items', () => {
            if (!isPropertyDefinition(arrayConstraints.items)) {
              errorCollector.addValidationError('items must be a valid property definition');
            } else {
              this.validatePropertyType(arrayConstraints.items, errorCollector);
              this.validatePropertyConstraints(arrayConstraints.items, errorCollector);
            }
          });
        }
      });
    }

    // Validate object constraints
    if (
      (type === PropertyType.OBJECT || (Array.isArray(type) && type.includes(PropertyType.OBJECT))) &&
      property.objectConstraints
    ) {
      errorCollector.withPath('objectConstraints', () => {
        const { objectConstraints } = property;

        if (typeof objectConstraints !== 'object') {
          errorCollector.addValidationError('Object constraints must be an object');
          return;
        }

        if (objectConstraints.required !== undefined) {
          if (!Array.isArray(objectConstraints.required) || !objectConstraints.required.every(v => typeof v === 'string')) {
            errorCollector.addValidationError('required must be an array of strings');
          }
        }

        if (objectConstraints.properties !== undefined) {
          errorCollector.withPath('properties', () => {
            if (typeof objectConstraints.properties !== 'object' || objectConstraints.properties === null) {
              errorCollector.addValidationError('properties must be an object');
              return;
            }

            for (const [name, property] of Object.entries(objectConstraints.properties)) {
              errorCollector.withPath(name, () => {
                if (!isPropertyDefinition(property)) {
                  errorCollector.addValidationError('Invalid property definition');
                } else {
                  this.validatePropertyType(property, errorCollector);
                  this.validatePropertyConstraints(property, errorCollector);
                }
              });
            }
          });
        }

        if (
          objectConstraints.additionalProperties !== undefined &&
          typeof objectConstraints.additionalProperties !== 'boolean' &&
          !isPropertyDefinition(objectConstraints.additionalProperties)
        ) {
          errorCollector.addValidationError('additionalProperties must be a boolean or a property definition');
        }
      });
    }
  }

  /**
   * Validate relationship constraints
   *
   * @param schema - Schema definition
   * @param errorCollector - Error collector
   */
  private validateRelationships(schema: SchemaDefinition, errorCollector: ErrorCollector): void {
    errorCollector.withPath('relationships', () => {
      const { vertices, edges } = schema;

      // Check that all referenced vertices exist
      for (const [edgeLabel, edge] of Object.entries(edges)) {
        errorCollector.withPath(edgeLabel, () => {
          // Check fromVertex
          const fromLabel = typeof edge.fromVertex === 'string' ? edge.fromVertex : edge.fromVertex.label;

          if (!vertices[fromLabel]) {
            errorCollector.addInvalidRelationship(
              edgeLabel,
              `fromVertex references non-existent vertex label: ${fromLabel}`
            );
          }

          // Check toVertex
          const toLabel = typeof edge.toVertex === 'string' ? edge.toVertex : edge.toVertex.label;

          if (!vertices[toLabel]) {
            errorCollector.addInvalidRelationship(
              edgeLabel,
              `toVertex references non-existent vertex label: ${toLabel}`
            );
          }
        });
      }
    });
  }

  /**
   * Detect circular dependencies in the schema
   *
   * @param schema - Schema definition
   * @param errorCollector - Error collector
   */
  private detectCircularDependencies(schema: SchemaDefinition, errorCollector: ErrorCollector): void {
    errorCollector.withPath('circularDependencies', () => {
      const { vertices, edges } = schema;

      // Build a graph of vertex dependencies
      const graph: Record<string, string[]> = {};

      // Initialize graph with all vertices
      for (const vertexLabel of Object.keys(vertices)) {
        graph[vertexLabel] = [];
      }

      // Add edges to the graph
      for (const edge of Object.values(edges)) {
        const fromLabel = typeof edge.fromVertex === 'string' ? edge.fromVertex : edge.fromVertex.label;
        const toLabel = typeof edge.toVertex === 'string' ? edge.toVertex : edge.toVertex.label;

        if (vertices[fromLabel] && vertices[toLabel]) {
          graph[fromLabel].push(toLabel);
        }
      }

      // Detect cycles using DFS
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const detectCycle = (vertex: string, path: string[] = []): string[] | null => {
        if (!visited.has(vertex)) {
          visited.add(vertex);
          recursionStack.add(vertex);
          path.push(vertex);

          for (const neighbor of graph[vertex] || []) {
            if (!visited.has(neighbor)) {
              const cycle = detectCycle(neighbor, [...path]);
              if (cycle) {
                return cycle;
              }
            } else if (recursionStack.has(neighbor)) {
              // Found a cycle
              const cycleStart = path.indexOf(neighbor);
              return path.slice(cycleStart).concat(neighbor);
            }
          }
        }

        recursionStack.delete(vertex);
        return null;
      };

      // Check each vertex for cycles
      for (const vertex of Object.keys(graph)) {
        if (!visited.has(vertex)) {
          const cycle = detectCycle(vertex);
          if (cycle) {
            errorCollector.addCircularDependency(cycle);
          }
        }
      }
    });
  }
}
