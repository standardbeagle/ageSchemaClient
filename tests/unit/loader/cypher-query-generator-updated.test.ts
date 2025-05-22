/**
 * Unit tests for the updated CypherQueryGenerator class
 *
 * These tests verify that the CypherQueryGenerator correctly generates
 * queries for creating vertices and edges based on the schema definition.
 */

import { describe, it, expect } from 'vitest';
import { SchemaDefinition, PropertyType } from '../../../src/schema/types';
import { CypherQueryGenerator } from '../../../src/loader/cypher-query-generator';

// Sample schema for testing
const testSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER },
        email: { type: PropertyType.STRING }
      },
      required: ['id', 'name']
    },
    Company: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        founded: { type: PropertyType.NUMBER },
        industry: { type: PropertyType.STRING }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      fromLabel: 'Person',
      toLabel: 'Company',
      fromVertex: 'Person',
      toVertex: 'Company',
      properties: {
        from: { type: PropertyType.STRING },
        to: { type: PropertyType.STRING },
        since: { type: PropertyType.NUMBER },
        position: { type: PropertyType.STRING }
      },
      required: ['from', 'to']
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      fromLabel: 'Person',
      toLabel: 'Person',
      fromVertex: 'Person',
      toVertex: 'Person',
      properties: {
        from: { type: PropertyType.STRING },
        to: { type: PropertyType.STRING },
        since: { type: PropertyType.NUMBER }
      },
      required: ['from', 'to']
    }
  }
};

describe('CypherQueryGenerator (Updated)', () => {
  describe('constructor', () => {
    it('should create a new instance with default options', () => {
      const generator = new CypherQueryGenerator(testSchema);
      expect(generator).toBeDefined();
    });

    it('should create a new instance with custom options', () => {
      const generator = new CypherQueryGenerator(testSchema, {
        schemaName: 'custom_schema',
        includeComments: false
      });
      expect(generator).toBeDefined();
    });
  });

  describe('generateCreateVerticesQuery', () => {
    it('should generate a query for creating vertices', () => {
      const generator = new CypherQueryGenerator(testSchema);
      const query = generator.generateCreateVerticesQuery('Person', 'test_graph');

      // Check that the query contains the expected parts
      expect(query).toContain('SELECT * FROM cypher(\'test_graph\'');
      expect(query).toContain('UNWIND age_schema_client.get_vertices(\'Person\') AS vertex_data');
      expect(query).toContain('CREATE (v:Person {');
      expect(query).toContain('id: vertex_data.id');
      expect(query).toContain('name: CASE WHEN vertex_data.name IS NOT NULL THEN vertex_data.name ELSE NULL END');
      expect(query).toContain('age: CASE WHEN vertex_data.age IS NOT NULL THEN vertex_data.age ELSE NULL END');
      expect(query).toContain('email: CASE WHEN vertex_data.email IS NOT NULL THEN vertex_data.email ELSE NULL END');
      expect(query).toContain('RETURN count(v) AS created_vertices');
      expect(query).toContain(') AS (created_vertices agtype)');
    });

    it('should include comments when includeComments is true', () => {
      const generator = new CypherQueryGenerator(testSchema, { includeComments: true });
      const query = generator.generateCreateVerticesQuery('Person', 'test_graph');

      expect(query).toContain('/* Cypher query for creating vertexs */');
      expect(query).toContain('/* Generated from schema definition */');
      expect(query).toContain('/* Vertex properties: id, name, age, email */');
    });

    it('should not include comments when includeComments is false', () => {
      const generator = new CypherQueryGenerator(testSchema, { includeComments: false });
      const query = generator.generateCreateVerticesQuery('Person', 'test_graph');

      expect(query).not.toContain('/* Cypher query for creating vertexs */');
      expect(query).not.toContain('/* Generated from schema definition */');
      expect(query).not.toContain('/* Vertex properties: id, name, age, email */');
    });

    it('should throw an error for non-existent vertex type', () => {
      const generator = new CypherQueryGenerator(testSchema);

      expect(() => {
        generator.generateCreateVerticesQuery('NonExistentType', 'test_graph');
      }).toThrow('Vertex type "NonExistentType" not found in schema');
    });
  });

  describe('generateCreateEdgesQuery', () => {
    it('should generate a query for creating edges', () => {
      const generator = new CypherQueryGenerator(testSchema);
      const query = generator.generateCreateEdgesQuery('WORKS_AT', 'test_graph');

      // Check that the query contains the expected parts
      expect(query).toContain('SELECT * FROM cypher(\'test_graph\'');
      expect(query).toContain('UNWIND age_schema_client.get_edges(\'WORKS_AT\') AS edge_data');
      expect(query).toContain('MATCH (from:Person {id: edge_data.from})');
      expect(query).toContain('MATCH (to:Company {id: edge_data.to})');
      expect(query).toContain('CREATE (from)-[:WORKS_AT {');
      expect(query).toContain('since: CASE WHEN edge_data.since IS NOT NULL THEN edge_data.since ELSE NULL END');
      expect(query).toContain('position: CASE WHEN edge_data.position IS NOT NULL THEN edge_data.position ELSE NULL END');
      expect(query).toContain('RETURN count(*) AS created_edges');
      expect(query).toContain(') AS (created_edges agtype)');
    });

    it('should include comments when includeComments is true', () => {
      const generator = new CypherQueryGenerator(testSchema, { includeComments: true });
      const query = generator.generateCreateEdgesQuery('WORKS_AT', 'test_graph');

      expect(query).toContain('/* Cypher query for creating edges */');
      expect(query).toContain('/* Generated from schema definition */');
      expect(query).toContain('/* Edge properties: from, to, since, position */');
      expect(query).toContain('/* From vertex type: Person */');
      expect(query).toContain('/* To vertex type: Company */');
    });

    it('should not include comments when includeComments is false', () => {
      const generator = new CypherQueryGenerator(testSchema, { includeComments: false });
      const query = generator.generateCreateEdgesQuery('WORKS_AT', 'test_graph');

      expect(query).not.toContain('/* Cypher query for creating edges */');
      expect(query).not.toContain('/* Generated from schema definition */');
      expect(query).not.toContain('/* Edge properties: from, to, since, position */');
      expect(query).not.toContain('/* From vertex type: Person */');
      expect(query).not.toContain('/* To vertex type: Company */');
    });

    it('should throw an error for non-existent edge type', () => {
      const generator = new CypherQueryGenerator(testSchema);

      expect(() => {
        generator.generateCreateEdgesQuery('NON_EXISTENT_EDGE', 'test_graph');
      }).toThrow('Edge type "NON_EXISTENT_EDGE" not found in schema');
    });
  });
});
