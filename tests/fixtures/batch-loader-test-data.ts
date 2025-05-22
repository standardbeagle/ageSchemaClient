/**
 * Test data fixtures for BatchLoader integration tests
 *
 * This module provides test data for integration tests of the BatchLoader.
 * It includes sample vertices and edges for various test scenarios.
 */

import { SchemaDefinition } from '../../src/schema/types';
import { GraphData } from '../../src/loader/batch-loader';

/**
 * Test schema for BatchLoader integration tests
 */
export const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' },
        email: { type: 'string' },
        active: { type: 'boolean' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' },
        industry: { type: 'string' },
        public: { type: 'boolean' }
      }
    },
    Department: {
      label: 'Department',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        budget: { type: 'number' }
      }
    },
    Project: {
      label: 'Project',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        budget: { type: 'number' },
        status: { type: 'string' }
      }
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
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' },
        salary: { type: 'number' }
      }
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
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        relationship: { type: 'string' }
      }
    },
    BELONGS_TO: {
      label: 'BELONGS_TO',
      from: 'Department',
      to: 'Company',
      fromLabel: 'Department',
      toLabel: 'Company',
      fromVertex: 'Department',
      toVertex: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' }
      }
    },
    WORKS_IN: {
      label: 'WORKS_IN',
      from: 'Person',
      to: 'Department',
      fromLabel: 'Person',
      toLabel: 'Department',
      fromVertex: 'Person',
      toVertex: 'Department',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        role: { type: 'string' }
      }
    },
    WORKS_ON: {
      label: 'WORKS_ON',
      from: 'Person',
      to: 'Project',
      fromLabel: 'Person',
      toLabel: 'Project',
      fromVertex: 'Person',
      toVertex: 'Project',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        role: { type: 'string' },
        hours: { type: 'number' }
      }
    },
    MANAGES: {
      label: 'MANAGES',
      from: 'Department',
      to: 'Project',
      fromLabel: 'Department',
      toLabel: 'Project',
      fromVertex: 'Department',
      toVertex: 'Project',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        budget: { type: 'number' }
      }
    }
  }
};

/**
 * Basic test data for BatchLoader integration tests
 */
export const basicTestData: GraphData = {
  vertices: {
    Person: [
      { id: 'p1', name: 'Alice Smith', age: 30, email: 'alice@example.com', active: true },
      { id: 'p2', name: 'Bob Johnson', age: 25, email: 'bob@example.com', active: true },
      { id: 'p3', name: 'Charlie Brown', age: 35, email: 'charlie@example.com', active: false }
    ],
    Company: [
      { id: 'c1', name: 'Acme Inc.', founded: 1990, industry: 'Technology', public: true },
      { id: 'c2', name: 'Globex Corp', founded: 2000, industry: 'Manufacturing', public: false }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: 'p1', to: 'c1', since: 2015, position: 'Manager', salary: 100000 },
      { from: 'p2', to: 'c1', since: 2018, position: 'Developer', salary: 80000 },
      { from: 'p3', to: 'c2', since: 2010, position: 'Director', salary: 120000 }
    ],
    KNOWS: [
      { from: 'p1', to: 'p2', since: 2018, relationship: 'Colleague' },
      { from: 'p2', to: 'p3', since: 2019, relationship: 'Friend' }
    ]
  }
};

/**
 * Extended test data for BatchLoader integration tests
 * Includes all vertex and edge types defined in the schema
 */
export const extendedTestData: GraphData = {
  vertices: {
    Person: [
      { id: 'p1', name: 'Alice Smith', age: 30, email: 'alice@example.com', active: true },
      { id: 'p2', name: 'Bob Johnson', age: 25, email: 'bob@example.com', active: true },
      { id: 'p3', name: 'Charlie Brown', age: 35, email: 'charlie@example.com', active: false },
      { id: 'p4', name: 'Diana Prince', age: 28, email: 'diana@example.com', active: true },
      { id: 'p5', name: 'Edward Smith', age: 40, email: 'edward@example.com', active: true }
    ],
    Company: [
      { id: 'c1', name: 'Acme Inc.', founded: 1990, industry: 'Technology', public: true },
      { id: 'c2', name: 'Globex Corp', founded: 2000, industry: 'Manufacturing', public: false }
    ],
    Department: [
      { id: 'd1', name: 'Engineering', budget: 1000000 },
      { id: 'd2', name: 'Marketing', budget: 500000 },
      { id: 'd3', name: 'HR', budget: 300000 }
    ],
    Project: [
      { id: 'pr1', name: 'Website Redesign', startDate: '2023-01-01', endDate: '2023-06-30', budget: 200000, status: 'In Progress' },
      { id: 'pr2', name: 'Mobile App', startDate: '2023-03-15', endDate: '2023-12-31', budget: 350000, status: 'Planning' },
      { id: 'pr3', name: 'Database Migration', startDate: '2023-02-01', endDate: '2023-04-30', budget: 150000, status: 'Completed' }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: 'p1', to: 'c1', since: 2015, position: 'Manager', salary: 100000 },
      { from: 'p2', to: 'c1', since: 2018, position: 'Developer', salary: 80000 },
      { from: 'p3', to: 'c2', since: 2010, position: 'Director', salary: 120000 },
      { from: 'p4', to: 'c1', since: 2019, position: 'Designer', salary: 85000 },
      { from: 'p5', to: 'c2', since: 2017, position: 'Manager', salary: 110000 }
    ],
    KNOWS: [
      { from: 'p1', to: 'p2', since: 2018, relationship: 'Colleague' },
      { from: 'p2', to: 'p3', since: 2019, relationship: 'Friend' },
      { from: 'p1', to: 'p4', since: 2020, relationship: 'Colleague' },
      { from: 'p3', to: 'p5', since: 2015, relationship: 'Friend' }
    ],
    BELONGS_TO: [
      { from: 'd1', to: 'c1', since: 1995 },
      { from: 'd2', to: 'c1', since: 1997 },
      { from: 'd3', to: 'c2', since: 2005 }
    ],
    WORKS_IN: [
      { from: 'p1', to: 'd1', role: 'Department Head' },
      { from: 'p2', to: 'd1', role: 'Team Member' },
      { from: 'p3', to: 'd3', role: 'Department Head' },
      { from: 'p4', to: 'd2', role: 'Team Member' },
      { from: 'p5', to: 'd3', role: 'Team Member' }
    ],
    WORKS_ON: [
      { from: 'p1', to: 'pr1', role: 'Project Manager', hours: 20 },
      { from: 'p2', to: 'pr1', role: 'Developer', hours: 40 },
      { from: 'p4', to: 'pr1', role: 'Designer', hours: 30 },
      { from: 'p2', to: 'pr3', role: 'Developer', hours: 25 },
      { from: 'p5', to: 'pr2', role: 'Project Manager', hours: 15 }
    ],
    MANAGES: [
      { from: 'd1', to: 'pr1', budget: 150000 },
      { from: 'd1', to: 'pr3', budget: 150000 },
      { from: 'd2', to: 'pr2', budget: 200000 }
    ]
  }
};

/**
 * Generate a large dataset for performance testing
 *
 * @param personCount - Number of persons to generate
 * @param companyCount - Number of companies to generate
 * @param edgeDensity - Percentage of possible edges to create (0-1)
 * @returns Large graph data
 */
export function generateLargeTestData(
  personCount: number = 100,
  companyCount: number = 10,
  edgeDensity: number = 0.3
): GraphData {
  const vertices: GraphData['vertices'] = {
    Person: [],
    Company: []
  };

  const edges: GraphData['edges'] = {
    WORKS_AT: [],
    KNOWS: []
  };

  // Generate persons
  for (let i = 0; i < personCount; i++) {
    vertices.Person.push({
      id: `person-${i}`,
      name: `Person ${i}`,
      age: 20 + (i % 50),
      email: `person${i}@example.com`,
      active: i % 5 !== 0 // 80% active
    });
  }

  // Generate companies
  for (let i = 0; i < companyCount; i++) {
    vertices.Company.push({
      id: `company-${i}`,
      name: `Company ${i}`,
      founded: 1980 + (i * 2),
      industry: i % 3 === 0 ? 'Technology' : (i % 3 === 1 ? 'Manufacturing' : 'Services'),
      public: i % 2 === 0 // 50% public
    });
  }

  // Generate WORKS_AT edges
  for (let i = 0; i < personCount; i++) {
    // Each person works at one company
    const companyIndex = i % companyCount;
    edges.WORKS_AT.push({
      from: `person-${i}`,
      to: `company-${companyIndex}`,
      since: 2010 + (i % 10),
      position: i % 5 === 0 ? 'Manager' : (i % 5 === 1 ? 'Developer' : (i % 5 === 2 ? 'Designer' : (i % 5 === 3 ? 'Analyst' : 'Intern'))),
      salary: 50000 + (i % 10) * 10000
    });
  }

  // Generate KNOWS edges
  for (let i = 0; i < personCount; i++) {
    // Each person knows some other persons based on edge density
    for (let j = 0; j < personCount; j++) {
      if (i !== j && Math.random() < edgeDensity) {
        edges.KNOWS.push({
          from: `person-${i}`,
          to: `person-${j}`,
          since: 2015 + (i % 5),
          relationship: i % 3 === 0 ? 'Friend' : (i % 3 === 1 ? 'Colleague' : 'Acquaintance')
        });
      }
    }
  }

  return { vertices, edges };
}
