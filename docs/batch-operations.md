# Batch Operations

The Batch Operations module provides optimized methods for working with large datasets in Apache AGE. It includes features for bulk creation of vertices and edges, performance monitoring, and transaction management.

## Overview

When working with large datasets, using individual operations can be inefficient. The Batch Operations module provides methods for:

- Creating multiple vertices in a single operation
- Creating multiple edges in a single operation
- Using temporary tables for very large batches
- Chunking large operations into smaller batches
- Collecting performance metrics

## BatchLoader

For very large datasets, the ageSchemaClient library provides a specialized BatchLoader component designed to efficiently load large volumes of graph data into Apache AGE graph databases. It uses a temporary table approach to minimize transactions and improve performance.

Key features of the BatchLoader include:

- **Efficient Loading**: Uses a temporary table approach to minimize transactions and improve performance
- **Schema Validation**: Validates data against a schema before loading
- **Batch Processing**: Processes data in configurable batches to optimize memory usage and performance
- **Transaction Management**: Manages transactions to ensure data consistency
- **Error Handling**: Provides comprehensive error handling and reporting
- **Progress Reporting**: Reports progress during loading operations
- **Configurable**: Offers various configuration options to customize the loading process

For detailed documentation on the BatchLoader, see:
- [BatchLoader Documentation](./batch-loader.md)
- [Optimized BatchLoader Documentation](./optimized-batch-loader.md)
- [Performance Testing and Optimization](./performance-testing.md)

## Setup

To use batch operations, you need to create a `BatchOperations` instance:

```typescript
import {
  PgConnectionManager,
  QueryExecutor,
  VertexOperations,
  EdgeOperations,
  BatchOperations,
  SQLGenerator
} from 'age-schema-client';

// Create a connection
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// Get a connection from the pool
const connection = await connectionManager.getConnection();

// Create a query executor
const queryExecutor = new QueryExecutor(connection);

// Create a SQL generator
const sqlGenerator = new SQLGenerator(schema);

// Create vertex and edge operations
const vertexOperations = new VertexOperations(schema, queryExecutor, sqlGenerator);
const edgeOperations = new EdgeOperations(schema, queryExecutor, sqlGenerator, vertexOperations);

// Create batch operations
const batchOperations = new BatchOperations(
  schema,
  queryExecutor,
  sqlGenerator,
  vertexOperations,
  edgeOperations
);
```

## Creating Vertices in Batch

To create multiple vertices in a single operation:

```typescript
// Prepare vertex data
const people = [
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
  { name: 'Charlie', age: 35, email: 'charlie@example.com' },
  // ... more vertices
];

// Create vertices in batch
const createdPeople = await batchOperations.createVerticesBatch('Person', people, {
  batchSize: 1000, // Optional: Number of vertices per batch
  useTempTables: true, // Optional: Use temporary tables for very large batches
  collectMetrics: true, // Optional: Collect performance metrics
});

console.log(`Created ${createdPeople.length} people`);
```

## Creating Edges in Batch

To create multiple edges in a single operation:

```typescript
// Prepare edge data
const friendships = [
  {
    fromVertex: person1,
    toVertex: person2,
    data: { since: new Date('2020-01-01'), strength: 5 }
  },
  {
    fromVertex: person2,
    toVertex: person3,
    data: { since: new Date('2021-01-01'), strength: 3 }
  },
  // ... more edges
];

// Create edges in batch
const createdFriendships = await batchOperations.createEdgesBatch('KNOWS', friendships, {
  batchSize: 1000, // Optional: Number of edges per batch
  useTempTables: true, // Optional: Use temporary tables for very large batches
  collectMetrics: true, // Optional: Collect performance metrics
});

console.log(`Created ${createdFriendships.length} friendships`);
```

## Batch Operation Options

The batch operations accept the following options:

```typescript
interface BatchOperationOptions {
  /**
   * Batch size for chunking large operations
   * @default 1000
   */
  batchSize?: number;

  /**
   * Whether to use temporary tables for bulk operations
   * @default true
   */
  useTempTables?: boolean;

  /**
   * Whether to collect performance metrics
   * @default false
   */
  collectMetrics?: boolean;

  /**
   * Transaction to use for the batch operation
   * If not provided, a new transaction will be created
   */
  transaction?: Transaction;
}
```

## Performance Metrics

When `collectMetrics` is set to `true`, the batch operations will collect performance metrics:

```typescript
interface BatchPerformanceMetrics {
  /**
   * Total operation duration in milliseconds
   */
  totalDuration: number;

  /**
   * SQL generation duration in milliseconds
   */
  sqlGenerationDuration: number;

  /**
   * Database execution duration in milliseconds
   */
  dbExecutionDuration: number;

  /**
   * Validation duration in milliseconds
   */
  validationDuration: number;

  /**
   * Number of items processed
   */
  itemCount: number;

  /**
   * Number of batches processed
   */
  batchCount: number;

  /**
   * Items processed per second
   */
  itemsPerSecond: number;
}
```

## Using Transactions

You can provide a transaction to ensure that all batch operations are atomic:

```typescript
// Begin a transaction
const transaction = await queryExecutor.beginTransaction();

try {
  // Create vertices in batch
  const createdPeople = await batchOperations.createVerticesBatch('Person', people, {
    transaction
  });

  // Create edges in batch
  const createdFriendships = await batchOperations.createEdgesBatch('KNOWS', friendships, {
    transaction
  });

  // Commit the transaction
  await transaction.commit();
} catch (error) {
  // Rollback the transaction on error
  await transaction.rollback();
  throw error;
}
```

## Optimizations

The batch operations module includes several optimizations:

1. **Chunking**: Large batches are automatically split into smaller chunks to avoid memory issues.
2. **Temporary Tables**: For very large batches, temporary tables can be used for more efficient bulk loading.
3. **COPY Command**: The PostgreSQL COPY command is used for efficient data loading when temporary tables are used.
4. **Validation**: All data is validated against the schema before being sent to the database.

## Example

Here's a complete example of using batch operations:

```typescript
// Create 1000 people
const people = Array(1000).fill(0).map((_, i) => ({
  name: `Person ${i}`,
  age: 20 + (i % 50),
  email: `person${i}@example.com`,
  active: i % 3 === 0,
}));

console.time('Create people');
const createdPeople = await batchOperations.createVerticesBatch('Person', people, {
  batchSize: 200,
  collectMetrics: true,
});
console.timeEnd('Create people');
console.log(`Created ${createdPeople.length} people`);

// Create 10 companies
const companies = Array(10).fill(0).map((_, i) => ({
  name: `Company ${i}`,
  industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][i % 5],
  founded: new Date(1980 + i * 5, 0, 1),
  employees: 100 * (i + 1),
}));

console.time('Create companies');
const createdCompanies = await batchOperations.createVerticesBatch('Company', companies);
console.timeEnd('Create companies');
console.log(`Created ${createdCompanies.length} companies`);

// Create employment relationships
const employmentEdges = createdPeople.slice(0, 500).map((person, i) => ({
  fromVertex: person,
  toVertex: createdCompanies[i % createdCompanies.length],
  data: {
    since: new Date(2010 + (i % 10), (i % 12), 1),
    position: ['Engineer', 'Manager', 'Director', 'VP', 'CEO'][i % 5],
    salary: 50000 + (i % 10) * 10000,
  },
}));

console.time('Create employment edges');
const createdEmploymentEdges = await batchOperations.createEdgesBatch('WORKS_AT', employmentEdges, {
  batchSize: 100,
  collectMetrics: true,
});
console.timeEnd('Create employment edges');
console.log(`Created ${createdEmploymentEdges.length} employment relationships`);
```

## Next Steps

- [BatchLoader Documentation](./batch-loader.md)
- [Optimized BatchLoader Documentation](./optimized-batch-loader.md)
- [Performance Testing and Optimization](./performance-testing.md)
- [Transactions](./transactions.md)
- [Schema Evolution](./schema-evolution.md)
- [Error Handling](./error-handling.md)
