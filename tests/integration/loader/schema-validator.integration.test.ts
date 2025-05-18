/**
 * Integration tests for the SchemaValidator class
 *
 * These tests verify that the SchemaValidator correctly validates data against
 * the schema before loading it into the database.
 */

import { describe, it, expect } from 'vitest';
import { SchemaValidator, ValidationOptions } from '../../../src/loader/schema-validator';
import { SchemaDefinition } from '../../../src/schema/types';
import { ValidationError } from '../../../src/core/errors';
import { PropertyType } from '../../../src/schema/types';

// Define a test schema for validation
const testSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        age: { type: PropertyType.NUMBER, minimum: 0, maximum: 120 },
        email: { type: PropertyType.STRING, format: 'email' }
      },
      required: ['id', 'name']
    },
    Department: {
      properties: {
        id: { type: PropertyType.STRING },
        name: { type: PropertyType.STRING },
        budget: { type: PropertyType.NUMBER, minimum: 0 }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    WORKS_IN: {
      properties: {
        since: { type: PropertyType.NUMBER, minimum: 1900, maximum: 2100 },
        role: { type: PropertyType.STRING }
      },
      fromVertex: 'Person',
      toVertex: 'Department',
      required: ['since']
    },
    MANAGES: {
      properties: {
        since: { type: PropertyType.NUMBER, minimum: 1900, maximum: 2100 }
      },
      fromVertex: 'Person',
      toVertex: 'Department',
      required: ['since']
    }
  }
};

describe('SchemaValidator Integration Tests', () => {
  // Test: Create a SchemaValidator
  it('should create a SchemaValidator instance', () => {
    const validator = new SchemaValidator(testSchema);
    expect(validator).toBeInstanceOf(SchemaValidator);
  });

  // Test: Validate a valid vertex
  it('should validate a valid vertex', () => {
    const validator = new SchemaValidator(testSchema);
    const person = {
      id: '1',
      name: 'John Doe',
      age: 30,
      email: 'john@example.com'
    };

    const result = validator.validateVertex('Person', person);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Test: Validate an invalid vertex
  it('should detect an invalid vertex', () => {
    const validator = new SchemaValidator(testSchema, {
      throwOnError: false,
      validateTypes: true,
      validateRequired: true
    });

    const person = {
      id: '1',
      name: 'John Doe',
      age: -10, // Invalid age (below minimum of 0)
      email: 'not-an-email' // Invalid email format
    };

    const result = validator.validateVertex('Person', person);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // Test: Validate a valid edge
  it('should validate a valid edge', () => {
    const validator = new SchemaValidator(testSchema);
    const edge = {
      from: '1',
      to: '2',
      since: 2020,
      role: 'Developer'
    };

    const result = validator.validateEdge('WORKS_IN', edge);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Test: Validate an invalid edge
  it('should detect an invalid edge', () => {
    const validator = new SchemaValidator(testSchema, {
      throwOnError: false,
      validateTypes: true,
      validateRequired: true
    });

    const edge = {
      from: '1',
      to: '2',
      since: 2200 // Invalid year (above maximum of 2100)
    };

    const result = validator.validateEdge('WORKS_IN', edge);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // Test: Validate a collection of vertices
  it('should validate a collection of vertices', () => {
    const validator = new SchemaValidator(testSchema);
    const people = [
      {
        id: '1',
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      },
      {
        id: '2',
        name: 'Jane Smith',
        age: 25,
        email: 'jane@example.com'
      }
    ];

    const result = validator.validateVertices('Person', people);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Test: Validate a collection of vertices with errors
  it('should detect errors in a collection of vertices', () => {
    const validator = new SchemaValidator(testSchema, { throwOnError: false });
    const people = [
      {
        id: '1',
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      },
      {
        id: '2',
        name: 'Jane Smith',
        age: -5, // Invalid age
        email: 'not-an-email' // Invalid email
      },
      {
        id: '3',
        // Missing required name
        age: 40,
        email: 'bob@example.com'
      }
    ];

    const result = validator.validateVertices('Person', people);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Check that errors include index information
    const indexErrors = result.errors.filter(error => error.index !== undefined);
    expect(indexErrors.length).toBeGreaterThan(0);
  });

  // Test: Validate a collection of edges
  it('should validate a collection of edges', () => {
    const validator = new SchemaValidator(testSchema);
    const edges = [
      {
        from: '1',
        to: '1',
        since: 2020,
        role: 'Developer'
      },
      {
        from: '2',
        to: '1',
        since: 2019,
        role: 'Manager'
      }
    ];

    const result = validator.validateEdges('WORKS_IN', edges);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Test: Validate a collection of edges with errors
  it('should detect errors in a collection of edges', () => {
    const validator = new SchemaValidator(testSchema, { throwOnError: false });
    const edges = [
      {
        from: '1',
        to: '1',
        since: 2020,
        role: 'Developer'
      },
      {
        from: '2',
        to: '1',
        since: 2200, // Invalid year
        role: 'Manager'
      },
      {
        from: '3',
        to: '1'
        // Missing required since
      }
    ];

    const result = validator.validateEdges('WORKS_IN', edges);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Check that errors include index information
    const indexErrors = result.errors.filter(error => error.index !== undefined);
    expect(indexErrors.length).toBeGreaterThan(0);
  });

  // Test: Validate graph data
  it('should validate graph data', () => {
    const validator = new SchemaValidator(testSchema);
    const graphData = {
      vertices: {
        Person: [
          {
            id: '1',
            name: 'John Doe',
            age: 30,
            email: 'john@example.com'
          },
          {
            id: '2',
            name: 'Jane Smith',
            age: 25,
            email: 'jane@example.com'
          }
        ],
        Department: [
          {
            id: '1',
            name: 'Engineering',
            budget: 1000000
          }
        ]
      },
      edges: {
        WORKS_IN: [
          {
            from: '1',
            to: '1',
            since: 2020,
            role: 'Developer'
          },
          {
            from: '2',
            to: '1',
            since: 2019,
            role: 'Manager'
          }
        ]
      }
    };

    const result = validator.validateGraphData(graphData);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // Test: Validate graph data with errors
  it('should detect errors in graph data', () => {
    const validator = new SchemaValidator(testSchema, {
      throwOnError: false,
      validateTypes: true,
      validateRequired: true,
      allowUnknownProperties: true
    });

    // Create graph data with validation errors
    const graphData = {
      vertices: {
        Person: [
          {
            id: '1',
            name: 'John Doe',
            age: 30,
            email: 'john@example.com'
          },
          {
            id: '2',
            name: 'Jane Smith',
            age: -5, // Invalid age (below minimum of 0)
            email: 'not-an-email' // Invalid email format
          },
          {
            // Missing required id field
            name: 'Missing ID',
            age: 40,
            email: 'missing@example.com'
          }
        ],
        Department: [
          {
            id: '1',
            name: 'Engineering',
            budget: -1000 // Invalid budget (below minimum of 0)
          },
          {
            id: '2'
            // Missing required name field
          }
        ]
      },
      edges: {
        WORKS_IN: [
          {
            from: '1',
            to: '1',
            // Missing required 'since' field
            role: 'Developer'
          },
          {
            from: '2',
            to: '1',
            since: 2200, // Invalid year (above maximum of 2100)
            role: 'Manager'
          }
        ]
      }
    };

    const result = validator.validateGraphData(graphData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Check that errors include data type information
    const vertexErrors = result.errors.filter(error => error.dataType === 'vertex');
    const edgeErrors = result.errors.filter(error => error.dataType === 'edge');
    expect(vertexErrors.length).toBeGreaterThan(0);
    expect(edgeErrors.length).toBeGreaterThan(0);
  });

  // Test: Throw error when validation fails
  it('should throw an error when validation fails and throwOnError is true', () => {
    const validator = new SchemaValidator(testSchema, {
      throwOnError: true,
      validateTypes: true,
      validateRequired: true
    });

    // Create a person with missing required email and invalid age
    const person = {
      id: '1',
      name: 'John Doe',
      age: -10, // Invalid age (below minimum of 0)
      // Missing required email field
    };

    expect(() => validator.validateVertex('Person', person)).toThrow(ValidationError);
  });

  // Test: Custom validation options
  it('should respect custom validation options', () => {
    const options: ValidationOptions = {
      validateTypes: true,
      validateRequired: false, // Don't validate required properties
      allowUnknownProperties: true
    };

    const validator = new SchemaValidator(testSchema, options);
    const person = {
      id: '1',
      // Missing required name
      age: 30
    };

    const result = validator.validateVertex('Person', person);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
