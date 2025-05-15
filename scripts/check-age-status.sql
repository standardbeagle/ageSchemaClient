-- Check the status of the Apache AGE extension
-- This script checks if the AGE extension is installed and accessible

-- Check if the AGE extension is installed
SELECT 
    e.extname AS extension_name,
    e.extversion AS version,
    n.nspname AS schema,
    c.description AS description
FROM 
    pg_catalog.pg_extension e
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
    LEFT JOIN pg_catalog.pg_description c ON c.objoid = e.oid
WHERE 
    e.extname = 'age';

-- Check if the current user has access to the ag_catalog schema
SELECT 
    current_user AS username,
    n.nspname AS schema_name,
    pg_catalog.has_schema_privilege(current_user, n.nspname, 'USAGE') AS has_usage_privilege
FROM 
    pg_catalog.pg_namespace n
WHERE 
    n.nspname = 'ag_catalog';

-- Check if the current user has execute privileges on the cypher function
SELECT 
    current_user AS username,
    p.proname AS function_name,
    pg_catalog.has_function_privilege(
        current_user, 
        p.oid, 
        'EXECUTE'
    ) AS has_execute_privilege
FROM 
    pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'ag_catalog' AND p.proname = 'cypher';

-- Check if the current user has privileges on the ag_graph table
SELECT 
    current_user AS username,
    c.relname AS table_name,
    pg_catalog.has_table_privilege(current_user, c.oid, 'SELECT') AS has_select_privilege,
    pg_catalog.has_table_privilege(current_user, c.oid, 'INSERT') AS has_insert_privilege,
    pg_catalog.has_table_privilege(current_user, c.oid, 'UPDATE') AS has_update_privilege,
    pg_catalog.has_table_privilege(current_user, c.oid, 'DELETE') AS has_delete_privilege
FROM 
    pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'ag_catalog' AND c.relname = 'ag_graph';

-- Check if the current user is a superuser
SELECT 
    current_user AS username,
    usesuper AS is_superuser
FROM 
    pg_catalog.pg_user
WHERE 
    usename = current_user;

-- Try to load the AGE extension
DO $$
BEGIN
    PERFORM ag_catalog.create_graph('test_check_graph');
    RAISE NOTICE 'Successfully created a test graph';
    PERFORM ag_catalog.drop_graph('test_check_graph', true);
    RAISE NOTICE 'Successfully dropped the test graph';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
