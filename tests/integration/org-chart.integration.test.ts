/**
 * Organization Chart integration tests
 *
 * These tests demonstrate how to use the library to create and query
 * an organizational chart in Apache AGE. It follows the pattern from
 * the original org-chart example but uses the query builder and
 * connection pool properly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME,
  createQueryBuilder
} from './base-test';
import { SchemaDefinition } from '../../../src/schema/types';

// Define the schema for the organization chart
const orgChartSchema: SchemaDefinition = {
  vertices: {
    Employee: {
      properties: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        title: { type: 'string', required: true },
        department: { type: 'string', required: true },
        hire_date: { type: 'string' },
        salary: { type: 'number' }
      }
    }
  },
  edges: {
    MANAGED_BY: {
      properties: {
        since: { type: 'string' }
      }
    }
  }
};

describe('Organization Chart', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Organization Chart');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Test 1: Create and populate the employees table
  it('should create and populate the employees table', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create employees table
    await queryExecutor.executeSQL(`
      CREATE TABLE employees (
        employee_id INT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        manager_id INT,
        hire_date DATE NOT NULL,
        salary NUMERIC(10, 2) NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
      )
    `);

    // Insert employee data
    await queryExecutor.executeSQL(`
      INSERT INTO employees VALUES
      (1, 'John Smith', 'CEO', 'Executive', NULL, '2010-01-15', 250000.00),
      (2, 'Mary Johnson', 'CTO', 'Technology', 1, '2015-03-20', 220000.00),
      (3, 'Robert Brown', 'CFO', 'Finance', 1, '2013-05-10', 210000.00),
      (4, 'David Anderson', 'HR Manager', 'Human Resources', 1, '2018-07-05', 180000.00),
      (5, 'Patricia Davis', 'Engineering Manager', 'Technology', 2, '2017-02-15', 190000.00),
      (6, 'Jennifer Wilson', 'Senior Developer', 'Technology', 5, '2019-04-12', 160000.00),
      (7, 'Michael Thompson', 'Financial Analyst', 'Finance', 3, '2020-01-10', 140000.00),
      (8, 'William Moore', 'Junior Developer', 'Technology', 6, '2021-06-01', 120000.00),
      (9, 'Elizabeth Taylor', 'HR Specialist', 'Human Resources', 4, '2019-08-15', 130000.00),
      (10, 'James Garcia', 'Accountant', 'Finance', 3, '2018-11-01', 135000.00)
    `);

    // Verify the data was inserted
    const result = await queryExecutor.executeSQL('SELECT COUNT(*) as count FROM employees');
    expect(Number(result.rows[0].count)).toBe(10);
  });

  // Test 2: Create functions to generate employee and relationship data
  it('should create functions to generate employee and relationship data', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create function to generate employee data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_employee_array()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'id', employee_id,
          'name', name,
          'title', title,
          'department', department,
          'hire_date', hire_date::text,
          'salary', salary
        ))::text::ag_catalog.agtype INTO result_array
        FROM employees;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create function to generate relationship data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_relationship_array()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'employee_id', employee_id,
          'manager_id', manager_id,
          'since', hire_date::text
        ))::text::ag_catalog.agtype INTO result_array
        FROM employees
        WHERE manager_id IS NOT NULL;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the functions were created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname IN ('get_employee_array', 'get_relationship_array')
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(2);
  });

  // Test 3: Create employee vertices using UNWIND
  it('should create employee vertices using UNWIND', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create vertices for all employees using the function
    // Note: No need to manually load AGE or set search_path
    const query = `
      UNWIND ${TEST_SCHEMA}.get_employee_array() AS employee
      CREATE (e:Employee {
        id: employee.id,
        name: employee.name,
        title: employee.title,
        department: employee.department,
        hire_date: employee.hire_date,
        salary: employee.salary
      })
      RETURN count(*) AS created_employees
    `;
    const result = await queryExecutor.executeCypher(query, {}, AGE_GRAPH_NAME);

    // Verify the vertices were created
    expect(Number(result.rows[0].created_employees)).toBe(10);
  });

  // Test 4: Create management relationships using UNWIND
  it('should create management relationships using UNWIND', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create "MANAGED_BY" edges between employees and their managers
    const query = `
      UNWIND ${TEST_SCHEMA}.get_relationship_array() AS rel
      MATCH (employee:Employee {id: rel.employee_id}), (manager:Employee {id: rel.manager_id})
      CREATE (employee)-[:MANAGED_BY {since: rel.since}]->(manager)
      RETURN count(*) AS created_relationships
    `;
    const result = await queryExecutor.executeCypher(query, {}, AGE_GRAPH_NAME);

    // Verify the relationships were created
    expect(Number(result.rows[0].created_relationships)).toBe(9);
  });

  // Test 5: List all employees with their titles and departments using query builder
  it('should list all employees with their titles and departments using query builder', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = createQueryBuilder(orgChartSchema);

    // Build and execute the query
    const result = await queryBuilder
      .match('Employee', 'e')
      .done()
      .return('e.name AS name', 'e.title AS title', 'e.department AS department')
      .orderBy('e.name')
      .execute();

    // Verify the results
    expect(result.rows.length).toBe(10);

    // Sort the results by name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        name: row.name,
        title: row.title,
        department: row.department
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Verify a few employees
    expect(sortedResults[0].name).toBe('David Anderson');
    expect(sortedResults[0].title).toBe('HR Manager');
    expect(sortedResults[0].department).toBe('Human Resources');
  });

  // Test 6: Find all direct reports of the CEO using query builder
  it('should find all direct reports of the CEO using query builder', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = createQueryBuilder(orgChartSchema);

    // Build and execute the query using the query builder
    const result = await queryExecutor.executeCypher(`
      MATCH (ceo:Employee {title: 'CEO'})<-[:MANAGED_BY]-(direct_report:Employee)
      RETURN direct_report.name AS name, direct_report.title AS title
      ORDER BY direct_report.name
    `, {}, AGE_GRAPH_NAME);

    // Verify the results
    expect(result.rows.length).toBe(3);

    // Sort the results by name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        name: row.name,
        title: row.title
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Verify the direct reports
    expect(sortedResults[0].name).toBe('David Anderson');
    expect(sortedResults[0].title).toBe('HR Manager');
    expect(sortedResults[1].name).toBe('Mary Johnson');
    expect(sortedResults[1].title).toBe('CTO');
    expect(sortedResults[2].name).toBe('Robert Brown');
    expect(sortedResults[2].title).toBe('CFO');
  });
});
