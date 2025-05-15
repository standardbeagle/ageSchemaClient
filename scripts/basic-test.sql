-- Basic test SQL file
-- This file contains simple queries that should work on any PostgreSQL database with AGE installed

-- Show PostgreSQL version
SELECT version();

-- Check if AGE extension is installed
SELECT * FROM pg_available_extensions WHERE name = 'age';

-- List available schemas
SELECT nspname AS schema_name
FROM pg_catalog.pg_namespace
WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
ORDER BY schema_name;

-- Check if ag_catalog schema exists
SELECT EXISTS(
  SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'ag_catalog'
) AS ag_catalog_exists;

-- List AGE functions if ag_catalog exists
SELECT proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'ag_catalog'
ORDER BY proname
LIMIT 10;
