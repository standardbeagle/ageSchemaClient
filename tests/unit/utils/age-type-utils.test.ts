/**
 * Tests for Apache AGE Type Utilities
 */

import { describe, it, expect } from 'vitest';
import { toAgType, fromAgType, formatArrayForUnwind } from '../../../src/utils/age-type-utils';

describe('AGE Type Utilities', () => {
  describe('toAgType', () => {
    it('should handle null and undefined', () => {
      expect(toAgType(null)).toBeNull();
      expect(toAgType(undefined)).toBeNull();
    });

    it('should handle primitive types', () => {
      expect(toAgType('test')).toBe('test');
      expect(toAgType(123)).toBe(123);
      expect(toAgType(true)).toBe(true);
      expect(toAgType(false)).toBe(false);
    });

    it('should handle arrays', () => {
      expect(toAgType([1, 2, 3])).toEqual([1, 2, 3]);
      expect(toAgType(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(toAgType([true, false])).toEqual([true, false]);
    });

    it('should handle objects', () => {
      expect(toAgType({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      expect(toAgType({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
    });

    it('should handle nested structures', () => {
      expect(toAgType({ a: [1, 2, 3], b: { c: 4 } })).toEqual({ a: [1, 2, 3], b: { c: 4 } });
    });

    it('should handle dates', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(toAgType(date)).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle complex nested structures', () => {
      const complex = {
        name: 'John',
        age: 30,
        active: true,
        address: {
          street: '123 Main St',
          city: 'Anytown',
          zip: 12345
        },
        tags: ['developer', 'javascript'],
        createdAt: new Date('2023-01-01T00:00:00.000Z')
      };

      const expected = {
        name: 'John',
        age: 30,
        active: true,
        address: {
          street: '123 Main St',
          city: 'Anytown',
          zip: 12345
        },
        tags: ['developer', 'javascript'],
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      expect(toAgType(complex)).toEqual(expected);
    });
  });

  describe('fromAgType', () => {
    it('should handle null and undefined', () => {
      expect(fromAgType(null)).toBeNull();
      expect(fromAgType(undefined)).toBeNull();
    });

    it('should handle primitive types', () => {
      expect(fromAgType('test')).toBe('test');
      expect(fromAgType(123)).toBe(123);
      expect(fromAgType(true)).toBe(true);
      expect(fromAgType(false)).toBe(false);
    });

    it('should handle arrays', () => {
      expect(fromAgType([1, 2, 3])).toEqual([1, 2, 3]);
      expect(fromAgType(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
      expect(fromAgType([true, false])).toEqual([true, false]);
    });

    it('should handle objects', () => {
      expect(fromAgType({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      expect(fromAgType({ name: 'John', age: 30 })).toEqual({ name: 'John', age: 30 });
    });

    it('should handle nested structures', () => {
      expect(fromAgType({ a: [1, 2, 3], b: { c: 4 } })).toEqual({ a: [1, 2, 3], b: { c: 4 } });
    });

    it('should handle AGE string representation', () => {
      expect(fromAgType('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 });
    });

    it('should handle double-quoted strings', () => {
      expect(fromAgType('"\\John Smith\\"')).toBe('John Smith');
    });

    it('should handle regular quoted strings', () => {
      expect(fromAgType('"John Smith"')).toBe('John Smith');
    });

    it('should handle date strings', () => {
      const dateStr = '2023-01-01T00:00:00.000Z';
      const result = fromAgType(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(dateStr);
    });

    it('should handle complex nested structures', () => {
      const complex = {
        name: '"John"',
        age: 30,
        active: true,
        address: '{"street": "123 Main St", "city": "Anytown", "zip": 12345}',
        tags: ['developer', 'javascript'],
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      const expected = {
        name: 'John',
        age: 30,
        active: true,
        address: {
          street: '123 Main St',
          city: 'Anytown',
          zip: 12345
        },
        tags: ['developer', 'javascript'],
        createdAt: new Date('2023-01-01T00:00:00.000Z')
      };

      expect(fromAgType(complex)).toEqual(expected);
    });
  });

  describe('formatArrayForUnwind', () => {
    it('should format a simple array for UNWIND', () => {
      const array = [1, 2, 3];
      const result = formatArrayForUnwind(array, 'num');
      expect(result).toBe('[1, 2, 3] AS num');
    });

    it('should format an array of strings for UNWIND', () => {
      const array = ['a', 'b', 'c'];
      const result = formatArrayForUnwind(array, 'letter');
      expect(result).toBe('["a", "b", "c"] AS letter');
    });

    it('should format an array of objects for UNWIND', () => {
      const array = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
      const result = formatArrayForUnwind(array, 'person');
      expect(result).toBe('[{"id":1,"name":"John"}, {"id":2,"name":"Jane"}] AS person');
    });

    it('should format an array with nested structures for UNWIND', () => {
      const array = [
        { id: 1, name: 'John', tags: ['developer', 'javascript'] },
        { id: 2, name: 'Jane', tags: ['designer', 'css'] }
      ];
      const result = formatArrayForUnwind(array, 'person');
      expect(result).toBe('[{"id":1,"name":"John","tags":["developer","javascript"]}, {"id":2,"name":"Jane","tags":["designer","css"]}] AS person');
    });

    it('should format an array with dates for UNWIND', () => {
      const array = [
        { id: 1, name: 'John', createdAt: new Date('2023-01-01T00:00:00.000Z') },
        { id: 2, name: 'Jane', createdAt: new Date('2023-01-02T00:00:00.000Z') }
      ];
      const result = formatArrayForUnwind(array, 'person');
      expect(result).toBe('[{"id":1,"name":"John","createdAt":"2023-01-01T00:00:00.000Z"}, {"id":2,"name":"Jane","createdAt":"2023-01-02T00:00:00.000Z"}] AS person');
    });
  });
});
