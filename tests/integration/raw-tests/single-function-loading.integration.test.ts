/**
 * Raw integration test for Apache AGE parameter passing using a single function
 *
 * This test demonstrates the raw Cypher syntax for passing parameters to Cypher queries
 * in Apache AGE by using a single PostgreSQL function that handles both vertex and edge
 * data loading in one operation, reducing the number of queries needed.
 *
 * Key Apache AGE syntax patterns demonstrated:
 * 1. Using a single PostgreSQL function to store and process graph data
 * 2. Converting PostgreSQL data types to ag_catalog.agtype for use with UNWIND
 * 3. Using jsonb_agg() to build arrays that can be cast to ag_catalog.agtype
 * 4. Proper handling of complex nested data structures
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'single_function_graph';

describe('Apache AGE Single Function Data Loading', () => {
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
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.graph_data_store`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.store_graph_data(jsonb)`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.create_graph_elements(text)`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_departments_data()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_employees_data()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_works_in_data()`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_reports_to_data()`);
    } catch (error) {
      console.warn(`Warning: Could not drop tables/functions: ${error.message}`);
    }
  });

  // Test: Create a single function to load both vertices and edges
  it('should load vertices and edges using a single function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Set search path
    await queryExecutor.executeSQL(`SET search_path = ag_catalog, public`);

    // 2. Create a table to store graph data
    await queryExecutor.executeSQL(`
      DROP TABLE IF EXISTS ${TEST_SCHEMA}.graph_data_store;
      CREATE TABLE ${TEST_SCHEMA}.graph_data_store (
        id SERIAL PRIMARY KEY,
        data_type TEXT NOT NULL,
        data_key TEXT NOT NULL,
        data_value JSONB NOT NULL
      )
    `);

    // 3. Create a function to store graph data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.store_graph_data(p_graph_data jsonb)
      RETURNS jsonb AS $$
      DECLARE
        v_result jsonb;
        v_vertex_type text;
        v_edge_type text;
        v_vertex_data jsonb;
        v_edge_data jsonb;
        v_vertex_count int := 0;
        v_edge_count int := 0;
      BEGIN
        -- Insert vertex data
        FOR v_vertex_type, v_vertex_data IN SELECT * FROM jsonb_each(p_graph_data->'vertex')
        LOOP
          INSERT INTO ${TEST_SCHEMA}.graph_data_store (data_type, data_key, data_value)
          VALUES ('vertex', v_vertex_type, v_vertex_data);

          v_vertex_count := v_vertex_count + jsonb_array_length(v_vertex_data);
        END LOOP;

        -- Insert edge data
        FOR v_edge_type, v_edge_data IN SELECT * FROM jsonb_each(p_graph_data->'edge')
        LOOP
          INSERT INTO ${TEST_SCHEMA}.graph_data_store (data_type, data_key, data_value)
          VALUES ('edge', v_edge_type, v_edge_data);

          v_edge_count := v_edge_count + jsonb_array_length(v_edge_data);
        END LOOP;

        -- Return summary of loaded data
        v_result := jsonb_build_object(
          'vertex_count', v_vertex_count,
          'edge_count', v_edge_count,
          'vertex_types', (SELECT jsonb_agg(DISTINCT data_key) FROM ${TEST_SCHEMA}.graph_data_store WHERE data_type = 'vertex'),
          'edge_types', (SELECT jsonb_agg(DISTINCT data_key) FROM ${TEST_SCHEMA}.graph_data_store WHERE data_type = 'edge')
        );

        RETURN v_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. Create function to get departments data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_departments_data()
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
          SELECT jsonb_array_elements(data_value) as elem
          FROM ${TEST_SCHEMA}.graph_data_store
          WHERE data_type = 'vertex' AND data_key = 'departments'
        ) sub;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. Create function to get employees data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_employees_data()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'id', (elem->>'id')::int,
          'name', elem->>'name',
          'title', elem->>'title',
          'departmentId', (elem->>'departmentId')::int
        ))::text::ag_catalog.agtype
        INTO result_array
        FROM (
          SELECT jsonb_array_elements(data_value) as elem
          FROM ${TEST_SCHEMA}.graph_data_store
          WHERE data_type = 'vertex' AND data_key = 'employees'
        ) sub;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. Create function to get WORKS_IN relationship data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_works_in_data()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'from', (elem->>'from')::int,
          'to', (elem->>'to')::int,
          'since', elem->>'since'
        ))::text::ag_catalog.agtype
        INTO result_array
        FROM (
          SELECT jsonb_array_elements(data_value) as elem
          FROM ${TEST_SCHEMA}.graph_data_store
          WHERE data_type = 'edge' AND data_key = 'WORKS_IN'
        ) sub;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 7. Create function to get REPORTS_TO relationship data
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_reports_to_data()
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        result_array ag_catalog.agtype;
      BEGIN
        SELECT jsonb_agg(jsonb_build_object(
          'from', (elem->>'from')::int,
          'to', (elem->>'to')::int,
          'since', elem->>'since'
        ))::text::ag_catalog.agtype
        INTO result_array
        FROM (
          SELECT jsonb_array_elements(data_value) as elem
          FROM ${TEST_SCHEMA}.graph_data_store
          WHERE data_type = 'edge' AND data_key = 'REPORTS_TO'
        ) sub;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 8. Create a function to create graph elements
    // This function demonstrates how to create a single PostgreSQL function
    // that handles all graph element creation in one operation
    await queryExecutor.executeSQL(`
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.create_graph_elements(p_graph_name text)
      RETURNS jsonb AS $$
      DECLARE
        v_result jsonb;
        v_vertex_count int := 0;
        v_edge_count int := 0;
        v_dept_count int := 0;
        v_emp_count int := 0;
        v_works_in_count int := 0;
        v_reports_to_count int := 0;
        v_cypher_result text;
      BEGIN
        /* Create department vertices using raw Cypher syntax */
        /* We need to use dynamic SQL execution with EXECUTE format() */
        /* The %L placeholder is for the graph name */
        EXECUTE format('
          SELECT * FROM ag_catalog.cypher(%L, $q$
            UNWIND ${TEST_SCHEMA}.get_departments_data() AS dept
            CREATE (d:Department {
              id: dept.id,
              name: dept.name,
              budget: dept.budget
            })
            RETURN count(d) AS created_departments
          $q$) as (created_departments ag_catalog.agtype)
        ', p_graph_name) INTO v_cypher_result;

        /* Extract the count from the result */
        v_dept_count := (v_cypher_result::jsonb->>'created_departments')::int;
        v_vertex_count := v_vertex_count + v_dept_count;

        /* Create employee vertices using raw Cypher syntax */
        EXECUTE format('
          SELECT * FROM ag_catalog.cypher(%L, $q$
            UNWIND ${TEST_SCHEMA}.get_employees_data() AS emp
            CREATE (e:Employee {
              id: emp.id,
              name: emp.name,
              title: emp.title,
              departmentId: emp.departmentId
            })
            RETURN count(e) AS created_employees
          $q$) as (created_employees ag_catalog.agtype)
        ', p_graph_name) INTO v_cypher_result;

        /* Extract the count from the result */
        v_emp_count := (v_cypher_result::jsonb->>'created_employees')::int;
        v_vertex_count := v_vertex_count + v_emp_count;

        /* Create WORKS_IN relationships using raw Cypher syntax */
        EXECUTE format('
          SELECT * FROM ag_catalog.cypher(%L, $q$
            UNWIND ${TEST_SCHEMA}.get_works_in_data() AS rel
            MATCH (emp:Employee {id: rel.from}), (dept:Department {id: rel.to})
            CREATE (emp)-[:WORKS_IN {since: rel.since}]->(dept)
            RETURN count(*) AS created_relationships
          $q$) as (created_relationships ag_catalog.agtype)
        ', p_graph_name) INTO v_cypher_result;

        /* Extract the count from the result */
        v_works_in_count := (v_cypher_result::jsonb->>'created_relationships')::int;
        v_edge_count := v_edge_count + v_works_in_count;

        /* Create REPORTS_TO relationships using raw Cypher syntax */
        EXECUTE format('
          SELECT * FROM ag_catalog.cypher(%L, $q$
            UNWIND ${TEST_SCHEMA}.get_reports_to_data() AS rel
            MATCH (emp1:Employee {id: rel.from}), (emp2:Employee {id: rel.to})
            CREATE (emp1)-[:REPORTS_TO {since: rel.since}]->(emp2)
            RETURN count(*) AS created_relationships
          $q$) as (created_relationships ag_catalog.agtype)
        ', p_graph_name) INTO v_cypher_result;

        /* Extract the count from the result */
        v_reports_to_count := (v_cypher_result::jsonb->>'created_relationships')::int;
        v_edge_count := v_edge_count + v_reports_to_count;

        /* Return summary */
        v_result := jsonb_build_object(
          'vertex_count', v_vertex_count,
          'edge_count', v_edge_count,
          'departments_count', v_dept_count,
          'employees_count', v_emp_count,
          'works_in_count', v_works_in_count,
          'reports_to_count', v_reports_to_count
        );

        RETURN v_result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. Define the combined vertex and edge data structure
    const graphData = {
      vertex: {
        departments: [
          { id: 101, name: "Engineering", budget: 1000000 },
          { id: 102, name: "Marketing", budget: 500000 },
          { id: 103, name: "Sales", budget: 750000 }
        ],
        employees: [
          { id: 1, name: "Alice Smith", title: "Engineer", departmentId: 101 },
          { id: 2, name: "Bob Johnson", title: "Manager", departmentId: 101 },
          { id: 3, name: "Carol Williams", title: "Marketer", departmentId: 102 },
          { id: 4, name: "Dave Brown", title: "Sales Rep", departmentId: 103 }
        ]
      },
      edge: {
        WORKS_IN: [
          { from: 1, to: 101, since: '2020-01-01' },
          { from: 2, to: 101, since: '2019-05-15' },
          { from: 3, to: 102, since: '2021-03-10' },
          { from: 4, to: 103, since: '2018-11-20' }
        ],
        REPORTS_TO: [
          { from: 1, to: 2, since: '2020-01-01' }
        ]
      }
    };

    // 3. Store the graph data using the first function
    const storeResult = await queryExecutor.executeSQL(`
      SELECT ${TEST_SCHEMA}.store_graph_data($1)
    `, [JSON.stringify(graphData)]);

    // 4. Verify the data was stored correctly
    expect(storeResult.rows[0].store_graph_data).toBeDefined();
    const summary = storeResult.rows[0].store_graph_data;
    expect(summary.vertex_count).toBe(7); // 3 departments + 4 employees
    expect(summary.edge_count).toBe(5);   // 4 WORKS_IN + 1 REPORTS_TO
    expect(summary.vertex_types).toContain('departments');
    expect(summary.vertex_types).toContain('employees');
    expect(summary.edge_types).toContain('WORKS_IN');
    expect(summary.edge_types).toContain('REPORTS_TO');

    // 5. Create all graph elements using the second function
    const createResult = await queryExecutor.executeSQL(`
      SELECT ${TEST_SCHEMA}.create_graph_elements($1)
    `, [PARAM_TEST_GRAPH]);

    // 6. Verify the elements were created by the function
    expect(createResult.rows[0].create_graph_elements).toBeDefined();
    const createSummary = createResult.rows[0].create_graph_elements;

    // Log the actual structure to debug
    console.log('Create graph elements result structure:', JSON.stringify(createSummary));

    // Verify the function returned a result
    expect(createSummary).toBeDefined();

    // Note: We don't need to create the vertices and edges separately
    // as they were already created by the create_graph_elements function

    // 7. Query the graph to verify the vertices were created
    const vertexResult = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
        MATCH (n)
        RETURN labels(n) AS label, count(*) AS count
      $$) as (label agtype, count bigint);
    `);

    // Verify the vertex counts
    expect(vertexResult.rows).toHaveLength(2);

    // Find Department vertices
    const departments = vertexResult.rows.find((row: any) =>
      JSON.stringify(row.label).includes('Department')
    );
    expect(departments).toBeDefined();
    expect(parseInt(departments.count, 10)).toBe(3);

    // Find Employee vertices
    const employees = vertexResult.rows.find((row: any) =>
      JSON.stringify(row.label).includes('Employee')
    );
    expect(employees).toBeDefined();
    expect(parseInt(employees.count, 10)).toBe(4);

    // 8. Query the graph to verify the edges were created
    const edgeResult = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
        MATCH ()-[r]->()
        RETURN type(r) AS type, count(*) AS count
      $$) as (type text, count bigint);
    `);

    // Verify the edge counts
    expect(edgeResult.rows).toHaveLength(2);

    // Find WORKS_IN edges
    const worksIn = edgeResult.rows.find((row: any) => row.type === 'WORKS_IN');
    expect(worksIn).toBeDefined();
    expect(parseInt(worksIn.count, 10)).toBe(4);

    // Find REPORTS_TO edges
    const reportsTo = edgeResult.rows.find((row: any) => row.type === 'REPORTS_TO');
    expect(reportsTo).toBeDefined();
    expect(parseInt(reportsTo.count, 10)).toBe(1);

    // Test is successful if we've reached this point
    // The vertex and edge counts have been verified
  });
});
