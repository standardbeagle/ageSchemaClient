/**
 * PostgreSQL functions for retrieving vertex and edge data from the age_params temporary table
 * 
 * These functions allow retrieving vertex and edge data by type from the age_params table
 * and returning them as ag_catalog.agtype arrays for use with UNWIND in Cypher queries.
 * 
 * The functions accept ag_catalog.agtype parameters for Cypher compatibility and
 * return ag_catalog.agtype arrays that can be used with UNWIND in Cypher queries.
 */

-- Function to retrieve vertex data by type from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_vertices(vertex_type ag_catalog.agtype)
RETURNS ag_catalog.agtype AS $$
DECLARE
  vertex_type_text TEXT;
  result_array JSONB;
BEGIN
  -- Extract the text value from the agtype parameter
  SELECT vertex_type::text INTO vertex_type_text;
  
  -- Remove quotes if present
  vertex_type_text := REPLACE(REPLACE(vertex_type_text, '"', ''), '''', '');

  -- Get the data for the specified vertex type
  SELECT value
  INTO result_array
  FROM age_params
  WHERE key = 'vertex_' || vertex_type_text;

  -- Return null if no data found
  IF result_array IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return as agtype
  RETURN result_array::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;

-- Function to retrieve edge data by type from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_edges(edge_type ag_catalog.agtype)
RETURNS ag_catalog.agtype AS $$
DECLARE
  edge_type_text TEXT;
  result_array JSONB;
BEGIN
  -- Extract the text value from the agtype parameter
  SELECT edge_type::text INTO edge_type_text;
  
  -- Remove quotes if present
  edge_type_text := REPLACE(REPLACE(edge_type_text, '"', ''), '''', '');

  -- Get the data for the specified edge type
  SELECT value
  INTO result_array
  FROM age_params
  WHERE key = 'edge_' || edge_type_text;

  -- Return null if no data found
  IF result_array IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return as agtype
  RETURN result_array::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;
