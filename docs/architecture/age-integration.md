# Apache AGE Integration Architecture

This document details how ageSchemaClient integrates with Apache AGE, including the challenges overcome, integration patterns, and implementation details.

## Apache AGE Overview

Apache AGE (A Graph Extension) is a PostgreSQL extension that provides graph database functionality using the Cypher query language. It extends PostgreSQL with:

- Graph data types (`agtype`)
- Cypher query language support
- Graph algorithms and functions
- Integration with existing PostgreSQL features

## Integration Challenges

### 1. Parameter Passing Limitation

**The Core Problem**: Apache AGE's `cypher()` function has a critical limitation where the third parameter (for passing data) only works with static literal strings, not with SQL parameters.

```sql
-- This works (literal string)
SELECT * FROM ag_catalog.cypher('graph', 'MATCH (n) RETURN n', '{"param": "value"}');

-- This DOES NOT work (parameter binding)
SELECT * FROM ag_catalog.cypher('graph', 'MATCH (n) RETURN n', $1);
```

**Our Solution**: Temporary table approach with PostgreSQL functions.

### 2. Data Type Requirements

**Challenge**: Apache AGE only understands `ag_catalog.agtype` for input/output.

**Solution**: All functions interfacing with Cypher must use `ag_catalog.agtype`:
```sql
CREATE FUNCTION get_param(key ag_catalog.agtype) 
RETURNS ag_catalog.agtype AS $$
-- Function implementation
$$ LANGUAGE plpgsql;
```

### 3. Search Path Dependencies

**Challenge**: AGE functions require `ag_catalog` in the PostgreSQL search path.

**Solution**: Automatic search path management in connection initialization.

## Integration Architecture

### 1. Parameter Management System

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│  age_params     │───▶│  PostgreSQL     │
│   Parameters    │    │  Temp Table     │    │  Functions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cypher Query  │◀───│  Function Call  │◀───│  Apache AGE     │
│   Execution     │    │  in Cypher      │    │  Engine         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Temporary Table Structure
```sql
CREATE TABLE IF NOT EXISTS age_params (
  key TEXT PRIMARY KEY,
  value JSONB
);
```

#### Parameter Retrieval Functions
```sql
-- Single parameter retrieval
CREATE FUNCTION get_age_param(param_key ag_catalog.agtype)
RETURNS ag_catalog.agtype AS $$
DECLARE
  param_key_text TEXT;
  result_value JSONB;
BEGIN
  SELECT param_key::text INTO param_key_text;
  param_key_text := REPLACE(REPLACE(param_key_text, '"', ''), '''', '');
  
  SELECT value INTO result_value
  FROM age_params WHERE key = param_key_text;
  
  IF result_value IS NULL THEN
    RETURN 'null'::jsonb::text::ag_catalog.agtype;
  END IF;
  
  RETURN result_value::text::ag_catalog.agtype;
END;
$$ LANGUAGE plpgsql;

-- Array parameter retrieval
CREATE FUNCTION get_age_param_array(param_key ag_catalog.agtype)
RETURNS SETOF ag_catalog.agtype AS $$
-- Implementation for array handling
$$ LANGUAGE plpgsql;
```

### 2. Query Execution Flow

```
┌─────────────────┐
│  QueryBuilder   │
│  .where({...})  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  setParam()     │
│  Store in       │
│  age_params     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Build Cypher   │
│  with function  │
│  calls          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Execute via    │
│  ag_catalog.    │
│  cypher()       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Clean up       │
│  age_params     │
└─────────────────┘
```

### 3. Batch Loading Integration

For bulk operations, we use specialized functions that work with arrays:

```sql
-- Vertex creation with UNWIND
UNWIND get_vertices('Person') AS vertex_data
CREATE (p:Person {
  id: vertex_data.id,
  name: vertex_data.name,
  age: vertex_data.age
})
RETURN count(p) AS created_vertices
```

## Implementation Patterns

### 1. Safe Parameter Binding

```typescript
class QueryBuilder {
  async setParam(key: string, value: any): Promise<this> {
    const jsonValue = JSON.stringify(value);
    await this.queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `, [key, jsonValue]);
    return this;
  }
}
```

### 2. Type-Safe Function Generation

```typescript
class SQLGenerator {
  generateParameterFunction(
    schemaName: string, 
    functionName: string, 
    paramKey: string
  ): string {
    return `
      CREATE OR REPLACE FUNCTION ${schemaName}.${functionName}()
      RETURNS SETOF ag_catalog.agtype AS $$
      DECLARE
        result_array JSONB;
        item_data JSONB;
      BEGIN
        SELECT value INTO result_array
        FROM age_params WHERE key = '${paramKey}';
        
        IF result_array IS NULL THEN
          RETURN;
        END IF;
        
        FOR item_data IN SELECT * FROM jsonb_array_elements(result_array)
        LOOP
          RETURN NEXT item_data::text::ag_catalog.agtype;
        END LOOP;
        
        RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `;
  }
}
```

### 3. Connection Initialization

```typescript
class PgConnectionManager {
  private async initializeAGE(connection: Connection): Promise<void> {
    // Load Apache AGE extension
    await connection.query("LOAD 'age'");
    
    // Set search path to include ag_catalog
    await connection.query(`
      SET search_path = ag_catalog, "${this.config.schema || 'public'}", public
    `);
    
    // Create parameter table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS age_params (
        key TEXT PRIMARY KEY,
        value JSONB
      )
    `);
    
    // Create parameter retrieval functions
    await this.createParameterFunctions(connection);
  }
}
```

## Performance Optimizations

### 1. Connection Pool Optimization

- **Pre-initialized connections**: AGE extension loaded on connection creation
- **Search path caching**: Avoid repeated SET commands
- **Function caching**: Parameter functions created once per connection

### 2. Batch Operation Optimization

- **Chunked processing**: Large datasets split into manageable chunks
- **Parallel execution**: Multiple connections for concurrent processing
- **Memory management**: Streaming for very large datasets

### 3. Query Optimization

- **Parameter reuse**: Temporary table persists across queries in same transaction
- **Function optimization**: Efficient parameter retrieval functions
- **Query plan caching**: Consistent query patterns for plan reuse

## Error Handling

### 1. AGE-Specific Errors

```typescript
class AGEError extends BaseError {
  constructor(message: string, cause?: Error, context?: any) {
    super(ErrorCode.AGE_ERROR, message, cause, context);
  }
}

// Common AGE error patterns
const AGE_ERROR_PATTERNS = {
  PARAMETER_ERROR: /properties\(\) argument must resolve to a scalar value/,
  FUNCTION_NOT_FOUND: /unhandled cypher\(cstring\) function call/,
  AGTYPE_ERROR: /agtype cannot be found/,
  GRAPH_NOT_EXISTS: /graph ".*" does not exist/,
};
```

### 2. Recovery Strategies

- **Automatic retry**: For transient AGE errors
- **Connection reset**: For search path issues
- **Parameter cleanup**: Ensure temporary table is cleaned up

## Security Considerations

### 1. SQL Injection Prevention

The temporary table approach eliminates SQL injection risks:
- All user data goes through parameterized SQL to `age_params`
- Cypher queries use function calls, not string concatenation
- No direct user input in Cypher query strings

### 2. Data Isolation

- Schema-based isolation for multi-tenant applications
- Connection-level parameter tables
- Automatic cleanup prevents data leakage

## Extension Integration

### 1. Multi-Extension Support

```typescript
const client = new AgeSchemaClient({
  connectionString: '...',
  onConnectionCreate: async (connection) => {
    // Load multiple extensions
    await connection.query("LOAD 'age'");
    await connection.query("LOAD 'vector'");
    await connection.query("LOAD 'postgis'");
    
    // Set comprehensive search path
    await connection.query(`
      SET search_path = ag_catalog, vector, public, postgis
    `);
  }
});
```

### 2. Extension Hooks

- `beforeConnect`: Pre-connection setup
- `onConnectionCreate`: Extension initialization
- `onError`: Error handling and recovery

## Future Considerations

### 1. AGE Version Compatibility

- Version detection and feature flagging
- Backward compatibility for older AGE versions
- Forward compatibility for new features

### 2. Performance Improvements

- Connection pooling optimizations
- Query caching strategies
- Bulk operation enhancements

### 3. Feature Extensions

- Graph algorithm integration
- Advanced Cypher features
- Custom function support

This integration architecture provides a robust foundation for working with Apache AGE while overcoming its inherent limitations and providing a developer-friendly interface.
