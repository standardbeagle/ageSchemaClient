-- Set the search path for the current session
SET search_path = ag_catalog, "$user", public;

-- Test a simple query
SELECT 1 AS test;
