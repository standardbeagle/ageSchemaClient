import { describe, it, expect } from 'vitest';
import { ValidationError, BaseError, ConnectionError, QueryError, TransactionError } from '../../src/core/errors';
import { ErrorCode } from '../../src/core/types';

describe('Core Errors', () => {
  describe('BaseError', () => {
    it('should create a BaseError with the correct properties', () => {
      const message = 'Test error message';
      const code = ErrorCode.UNKNOWN_ERROR;
      const cause = new Error('Original error');
      
      const error = new BaseError(message, code, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('BaseError');
    });
  });
  
  describe('ValidationError', () => {
    it('should create a ValidationError with the correct properties', () => {
      const message = 'Validation failed';
      const cause = new Error('Original error');
      
      const error = new ValidationError(message, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_ERROR);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ValidationError');
    });
  });
  
  describe('ConnectionError', () => {
    it('should create a ConnectionError with the correct properties', () => {
      const message = 'Connection failed';
      const cause = new Error('Original error');
      
      const error = new ConnectionError(message, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ConnectionError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(ErrorCode.CONNECTION_ERROR);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ConnectionError');
    });
  });
  
  describe('QueryError', () => {
    it('should create a QueryError with the correct properties', () => {
      const message = 'Query failed';
      const cause = new Error('Original error');
      
      const error = new QueryError(message, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(QueryError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(ErrorCode.QUERY_ERROR);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('QueryError');
    });
  });
  
  describe('TransactionError', () => {
    it('should create a TransactionError with the correct properties', () => {
      const message = 'Transaction failed';
      const cause = new Error('Original error');
      
      const error = new TransactionError(message, cause);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(TransactionError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(ErrorCode.TRANSACTION_ERROR);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('TransactionError');
    });
  });
});
