/**
 * Integration test for Apache AGE parameter passing using temporary tables
 *
 * This test demonstrates an approach to pass parameters to Cypher queries
 * in Apache AGE by using temporary tables and functions.
 *
 * It includes examples for both simple property types and complex data structures
 * like arrays of objects.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'param_test_graph';

describe('Apache AGE Parameter Passing with Temp Tables', () => {
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
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }

    // Create the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${PARAM_TEST_GRAPH}')`);
    } catch (error) {
      console.error(`Error creating graph ${PARAM_TEST_GRAPH}: ${error.message}`);
      ageAvailable = false;
    }
  }, 15000); // Increase timeout to 15 seconds

  // Clean up after all tests
  afterAll(async () => {
    if (!ageAvailable) return;

    // Drop the test graph
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);
    } catch (error) {
      console.warn(`Warning: Could not drop graph ${PARAM_TEST_GRAPH}: ${error.message}`);
    }

    // Drop the test tables and functions
    try {
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.temp_params`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_params()`);
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.complex_params`);
      // get_complex_params is no longer used
      // get_array_params is no longer used
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_departments()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_employees()`);
    } catch (error) {
      console.warn(`Warning: Could not drop tables/functions: ${error.message}`);
    }
  });

  // Test: Use temp table and function to pass parameters to Cypher
  it('should pass parameters to Cypher using temp table and function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a temporary table to store parameters
    await queryExecutor.executeSQL(`
      CREATE TABLE ${TEST_SCHEMA}.temp_params (
        id SERIAL PRIMARY KEY,
        param_name TEXT NOT NULL,
        param_value JSONB NOT NULL
      )
    `);

    // 2. Insert parameters into the temp table
    const params = {
      name: "Test Person",
      age: 30,
      active: true
    };

    // Insert each parameter as a separate row
    for (const [key, value] of Object.entries(params)) {
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.temp_params (param_name, param_value)
        VALUES ($1, $2)
      `, [key, JSON.stringify(value)]);
    }

    // 3. Create a function to retrieve parameters as agtype
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_params()
      RETURNS JSONB AS $$
      DECLARE
        result_json JSONB;
      BEGIN
        SELECT jsonb_object_agg(param_name, param_value)
        INTO result_json
        FROM ${TEST_SCHEMA}.temp_params;

        RETURN result_json;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. Execute a Cypher query using the function to get parameters
    try {
      // First create a simple vertex using the parameters
      // Use a simpler approach without returning the vertex
      const createResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          WITH ${TEST_SCHEMA}.get_params() AS params_json
          CREATE (p:Person {
            name: params_json.name,
            age: params_json.age,
            active: params_json.active
          })
          RETURN 1 as success
        $$) as (success int);
      `);

      // Verify the query executed successfully
      expect(createResult.rows).toHaveLength(1);
      expect(createResult.rows[0].success).toBe(1);

      // Now query the vertex to verify the parameters were passed correctly
      const queryResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (p:Person)
          RETURN p.name AS name, p.age AS age, p.active AS active
        $$) as (name text, age int, active boolean);
      `);

      // Verify the query returned the expected vertex
      expect(queryResult.rows).toHaveLength(1);
      expect(queryResult.rows[0].name).toBe('Test Person');
      expect(queryResult.rows[0].age).toBe(30);
      expect(queryResult.rows[0].active).toBe(true);

    } catch (error) {
      console.error('Error executing Cypher query:', error);
      throw error;
    } finally {
      // Clean up the temporary table
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.temp_params`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_params()`);
    }
  });

  // Test: Pass complex data structures (arrays of objects) to Cypher
  it('should pass arrays of objects to Cypher using temp table and function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a temporary table to store complex parameters
    await queryExecutor.executeSQL(`
      CREATE TABLE ${TEST_SCHEMA}.complex_params (
        id SERIAL PRIMARY KEY,
        param_name TEXT NOT NULL,
        param_value JSONB NOT NULL
      )
    `);

    // 2. Define complex parameters with arrays of objects
    const complexParams = {
      // Array of department objects
      departments: [
        { id: 1, name: "Engineering", budget: 1000000 },
        { id: 2, name: "Marketing", budget: 500000 },
        { id: 3, name: "Sales", budget: 750000 }
      ],
      // Array of employee objects
      employees: [
        { id: 101, name: "Alice Smith", departmentId: 1, skills: ["JavaScript", "TypeScript", "React"] },
        { id: 102, name: "Bob Johnson", departmentId: 1, skills: ["Python", "Django", "PostgreSQL"] },
        { id: 103, name: "Carol Williams", departmentId: 2, skills: ["Marketing", "Social Media"] },
        { id: 104, name: "Dave Brown", departmentId: 3, skills: ["Sales", "Negotiation"] }
      ]
    };

    // Insert each parameter as a separate row
    for (const [key, value] of Object.entries(complexParams)) {
      await queryExecutor.executeSQL(`
        INSERT INTO ${TEST_SCHEMA}.complex_params (param_name, param_value)
        VALUES ($1, $2)
      `, [key, JSON.stringify(value)]);
    }

    // Functions get_complex_params and get_array_params are no longer needed
    // as get_departments and get_employees directly query complex_params table
    // and return agtype for UNWIND.

    // Create functions that return agtype for UNWIND for each department and employee
    await queryExecutor.executeSQL(`
      SET search_path = ag_catalog, public;
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_departments()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'id', (elem->>'id')::int,
          'name', elem->>'name',
          'budget', (elem->>'budget')::numeric
        ))::text::ag_catalog.agtype
        INTO result_array
        FROM (
          SELECT jsonb_array_elements(param_value) as elem
          FROM ${TEST_SCHEMA}.complex_params
          WHERE param_name = 'departments'
        ) sub;
        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_employees()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'id', (elem->>'id')::int,
          'name', elem->>'name',
          'departmentId', (elem->>'departmentId')::int,
          'skills', elem->'skills' -- Keep skills as a JSONB array
        ))::text::ag_catalog.agtype
        INTO result_array
        FROM (
          SELECT jsonb_array_elements(param_value) as elem
          FROM ${TEST_SCHEMA}.complex_params
          WHERE param_name = 'employees'
        ) sub;
        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    try {
      // Create Department vertices using UNWIND
      const createDeptResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_departments() AS dept
        CREATE (d:Department {
          id: dept.id,
          name: dept.name,
          budget: dept.budget
        })
        RETURN count(d) AS created_departments
      `, {}, PARAM_TEST_GRAPH);

      // Verify departments were created
      expect(createDeptResult.rows).toHaveLength(1);
      expect(createDeptResult.rows[0].result.created_departments).toBe(3);

      // Create Employee vertices using UNWIND
      const createEmpResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_employees() AS emp
        CREATE (e:Employee {
          id: emp.id,
          name: emp.name,
          departmentId: emp.departmentId,
          skills: emp.skills // Store the skills array directly
        })
        RETURN count(e) AS created_employees
      `, {}, PARAM_TEST_GRAPH);

      // Verify employees were created
      expect(createEmpResult.rows).toHaveLength(1);
      expect(createEmpResult.rows[0].result.created_employees).toBe(4);

      // Create WORKS_IN relationships between Employees and Departments
      const createRelResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_employees() AS emp_data
        MATCH (emp:Employee {id: emp_data.id})
        MATCH (dept:Department {id: emp_data.departmentId})
        CREATE (emp)-[:WORKS_IN]->(dept)
        RETURN count(*) AS created_relationships
      `, {}, PARAM_TEST_GRAPH);

      expect(createRelResult.rows).toHaveLength(1);
      // All 4 employees should have a department
      expect(createRelResult.rows[0].result.created_relationships).toBe(4);


      // 8. Query the graph to verify the employee data was correctly stored
      const employeeQueryResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (e:Employee)
          RETURN e.name AS employee_name,
                 e.skills AS skills, // Query the full skills array
                 e.departmentId AS department_id
        $$) as (employee_name text, skills ag_catalog.agtype, department_id int);
      `);

      // Verify the query returned the expected results
      expect(employeeQueryResult.rows).toHaveLength(4);

      // Find Alice in the results
      const alice = employeeQueryResult.rows.find((row: any) => row.employee_name === 'Alice Smith');
      expect(alice).toBeDefined();
      expect(alice.department_id).toBe(1);
      expect(alice.skills).toEqual(["JavaScript", "TypeScript", "React"]);

      // Find Carol in the results
      const carol = employeeQueryResult.rows.find((row: any) => row.employee_name === 'Carol Williams');
      expect(carol).toBeDefined();
      expect(carol.department_id).toBe(2);
      expect(carol.skills).toEqual(["Marketing", "Social Media"]);

      // Find Bob in the results
      const bob = employeeQueryResult.rows.find((row: any) => row.employee_name === 'Bob Johnson');
      expect(bob).toBeDefined();
      expect(bob.department_id).toBe(1);
      expect(bob.skills).toEqual(["Python", "Django", "PostgreSQL"]);

      // 9. Query the graph to verify the department data was correctly stored
      const deptQueryResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (d:Department)
          RETURN d.id AS dept_id,
                 d.name AS department_name
        $$) as (dept_id int, department_name text);
      `);

      // Verify the query returned the expected results
      expect(deptQueryResult.rows).toHaveLength(3);

      // Find Engineering department
      const engineering = deptQueryResult.rows.find((row: any) => row.department_name === 'Engineering');
      expect(engineering).toBeDefined();
      expect(engineering.dept_id).toBe(1);

      // Find Marketing department
      const marketing = deptQueryResult.rows.find((row: any) => row.department_name === 'Marketing');
      expect(marketing).toBeDefined();
      expect(marketing.dept_id).toBe(2);

    } catch (error) {
      console.error('Error executing Cypher query with complex parameters:', error);
      throw error;
    } finally {
      // Clean up the temporary tables and functions
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.complex_params`);
      // get_complex_params is no longer used
      // get_array_params is no longer used
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_departments()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_employees()`);
    }
  });
});
