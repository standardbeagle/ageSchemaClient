/**
 * Integration tests for the Organization Chart example
 *
 * These tests replicate the functionality of the Organization Chart example
 * for Apache AGE, demonstrating how to:
 * 1. Create a relational table with organizational hierarchy data
 * 2. Create a graph in Apache AGE
 * 3. Convert the relational data to graph vertices and edges using functions
 * 4. Run various queries on the graph structure
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  connectionManager,
  queryExecutor,
  AGE_GRAPH_NAME,
  isAgeAvailable
} from '../../setup/integration';

// Graph name for the organization chart tests
const ORG_CHART_GRAPH = 'org_chart';

describe('Organization Chart Example', () => {
  let ageAvailable = false;

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

    // Drop the functions
    try {
      await queryExecutor.executeSQL('DROP FUNCTION IF EXISTS public.get_employee_array()');
      await queryExecutor.executeSQL('DROP FUNCTION IF EXISTS public.get_relationship_array()');
    } catch (error) {
      console.warn(`Warning: Could not drop functions: ${error.message}`);
    }
  });

  // Test 1: Create and populate the employees table
  it('should create and populate the employees table', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Create the employees table
    await queryExecutor.executeSQL(`
      CREATE TABLE employees (
        employee_id INT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        manager_id INT,
        hire_date DATE,
        salary NUMERIC(10, 2),
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
      )
    `);

    // Insert sample data
    await queryExecutor.executeSQL(`
      INSERT INTO employees VALUES
      (1, 'John Smith', 'CEO', 'Executive', NULL, '2010-01-15', 250000.00),
      (2, 'Mary Johnson', 'CTO', 'Technology', 1, '2012-03-20', 210000.00),
      (3, 'Robert Brown', 'CFO', 'Finance', 1, '2013-05-10', 205000.00),
      (4, 'Patricia Davis', 'Engineering Director', 'Technology', 2, '2014-07-18', 180000.00),
      (5, 'Michael Miller', 'Finance Director', 'Finance', 3, '2015-02-25', 175000.00),
      (6, 'Jennifer Wilson', 'Senior Developer', 'Technology', 4, '2016-10-30', 145000.00),
      (7, 'William Moore', 'Developer', 'Technology', 6, '2018-04-15', 110000.00),
      (8, 'Elizabeth Taylor', 'Accountant', 'Finance', 5, '2017-08-12', 95000.00),
      (9, 'David Anderson', 'HR Manager', 'Human Resources', 1, '2014-12-01', 135000.00),
      (10, 'Sarah Thomas', 'HR Specialist', 'Human Resources', 9, '2019-06-07', 85000.00)
    `);

    // Verify the data was inserted
    const result = await queryExecutor.executeSQL('SELECT COUNT(*) as count FROM employees');
    expect(result.rows[0].count).toBe(10);
  });

  // Test 2: Create functions to generate employee and relationship data
  it('should create functions to generate employee and relationship data', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Create function to generate employee data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION public.get_employee_array()
      RETURNS agtype AS $$
      DECLARE
        result_array agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'id', employee_id,
          'name', name,
          'title', title,
          'department', department,
          'hire_date', hire_date::text,
          'salary', salary
        ))::text::agtype INTO result_array
        FROM employees;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create function to generate relationship data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION public.get_relationship_array()
      RETURNS agtype AS $$
      DECLARE
        result_array agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'employee_id', employee_id,
          'manager_id', manager_id,
          'since', hire_date::text
        ))::text::agtype INTO result_array
        FROM employees
        WHERE manager_id IS NOT NULL;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Verify the functions were created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc
      WHERE proname IN ('get_employee_array', 'get_relationship_array')
    `);
    expect(result.rows[0].count).toBe(2);
  });

  // Test 3: Create employee vertices
  it('should create employee vertices', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Create vertices for all employees using the function
    const result = await queryExecutor.executeCypher(`
      UNWIND public.get_employee_array() AS employee
      CREATE (e:Employee {
        id: employee.id,
        name: employee.name,
        title: employee.title,
        department: employee.department,
        hire_date: employee.hire_date,
        salary: employee.salary
      })
      RETURN count(*) AS created_employees
    `, {}, ORG_CHART_GRAPH);

    // Verify the vertices were created
    expect(result.rows[0].result.created_employees).toBe(10);
  });

  // Test 4: Create management relationships
  it('should create management relationships', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Create "MANAGED_BY" edges between employees and their managers
    const result = await queryExecutor.executeCypher(`
      UNWIND public.get_relationship_array() AS rel
      MATCH (employee:Employee {id: rel.employee_id}), (manager:Employee {id: rel.manager_id})
      CREATE (employee)-[:MANAGED_BY {since: rel.since}]->(manager)
      RETURN count(*) AS created_relationships
    `, {}, ORG_CHART_GRAPH);

    // Verify the relationships were created
    expect(result.rows[0].result.created_relationships).toBe(9);
  });

  // Test 5: List all employees with their titles and departments
  it('should list all employees with their titles and departments', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query all employees
    const result = await queryExecutor.executeCypher(`
      MATCH (e:Employee)
      RETURN e.name AS name, e.title AS title, e.department AS department
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(10);

    // Sort the results by department and name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        name: row.result.name,
        title: row.result.title,
        department: row.result.department
      }))
      .sort((a, b) => {
        if (a.department !== b.department) {
          return a.department.localeCompare(b.department);
        }
        return a.name.localeCompare(b.name);
      });

    // Verify a few specific employees
    expect(sortedResults[0].name).toBe('John Smith');
    expect(sortedResults[0].department).toBe('Executive');
  });

  // Test 6: Find all direct reports of the CEO
  it('should find all direct reports of the CEO', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query direct reports of the CEO
    const result = await queryExecutor.executeCypher(`
      MATCH (ceo:Employee {title: 'CEO'})<-[:MANAGED_BY]-(direct_report)
      RETURN direct_report.name AS name, direct_report.title AS title
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(3);

    // Sort the results by name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        name: row.result.name,
        title: row.result.title
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
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query the management chain for William Moore
    const result = await queryExecutor.executeCypher(`
      MATCH path = (employee:Employee {name: 'William Moore'})-[:MANAGED_BY*]->(manager)
      WITH path
      UNWIND nodes(path) AS person
      RETURN collect(person.name) AS management_chain_names
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(1);

    // Get the management chain
    const managementChain = result.rows[0].result.management_chain_names;

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
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query Technology department employees with management level
    const result = await queryExecutor.executeCypher(`
      MATCH path = (employee:Employee {department: 'Technology'})-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
      RETURN employee.name AS employee_name,
             employee.title AS title,
             length(path) AS management_level
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(4);

    // Sort the results by management level and name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        employee_name: row.result.employee_name,
        title: row.result.title,
        management_level: row.result.management_level
      }))
      .sort((a, b) => {
        if (a.management_level !== b.management_level) {
          return a.management_level - b.management_level;
        }
        return a.employee_name.localeCompare(b.employee_name);
      });

    // Verify the management levels
    expect(sortedResults[0].employee_name).toBe('Mary Johnson');
    expect(sortedResults[0].management_level).toBe(1);
    expect(sortedResults[1].employee_name).toBe('Patricia Davis');
    expect(sortedResults[1].management_level).toBe(2);
    expect(sortedResults[2].employee_name).toBe('Jennifer Wilson');
    expect(sortedResults[2].management_level).toBe(3);
    expect(sortedResults[3].employee_name).toBe('William Moore');
    expect(sortedResults[3].management_level).toBe(4);
  });

  // Test 9: Find the department with the most employees
  it('should find the department with the most employees', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query department counts
    const result = await queryExecutor.executeCypher(`
      MATCH (e:Employee)
      WITH e.department AS department, count(*) AS employee_count
      RETURN department, employee_count
      ORDER BY employee_count DESC
      LIMIT 1
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(1);

    // Get the department with the most employees
    const department = result.rows[0].result.department;
    const count = result.rows[0].result.employee_count;

    // Verify the department with the most employees
    expect(department).toBe('Technology');
    expect(count).toBe(4);
  });

  // Test 10: Find employees who manage employees from different departments
  it('should find employees who manage employees from different departments', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query managers of employees from different departments
    const result = await queryExecutor.executeCypher(`
      MATCH (manager:Employee)<-[:MANAGED_BY]-(employee:Employee)
      WHERE manager.department <> employee.department
      WITH DISTINCT manager.name AS manager_name,
             manager.department AS manager_dept,
             collect(DISTINCT employee.department) AS manages_departments
      RETURN manager_name, manager_dept, manages_departments
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(1);

    // Get the manager who manages employees from different departments
    const managerName = result.rows[0].result.manager_name;
    const managerDept = result.rows[0].result.manager_dept;
    const managesDepartments = result.rows[0].result.manages_departments;

    // Verify the manager
    expect(managerName).toBe('John Smith');
    expect(managerDept).toBe('Executive');
    expect(managesDepartments).toContain('Technology');
    expect(managesDepartments).toContain('Finance');
    expect(managesDepartments).toContain('Human Resources');
  });

  // Test 11: Calculate the average salary by management level
  it('should calculate the average salary by management level', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query average salary by management level
    const result = await queryExecutor.executeCypher(`
      MATCH path = (e:Employee)-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
      WITH length(path) AS level, e.salary AS salary
      WITH level AS management_level, avg(salary) AS avg_salary, count(*) AS employee_count
      RETURN management_level, round(avg_salary, 2) AS avg_salary, employee_count
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(4);

    // Sort the results by management level for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        management_level: row.result.management_level,
        avg_salary: row.result.avg_salary,
        employee_count: row.result.employee_count
      }))
      .sort((a, b) => a.management_level - b.management_level);

    // Verify the average salaries by management level
    expect(sortedResults[0].management_level).toBe(1);
    expect(sortedResults[0].employee_count).toBe(3);
    expect(sortedResults[1].management_level).toBe(2);
    expect(sortedResults[1].employee_count).toBe(2);
    expect(sortedResults[2].management_level).toBe(3);
    expect(sortedResults[2].employee_count).toBe(2);
    expect(sortedResults[3].management_level).toBe(4);
    expect(sortedResults[3].employee_count).toBe(2);
  });

  // Test 12: Find the longest management chain
  it('should find the longest management chain', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query the longest management chain
    const result = await queryExecutor.executeCypher(`
      MATCH path = (e:Employee)-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
      WITH path, length(path) AS chain_length
      WITH path, chain_length
      ORDER BY chain_length DESC
      LIMIT 1
      WITH path, chain_length
      UNWIND nodes(path) AS person
      WITH collect(person.name) AS longest_chain_names, chain_length
      RETURN longest_chain_names, chain_length
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(1);

    // Get the longest management chain
    const longestChain = result.rows[0].result.longest_chain_names;
    const chainLength = result.rows[0].result.chain_length;

    // Verify the longest management chain
    expect(chainLength).toBe(4);
    expect(longestChain).toHaveLength(5); // 4 edges = 5 nodes
    expect(longestChain).toContain('William Moore');
    expect(longestChain).toContain('Jennifer Wilson');
    expect(longestChain).toContain('Patricia Davis');
    expect(longestChain).toContain('Mary Johnson');
    expect(longestChain).toContain('John Smith');
  });

  // Test 13: Visualize the complete organizational structure
  it('should list all employees with their managers', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.log('Skipping test: AGE not available');
      return;
    }

    // Query all employees with their managers
    const result = await queryExecutor.executeCypher(`
      MATCH (e:Employee)
      OPTIONAL MATCH (e)-[:MANAGED_BY]->(m:Employee)
      RETURN e.name AS employee_name,
             e.title AS title,
             e.department AS department,
             m.name AS manager_name
    `, {}, ORG_CHART_GRAPH);

    // Verify the results
    expect(result.rows.length).toBe(10);

    // Sort the results by department, manager name, and employee name for consistent testing
    const sortedResults = result.rows
      .map(row => ({
        employee_name: row.result.employee_name,
        title: row.result.title,
        department: row.result.department,
        manager_name: row.result.manager_name
      }))
      .sort((a, b) => {
        if (a.department !== b.department) {
          return a.department.localeCompare(b.department);
        }
        if (a.manager_name !== b.manager_name) {
          return (a.manager_name || '').localeCompare(b.manager_name || '');
        }
        return a.employee_name.localeCompare(b.employee_name);
      });

    // Verify a few specific employee-manager relationships
    expect(sortedResults[0].employee_name).toBe('John Smith');
    expect(sortedResults[0].manager_name).toBeNull();

    // Find William Moore and verify his management chain
    const williamMoore = sortedResults.find(r => r.employee_name === 'William Moore');
    expect(williamMoore).toBeDefined();
    expect(williamMoore?.manager_name).toBe('Jennifer Wilson');

    // Find Jennifer Wilson and verify her manager
    const jenniferWilson = sortedResults.find(r => r.employee_name === 'Jennifer Wilson');
    expect(jenniferWilson).toBeDefined();
    expect(jenniferWilson?.manager_name).toBe('Patricia Davis');
  });
});
