/**
 * Error collector for schema validation
 * 
 * @packageDocumentation
 */

import {
  SchemaValidationError,
  ValidationErrorCollection,
  MissingRequiredPropertyError,
  InvalidPropertyTypeError,
  InvalidRelationshipError,
  CircularDependencyError,
} from './errors';

/**
 * Collects validation errors during schema validation
 */
export class ErrorCollector {
  private errors: SchemaValidationError[] = [];
  private currentPath: string[] = [];
  
  /**
   * Add a validation error
   * 
   * @param error - Validation error
   */
  public addError(error: SchemaValidationError): void {
    this.errors.push(error);
  }
  
  /**
   * Add a missing required property error
   * 
   * @param property - Missing property name
   */
  public addMissingRequiredProperty(property: string): void {
    this.addError(new MissingRequiredPropertyError(property, this.getCurrentPath()));
  }
  
  /**
   * Add an invalid property type error
   * 
   * @param property - Property name
   * @param expectedType - Expected property type
   * @param actualType - Actual property type
   */
  public addInvalidPropertyType(
    property: string,
    expectedType: string,
    actualType: string
  ): void {
    this.addError(
      new InvalidPropertyTypeError(
        property,
        expectedType,
        actualType,
        this.getCurrentPath()
      )
    );
  }
  
  /**
   * Add an invalid relationship error
   * 
   * @param edge - Edge label
   * @param message - Error message
   */
  public addInvalidRelationship(edge: string, message: string): void {
    this.addError(
      new InvalidRelationshipError(
        edge,
        message,
        this.getCurrentPath()
      )
    );
  }
  
  /**
   * Add a circular dependency error
   * 
   * @param cycle - Array of elements in the cycle
   */
  public addCircularDependency(cycle: string[]): void {
    this.addError(
      new CircularDependencyError(
        cycle,
        this.getCurrentPath()
      )
    );
  }
  
  /**
   * Add a generic validation error
   * 
   * @param message - Error message
   */
  public addValidationError(message: string): void {
    this.addError(
      new SchemaValidationError(
        message,
        this.getCurrentPath()
      )
    );
  }
  
  /**
   * Check if there are any errors
   * 
   * @returns Whether there are any errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  /**
   * Get all errors
   * 
   * @returns Array of validation errors
   */
  public getErrors(): SchemaValidationError[] {
    return [...this.errors];
  }
  
  /**
   * Get the current path as a string
   * 
   * @returns Current path
   */
  public getCurrentPath(): string {
    return this.currentPath.join('.');
  }
  
  /**
   * Push a path segment onto the current path
   * 
   * @param segment - Path segment
   */
  public pushPath(segment: string): void {
    this.currentPath.push(segment);
  }
  
  /**
   * Pop a path segment from the current path
   * 
   * @returns Popped path segment
   */
  public popPath(): string | undefined {
    return this.currentPath.pop();
  }
  
  /**
   * Execute a function with a path segment added to the current path
   * 
   * @param segment - Path segment
   * @param fn - Function to execute
   */
  public withPath<T>(segment: string, fn: () => T): T {
    this.pushPath(segment);
    try {
      return fn();
    } finally {
      this.popPath();
    }
  }
  
  /**
   * Throw a ValidationErrorCollection if there are any errors
   * 
   * @throws ValidationErrorCollection if there are any errors
   */
  public throwIfErrors(): void {
    if (this.hasErrors()) {
      throw new ValidationErrorCollection(this.getErrors());
    }
  }
}
