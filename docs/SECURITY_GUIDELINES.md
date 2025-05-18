# Security Guidelines for Apache AGE Parameter Handling

## Critical Security Requirements

### 1. NEVER Use String Interpolation for Parameter Values

**PROHIBITED:**
```typescript
// NEVER DO THIS - SQL Injection vulnerability
const name = userInput;
const cypher = `MATCH (n:Person {name: "${name}"}) RETURN n`;
await queryExecutor.executeCypher(cypher, {}, graphName);
```

**ALSO PROHIBITED:**
```typescript
// NEVER DO THIS - Still vulnerable to SQL Injection
const name = userInput;
const cypher = `MATCH (n:Person {name: '${name}'}) RETURN n`;
await queryExecutor.executeCypher(cypher, {}, graphName);
```

### 2. ALWAYS Use the Temporary Table Approach

⚠️ **CRITICAL WARNING** ⚠️

The third parameter of the `ag_catalog.cypher()` function has a **SEVERE LIMITATION** that is often misunderstood:

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

### 3. ALWAYS Use ag_catalog.agtype for Function Parameters and Return Values

Apache AGE's Cypher implementation **ONLY** understands `ag_catalog.agtype` for both input and output parameters. All PostgreSQL functions used with Cypher must:

1. Accept parameters as `ag_catalog.agtype`
2. Return values as `ag_catalog.agtype` or `SETOF ag_catalog.agtype`
3. Convert between PostgreSQL types and `ag_catalog.agtype` within the function

**PROHIBITED:**
```typescript
// NEVER DO THIS - Will not work with Apache AGE
const sql = `SELECT * FROM ag_catalog.cypher('${graphName}', $1, $2)`;
await connection.query(sql, [cypherQuery, JSON.stringify(params)]);
```

**REQUIRED APPROACH:**
Always use the temporary table approach to pass parameters to Cypher queries:

1. Store parameters in the `age_params` table
2. Create PostgreSQL functions that retrieve parameters from the table
3. Use these functions within your Cypher queries with UNWIND

## Implementation Guidelines

### 1. Parameter Storage

Always use parameterized SQL queries to store data in the `age_params` table:

```typescript
// CORRECT - Use parameterized queries to store data
await queryExecutor.executeSQL(`
  INSERT INTO age_params (key, value)
  VALUES ($1, $2)
  ON CONFLICT (key) DO UPDATE
  SET value = $2;
`, [key, JSON.stringify(value)]);
```

### 2. Parameter Retrieval in Cypher

Use the `age_schema_client.get_age_param_array()` function to retrieve parameters in Cypher queries:

```typescript
// CORRECT - Use the function to retrieve parameters
const cypher = `
  UNWIND age_schema_client.get_age_param_array('vertex_Person') AS vertex_data
  CREATE (v:Person {
    id: vertex_data.id,
    name: vertex_data.name,
    age: vertex_data.age
  })
  RETURN count(v) AS created_vertices
`;
await queryExecutor.executeCypher(cypher, {}, graphName);
```

### 3. Vertex Type and Edge Type Handling

For vertex and edge types, use type-specific functions that properly handle ag_catalog.agtype:

```typescript
// CORRECT - Use type-specific functions with ag_catalog.agtype
const cypher = `
  UNWIND age_schema_client.get_person_vertices() AS vertex_data
  CREATE (v:Person {
    id: vertex_data.id,
    name: vertex_data.name,
    age: vertex_data.age
  })
  RETURN count(v) AS created_vertices
`;
await queryExecutor.executeCypher(cypher, {}, graphName);
```

The function implementation should use ag_catalog.agtype:

```sql
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
```

### 4. Edge Creation

For creating edges, use MATCH statements to find vertices by ID properties and ensure all functions return ag_catalog.agtype:

```typescript
// CORRECT - Use MATCH statements to find vertices
const cypher = `
  UNWIND age_schema_client.get_works_in_edges() AS edge_data
  MATCH (from:Person {id: edge_data.from})
  MATCH (to:Department {id: edge_data.to})
  CREATE (from)-[e:WORKS_IN {
    since: edge_data.since,
    role: edge_data.role
  }]->(to)
  RETURN count(e) AS created_edges
`;
await queryExecutor.executeCypher(cypher, {}, graphName);
```

The edge function implementation should also use ag_catalog.agtype:

```sql
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
```

## Testing Requirements

### 1. Security Testing

All implementations must include tests that verify:

- Parameters are properly stored in the `age_params` table
- No string interpolation is used for parameter values
- The temporary table approach is used for all parameter passing
- SQL injection attempts are blocked

### 2. Integration Testing

Integration tests must verify:

- The `age_params` table is properly created and used
- The PostgreSQL functions for parameter retrieval work correctly
- The Cypher queries correctly use the parameter retrieval functions
- The `age_params` table is properly cleaned up after use

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] No string interpolation is used for parameter values
- [ ] All parameters are stored in the `age_params` table using parameterized SQL
- [ ] All Cypher queries use the parameter retrieval functions
- [ ] All PostgreSQL functions accept and return ag_catalog.agtype
- [ ] All type conversions between PostgreSQL types and ag_catalog.agtype are handled properly
- [ ] The `age_params` table is properly cleaned up after use
- [ ] All security tests pass
- [ ] All integration tests pass

## Troubleshooting

### Common Issues

1. **"properties() argument must resolve to a scalar value"**
   - This error occurs when trying to use a non-scalar value in a property assignment
   - Solution: Ensure all property values are properly extracted from the parameter object

2. **"unhandled cypher(cstring) function call"**
   - This error occurs when AGE is not loaded or not in the search path
   - Solution: Ensure AGE is loaded with `LOAD 'age'` and `ag_catalog` is in the search path

3. **"agtype cannot be found"**
   - This error occurs when `ag_catalog.agtype` is not fully qualified
   - Solution: Always use `ag_catalog.agtype` instead of just `agtype`

## References

- [Apache AGE Documentation](https://age.apache.org/age-manual/master/index.html)
- [PostgreSQL Prepared Statements](https://www.postgresql.org/docs/current/sql-prepare.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
