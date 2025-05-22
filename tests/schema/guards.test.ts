import { describe, it, expect } from 'vitest';
import {
  isSchemaVersion,
  isSchemaMetadata,
  isPropertyDefinition,
  isVertexLabel,
  isEdgeLabel,
  isSchemaDefinition,
} from '../../src/schema/guards';
import {
  PropertyType,
  EdgeMultiplicity,
  EdgeDirection,
} from '../../src/schema/types';

describe('Schema Guards', () => {
  describe('isSchemaVersion', () => {
    it('should return true for valid schema versions', () => {
      expect(isSchemaVersion({
        major: 1,
        minor: 2,
        patch: 3,
      })).toBe(true);

      expect(isSchemaVersion({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha.1',
      })).toBe(true);

      expect(isSchemaVersion({
        major: 1,
        minor: 2,
        patch: 3,
        build: 'build.456',
      })).toBe(true);
    });

    it('should return false for invalid schema versions', () => {
      expect(isSchemaVersion(null)).toBe(false);
      expect(isSchemaVersion(undefined)).toBe(false);
      expect(isSchemaVersion('1.2.3')).toBe(false);
      expect(isSchemaVersion({})).toBe(false);
      expect(isSchemaVersion({ major: '1', minor: 2, patch: 3 })).toBe(false);
      expect(isSchemaVersion({ major: 1, minor: '2', patch: 3 })).toBe(false);
      expect(isSchemaVersion({ major: 1, minor: 2, patch: '3' })).toBe(false);
      expect(isSchemaVersion({ major: 1, minor: 2 })).toBe(false);
    });
  });

  describe('isSchemaMetadata', () => {
    it('should return true for valid schema metadata', () => {
      expect(isSchemaMetadata({})).toBe(true);

      expect(isSchemaMetadata({
        author: 'Test User',
      })).toBe(true);

      expect(isSchemaMetadata({
        author: 'Test User',
        description: 'Test schema',
        created: '2023-01-01T00:00:00Z',
        updated: '2023-01-02T00:00:00Z',
      })).toBe(true);

      expect(isSchemaMetadata({
        author: 'Test User',
        customField: 'Custom value',
      })).toBe(true);
    });

    it('should return false for invalid schema metadata', () => {
      expect(isSchemaMetadata(null)).toBe(false);
      expect(isSchemaMetadata(undefined)).toBe(false);
      expect(isSchemaMetadata('metadata')).toBe(false);
      expect(isSchemaMetadata({ author: 123 })).toBe(false);
      expect(isSchemaMetadata({ description: 123 })).toBe(false);
      expect(isSchemaMetadata({ created: 123 })).toBe(false);
      expect(isSchemaMetadata({ updated: 123 })).toBe(false);
    });
  });

  describe('isPropertyDefinition', () => {
    it('should return true for valid property definitions', () => {
      expect(isPropertyDefinition({
        type: PropertyType.STRING,
      })).toBe(true);

      expect(isPropertyDefinition({
        type: PropertyType.NUMBER,
        description: 'A number property',
        nullable: true,
      })).toBe(true);

      expect(isPropertyDefinition({
        type: [PropertyType.STRING, PropertyType.NUMBER],
        description: 'A union property',
      })).toBe(true);
    });

    it('should return false for invalid property definitions', () => {
      expect(isPropertyDefinition(null)).toBe(false);
      expect(isPropertyDefinition(undefined)).toBe(false);
      expect(isPropertyDefinition('property')).toBe(false);
      expect(isPropertyDefinition({})).toBe(false);
      expect(isPropertyDefinition({ type: 'invalid' })).toBe(false);
      expect(isPropertyDefinition({ type: ['invalid'] })).toBe(false);
      expect(isPropertyDefinition({ type: PropertyType.STRING, description: 123 })).toBe(false);
      expect(isPropertyDefinition({ type: PropertyType.STRING, nullable: 'true' })).toBe(false);
    });
  });

  describe('isVertexLabel', () => {
    it('should return true for valid vertex labels', () => {
      expect(isVertexLabel({
        properties: {
          id: {
            type: PropertyType.STRING,
          },
        },
      })).toBe(true);

      expect(isVertexLabel({
        properties: {
          id: {
            type: PropertyType.STRING,
          },
          name: {
            type: PropertyType.STRING,
          },
        },
        required: ['id'],
        description: 'A vertex',
      })).toBe(true);
    });

    it('should return false for invalid vertex labels', () => {
      expect(isVertexLabel(null)).toBe(false);
      expect(isVertexLabel(undefined)).toBe(false);
      expect(isVertexLabel('vertex')).toBe(false);
      expect(isVertexLabel({})).toBe(false);
      expect(isVertexLabel({ properties: null })).toBe(false);
      expect(isVertexLabel({ properties: 'invalid' })).toBe(false);
      expect(isVertexLabel({ properties: {} })).toBe(true); // Empty properties is valid
      expect(isVertexLabel({ properties: { id: 'invalid' } })).toBe(false);
      expect(isVertexLabel({ properties: { id: { type: PropertyType.STRING } }, required: 'id' })).toBe(false);
      expect(isVertexLabel({ properties: { id: { type: PropertyType.STRING } }, required: [123] })).toBe(false);
      expect(isVertexLabel({ properties: { id: { type: PropertyType.STRING } }, description: 123 })).toBe(false);
    });
  });

  describe('isEdgeLabel', () => {
    it('should return true for valid edge labels', () => {
      expect(isEdgeLabel({
        label: 'KNOWS',
        properties: {
          since: {
            type: PropertyType.DATE,
          },
        },
        fromVertex: 'Person',
        toVertex: 'Person',
        from: 'Person',
        to: 'Person',
        fromLabel: 'Person',
        toLabel: 'Person',
      })).toBe(true);

      expect(isEdgeLabel({
        label: 'FRIEND_OF',
        properties: {
          since: {
            type: PropertyType.DATE,
          },
          strength: {
            type: PropertyType.NUMBER,
          },
        },
        required: ['since'],
        fromVertex: 'Person',
        toVertex: 'Person',
        from: 'Person',
        to: 'Person',
        fromLabel: 'Person',
        toLabel: 'Person',
        multiplicity: EdgeMultiplicity.MANY_TO_MANY,
        direction: EdgeDirection.BIDIRECTIONAL,
        description: 'An edge',
      })).toBe(true);
    });

    it('should return false for invalid edge labels', () => {
      expect(isEdgeLabel(null)).toBe(false);
      expect(isEdgeLabel(undefined)).toBe(false);
      expect(isEdgeLabel('edge')).toBe(false);
      expect(isEdgeLabel({})).toBe(false);
      expect(isEdgeLabel({ properties: {} })).toBe(false); // Missing fromVertex and toVertex
      expect(isEdgeLabel({ properties: {}, fromVertex: 'Person' })).toBe(false); // Missing toVertex
      expect(isEdgeLabel({ properties: {}, toVertex: 'Person' })).toBe(false); // Missing fromVertex
      expect(isEdgeLabel({ properties: null, fromVertex: 'Person', toVertex: 'Person' })).toBe(false);
      expect(isEdgeLabel({ properties: 'invalid', fromVertex: 'Person', toVertex: 'Person' })).toBe(false);
      expect(isEdgeLabel({ properties: { since: 'invalid' }, fromVertex: 'Person', toVertex: 'Person' })).toBe(false);
      expect(isEdgeLabel({ properties: {}, fromVertex: 123, toVertex: 'Person' })).toBe(false);
      expect(isEdgeLabel({ properties: {}, fromVertex: 'Person', toVertex: 123 })).toBe(false);
    });
  });

  describe('isSchemaDefinition', () => {
    it('should return true for valid schema definitions', () => {
      expect(isSchemaDefinition({
        version: '1.0.0',
        vertices: {},
        edges: {},
      })).toBe(true);

      expect(isSchemaDefinition({
        version: {
          major: 1,
          minor: 0,
          patch: 0,
        },
        vertices: {
          Person: {
            properties: {
              id: {
                type: PropertyType.STRING,
              },
            },
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
          },
        },
        metadata: {
          author: 'Test User',
        },
      })).toBe(true);
    });

    it('should return false for invalid schema definitions', () => {
      expect(isSchemaDefinition(null)).toBe(false);
      expect(isSchemaDefinition(undefined)).toBe(false);
      expect(isSchemaDefinition('schema')).toBe(false);
      expect(isSchemaDefinition({})).toBe(false);
      expect(isSchemaDefinition({ version: '1.0.0' })).toBe(false); // Missing vertices and edges
      expect(isSchemaDefinition({ version: '1.0.0', vertices: {} })).toBe(false); // Missing edges
      expect(isSchemaDefinition({ version: '1.0.0', edges: {} })).toBe(false); // Missing vertices
      expect(isSchemaDefinition({ version: 123, vertices: {}, edges: {} })).toBe(false);
      expect(isSchemaDefinition({ version: '1.0.0', vertices: null, edges: {} })).toBe(false);
      expect(isSchemaDefinition({ version: '1.0.0', vertices: {}, edges: null })).toBe(false);
      expect(isSchemaDefinition({ version: '1.0.0', vertices: {}, edges: {}, metadata: 'invalid' })).toBe(false);
    });
  });
});
