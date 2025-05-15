-- Test Cypher query to match Person nodes
LOAD 'age';
SELECT * FROM ag_catalog.cypher('test_graph', $$ MATCH (p:Person) RETURN p $$) as (p ag_catalog.agtype);
