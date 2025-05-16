/**
 * Schema fixtures for testing
 */

import { SchemaDefinition } from '../../src/schema/types';

/**
 * Basic schema for testing
 */
const basicSchema: SchemaDefinition = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['id', 'name']
    },
    Company: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        founded: { type: 'number' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'number' }
      },
      from: 'Person',
      to: 'Person'
    },
    WORKS_AT: {
      properties: {
        role: { type: 'string' },
        since: { type: 'number' }
      },
      from: 'Person',
      to: 'Company'
    }
  }
};

/**
 * Organization chart schema for testing
 */
const orgChartSchema: SchemaDefinition = {
  vertices: {
    Employee: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        title: { type: 'string' },
        department: { type: 'string' },
        salary: { type: 'number' }
      },
      required: ['id', 'name', 'title']
    },
    Department: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        budget: { type: 'number' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    REPORTS_TO: {
      properties: {
        since: { type: 'number' }
      },
      from: 'Employee',
      to: 'Employee'
    },
    BELONGS_TO: {
      properties: {
        role: { type: 'string' }
      },
      from: 'Employee',
      to: 'Department'
    },
    MANAGES: {
      properties: {
        since: { type: 'number' }
      },
      from: 'Employee',
      to: 'Department'
    }
  }
};

/**
 * Available schema fixtures
 */
const schemaFixtures: Record<string, SchemaDefinition> = {
  'basic-schema': basicSchema,
  'org-chart-schema': orgChartSchema
};

/**
 * Load a schema fixture by name
 * 
 * @param name - Name of the schema fixture to load
 * @returns Schema definition
 */
export function loadSchemaFixture(name: string): SchemaDefinition {
  const schema = schemaFixtures[name];
  
  if (!schema) {
    throw new Error(`Schema fixture '${name}' not found`);
  }
  
  return schema;
}
