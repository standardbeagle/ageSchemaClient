# Temporary Table Implementation Guide

This document provides a detailed guide for implementing the temporary table approach for parameter passing in Apache AGE Cypher queries.

## Overview

⚠️ **CRITICAL LIMITATION OF APACHE AGE** ⚠️

Apache AGE has a **SEVERE LIMITATION** that is often misunderstood and incorrectly documented online:

The third parameter of the `ag_catalog.cypher()` function:

- **ONLY** works with **STATIC LITERAL STRINGS** hardcoded in your SQL
- **DOES NOT WORK** with SQL parameters (`$1`, `$2`, etc.) even in prepared statements
- **DOES NOT WORK** with any form of dynamic values, even when properly escaped
- **DOES NOT WORK** with string concatenation or interpolation, even when sanitized
- **DOES NOT WORK** with parameter binding mechanisms from any language or ORM

**BEWARE OF MISLEADING EXAMPLES ONLINE** that suggest you can do:
```sql
SELECT * FROM ag_catalog.cypher('my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', $1)
```

**THIS WILL NOT WORK** regardless of how you pass `$1`. The third parameter is treated as a literal string, not as a parameter placeholder.

This is a fundamental limitation of Apache AGE's implementation, not a limitation of PostgreSQL or your programming language.

### The Only Safe Solution: Temporary Table Approach

To work around this critical limitation, we use a temporary table approach:

1. Store parameters in the `age_params` table
2. Create PostgreSQL functions that retrieve parameters from the table
3. Use these functions within Cypher queries with UNWIND

## Implementation Steps

### 1. Create the Parameter Table and Functions

First, ensure the `age_params` table and parameter retrieval functions exist:

```typescript
// Create the age_schema_client schema if it doesn't exist
await queryExecutor.executeSQL(`
  CREATE SCHEMA IF NOT EXISTS age_schema_client;
`);

// Create the age_params table if it doesn't exist
await queryExecutor.executeSQL(`
  CREATE TABLE IF NOT EXISTS age_params (
    key TEXT PRIMARY KEY,
    value JSONB
  );
`);

// Create the get_age_param function
await queryExecutor.executeSQL(`
  CREATE OR REPLACE FUNCTION age_schema_client.get_age_param(param_key ag_catalog.agtype)
  RETURNS ag_catalog.agtype AS $$
  DECLARE
    param_key_text TEXT;
    result_value JSONB;
  BEGIN
    -- Extract the text value from the agtype parameter
    SELECT param_key::text INTO param_key_text;

    -- Remove quotes if present
    param_key_text := REPLACE(REPLACE(param_key_text, '"', ''), '''', '');

    -- Get the data for the specified key
    SELECT value
    INTO result_value
    FROM age_params
    WHERE key = param_key_text;

    -- Return null if no data found
    IF result_value IS NULL THEN
      RETURN 'null'::jsonb::text::ag_catalog.agtype;
    END IF;

    -- Return as agtype
    RETURN result_value::text::ag_catalog.agtype;
  END;
  $$ LANGUAGE plpgsql;
`);

// Create the get_age_param_array function
await queryExecutor.executeSQL(`
  CREATE OR REPLACE FUNCTION age_schema_client.get_age_param_array(param_key ag_catalog.agtype)
  RETURNS SETOF ag_catalog.agtype AS $$
  DECLARE
    param_key_text TEXT;
    result_array JSONB;
    item_data JSONB;
  BEGIN
    -- Extract the text value from the agtype parameter
    SELECT param_key::text INTO param_key_text;

    -- Remove quotes if present
    param_key_text := REPLACE(REPLACE(param_key_text, '"', ''), '''', '');

    -- Get the data for the specified key
    SELECT value
    INTO result_array
    FROM age_params
    WHERE key = param_key_text;

    -- Return empty set if no data found
    IF result_array IS NULL THEN
      RETURN;
    END IF;

    -- Loop through the array and return each element
    FOR item_data IN SELECT * FROM jsonb_array_elements(result_array)
    LOOP
      RETURN NEXT item_data::text::ag_catalog.agtype;
    END LOOP;

    RETURN;
  END;
  $$ LANGUAGE plpgsql;
`);
```

### 2. Create Type-Specific Functions

For each vertex and edge type, create specific functions:

```typescript
// Create the get_person_vertices function
await queryExecutor.executeSQL(`
  CREATE OR REPLACE FUNCTION age_schema_client.get_person_vertices()
  RETURNS SETOF ag_catalog.agtype AS $$
  DECLARE
    result_array JSONB;
    vertex_data JSONB;
  BEGIN
    -- Get the data for Person vertices
    SELECT value
    INTO result_array
    FROM age_params
    WHERE key = 'vertex_Person';

    -- Return empty set if no data found
    IF result_array IS NULL THEN
      RETURN;
    END IF;

    -- Loop through the array and return each element
    FOR vertex_data IN SELECT * FROM jsonb_array_elements(result_array)
    LOOP
      RETURN NEXT vertex_data::text::ag_catalog.agtype;
    END LOOP;

    RETURN;
  END;
  $$ LANGUAGE plpgsql;
`);

// Create the get_works_in_edges function
await queryExecutor.executeSQL(`
  CREATE OR REPLACE FUNCTION age_schema_client.get_works_in_edges()
  RETURNS SETOF ag_catalog.agtype AS $$
  DECLARE
    result_array JSONB;
    edge_data JSONB;
  BEGIN
    -- Get the data for WORKS_IN edges
    SELECT value
    INTO result_array
    FROM age_params
    WHERE key = 'edge_WORKS_IN';

    -- Return empty set if no data found
    IF result_array IS NULL THEN
      RETURN;
    END IF;

    -- Loop through the array and return each element
    FOR edge_data IN SELECT * FROM jsonb_array_elements(result_array)
    LOOP
      RETURN NEXT edge_data::text::ag_catalog.agtype;
    END LOOP;

    RETURN;
  END;
  $$ LANGUAGE plpgsql;
`);
```

### 3. Store Parameters in the Table

Use parameterized SQL queries to store data in the `age_params` table:

```typescript
// Store vertex data
async function storeVertexData(vertexType: string, vertices: any[]): Promise<void> {
  await queryExecutor.executeSQL(`
    INSERT INTO age_params (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE
    SET value = $2;
  `, [`vertex_${vertexType}`, JSON.stringify(vertices)]);
}

// Store edge data
async function storeEdgeData(edgeType: string, edges: any[]): Promise<void> {
  await queryExecutor.executeSQL(`
    INSERT INTO age_params (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE
    SET value = $2;
  `, [`edge_${edgeType}`, JSON.stringify(edges)]);
}
```

### 4. Create Vertices Using UNWIND

Use the type-specific functions to create vertices:

```typescript
// Create Person vertices
const createPersonVerticesQuery = `
  UNWIND age_schema_client.get_person_vertices() AS vertex_data
  CREATE (v:Person {
    id: vertex_data.id,
    name: vertex_data.name,
    age: vertex_data.age,
    email: vertex_data.email
  })
  RETURN count(v) AS created_vertices
`;

const personResult = await queryExecutor.executeCypher(
  createPersonVerticesQuery,
  {}, // No parameters needed as data is in the temp table
  graphName
);
```

### 5. Create Edges Using UNWIND and MATCH

Use the type-specific functions to create edges:

```typescript
// Create WORKS_IN edges
const createWorksInEdgesQuery = `
  UNWIND age_schema_client.get_works_in_edges() AS edge_data
  MATCH (from:Person {id: edge_data.from})
  MATCH (to:Department {id: edge_data.to})
  CREATE (from)-[e:WORKS_IN {
    since: edge_data.since,
    role: edge_data.role
  }]->(to)
  RETURN count(e) AS created_edges
`;

const worksInResult = await queryExecutor.executeCypher(
  createWorksInEdgesQuery,
  {}, // No parameters needed as data is in the temp table
  graphName
);
```

### 6. Clean Up the Parameter Table

Always clean up the parameter table after use:

```typescript
// Clear all parameters
async function clearParams(): Promise<void> {
  await queryExecutor.executeSQL(`
    DELETE FROM age_params;
  `);
}
```

## Best Practices

1. **Always use parameterized SQL queries** to store data in the `age_params` table
2. **Create type-specific functions** for each vertex and edge type
3. **Use UNWIND with the parameter retrieval functions** in Cypher queries
4. **Use MATCH statements** to find vertices by ID properties when creating edges
5. **Always clean up** the parameter table after use
6. **Handle errors properly** and clean up the parameter table in finally blocks

## Example Implementation

Here's a complete example of creating vertices and edges using the temporary table approach:

```typescript
async function createGraphData(
  graphName: string,
  vertices: Record<string, any[]>,
  edges: Record<string, any[]>
): Promise<{ vertexCount: number, edgeCount: number }> {
  try {
    // 1. Create type-specific functions for each vertex and edge type
    for (const vertexType of Object.keys(vertices)) {
      await queryExecutor.executeSQL(`
        CREATE OR REPLACE FUNCTION age_schema_client.get_${vertexType.toLowerCase()}_vertices()
        RETURNS SETOF ag_catalog.agtype AS $$
        DECLARE
          result_array JSONB;
          vertex_data JSONB;
        BEGIN
          -- Get the data for ${vertexType} vertices
          SELECT value
          INTO result_array
          FROM age_params
          WHERE key = 'vertex_${vertexType}';

          -- Return empty set if no data found
          IF result_array IS NULL THEN
            RETURN;
          END IF;

          -- Loop through the array and return each element
          FOR vertex_data IN SELECT * FROM jsonb_array_elements(result_array)
          LOOP
            RETURN NEXT vertex_data::text::ag_catalog.agtype;
          END LOOP;

          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `);
    }

    for (const edgeType of Object.keys(edges)) {
      await queryExecutor.executeSQL(`
        CREATE OR REPLACE FUNCTION age_schema_client.get_${edgeType.toLowerCase()}_edges()
        RETURNS SETOF ag_catalog.agtype AS $$
        DECLARE
          result_array JSONB;
          edge_data JSONB;
        BEGIN
          -- Get the data for ${edgeType} edges
          SELECT value
          INTO result_array
          FROM age_params
          WHERE key = 'edge_${edgeType}';

          -- Return empty set if no data found
          IF result_array IS NULL THEN
            RETURN;
          END IF;

          -- Loop through the array and return each element
          FOR edge_data IN SELECT * FROM jsonb_array_elements(result_array)
          LOOP
            RETURN NEXT edge_data::text::ag_catalog.agtype;
          END LOOP;

          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `);
    }

    // 2. Store vertex data
    for (const [vertexType, vertexData] of Object.entries(vertices)) {
      await storeVertexData(vertexType, vertexData);
    }

    // 3. Create vertices
    let vertexCount = 0;
    for (const vertexType of Object.keys(vertices)) {
      const createVerticesQuery = `
        UNWIND age_schema_client.get_${vertexType.toLowerCase()}_vertices() AS vertex_data
        CREATE (v:${vertexType} {
          id: vertex_data.id,
          name: vertex_data.name
          -- Add other properties based on your schema
        })
        RETURN count(v) AS created_vertices
      `;

      const result = await queryExecutor.executeCypher(
        createVerticesQuery,
        {}, // No parameters needed as data is in the temp table
        graphName
      );

      vertexCount += parseInt(result.rows[0]?.created_vertices || '0', 10);
    }

    // 4. Store edge data
    for (const [edgeType, edgeData] of Object.entries(edges)) {
      await storeEdgeData(edgeType, edgeData);
    }

    // 5. Create edges
    let edgeCount = 0;
    for (const edgeType of Object.keys(edges)) {
      const createEdgesQuery = `
        UNWIND age_schema_client.get_${edgeType.toLowerCase()}_edges() AS edge_data
        MATCH (from {id: edge_data.from})
        MATCH (to {id: edge_data.to})
        CREATE (from)-[e:${edgeType} {
          -- Add edge properties based on your schema
          since: edge_data.since
        }]->(to)
        RETURN count(e) AS created_edges
      `;

      const result = await queryExecutor.executeCypher(
        createEdgesQuery,
        {}, // No parameters needed as data is in the temp table
        graphName
      );

      edgeCount += parseInt(result.rows[0]?.created_edges || '0', 10);
    }

    return { vertexCount, edgeCount };
  } finally {
    // 6. Clean up
    await clearParams();
  }
}
```

## Conclusion

The temporary table approach is the only secure and reliable way to pass parameters to Apache AGE Cypher queries. By following this guide, you can ensure that your implementation is secure against SQL injection and works correctly with Apache AGE.
