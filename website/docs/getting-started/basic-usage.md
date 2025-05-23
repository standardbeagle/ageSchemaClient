# Basic Usage

Learn the fundamentals of using ageSchemaClient with Apache AGE graph databases.

## Quick Start

After [installation](./installation), you can start using ageSchemaClient with just a few lines of code:

```typescript
import { AgeSchemaClient } from 'age-schema-client';

// Create a client instance
const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  graph: 'your_graph'
});

// Connect to the database
await client.connect();

// Your first query
const result = await client.query()
  .match('(n)')
  .return('count(n) as total_nodes')
  .execute();

console.log('Total nodes:', result[0].total_nodes);

// Clean up
await client.disconnect();
```

## Core Concepts

### Client Instance
The `AgeSchemaClient` is your main entry point for all database operations.

### Query Builder
Use the fluent query builder API to construct type-safe Cypher queries.

### Connection Management
The client handles connection pooling and resource management automatically.

## Next Steps

- [Connection Configuration](./connection-config) - Advanced connection options
- [First Graph](./first-graph) - Create your first graph database
- [Basic Queries](../how-to-guides/basic-queries) - Learn common query patterns
