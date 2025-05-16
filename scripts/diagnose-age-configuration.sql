-- Comprehensive Apache AGE Configuration Diagnostic Script
-- This script performs detailed checks on Apache AGE configuration and provides specific error diagnostics

-- Step 1: Check if the AGE extension is installed in the database
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS: Apache AGE extension is installed'
        ELSE 'FAIL: Apache AGE extension is not installed. Run CREATE EXTENSION age;'
    END AS extension_check
FROM 
    pg_catalog.pg_extension 
WHERE 
    extname = 'age';

-- Step 2: Check AGE extension details if installed
SELECT 
    e.extname AS extension_name,
    e.extversion AS version,
    n.nspname AS schema,
    c.description AS description,
    'This shows the installed AGE version and schema. If missing, the extension is not installed.' AS diagnostic_note
FROM 
    pg_catalog.pg_extension e
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
    LEFT JOIN pg_catalog.pg_description c ON c.objoid = e.oid
WHERE 
    e.extname = 'age';

-- Step 3: Check if ag_catalog schema exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS: ag_catalog schema exists'
        ELSE 'FAIL: ag_catalog schema does not exist. The AGE extension may not be properly installed.'
    END AS schema_check
FROM 
    pg_catalog.pg_namespace 
WHERE 
    nspname = 'ag_catalog';

-- Step 4: Check if the current user has access to the ag_catalog schema
SELECT 
    current_user AS username,
    n.nspname AS schema_name,
    CASE 
        WHEN pg_catalog.has_schema_privilege(current_user, n.nspname, 'USAGE') THEN 'PASS: User has USAGE privilege on ag_catalog'
        ELSE 'FAIL: User lacks USAGE privilege on ag_catalog. Run: GRANT USAGE ON SCHEMA ag_catalog TO ' || current_user || ';'
    END AS privilege_check
FROM 
    pg_catalog.pg_namespace n
WHERE 
    n.nspname = 'ag_catalog';

-- Step 5: Check if the current user has execute privileges on key AGE functions
SELECT 
    p.proname AS function_name,
    CASE 
        WHEN pg_catalog.has_function_privilege(current_user, p.oid, 'EXECUTE') THEN 'PASS: User has EXECUTE privilege'
        ELSE 'FAIL: User lacks EXECUTE privilege on ' || p.proname || '. Run: GRANT EXECUTE ON FUNCTION ag_catalog.' || p.proname || ' TO ' || current_user || ';'
    END AS privilege_check
FROM 
    pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'ag_catalog' AND 
    p.proname IN ('cypher', 'create_graph', 'drop_graph');

-- Step 6: Check if the current user has privileges on the ag_graph table
SELECT 
    c.relname AS table_name,
    CASE 
        WHEN pg_catalog.has_table_privilege(current_user, c.oid, 'SELECT') THEN 'PASS: User has SELECT privilege'
        ELSE 'FAIL: User lacks SELECT privilege on ag_graph. Run: GRANT SELECT ON TABLE ag_catalog.ag_graph TO ' || current_user || ';'
    END AS select_check,
    CASE 
        WHEN pg_catalog.has_table_privilege(current_user, c.oid, 'INSERT') THEN 'PASS: User has INSERT privilege'
        ELSE 'FAIL: User lacks INSERT privilege on ag_graph. Run: GRANT INSERT ON TABLE ag_catalog.ag_graph TO ' || current_user || ';'
    END AS insert_check
FROM 
    pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'ag_catalog' AND c.relname = 'ag_graph';

-- Step 7: Check if the current user is a superuser (not required but helpful to know)
SELECT 
    current_user AS username,
    CASE 
        WHEN usesuper THEN 'INFO: User is a superuser (has all privileges)'
        ELSE 'INFO: User is not a superuser (specific privileges must be granted)'
    END AS superuser_check
FROM 
    pg_catalog.pg_user
WHERE 
    usename = current_user;

-- Step 8: Check if search_path includes ag_catalog
SELECT 
    current_setting('search_path') AS current_search_path,
    CASE 
        WHEN current_setting('search_path') LIKE '%ag_catalog%' THEN 'PASS: search_path includes ag_catalog'
        ELSE 'FAIL: search_path does not include ag_catalog. Run: SET search_path TO ag_catalog, "$user", public;'
    END AS search_path_check;

-- Step 9: Try to load the AGE extension explicitly
DO $$
BEGIN
    RAISE NOTICE 'Attempting to load AGE extension with LOAD ''age''...';
    EXECUTE 'LOAD ''age''';
    RAISE NOTICE 'SUCCESS: AGE extension loaded successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAIL: Error loading AGE extension: %', SQLERRM;
        RAISE NOTICE 'This may indicate the extension is not properly installed or the shared library is not in the PostgreSQL library path.';
END $$;

-- Step 10: Try to create and drop a test graph
DO $$
BEGIN
    RAISE NOTICE 'Attempting to create a test graph...';
    PERFORM ag_catalog.create_graph('test_diagnostic_graph');
    RAISE NOTICE 'SUCCESS: Test graph created successfully';
    
    RAISE NOTICE 'Attempting to drop the test graph...';
    PERFORM ag_catalog.drop_graph('test_diagnostic_graph', true);
    RAISE NOTICE 'SUCCESS: Test graph dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAIL: Error during graph operations: %', SQLERRM;
        
        -- Provide specific diagnostics based on error message
        IF SQLERRM LIKE '%function ag_catalog.create_graph%' THEN
            RAISE NOTICE 'The create_graph function could not be found. This indicates the AGE extension is not properly loaded.';
            RAISE NOTICE 'Check that the extension is installed and that LOAD ''age'' has been executed.';
        ELSIF SQLERRM LIKE '%permission denied%' THEN
            RAISE NOTICE 'Permission denied. The current user does not have sufficient privileges.';
            RAISE NOTICE 'Grant the necessary privileges or connect as a superuser.';
        ELSIF SQLERRM LIKE '%out of memory%' THEN
            RAISE NOTICE 'PostgreSQL ran out of memory. Check your server configuration.';
        ELSE
            RAISE NOTICE 'Unknown error. Please check the PostgreSQL logs for more details.';
        END IF;
END $$;

-- Step 11: Check for common AGE configuration issues
DO $$
BEGIN
    RAISE NOTICE '--- Common Apache AGE Configuration Issues ---';
    
    -- Check if PostgreSQL version is compatible
    IF current_setting('server_version_num')::integer < 110000 THEN
        RAISE NOTICE 'WARNING: PostgreSQL version is below 11. Apache AGE requires PostgreSQL 11 or higher.';
    END IF;
    
    -- Check if shared_preload_libraries includes age
    BEGIN
        PERFORM current_setting('shared_preload_libraries');
        IF current_setting('shared_preload_libraries') NOT LIKE '%age%' THEN
            RAISE NOTICE 'WARNING: shared_preload_libraries does not include age. This is not required but recommended for optimal performance.';
            RAISE NOTICE 'Add age to shared_preload_libraries in postgresql.conf and restart the server.';
        ELSE
            RAISE NOTICE 'PASS: shared_preload_libraries includes age.';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'WARNING: Could not check shared_preload_libraries setting.';
    END;
    
    -- Provide summary of configuration status
    RAISE NOTICE '';
    RAISE NOTICE 'SUMMARY: If all checks passed, Apache AGE is properly configured.';
    RAISE NOTICE 'If any checks failed, follow the specific instructions provided.';
    RAISE NOTICE 'For more information, visit: https://github.com/apache/age';
END $$;
