#!/bin/bash

# Script to test the error handling in the batch loader functions
# This script uses the environment variables from .env.test by default

# Load environment variables from .env.test if not specified
ENV_FILE=${1:-".env.test"}
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "Environment file $ENV_FILE not found"
  exit 1
fi

# Check if required environment variables are set
if [ -z "$PGHOST" ] || [ -z "$PGPORT" ] || [ -z "$PGDATABASE" ] || [ -z "$PGUSER" ]; then
  echo "Required environment variables are not set"
  echo "Please set PGHOST, PGPORT, PGDATABASE, and PGUSER"
  exit 1
fi

# Export password for psql
export PGPASSWORD="$PGPASSWORD"

# Test NULL input
echo "Testing NULL input"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test with NULL input
  SELECT * FROM age_schema_client.get_vertices(NULL);
  SELECT * FROM age_schema_client.get_edges(NULL);
"

# Test invalid agtype input
echo "Testing invalid agtype input"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test with invalid agtype input
  SELECT * FROM age_schema_client.get_vertices('not_an_agtype');
  SELECT * FROM age_schema_client.get_edges('not_an_agtype');
"

# Test empty string input
echo "Testing empty string input"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test with empty string input
  SELECT * FROM age_schema_client.get_vertices('\"\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"\"'::ag_catalog.agtype);
"

# Test non-existent type
echo "Testing non-existent type"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test with non-existent type
  SELECT * FROM age_schema_client.get_vertices('\"NonExistentType\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"NonExistentEdge\"'::ag_catalog.agtype);
"

# Test with invalid JSON data
echo "Testing with invalid JSON data"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Insert invalid JSON data
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES 
    ('vertex_InvalidJSON', '{\"not_an_array\": true}'::jsonb),
    ('edge_InvalidJSON', '{\"not_an_array\": true}'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  
  -- Test with invalid JSON data
  SELECT * FROM age_schema_client.get_vertices('\"InvalidJSON\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"InvalidJSON\"'::ag_catalog.agtype);
"

echo "Tests completed"
