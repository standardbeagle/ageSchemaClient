-- Drop the extension if it exists
DROP EXTENSION IF EXISTS age CASCADE;

-- Create the extension
CREATE EXTENSION age;

-- Set the search path for the current session
SET search_path = ag_catalog, "$user", public;

-- Drop the graph if it exists
SELECT * FROM ag_catalog.drop_graph('test_graph', true);

-- Create the graph
SELECT * FROM ag_catalog.create_graph('test_graph');

-- Set the search path for the age user
ALTER USER age SET search_path = ag_catalog, "$user", public;

-- Grant all privileges on the ag_catalog schema to the age user
GRANT ALL PRIVILEGES ON SCHEMA ag_catalog TO age;

-- Grant all privileges on all tables in the ag_catalog schema to the age user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ag_catalog TO age;

-- Grant all privileges on all sequences in the ag_catalog schema to the age user
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ag_catalog TO age;

-- Grant all privileges on all functions in the ag_catalog schema to the age user
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA ag_catalog TO age;

-- Grant all privileges on all procedures in the ag_catalog schema to the age user
GRANT ALL PRIVILEGES ON ALL PROCEDURES IN SCHEMA ag_catalog TO age;

-- Create a simple test vertex
SELECT * FROM ag_catalog.cypher('test_graph', $$
  CREATE (n:Person {name: 'Test Person', age: 30})
  RETURN n
$$) as (v agtype);
