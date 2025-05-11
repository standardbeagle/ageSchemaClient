import { describe, it, expect } from 'vitest';
import {
  SchemaValidator,
  SchemaValidationError,
  ValidationErrorCollection,
  PropertyType,
  EdgeMultiplicity,
  EdgeDirection,
} from '../../src/schema';

describe('SchemaValidator', () => {
  const schema = {
    version: '1.0.0',
    vertices: {
      Person: {
        properties: {
          id: {
            type: PropertyType.STRING,
          },
          name: {
            type: PropertyType.STRING,
            stringConstraints: {
              minLength: 1,
              maxLength: 100,
            },
          },
          age: {
            type: PropertyType.NUMBER,
            nullable: true,
            numberConstraints: {
              minimum: 0,
              maximum: 120,
            },
          },
          tags: {
            type: PropertyType.ARRAY,
            arrayConstraints: {
              items: {
                type: PropertyType.STRING,
              },
              uniqueItems: true,
            },
          },
          metadata: {
            type: PropertyType.OBJECT,
            objectConstraints: {
              properties: {
                createdAt: {
                  type: PropertyType.DATE,
                },
              },
            },
          },
        },
        required: ['id', 'name'],
      },
    },
    edges: {
      FRIEND_OF: {
        properties: {
          since: {
            type: PropertyType.DATE,
          },
          strength: {
            type: PropertyType.NUMBER,
            nullable: true,
            numberConstraints: {
              minimum: 0,
              maximum: 1,
            },
          },
        },
        required: ['since'],
        fromVertex: 'Person',
        toVertex: 'Person',
        multiplicity: EdgeMultiplicity.MANY_TO_MANY,
        direction: EdgeDirection.BIDIRECTIONAL,
      },
    },
  };
  
  describe('validateVertex', () => {
    it('should validate a valid vertex', () => {
      const validator = new SchemaValidator(schema);
      const validVertex = {
        id: '123',
        name: 'John Doe',
        age: 30,
        tags: ['developer', 'typescript'],
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
        },
      };
      
      expect(() => validator.validateVertex('Person', validVertex)).not.toThrow();
    });
    
    it('should validate a vertex with nullable properties', () => {
      const validator = new SchemaValidator(schema);
      const validVertex = {
        id: '123',
        name: 'John Doe',
        age: null,
        tags: ['developer', 'typescript'],
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
        },
      };
      
      expect(() => validator.validateVertex('Person', validVertex)).not.toThrow();
    });
    
    it('should throw for unknown vertex label', () => {
      const validator = new SchemaValidator(schema);
      const vertex = {
        id: '123',
        name: 'John Doe',
      };
      
      expect(() => validator.validateVertex('UnknownLabel', vertex)).toThrow(SchemaValidationError);
    });
    
    it('should throw for missing required properties', () => {
      const validator = new SchemaValidator(schema);
      const invalidVertex = {
        id: '123',
        // Missing required 'name' property
      };
      
      expect(() => validator.validateVertex('Person', invalidVertex)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid property types', () => {
      const validator = new SchemaValidator(schema);
      const invalidVertex = {
        id: '123',
        name: 'John Doe',
        age: 'thirty', // Should be a number
      };
      
      expect(() => validator.validateVertex('Person', invalidVertex)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid string constraints', () => {
      const validator = new SchemaValidator(schema);
      const invalidVertex = {
        id: '123',
        name: '', // Too short
      };
      
      expect(() => validator.validateVertex('Person', invalidVertex)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid number constraints', () => {
      const validator = new SchemaValidator(schema);
      const invalidVertex = {
        id: '123',
        name: 'John Doe',
        age: 150, // Too high
      };
      
      expect(() => validator.validateVertex('Person', invalidVertex)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid array constraints', () => {
      const validator = new SchemaValidator(schema);
      const invalidVertex = {
        id: '123',
        name: 'John Doe',
        tags: ['developer', 'developer'], // Duplicate items
      };
      
      expect(() => validator.validateVertex('Person', invalidVertex)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid object constraints', () => {
      const validator = new SchemaValidator(schema);
      const invalidVertex = {
        id: '123',
        name: 'John Doe',
        metadata: {
          createdAt: 'invalid-date', // Invalid date
        },
      };
      
      expect(() => validator.validateVertex('Person', invalidVertex)).toThrow(SchemaValidationError);
    });
    
    it('should allow unknown properties when configured', () => {
      const validator = new SchemaValidator(schema, {
        allowUnknownProperties: true,
      });
      const vertexWithUnknownProps = {
        id: '123',
        name: 'John Doe',
        unknownProp: 'value',
      };
      
      expect(() => validator.validateVertex('Person', vertexWithUnknownProps)).not.toThrow();
    });
    
    it('should throw for unknown properties when not configured to allow them', () => {
      const validator = new SchemaValidator(schema, {
        allowUnknownProperties: false,
      });
      const vertexWithUnknownProps = {
        id: '123',
        name: 'John Doe',
        unknownProp: 'value',
      };
      
      expect(() => validator.validateVertex('Person', vertexWithUnknownProps)).toThrow(SchemaValidationError);
    });
  });
  
  describe('validateEdge', () => {
    it('should validate a valid edge', () => {
      const validator = new SchemaValidator(schema);
      const validEdge = {
        since: '2023-01-01T00:00:00Z',
        strength: 0.8,
      };
      
      expect(() => validator.validateEdge('FRIEND_OF', validEdge)).not.toThrow();
    });
    
    it('should validate an edge with nullable properties', () => {
      const validator = new SchemaValidator(schema);
      const validEdge = {
        since: '2023-01-01T00:00:00Z',
        strength: null,
      };
      
      expect(() => validator.validateEdge('FRIEND_OF', validEdge)).not.toThrow();
    });
    
    it('should throw for unknown edge label', () => {
      const validator = new SchemaValidator(schema);
      const edge = {
        since: '2023-01-01T00:00:00Z',
      };
      
      expect(() => validator.validateEdge('UnknownLabel', edge)).toThrow(SchemaValidationError);
    });
    
    it('should throw for missing required properties', () => {
      const validator = new SchemaValidator(schema);
      const invalidEdge = {
        // Missing required 'since' property
        strength: 0.8,
      };
      
      expect(() => validator.validateEdge('FRIEND_OF', invalidEdge)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid property types', () => {
      const validator = new SchemaValidator(schema);
      const invalidEdge = {
        since: 123, // Should be a date string
        strength: 0.8,
      };
      
      expect(() => validator.validateEdge('FRIEND_OF', invalidEdge)).toThrow(SchemaValidationError);
    });
    
    it('should throw for invalid number constraints', () => {
      const validator = new SchemaValidator(schema);
      const invalidEdge = {
        since: '2023-01-01T00:00:00Z',
        strength: 1.5, // Too high
      };
      
      expect(() => validator.validateEdge('FRIEND_OF', invalidEdge)).toThrow(SchemaValidationError);
    });
  });
  
  describe('validateProperty', () => {
    it('should validate a valid property', () => {
      const validator = new SchemaValidator(schema);
      const propertyDef = schema.vertices.Person.properties.name;
      
      expect(() => validator.validateProperty('name', propertyDef, 'John Doe')).not.toThrow();
    });
    
    it('should throw for invalid property type', () => {
      const validator = new SchemaValidator(schema);
      const propertyDef = schema.vertices.Person.properties.age;
      
      expect(() => validator.validateProperty('age', propertyDef, 'thirty')).toThrow(SchemaValidationError);
    });
    
    it('should throw for null when not nullable', () => {
      const validator = new SchemaValidator(schema);
      const propertyDef = schema.vertices.Person.properties.name;
      
      expect(() => validator.validateProperty('name', propertyDef, null)).toThrow(SchemaValidationError);
    });
    
    it('should allow null when nullable', () => {
      const validator = new SchemaValidator(schema);
      const propertyDef = schema.vertices.Person.properties.age;
      
      expect(() => validator.validateProperty('age', propertyDef, null)).not.toThrow();
    });
  });
});
