#!/bin/bash

# Script to test edge cases for the batch loader functions
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

# Clean up any existing test data
echo "Cleaning up existing test data"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  DELETE FROM age_schema_client.age_params
  WHERE key LIKE 'vertex_Test%' OR key LIKE 'edge_Test%';
"

# Test case 1: Empty array
echo "Test case 1: Empty array"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;

  -- Insert empty array
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES ('vertex_TestEmpty', '[]'::jsonb), ('edge_TestEmpty', '[]'::jsonb);

  -- Test with empty array
  SELECT * FROM age_schema_client.get_vertices('\"TestEmpty\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"TestEmpty\"'::ag_catalog.agtype);
"

# Test case 2: Large array
echo "Test case 2: Large array"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;

  -- Create a large array with 1000 elements
  WITH large_array AS (
    SELECT json_build_array(
      json_build_object('id', i::text, 'name', 'Test ' || i::text, 'value', i)
    ) AS item
    FROM generate_series(1, 1000) AS i
  )
  INSERT INTO age_schema_client.age_params (key, value)
  SELECT 'vertex_TestLarge', jsonb_agg(item) FROM large_array;

  -- Test with large array
  SELECT jsonb_array_length(value) FROM age_schema_client.age_params WHERE key = 'vertex_TestLarge';
  SELECT age_schema_client.get_array_length('\"TestLarge\"'::ag_catalog.agtype, false) AS array_length;
"

# Test case 3: Special characters in type names
echo "Test case 3: Special characters in type names"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;

  -- Insert data with special characters in type names
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES
    ('vertex_Test-With-Hyphens', '[{\"id\": \"1\", \"name\": \"Test\"}]'::jsonb),
    ('vertex_Test_With_Underscores', '[{\"id\": \"2\", \"name\": \"Test\"}]'::jsonb),
    ('vertex_Test.With.Dots', '[{\"id\": \"3\", \"name\": \"Test\"}]'::jsonb),
    ('edge_Test-With-Hyphens', '[{\"from\": \"1\", \"to\": \"2\"}]'::jsonb),
    ('edge_Test_With_Underscores', '[{\"from\": \"2\", \"to\": \"3\"}]'::jsonb),
    ('edge_Test.With.Dots', '[{\"from\": \"3\", \"to\": \"1\"}]'::jsonb);

  -- Test with special characters in type names
  SELECT * FROM age_schema_client.get_vertices('\"Test-With-Hyphens\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_vertices('\"Test_With_Underscores\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_vertices('\"Test.With.Dots\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"Test-With-Hyphens\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"Test_With_Underscores\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"Test.With.Dots\"'::ag_catalog.agtype);
"

# Test case 4: Unicode characters in data
echo "Test case 4: Unicode characters in data"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;

  -- Insert data with Unicode characters
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES
    ('vertex_TestUnicode', '[
      {\"id\": \"1\", \"name\": \"Café\", \"description\": \"Résumé\"},
      {\"id\": \"2\", \"name\": \"你好\", \"description\": \"世界\"},
      {\"id\": \"3\", \"name\": \"🚀\", \"description\": \"👍\"}
    ]'::jsonb),
    ('edge_TestUnicode', '[
      {\"from\": \"1\", \"to\": \"2\", \"label\": \"Café\"},
      {\"from\": \"2\", \"to\": \"3\", \"label\": \"你好\"},
      {\"from\": \"3\", \"to\": \"1\", \"label\": \"🚀\"}
    ]'::jsonb);

  -- Test with Unicode characters in data
  SELECT * FROM age_schema_client.get_vertices('\"TestUnicode\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"TestUnicode\"'::ag_catalog.agtype);
"

# Test case 5: Nested objects and arrays
echo "Test case 5: Nested objects and arrays"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;

  -- Insert data with nested objects and arrays
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES
    ('vertex_TestNested', '[
      {
        \"id\": \"1\",
        \"name\": \"Test\",
        \"metadata\": {
          \"created\": \"2023-01-01\",
          \"tags\": [\"tag1\", \"tag2\", \"tag3\"],
          \"stats\": {
            \"views\": 100,
            \"likes\": 50
          }
        },
        \"items\": [
          {\"id\": \"a\", \"value\": 1},
          {\"id\": \"b\", \"value\": 2},
          {\"id\": \"c\", \"value\": 3}
        ]
      }
    ]'::jsonb),
    ('edge_TestNested', '[
      {
        \"from\": \"1\",
        \"to\": \"2\",
        \"metadata\": {
          \"created\": \"2023-01-01\",
          \"tags\": [\"tag1\", \"tag2\", \"tag3\"],
          \"stats\": {
            \"weight\": 0.5,
            \"strength\": 0.8
          }
        }
      }
    ]'::jsonb);

  -- Test with nested objects and arrays
  SELECT * FROM age_schema_client.get_vertices('\"TestNested\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_edges('\"TestNested\"'::ag_catalog.agtype);
"

echo "Tests completed"
