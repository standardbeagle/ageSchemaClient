import { describe, it, expect } from 'vitest';
import { BatchLoaderError, BatchLoaderErrorContext } from '../../src/core/errors';
import { ErrorCode } from '../../src/core/types';

describe('BatchLoaderError', () => {
  it('should create a BatchLoaderError with the correct properties', () => {
    const message = 'Test batch loader error';
    const context: BatchLoaderErrorContext = {
      phase: 'validation',
      type: 'Person',
      index: 5,
      sql: 'SELECT * FROM test',
      data: { id: '123', name: 'Test' }
    };
    const cause = new Error('Original error');
    
    const error = new BatchLoaderError(message, context, cause);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BatchLoaderError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(ErrorCode.BATCH_LOADER_ERROR);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('BatchLoaderError');
    expect(error.context).toBe(context);
    expect(error.context?.phase).toBe('validation');
    expect(error.context?.type).toBe('Person');
    expect(error.context?.index).toBe(5);
    expect(error.context?.sql).toBe('SELECT * FROM test');
    expect(error.context?.data).toEqual({ id: '123', name: 'Test' });
  });

  it('should create a BatchLoaderError without context', () => {
    const message = 'Test batch loader error';
    const cause = new Error('Original error');
    
    const error = new BatchLoaderError(message, undefined, cause);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BatchLoaderError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(ErrorCode.BATCH_LOADER_ERROR);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('BatchLoaderError');
    expect(error.context).toBeUndefined();
  });

  it('should create a BatchLoaderError with partial context', () => {
    const message = 'Test batch loader error';
    const context: BatchLoaderErrorContext = {
      phase: 'edges',
      type: 'KNOWS'
    };
    
    const error = new BatchLoaderError(message, context);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BatchLoaderError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(ErrorCode.BATCH_LOADER_ERROR);
    expect(error.cause).toBeUndefined();
    expect(error.name).toBe('BatchLoaderError');
    expect(error.context).toBe(context);
    expect(error.context?.phase).toBe('edges');
    expect(error.context?.type).toBe('KNOWS');
    expect(error.context?.index).toBeUndefined();
    expect(error.context?.sql).toBeUndefined();
    expect(error.context?.data).toBeUndefined();
  });
});
