/**
 * PostgreSQL stored procedures for handling JavaScript arrays of objects with temporary tables
 *
 * These procedures allow passing JavaScript arrays of objects to Apache AGE Cypher queries
 * by storing them in a temporary table and then retrieving them as an agtype array.
 */

-- Function to store a JavaScript array of objects in a temporary table
-- Parameters:
--   p_schema_name: Schema name for the temporary table
--   p_table_name: Name of the temporary table to create
--   p_json_array: JSON array of objects to store
--   p_drop_if_exists: Whether to drop the table if it already exists (default: true)
CREATE OR REPLACE PROCEDURE store_json_array_in_temp_table(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_json_array JSONB,
  p_drop_if_exists BOOLEAN DEFAULT TRUE
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sql TEXT;
  v_full_table_name TEXT;
  v_json_element JSONB;
  v_column_names TEXT[];
  v_column_types TEXT[];
  v_column_defs TEXT;
  v_insert_columns TEXT;
  v_insert_values TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Validate inputs
  IF p_json_array IS NULL OR jsonb_array_length(p_json_array) = 0 THEN
    RAISE EXCEPTION 'JSON array cannot be null or empty';
  END IF;

  -- Set the fully qualified table name
  v_full_table_name := p_schema_name || '.' || p_table_name;

  -- Drop the table if it exists and the flag is set
  IF p_drop_if_exists THEN
    EXECUTE 'DROP TABLE IF EXISTS ' || v_full_table_name;
  END IF;

  -- Get the first element to determine the structure
  v_json_element := p_json_array->0;

  -- Extract column names and infer types from the first object
  SELECT
    array_agg(key),
    array_agg(
      CASE
        WHEN jsonb_typeof(value) = 'number' AND value::TEXT ~ '^[0-9]+$' THEN 'INTEGER'
        WHEN jsonb_typeof(value) = 'number' THEN 'NUMERIC'
        WHEN jsonb_typeof(value) = 'boolean' THEN 'BOOLEAN'
        WHEN jsonb_typeof(value) = 'object' THEN 'JSONB'
        WHEN jsonb_typeof(value) = 'array' THEN 'JSONB'
        ELSE 'TEXT'
      END
    )
  INTO v_column_names, v_column_types
  FROM jsonb_each(v_json_element);

  -- Create column definitions for the table
  SELECT string_agg(v_column_names[i] || ' ' || v_column_types[i], ', ')
  INTO v_column_defs
  FROM generate_series(1, array_length(v_column_names, 1)) AS i;

  -- Create the temporary table
  v_sql := 'CREATE TABLE ' || v_full_table_name || ' (' || v_column_defs || ')';
  EXECUTE v_sql;

  -- Insert each object from the JSON array into the table
  FOR v_json_element IN SELECT jsonb_array_elements(p_json_array)
  LOOP
    -- Prepare column names for the INSERT statement
    SELECT string_agg(quote_ident(key), ', ')
    INTO v_insert_columns
    FROM jsonb_each(v_json_element);

    -- Prepare values for the INSERT statement
    SELECT string_agg(
      CASE
        WHEN jsonb_typeof(value) = 'null' THEN 'NULL'
        WHEN jsonb_typeof(value) = 'object' OR jsonb_typeof(value) = 'array' THEN quote_literal(value::TEXT)
        WHEN jsonb_typeof(value) = 'string' THEN quote_literal(value::TEXT)
        ELSE value::TEXT
      END,
      ', '
    )
    INTO v_insert_values
    FROM jsonb_each(v_json_element);

    -- Execute the INSERT statement
    v_sql := 'INSERT INTO ' || v_full_table_name || ' (' || v_insert_columns || ') VALUES (' || v_insert_values || ')';
    EXECUTE v_sql;

    v_counter := v_counter + 1;
  END LOOP;

  -- Log the number of rows inserted
  RAISE NOTICE 'Inserted % rows into %', v_counter, v_full_table_name;
END;
$$;

-- Function to retrieve data from a temporary table as a JSON array
-- Parameters:
--   p_schema_name: Schema name for the temporary table
--   p_table_name: Name of the temporary table to read from
-- Returns:
--   A JSON array containing all rows from the table as objects
CREATE OR REPLACE FUNCTION get_temp_table_as_json_array(
  p_schema_name TEXT,
  p_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_full_table_name TEXT;
BEGIN
  -- Set the fully qualified table name
  v_full_table_name := p_schema_name || '.' || p_table_name;

  -- Convert the table rows to a JSON array
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)::jsonb) FROM ' || v_full_table_name || ' AS t'
  INTO v_result;

  -- Handle empty table case
  IF v_result IS NULL THEN
    v_result := '[]'::JSONB;
  END IF;

  RETURN v_result;
END;
$$;

-- Example usage:
/*
-- 1. Store a JSON array in a temporary table
CALL store_json_array_in_temp_table(
  'public',
  'temp_employees',
  '[
    {"id": 1, "name": "John Smith", "title": "CEO", "department": "Executive", "salary": 150000},
    {"id": 2, "name": "Mary Johnson", "title": "CTO", "department": "Technology", "salary": 140000},
    {"id": 3, "name": "Robert Brown", "title": "CFO", "department": "Finance", "salary": 135000}
  ]'::jsonb
);

-- 2. Get the data as a JSON array
SELECT get_temp_table_as_json_array('public', 'temp_employees');

-- 3. Use the data in a Cypher query with parameters
-- In TypeScript:
const jsonArray = await queryExecutor.executeSQL(`
  SELECT get_temp_table_as_json_array('${TEST_SCHEMA}', 'temp_employees')
`);
const employeeData = jsonArray.rows[0].get_temp_table_as_json_array;

// Then use the data in a parameterized Cypher query
for (const employee of employeeData) {
  await queryExecutor.executeCypher(`
    CREATE (e:Employee {
      id: $id,
      name: $name,
      title: $title,
      department: $department,
      salary: $salary
    })
    RETURN count(*) AS created_employees
  `, {
    id: employee.id,
    name: employee.name,
    title: employee.title,
    department: employee.department,
    salary: employee.salary
  }, 'my_graph');
}
*/
