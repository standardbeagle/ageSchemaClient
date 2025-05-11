import { describe, it, expect } from 'vitest';
import {
  compareSchemas,
  migrateSchema,
  SchemaChangeType,
  SchemaVersionError,
  PropertyType,
  EdgeMultiplicity,
  EdgeDirection,
} from '../../src/schema';

describe('Schema Migration', () => {
  const oldSchema = {
    version: '1.0.0',
    vertices: {
      Person: {
        properties: {
          id: {
            type: PropertyType.STRING,
          },
          name: {
            type: PropertyType.STRING,
          },
          age: {
            type: PropertyType.NUMBER,
            nullable: true,
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
        },
        fromVertex: 'Person',
        toVertex: 'Person',
        multiplicity: EdgeMultiplicity.MANY_TO_MANY,
        direction: EdgeDirection.BIDIRECTIONAL,
      },
    },
  };
  
  describe('compareSchemas', () => {
    it('should detect added vertices', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          ...oldSchema.vertices,
          Organization: {
            properties: {
              id: {
                type: PropertyType.STRING,
              },
              name: {
                type: PropertyType.STRING,
              },
            },
            required: ['id', 'name'],
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const addedVertex = changes.find(
        change => change.type === SchemaChangeType.ADDED && change.path === 'vertices.Organization'
      );
      
      expect(addedVertex).toBeDefined();
      expect(addedVertex?.breaking).toBe(false);
    });
    
    it('should detect removed vertices', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {},
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const removedVertex = changes.find(
        change => change.type === SchemaChangeType.REMOVED && change.path === 'vertices.Person'
      );
      
      expect(removedVertex).toBeDefined();
      expect(removedVertex?.breaking).toBe(true);
    });
    
    it('should detect added properties', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              ...oldSchema.vertices.Person.properties,
              email: {
                type: PropertyType.STRING,
              },
            },
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const addedProperty = changes.find(
        change => change.type === SchemaChangeType.ADDED && change.path === 'vertices.Person.properties.email'
      );
      
      expect(addedProperty).toBeDefined();
      expect(addedProperty?.breaking).toBe(false);
    });
    
    it('should detect removed properties', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              id: oldSchema.vertices.Person.properties.id,
              name: oldSchema.vertices.Person.properties.name,
              // age property removed
            },
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const removedProperty = changes.find(
        change => change.type === SchemaChangeType.REMOVED && change.path === 'vertices.Person.properties.age'
      );
      
      expect(removedProperty).toBeDefined();
      expect(removedProperty?.breaking).toBe(false); // Not breaking because age was not required
    });
    
    it('should detect modified properties', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              ...oldSchema.vertices.Person.properties,
              age: {
                type: PropertyType.INTEGER, // Changed from NUMBER to INTEGER
                nullable: true,
              },
            },
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const modifiedProperty = changes.find(
        change => change.type === SchemaChangeType.MODIFIED && change.path === 'vertices.Person.properties.age.type'
      );
      
      expect(modifiedProperty).toBeDefined();
      expect(modifiedProperty?.breaking).toBe(true);
    });
    
    it('should detect added required properties', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              ...oldSchema.vertices.Person.properties,
              email: {
                type: PropertyType.STRING,
              },
            },
            required: [...oldSchema.vertices.Person.required, 'email'],
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const modifiedRequired = changes.find(
        change => change.type === SchemaChangeType.MODIFIED && change.path === 'vertices.Person.required'
      );
      
      expect(modifiedRequired).toBeDefined();
      expect(modifiedRequired?.breaking).toBe(true);
    });
    
    it('should detect removed required properties', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            required: ['id'], // Removed 'name' from required
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const modifiedRequired = changes.find(
        change => change.type === SchemaChangeType.MODIFIED && change.path === 'vertices.Person.required'
      );
      
      expect(modifiedRequired).toBeDefined();
      expect(modifiedRequired?.breaking).toBe(false);
    });
    
    it('should detect changes to edge relationships', () => {
      const newSchema = {
        ...oldSchema,
        edges: {
          FRIEND_OF: {
            ...oldSchema.edges.FRIEND_OF,
            multiplicity: EdgeMultiplicity.ONE_TO_MANY, // Changed from MANY_TO_MANY
          },
        },
      };
      
      const changes = compareSchemas(oldSchema, newSchema);
      
      const modifiedMultiplicity = changes.find(
        change => change.type === SchemaChangeType.MODIFIED && change.path === 'edges.FRIEND_OF.multiplicity'
      );
      
      expect(modifiedMultiplicity).toBeDefined();
      expect(modifiedMultiplicity?.breaking).toBe(true);
    });
  });
  
  describe('migrateSchema', () => {
    it('should migrate a schema with non-breaking changes', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          ...oldSchema.vertices,
          Organization: {
            properties: {
              id: {
                type: PropertyType.STRING,
              },
              name: {
                type: PropertyType.STRING,
              },
            },
            required: ['id', 'name'],
          },
        },
      };
      
      const migratedSchema = migrateSchema(oldSchema, newSchema);
      
      expect(migratedSchema.vertices).toHaveProperty('Person');
      expect(migratedSchema.vertices).toHaveProperty('Organization');
      expect(migratedSchema.version).not.toBe('1.0.0'); // Version should be incremented
    });
    
    it('should throw for breaking changes when not allowed', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              ...oldSchema.vertices.Person.properties,
              age: {
                type: PropertyType.INTEGER, // Changed from NUMBER to INTEGER
                nullable: true,
              },
            },
          },
        },
      };
      
      expect(() => migrateSchema(oldSchema, newSchema, { allowBreakingChanges: false })).toThrow(SchemaVersionError);
    });
    
    it('should allow breaking changes when configured', () => {
      const newSchema = {
        ...oldSchema,
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              ...oldSchema.vertices.Person.properties,
              age: {
                type: PropertyType.INTEGER, // Changed from NUMBER to INTEGER
                nullable: true,
              },
            },
          },
        },
      };
      
      const migratedSchema = migrateSchema(oldSchema, newSchema, { allowBreakingChanges: true });
      
      expect(migratedSchema.vertices.Person.properties.age.type).toBe(PropertyType.INTEGER);
      expect(migratedSchema.version).not.toBe('1.0.0'); // Version should be incremented
    });
    
    it('should increment major version for breaking changes', () => {
      const newSchema = {
        ...oldSchema,
        version: '1.0.0', // Same version as old schema
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            properties: {
              ...oldSchema.vertices.Person.properties,
              age: {
                type: PropertyType.INTEGER, // Changed from NUMBER to INTEGER
                nullable: true,
              },
            },
          },
        },
      };
      
      const migratedSchema = migrateSchema(oldSchema, newSchema, { allowBreakingChanges: true });
      
      expect(migratedSchema.version).toBe('2.0.0'); // Major version bump
    });
    
    it('should increment minor version for non-breaking additions', () => {
      const newSchema = {
        ...oldSchema,
        version: '1.0.0', // Same version as old schema
        vertices: {
          ...oldSchema.vertices,
          Organization: {
            properties: {
              id: {
                type: PropertyType.STRING,
              },
              name: {
                type: PropertyType.STRING,
              },
            },
            required: ['id', 'name'],
          },
        },
      };
      
      const migratedSchema = migrateSchema(oldSchema, newSchema);
      
      expect(migratedSchema.version).toBe('1.1.0'); // Minor version bump
    });
    
    it('should increment patch version for non-breaking modifications', () => {
      const newSchema = {
        ...oldSchema,
        version: '1.0.0', // Same version as old schema
        vertices: {
          Person: {
            ...oldSchema.vertices.Person,
            required: ['id'], // Removed 'name' from required (non-breaking)
          },
        },
      };
      
      const migratedSchema = migrateSchema(oldSchema, newSchema);
      
      expect(migratedSchema.version).toBe('1.0.1'); // Patch version bump
    });
    
    it('should not increment version when autoIncrementVersion is false', () => {
      const newSchema = {
        ...oldSchema,
        version: '1.0.0', // Same version as old schema
        vertices: {
          ...oldSchema.vertices,
          Organization: {
            properties: {
              id: {
                type: PropertyType.STRING,
              },
              name: {
                type: PropertyType.STRING,
              },
            },
            required: ['id', 'name'],
          },
        },
      };
      
      const migratedSchema = migrateSchema(oldSchema, newSchema, { autoIncrementVersion: false });
      
      expect(migratedSchema.version).toBe('1.0.0'); // Version unchanged
    });
  });
});
