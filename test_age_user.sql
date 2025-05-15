-- Set the search path for the current session
SET search_path = ag_catalog, "$user", public;

-- Query the test vertex
SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (n:Person)
  RETURN n
$$) as (v  ag_catalog.agtype);
