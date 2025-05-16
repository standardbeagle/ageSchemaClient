/**
 * Integration tests for the Organization Chart example
 *
 * These tests replicate the functionality of the Organization Chart example
 * for Apache AGE, demonstrating how to:
 * 1. Create a relational table with organizational hierarchy data
 * 2. Create a graph in Apache AGE
 * 3. Convert the relational data to graph vertices and edges using functions
 * 4. Run various queries on the graph structure
 *
 * This test follows best practices for Apache AGE:
 * - Loading AGE extension before each Cypher query
 * - Setting search_path to include ag_catalog
 * - Using the correct return type specification in Cypher queries
 * - Using the proper approach for parameterized queries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';

// Graph name for the organization chart tests
const ORG_CHART_GRAPH = 'org_chart';

describe('Organization Chart Example', () => {
  let ageAvailable = false;

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

    // Drop the org_chart graph if it exists
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${ORG_CHART_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${ORG_CHART_GRAPH}: ${error.message}`);
    }

    // Create the org_chart graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${ORG_CHART_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${ORG_CHART_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  }, 15000); // Increase timeout to 15 seconds

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) return;

    // Drop the org_chart graph
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

  // Test 3: Create employee vertices
  it('should create employee vertices', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Create vertices for all employees using the function
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
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

    // Verify the vertices were created
    expect(Number(result.rows[0].created_employees)).toBe(10);
  });

  // Test 4: Create management relationships
  it('should create management relationships', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Create "MANAGED_BY" edges between employees and their managers
    const query = `
      UNWIND ${TEST_SCHEMA}.get_relationship_array() AS rel
      MATCH (employee:Employee {id: rel.employee_id}), (manager:Employee {id: rel.manager_id})
      CREATE (employee)-[:MANAGED_BY {since: rel.since}]->(manager)
      RETURN count(*) AS created_relationships
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

    // Verify the relationships were created
    expect(Number(result.rows[0].created_relationships)).toBe(9);
  });

  // Test 5: List all employees with their titles and departments
  it('should list all employees with their titles and departments', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Query all employees
    const query = `
      MATCH (e:Employee)
      RETURN e.name AS name, e.title AS title, e.department AS department
      ORDER BY e.name
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

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
  // Test 6: Find all direct reports of the CEO
  it('should find all direct reports of the CEO', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Query direct reports of the CEO
    const query = `
      MATCH (ceo:Employee {title: 'CEO'})<-[:MANAGED_BY]-(direct_report:Employee)
      RETURN direct_report.name AS name, direct_report.title AS title
      ORDER BY direct_report.name
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

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

  // Test 7: Find the management chain for a specific employee
  it('should find the management chain for a specific employee', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Query the management chain for William Moore
    const query = `
      MATCH path = (employee:Employee {name: 'William Moore'})-[:MANAGED_BY*]->(manager:Employee)
      WITH nodes(path) AS managers
      UNWIND managers AS manager
      RETURN manager.name AS name
      ORDER BY manager.id DESC
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

    // Extract the management chain names
    const managementChain = result.rows.map(row => row.name);

    // Verify the management chain
    expect(managementChain).toHaveLength(4);
    expect(managementChain).toContain('William Moore');
    expect(managementChain).toContain('Jennifer Wilson');
    expect(managementChain).toContain('Patricia Davis');
    expect(managementChain).toContain('Mary Johnson');
  });

  // Test 8: Find all employees in the Technology department with their management level
  it('should find all employees in the Technology department with their management level', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Query Technology department employees with management level
    const query = `
      MATCH path = (e:Employee {department: 'Technology'})-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
      RETURN e.name AS name, e.title AS title, length(path) AS management_level
      ORDER BY management_level, name
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(3);

    // Sort the results by management level and name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        name: row.name,
        title: row.title,
        management_level: row.management_level
      }))
      .sort((a, b) => {
        if (a.management_level !== b.management_level) {
          return a.management_level - b.management_level;
        }
        return a.name.localeCompare(b.name);
      });

    // Verify the management levels
    expect(sortedResults[0].name).toBe('Mary Johnson');
    expect(sortedResults[0].management_level).toBe(1);
    expect(sortedResults[1].name).toBe('Patricia Davis');
    expect(sortedResults[1].management_level).toBe(2);
    expect(sortedResults[2].name).toBe('Jennifer Wilson');
    expect(sortedResults[2].management_level).toBe(3);
  });

  // Test 9: Find the department with the most employees
  it('should find the department with the most employees', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Query department counts
    const query = `
      MATCH (e:Employee)
      WITH e.department AS department, count(*) AS employee_count
      RETURN department, employee_count
      ORDER BY employee_count DESC
      LIMIT 1
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].department).toBe('Technology');
    expect(result.rows[0].employee_count).toBe(3);
  });

  // Test 10: Find employees who manage employees from different departments
  it('should find employees who manage employees from different departments', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // First, ensure AGE is loaded
    await queryExecutor.executeSQL(`LOAD 'age';`);

    // Set search path to include ag_catalog
    await queryExecutor.executeSQL(`SET search_path TO ag_catalog, "$user", public;`);

    // Query managers of employees from different departments
    const query = `
      MATCH (e:Employee)-[:MANAGED_BY]->(m:Employee)
      WITH m, collect(DISTINCT e.department) AS departments
      WHERE size(departments) > 1
      RETURN m.name AS manager_name, m.title AS manager_title, departments
      ORDER BY manager_name
    `;
    const result = await queryExecutor.executeCypher(query, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].manager_name).toBe('John Smith');
    expect(result.rows[0].manager_title).toBe('CEO');

    // The CEO manages employees from 3 departments
    const departments = result.rows[0].departments;
    expect(departments).toHaveLength(3);
    expect(departments).toContain('Technology');
    expect(departments).toContain('Finance');
    expect(departments).toContain('Human Resources');
  });
});