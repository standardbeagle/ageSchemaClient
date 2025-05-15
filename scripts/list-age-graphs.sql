-- List all Apache AGE graphs defined in the current database
-- This script queries the ag_catalog.ag_graph table to show all available graphs

-- Set the search path to include ag_catalog
SET search_path = ag_catalog, "$user", public;

-- List all graphs with their properties
SELECT
    name AS graph_name,
    namespace::text AS schema_name
FROM
    ag_catalog.ag_graph
ORDER BY
    name;

-- Show the number of graphs
SELECT
    COUNT(*) AS total_graphs
FROM
    ag_catalog.ag_graph;

-- List all graph schemas (another way to see available graphs)
SELECT
    nspname AS graph_schema_name
FROM
    pg_catalog.pg_namespace
WHERE
    nspname LIKE 'ag_graph_%' OR nspname IN (
        SELECT namespace::text FROM ag_catalog.ag_graph
    )
ORDER BY
    nspname;

-- List labels defined for each graph
SELECT
    g.name AS graph_name,
    l.name AS label_name,
    l.kind AS label_type
FROM
    ag_catalog.ag_graph g
JOIN
    ag_catalog.ag_label l ON l.graph = g.graphid
ORDER BY
    g.name, l.name;
