# Critical Apache AGE Limitations

This document details critical limitations of Apache AGE that are often misunderstood or incorrectly documented online. Understanding these limitations is essential for developing secure and functional applications with Apache AGE.

## The Third Parameter of the `cypher()` Function

### The Limitation

⚠️ **CRITICAL WARNING** ⚠️

The third parameter of the `ag_catalog.cypher()` function has a **SEVERE LIMITATION** that is often misunderstood and incorrectly documented:

- It **ONLY** works with **STATIC LITERAL STRINGS** hardcoded in your SQL
- It **DOES NOT WORK** with SQL parameters (`$1`, `$2`, etc.) even in prepared statements
- It **DOES NOT WORK** with any form of dynamic values, even when properly escaped
- It **DOES NOT WORK** with string concatenation or interpolation, even when sanitized
- It **DOES NOT WORK** with parameter binding mechanisms from any language or ORM

### Misleading Examples

You may find examples online that suggest you can do:

```sql
-- THIS WILL NOT WORK
SELECT * FROM ag_catalog.cypher('my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', $1)
```

```typescript
// THIS WILL NOT WORK
const params = { name: 'John' };
await client.query(
  'SELECT * FROM ag_catalog.cypher($1, $2, $3)',
  ['my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', JSON.stringify(params)]
);
```

```python
# THIS WILL NOT WORK
params = {'name': 'John'}
cursor.execute(
    "SELECT * FROM ag_catalog.cypher(%s, %s, %s)",
    ['my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', json.dumps(params)]
)
```

**NONE OF THESE APPROACHES WILL WORK**. The third parameter is treated as a literal string, not as a parameter placeholder.

### Why This Happens

The issue is in how Apache AGE processes the third parameter:

1. The `cypher()` function expects a literal JSON string as its third parameter
2. When you use a parameter placeholder (`$1`, `?`, etc.), PostgreSQL correctly substitutes your value
3. However, Apache AGE then treats this substituted value as a literal string, not as JSON data
4. This means your parameters are not properly parsed and used within the Cypher query

This is a fundamental limitation of Apache AGE's implementation, not a limitation of PostgreSQL or your programming language.

### Proof of the Limitation

You can verify this limitation with a simple test:

```sql
-- Create a test graph
SELECT * FROM ag_catalog.create_graph('test_graph');

-- Create a test vertex
SELECT * FROM ag_catalog.cypher('test_graph', 'CREATE (n:Person {name: "John"}) RETURN n');

-- Try to query with a parameter (THIS WILL NOT WORK)
SELECT * FROM ag_catalog.cypher('test_graph', 'MATCH (n:Person) WHERE n.name = $name RETURN n', '{"name": "John"}');

-- The above query will fail with an error like:
-- "ERROR: properties() argument must resolve to a scalar value"
-- or similar error indicating parameter binding failure
```

### The Only Safe Solution: Temporary Table Approach

The only secure and reliable way to pass parameters to Apache AGE Cypher queries is to use a temporary table approach:

1. Store parameters in a temporary table using parameterized SQL queries
2. Create PostgreSQL functions that retrieve parameters from the table
3. Use these functions within Cypher queries with UNWIND or WITH clauses

## Other Important Limitations

### 1. Only ag_catalog.agtype is Supported

Apache AGE's Cypher implementation **ONLY** understands `ag_catalog.agtype` for both input and output parameters. All PostgreSQL functions used with Cypher must:

1. Accept parameters as `ag_catalog.agtype`
2. Return values as `ag_catalog.agtype` or `SETOF ag_catalog.agtype`
3. Convert between PostgreSQL types and `ag_catalog.agtype` within the function

### 2. Prepared Statements Limited to One Statement

Apache AGE only supports a single statement per prepared query. You cannot execute multiple Cypher statements in a single prepared query.

### 3. Search Path Requirements

Apache AGE requires `ag_catalog` to be in the search path for many operations, especially when using UNWIND with function return values.

## Common Errors and Solutions

### 1. "properties() argument must resolve to a scalar value"

This error occurs when:
- You're trying to use a parameter in a Cypher query incorrectly
- You're trying to use the third parameter of `cypher()` for dynamic data

**Solution**: Use the temporary table approach with PostgreSQL functions.

### 2. "unhandled cypher(cstring) function call"

This error occurs when:
- AGE is not loaded
- `ag_catalog` is not in the search path

**Solution**: Ensure AGE is loaded with `LOAD 'age'` and `ag_catalog` is in the search path.

### 3. "agtype cannot be found"

This error occurs when:
- `ag_catalog.agtype` is not fully qualified

**Solution**: Always use `ag_catalog.agtype` instead of just `agtype`.

## Conclusion

The limitations of Apache AGE, particularly regarding parameter passing, are severe and often misunderstood. By understanding these limitations and using the temporary table approach, you can develop secure and functional applications with Apache AGE.

Remember:
1. **NEVER** attempt to use SQL parameters with the third parameter of `cypher()`
2. **ALWAYS** use the temporary table approach for parameter passing
3. **ALWAYS** use `ag_catalog.agtype` for function parameters and return values
