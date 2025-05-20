/**
 * Integration tests for property matching methods in ageSchemaClient
 *
 * These tests verify that the property matching methods in MatchClause and EdgeMatchClause
 * work correctly with Apache AGE.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable
} from '../setup/integration';
import { QueryBuilder } from '../../src/query/builder';
import { OrderDirection } from '../../src/query/types';
import { SchemaDefinition } from '../../src/schema/types';

// Graph name for the property matching tests
const PROPERTY_MATCHING_TEST_GRAPH = 'property_matching_test_graph';

// Define a schema for the test
const testSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' }
      },
      required: ['id', 'name']
    },
    Company: {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        founded: { type: 'number' },
        industry: { type: 'string' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    WORKS_AT: {
      properties: {
        since: { type: 'number' },
        role: { type: 'string' },
        salary: { type: 'number' },
        department: { type: 'string' }
      },
      fromVertex: 'Person',
      toVertex: 'Company'
    },
    KNOWS: {
      properties: {
        since: { type: 'number' },
        relationship: { type: 'string' }
      },
      fromVertex: 'Person',
      toVertex: 'Person'
    }
  },
  metadata: {
    description: 'Test schema for property matching integration tests'
  }
};

describe('Property Matching Integration', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Drop the test graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PROPERTY_MATCHING_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PROPERTY_MATCHING_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${PROPERTY_MATCHING_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${PROPERTY_MATCHING_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
      return;
    }

    // Create test data
    // Create persons
    await queryExecutor.executeCypher(`
      CREATE (p1:Person {id: 'p1', name: 'Alice', age: 30, active: true})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (p2:Person {id: 'p2', name: 'Bob', age: 25, active: false})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (p3:Person {id: 'p3', name: 'Charlie', age: 35, active: true})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (p4:Person {id: 'p4', name: 'Diana', age: 28, active: false})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    // Create companies
    await queryExecutor.executeCypher(`
      CREATE (c1:Company {id: 'c1', name: 'Acme Inc.', founded: 1990, industry: 'Technology'})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      CREATE (c2:Company {id: 'c2', name: 'Globex Corp', founded: 1985, industry: 'Finance'})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    // Create WORKS_AT edges
    await queryExecutor.executeCypher(`
      MATCH (p1:Person {id: 'p1'})
      MATCH (c1:Company {id: 'c1'})
      CREATE (p1)-[e:WORKS_AT {since: 2015, role: 'Developer', salary: 100000, department: 'Engineering'}]->(c1)
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      MATCH (p2:Person {id: 'p2'})
      MATCH (c1:Company {id: 'c1'})
      CREATE (p2)-[e:WORKS_AT {since: 2018, role: 'Designer', salary: 90000, department: 'Design'}]->(c1)
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      MATCH (p3:Person {id: 'p3'})
      MATCH (c2:Company {id: 'c2'})
      CREATE (p3)-[e:WORKS_AT {since: 2010, role: 'Manager', salary: 120000, department: 'Management'}]->(c2)
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    // Create KNOWS edges
    await queryExecutor.executeCypher(`
      MATCH (p1:Person {id: 'p1'})
      MATCH (p2:Person {id: 'p2'})
      CREATE (p1)-[e:KNOWS {since: 2016, relationship: 'Colleague'}]->(p2)
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      MATCH (p1:Person {id: 'p1'})
      MATCH (p3:Person {id: 'p3'})
      CREATE (p1)-[e:KNOWS {since: 2012, relationship: 'Friend'}]->(p3)
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    await queryExecutor.executeCypher(`
      MATCH (p2:Person {id: 'p2'})
      MATCH (p4:Person {id: 'p4'})
      CREATE (p2)-[e:KNOWS {since: 2019, relationship: 'Friend'}]->(p4)
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PROPERTY_MATCHING_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PROPERTY_MATCHING_TEST_GRAPH}: ${error.message}`);
    }
  });

  // Test: Filter vertices by property constraints
  it('should filter vertices by property constraints', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with property constraints
    const result = await queryBuilder
      .match('Person', 'p')
      .where('p.age >= 30 AND p.active = true')
      .done()
      .return('p.name AS name', 'p.age AS age')
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(2);

    // Sort the results by name for consistent testing
    const sortedResults = [...result.rows].sort((a, b) =>
      JSON.parse(a.name).localeCompare(JSON.parse(b.name))
    );

    // Check that Charlie and Alice are in the results (both are active and >= 30)
    expect(JSON.parse(sortedResults[0].name)).toBe('Alice');
    expect(JSON.parse(sortedResults[1].name)).toBe('Charlie');
  });

  // Test: Filter edges by property constraints
  it('should filter edges by property constraints', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with edge property constraints
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Company', 'c')
      .done()
      .match('p', 'WORKS_AT', 'c', 'e')
      .constraint({ role: 'Developer' })
      .done()
      .return('p.name AS name', 'c.name AS company', 'e.role AS role')
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('Alice');
    expect(JSON.parse(result.rows[0].company)).toBe('Acme Inc.');
    expect(JSON.parse(result.rows[0].role)).toBe('Developer');
  });

  // Test: Filter edges by multiple property constraints
  it('should filter edges by multiple property constraints', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with multiple edge property constraints
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Company', 'c')
      .done()
      .match('p', 'WORKS_AT', 'c', 'e')
      .where('e.since >= 2015 AND e.salary >= 95000')
      .done()
      .return('p.name AS name', 'c.name AS company', 'e.role AS role', 'e.salary AS salary')
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('Alice');
    expect(JSON.parse(result.rows[0].company)).toBe('Acme Inc.');
    expect(JSON.parse(result.rows[0].role)).toBe('Developer');
    expect(JSON.parse(result.rows[0].salary)).toBe(100000);
  });

  // Test: Combine vertex and edge property constraints
  it('should combine vertex and edge property constraints', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with both vertex and edge property constraints
    const result = await queryBuilder
      .match('Person', 'p')
      .constraint({ active: true })
      .done()
      .match('Company', 'c')
      .constraint({ industry: 'Technology' })
      .done()
      .match('p', 'WORKS_AT', 'c', 'e')
      .constraint({ role: 'Developer' })
      .done()
      .return('p.name AS name', 'c.name AS company', 'e.role AS role')
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('Alice');
    expect(JSON.parse(result.rows[0].company)).toBe('Acme Inc.');
    expect(JSON.parse(result.rows[0].role)).toBe('Developer');
  });

  // Test: Use where method with a condition string on EdgeMatchClause
  it('should use where method with a condition string on EdgeMatchClause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with a condition string
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Company', 'c')
      .done()
      .match('p', 'WORKS_AT', 'c', 'e')
      .where('e.salary > $minSalary', { minSalary: 95000 })
      .done()
      .return('p.name AS name', 'c.name AS company', 'e.salary AS salary')
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(2);

    // Sort the results by name for consistent testing
    const sortedResults = [...result.rows].sort((a, b) =>
      JSON.parse(a.name).localeCompare(JSON.parse(b.name))
    );

    expect(JSON.parse(sortedResults[0].name)).toBe('Alice');
    expect(JSON.parse(sortedResults[0].company)).toBe('Acme Inc.');
    expect(JSON.parse(sortedResults[0].salary)).toBe(100000);

    expect(JSON.parse(sortedResults[1].name)).toBe('Charlie');
    expect(JSON.parse(sortedResults[1].company)).toBe('Globex Corp');
    expect(JSON.parse(sortedResults[1].salary)).toBe(120000);
  });

  // Test: Combine property constraints with condition strings on EdgeMatchClause
  it('should combine property constraints with condition strings on EdgeMatchClause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with both property constraints and condition strings
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Company', 'c')
      .done()
      .match('p', 'WORKS_AT', 'c', 'e')
      .constraint({ department: 'Engineering' })
      .where('e.salary > $minSalary', { minSalary: 90000 })
      .done()
      .return('p.name AS name', 'c.name AS company', 'e.department AS department', 'e.salary AS salary')
      .execute();

    // Verify the result
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('Alice');
    expect(JSON.parse(result.rows[0].company)).toBe('Acme Inc.');
    expect(JSON.parse(result.rows[0].department)).toBe('Engineering');
    expect(JSON.parse(result.rows[0].salary)).toBe(100000);
  });

  // Test: Handle non-existent properties in property constraints
  it('should handle non-existent properties in property constraints', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Build and execute the query using the query builder with a non-existent property
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .match('Company', 'c')
      .done()
      .match('p', 'WORKS_AT', 'c', 'e')
      .constraint({ nonExistentProperty: 'someValue' })
      .done()
      .return('p.name AS name', 'c.name AS company')
      .execute();

    // Verify the result - should return no rows since the property doesn't exist
    expect(result.rows).toHaveLength(0);
  });

  // Test: Throw error for null values in property constraints
  it('should throw error for null values in property constraints', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, create a vertex with a null property
    await queryExecutor.executeCypher(`
      CREATE (p5:Person {id: 'p5', name: 'Eve', age: null, active: true})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Expect an error when using null in property constraints
    await expect(async () => {
      await queryBuilder
        .match('Person', 'p')
        .constraint({ age: null })
        .done()
        .return('p.name AS name', 'p.age AS age')
        .execute();
    }).rejects.toThrow(/Invalid property value for 'age': null/);

    // Show how to properly query for missing properties using WHERE clause with NOT exists
    const missingPropertyResult = await queryBuilder
      .match('Person', 'p')
      .done()
      .where('NOT exists(p.age)')
      .return('p.name AS name', 'p.age AS age')
      .execute();

    // Verify the result
    expect(missingPropertyResult.rows).toHaveLength(1);
    expect(JSON.parse(missingPropertyResult.rows[0].name)).toBe('Eve');
    expect(missingPropertyResult.rows[0].age).toBeNull();
  });

  // Test: Automatically convert null values in WHERE clause parameters to NOT exists expressions
  it('should automatically convert null values in WHERE clause parameters to NOT exists expressions', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, create a vertex with a null property
    await queryExecutor.executeCypher(`
      CREATE (p6:Person {id: 'p6', name: 'Frank', active: true})
    `, {}, PROPERTY_MATCHING_TEST_GRAPH);

    // Create a new query builder for this test
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PROPERTY_MATCHING_TEST_GRAPH);

    // Use null value in WHERE clause parameter - should be automatically converted to NOT exists
    const result = await queryBuilder
      .match('Person', 'p')
      .done()
      .where('p.age = $age', { age: null })
      .return('p.name AS name', 'p.id AS id')
      .execute();

    // Verify the result - should find the person without an age property
    expect(result.rows).toHaveLength(1);
    expect(JSON.parse(result.rows[0].name)).toBe('Frank');
    expect(JSON.parse(result.rows[0].id)).toBe('p6');
  });
});
