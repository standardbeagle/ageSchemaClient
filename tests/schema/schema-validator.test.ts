/**
 * Tests for the SchemaValidator class
 */

import { describe, it, expect } from 'vitest';
import { SchemaValidator, SchemaImpl } from '../../src/schema/schema-validator';
import { SchemaDefinition, PropertyType } from '../../src/schema/types';

describe('SchemaValidator', () => {
  // Test schema definition
  const testSchema: SchemaDefinition = {
    version: '1.0.0',
    vertices: {
      Person: {
        properties: {
          id: { type: PropertyType.STRING },
          name: { type: PropertyType.STRING },
          age: {
            type: PropertyType.NUMBER,
            numberConstraints: {
              minimum: 0,
              maximum: 120
            }
          },
          email: {
            type: PropertyType.STRING,
            stringConstraints: {
              pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
            }
          },
          tags: {
            type: PropertyType.ARRAY,
            arrayConstraints: {
              items: { type: PropertyType.STRING }
            }
          }
        },
        required: ['id', 'name']
      },
      Company: {
        properties: {
          id: { type: PropertyType.STRING },
          name: { type: PropertyType.STRING },
          founded: {
            type: PropertyType.NUMBER,
            numberConstraints: {
              minimum: 1800,
              maximum: new Date().getFullYear()
            }
          },
          active: { type: PropertyType.BOOLEAN }
        },
        required: ['id', 'name']
      }
    },
    edges: {
      KNOWS: {
        properties: {
          since: {
            type: PropertyType.NUMBER,
            numberConstraints: {
              minimum: 1900
            }
          }
        },
        fromVertex: 'Person',
        toVertex: 'Person'
      },
      WORKS_AT: {
        properties: {
          role: {
            type: PropertyType.STRING,
            stringConstraints: {
              enum: ['Employee', 'Manager', 'Director', 'CEO']
            }
          },
          since: {
            type: PropertyType.NUMBER,
            numberConstraints: {
              minimum: 1900
            }
          },
          salary: {
            type: PropertyType.NUMBER,
            numberConstraints: {
              minimum: 0
            }
          }
        },
        required: ['role', 'since'],
        fromVertex: 'Person',
        toVertex: 'Company'
      }
    }
  };

  // Create schema and validator
  const schema = new SchemaImpl(testSchema);
  const validator = new SchemaValidator(schema);

  describe('validateVertices', () => {
    it('should validate valid vertices', () => {
      const vertices = [
        { id: '1', name: 'John Doe', age: 30, email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', age: 25, email: 'jane@example.com', tags: ['developer', 'manager'] }
      ];

      const result = validator.validateVertices('Person', vertices);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required properties', () => {
      const vertices = [
        { id: '1', name: 'John Doe' },
        { id: '2' }, // Missing name
        { age: 30 }  // Missing id and name
      ];

      const result = validator.validateVertices('Person', vertices);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].index).toBe(1);
      expect(result.errors[0].errors).toContain('Missing required property: name');
      expect(result.errors[1].index).toBe(2);
      expect(result.errors[1].errors).toContain('Missing required property: id');
      expect(result.errors[1].errors).toContain('Missing required property: name');
    });

    it('should detect invalid property types', () => {
      const vertices = [
        { id: '1', name: 'John Doe', age: 'thirty' }, // age should be a number
        { id: '2', name: 'Jane Smith', tags: 'developer' } // tags should be an array
      ];

      const result = validator.validateVertices('Person', vertices);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].errors[0]).toContain('age: Invalid type: expected number');
      expect(result.errors[1].errors[0]).toContain('tags: Invalid type: expected array');
    });

    it('should detect constraint violations', () => {
      const vertices = [
        { id: '1', name: 'John Doe', age: -5 }, // age must be >= 0
        { id: '2', name: 'Jane Smith', age: 150 }, // age must be <= 120
        { id: '3', name: 'Bob Johnson', email: 'not-an-email' } // email must match pattern
      ];

      const result = validator.validateVertices('Person', vertices);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].errors[0]).toContain('age: Number must be at least 0');
      expect(result.errors[1].errors[0]).toContain('age: Number must be at most 120');
      expect(result.errors[2].errors[0]).toContain('email: String must match pattern');
    });

    it('should handle unknown vertex types', () => {
      const result = validator.validateVertices('UnknownType', [{ id: '1', name: 'Test' }]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].errors[0]).toBe('Unknown vertex type: UnknownType');
    });
  });

  describe('validateEdges', () => {
    it('should validate valid edges', () => {
      const edges = [
        { from: '1', to: '2', since: 2010 },
        { from: '2', to: '3', since: 2015 }
      ];

      const result = validator.validateEdges('KNOWS', edges);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing from/to properties', () => {
      const edges = [
        { from: '1', since: 2010 }, // Missing to
        { to: '2', since: 2015 },   // Missing from
        { since: 2020 }             // Missing both from and to
      ];

      const result = validator.validateEdges('KNOWS', edges);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].errors).toContain('Missing required property: to');
      expect(result.errors[1].errors).toContain('Missing required property: from');
      expect(result.errors[2].errors).toContain('Missing required property: from');
      expect(result.errors[2].errors).toContain('Missing required property: to');
    });

    it('should detect missing required properties', () => {
      const edges = [
        { from: '1', to: '2', role: 'Employee' }, // Missing since
        { from: '1', to: '2', since: 2010 },      // Missing role
        { from: '1', to: '2' }                    // Missing both role and since
      ];

      const result = validator.validateEdges('WORKS_AT', edges);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].errors).toContain('Missing required property: since');
      expect(result.errors[1].errors).toContain('Missing required property: role');
      expect(result.errors[2].errors).toContain('Missing required property: role');
      expect(result.errors[2].errors).toContain('Missing required property: since');
    });

    it('should detect invalid property types', () => {
      const edges = [
        { from: '1', to: '2', since: 'last year', role: 'Employee' }, // since should be a number
        { from: '1', to: '2', since: 2010, salary: 'high', role: 'Manager' } // salary should be a number
      ];

      const result = validator.validateEdges('WORKS_AT', edges);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);

      // Check that the errors contain the expected messages
      const firstEdgeErrors = result.errors[0].errors;
      const secondEdgeErrors = result.errors[1].errors;

      expect(firstEdgeErrors.some(err => err.includes('since: Invalid type: expected number'))).toBe(true);
      expect(secondEdgeErrors.some(err => err.includes('salary: Invalid type: expected number'))).toBe(true);
    });

    it('should detect constraint violations', () => {
      const edges = [
        { from: '1', to: '2', role: 'Employee', since: 1800 }, // since must be >= 1900
        { from: '1', to: '2', role: 'Intern', since: 2010 },   // role must be in enum
        { from: '1', to: '2', role: 'Manager', since: 2010, salary: -1000 } // salary must be >= 0
      ];

      const result = validator.validateEdges('WORKS_AT', edges);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);

      // Check that the errors contain the expected messages
      const firstEdgeErrors = result.errors[0].errors;
      const secondEdgeErrors = result.errors[1].errors;
      const thirdEdgeErrors = result.errors[2].errors;

      expect(firstEdgeErrors.some(err => err.includes('since: Number must be at least 1900'))).toBe(true);
      expect(secondEdgeErrors.some(err => err.includes('role: String must be one of'))).toBe(true);
      expect(thirdEdgeErrors.some(err => err.includes('salary: Number must be at least 0'))).toBe(true);
    });

    it('should handle unknown edge types', () => {
      const result = validator.validateEdges('UnknownType', [{ from: '1', to: '2' }]);
      expect(result.valid).toBe(false);
      expect(result.errors[0].errors[0]).toBe('Unknown edge type: UnknownType');
    });
  });
});
