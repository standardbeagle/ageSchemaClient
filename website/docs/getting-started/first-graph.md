# Your First Graph

Create and populate your first graph database using ageSchemaClient.

## Creating a Graph

First, create a new graph in your Apache AGE database:

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password'
});

await client.connect();

// Create a new graph
await client.createGraph('my_first_graph');

// Switch to the new graph
client.useGraph('my_first_graph');
```

## Adding Vertices

Let's add some people to our graph:

```typescript
// Add individual vertices
await client.query()
  .create('(p:Person {name: "Alice", age: 30, city: "New York"})')
  .execute();

await client.query()
  .create('(p:Person {name: "Bob", age: 25, city: "San Francisco"})')
  .execute();

await client.query()
  .create('(p:Person {name: "Charlie", age: 35, city: "Chicago"})')
  .execute();
```

## Adding Relationships

Now let's connect our people with relationships:

```typescript
// Alice knows Bob
await client.query()
  .match('(a:Person {name: "Alice"}), (b:Person {name: "Bob"})')
  .create('(a)-[r:KNOWS {since: "2020", relationship: "friend"}]->(b)')
  .execute();

// Bob knows Charlie
await client.query()
  .match('(b:Person {name: "Bob"}), (c:Person {name: "Charlie"})')
  .create('(b)-[r:KNOWS {since: "2019", relationship: "colleague"}]->(c)')
  .execute();
```

## Querying Your Graph

Now let's query our graph to see what we've created:

```typescript
// Get all people
const people = await client.query()
  .match('(p:Person)')
  .return('p.name, p.age, p.city')
  .execute();

console.log('People in our graph:', people);

// Find relationships
const relationships = await client.query()
  .match('(a:Person)-[r:KNOWS]->(b:Person)')
  .return('a.name as from, b.name as to, r.since, r.relationship')
  .execute();

console.log('Relationships:', relationships);

// Find Alice's friends
const aliceFriends = await client.query()
  .match('(alice:Person {name: "Alice"})-[:KNOWS]->(friend)')
  .return('friend.name, friend.city')
  .execute();

console.log("Alice's friends:", aliceFriends);
```

## Batch Loading

For larger datasets, use the batch loader:

```typescript
const loader = client.batch();

// Load multiple vertices at once
await loader.loadVertices([
  { label: 'Person', properties: { name: 'David', age: 28, city: 'Boston' } },
  { label: 'Person', properties: { name: 'Eve', age: 32, city: 'Seattle' } },
  { label: 'Person', properties: { name: 'Frank', age: 29, city: 'Austin' } }
]);

// Load relationships
await loader.loadEdges([
  {
    from: { label: 'Person', properties: { name: 'David' } },
    to: { label: 'Person', properties: { name: 'Eve' } },
    label: 'KNOWS',
    properties: { since: '2021', relationship: 'friend' }
  }
]);
```

## Next Steps

Congratulations! You've created your first graph database. Now you can:

- [Learn more query patterns](../how-to-guides/basic-queries)
- [Explore batch operations](../how-to-guides/batch-operations)
- [Set up schema validation](../how-to-guides/schema-validation)
- [Check out the API reference](../api-reference/client)
