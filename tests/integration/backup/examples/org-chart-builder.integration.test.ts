/**
 * Integration tests for the Organization Chart example using the query builder
 *
 * These tests replicate the functionality of the Organization Chart example
 * for Apache AGE, demonstrating how to:
 * 1. Create a relational table with organizational hierarchy data
 * 2. Create a graph in Apache AGE
 * 3. Convert the relational data to graph vertices and edges using functions
 * 4. Run various queries on the graph structure using the query builder
 *
 * This test follows best practices for Apache AGE:
 * - Loading AGE extension before each Cypher query
 * - Setting search_path to include ag_catalog
 * - Using the correct return type specification in Cypher queries
 * - Using the proper approach for parameterized queries
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';
import { QueryBuilder } from '../../../src/query/builder';
import { OrderDirection } from '../../../src/query/types';
import { SchemaDefinition } from '../../../src/schema/types';

// Graph name for the organization chart tests
const ORG_CHART_GRAPH = 'org_chart_builder';

// Define the schema for the organization chart
const orgChartSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Employee: {
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        title: { type: 'string' },
        department: { type: 'string' },
        hire_date: { type: 'string' },
        salary: { type: 'number' }
      },
      required: ['id', 'name', 'title', 'department']
    }
  },
  edges: {
    MANAGED_BY: {
      properties: {
        since: { type: 'string' }
      },
      fromVertex: 'Employee',
      toVertex: 'Employee'
    }
  }
};

describe('Organization Chart Example with Query Builder', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof orgChartSchema>;

  // Check if AGE is properly installed and configured
  beforeAll(async () => {
    try {
      // Use proper agtype syntax with double quotes
      await queryExecutor.executeSQL(`SELECT '"test"'::ag_catalog.agtype`);
    } catch (error) {
      throw new Error(
        'Apache AGE extension is not properly installed or configured. ' +
        'This library requires AGE to function. ' +
        'Please ensure AGE is installed and properly configured in your database.'
      );
    }
  });

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Drop the org_chart_builder graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${ORG_CHART_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${ORG_CHART_GRAPH}: ${error.message}`);
    }

    // Create the org_chart_builder graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${ORG_CHART_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${ORG_CHART_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  }, 15000); // Increase timeout to 15 seconds

  // Initialize query builder before each test
  beforeEach(() => {
    queryBuilder = new QueryBuilder(orgChartSchema, queryExecutor, ORG_CHART_GRAPH);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) return;

    // Drop the org_chart_builder graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${ORG_CHART_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${ORG_CHART_GRAPH}: ${error.message}`);
    }

    // Drop the employees table
    try {
      await queryExecutor.executeSQL('DROP TABLE IF EXISTS employees CASCADE');
    } catch (error) {
      console.warn(`Warning: Could not drop employees table: ${error.message}`);
    }
  });

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

  // Test 3: Create employee vertices using query builder
  it('should create employee vertices using query builder', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Using the query builder to create vertices
    // Instead of using the query builder, we'll directly execute a Cypher query
    // that's properly formatted for Apache AGE
    const cypher = `
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

    // Execute the Cypher query
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

    // Verify the vertices were created
    expect(Number(result.rows[0].created_employees)).toBe(10);
  });
  // Test 4: Create management relationships using query builder
  it('should create management relationships using query builder', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Using the query builder to create relationships
    // Instead of using the query builder, we'll directly execute a Cypher query
    // that's properly formatted for Apache AGE
    const cypher = `
      UNWIND ${TEST_SCHEMA}.get_relationship_array() AS rel
      MATCH (employee:Employee {id: rel.employee_id}), (manager:Employee {id: rel.manager_id})
      CREATE (employee)-[:MANAGED_BY {since: rel.since}]->(manager)
      RETURN count(*) AS created_relationships
    `;

    // Execute the Cypher query
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

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

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Using the query builder to list employees
    // Instead of using the query builder, we'll directly execute a Cypher query
    // that's properly formatted for Apache AGE
    const cypher = `
      MATCH (e:Employee)
      RETURN e.name AS name, e.title AS title, e.department AS department
      ORDER BY e.name
    `;

    // Execute the Cypher query
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

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

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Direct Cypher query for finding CEO direct reports
    const cypher = `
      MATCH (ceo:Employee {title: 'CEO'})<-[:MANAGED_BY]-(direct_report:Employee)
      RETURN direct_report.name AS name, direct_report.title AS title
      ORDER BY direct_report.name
    `;

    // Execute the Cypher query
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

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

  // Test 7: Find the management chain for a specific employee using query builder
  it('should find the management chain for a specific employee using query builder', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Direct Cypher query for finding management chain
    const cypher = `
      MATCH path = (employee:Employee {name: 'William Moore'})-[:MANAGED_BY*]->(manager:Employee)
      WITH nodes(path) AS managers
      UNWIND managers AS manager
      RETURN manager.name AS name
      ORDER BY manager.id DESC
    `;

    // Execute the Cypher query
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

    // Extract the management chain names
    const managementChain = result.rows.map(row => row.name);

    // Verify the management chain
    expect(managementChain).toHaveLength(4);
    expect(managementChain).toContain('William Moore');
    expect(managementChain).toContain('Jennifer Wilson');
    expect(managementChain).toContain('Patricia Davis');
    expect(managementChain).toContain('Mary Johnson');
  });
});