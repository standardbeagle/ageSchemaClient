-- SQL functions for working with the age_params temporary table
-- These functions are used to retrieve parameters from the age_params table
-- for use in Cypher queries.

-- Function to retrieve a single parameter from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_age_param(param_key text)
RETURNS ag_catalog.agtype AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- Get the parameter value
  SELECT value INTO result_json
  FROM age_params
  WHERE key = param_key;
  
  -- Return null if the parameter doesn't exist
  IF result_json IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return as agtype
  RETURN result_json::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;

-- Function to retrieve all parameters from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_all_age_params()
RETURNS ag_catalog.agtype AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- Use jsonb_object_agg to convert rows to a single JSONB object
  SELECT jsonb_object_agg(key, value)
  INTO result_json
  FROM age_params;
  
  -- Return empty object if no parameters exist
  IF result_json IS NULL THEN
    RETURN '{}'::text::ag_catalog.agtype;
  END IF;
  
  -- Return as agtype
  RETURN result_json::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;
