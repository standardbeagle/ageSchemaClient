-- Create a test graph with sample data for Apache AGE
-- This script creates a graph named 'test_graph' with Person and Department vertices

-- Set the search path to include ag_catalog
SET search_path = ag_catalog, "$user", public;

-- Drop the graph if it exists
SELECT * FROM ag_catalog.drop_graph('test_graph', true);

-- Create the graph
SELECT * FROM ag_catalog.create_graph('test_graph');

-- Create Person vertices
SELECT * FROM ag_catalog.cypher('test_graph', $$
  CREATE (p:Person {name: 'John Doe', age: 30, email: 'john@example.com'})
  RETURN p
$$) as (p  ag_catalog.agtype);

SELECT * FROM ag_catalog.cypher('test_graph', $$
  CREATE (p:Person {name: 'Jane Smith', age: 28, email: 'jane@example.com'})
  RETURN p
$$) as (p  ag_catalog.agtype);

SELECT * FROM ag_catalog.cypher('test_graph', $$
  CREATE (p:Person {name: 'Bob Johnson', age: 35, email: 'bob@example.com'})
  RETURN p
$$) as (p  ag_catalog.agtype);

-- Create Department vertices
SELECT * FROM ag_catalog.cypher('test_graph', $$
  CREATE (d:Department {name: 'Engineering', location: 'Building A'})
  RETURN d
$$) as (d  ag_catalog.agtype);

SELECT * FROM ag_catalog.cypher('test_graph', $$
  CREATE (d:Department {name: 'Marketing', location: 'Building B'})
  RETURN d
$$) as (d  ag_catalog.agtype);

-- Create WORKS_IN relationships
SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (p:Person {name: 'John Doe'}), (d:Department {name: 'Engineering'})
  CREATE (p)-[r:WORKS_IN {since: '2020-01-15', role: 'Developer'}]->(d)
  RETURN r
$$) as (r  ag_catalog.agtype);

SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (p:Person {name: 'Jane Smith'}), (d:Department {name: 'Marketing'})
  CREATE (p)-[r:WORKS_IN {since: '2019-05-20', role: 'Manager'}]->(d)
  RETURN r
$$) as (r  ag_catalog.agtype);

SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (p:Person {name: 'Bob Johnson'}), (d:Department {name: 'Engineering'})
  CREATE (p)-[r:WORKS_IN {since: '2021-03-10', role: 'Architect'}]->(d)
  RETURN r
$$) as (r  ag_catalog.agtype);

-- Create KNOWS relationships
SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (p1:Person {name: 'John Doe'}), (p2:Person {name: 'Jane Smith'})
  CREATE (p1)-[r:KNOWS {since: '2018-10-15'}]->(p2)
  RETURN r
$$) as (r  ag_catalog.agtype);

SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (p1:Person {name: 'John Doe'}), (p2:Person {name: 'Bob Johnson'})
  CREATE (p1)-[r:KNOWS {since: '2019-08-22'}]->(p2)
  RETURN r
$$) as (r  ag_catalog.agtype);

-- Verify the graph was created successfully
SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH (n)
  RETURN labels(n) as label, count(n) as count
$$) as (label  ag_catalog.agtype, count bigint);

-- Verify relationships were created
SELECT * FROM ag_catalog.cypher('test_graph', $$
  MATCH ()-[r]->()
  RETURN type(r) as relationship_type, count(r) as count
$$) as (relationship_type  ag_catalog.agtype, count bigint);
