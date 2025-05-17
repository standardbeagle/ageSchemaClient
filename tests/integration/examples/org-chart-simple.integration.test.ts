/**
 * Simple integration test for the Organization Chart example
 *
 * This test demonstrates how to use Apache AGE with the library
 * to create a simple organizational chart and run basic queries.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  TEST_SCHEMA,
  AGE_GRAPH_NAME
} from '../../integration/base-test';
import { getResourceRegistry, ResourceType } from '../../setup/resource-registry';
import { generateTableName } from '../../setup/name-generator';

describe('Organization Chart Simple Example', () => {
  let ageAvailable = false;
  const resourceRegistry = getResourceRegistry();
  const employeesTable = generateTableName('employees');

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Organization Chart Simple Example');
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
      CREATE TABLE ${employeesTable} (
        employee_id INT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        manager_id INT,
        hire_date DATE NOT NULL,
        salary NUMERIC(10, 2) NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES ${employeesTable}(employee_id)
      )
    `);

    // Register the table for cleanup
    resourceRegistry.registerTable(employeesTable, queryExecutor);

    // Insert employee data
    await queryExecutor.executeSQL(`
      INSERT INTO ${employeesTable} VALUES
      (1, 'John Smith', 'CEO', 'Executive', NULL, '2010-01-15', 250000.00),
      (2, 'Mary Johnson', 'CTO', 'Technology', 1, '2015-03-20', 220000.00),
      (3, 'Robert Brown', 'CFO', 'Finance', 1, '2013-05-10', 210000.00)
    `);

    // Verify the data was inserted
    const result = await queryExecutor.executeSQL(`SELECT COUNT(*) as count FROM ${employeesTable}`);
    expect(Number(result.rows[0].count)).toBe(3);
  });

  // Test 2: Create a function to return employee data as agtype
  it('should create a function to return employee data as agtype', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create function to generate employee data
    const getEmployeeArrayFunc = `${TEST_SCHEMA}.get_employee_array`;
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${getEmployeeArrayFunc}()
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
        FROM ${employeesTable};

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Register the function for cleanup
    resourceRegistry.registerCustomResource(
      `function:${getEmployeeArrayFunc}`,
      getEmployeeArrayFunc,
      ResourceType.FUNCTION,
      async () => {
        try {
          await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${getEmployeeArrayFunc}()`);
        } catch (error) {
          console.warn(`Warning: Could not drop function ${getEmployeeArrayFunc}: ${error.message}`);
        }
      },
      5 // Priority
    );

    // Verify the function was created
    const result = await queryExecutor.executeSQL(`
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE proname = 'get_employee_array'
      AND n.nspname = '${TEST_SCHEMA}'
    `);
    expect(Number(result.rows[0].count)).toBe(1);
  });

  // Test 3: Create employee vertices
  it('should create employee vertices', async () => {
    // Skip if AGE is not available
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

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

    // Execute the query and log the result for debugging
    const result = await queryExecutor.executeCypher(query, {}, AGE_GRAPH_NAME);
    console.log('Create vertices result:', JSON.stringify(result.rows));

    // Verify the vertices were created - we expect 3 vertices
    // The result is in the 'result' property of the first row
    expect(Number(result.rows[0].result)).toBe(3);
  });
});
