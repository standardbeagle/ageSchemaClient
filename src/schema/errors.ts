/**
 * Error classes for schema operations
 * 
 * @packageDocumentation
 */

/**
 * Base error class for schema-related errors
 */
export class SchemaError extends Error {
  /**
   * Create a new SchemaError
   * 
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SchemaError';
    
    // Maintain proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when parsing a schema fails
 */
export class SchemaParseError extends SchemaError {
  /**
   * Create a new SchemaParseError
   * 
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'SchemaParseError';
  }
}

/**
 * Error thrown when validating a schema fails
 */
export class SchemaValidationError extends SchemaError {
  /**
   * Create a new SchemaValidationError
   * 
   * @param message - Error message
   * @param path - Path to the invalid element
   * @param cause - Error cause
   */
  constructor(
    message: string,
    public readonly path?: string,
    cause?: unknown
  ) {
    super(message, cause);
    this.name = 'SchemaValidationError';
  }
}

/**
 * Error thrown when a required property is missing
 */
export class MissingRequiredPropertyError extends SchemaValidationError {
  /**
   * Create a new MissingRequiredPropertyError
   * 
   * @param property - Missing property name
   * @param path - Path to the element with the missing property
   */
  constructor(public readonly property: string, path?: string) {
    super(`Missing required property: ${property}`, path);
    this.name = 'MissingRequiredPropertyError';
  }
}

/**
 * Error thrown when a property has an invalid type
 */
export class InvalidPropertyTypeError extends SchemaValidationError {
  /**
   * Create a new InvalidPropertyTypeError
   * 
   * @param property - Property name
   * @param expectedType - Expected property type
   * @param actualType - Actual property type
   * @param path - Path to the invalid property
   */
  constructor(
    public readonly property: string,
    public readonly expectedType: string,
    public readonly actualType: string,
    path?: string
  ) {
    super(
      `Invalid type for property ${property}: expected ${expectedType}, got ${actualType}`,
      path
    );
    this.name = 'InvalidPropertyTypeError';
  }
}

/**
 * Error thrown when a relationship constraint is invalid
 */
export class InvalidRelationshipError extends SchemaValidationError {
  /**
   * Create a new InvalidRelationshipError
   * 
   * @param edge - Edge label
   * @param message - Error message
   * @param path - Path to the invalid relationship
   */
  constructor(
    public readonly edge: string,
    message: string,
    path?: string
  ) {
    super(`Invalid relationship for edge ${edge}: ${message}`, path);
    this.name = 'InvalidRelationshipError';
  }
}

/**
 * Error thrown when a circular dependency is detected
 */
export class CircularDependencyError extends SchemaValidationError {
  /**
   * Create a new CircularDependencyError
   * 
   * @param cycle - Array of elements in the cycle
   * @param path - Path to the cycle
   */
  constructor(
    public readonly cycle: string[],
    path?: string
  ) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`, path);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when a schema version is incompatible
 */
export class SchemaVersionError extends SchemaError {
  /**
   * Create a new SchemaVersionError
   * 
   * @param message - Error message
   * @param currentVersion - Current schema version
   * @param requiredVersion - Required schema version
   */
  constructor(
    message: string,
    public readonly currentVersion?: string,
    public readonly requiredVersion?: string
  ) {
    super(message);
    this.name = 'SchemaVersionError';
  }
}

/**
 * Container for multiple validation errors
 */
export class ValidationErrorCollection extends SchemaValidationError {
  /**
   * Create a new ValidationErrorCollection
   * 
   * @param errors - Array of validation errors
   */
  constructor(public readonly errors: SchemaValidationError[]) {
    super(`Multiple validation errors (${errors.length})`);
    this.name = 'ValidationErrorCollection';
  }
}
