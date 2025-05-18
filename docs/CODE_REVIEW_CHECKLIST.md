# Code Review Checklist for Apache AGE Parameter Handling

This checklist is designed to help reviewers identify and prevent SQL injection vulnerabilities and ensure proper parameter handling in Apache AGE Cypher queries.

## Critical Security Checks

### 1. String Interpolation

- [ ] **NO string interpolation** is used for user-provided data in SQL or Cypher queries
- [ ] **NO template literals** (`${variable}`) are used within query strings for user data
- [ ] **NO string concatenation** (`+`) is used to combine user data with query strings
- [ ] **NO string replacement** (`.replace()`) is used to insert user data into query strings

### 2. Parameter Passing

⚠️ **CRITICAL APACHE AGE LIMITATION** ⚠️

- [ ] **VERIFY** that the code acknowledges the severe limitation of the third parameter of `ag_catalog.cypher()`
- [ ] **VERIFY** that the code does **NOT** attempt to use SQL parameters (`$1`, `$2`, etc.) with the third parameter of `ag_catalog.cypher()`
- [ ] **VERIFY** that the code does **NOT** attempt to use any form of dynamic values with the third parameter of `ag_catalog.cypher()`
- [ ] **VERIFY** that the code does **NOT** rely on examples from the internet that incorrectly suggest the third parameter can be parameterized
- [ ] The temporary table approach is used for **ALL** parameter passing to Cypher queries
- [ ] **ALL user data** is passed using parameterized SQL queries to the temporary table
- [ ] All PostgreSQL functions accept parameters as `ag_catalog.agtype`
- [ ] All PostgreSQL functions return values as `ag_catalog.agtype` or `SETOF ag_catalog.agtype`
- [ ] All type conversions between PostgreSQL types and `ag_catalog.agtype` are handled properly

### 3. Temporary Table Usage

- [ ] Parameters are stored in the `age_params` table using parameterized SQL
- [ ] PostgreSQL functions are used to retrieve parameters from the table
- [ ] UNWIND is used with these functions in Cypher queries
- [ ] The `age_params` table is properly cleaned up after use

## Implementation Checks

### 1. Data Storage

- [ ] `executeSQL` is used with parameterized queries to store data
- [ ] JSON data is properly serialized before storage
- [ ] Keys in the `age_params` table follow a consistent naming convention
- [ ] Conflicts are properly handled with `ON CONFLICT DO UPDATE`

### 2. Function Creation

- [ ] Type-specific functions are created for each vertex and edge type
- [ ] Functions properly handle NULL values and empty arrays
- [ ] Functions accept parameters as `ag_catalog.agtype`
- [ ] Functions return `ag_catalog.agtype` or `SETOF ag_catalog.agtype`
- [ ] Functions properly convert between PostgreSQL types and `ag_catalog.agtype`
- [ ] Functions are created in the `age_schema_client` schema

### 3. Cypher Queries

- [ ] Cypher queries use UNWIND with the parameter retrieval functions
- [ ] Vertex creation queries specify all properties explicitly
- [ ] Edge creation queries use MATCH statements to find vertices
- [ ] Edge creation queries specify all properties explicitly

### 4. Error Handling

- [ ] Transactions are used for multi-step operations
- [ ] Errors are properly caught and handled
- [ ] The `age_params` table is cleaned up in finally blocks
- [ ] Detailed error messages are provided for debugging

## Testing Checks

### 1. Security Testing

- [ ] Tests verify that SQL injection attempts are blocked
- [ ] Tests verify that parameters are properly stored and retrieved
- [ ] Tests verify that the temporary table approach is used correctly
- [ ] Tests verify that the `age_params` table is properly cleaned up

### 2. Integration Testing

- [ ] Tests verify that vertices are created correctly
- [ ] Tests verify that edges are created correctly
- [ ] Tests verify that properties are set correctly
- [ ] Tests verify that error handling works correctly

## Performance Checks

- [ ] Batch processing is used for large datasets
- [ ] Transactions are used appropriately
- [ ] Indexes are used for vertex and edge lookups
- [ ] The number of round trips between client and database is minimized

## Documentation Checks

- [ ] Security guidelines are documented
- [ ] The temporary table approach is explained
- [ ] Examples are provided for common use cases
- [ ] Known limitations are documented

## Example: Correct vs. Incorrect Implementations

### Incorrect (VULNERABLE TO SQL INJECTION OR WILL NOT WORK)

```typescript
// INCORRECT - String interpolation for user data (SQL INJECTION VULNERABILITY)
const name = userInput;
const cypher = `MATCH (n:Person {name: "${name}"}) RETURN n`;
await queryExecutor.executeCypher(cypher, {}, graphName);

// INCORRECT - Using the third parameter for dynamic data (WILL NOT WORK)
const params = { name: userInput };
const sql = `SELECT * FROM ag_catalog.cypher('${graphName}', $1, $2)`;
await connection.query(sql, [cypherQuery, JSON.stringify(params)]);
// ⚠️ THIS WILL NOT WORK! The third parameter is treated as a literal string, not a parameter placeholder

// INCORRECT - Attempting to use prepared statements with the third parameter (WILL NOT WORK)
await connection.prepare('my_query',
  'SELECT * FROM ag_catalog.cypher($1, $2, $3)',
  ['my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', '{"name": "John"}']
);
// ⚠️ THIS WILL NOT WORK! Even in prepared statements, the third parameter is treated as a literal string

// INCORRECT - Attempting to use node-postgres parameter binding (WILL NOT WORK)
const params = { name: 'John' };
await client.query(
  'SELECT * FROM ag_catalog.cypher($1, $2, $3)',
  ['my_graph', 'MATCH (n) WHERE n.name = $name RETURN n', JSON.stringify(params)]
);
// ⚠️ THIS WILL NOT WORK! The third parameter is always treated as a literal string

// INCORRECT - Using TEXT parameters instead of ag_catalog.agtype
await queryExecutor.executeSQL(`
  CREATE OR REPLACE FUNCTION age_schema_client.get_param(param_key TEXT)
  RETURNS TEXT AS $$ ... $$ LANGUAGE plpgsql;
`);
```

### Correct (SECURE)

```typescript
// CORRECT - Store parameters in the age_params table
await queryExecutor.executeSQL(`
  INSERT INTO age_params (key, value)
  VALUES ($1, $2)
  ON CONFLICT (key) DO UPDATE
  SET value = $2;
`, ['param_name', JSON.stringify(userInput)]);

// CORRECT - Create functions that use ag_catalog.agtype
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

// CORRECT - Use the function to retrieve parameters with ag_catalog.agtype
const cypher = `
  WITH age_schema_client.get_age_param('param_name'::ag_catalog.agtype) AS name
  MATCH (n:Person {name: name})
  RETURN n
`;
await queryExecutor.executeCypher(cypher, {}, graphName);
```

## Final Verification

Before approving any code changes, verify:

1. All checklist items are satisfied
2. All security tests pass
3. All integration tests pass
4. The code follows the security guidelines
5. The code uses the temporary table approach correctly

Remember: **Security is non-negotiable**. Any code that does not follow these guidelines must be rejected.
