/**
 * Schema validator implementation
 *
 * @packageDocumentation
 */

import {
  SchemaDefinition,


  PropertyDefinition,
  PropertyType,
} from './types';

import { ErrorCollector } from './error-collector';
import { ValidationResult, createSuccessResult, createFailureResult } from './validator-result';

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
 * Schema validator for validating data against schema definitions
 */
export class SchemaValidator {
  private config: SchemaValidatorConfig;
  private schema: SchemaDefinition;

  /**
   * Create a new SchemaValidator
   *
   * @param schema - Schema definition
   * @param config - Validator configuration
   */
  constructor(schema: SchemaDefinition, config: SchemaValidatorConfig = {}) {
    this.schema = schema;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate a vertex against the schema
   *
   * @param label - Vertex label
   * @param data - Vertex data
   * @returns Validation result
   * @throws SchemaValidationError if validation fails and throwOnError is true
   */
  public validateVertex(label: string, data: unknown, throwOnError: boolean = true): ValidationResult {
    const errorCollector = new ErrorCollector();

    this.validateVertexInternal(label, data, errorCollector);

    if (errorCollector.hasErrors()) {
      if (throwOnError) {
        errorCollector.throwIfErrors();
      }

      return createFailureResult(errorCollector.getErrors().map(error => ({
        message: error.message,
        path: error.path || errorCollector.getCurrentPath() || '',
        type: error.constructor.name
      })));
    }

    return createSuccessResult();
  }

  /**
   * Validate an edge against the schema
   *
   * @param label - Edge label
   * @param data - Edge data
   * @param throwOnError - Whether to throw an error if validation fails
   * @returns Validation result
   * @throws SchemaValidationError if validation fails and throwOnError is true
   */
  public validateEdge(label: string, data: unknown, throwOnError: boolean = true): ValidationResult {
    const errorCollector = new ErrorCollector();

    this.validateEdgeInternal(label, data, errorCollector);

    if (errorCollector.hasErrors()) {
      if (throwOnError) {
        errorCollector.throwIfErrors();
      }

      return createFailureResult(errorCollector.getErrors().map(error => ({
        message: error.message,
        path: error.path || errorCollector.getCurrentPath() || '',
        type: error.constructor.name
      })));
    }

    return createSuccessResult();
  }

  /**
   * Validate a vertex against the schema and throw an error if validation fails
   *
   * @param label - Vertex label
   * @param data - Vertex data
   * @throws SchemaValidationError if validation fails
   */
  public validateVertexAndThrow(label: string, data: unknown): void {
    const errorCollector = new ErrorCollector();

    this.validateVertexInternal(label, data, errorCollector);

    errorCollector.throwIfErrors();
  }

  /**
   * Validate an edge against the schema and throw an error if validation fails
   *
   * @param label - Edge label
   * @param data - Edge data
   * @throws SchemaValidationError if validation fails
   */
  public validateEdgeAndThrow(label: string, data: unknown): void {
    const errorCollector = new ErrorCollector();

    this.validateEdgeInternal(label, data, errorCollector);

    errorCollector.throwIfErrors();
  }

  /**
   * Validate a property value against a property definition
   *
   * @param property - Property name
   * @param definition - Property definition
   * @param value - Property value
   * @param throwOnError - Whether to throw an error if validation fails
   * @returns Validation result
   * @throws SchemaValidationError if validation fails and throwOnError is true
   */
  public validateProperty(
    property: string,
    definition: PropertyDefinition,
    value: unknown,
    throwOnError: boolean = true
  ): ValidationResult {
    const errorCollector = new ErrorCollector();

    this.validatePropertyInternal(property, definition, value, errorCollector);

    if (errorCollector.hasErrors()) {
      if (throwOnError) {
        errorCollector.throwIfErrors();
      }

      return createFailureResult(errorCollector.getErrors().map(error => ({
        message: error.message,
        path: error.path || errorCollector.getCurrentPath() || '',
        type: error.constructor.name
      })));
    }

    return createSuccessResult();
  }

  /**
   * Validate a property value against a property definition and throw an error if validation fails
   *
   * @param property - Property name
   * @param definition - Property definition
   * @param value - Property value
   * @throws SchemaValidationError if validation fails
   */
  public validatePropertyAndThrow(property: string, definition: PropertyDefinition, value: unknown): void {
    const errorCollector = new ErrorCollector();

    this.validatePropertyInternal(property, definition, value, errorCollector);

    errorCollector.throwIfErrors();
  }

  /**
   * Validate a vertex against the schema (internal implementation)
   *
   * @param label - Vertex label
   * @param data - Vertex data
   * @param errorCollector - Error collector
   */
  private validateVertexInternal(label: string, data: unknown, errorCollector: ErrorCollector): void {
    errorCollector.withPath(`vertex(${label})`, () => {
      const vertexDefinition = this.schema.vertices[label];

      if (!vertexDefinition) {
        errorCollector.addValidationError(`Unknown vertex label: ${label}`);
        return;
      }

      if (!data || typeof data !== 'object') {
        errorCollector.addValidationError('Vertex data must be an object');
        return;
      }

      const dataObj = data as Record<string, unknown>;

      // Validate required properties
      if (this.config.validateRequired && vertexDefinition.required) {
        for (const requiredProp of vertexDefinition.required) {
          if (dataObj[requiredProp] === undefined) {
            errorCollector.addMissingRequiredProperty(requiredProp);
          }
        }
      }

      // Validate properties
      for (const [prop, value] of Object.entries(dataObj)) {
        const propDefinition = vertexDefinition.properties[prop];

        if (!propDefinition) {
          if (!this.config.allowUnknownProperties) {
            errorCollector.addValidationError(`Unknown property: ${prop}`);
          }
          continue;
        }

        this.validatePropertyInternal(prop, propDefinition, value, errorCollector);
      }
    });
  }

  /**
   * Validate an edge against the schema (internal implementation)
   *
   * @param label - Edge label
   * @param data - Edge data
   * @param errorCollector - Error collector
   */
  private validateEdgeInternal(label: string, data: unknown, errorCollector: ErrorCollector): void {
    errorCollector.withPath(`edge(${label})`, () => {
      const edgeDefinition = this.schema.edges[label];

      if (!edgeDefinition) {
        errorCollector.addValidationError(`Unknown edge label: ${label}`);
        return;
      }

      if (!data || typeof data !== 'object') {
        errorCollector.addValidationError('Edge data must be an object');
        return;
      }

      const dataObj = data as Record<string, unknown>;

      // Validate required properties
      if (this.config.validateRequired && edgeDefinition.required) {
        for (const requiredProp of edgeDefinition.required) {
          if (dataObj[requiredProp] === undefined) {
            errorCollector.addMissingRequiredProperty(requiredProp);
          }
        }
      }

      // Validate properties
      for (const [prop, value] of Object.entries(dataObj)) {
        const propDefinition = edgeDefinition.properties[prop];

        if (!propDefinition) {
          if (!this.config.allowUnknownProperties) {
            errorCollector.addValidationError(`Unknown property: ${prop}`);
          }
          continue;
        }

        this.validatePropertyInternal(prop, propDefinition, value, errorCollector);
      }
    });
  }

  /**
   * Validate a property value against a property definition (internal implementation)
   *
   * @param property - Property name
   * @param definition - Property definition
   * @param value - Property value
   * @param errorCollector - Error collector
   */
  private validatePropertyInternal(
    property: string,
    definition: PropertyDefinition,
    value: unknown,
    errorCollector: ErrorCollector
  ): void {
    errorCollector.withPath(property, () => {
      // Check for null
      if (value === null) {
        if (definition.nullable) {
          return;
        } else {
          errorCollector.addValidationError('Property cannot be null');
          return;
        }
      }

      // Validate type
      if (this.config.validateTypes) {
        this.validatePropertyType(property, definition, value, errorCollector);
      }

      // Validate constraints
      if (this.config.validateConstraints) {
        this.validatePropertyConstraints(property, definition, value, errorCollector);
      }
    });
  }

  /**
   * Validate a property value type
   *
   * @param property - Property name
   * @param definition - Property definition
   * @param value - Property value
   * @param errorCollector - Error collector
   */
  private validatePropertyType(
    property: string,
    definition: PropertyDefinition,
    value: unknown,
    errorCollector: ErrorCollector
  ): void {
    const types = Array.isArray(definition.type) ? definition.type : [definition.type];

    for (const type of types) {
      if (this.checkType(type, value)) {
        return;
      }
    }

    const expectedTypes = types.join(' | ');
    const actualType = this.getValueType(value);

    errorCollector.addInvalidPropertyType(property, expectedTypes, actualType);
  }

  /**
   * Check if a value matches a property type
   *
   * @param type - Property type
   * @param value - Property value
   * @returns Whether the value matches the type
   */
  private checkType(type: PropertyType, value: unknown): boolean {
    switch (type) {
      case PropertyType.STRING:
        return typeof value === 'string';

      case PropertyType.NUMBER:
        return typeof value === 'number';

      case PropertyType.INTEGER:
        return typeof value === 'number' && Number.isInteger(value);

      case PropertyType.BOOLEAN:
        return typeof value === 'boolean';

      case PropertyType.DATE:
      case PropertyType.DATETIME:
        return (
          value instanceof Date ||
          (typeof value === 'string' && !isNaN(Date.parse(value)))
        );

      case PropertyType.OBJECT:
        return typeof value === 'object' && value !== null && !Array.isArray(value);

      case PropertyType.ARRAY:
        return Array.isArray(value);

      case PropertyType.ANY:
        return true;

      default:
        return false;
    }
  }

  /**
   * Get the type of a value as a string
   *
   * @param value - Value to check
   * @returns Type of the value
   */
  private getValueType(value: unknown): string {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (value instanceof Date) {
      return 'date';
    }

    return typeof value;
  }

  /**
   * Validate property constraints
   *
   * @param property - Property name
   * @param definition - Property definition
   * @param value - Property value
   * @param errorCollector - Error collector
   */
  private validatePropertyConstraints(
    property: string,
    definition: PropertyDefinition,
    value: unknown,
    errorCollector: ErrorCollector
  ): void {
    const types = Array.isArray(definition.type) ? definition.type : [definition.type];

    // Validate string constraints
    if (
      types.includes(PropertyType.STRING) &&
      typeof value === 'string' &&
      definition.stringConstraints
    ) {
      this.validateStringConstraints(property, definition.stringConstraints, value, errorCollector);
    }

    // Validate number constraints
    if (
      (types.includes(PropertyType.NUMBER) || types.includes(PropertyType.INTEGER)) &&
      typeof value === 'number' &&
      definition.numberConstraints
    ) {
      this.validateNumberConstraints(property, definition.numberConstraints, value, errorCollector);
    }

    // Validate array constraints
    if (
      types.includes(PropertyType.ARRAY) &&
      Array.isArray(value) &&
      definition.arrayConstraints
    ) {
      this.validateArrayConstraints(property, definition.arrayConstraints, value, errorCollector);
    }

    // Validate object constraints
    if (
      types.includes(PropertyType.OBJECT) &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      definition.objectConstraints
    ) {
      this.validateObjectConstraints(property, definition.objectConstraints, value as Record<string, unknown>, errorCollector);
    }
  }

  /**
   * Validate string constraints
   *
   * @param property - Property name
   * @param constraints - String constraints
   * @param value - String value
   * @param errorCollector - Error collector
   */
  private validateStringConstraints(
    property: string,
    constraints: PropertyDefinition['stringConstraints'],
    value: string,
    errorCollector: ErrorCollector
  ): void {
    if (!constraints) {
      return;
    }

    if (constraints.minLength !== undefined && value.length < constraints.minLength) {
      errorCollector.addValidationError(
        `String is too short (${value.length} chars), minimum length is ${constraints.minLength}`
      );
    }

    if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
      errorCollector.addValidationError(
        `String is too long (${value.length} chars), maximum length is ${constraints.maxLength}`
      );
    }

    if (constraints.pattern !== undefined) {
      try {
        const regex = new RegExp(constraints.pattern);
        if (!regex.test(value)) {
          errorCollector.addValidationError(
            `String does not match pattern: ${constraints.pattern}`
          );
        }
      } catch (_error) {
        // Ignore invalid pattern
      }
    }

    if (constraints.enum !== undefined && !constraints.enum.includes(value)) {
      errorCollector.addValidationError(
        `String must be one of: ${constraints.enum.join(', ')}`
      );
    }
  }

  /**
   * Validate number constraints
   *
   * @param property - Property name
   * @param constraints - Number constraints
   * @param value - Number value
   * @param errorCollector - Error collector
   */
  private validateNumberConstraints(
    property: string,
    constraints: PropertyDefinition['numberConstraints'],
    value: number,
    errorCollector: ErrorCollector
  ): void {
    if (!constraints) {
      return;
    }

    if (constraints.minimum !== undefined) {
      if (constraints.exclusiveMinimum && value <= constraints.minimum) {
        errorCollector.addValidationError(
          `Number must be greater than ${constraints.minimum}`
        );
      } else if (!constraints.exclusiveMinimum && value < constraints.minimum) {
        errorCollector.addValidationError(
          `Number must be greater than or equal to ${constraints.minimum}`
        );
      }
    }

    if (constraints.maximum !== undefined) {
      if (constraints.exclusiveMaximum && value >= constraints.maximum) {
        errorCollector.addValidationError(
          `Number must be less than ${constraints.maximum}`
        );
      } else if (!constraints.exclusiveMaximum && value > constraints.maximum) {
        errorCollector.addValidationError(
          `Number must be less than or equal to ${constraints.maximum}`
        );
      }
    }

    if (constraints.multipleOf !== undefined && value % constraints.multipleOf !== 0) {
      errorCollector.addValidationError(
        `Number must be a multiple of ${constraints.multipleOf}`
      );
    }

    if (constraints.enum !== undefined && !constraints.enum.includes(value)) {
      errorCollector.addValidationError(
        `Number must be one of: ${constraints.enum.join(', ')}`
      );
    }
  }

  /**
   * Validate array constraints
   *
   * @param property - Property name
   * @param constraints - Array constraints
   * @param value - Array value
   * @param errorCollector - Error collector
   */
  private validateArrayConstraints(
    property: string,
    constraints: PropertyDefinition['arrayConstraints'],
    value: unknown[],
    errorCollector: ErrorCollector
  ): void {
    if (!constraints) {
      return;
    }

    if (constraints.minItems !== undefined && value.length < constraints.minItems) {
      errorCollector.addValidationError(
        `Array is too short (${value.length} items), minimum length is ${constraints.minItems}`
      );
    }

    if (constraints.maxItems !== undefined && value.length > constraints.maxItems) {
      errorCollector.addValidationError(
        `Array is too long (${value.length} items), maximum length is ${constraints.maxItems}`
      );
    }

    if (constraints.uniqueItems && new Set(value).size !== value.length) {
      errorCollector.addValidationError('Array items must be unique');
    }

    if (constraints.items) {
      for (let i = 0; i < value.length; i++) {
        errorCollector.withPath(`[${i}]`, () => {
          this.validatePropertyInternal(
            `${property}[${i}]`,
            constraints.items as PropertyDefinition,
            value[i],
            errorCollector
          );
        });
      }
    }
  }

  /**
   * Validate object constraints
   *
   * @param property - Property name
   * @param constraints - Object constraints
   * @param value - Object value
   * @param errorCollector - Error collector
   */
  private validateObjectConstraints(
    property: string,
    constraints: PropertyDefinition['objectConstraints'],
    value: Record<string, unknown>,
    errorCollector: ErrorCollector
  ): void {
    if (!constraints) {
      return;
    }

    // Validate required properties
    if (this.config.validateRequired && constraints.required) {
      for (const requiredProp of constraints.required) {
        if (value[requiredProp] === undefined) {
          errorCollector.addMissingRequiredProperty(requiredProp);
        }
      }
    }

    // Validate properties
    if (constraints.properties) {
      for (const [prop, propValue] of Object.entries(value)) {
        const propDefinition = constraints.properties[prop];

        if (!propDefinition) {
          if (
            constraints.additionalProperties === false ||
            (constraints.additionalProperties === undefined && !this.config.allowUnknownProperties)
          ) {
            errorCollector.addValidationError(`Unknown property: ${prop}`);
          } else if (typeof constraints.additionalProperties === 'object') {
            errorCollector.withPath(prop, () => {
              this.validatePropertyInternal(
                prop,
                constraints.additionalProperties as PropertyDefinition,
                propValue,
                errorCollector
              );
            });
          }
          continue;
        }

        errorCollector.withPath(prop, () => {
          this.validatePropertyInternal(prop, propDefinition, propValue, errorCollector);
        });
      }
    }
  }
}
