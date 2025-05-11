/**
 * Error classes for core operations
 * 
 * @packageDocumentation
 */

import { ErrorCode } from './types';

/**
 * Base error class for all errors in the library
 */
export class BaseError extends Error {
  /**
   * Error code
   */
  public readonly code: ErrorCode;

  /**
   * Create a new BaseError
   * 
   * @param message - Error message
   * @param code - Error code
   * @param cause - Error cause
   */
  constructor(message: string, code: ErrorCode, public readonly cause?: unknown) {
    super(message);
    this.name = 'BaseError';
    this.code = code;
    
    // Maintain proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends BaseError {
  /**
   * Create a new ValidationError
   * 
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.SCHEMA_VALIDATION_ERROR, cause);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a connection fails
 */
export class ConnectionError extends BaseError {
  /**
   * Create a new ConnectionError
   * 
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.CONNECTION_ERROR, cause);
    this.name = 'ConnectionError';
  }
}

/**
 * Error thrown when a query fails
 */
export class QueryError extends BaseError {
  /**
   * Create a new QueryError
   * 
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.QUERY_ERROR, cause);
    this.name = 'QueryError';
  }
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends BaseError {
  /**
   * Create a new TransactionError
   * 
   * @param message - Error message
   * @param cause - Error cause
   */
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.TRANSACTION_ERROR, cause);
    this.name = 'TransactionError';
  }
}
