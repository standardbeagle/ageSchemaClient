# Apache AGE Schema Client

A TypeScript client library for working with Apache AGE graph databases with schema validation and type safety.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Schema Definition](#schema-definition)
- [Vertex Operations](#vertex-operations)
- [Edge Operations](#edge-operations)
- [Queries](#queries)
- [Transactions](#transactions)
- [Batch Operations](#batch-operations)
- [Schema Evolution](#schema-evolution)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [API Reference](#api-reference)

## Installation

```bash
npm install age-schema-client
# or
yarn add age-schema-client
# or
pnpm add age-schema-client
```

## Quick Start

```typescript
import {
  PgConnectionManager,
  QueryExecutor,
  VertexOperations,
  EdgeOperations,
  SQLGenerator
} from 'age-schema-client';

// Define your schema
const schema = {
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' }
      },
      required: ['name', 'email']
    },
    Movie: {
      properties: {
        title: { type: 'string' },
        year: { type: 'integer' },
        genre: { type: 'string' }
      },
      required: ['title']
    }
  },
  edges: {
    ACTED_IN: {
      properties: {
        role: { type: 'string' },
        salary: { type: 'number' }
      },
      fromVertex: 'Person',
      toVertex: 'Movie',
      required: ['role']
    }
  }
};

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

// Create a vertex
const person = await vertexOperations.createVertex('Person', {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
});

// Create another vertex
const movie = await vertexOperations.createVertex('Movie', {
  title: 'The Matrix',
  year: 1999,
  genre: 'Sci-Fi'
});

// Create an edge between vertices
const actedIn = await edgeOperations.createEdge('ACTED_IN', person, movie, {
  role: 'Neo',
  salary: 1000000
});

// Release the connection
connection.release();

// Close all connections
await connectionManager.closeAll();
```

## Core Concepts

The Apache AGE Schema Client is built around several core concepts:

1. **Schema Definition**: A strongly-typed definition of your graph structure
2. **Vertex Operations**: Methods for creating, reading, updating, and deleting vertices
3. **Edge Operations**: Methods for creating, reading, updating, and deleting edges
4. **Queries**: Executing Cypher queries with type safety
5. **Transactions**: Managing database transactions
6. **Batch Operations**: Efficiently working with large datasets
7. **Schema Evolution**: Managing schema changes over time

For more detailed information, see the individual sections below.

## Schema Definition

See [Schema Definition](./schema-definition.md) for detailed documentation.

## Vertex Operations

See [Vertex Operations](./vertex-operations.md) for detailed documentation.

## Edge Operations

See [Edge Operations](./edge-operations.md) for detailed documentation.

## Queries

See [Queries](./queries.md) for detailed documentation.

## Transactions

See [Transactions](./transactions.md) for detailed documentation.

## Batch Operations

The BatchLoader is a specialized component designed to efficiently load large volumes of graph data into Apache AGE graph databases. It uses a temporary table approach to minimize transactions and improve performance, making it ideal for loading large datasets.

Key features of the BatchLoader include:

- **Efficient Loading**: Uses a temporary table approach to minimize transactions and improve performance
- **Schema Validation**: Validates data against a schema before loading
- **Batch Processing**: Processes data in configurable batches to optimize memory usage and performance
- **Transaction Management**: Manages transactions to ensure data consistency
- **Error Handling**: Provides comprehensive error handling and reporting
- **Progress Reporting**: Reports progress during loading operations
- **Configurable**: Offers various configuration options to customize the loading process

For detailed documentation, see:
- [BatchLoader Documentation](./batch-loader.md)
- [Optimized BatchLoader Documentation](./optimized-batch-loader.md)
- [Performance Testing and Optimization](./performance-testing.md)

## Schema Evolution

See [Schema Evolution](./schema-evolution.md) for detailed documentation.

## Error Handling

See [Error Handling](./error-handling.md) for detailed documentation.

## Examples

See the [examples](../examples) directory for complete examples.

## API Reference

For detailed API documentation, see the [API Reference](./api-reference.md).

## Contributing

We welcome contributions to improve our documentation! See our [Contributing Guidelines](./contributing/README.md) for information on:

- [Documentation Guidelines](./contributing/documentation-guidelines.md) - How to update and maintain documentation
- [Style Guide](./contributing/style-guide.md) - Writing and formatting standards
- [Templates](./contributing/templates/) - Templates for different types of content
- [Build and Deployment](./contributing/build-deployment.md) - Technical setup and deployment process
- [Quality Assurance](./contributing/quality-assurance.md) - Review checklist and testing procedures

## License

Apache License 2.0
