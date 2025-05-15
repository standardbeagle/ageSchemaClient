-- Test complex Cypher query with proper return types
LOAD 'age';
SELECT * FROM ag_catalog.cypher('test_graph', $$ 
  MATCH (p:Person)-[r:WORKS_IN]->(d:Department) 
  RETURN p.name AS name, d.name AS department, r.role AS role 
$$) as (name text, department text, role text);
