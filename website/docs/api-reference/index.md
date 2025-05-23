# API Reference

Complete API documentation for ageSchemaClient.

## Auto-Generated API Documentation

For the most comprehensive and up-to-date API documentation, see our **[Complete API Reference](./api-generated/)** which is automatically generated from TypeScript source code.

### Quick Navigation
- **[Classes](./api-generated/#classes)** - All available classes including AgeSchemaClient, QueryBuilder, BatchOperations, etc.
- **[Interfaces](./api-generated/#interfaces)** - Type definitions and contracts
- **[Functions](./api-generated/#functions)** - Utility functions and helpers
- **[Type Aliases](./api-generated/#type-aliases)** - Custom type definitions

## Core Classes Overview

### [AgeSchemaClient](./client) | [Full API](./api-generated/classes/AgeSchemaClient)
The main client class for interacting with Apache AGE graph databases.

### [QueryBuilder](./query-builder) | [Full API](./api-generated/classes/QueryBuilder)
Fluent API for constructing type-safe Cypher queries.

### [BatchLoader](./batch-loader) | [Full API](./api-generated/classes/SchemaLoader)
Efficient batch loading for large datasets.

### [SchemaManager](./schema-manager) | [Full API](./api-generated/classes/SchemaValidator)
Schema validation and management for graph databases.

### [Transaction](./transaction) | [Full API](./api-generated/classes/TransactionManager)
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
