/**
 * Unit tests for the DataValidator class
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

describe('DataValidator', () => {
  describe('constructor', () => {
    it('should create a new instance', () => {
      const validator = new DataValidator(testSchema);
      expect(validator).toBeDefined();
    });
  });

  describe('validateData', () => {
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
            { from: '1', to: '3', since: 2015, position: 'Manager' },
            { from: '2', to: '3', since: 2018, position: 'Developer' }
          ],
          KNOWS: [
            { from: '1', to: '2', since: 2010 }
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('vertex');
      expect(result.errors[0].entityType).toBe('UnknownType');
      expect(result.errors[0].message).toContain('Unknown vertex type');
    });

    it('should detect missing required vertex properties', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '2', age: 25 } // Missing required name property
          ]
        },
        edges: {}
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('vertex');
      expect(result.errors[0].entityType).toBe('Person');
      expect(result.errors[0].index).toBe(1);
      expect(result.errors[0].message).toContain('Missing required property: name');
    });

    it('should detect invalid vertex property types', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: '30' } // Age should be a number
          ]
        },
        edges: {}
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('vertex');
      expect(result.errors[0].entityType).toBe('Person');
      expect(result.errors[0].index).toBe(0);
      expect(result.errors[0].message).toContain('Invalid type for property age');
    });

    it('should warn about unknown vertex properties', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30, unknownProp: 'value' }
          ]
        },
        edges: {}
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unknown property: unknownProp');
    });

    it('should warn about duplicate vertex IDs', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '1', name: 'Alice Clone', age: 25 } // Duplicate ID
          ]
        },
        edges: {}
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(2); // One for each duplicate ID and one summary
      expect(result.warnings[0]).toContain('Duplicate vertex ID: 1');
    });

    it('should detect unknown edge types', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '2', name: 'Bob', age: 25 }
          ]
        },
        edges: {
          UNKNOWN_EDGE: [
            { from: '1', to: '2' }
          ]
        }
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('edge');
      expect(result.errors[0].entityType).toBe('UNKNOWN_EDGE');
      expect(result.errors[0].message).toContain('Unknown edge type');
    });

    it('should detect missing from/to properties in edges', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 },
            { id: '2', name: 'Bob', age: 25 }
          ]
        },
        edges: {
          KNOWS: [
            { from: '1' }, // Missing to
            { to: '2' }    // Missing from
          ]
        }
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe('edge');
      expect(result.errors[0].entityType).toBe('KNOWS');
      expect(result.errors[0].index).toBe(0);
      expect(result.errors[0].message).toContain('missing a \'to\' property');

      expect(result.errors[1].type).toBe('edge');
      expect(result.errors[1].entityType).toBe('KNOWS');
      expect(result.errors[1].index).toBe(1);
      expect(result.errors[1].message).toContain('missing a \'from\' property');
    });

    it('should warn about references to non-existent vertices', () => {
      const validator = new DataValidator(testSchema);

      const graphData: GraphData = {
        vertices: {
          Person: [
            { id: '1', name: 'Alice', age: 30 }
          ],
          Company: [
            { id: '3', name: 'Acme Inc.', founded: 1990 }
          ]
        },
        edges: {
          WORKS_AT: [
            { from: '1', to: '3', since: 2015 },
            { from: '2', to: '3', since: 2018 } // Person with ID 2 doesn't exist
          ]
        }
      };

      const result = validator.validateData(graphData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('references non-existent from vertex: 2');
    });
  });
});
