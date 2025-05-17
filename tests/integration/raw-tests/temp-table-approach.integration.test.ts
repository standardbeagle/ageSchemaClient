/**
 * Raw integration test for Apache AGE parameter passing using temporary tables
 *
 * This test demonstrates the raw Cypher syntax for passing parameters to Cypher queries
 * in Apache AGE by using temporary tables and functions. It focuses on the raw SQL and
 * Cypher syntax without using the higher-level features of the library.
 *
 * Key Apache AGE syntax patterns demonstrated:
 * 1. Using WITH to pass parameters from PostgreSQL functions to Cypher
 * 2. Using UNWIND with PostgreSQL functions that return ag_catalog.agtype
 * 3. Proper type handling between PostgreSQL and Apache AGE
 * 4. Handling complex data structures like arrays and nested objects
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';
import { QueryBuilder } from '../../../src/query/builder';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'param_test_graph';

// Define a simple schema for testing
const testSchema = {
  vertices: {},
  edges: {},
  version: '1.0.0'
};

describe('Apache AGE Parameter Passing with Temp Tables', () => {
  let ageAvailable = false;

  // Set up the test environment
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      throw new Error('Apache AGE extension is not available, tests will be skipped');
    }

    // Drop the test graph if it exists - suppress console output for expected errors
    try {
      // Temporarily redirect console output
      const originalConsoleError = console.error;
      console.error = () => {}; // No-op function

      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);

      // Restore console output
      console.error = originalConsoleError;
    } catch (error) {
      // Ignore error if graph doesn't exist - don't log expected errors
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

    // Drop the test graph - suppress console output for expected errors
    try {
      // Temporarily redirect console output
      const originalConsoleError = console.error;
      console.error = () => {}; // No-op function

      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${PARAM_TEST_GRAPH}', true)`);

      // Restore console output
      console.error = originalConsoleError;
    } catch (error) {
      // Ignore error if graph doesn't exist - don't log expected errors
    }

    // Drop the test tables and functions
    try {
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.temp_params`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_params()`);
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.complex_params`);
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.graph_data`);
      // get_complex_params is no longer used
      // get_array_params is no longer used
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_departments()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_employees()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_vertices(ag_catalog.agtype)`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_edges(ag_catalog.agtype)`);
    } catch (error) {
      // Ignore errors when dropping tables/functions - these are expected if they don't exist
    }
  });

  // Test: Use temp table and function to pass parameters to Cypher
  it('should pass parameters to Cypher using temp table and function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a QueryBuilder instance for parameter handling
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PARAM_TEST_GRAPH);

    // 2. Set parameters using the setParam method
    // This demonstrates how to use the QueryBuilder's setParam method
    // to store parameters in the age_params temporary table
    const params = {
      name: "Test Person",
      age: 30,
      active: true
    };

    // Set each parameter using setParam
    for (const [key, value] of Object.entries(params)) {
      await queryBuilder.setParam(key, value);
    }

    // 3. Execute a Cypher query using the withAllAgeParams method
    try {
      // First create a simple vertex using the parameters
      // This demonstrates using QueryBuilder's withAllAgeParams with raw Cypher:
      // 1. Get all parameters from the age_params table
      // 2. Access properties from the returned object
      // 3. Create a vertex with properties from the object
      const cypher = `
        WITH age_schema_client.get_all_age_params() AS params
        CREATE (p:Person {
          name: params.name,
          age: params.age,
          active: params.active
        })
        RETURN 1 as success
      `;
      const createResult = await queryExecutor.executeCypher(
        cypher,
        {},
        PARAM_TEST_GRAPH
      );

      // Verify the query executed successfully
      expect(createResult.rows).toHaveLength(1);

      // The success value might be returned as an object, string, or number
      const successValue = createResult.rows[0].success;
      const parsedSuccess = typeof successValue === 'string'
        ? JSON.parse(successValue)
        : (typeof successValue === 'object' ? successValue : 1);

      expect(parsedSuccess).toBeTruthy();

      // Now query the vertex to verify the parameters were passed correctly
      // This demonstrates a simple Cypher query to retrieve the vertex
      const queryCypher = `
        MATCH (p:Person)
        RETURN p.name AS name, p.age AS age, p.active AS active
      `;
      const queryResult = await queryExecutor.executeCypher(
        queryCypher,
        {},
        PARAM_TEST_GRAPH
      );

      // Verify the query returned the expected vertex
      expect(queryResult.rows).toHaveLength(1);

      // Parse the name value
      const name = typeof queryResult.rows[0].name === 'string'
        ? (queryResult.rows[0].name.startsWith('"') ? JSON.parse(queryResult.rows[0].name) : queryResult.rows[0].name)
        : queryResult.rows[0].name;

      // Parse the age value
      const age = typeof queryResult.rows[0].age === 'string'
        ? parseInt(queryResult.rows[0].age, 10)
        : queryResult.rows[0].age;

      // Parse the active value
      const active = typeof queryResult.rows[0].active === 'string'
        ? (queryResult.rows[0].active === 'true' || queryResult.rows[0].active === '"true"')
        : queryResult.rows[0].active;

      expect(name).toBe('Test Person');
      expect(age).toBe(30);
      expect(active).toBe(true);

    } catch (error) {
      console.error('Error executing Cypher query:', error);
      throw error;
    } finally {
      // Reset the query builder
      queryBuilder.reset();
    }
  });

  // Test: Pass complex data structures (arrays of objects) to Cypher
  it('should pass arrays of objects to Cypher using temp table and function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a QueryBuilder instance for parameter handling
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PARAM_TEST_GRAPH);

    // 2. Define complex parameters with arrays of objects
    // This demonstrates how to structure complex nested data in JavaScript
    // that will be passed to Apache AGE
    const complexParams = {
      // Array of department objects
      departments: [
        { id: 1, name: "Engineering", budget: 1000000 },
        { id: 2, name: "Marketing", budget: 500000 },
        { id: 3, name: "Sales", budget: 750000 }
      ],
      // Array of employee objects with nested arrays (skills)
      employees: [
        { id: 101, name: "Alice Smith", departmentId: 1, skills: ["JavaScript", "TypeScript", "React"] },
        { id: 102, name: "Bob Johnson", departmentId: 1, skills: ["Python", "Django", "PostgreSQL"] },
        { id: 103, name: "Carol Williams", departmentId: 2, skills: ["Marketing", "Social Media"] },
        { id: 104, name: "Dave Brown", departmentId: 3, skills: ["Sales", "Negotiation"] }
      ]
    };

    // Set each parameter using setParam
    for (const [key, value] of Object.entries(complexParams)) {
      await queryBuilder.setParam(key, value);
    }

    // 3. Create functions that return ag_catalog.agtype for UNWIND
    // This demonstrates how to:
    // 1. Convert JSONB arrays to ag_catalog.agtype arrays for use with UNWIND
    // 2. Handle type conversions for numeric and string values
    // 3. Properly format the data for Apache AGE
    await queryExecutor.executeSQL(`
      SET search_path = ag_catalog, public;
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_departments()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        -- Use jsonb_agg to create a JSONB array, then convert to ag_catalog.agtype
        -- This is critical for proper handling by Apache AGE's UNWIND
        SELECT jsonb_agg(jsonb_build_object(
          'id', (elem->>'id')::int,          -- Convert string ID to integer
          'name', elem->>'name',             -- Keep name as string
          'budget', (elem->>'budget')::numeric -- Convert budget to numeric
        ))::text::ag_catalog.agtype          -- Convert to ag_catalog.agtype via text
        INTO result_array
        FROM (
          -- Extract each array element as a separate row
          SELECT jsonb_array_elements(value) as elem
          FROM age_params
          WHERE key = 'departments'
        ) sub;
        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function for employees with nested arrays (skills)
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_employees()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        -- Similar approach as departments, but preserving the nested skills array
        SELECT jsonb_agg(jsonb_build_object(
          'id', (elem->>'id')::int,
          'name', elem->>'name',
          'departmentId', (elem->>'departmentId')::int,
          'skills', elem->'skills' -- Keep skills as a JSONB array without type conversion
        ))::text::ag_catalog.agtype
        INTO result_array
        FROM (
          SELECT jsonb_array_elements(value) as elem
          FROM age_params
          WHERE key = 'employees'
        ) sub;
        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    try {
      // 4. Create Department vertices using UNWIND
      // This demonstrates the raw Cypher syntax for:
      // 1. Using UNWIND with a PostgreSQL function that returns ag_catalog.agtype
      // 2. Creating vertices with properties from each unwound item
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
      // The result is in the format {"created_departments":"3"} where "3" is a string
      const resultValue = createDeptResult.rows[0].created_departments;
      expect(parseInt(resultValue, 10)).toBe(3);

      // 5. Create Employee vertices using UNWIND
      // This demonstrates handling complex nested data (skills array)
      const createEmpResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_employees() AS emp
        CREATE (e:Employee {
          id: emp.id,
          name: emp.name,
          departmentId: emp.departmentId,
          skills: emp.skills // Store the skills array directly as an agtype array
        })
        RETURN count(e) AS created_employees
      `, {}, PARAM_TEST_GRAPH);

      // Verify employees were created
      expect(createEmpResult.rows).toHaveLength(1);
      // The result is in the format {"created_employees":"4"} where "4" is a string
      const empResultValue = createEmpResult.rows[0].created_employees;
      expect(parseInt(empResultValue, 10)).toBe(4);

      // 6. Create WORKS_IN relationships between Employees and Departments
      // This demonstrates the raw Cypher syntax for:
      // 1. Using UNWIND with a function to iterate over data
      // 2. Using MATCH to find existing vertices
      // 3. Creating relationships between vertices
      const createRelResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_employees() AS emp_data
        MATCH (emp:Employee {id: emp_data.id})
        MATCH (dept:Department {id: emp_data.departmentId})
        CREATE (emp)-[:WORKS_IN]->(dept)
        RETURN count(*) AS created_relationships
      `, {}, PARAM_TEST_GRAPH);

      expect(createRelResult.rows).toHaveLength(1);
      // All 4 employees should have a department
      // The result is in the format {"created_relationships":"4"} where "4" is a string
      const relResultValue = createRelResult.rows[0].created_relationships;
      expect(parseInt(relResultValue, 10)).toBe(4);


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
      // Parse the skills string to an array if it's a string
      const aliceSkills = typeof alice.skills === 'string' ? JSON.parse(alice.skills) : alice.skills;
      expect(aliceSkills).toEqual(["JavaScript", "TypeScript", "React"]);

      // Find Carol in the results
      const carol = employeeQueryResult.rows.find((row: any) => row.employee_name === 'Carol Williams');
      expect(carol).toBeDefined();
      expect(carol.department_id).toBe(2);
      // Parse the skills string to an array if it's a string
      const carolSkills = typeof carol.skills === 'string' ? JSON.parse(carol.skills) : carol.skills;
      expect(carolSkills).toEqual(["Marketing", "Social Media"]);

      // Find Bob in the results
      const bob = employeeQueryResult.rows.find((row: any) => row.employee_name === 'Bob Johnson');
      expect(bob).toBeDefined();
      expect(bob.department_id).toBe(1);
      // Parse the skills string to an array if it's a string
      const bobSkills = typeof bob.skills === 'string' ? JSON.parse(bob.skills) : bob.skills;
      expect(bobSkills).toEqual(["Python", "Django", "PostgreSQL"]);

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

      // 10. Query the graph to verify the relationships (edges) were correctly created
      const relationshipQueryResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (e:Employee)-[r:WORKS_IN]->(d:Department)
          RETURN e.id AS employee_id,
                 e.name AS employee_name,
                 d.id AS department_id,
                 d.name AS department_name,
                 type(r) AS relationship_type
        $$) as (employee_id int, employee_name text, department_id int, department_name text, relationship_type text);
      `);

      // Verify all 4 relationships were created
      expect(relationshipQueryResult.rows).toHaveLength(4);

      // Verify each employee is connected to the correct department
      const aliceRel = relationshipQueryResult.rows.find((row: any) => row.employee_name === 'Alice Smith');
      expect(aliceRel).toBeDefined();
      expect(aliceRel.department_id).toBe(1);
      expect(aliceRel.department_name).toBe('Engineering');
      expect(aliceRel.relationship_type).toBe('WORKS_IN');

      const bobRel = relationshipQueryResult.rows.find((row: any) => row.employee_name === 'Bob Johnson');
      expect(bobRel).toBeDefined();
      expect(bobRel.department_id).toBe(1);
      expect(bobRel.department_name).toBe('Engineering');
      expect(bobRel.relationship_type).toBe('WORKS_IN');

      const carolRel = relationshipQueryResult.rows.find((row: any) => row.employee_name === 'Carol Williams');
      expect(carolRel).toBeDefined();
      expect(carolRel.department_id).toBe(2);
      expect(carolRel.department_name).toBe('Marketing');
      expect(carolRel.relationship_type).toBe('WORKS_IN');

      const daveRel = relationshipQueryResult.rows.find((row: any) => row.employee_name === 'Dave Brown');
      expect(daveRel).toBeDefined();
      expect(daveRel.department_id).toBe(3);
      expect(daveRel.department_name).toBe('Sales');
      expect(daveRel.relationship_type).toBe('WORKS_IN');

    } catch (error) {
      console.error('Error executing Cypher query with complex parameters:', error);
      throw error;
    } finally {
      // Reset the query builder
      queryBuilder.reset();

      // Clean up the functions
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_departments()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_employees()`);
    }
  });

  // Test: Pass combined vertex and edge data structure to Cypher
  it('should pass combined vertex and edge data to Cypher using temp table and functions', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a QueryBuilder instance for parameter handling
    const queryBuilder = new QueryBuilder(testSchema, queryExecutor, PARAM_TEST_GRAPH);

    // 2. Define the combined vertex and edge data structure
    // This demonstrates a more complex hierarchical data structure with
    // both vertices and edges in a single object
    const graphData = {
      vertex: {
        departments: [
          { id: 101, name: "Engineering", budget: 1000000 },
          { id: 102, name: "Marketing", budget: 500000 }
        ],
        employees: [
          { id: 1, name: "Alice Smith", title: "Engineer" },
          { id: 2, name: "Bob Johnson", title: "Manager" }
        ]
      },
      edge: {
        WORKS_IN: [
          { from: 1, to: 101, start_date: '1/1/2020' }
        ],
        WORKS_FOR: [
          { from: 1, to: 2, start_date: '1/1/2020' }
        ]
      }
    };

    // 3. Set parameters using setParam
    // For vertices - store each vertex type as a separate parameter
    for (const [vertexType, vertices] of Object.entries(graphData.vertex)) {
      await queryBuilder.setParam(`vertex_${vertexType}`, vertices);
    }

    // For edges - store each edge type as a separate parameter
    for (const [edgeType, edges] of Object.entries(graphData.edge)) {
      await queryBuilder.setParam(`edge_${edgeType}`, edges);
    }

    // 4. Create a function to retrieve vertices by type
    // This demonstrates:
    // 1. Creating a function that accepts an ag_catalog.agtype parameter
    // 2. Converting between text and ag_catalog.agtype
    // 3. Handling parameter passing for dynamic data retrieval
    await queryExecutor.executeSQL(`
      SET search_path = ag_catalog, public;
      -- Create function to retrieve vertices by type
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_vertices(vertex_type ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        vertex_type_text TEXT;
        result_array ag_catalog.agtype;
      BEGIN
        -- Extract the text value from the agtype parameter
        -- This is necessary because parameters come in as ag_catalog.agtype
        SELECT vertex_type::text INTO vertex_type_text;
        -- Remove quotes if present (handles both single and double quotes)
        vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

        -- Get the data for the specified vertex type and convert to ag_catalog.agtype
        -- This direct conversion is critical for proper handling by UNWIND
        SELECT value::text::ag_catalog.agtype
        INTO result_array
        FROM age_params
        WHERE key = 'vertex_' || vertex_type_text;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. Create a function to retrieve edges by type
    // Similar approach as the vertex function, but for edges
    await queryExecutor.executeSQL(`
      -- Create function to retrieve edges by type
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_edges(edge_type ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        edge_type_text TEXT;
        result_array ag_catalog.agtype;
      BEGIN
        -- Extract the text value from the agtype parameter
        SELECT edge_type::text INTO edge_type_text;
        -- Remove quotes if present
        edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

        -- Get the data for the specified edge type and convert to ag_catalog.agtype
        SELECT value::text::ag_catalog.agtype
        INTO result_array
        FROM age_params
        WHERE key = 'edge_' || edge_type_text;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    try {
      // 6. Create department vertices
      // This demonstrates:
      // 1. Passing a parameter to executeCypher that will be used in the function call
      // 2. Using UNWIND with a function that accepts a parameter
      // 3. Creating vertices from the unwound data
      const createDeptResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_vertices($vertex_type) AS dept
        CREATE (d:Department {
          id: dept.id,
          name: dept.name,
          budget: dept.budget
        })
        RETURN count(d) AS created_departments
      `, { vertex_type: 'departments' }, PARAM_TEST_GRAPH);

      // Verify departments were created
      expect(createDeptResult.rows).toHaveLength(1);
      // The result is in the format {"created_departments":"2"} where "2" is a string
      const deptResultValue = createDeptResult.rows[0].created_departments;
      expect(parseInt(deptResultValue, 10)).toBe(2);

      // 7. Create employee vertices
      // Similar approach as departments, but for employees
      const createEmpResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_vertices($vertex_type) AS emp
        CREATE (e:Employee {
          id: emp.id,
          name: emp.name,
          title: emp.title
        })
        RETURN count(e) AS created_employees
      `, { vertex_type: 'employees' }, PARAM_TEST_GRAPH);

      // Verify employees were created
      expect(createEmpResult.rows).toHaveLength(1);
      // The result is in the format {"created_employees":"2"} where "2" is a string
      const empResultValue2 = createEmpResult.rows[0].created_employees;
      expect(parseInt(empResultValue2, 10)).toBe(2);

      // 8. Create WORKS_IN relationships
      // This demonstrates:
      // 1. Using UNWIND with edges data
      // 2. Using MATCH to find the vertices to connect
      // 3. Creating relationships with properties
      const createWorksInResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_edges($edge_type) AS rel
        MATCH (emp:Employee {id: rel.from}), (dept:Department {id: rel.to})
        CREATE (emp)-[:WORKS_IN {start_date: rel.start_date}]->(dept)
        RETURN count(*) AS created_relationships
      `, { edge_type: 'WORKS_IN' }, PARAM_TEST_GRAPH);

      // Verify WORKS_IN relationships were created
      expect(createWorksInResult.rows).toHaveLength(1);
      // The result is in the format {"created_relationships":"1"} where "1" is a string
      const worksInResultValue = createWorksInResult.rows[0].created_relationships;
      expect(parseInt(worksInResultValue, 10)).toBe(1);

      // 9. Create WORKS_FOR relationships
      // Similar approach as WORKS_IN, but connecting employees to employees
      const createWorksForResult = await queryExecutor.executeCypher(`
        UNWIND ${TEST_SCHEMA}.get_edges($edge_type) AS rel
        MATCH (emp1:Employee {id: rel.from}), (emp2:Employee {id: rel.to})
        CREATE (emp1)-[:WORKS_FOR {start_date: rel.start_date}]->(emp2)
        RETURN count(*) AS created_relationships
      `, { edge_type: 'WORKS_FOR' }, PARAM_TEST_GRAPH);

      // Verify WORKS_FOR relationships were created
      expect(createWorksForResult.rows).toHaveLength(1);
      // The result is in the format {"created_relationships":"1"} where "1" is a string
      const worksForResultValue = createWorksForResult.rows[0].created_relationships;
      expect(parseInt(worksForResultValue, 10)).toBe(1);

      // 10. Query the graph to verify the employee-department relationships
      // Use executeSQL with explicit column definitions to avoid the column definition mismatch
      // Add a filter to get only the specific relationship we're looking for
      const empDeptResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (e:Employee)-[r:WORKS_IN]->(d:Department)
          WHERE e.id = 1 AND d.id = 101
          RETURN e.name AS employee_name,
                 d.name AS department_name,
                 r.start_date AS start_date
        $$) as (employee_name text, department_name text, start_date text);
      `);

      // Verify the employee-department relationships
      expect(empDeptResult.rows).toHaveLength(1);
      expect(empDeptResult.rows[0].employee_name).toBe('Alice Smith');
      expect(empDeptResult.rows[0].department_name).toBe('Engineering');
      expect(empDeptResult.rows[0].start_date).toBe('1/1/2020');

      // 11. Query the graph to verify the employee-employee relationships
      // Use executeSQL with explicit column definitions to avoid the column definition mismatch
      const empEmpResult = await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
          MATCH (e1:Employee)-[r:WORKS_FOR]->(e2:Employee)
          RETURN e1.name AS employee_name,
                 e2.name AS manager_name,
                 r.start_date AS start_date
        $$) as (employee_name text, manager_name text, start_date text);
      `);

      // Verify the employee-employee relationships
      expect(empEmpResult.rows).toHaveLength(1);
      expect(empEmpResult.rows[0].employee_name).toBe('Alice Smith');
      expect(empEmpResult.rows[0].manager_name).toBe('Bob Johnson');
      expect(empEmpResult.rows[0].start_date).toBe('1/1/2020');

    } catch (error) {
      console.error('Error executing Cypher query with combined vertex and edge data:', error);
      throw error;
    } finally {
      // Reset the query builder
      queryBuilder.reset();

      // Drop the functions
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_vertices(ag_catalog.agtype)`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_edges(ag_catalog.agtype)`);
    }
  });
});
