import { describe, it, expect } from 'vitest';
import {
  SchemaDefinition,
  VertexLabel,
  EdgeLabel,
  PropertyDefinition,
  PropertyType,
  EdgeMultiplicity,
  EdgeDirection,
} from '../../src/schema/types';

describe('Schema Types', () => {
  it('should create a valid property definition', () => {
    const property: PropertyDefinition = {
      type: PropertyType.STRING,
      description: 'A string property',
      nullable: false,
      stringConstraints: {
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9]+$',
      },
    };
    
    expect(property.type).toBe(PropertyType.STRING);
    expect(property.description).toBe('A string property');
    expect(property.nullable).toBe(false);
    expect(property.stringConstraints?.minLength).toBe(1);
    expect(property.stringConstraints?.maxLength).toBe(100);
    expect(property.stringConstraints?.pattern).toBe('^[a-zA-Z0-9]+$');
  });
  
  it('should create a valid vertex label', () => {
    const vertex: VertexLabel = {
      properties: {
        id: {
          type: PropertyType.STRING,
          description: 'Unique identifier',
        },
        name: {
          type: PropertyType.STRING,
          description: 'Name',
        },
        age: {
          type: PropertyType.NUMBER,
          description: 'Age',
          nullable: true,
        },
      },
      required: ['id', 'name'],
      description: 'A person vertex',
    };
    
    expect(vertex.properties).toHaveProperty('id');
    expect(vertex.properties).toHaveProperty('name');
    expect(vertex.properties).toHaveProperty('age');
    expect(vertex.required).toContain('id');
    expect(vertex.required).toContain('name');
    expect(vertex.description).toBe('A person vertex');
  });
  
  it('should create a valid edge label', () => {
    const edge: EdgeLabel = {
      properties: {
        since: {
          type: PropertyType.DATE,
          description: 'Relationship start date',
        },
        strength: {
          type: PropertyType.NUMBER,
          description: 'Relationship strength',
          nullable: true,
        },
      },
      required: ['since'],
      fromVertex: 'Person',
      toVertex: 'Person',
      multiplicity: EdgeMultiplicity.MANY_TO_MANY,
      direction: EdgeDirection.BIDIRECTIONAL,
      description: 'A friendship relationship',
    };
    
    expect(edge.properties).toHaveProperty('since');
    expect(edge.properties).toHaveProperty('strength');
    expect(edge.required).toContain('since');
    expect(edge.fromVertex).toBe('Person');
    expect(edge.toVertex).toBe('Person');
    expect(edge.multiplicity).toBe(EdgeMultiplicity.MANY_TO_MANY);
    expect(edge.direction).toBe(EdgeDirection.BIDIRECTIONAL);
    expect(edge.description).toBe('A friendship relationship');
  });
  
  it('should create a valid schema definition', () => {
    const schema: SchemaDefinition = {
      version: '1.0.0',
      vertices: {
        Person: {
          properties: {
            id: {
              type: PropertyType.STRING,
              description: 'Unique identifier',
            },
            name: {
              type: PropertyType.STRING,
              description: 'Name',
            },
            age: {
              type: PropertyType.NUMBER,
              description: 'Age',
              nullable: true,
            },
          },
          required: ['id', 'name'],
          description: 'A person vertex',
        },
      },
      edges: {
        FRIEND_OF: {
          properties: {
            since: {
              type: PropertyType.DATE,
              description: 'Friendship start date',
            },
            strength: {
              type: PropertyType.NUMBER,
              description: 'Friendship strength',
              nullable: true,
            },
          },
          required: ['since'],
          fromVertex: 'Person',
          toVertex: 'Person',
          multiplicity: EdgeMultiplicity.MANY_TO_MANY,
          direction: EdgeDirection.BIDIRECTIONAL,
          description: 'A friendship relationship',
        },
      },
      metadata: {
        author: 'Test User',
        description: 'Test schema',
        created: '2023-01-01T00:00:00Z',
      },
    };
    
    expect(schema.version).toBe('1.0.0');
    expect(schema.vertices).toHaveProperty('Person');
    expect(schema.edges).toHaveProperty('FRIEND_OF');
    expect(schema.metadata?.author).toBe('Test User');
    expect(schema.metadata?.description).toBe('Test schema');
    expect(schema.metadata?.created).toBe('2023-01-01T00:00:00Z');
  });
});
