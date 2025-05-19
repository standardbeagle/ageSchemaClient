# Getting Started with ageSchemaClient

This guide will help you get started with the ageSchemaClient library for working with Apache AGE graph databases.

## Installation

```bash
npm install age-schema-client
```

or

```bash
yarn add age-schema-client
```

or

```bash
pnpm add age-schema-client
```

## Prerequisites

- PostgreSQL with Apache AGE extension installed
- Node.js 14 or later

## Basic Setup

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
```

## Working with Vertices

```typescript
// Create a vertex
const person = await vertexOperations.createVertex('Person', {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
});

// Get a vertex by ID
const retrievedPerson = await vertexOperations.getVertex('Person', person.id);

// Update a vertex
const updatedPerson = await vertexOperations.updateVertex('Person', person.id, {
  age: 31
});

// Delete a vertex
await vertexOperations.deleteVertex('Person', person.id);
```

## Working with Edges

```typescript
// Create vertices
const person = await vertexOperations.createVertex('Person', {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
});

const movie = await vertexOperations.createVertex('Movie', {
  title: 'The Matrix',
  year: 1999,
  genre: 'Sci-Fi'
});

// Create an edge
const actedIn = await edgeOperations.createEdge('ACTED_IN', person, movie, {
  role: 'Neo',
  salary: 1000000
});

// Get an edge by ID
const retrievedEdge = await edgeOperations.getEdge('ACTED_IN', actedIn.id);

// Update an edge
const updatedEdge = await edgeOperations.updateEdge('ACTED_IN', actedIn.id, {
  salary: 1500000
});

// Delete an edge
await edgeOperations.deleteEdge('ACTED_IN', actedIn.id);
```

## Working with Queries

```typescript
// Execute a Cypher query
const result = await queryExecutor.executeCypher('my_graph', `
  MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
  WHERE p.name = 'John Doe'
  RETURN p, r, m
`);

// Use the query builder
const queryBuilder = new QueryBuilder(schema, queryExecutor, 'my_graph');

const result = await queryBuilder
  .match('Person', 'p')
  .done()
  .match('Movie', 'm')
  .done()
  .match('p', 'ACTED_IN', 'm', 'r')
  .done()
  .where('p.name = "John Doe"')
  .return('p, r, m')
  .execute();
```

## Working with Batch Operations

For small to medium-sized batches, you can use the BatchOperations class:

```typescript
import { BatchOperations } from 'age-schema-client';

// Create batch operations
const batchOperations = new BatchOperations(
  schema,
  queryExecutor,
  sqlGenerator,
  vertexOperations,
  edgeOperations
);

// Create vertices in batch
const people = [
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
  { name: 'Charlie', age: 35, email: 'charlie@example.com' }
];

const createdPeople = await batchOperations.createVerticesBatch('Person', people);
```

## Working with the BatchLoader

For large datasets, you can use the BatchLoader:

```typescript
import { createBatchLoader } from 'age-schema-client/loader';

// Create a batch loader
const batchLoader = createBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'my_graph',
  validateBeforeLoad: true,
  defaultBatchSize: 1000,
  schemaName: 'age_schema_client'
});

// Define your graph data
const graphData = {
  vertices: {
    Person: [
      { id: 'p1', name: 'Alice', age: 30, email: 'alice@example.com' },
      { id: 'p2', name: 'Bob', age: 25, email: 'bob@example.com' },
      { id: 'p3', name: 'Charlie', age: 35, email: 'charlie@example.com' }
    ],
    Movie: [
      { id: 'm1', title: 'The Matrix', year: 1999, genre: 'Sci-Fi' },
      { id: 'm2', title: 'Inception', year: 2010, genre: 'Sci-Fi' }
    ]
  },
  edges: {
    ACTED_IN: [
      { from: 'p1', to: 'm1', role: 'Trinity', salary: 1000000 },
      { from: 'p2', to: 'm1', role: 'Neo', salary: 1500000 },
      { from: 'p3', to: 'm2', role: 'Arthur', salary: 2000000 }
    ]
  }
};

// Load the graph data
const result = await batchLoader.loadGraphData(graphData);
console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
```

## Working with Transactions

```typescript
// Begin a transaction
const transaction = await queryExecutor.beginTransaction();

try {
  // Perform operations within the transaction
  const person = await vertexOperations.createVertex('Person', {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com'
  }, { transaction });

  const movie = await vertexOperations.createVertex('Movie', {
    title: 'The Matrix',
    year: 1999,
    genre: 'Sci-Fi'
  }, { transaction });

  const actedIn = await edgeOperations.createEdge('ACTED_IN', person, movie, {
    role: 'Neo',
    salary: 1000000
  }, { transaction });

  // Commit the transaction
  await transaction.commit();
} catch (error) {
  // Rollback the transaction on error
  await transaction.rollback();
  throw error;
}
```

## Next Steps

Now that you have a basic understanding of the ageSchemaClient library, you can explore the following topics:

- [Schema Definition](./schema-definition.md)
- [Vertex Operations](./vertex-operations.md)
- [Edge Operations](./edge-operations.md)
- [Queries](./queries.md)
- [Transactions](./transactions.md)
- [Batch Operations](./batch-operations.md)
- [BatchLoader Documentation](./batch-loader.md)
- [Optimized BatchLoader Documentation](./optimized-batch-loader.md)
- [Performance Testing and Optimization](./performance-testing.md)
- [Schema Evolution](./schema-evolution.md)
- [Error Handling](./error-handling.md)
