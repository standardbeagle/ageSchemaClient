/**
 * Unit tests for Cypher query templates
 * 
 * These tests verify that the Cypher query templates for batch operations
 * are correctly generated with the expected structure and property mappings.
 */

import { describe, it, expect } from 'vitest';
import {
  createVertexTemplate,
  createEdgeTemplate,
  generatePropertyMapping,
  createParameterizedVertexTemplate,
  createParameterizedEdgeTemplate
} from '../../../src/loader/cypher-templates';

describe('Cypher query templates', () => {
  describe('createVertexTemplate', () => {
    it('should generate a basic vertex creation template', () => {
      const template = createVertexTemplate('Person');
      
      // Check that the template contains the expected parts
      expect(template).toContain('UNWIND age_schema_client.get_vertices(\'Person\') AS vertex_data');
      expect(template).toContain('CREATE (v:Person {');
      expect(template).toContain('id: vertex_data.id');
      expect(template).toContain('RETURN count(v) AS created_vertices');
    });
    
    it('should use the provided schema name', () => {
      const template = createVertexTemplate('Person', 'custom_schema');
      
      expect(template).toContain('UNWIND custom_schema.get_vertices(\'Person\') AS vertex_data');
    });
  });
  
  describe('generatePropertyMapping', () => {
    it('should generate property mappings for vertex properties', () => {
      const mapping = generatePropertyMapping(['id', 'name', 'age', 'email']);
      
      // id should be skipped as it's handled separately
      expect(mapping).not.toContain('id:');
      
      // Other properties should be included with CASE expressions
      expect(mapping).toContain('name: CASE WHEN vertex_data.name IS NOT NULL THEN vertex_data.name ELSE NULL END');
      expect(mapping).toContain('age: CASE WHEN vertex_data.age IS NOT NULL THEN vertex_data.age ELSE NULL END');
      expect(mapping).toContain('email: CASE WHEN vertex_data.email IS NOT NULL THEN vertex_data.email ELSE NULL END');
    });
    
    it('should generate property mappings for edge properties', () => {
      const mapping = generatePropertyMapping(['from', 'to', 'since', 'strength'], 'edge_data');
      
      // from and to should be skipped as they're handled separately
      expect(mapping).not.toContain('from:');
      expect(mapping).not.toContain('to:');
      
      // Other properties should be included with CASE expressions
      expect(mapping).toContain('since: CASE WHEN edge_data.since IS NOT NULL THEN edge_data.since ELSE NULL END');
      expect(mapping).toContain('strength: CASE WHEN edge_data.strength IS NOT NULL THEN edge_data.strength ELSE NULL END');
    });
    
    it('should return an empty string for no properties', () => {
      const mapping = generatePropertyMapping(['id', 'from', 'to']);
      
      // All properties are skipped, so the result should be an empty string
      expect(mapping).toBe('');
    });
  });
  
  describe('createParameterizedVertexTemplate', () => {
    it('should generate a vertex template with dynamic property mapping', () => {
      const template = createParameterizedVertexTemplate(
        'Person',
        ['id', 'name', 'age', 'email']
      );
      
      // Check that the template contains the expected parts
      expect(template).toContain('UNWIND age_schema_client.get_vertices(\'Person\') AS vertex_data');
      expect(template).toContain('CREATE (v:Person {');
      expect(template).toContain('id: vertex_data.id');
      
      // Check that the property mapping is included
      expect(template).toContain('name: CASE WHEN vertex_data.name IS NOT NULL THEN vertex_data.name ELSE NULL END');
      expect(template).toContain('age: CASE WHEN vertex_data.age IS NOT NULL THEN vertex_data.age ELSE NULL END');
      expect(template).toContain('email: CASE WHEN vertex_data.email IS NOT NULL THEN vertex_data.email ELSE NULL END');
      
      expect(template).toContain('RETURN count(v) AS created_vertices');
    });
  });
  
  describe('createParameterizedEdgeTemplate', () => {
    it('should generate an edge template with dynamic property mapping', () => {
      const template = createParameterizedEdgeTemplate(
        'KNOWS',
        ['from', 'to', 'since', 'strength'],
        'Person',
        'Person'
      );
      
      // Check that the template contains the expected parts
      expect(template).toContain('UNWIND age_schema_client.get_edges(\'KNOWS\') AS edge_data');
      expect(template).toContain('MATCH (from:Person {id: edge_data.from})');
      expect(template).toContain('MATCH (to:Person {id: edge_data.to})');
      expect(template).toContain('CREATE (from)-[:KNOWS {');
      
      // Check that the property mapping is included
      expect(template).toContain('since: CASE WHEN edge_data.since IS NOT NULL THEN edge_data.since ELSE NULL END');
      expect(template).toContain('strength: CASE WHEN edge_data.strength IS NOT NULL THEN edge_data.strength ELSE NULL END');
      
      expect(template).toContain('RETURN count(*) AS created_edges');
    });
  });
});
