import { describe, it, expect } from 'vitest';
import { ValidationError } from '../../src/core/errors';

describe('ValidationError', () => {
  it('should create a ValidationError instance', () => {
    const error = new ValidationError('Test validation error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Validation failed: Test validation error');
    expect(error.name).toBe('ValidationError');
  });
});
