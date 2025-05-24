---
title: Basic Usage
tags:
  - getting-started
  - tutorial
  - query-builder
  - examples
difficulty: beginner
content_type: tutorial
last_updated: 2024-01-15
related_articles:
  - /docs/getting-started/installation
  - /docs/how-to-guides/basic-queries
  - /docs/api-reference/client
---

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
The `AgeSchemaClient` is your main entry point for all database operations. It provides:
- Connection management and pooling
- Query building and execution
- Schema validation and management
- Transaction support

### Query Builder
Use the fluent query builder API to construct type-safe Cypher queries:

```typescript
const query = client.query()
  .match('(person:Person)')
  .where({ name: 'John' })
  .return('person');
```

### Connection Management
The client handles connection pooling and resource management automatically. You can configure pool settings:

```typescript
const client = new AgeSchemaClient({
  // ... connection details
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
});
```

## Working with Vertices

### Creating Vertices

```typescript
// Create a single vertex
const person = await client.query()
  .create('(p:Person {name: $name, age: $age})')
  .setParam('name', 'Alice')
  .setParam('age', 30)
  .return('p')
  .execute();

// Create multiple vertices
const people = await client.query()
  .unwind('$people', 'person')
  .create('(p:Person)')
  .set('p = person')
  .setParam('people', [
    { name: 'Bob', age: 25 },
    { name: 'Carol', age: 35 }
  ])
  .return('p')
  .execute();
```

### Querying Vertices

```typescript
// Find all vertices of a type
const allPeople = await client.query()
  .match('(p:Person)')
  .return('p')
  .execute();

// Find vertices with conditions
const adults = await client.query()
  .match('(p:Person)')
  .where('p.age >= $minAge')
  .setParam('minAge', 18)
  .return('p.name, p.age')
  .orderBy('p.age DESC')
  .execute();

// Find vertices with complex conditions
const specificPeople = await client.query()
  .match('(p:Person)')
  .where({
    'p.age': { $gte: 25, $lte: 40 },
    'p.name': { $in: ['Alice', 'Bob', 'Carol'] }
  })
  .return('p')
  .execute();
```

## Working with Edges

### Creating Relationships

```typescript
// Create a relationship between existing vertices
await client.query()
  .match('(a:Person {name: $name1})')
  .match('(b:Person {name: $name2})')
  .create('(a)-[r:KNOWS {since: $since}]->(b)')
  .setParam('name1', 'Alice')
  .setParam('name2', 'Bob')
  .setParam('since', '2020-01-01')
  .return('r')
  .execute();

// Create vertices and relationships in one query
await client.query()
  .create('(a:Person {name: $name1})')
  .create('(b:Person {name: $name2})')
  .create('(a)-[r:KNOWS]->(b)')
  .setParam('name1', 'David')
  .setParam('name2', 'Eve')
  .return('a, b, r')
  .execute();
```

### Querying Relationships

```typescript
// Find all relationships
const relationships = await client.query()
  .match('(a)-[r]->(b)')
  .return('a.name as from, type(r) as relationship, b.name as to')
  .execute();

// Find specific relationship patterns
const friends = await client.query()
  .match('(a:Person)-[r:KNOWS]->(b:Person)')
  .return('a.name as person, b.name as friend, r.since as since')
  .execute();

// Find paths
const paths = await client.query()
  .match('path = (a:Person {name: $start})-[*1..3]-(b:Person)')
  .setParam('start', 'Alice')
  .return('path, length(path) as pathLength')
  .orderBy('pathLength')
  .execute();
```

## Schema Validation

ageSchemaClient provides built-in schema validation:

```typescript
// Define a schema
const schema = {
  vertices: {
    Person: {
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 0, max: 150 },
        email: { type: 'string', format: 'email' }
      }
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'string', format: 'date' },
        strength: { type: 'number', min: 1, max: 10 }
      }
    }
  }
};

// Apply schema to client
client.setSchema(schema);

// Now all operations are validated
const person = await client.query()
  .create('(p:Person {name: $name, age: $age, email: $email})')
  .setParam('name', 'John')
  .setParam('age', 30)
  .setParam('email', 'john@example.com')
  .return('p')
  .execute(); // This will validate the data before execution
```

## Error Handling

Always wrap your database operations in try-catch blocks:

```typescript
async function safeQuery() {
  try {
    const result = await client.query()
      .match('(p:Person {name: $name})')
      .setParam('name', 'NonExistent')
      .return('p')
      .execute();

    if (result.length === 0) {
      console.log('No person found');
    } else {
      console.log('Found person:', result[0]);
    }
  } catch (error) {
    if (error.code === 'SCHEMA_VALIDATION_ERROR') {
      console.error('Schema validation failed:', error.details);
    } else if (error.code === 'CONNECTION_ERROR') {
      console.error('Database connection failed:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

## Best Practices

### 1. Use Parameters
Always use parameters instead of string concatenation:

```typescript
// ✅ Good - uses parameters
const result = await client.query()
  .match('(p:Person {name: $name})')
  .setParam('name', userInput)
  .return('p')
  .execute();

// ❌ Bad - vulnerable to injection
const result = await client.query()
  .match(`(p:Person {name: '${userInput}'})`)
  .return('p')
  .execute();
```

### 2. Use Transactions for Multiple Operations
```typescript
const transaction = await client.beginTransaction();
try {
  await transaction.query()
    .create('(p:Person {name: $name})')
    .setParam('name', 'Alice')
    .execute();

  await transaction.query()
    .create('(c:Company {name: $company})')
    .setParam('company', 'TechCorp')
    .execute();

  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 3. Close Connections Properly
```typescript
// Use try-finally or async/await with proper cleanup
try {
  await client.connect();
  // ... your operations
} finally {
  await client.disconnect();
}

// Or use the client in a managed way
await client.withConnection(async (connection) => {
  // ... your operations
  // Connection is automatically closed
});
```

## Next Steps

Now that you understand the basics:

- [Connection Configuration](./connection-config) - Advanced connection options
- [First Graph](./first-graph) - Create your first graph database
- [Basic Queries](../how-to-guides/basic-queries) - Master the query builder
- [Schema Validation](../how-to-guides/schema-validation) - Learn about schema validation
- [Batch Operations](../how-to-guides/batch-operations) - Efficient bulk operations
