# API Reference

Complete API documentation for ageSchemaClient.

## Core Classes

### [AgeSchemaClient](./client)
The main client class for interacting with Apache AGE graph databases.

### [QueryBuilder](./query-builder)
Fluent API for constructing type-safe Cypher queries.

### [BatchLoader](./batch-loader)
Efficient batch loading for large datasets.

### [SchemaManager](./schema-manager)
Schema validation and management for graph databases.

### [Transaction](./transaction)
Transactional operations for data consistency.

## Quick Reference

### Basic Usage

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  graph: 'your_graph'
});

// Query data
const result = await client.query()
  .match('(p:Person)')
  .where({ age: { $gte: 18 } })
  .return('p.name, p.age')
  .execute();

// Batch load data
const loader = client.batch();
await loader.loadVertices([
  { label: 'Person', properties: { name: 'Alice', age: 30 } }
]);
```

## Type Definitions

All TypeScript type definitions are included with the package and provide full IntelliSense support in your IDE.

## Error Handling

All methods can throw specific error types for different failure scenarios. See individual class documentation for details.

## Next Steps

- Browse the individual class documentation above
- Check out the [How-To Guides](../how-to-guides/basic-queries) for practical examples
- See the [Getting Started Guide](../getting-started/installation) for setup instructions
