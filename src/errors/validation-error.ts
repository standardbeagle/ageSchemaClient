/**
 * Validation Error
 * 
 * This module provides a custom error class for validation errors.
 */

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  /**
   * Create a new validation error
   * 
   * @param message - Error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
