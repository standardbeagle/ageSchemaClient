/**
 * Unit tests for CypherQueryGenerator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CypherQueryGenerator } from '../../../src/loader/cypher-query-generator';
import { SchemaDefinition, PropertyType } from '../../../src/schema/types';

// Mock schema definition
const mockSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER }
      },
      required: ['name']
    },
    Location: {
      properties: {
        name: { type: PropertyType.STRING },
        latitude: { type: PropertyType.NUMBER },
        longitude: { type: PropertyType.NUMBER }
      },
      required: ['name']
    }
  },
  edges: {
    KNOWS: {
      label: 'KNOWS',
      properties: {
        since: { type: PropertyType.DATE },
        weight: { type: PropertyType.NUMBER }
      },
      from: 'Person',
      to: 'Person',
      fromLabel: 'Person',
      toLabel: 'Person',
      fromVertex: 'Person',
      toVertex: 'Person',
      required: ['since']
    },
    VISITED: {
      label: 'VISITED',
      properties: {
        date: { type: PropertyType.DATE },
        rating: { type: PropertyType.NUMBER },
        distance: { type: PropertyType.NUMBER }
      },
      from: 'Person',
      to: 'Location',
      fromLabel: 'Person',
      toLabel: 'Location',
      fromVertex: 'Person',
      toVertex: 'Location',
      required: ['date']
    }
  }
};

describe('CypherQueryGenerator', () => {
  let generator: CypherQueryGenerator<typeof mockSchema>;

  beforeEach(() => {
    generator = new CypherQueryGenerator(mockSchema);
  });


  describe('generateVertexExistenceQuery', () => {
    it('should generate a valid Cypher query for checking vertex existence', () => {
      const graphName = 'test_graph';

      const query = generator.generateVertexExistenceQuery(graphName);

      // Check that the query contains the expected elements
      expect(query).toContain(`SELECT * FROM cypher('${graphName}'`);
      expect(query).toContain('MATCH (v)');
      expect(query).toContain('RETURN id(v) AS vertex_id');
    });
  });

  describe('generateValidateEdgeEndpointsQuery', () => {
    it('should generate a valid SQL query for validating edge endpoints', () => {
      const edgeTable = 'temp_edges';
      const graphName = 'test_graph';

      const query = generator.generateValidateEdgeEndpointsQuery(edgeTable, graphName);

      // Check that the query contains the expected elements
      expect(query).toContain('WITH vertex_ids AS');
      expect(query).toContain(`SELECT * FROM cypher('${graphName}'`);
      expect(query).toContain('MATCH (v)');
      expect(query).toContain('RETURN id(v) AS vertex_id');
      expect(query).toContain('edge_endpoints AS');
      expect(query).toContain(`FROM ${edgeTable}`);
      expect(query).toContain('SELECT\n        e.from_id,\n        e.to_id,');
      expect(query).toContain('from_exists');
      expect(query).toContain('to_exists');
    });
  });
});
