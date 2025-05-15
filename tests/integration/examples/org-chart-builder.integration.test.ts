/**
 * Integration tests for the Organization Chart example using the query builder
 *
 * These tests replicate the functionality of the Organization Chart example
 * for Apache AGE, demonstrating how to:
 * 1. Create a relational table with organizational hierarchy data
 * 2. Create a graph in Apache AGE
 * 3. Convert the relational data to graph vertices and edges using functions
 * 4. Run various queries on the graph structure using the query builder
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  connectionManager,
  queryExecutor,
  AGE_GRAPH_NAME,
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

  // Check if AGE is properly installed and configured
  beforeAll(async () => {
    try {
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      throw new Error(
        'Apache AGE extension is not properly installed or configured. ' +
        'This library requires AGE to function. ' +
        'Please ensure AGE is installed and properly configured in your database.'
      );
    }
  });
  let queryBuilder: QueryBuilder<typeof orgChartSchema>;

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

    // Drop the functions
    try {
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_employee_array()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_relationship_array()`);
    } catch (error) {
      console.warn(`Warning: Could not drop functions: ${error.message}`);
    }
  });

  // Test 1: Create and populate the employees table
  it('should create and populate the employees table', async () => {
    // Fail if AGE is not available
    if (!ageAvailable) {
      expect.fail(
        'Apache AGE extension is not available. This test requires AGE to be installed.\n' +
        'The test is using the database specified in .env.test file.\n' +
        'The database should be available, but the AGE extension is not installed or not properly configured.\n' +
        'Please make sure the AGE extension is installed on your PostgreSQL server.\n' +
        'Installation instructions: https://github.com/apache/age\n' +
        'After installing AGE, you need to create the extension in your database:\n' +
        '  CREATE EXTENSION age;'
      );
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
    expect(Number(result.rows[0].count)).toBe(10);
  });

  // Test 2: Create functions to generate employee and relationship data
  it('should create functions to generate employee and relationship data', async () => {
    // Fail if AGE is not available
    if (!ageAvailable) {
      expect.fail(
        'Apache AGE extension is not available. This test requires AGE to be installed.\n' +
        'The test is using the database specified in .env.test file.\n' +
        'The database should be available, but the AGE extension is not installed or not properly configured.\n' +
        'Please make sure the AGE extension is installed on your PostgreSQL server.\n' +
        'Installation instructions: https://github.com/apache/age\n' +
        'After installing AGE, you need to create the extension in your database:\n' +
        '  CREATE EXTENSION age;'
      );
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
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder to create vertices would typically involve
    // vertex operations, but for this test we'll use the unwind functionality
    // with the query builder and execute the resulting Cypher query
    const query = queryBuilder
      .unwind(`${TEST_SCHEMA}.get_employee_array()`, 'employee')
      .where('CREATE (e:Employee {id: employee.id, name: employee.name, title: employee.title, department: employee.department, hire_date: employee.hire_date, salary: employee.salary})')
      .return('count(*) AS created_employees');

    // Get the Cypher query and execute it
    const cypher = query.toCypher();
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

    // Verify the vertices were created
    expect(result.rows[0].result.created_employees).toBe(10);
  });

  // Test 4: Create management relationships using query builder
  it('should create management relationships using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder to create relationships
    const query = queryBuilder
      .unwind(`${TEST_SCHEMA}.get_relationship_array()`, 'rel')
      .where('MATCH (employee:Employee {id: rel.employee_id}), (manager:Employee {id: rel.manager_id})')
      .where('CREATE (employee)-[:MANAGED_BY {since: rel.since}]->(manager)')
      .return('count(*) AS created_relationships');

    // Get the Cypher query and execute it
    const cypher = query.toCypher();
    const result = await queryExecutor.executeCypher(cypher, {}, ORG_CHART_GRAPH);

    // Verify the relationships were created
    expect(result.rows[0].result.created_relationships).toBe(9);
  });

  // Test 5: List all employees with their titles and departments using query builder
  it('should list all employees with their titles and departments using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder with a direct where clause
    const query = queryBuilder
      .where(`
        MATCH (e:Employee)
        RETURN e.name AS name, e.title AS title, e.department AS department
      `);

    // Execute the query
    const result = await query.execute();

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

  // Test 6: Find all direct reports of the CEO using query builder
  it('should find all direct reports of the CEO using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder with a direct where clause
    const query = queryBuilder
      .where(`
        MATCH (ceo:Employee {title: $title})<-[:MANAGED_BY]-(direct_report:Employee)
        RETURN direct_report.name AS name, direct_report.title AS title
      `, { title: 'CEO' });

    // Execute the query
    const result = await query.execute();

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

  // Test 7: Find the management chain for a specific employee using query builder
  it('should find the management chain for a specific employee using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder to find the management chain
    // For path queries, we need to use a more complex approach with the query builder
    const query = queryBuilder
      .where(`
        MATCH path = (employee:Employee)-[:MANAGED_BY*]->(manager)
        WHERE employee.name = $employeeName
        WITH path
        UNWIND nodes(path) AS person
        RETURN collect(person.name) AS management_chain_names
      `, { employeeName: 'William Moore' });

    // Execute the query
    const result = await query.execute();

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

  // Test 8: Find all employees in the Technology department with their management level using query builder
  it('should find all employees in the Technology department with their management level using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder for a more complex path query
    const query = queryBuilder
      .where(`
        MATCH path = (employee:Employee)-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
        WHERE employee.department = $department
        RETURN employee.name AS employee_name,
               employee.title AS title,
               length(path) AS management_level
      `, { department: 'Technology' });

    // Execute the query
    const result = await query.execute();

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

  // Test 9: Find the department with the most employees using query builder
  it('should find the department with the most employees using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder with a direct where clause
    const query = queryBuilder
      .where(`
        MATCH (e:Employee)
        WITH e.department AS department, count(*) AS employee_count
        ORDER BY employee_count DESC
        LIMIT 1
        RETURN department, employee_count
      `);

    // Execute the query
    const result = await query.execute();

    // Verify the results
    expect(result.rows.length).toBe(1);

    // Get the department with the most employees
    const department = result.rows[0].result.department;
    const count = result.rows[0].result.employee_count;

    // Verify the department with the most employees
    expect(department).toBe('Technology');
    expect(count).toBe(4);
  });

  // Test 10: Find employees who manage employees from different departments using query builder
  it('should find employees who manage employees from different departments using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder for a more complex query with collection operations
    const query = queryBuilder
      .where(`
        MATCH (manager:Employee)<-[:MANAGED_BY]-(employee:Employee)
        WHERE manager.department <> employee.department
        WITH DISTINCT manager.name AS manager_name,
               manager.department AS manager_dept,
               collect(DISTINCT employee.department) AS manages_departments
        RETURN manager_name, manager_dept, manages_departments
      `);

    // Execute the query
    const result = await query.execute();

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

  // Test 11: Calculate the average salary by management level using query builder
  it('should calculate the average salary by management level using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder for a complex aggregation query
    const query = queryBuilder
      .where(`
        MATCH path = (e:Employee)-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
        WITH length(path) AS level, e.salary AS salary
        WITH level AS management_level, avg(salary) AS avg_salary, count(*) AS employee_count
        RETURN management_level, round(avg_salary, 2) AS avg_salary, employee_count
      `);

    // Execute the query
    const result = await query.execute();

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

  // Test 12: Find the longest management chain using query builder
  it('should find the longest management chain using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder for a complex path query with sorting
    const query = queryBuilder
      .where(`
        MATCH path = (e:Employee)-[:MANAGED_BY*]->(ceo:Employee {title: 'CEO'})
        WITH path, length(path) AS chain_length
        ORDER BY chain_length DESC
        LIMIT 1
        WITH path, chain_length
        UNWIND nodes(path) AS person
        WITH collect(person.name) AS longest_chain_names, chain_length
        RETURN longest_chain_names, chain_length
      `);

    // Execute the query
    const result = await query.execute();

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

  // Test 13: List all employees with their managers using query builder
  it('should list all employees with their managers using query builder', async () => {
    try {
      // Check if agtype exists by running a simple query
      await queryExecutor.executeSQL(`SELECT 'test'::ag_catalog.agtype`);
    } catch (error) {
      expect.fail('Apache AGE extension is not properly configured. The agtype is not available. This library requires AGE to function properly.');
    }

    // Using the query builder with optional match
    const query = queryBuilder
      .where(`
        MATCH (e:Employee)
        OPTIONAL MATCH (e)-[:MANAGED_BY]->(m:Employee)
        RETURN e.name AS employee_name,
               e.title AS title,
               e.department AS department,
               m.name AS manager_name
      `);

    // Execute the query
    const result = await query.execute();

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