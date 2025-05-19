# BatchLoader Limitations and Workarounds

This document describes known limitations of the BatchLoader component and provides workarounds where available.

## Apache AGE Compatibility

### Limitation

The BatchLoader is designed specifically for Apache AGE and may not be compatible with other graph databases.

### Workaround

If you need to work with other graph databases, you may need to implement a custom loader or use the database's native bulk loading capabilities.

## PostgreSQL Functions

### Limitation

The BatchLoader uses PostgreSQL functions to retrieve data from the temporary table. These functions must be available in the database.

### Workaround

The required functions are automatically created when the BatchLoader is used. However, if you encounter issues with function creation, you can manually create the functions using the following SQL:

```sql
-- Create function to get vertices from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_vertices(vertex_type text)
RETURNS SETOF jsonb AS $$
BEGIN
  RETURN QUERY SELECT data FROM age_schema_client.age_params WHERE key = 'vertex_' || vertex_type;
END;
$$ LANGUAGE plpgsql;

-- Create function to get edges from the age_params table
CREATE OR REPLACE FUNCTION age_schema_client.get_edges(edge_type text)
RETURNS SETOF jsonb AS $$
BEGIN
  RETURN QUERY SELECT data FROM age_schema_client.age_params WHERE key = 'edge_' || edge_type;
END;
$$ LANGUAGE plpgsql;
```

## Search Path

### Limitation

The BatchLoader requires the ag_catalog schema to be in the search_path. This is typically configured in the connection options.

### Workaround

You can set the search_path in the connection options:

```typescript
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'my_database',
  user: 'my_user',
  password: 'my_password',
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public',
  },
});
```

Alternatively, you can set the search_path in the database:

```sql
SET search_path TO ag_catalog, "$user", public;
```

## Temporary Table

### Limitation

The BatchLoader uses a temporary table named age_params to store data. This table must be available in the database.

### Workaround

The temporary table is automatically created when the BatchLoader is used. However, if you encounter issues with table creation, you can manually create the table using the following SQL:

```sql
-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS age_schema_client;

-- Create temporary table for parameters
CREATE TABLE IF NOT EXISTS age_schema_client.age_params (
  key text PRIMARY KEY,
  data jsonb
);
```

## Transaction Isolation

### Limitation

The BatchLoader uses READ COMMITTED transaction isolation level. This may not be suitable for all use cases.

### Workaround

If you need a different transaction isolation level, you can modify the BatchLoader implementation or use a custom transaction manager.

## Memory Usage

### Limitation

The BatchLoader processes data in batches to optimize memory usage. However, for very large datasets, you may still encounter memory issues.

### Workaround

You can reduce the batch size to minimize memory usage:

```typescript
batchLoader.loadGraphData(graphData, {
  batchSize: 100 // Use a smaller batch size
});
```

Alternatively, you can use the OptimizedBatchLoader, which has better memory efficiency:

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor, {
  defaultBatchSize: 100 // Use a smaller batch size
});
```

## Performance

### Limitation

The BatchLoader's performance may degrade with very large datasets or complex schemas.

### Workaround

You can use the OptimizedBatchLoader for better performance:

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor);
```

You can also optimize the batch size based on your dataset and hardware:

```typescript
batchLoader.loadGraphData(graphData, {
  batchSize: 500 // Adjust based on your dataset and hardware
});
```

## Error Handling

### Limitation

By default, the BatchLoader will stop loading on the first error. This may not be desirable for large datasets where you want to continue loading despite errors.

### Workaround

You can use the continueOnError option to continue loading despite errors:

```typescript
batchLoader.loadGraphData(graphData, {
  continueOnError: true
});
```

## Validation

### Limitation

Validation adds overhead to the loading process, which may impact performance for large datasets.

### Workaround

You can disable validation if you are confident that the data is valid:

```typescript
batchLoader.loadGraphData(graphData, {
  validateBeforeLoad: false
});
```

## Concurrent Loading

### Limitation

The BatchLoader is not designed for concurrent loading from multiple processes or threads.

### Workaround

If you need to load data concurrently, you can use multiple BatchLoader instances with different graph names:

```typescript
// Create multiple batch loaders
const batchLoader1 = createBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'graph1'
});

const batchLoader2 = createBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'graph2'
});

// Load data concurrently
await Promise.all([
  batchLoader1.loadGraphData(graphData1),
  batchLoader2.loadGraphData(graphData2)
]);
```

## Dynamic Schema

### Limitation

The BatchLoader requires a schema to be defined at creation time. It does not support dynamic schema changes during loading.

### Workaround

If you need to load data with different schemas, you can create multiple BatchLoader instances:

```typescript
// Create batch loaders for different schemas
const batchLoader1 = createBatchLoader(schema1, queryExecutor);
const batchLoader2 = createBatchLoader(schema2, queryExecutor);

// Load data with different schemas
await batchLoader1.loadGraphData(graphData1);
await batchLoader2.loadGraphData(graphData2);
```

## Edge References

### Limitation

The BatchLoader requires edges to reference vertices by their ID properties. It does not support other types of references.

### Workaround

Ensure that your edge data references vertices by their ID properties:

```typescript
const graphData = {
  vertices: {
    Person: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' }
    ]
  },
  edges: {
    KNOWS: [
      { from: 'p1', to: 'p2' } // Reference vertices by their ID properties
    ]
  }
};
```

## Conclusion

While the BatchLoader has some limitations, most can be addressed with workarounds or by using the OptimizedBatchLoader. If you encounter issues not covered in this document, please refer to the [BatchLoader Documentation](./batch-loader.md) or [Optimized BatchLoader Documentation](./optimized-batch-loader.md) for more information.
