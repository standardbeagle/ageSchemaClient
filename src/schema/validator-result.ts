/**
 * Schema validation result types
 * 
 * @packageDocumentation
 */

/**
 * Schema validation error
 */
export interface ValidationErrorInfo {
  /**
   * Error message
   */
  message: string;

  /**
   * Property path where the error occurred
   */
  path: string;

  /**
   * Error type
   */
  type: string;
}

/**
 * Schema validation result
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
 * Create a successful validation result
 * 
 * @returns Successful validation result
 */
export function createSuccessResult(): ValidationResult {
  return {
    valid: true,
    errors: []
  };
}

/**
 * Create a failed validation result
 * 
 * @param errors - Validation errors
 * @returns Failed validation result
 */
export function createFailureResult(errors: ValidationErrorInfo[]): ValidationResult {
  return {
    valid: false,
    errors
  };
}
