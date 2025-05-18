# Vertex and Edge Creator Implementation Guide

This guide provides detailed instructions for implementing secure and efficient vertex and edge creators for Apache AGE using the temporary table approach.

## Overview

The VertexCreator and EdgeCreator classes are responsible for creating vertices and edges in Apache AGE graph databases. Due to a **SEVERE LIMITATION** in Apache AGE's parameter handling, we must use a temporary table approach to pass parameters securely.

## Critical Apache AGE Limitation

⚠️ **CRITICAL WARNING** ⚠️

The third parameter of the `ag_catalog.cypher()` function has a **SEVERE LIMITATION** that is often misunderstood and incorrectly documented online:

- It **ONLY** works with **STATIC LITERAL STRINGS** hardcoded in your SQL
- It **DOES NOT WORK** with SQL parameters (`$1`, `$2`, etc.) even in prepared statements
- It **DOES NOT WORK** with any form of dynamic values, even when properly escaped
- It **DOES NOT WORK** with string concatenation or interpolation, even when sanitized
- It **DOES NOT WORK** with parameter binding mechanisms from any language or ORM

**BEWARE OF MISLEADING EXAMPLES ONLINE** that suggest you can do:
```sql
SELECT * FROM ag_catalog.cypher('my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', $1)
```

**THIS WILL NOT WORK** regardless of how you pass `$1`. The third parameter is treated as a literal string, not as a parameter placeholder.

This is a fundamental limitation of Apache AGE's implementation, not a limitation of PostgreSQL or your programming language.

## Key Security Requirements

1. **NEVER use string interpolation** for user-provided data in Cypher queries
2. **NEVER attempt to use SQL parameters with the third parameter** of `ag_catalog.cypher()`
3. **ALWAYS use parameterized SQL queries** to store data in the temporary table
4. **ALWAYS use the temporary table approach** for passing parameters to Cypher queries
5. **ALWAYS use ag_catalog.agtype** for function parameters and return values

## VertexCreator Implementation

### 1. Setup Functions

First, create the necessary PostgreSQL functions for each vertex type:

```typescript
async function setupVertexFunctions(vertexTypes: string[]): Promise<void> {
  for (const vertexType of vertexTypes) {
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
}
```

### 2. Store Vertex Data

Use parameterized SQL queries to store vertex data:

```typescript
async function storeVertexData(vertexType: string, vertices: any[]): Promise<void> {
  await queryExecutor.executeSQL(`
    INSERT INTO age_params (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE
    SET value = $2;
  `, [`vertex_${vertexType}`, JSON.stringify(vertices)]);
}
```

### 3. Generate Cypher Queries

Create type-specific Cypher queries for creating vertices:

```typescript
function generateCreateVerticesQuery(vertexType: string): string {
  // Use type-specific function based on vertex type
  if (vertexType === 'Person') {
    return `
      UNWIND age_schema_client.get_person_vertices() AS vertex_data
      CREATE (v:Person {
        id: vertex_data.id,
        name: vertex_data.name,
        age: vertex_data.age,
        email: vertex_data.email
      })
      RETURN count(v) AS created_vertices
    `;
  } else if (vertexType === 'Department') {
    return `
      UNWIND age_schema_client.get_department_vertices() AS vertex_data
      CREATE (v:Department {
        id: vertex_data.id,
        name: vertex_data.name,
        budget: vertex_data.budget
      })
      RETURN count(v) AS created_vertices
    `;
  } else {
    // Generic fallback (not recommended)
    return `
      UNWIND age_schema_client.get_${vertexType.toLowerCase()}_vertices() AS vertex_data
      CREATE (v:${vertexType} {
        id: vertex_data.id
        // Add other properties as needed
      })
      RETURN count(v) AS created_vertices
    `;
  }
}
```

### 4. Create Vertices

Execute the Cypher queries to create vertices:

```typescript
async function createVertices(
  vertexType: string,
  vertices: any[],
  graphName: string
): Promise<number> {
  // Store vertex data
  await storeVertexData(vertexType, vertices);

  // Generate and execute Cypher query
  const createVerticesQuery = generateCreateVerticesQuery(vertexType);

  const queryResult = await queryExecutor.executeCypher(
    createVerticesQuery,
    {}, // No parameters needed as data is in the temp table
    graphName
  );

  // Extract the number of created vertices
  return parseInt(queryResult.rows[0]?.created_vertices || '0', 10);
}
```

## EdgeCreator Implementation

### 1. Setup Functions

Create the necessary PostgreSQL functions for each edge type:

```typescript
async function setupEdgeFunctions(edgeTypes: string[]): Promise<void> {
  for (const edgeType of edgeTypes) {
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
}
```

### 2. Store Edge Data

Use parameterized SQL queries to store edge data:

```typescript
async function storeEdgeData(edgeType: string, edges: any[]): Promise<void> {
  await queryExecutor.executeSQL(`
    INSERT INTO age_params (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE
    SET value = $2;
  `, [`edge_${edgeType}`, JSON.stringify(edges)]);
}
```

### 3. Generate Cypher Queries

Create type-specific Cypher queries for creating edges:

```typescript
function generateCreateEdgesQuery(
  edgeType: string,
  fromLabelProperty: string = 'id',
  toLabelProperty: string = 'id'
): string {
  // Use type-specific function based on edge type
  if (edgeType === 'WORKS_IN') {
    return `
      UNWIND age_schema_client.get_works_in_edges() AS edge_data
      MATCH (from {${fromLabelProperty}: edge_data.from})
      MATCH (to {${toLabelProperty}: edge_data.to})
      CREATE (from)-[e:WORKS_IN {
        since: edge_data.since,
        role: edge_data.role
      }]->(to)
      RETURN count(e) AS created_edges
    `;
  } else if (edgeType === 'MANAGES') {
    return `
      UNWIND age_schema_client.get_manages_edges() AS edge_data
      MATCH (from {${fromLabelProperty}: edge_data.from})
      MATCH (to {${toLabelProperty}: edge_data.to})
      CREATE (from)-[e:MANAGES {
        since: edge_data.since
      }]->(to)
      RETURN count(e) AS created_edges
    `;
  } else {
    // Generic fallback (not recommended)
    return `
      UNWIND age_schema_client.get_${edgeType.toLowerCase()}_edges() AS edge_data
      MATCH (from {${fromLabelProperty}: edge_data.from})
      MATCH (to {${toLabelProperty}: edge_data.to})
      CREATE (from)-[e:${edgeType}]->(to)
      RETURN count(e) AS created_edges
    `;
  }
}
```

### 4. Create Edges

Execute the Cypher queries to create edges:

```typescript
async function createEdges(
  edgeType: string,
  edges: any[],
  graphName: string,
  options: { fromLabelProperty?: string, toLabelProperty?: string } = {}
): Promise<number> {
  // Store edge data
  await storeEdgeData(edgeType, edges);

  // Generate and execute Cypher query
  const createEdgesQuery = generateCreateEdgesQuery(
    edgeType,
    options.fromLabelProperty || 'id',
    options.toLabelProperty || 'id'
  );

  const queryResult = await queryExecutor.executeCypher(
    createEdgesQuery,
    {}, // No parameters needed as data is in the temp table
    graphName
  );

  // Extract the number of created edges
  return parseInt(queryResult.rows[0]?.created_edges || '0', 10);
}
```

## Complete Implementation Example

Here's a complete example of the VertexCreator and EdgeCreator classes:

```typescript
class VertexCreator<T extends SchemaDefinition> {
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    private graphName: string
  ) {}

  async createVertices(
    vertexType: string,
    vertices: any[],
    options: VertexCreationOptions = {}
  ): Promise<VertexCreationResult> {
    // Implementation details...

    try {
      // Store vertex data using parameterized SQL
      await this.queryExecutor.executeSQL(`
        INSERT INTO age_params (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE
        SET value = $2;
      `, [`vertex_${vertexType}`, JSON.stringify(vertices)]);

      // Generate and execute Cypher query
      const createVerticesQuery = this.generateCreateVerticesQuery(vertexType);

      const queryResult = await this.queryExecutor.executeCypher(
        createVerticesQuery,
        {}, // No parameters needed as data is in the temp table
        this.graphName,
        { transaction }
      );

      // Extract the number of created vertices
      const createdCount = parseInt(queryResult.rows[0]?.created_vertices || '0', 10);
      result.created = createdCount;

      return result;
    } finally {
      // Clean up the age_params table
      await this.queryExecutor.executeSQL(`
        DELETE FROM age_params WHERE key = $1;
      `, [`vertex_${vertexType}`]);
    }
  }
}
```

## Testing

Always include tests that verify:

1. Parameters are properly stored in the `age_params` table
2. The Cypher queries correctly use the parameter retrieval functions
3. Vertices and edges are created correctly
4. The `age_params` table is properly cleaned up after use

## Conclusion

By following this guide, you can implement secure and efficient vertex and edge creators for Apache AGE that are protected against SQL injection vulnerabilities.
