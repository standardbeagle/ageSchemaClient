-- Fix permissions for the Apache AGE extension
-- This script grants the necessary permissions to use the AGE extension
-- Run this script as a superuser (postgres)

-- Set the search path
SET search_path = ag_catalog, "$user", public;

-- Grant usage on the ag_catalog schema to the age user
GRANT USAGE ON SCHEMA ag_catalog TO age;

-- Grant execute permission on all functions in the ag_catalog schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ag_catalog TO age;

-- Grant all privileges on all tables in the ag_catalog schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ag_catalog TO age;

-- Grant all privileges on all sequences in the ag_catalog schema
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ag_catalog TO age;

-- Grant all privileges on the ag_graph table
GRANT ALL PRIVILEGES ON TABLE ag_catalog.ag_graph TO age;

-- Grant all privileges on the ag_label table
GRANT ALL PRIVILEGES ON TABLE ag_catalog.ag_label TO age;

-- Allow the age user to load the age library
ALTER USER age WITH superuser;

-- Verify the permissions
SELECT 
    r.rolname, 
    n.nspname, 
    pg_catalog.has_schema_privilege(r.rolname, n.nspname, 'USAGE') AS has_usage
FROM 
    pg_catalog.pg_roles r,
    pg_catalog.pg_namespace n
WHERE 
    r.rolname = 'age' AND n.nspname = 'ag_catalog';

-- Show the current user
SELECT current_user;

-- Note: After running this script, you may need to reconnect to the database
-- for the changes to take effect.
