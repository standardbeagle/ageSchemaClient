-- Test Cypher query
SELECT * FROM ag_catalog.cypher('test_graph', $$ RETURN 1 AS test $$) as (test ag_catalog.agtype);
