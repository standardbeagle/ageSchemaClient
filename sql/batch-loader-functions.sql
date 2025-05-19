/**
 * PostgreSQL functions for batch loading data into Apache AGE
 *
 * These functions are used to retrieve vertex and edge data from the age_params
 * temporary table for use with UNWIND in Cypher queries.
 *
 * The functions are:
 * - age_schema_client.get_vertices(vertex_type ag_catalog.agtype): Retrieves vertex data by type
 * - age_schema_client.get_edges(edge_type ag_catalog.agtype): Retrieves edge data by type
 * - age_schema_client.get_array_length(vertex_or_edge_type ag_catalog.agtype, is_edge boolean): Returns the length of the array for the specified type
 *
 * The get_vertices and get_edges functions accept an ag_catalog.agtype parameter, extract the text value,
 * query the age_params table for the corresponding data, and return the data
 * as ag_catalog.agtype for use with UNWIND in Cypher.
 *
 * The get_array_length function is a utility function that returns the length of the array
 * for the specified vertex or edge type.
 */

-- Create the age_schema_client schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS age_schema_client;

-- Create the age_params table if it doesn't exist
CREATE TABLE IF NOT EXISTS age_schema_client.age_params (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Function to retrieve vertex data by type from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_vertices(vertex_type ag_catalog.agtype)
RETURNS ag_catalog.agtype AS $$
DECLARE
  vertex_type_text TEXT;
  result_array JSONB;
  param_key TEXT;
BEGIN
  -- Validate input parameter
  IF vertex_type IS NULL THEN
    RAISE NOTICE 'get_vertices: vertex_type parameter cannot be NULL';
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END IF;

  -- Extract the text value from the agtype parameter
  BEGIN
    SELECT vertex_type::text INTO vertex_type_text;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_vertices: Error converting vertex_type to text: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;

  -- Remove quotes if present
  vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

  -- Validate vertex type text
  IF vertex_type_text IS NULL OR vertex_type_text = '' THEN
    RAISE NOTICE 'get_vertices: Empty vertex type provided';
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END IF;

  -- Construct parameter key
  param_key := 'vertex_' || vertex_type_text;

  -- Get the data for the specified vertex type and convert to ag_catalog.agtype
  BEGIN
    SELECT value
    INTO result_array
    FROM age_schema_client.age_params
    WHERE key = param_key;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'get_vertices: age_params table does not exist';
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
    WHEN others THEN
      RAISE NOTICE 'get_vertices: Error querying age_params table: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;

  -- Return empty array if no data found
  IF result_array IS NULL THEN
    RAISE NOTICE 'get_vertices: No data found for vertex type "%"', vertex_type_text;
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END IF;

  -- Validate result is a valid JSON array
  BEGIN
    IF jsonb_typeof(result_array) != 'array' THEN
      RAISE NOTICE 'get_vertices: Data for vertex type "%" is not a valid array', vertex_type_text;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_vertices: Error validating result array: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;

  -- Return as agtype
  BEGIN
    RETURN result_array::text::ag_catalog.agtype;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_vertices: Error converting result to agtype: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;
EXCEPTION
  WHEN others THEN
    -- Log the error
    RAISE NOTICE 'Unhandled error in get_vertices: %', SQLERRM;
    -- Return empty array on error
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;

-- Function to retrieve edge data by type from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_edges(edge_type ag_catalog.agtype)
RETURNS ag_catalog.agtype AS $$
DECLARE
  edge_type_text TEXT;
  result_array JSONB;
  param_key TEXT;
BEGIN
  -- Validate input parameter
  IF edge_type IS NULL THEN
    RAISE NOTICE 'get_edges: edge_type parameter cannot be NULL';
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END IF;

  -- Extract the text value from the agtype parameter
  BEGIN
    SELECT edge_type::text INTO edge_type_text;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_edges: Error converting edge_type to text: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;

  -- Remove quotes if present
  edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

  -- Validate edge type text
  IF edge_type_text IS NULL OR edge_type_text = '' THEN
    RAISE NOTICE 'get_edges: Empty edge type provided';
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END IF;

  -- Construct parameter key
  param_key := 'edge_' || edge_type_text;

  -- Get the data for the specified edge type and convert to ag_catalog.agtype
  BEGIN
    SELECT value
    INTO result_array
    FROM age_schema_client.age_params
    WHERE key = param_key;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'get_edges: age_params table does not exist';
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
    WHEN others THEN
      RAISE NOTICE 'get_edges: Error querying age_params table: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;

  -- Return empty array if no data found
  IF result_array IS NULL THEN
    RAISE NOTICE 'get_edges: No data found for edge type "%"', edge_type_text;
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END IF;

  -- Validate result is a valid JSON array
  BEGIN
    IF jsonb_typeof(result_array) != 'array' THEN
      RAISE NOTICE 'get_edges: Data for edge type "%" is not a valid array', edge_type_text;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_edges: Error validating result array: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;

  -- Return as agtype
  BEGIN
    RETURN result_array::text::ag_catalog.agtype;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_edges: Error converting result to agtype: %', SQLERRM;
      RETURN '[]'::jsonb::text::ag_catalog.agtype;
  END;
EXCEPTION
  WHEN others THEN
    -- Log the error
    RAISE NOTICE 'Unhandled error in get_edges: %', SQLERRM;
    -- Return empty array on error
    RETURN '[]'::jsonb::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;

-- Function to get the length of the array for a vertex or edge type
CREATE OR REPLACE FUNCTION age_schema_client.get_array_length(type_name ag_catalog.agtype, is_edge boolean DEFAULT false)
RETURNS integer AS $$
DECLARE
  type_text TEXT;
  param_key TEXT;
  result_array JSONB;
  array_length INTEGER;
BEGIN
  -- Validate input parameter
  IF type_name IS NULL THEN
    RAISE NOTICE 'get_array_length: type_name parameter cannot be NULL';
    RETURN 0;
  END IF;

  -- Extract the text value from the agtype parameter
  BEGIN
    SELECT type_name::text INTO type_text;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_array_length: Error converting type_name to text: %', SQLERRM;
      RETURN 0;
  END;

  -- Remove quotes if present
  type_text := REPLACE(REPLACE(type_text, '"', ''), '''', '');

  -- Validate type text
  IF type_text IS NULL OR type_text = '' THEN
    RAISE NOTICE 'get_array_length: Empty type name provided';
    RETURN 0;
  END IF;

  -- Construct parameter key
  IF is_edge THEN
    param_key := 'edge_' || type_text;
  ELSE
    param_key := 'vertex_' || type_text;
  END IF;

  -- Get the data for the specified type
  BEGIN
    SELECT value
    INTO result_array
    FROM age_schema_client.age_params
    WHERE key = param_key;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'get_array_length: age_params table does not exist';
      RETURN 0;
    WHEN others THEN
      RAISE NOTICE 'get_array_length: Error querying age_params table: %', SQLERRM;
      RETURN 0;
  END;

  -- Return 0 if no data found
  IF result_array IS NULL THEN
    RAISE NOTICE 'get_array_length: No data found for type "%"', type_text;
    RETURN 0;
  END IF;

  -- Validate result is a valid JSON array
  BEGIN
    IF jsonb_typeof(result_array) != 'array' THEN
      RAISE NOTICE 'get_array_length: Data for type "%" is not a valid array', type_text;
      RETURN 0;
    END IF;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_array_length: Error validating result array: %', SQLERRM;
      RETURN 0;
  END;

  -- Get the array length
  BEGIN
    SELECT jsonb_array_length(result_array) INTO array_length;
    RETURN array_length;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'get_array_length: Error getting array length: %', SQLERRM;
      RETURN 0;
  END;
EXCEPTION
  WHEN others THEN
    -- Log the error
    RAISE NOTICE 'Unhandled error in get_array_length: %', SQLERRM;
    -- Return 0 on error
    RETURN 0;
END;
$$ LANGUAGE plpgsql;