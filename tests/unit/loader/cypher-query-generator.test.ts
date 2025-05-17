/**
 * Unit tests for CypherQueryGenerator
 */

import { describe, it, expect } from 'vitest';
import { CypherQueryGenerator } from '../../../src/loader/cypher-query-generator';
import { SchemaDefinition } from '../../../src/schema/types';

// Mock schema definition
const mockSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    },
    Location: {
      properties: {
        name: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' }
      },
      required: ['name']
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'date' },
        weight: { type: 'number' }
      },
      source: 'Person',
      target: 'Person',
      required: ['since']
    },
    VISITED: {
      properties: {
        date: { type: 'date' },
        rating: { type: 'number' },
        distance: { type: 'number' }
      },
      source: 'Person',
      target: 'Location',
      required: ['date']
    }
  }
};

describe('CypherQueryGenerator', () => {
  let generator: CypherQueryGenerator<typeof mockSchema>;

  beforeEach(() => {
    generator = new CypherQueryGenerator(mockSchema);
  });

  describe('generateCreateEdgesQuery', () => {
    it('should generate a valid Cypher query for creating edges', () => {
      const functionName = 'test_schema.get_edges';
      const graphName = 'test_graph';

      const query = generator.generateCreateEdgesQuery(functionName, graphName);

      // Check that the query contains the expected elements
      expect(query).toContain('SET search_path = ag_catalog, "$user", public');
      expect(query).toContain(`SELECT * FROM cypher('${graphName}'`);
      expect(query).toContain(`UNWIND (SELECT ${functionName}()) AS batch`);
      expect(query).toContain('WITH batch.type AS edge_type');
      expect(query).toContain('batch.from AS from_id');
      expect(query).toContain('batch.to AS to_id');
      expect(query).toContain('batch.properties AS properties');
      expect(query).toContain('MATCH (source), (target)');
      expect(query).toContain('WHERE id(source) = toInteger(from_id) AND id(target) = toInteger(to_id)');
      expect(query).toContain('CREATE (source)-[r:$$||edge_type||$$');
      expect(query).toContain('RETURN edge_type, id(r) AS edge_id');
    });
  });

  describe('generateVertexExistenceQuery', () => {
    it('should generate a valid Cypher query for checking vertex existence', () => {
      const graphName = 'test_graph';

      const query = generator.generateVertexExistenceQuery(graphName);

      // Check that the query contains the expected elements
      expect(query).toContain('SET search_path = ag_catalog, "$user", public');
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
