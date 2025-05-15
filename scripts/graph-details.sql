-- Get detailed information about a specific Apache AGE graph
-- Usage: Run this script with a graph name parameter
-- Example: psql -v graph_name="'test_graph'" -f graph-details.sql

-- Set the search path to include ag_catalog
SET search_path = ag_catalog, "$user", public;

-- Check if the graph exists
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = :'graph_name')
        THEN 'Graph ' || :'graph_name' || ' exists'
        ELSE 'Graph ' || :'graph_name' || ' does not exist'
    END AS graph_status;

-- Get basic graph information
SELECT
    name AS graph_name,
    namespace::text AS schema_name,
    graphid AS graph_id
FROM
    ag_catalog.ag_graph
WHERE
    name = :'graph_name';

-- List all labels defined for the graph
SELECT
    l.name AS label_name,
    CASE
        WHEN l.kind = 'v' THEN 'Vertex'
        WHEN l.kind = 'e' THEN 'Edge'
        ELSE l.kind::text
    END AS label_type,
    l.id AS label_id
FROM
    ag_catalog.ag_graph g
JOIN
    ag_catalog.ag_label l ON l.graph = g.graphid
WHERE
    g.name = :'graph_name'
ORDER BY
    l.kind, l.name;

-- Count vertices by label
SELECT
    'MATCH (n:' || l.name || ') RETURN count(n) AS count' AS cypher_query
FROM
    ag_catalog.ag_graph g
JOIN
    ag_catalog.ag_label l ON l.graph = g.graphid
WHERE
    g.name = :'graph_name' AND l.kind = 'v' AND l.name NOT LIKE '\_%'
ORDER BY
    l.name;

-- Note: To execute the above Cypher queries, you would need to run them individually
-- For example:
-- SELECT * FROM ag_catalog.cypher('test_graph', 'MATCH (n:Person) RETURN count(n) AS count') as (count bigint);
