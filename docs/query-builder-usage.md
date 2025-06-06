# Query Builder Usage Guide

This document provides guidance on how to properly use the QueryBuilder with Apache AGE.

## Common Issues with Apache AGE

When working with Apache AGE, there are several common issues that can occur:

1. **Return row and column definition list do not match**: This error occurs when the Cypher query returns data in a format that PostgreSQL cannot handle directly.

2. **Cannot extract elements from an object**: This error occurs when trying to use UNWIND with an object instead of an array.

3. **Property access syntax**: In Apache AGE, properties must be accessed using the `.properties` syntax (e.g., `m.properties.title` instead of `m.title`).

## Best Practices for Using QueryBuilder with Apache AGE

### 1. Use PostgreSQL Functions for Data Conversion

The most reliable way to work with Apache AGE is to create PostgreSQL functions that handle the data conversion between Apache AGE and your application. Here's an example:

```sql
CREATE OR REPLACE FUNCTION my_schema.get_movies()
RETURNS TABLE(id int, title text, year int, genre text, rating float) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (m.properties->>'id')::int AS id,
    (m.properties->>'title')::text AS title,
    (m.properties->>'year')::int AS year,
    (m.properties->>'genre')::text AS genre,
    (m.properties->>'rating')::float AS rating
  FROM (
    SELECT (m).properties AS m
    FROM (
      SELECT m
      FROM ag_catalog.cypher('my_graph', $$
        MATCH (m:Movie)
        RETURN m
      $$) AS (m ag_catalog.agtype)
    ) AS cypher_result
  ) AS movie_data;
END;
$$ LANGUAGE plpgsql;
```

Then you can call this function from your application:

```typescript
const result = await queryExecutor.executeSQL(`SELECT * FROM my_schema.get_movies()`);
```

### 2. Use UNWIND with Function Return Values for Parameterized Queries

When you need to pass parameters to a Cypher query, use a PostgreSQL function that returns the parameters as an `ag_catalog.agtype` and then use UNWIND in your Cypher query:

```sql
CREATE OR REPLACE FUNCTION my_schema.get_movie_params(title_param text, year_param int)
RETURNS ag_catalog.agtype AS $$
BEGIN
  RETURN ('{"title": "' || title_param || '", "year": ' || year_param || '}')::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;
```

Then use UNWIND in your Cypher query:

```sql
UNWIND my_schema.get_movie_params('The Matrix', 1999) AS params
MATCH (m:Movie)
WHERE m.properties.title = params.title AND m.properties.year = params.year
RETURN m
```

### 3. Use Fully Qualified Names

Always use fully qualified names for all entities in your Cypher queries:

```sql
MATCH (m:Movie)
WHERE m.properties.year = 1999
RETURN m.properties.title AS title, m.properties.rating AS rating
```

### 4. Handle Arrays of Objects

When working with arrays of objects, create a function that returns the array as an `ag_catalog.agtype`:

```sql
CREATE OR REPLACE FUNCTION my_schema.get_movies_array()
RETURNS ag_catalog.agtype AS $$
BEGIN
  RETURN '[
    {"id": 1, "title": "The Matrix", "year": 1999},
    {"id": 2, "title": "Inception", "year": 2010},
    {"id": 3, "title": "Interstellar", "year": 2014}
  ]'::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;
```

Then use UNWIND in your Cypher query:

```sql
UNWIND my_schema.get_movies_array() AS movie
CREATE (m:Movie {
  id: movie.id,
  title: movie.title,
  year: movie.year
})
RETURN count(*) AS created
```

### 5. Use the Correct Data Types

When working with Apache AGE, make sure to use the correct data types:

- Use `ag_catalog.agtype` for AGE data
- Use `::text`, `::int`, `::float`, etc. for converting AGE data to PostgreSQL data types

## Example: Complete Query Builder Usage

Here's a complete example of how to use the QueryBuilder with Apache AGE:

1. Create a function to return movie data:

```sql
CREATE OR REPLACE FUNCTION my_schema.get_movies_by_year(year_param int)
RETURNS TABLE(id int, title text, genre text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (m.properties->>'id')::int AS id,
    (m.properties->>'title')::text AS title,
    (m.properties->>'genre')::text AS genre
  FROM (
    SELECT (m).properties AS m
    FROM (
      SELECT m
      FROM ag_catalog.cypher('my_graph', $$
        MATCH (m:Movie)
        WHERE m.properties.year = $$ || year_param || $$
        RETURN m
      $$) AS (m ag_catalog.agtype)
    ) AS cypher_result
  ) AS movie_data;
END;
$$ LANGUAGE plpgsql;
```

2. Call the function from your application:

```typescript
const result = await queryExecutor.executeSQL(`SELECT * FROM my_schema.get_movies_by_year(1999)`);
```

3. Process the results:

```typescript
const movies = result.rows.map(row => ({
  id: row.id,
  title: row.title,
  genre: row.genre
}));
```

## Conclusion

Working with Apache AGE requires a different approach than working with other graph databases. By following these best practices, you can avoid common issues and build reliable applications with Apache AGE.
