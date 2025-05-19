# BatchLoader Troubleshooting Guide

This document provides troubleshooting tips for common issues with the BatchLoader component.

## Common Errors

### Error: "age_params table not found"

#### Symptoms

```
Error: relation "age_schema_client.age_params" does not exist
```

#### Causes

This error occurs when the age_params temporary table is not available in the database. This can happen if:

- The table was not created automatically
- The table was dropped by another process
- The schema name is incorrect

#### Solutions

1. Check that the schema name is correct in the BatchLoader options:

```typescript
const batchLoader = createBatchLoader(schema, queryExecutor, {
  schemaName: 'age_schema_client' // Make sure this matches the schema in your database
});
```

2. Manually create the table:

```sql
-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS age_schema_client;

-- Create temporary table for parameters
CREATE TABLE IF NOT EXISTS age_schema_client.age_params (
  key text PRIMARY KEY,
  data jsonb
);
```

3. Check if another process is dropping the table and modify that process to avoid dropping the table.

### Error: "ag_catalog schema not in search_path"

#### Symptoms

```
Error: schema "ag_catalog" does not exist in the search_path
```

#### Causes

This error occurs when the ag_catalog schema is not in the search_path. This can happen if:

- Apache AGE is not installed
- The search_path is not configured correctly
- The connection options are incorrect

#### Solutions

1. Check that Apache AGE is installed:

```sql
SELECT * FROM pg_extension WHERE extname = 'age';
```

2. Set the search_path in the connection options:

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

3. Set the search_path in the database:

```sql
SET search_path TO ag_catalog, "$user", public;
```

### Error: "Transaction timeout"

#### Symptoms

```
Error: Transaction timeout after 60000ms
```

#### Causes

This error occurs when the transaction timeout is exceeded. This can happen if:

- The dataset is too large
- The database is slow
- The transaction timeout is too short

#### Solutions

1. Increase the transaction timeout:

```typescript
batchLoader.loadGraphData(graphData, {
  transactionTimeout: 120000 // 2 minutes
});
```

2. Reduce the batch size to process data in smaller chunks:

```typescript
batchLoader.loadGraphData(graphData, {
  batchSize: 100 // Smaller batch size
});
```

3. Use the OptimizedBatchLoader for better performance:

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor);
```

### Error: "Out of memory"

#### Symptoms

```
Error: JavaScript heap out of memory
```

#### Causes

This error occurs when the process runs out of memory. This can happen if:

- The dataset is too large
- The batch size is too large
- There is a memory leak

#### Solutions

1. Reduce the batch size:

```typescript
batchLoader.loadGraphData(graphData, {
  batchSize: 100 // Smaller batch size
});
```

2. Use the OptimizedBatchLoader for better memory efficiency:

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor);
```

3. Increase the Node.js memory limit:

```bash
node --max-old-space-size=4096 your-script.js
```

### Error: "Validation failed"

#### Symptoms

```
Error: Validation failed: Missing required property: name
```

#### Causes

This error occurs when the graph data fails validation. This can happen if:

- The data does not match the schema
- Required properties are missing
- Property types are incorrect

#### Solutions

1. Fix the data to match the schema:

```typescript
// Fix missing required properties
graphData.vertices.Person[0].name = 'Alice';
```

2. Disable validation if you are confident that the data is valid:

```typescript
batchLoader.loadGraphData(graphData, {
  validateBeforeLoad: false
});
```

3. Use the validateGraphData method to check the data before loading:

```typescript
const validationResult = await batchLoader.validateGraphData(graphData);
if (!validationResult.isValid) {
  console.error('Validation errors:', validationResult.errors);
}
```

### Error: "Invalid reference"

#### Symptoms

```
Error: Invalid reference: Vertex with id p3 not found
```

#### Causes

This error occurs when an edge references a vertex that does not exist. This can happen if:

- The vertex ID is incorrect
- The vertex was not created
- The vertex was created in a different graph

#### Solutions

1. Fix the edge references:

```typescript
// Fix invalid reference
graphData.edges.KNOWS[0].to = 'p2'; // Valid vertex ID
```

2. Use the continueOnError option to continue loading despite errors:

```typescript
batchLoader.loadGraphData(graphData, {
  continueOnError: true
});
```

3. Use the validateGraphData method to check the data before loading:

```typescript
const validationResult = await batchLoader.validateGraphData(graphData);
if (!validationResult.isValid) {
  console.error('Validation errors:', validationResult.errors);
}
```

## Performance Issues

### Slow Loading

#### Symptoms

- Loading takes longer than expected
- CPU usage is high
- Memory usage is high

#### Causes

- Large dataset
- Inefficient queries
- Slow database
- Insufficient resources

#### Solutions

1. Use the OptimizedBatchLoader for better performance:

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor);
```

2. Optimize the batch size:

```typescript
batchLoader.loadGraphData(graphData, {
  batchSize: 500 // Adjust based on your dataset and hardware
});
```

3. Disable validation if you are confident that the data is valid:

```typescript
batchLoader.loadGraphData(graphData, {
  validateBeforeLoad: false
});
```

4. Monitor progress to identify bottlenecks:

```typescript
batchLoader.loadGraphData(graphData, {
  onProgress: (progress) => {
    console.log(`Progress: ${progress.phase} ${progress.type} - ${progress.processed}/${progress.total} (${progress.percentage}%)`);
  }
});
```

### High Memory Usage

#### Symptoms

- Memory usage is high
- Out of memory errors
- System becomes unresponsive

#### Causes

- Large dataset
- Large batch size
- Memory leaks
- Insufficient resources

#### Solutions

1. Reduce the batch size:

```typescript
batchLoader.loadGraphData(graphData, {
  batchSize: 100 // Smaller batch size
});
```

2. Use the OptimizedBatchLoader for better memory efficiency:

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor);
```

3. Monitor memory usage:

```typescript
const memoryUsage = process.memoryUsage();
console.log(`Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
```

4. Increase the Node.js memory limit:

```bash
node --max-old-space-size=4096 your-script.js
```

## Connection Issues

### Connection Timeout

#### Symptoms

```
Error: Connection terminated unexpectedly
```

#### Causes

- Database is not running
- Database is not accessible
- Network issues
- Firewall issues

#### Solutions

1. Check that the database is running:

```bash
pg_isready -h localhost -p 5432
```

2. Check the connection settings:

```typescript
const connectionManager = new PgConnectionManager({
  host: 'localhost', // Check host
  port: 5432, // Check port
  database: 'my_database', // Check database name
  user: 'my_user', // Check username
  password: 'my_password', // Check password
});
```

3. Check network connectivity:

```bash
ping localhost
```

4. Check firewall settings:

```bash
telnet localhost 5432
```

### Connection Pool Exhaustion

#### Symptoms

```
Error: Connection pool is full
```

#### Causes

- Too many concurrent connections
- Connections not being released
- Connection pool size too small

#### Solutions

1. Increase the connection pool size:

```typescript
const connectionManager = new PgConnectionManager({
  max: 20, // Increase pool size
});
```

2. Ensure connections are being released:

```typescript
try {
  // Use connection
} finally {
  // Release connection
  await connectionManager.releaseConnection(connection);
}
```

3. Monitor connection pool usage:

```typescript
console.log(`Connection pool size: ${connectionManager.getPoolSize()}`);
console.log(`Active connections: ${connectionManager.getActiveConnections()}`);
```

## Conclusion

If you encounter issues not covered in this guide, please refer to the [BatchLoader Documentation](./batch-loader.md) or [Optimized BatchLoader Documentation](./optimized-batch-loader.md) for more information. You can also check the [BatchLoader Limitations and Workarounds](./batch-loader-limitations.md) document for known limitations and workarounds.
