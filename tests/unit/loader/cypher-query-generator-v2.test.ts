/**
 * Unit tests for the updated Cypher query generator
 * 
 * These tests verify that the Cypher query generator correctly generates
 * queries for creating vertices and edges based on the schema definition.
 */

import { describe, it, expect } from 'vitest';
import { SchemaDefinition } from '../../../src/schema/types';
import { 
  createParameterizedVertexTemplate, 
  createParameterizedEdgeTemplate 
} from '../../../src/loader/cypher-templates';

// Sample schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' },
        email: { type: 'string' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' },
        industry: { type: 'string' }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' }
      }
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' }
      }
    }
  }
};

describe('Cypher Query Generator V2', () => {
  describe('createParameterizedVertexTemplate', () => {
    it('should generate a vertex template with all properties', () => {
      const vertexType = 'Person';
      const propertyNames = ['id', 'name', 'age', 'email'];
      
      const template = createParameterizedVertexTemplate(vertexType, propertyNames);
      
      // Check that the template contains the expected parts
      expect(template).toContain('UNWIND age_schema_client.get_vertices($vertex_type) AS vertex_data');
      expect(template).toContain('CREATE (v:Person {');
      expect(template).toContain('id: vertex_data.id');
      
      // Check that all properties are included
      expect(template).toContain('name: CASE WHEN vertex_data.name IS NOT NULL THEN vertex_data.name ELSE NULL END');
      expect(template).toContain('age: CASE WHEN vertex_data.age IS NOT NULL THEN vertex_data.age ELSE NULL END');
      expect(template).toContain('email: CASE WHEN vertex_data.email IS NOT NULL THEN vertex_data.email ELSE NULL END');
      
      expect(template).toContain('RETURN count(v) AS created_vertices');
    });
    
    it('should generate a vertex template with custom schema name', () => {
      const vertexType = 'Person';
      const propertyNames = ['id', 'name', 'age', 'email'];
      const schemaName = 'custom_schema';
      
      const template = createParameterizedVertexTemplate(vertexType, propertyNames, schemaName);
      
      expect(template).toContain(`UNWIND ${schemaName}.get_vertices($vertex_type) AS vertex_data`);
    });
  });
  
  describe('createParameterizedEdgeTemplate', () => {
    it('should generate an edge template with all properties', () => {
      const edgeType = 'WORKS_AT';
      const propertyNames = ['from', 'to', 'since', 'position'];
      
      const template = createParameterizedEdgeTemplate(edgeType, propertyNames);
      
      // Check that the template contains the expected parts
      expect(template).toContain('UNWIND age_schema_client.get_edges($edge_type) AS edge_data');
      expect(template).toContain('MATCH (from {id: edge_data.from})');
      expect(template).toContain('MATCH (to {id: edge_data.to})');
      expect(template).toContain('CREATE (from)-[:WORKS_AT {');
      
      // Check that all properties except 'from' and 'to' are included
      expect(template).not.toContain('from:');
      expect(template).not.toContain('to:');
      expect(template).toContain('since: CASE WHEN edge_data.since IS NOT NULL THEN edge_data.since ELSE NULL END');
      expect(template).toContain('position: CASE WHEN edge_data.position IS NOT NULL THEN edge_data.position ELSE NULL END');
      
      expect(template).toContain('RETURN count(*) AS created_edges');
    });
    
    it('should generate an edge template with custom schema name', () => {
      const edgeType = 'WORKS_AT';
      const propertyNames = ['from', 'to', 'since', 'position'];
      const schemaName = 'custom_schema';
      
      const template = createParameterizedEdgeTemplate(edgeType, propertyNames, schemaName);
      
      expect(template).toContain(`UNWIND ${schemaName}.get_edges($edge_type) AS edge_data`);
    });
  });
});
