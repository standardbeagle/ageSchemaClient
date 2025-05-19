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
    // Ensure message includes "Validation failed" for consistent error handling
    const enhancedMessage = message.includes('Validation failed')
      ? message
      : `Validation failed: ${message}`;

    super(enhancedMessage, ErrorCode.SCHEMA_VALIDATION_ERROR, cause);
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

/**
 * Context information for batch loader errors
 */
export interface BatchLoaderErrorContext {
  /**
   * Phase of the batch loading process where the error occurred
   */
  phase?: 'validation' | 'vertices' | 'edges' | 'transaction' | 'cleanup';

  /**
   * Entity type (vertex or edge type) being processed when the error occurred
   */
  type?: string;

  /**
   * Index of the entity in the array being processed
   */
  index?: number;

  /**
   * SQL or Cypher query being executed when the error occurred
   */
  sql?: string;

  /**
   * Data being processed when the error occurred
   */
  data?: any;
}

/**
 * Error thrown when batch loading fails
 */
export class BatchLoaderError extends BaseError {
  /**
   * Create a new BatchLoaderError
   *
   * @param message - Error message
   * @param context - Error context
   * @param cause - Error cause
   */
  constructor(
    message: string,
    public readonly context?: BatchLoaderErrorContext,
    cause?: unknown
  ) {
    super(message, ErrorCode.BATCH_LOADER_ERROR, cause);
    this.name = 'BatchLoaderError';
  }
}
