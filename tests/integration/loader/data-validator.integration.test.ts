/**
 * Integration tests for the DataValidator class
 * 
 * These tests verify that the DataValidator correctly validates
 * vertex and edge data against the schema.
 */

import { describe, it, expect } from 'vitest';
import { DataValidator } from '../../../src/loader/data-validator';
import { GraphData } from '../../../src/loader/data-validator-types';
import { SchemaDefinition } from '../../../src/schema/types';

// Sample schema for testing
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
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
        since: { type: 'number' }
      }
    }
  }
};

describe('DataValidator Integration Tests', () => {
  it('should validate valid graph data', () => {
    const validator = new DataValidator(testSchema);
    
    const graphData: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice', age: 30 },
          { id: '2', name: 'Bob', age: 25 }
        ],
        Company: [
          { id: '3', name: 'Acme Inc.', founded: 1990 }
        ]
      },
      edges: {
        WORKS_AT: [
          { from: '1', to: '3', since: 2015 },
          { from: '2', to: '3', since: 2018 }
        ]
      }
    };
    
    const result = validator.validateData(graphData);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
  
  it('should detect unknown vertex types', () => {
    const validator = new DataValidator(testSchema);
    
    const graphData: GraphData = {
      vertices: {
        Person: [
          { id: '1', name: 'Alice', age: 30 }
        ],
        UnknownType: [
          { id: '2', name: 'Unknown' }
        ]
      },
      edges: {}
    };
    
    const result = validator.validateData(graphData);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe('vertex');
    expect(result.errors[0].entityType).toBe('UnknownType');
    expect(result.errors[0].message).toContain('Unknown vertex type');
  });
});
