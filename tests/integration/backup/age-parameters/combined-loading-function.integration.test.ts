/**
 * Integration test for Apache AGE parameter passing using a combined loading function
 *
 * This test demonstrates an approach to pass parameters to Cypher queries
 * in Apache AGE by using a single PostgreSQL function that handles both
 * vertex and edge data loading in one operation.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../../setup/integration';

// Graph name for the parameter tests
const PARAM_TEST_GRAPH = 'combined_loading_graph';

describe('Apache AGE Combined Vertex and Edge Loading Function', () => {
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
      await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${TEST_SCHEMA}.combined_graph_data`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.load_graph_data(jsonb)`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_vertices_by_type(ag_catalog.agtype)`);
      await queryExecutor.executeSQL(`DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_edges_by_type(ag_catalog.agtype)`);
    } catch (error) {
      console.warn(`Warning: Could not drop tables/functions: ${error.message}`);
    }
  });

  // Test: Create a combined loading function and use it to load graph data
  it('should load vertices and edges using a single combined loading function', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // 1. Create a function to load graph data from a JSON structure
    await queryExecutor.executeSQL(`
      SET search_path = ag_catalog, public;
      
      -- Create a function to load graph data from a JSON structure
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.load_graph_data(p_graph_data jsonb)
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
        -- Create a temporary table to store the graph data
        DROP TABLE IF EXISTS ${TEST_SCHEMA}.combined_graph_data;
        CREATE TABLE ${TEST_SCHEMA}.combined_graph_data (
          id SERIAL PRIMARY KEY,
          data_type TEXT NOT NULL,
          data_key TEXT NOT NULL,
          data_value JSONB NOT NULL
        );
        
        -- Insert vertex data
        FOR v_vertex_type, v_vertex_data IN SELECT * FROM jsonb_each(p_graph_data->'vertex')
        LOOP
          INSERT INTO ${TEST_SCHEMA}.combined_graph_data (data_type, data_key, data_value)
          VALUES ('vertex', v_vertex_type, v_vertex_data);
          
          v_vertex_count := v_vertex_count + jsonb_array_length(v_vertex_data);
        END LOOP;
        
        -- Insert edge data
        FOR v_edge_type, v_edge_data IN SELECT * FROM jsonb_each(p_graph_data->'edge')
        LOOP
          INSERT INTO ${TEST_SCHEMA}.combined_graph_data (data_type, data_key, data_value)
          VALUES ('edge', v_edge_type, v_edge_data);
          
          v_edge_count := v_edge_count + jsonb_array_length(v_edge_data);
        END LOOP;
        
        -- Return summary of loaded data
        v_result := jsonb_build_object(
          'vertex_count', v_vertex_count,
          'edge_count', v_edge_count,
          'vertex_types', (SELECT jsonb_agg(DISTINCT data_key) FROM ${TEST_SCHEMA}.combined_graph_data WHERE data_type = 'vertex'),
          'edge_types', (SELECT jsonb_agg(DISTINCT data_key) FROM ${TEST_SCHEMA}.combined_graph_data WHERE data_type = 'edge')
        );
        
        RETURN v_result;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create function to retrieve vertices by type
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_vertices_by_type(vertex_type ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        vertex_type_text TEXT;
        result_array ag_catalog.agtype;
      BEGIN
        -- Extract the text value from the agtype parameter
        SELECT vertex_type::text INTO vertex_type_text;
        -- Remove quotes if present
        vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

        SELECT data_value::text::ag_catalog.agtype
        INTO result_array
        FROM ${TEST_SCHEMA}.combined_graph_data
        WHERE data_type = 'vertex' AND data_key = vertex_type_text;

        RETURN result_array;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create function to retrieve edges by type
      CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_edges_by_type(edge_type ag_catalog.agtype)
      RETURNS ag_catalog.agtype AS $$
      DECLARE
        edge_type_text TEXT;
        result_array ag_catalog.agtype;
      BEGIN
        -- Extract the text value from the agtype parameter
        SELECT edge_type::text INTO edge_type_text;
        -- Remove quotes if present
        edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

        SELECT data_value::text::ag_catalog.agtype
        INTO result_array
        FROM ${TEST_SCHEMA}.combined_graph_data
        WHERE data_type = 'edge' AND data_key = edge_type_text;

        RETURN result_array;
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

    // 3. Load the graph data using the function
    const loadResult = await queryExecutor.executeSQL(`
      SELECT ${TEST_SCHEMA}.load_graph_data($1)
    `, [JSON.stringify(graphData)]);

    // 4. Verify the data was loaded correctly
    expect(loadResult.rows[0].load_graph_data).toBeDefined();
    const summary = loadResult.rows[0].load_graph_data;
    expect(summary.vertex_count).toBe(7); // 3 departments + 4 employees
    expect(summary.edge_count).toBe(5);   // 4 WORKS_IN + 1 REPORTS_TO
    expect(summary.vertex_types).toContain('departments');
    expect(summary.vertex_types).toContain('employees');
    expect(summary.edge_types).toContain('WORKS_IN');
    expect(summary.edge_types).toContain('REPORTS_TO');

    // 5. Create department vertices
    const createDeptResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_vertices_by_type($vertex_type) AS dept
      CREATE (d:Department {
        id: dept.id,
        name: dept.name,
        budget: dept.budget
      })
      RETURN count(d) AS created_departments
    `, { vertex_type: 'departments' }, PARAM_TEST_GRAPH);

    // Verify departments were created
    expect(createDeptResult.rows).toHaveLength(1);
    const deptResultValue = createDeptResult.rows[0].result;
    expect(parseInt(deptResultValue, 10)).toBe(3);

    // 6. Create employee vertices
    const createEmpResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_vertices_by_type($vertex_type) AS emp
      CREATE (e:Employee {
        id: emp.id,
        name: emp.name,
        title: emp.title,
        departmentId: emp.departmentId
      })
      RETURN count(e) AS created_employees
    `, { vertex_type: 'employees' }, PARAM_TEST_GRAPH);

    // Verify employees were created
    expect(createEmpResult.rows).toHaveLength(1);
    const empResultValue = createEmpResult.rows[0].result;
    expect(parseInt(empResultValue, 10)).toBe(4);

    // 7. Create WORKS_IN relationships
    const createWorksInResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_edges_by_type($edge_type) AS rel
      MATCH (emp:Employee {id: rel.from}), (dept:Department {id: rel.to})
      CREATE (emp)-[:WORKS_IN {since: rel.since}]->(dept)
      RETURN count(*) AS created_relationships
    `, { edge_type: 'WORKS_IN' }, PARAM_TEST_GRAPH);

    // Verify WORKS_IN relationships were created
    expect(createWorksInResult.rows).toHaveLength(1);
    const worksInResultValue = createWorksInResult.rows[0].result;
    expect(parseInt(worksInResultValue, 10)).toBe(4);

    // 8. Create REPORTS_TO relationships
    const createReportsToResult = await queryExecutor.executeCypher(`
      UNWIND ${TEST_SCHEMA}.get_edges_by_type($edge_type) AS rel
      MATCH (emp1:Employee {id: rel.from}), (emp2:Employee {id: rel.to})
      CREATE (emp1)-[:REPORTS_TO {since: rel.since}]->(emp2)
      RETURN count(*) AS created_relationships
    `, { edge_type: 'REPORTS_TO' }, PARAM_TEST_GRAPH);

    // Verify REPORTS_TO relationships were created
    expect(createReportsToResult.rows).toHaveLength(1);
    const reportsToResultValue = createReportsToResult.rows[0].result;
    expect(parseInt(reportsToResultValue, 10)).toBe(1);

    // 9. Query the graph to verify the employee-department relationships
    const empDeptResult = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
        MATCH (e:Employee)-[r:WORKS_IN]->(d:Department)
        RETURN e.name AS employee_name,
               d.name AS department_name,
               r.since AS since
      $$) as (employee_name text, department_name text, since text);
    `);

    // Verify the employee-department relationships
    expect(empDeptResult.rows).toHaveLength(4);
    
    // Find Alice in the results
    const alice = empDeptResult.rows.find((row: any) => row.employee_name === 'Alice Smith');
    expect(alice).toBeDefined();
    expect(alice.department_name).toBe('Engineering');
    expect(alice.since).toBe('2020-01-01');

    // 10. Query the graph to verify the employee-employee relationships
    const empEmpResult = await queryExecutor.executeSQL(`
      SELECT * FROM ag_catalog.cypher('${PARAM_TEST_GRAPH}', $$
        MATCH (e1:Employee)-[r:REPORTS_TO]->(e2:Employee)
        RETURN e1.name AS employee_name,
               e2.name AS manager_name,
               r.since AS since
      $$) as (employee_name text, manager_name text, since text);
    `);

    // Verify the employee-employee relationships
    expect(empEmpResult.rows).toHaveLength(1);
    expect(empEmpResult.rows[0].employee_name).toBe('Alice Smith');
    expect(empEmpResult.rows[0].manager_name).toBe('Bob Johnson');
    expect(empEmpResult.rows[0].since).toBe('2020-01-01');
  });
});
