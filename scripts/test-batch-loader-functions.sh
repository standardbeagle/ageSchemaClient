#!/bin/bash

# Script to test the batch loader functions in the PostgreSQL database
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

# Create a test graph if it doesn't exist
echo "Creating test graph if it doesn't exist"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Create test graph if it doesn't exist
  SELECT * FROM ag_catalog.create_graph('test_batch_loader_graph');
"

# Create test data in the age_params table
echo "Creating test data in the age_params table"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Insert test vertex data
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES
    ('vertex_Person', '[
      { \"id\": \"1\", \"name\": \"Alice\", \"age\": 30 },
      { \"id\": \"2\", \"name\": \"Bob\", \"age\": 25 }
    ]'::jsonb),
    ('vertex_Company', '[
      { \"id\": \"3\", \"name\": \"Acme Inc.\", \"founded\": 1990 }
    ]'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  -- Insert test edge data
  INSERT INTO age_schema_client.age_params (key, value)
  VALUES
    ('edge_WORKS_AT', '[
      { \"from\": \"1\", \"to\": \"3\", \"since\": 2015, \"position\": \"Manager\" },
      { \"from\": \"2\", \"to\": \"3\", \"since\": 2018, \"position\": \"Developer\" }
    ]'::jsonb)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
"

# Test the get_vertices function
echo "Testing the get_vertices function"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test get_vertices function
  SELECT * FROM age_schema_client.get_vertices('\"Person\"'::ag_catalog.agtype);
  SELECT * FROM age_schema_client.get_vertices('\"Company\"'::ag_catalog.agtype);
  -- Test with non-existent vertex type
  SELECT * FROM age_schema_client.get_vertices('\"NonExistentType\"'::ag_catalog.agtype);
"

# Test the get_edges function
echo "Testing the get_edges function"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test get_edges function
  SELECT * FROM age_schema_client.get_edges('\"WORKS_AT\"'::ag_catalog.agtype);
  -- Test with non-existent edge type
  SELECT * FROM age_schema_client.get_edges('\"NON_EXISTENT_EDGE\"'::ag_catalog.agtype);
"

# Test using the functions with UNWIND in Cypher
echo "Testing the functions with UNWIND in Cypher"
psql -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -U "$PGUSER" -c "
  -- Load AGE extension
  LOAD 'age';
  -- Set search path
  SET search_path = ag_catalog, '\$user', public;
  -- Test with UNWIND in Cypher
  SELECT * FROM cypher('test_batch_loader_graph', $$
    UNWIND age_schema_client.get_vertices(\\\"Person\\\"::ag_catalog.agtype) AS person
    RETURN person.id AS id, person.name AS name, person.age AS age
    ORDER BY person.id
  $$) AS (id agtype, name agtype, age agtype);
"

echo "Tests completed"
