-- Test SQL file
-- This file contains a few simple queries to test the run-sql-file.sh script

-- Show PostgreSQL version
SELECT version();

-- Check if AGE extension is installed
SELECT * FROM pg_available_extensions WHERE name = 'age';

-- Check if the test_graph exists
SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (n:Person)
  RETURN count(n) as person_count
$$) as (person_count bigint);
