# Basic Queries

Learn how to perform common graph database queries using ageSchemaClient's query builder.

## Simple Vertex Queries

### Finding All Vertices

```typescript
// Get all vertices
const allVertices = await client.query()
  .match('(n)')
  .return('n')
  .execute();
```

### Finding Vertices by Label

```typescript
// Get all Person vertices
const people = await client.query()
  .match('(p:Person)')
  .return('p')
  .execute();
```

### Finding Vertices by Properties

```typescript
// Find person by name
const john = await client.query()
  .match('(p:Person)')
  .where({ name: 'John' })
  .return('p')
  .execute();

// Find people over 25
const adults = await client.query()
  .match('(p:Person)')
  .where({ age: { $gte: 25 } })
  .return('p.name, p.age')
  .execute();
```

## Edge Queries

### Finding Relationships

```typescript
// Find all relationships
const relationships = await client.query()
  .match('(a)-[r]->(b)')
  .return('a, r, b')
  .execute();

// Find specific relationship types
const friendships = await client.query()
  .match('(a:Person)-[r:KNOWS]->(b:Person)')
  .return('a.name, b.name, r.since')
  .execute();
```

### Following Paths

```typescript
// Find friends of friends
const friendsOfFriends = await client.query()
  .match('(p:Person)-[:KNOWS]->(friend)-[:KNOWS]->(fof)')
  .where({ 'p.name': 'Alice' })
  .return('fof.name')
  .execute();

// Variable length paths
const connections = await client.query()
  .match('(a:Person)-[:KNOWS*1..3]->(b:Person)')
  .where({ 'a.name': 'Alice' })
  .return('b.name, length(path) as distance')
  .execute();
```

## Creating Data

### Creating Vertices

```typescript
// Create a single vertex
await client.query()
  .create('(p:Person {name: "Alice", age: 30})')
  .execute();

// Create with parameters
await client.query()
  .create('(p:Person)')
  .setParam('name', 'Bob')
  .setParam('age', 25)
  .execute();
```

### Creating Edges

```typescript
// Create relationship between existing vertices
await client.query()
  .match('(a:Person), (b:Person)')
  .where({ 'a.name': 'Alice', 'b.name': 'Bob' })
  .create('(a)-[r:KNOWS {since: "2023"}]->(b)')
  .execute();

// Create vertices and relationship in one query
await client.query()
  .create(`
    (a:Person {name: "Charlie", age: 35}),
    (b:Person {name: "Diana", age: 28}),
    (a)-[r:KNOWS {since: "2024"}]->(b)
  `)
  .execute();
```

## Updating Data

### Updating Properties

```typescript
// Update a single property
await client.query()
  .match('(p:Person)')
  .where({ name: 'Alice' })
  .set({ 'p.age': 31 })
  .execute();

// Update multiple properties
await client.query()
  .match('(p:Person)')
  .where({ name: 'Bob' })
  .set({ 
    'p.age': 26,
    'p.city': 'New York'
  })
  .execute();
```

### Adding Labels

```typescript
// Add additional label
await client.query()
  .match('(p:Person)')
  .where({ name: 'Alice' })
  .set('p:Employee')
  .execute();
```

## Deleting Data

### Deleting Vertices

```typescript
// Delete vertex (and its relationships)
await client.query()
  .match('(p:Person)')
  .where({ name: 'Alice' })
  .detachDelete('p')
  .execute();
```

### Deleting Relationships

```typescript
// Delete specific relationships
await client.query()
  .match('(a:Person)-[r:KNOWS]->(b:Person)')
  .where({ 'a.name': 'Alice', 'b.name': 'Bob' })
  .delete('r')
  .execute();
```

## Aggregation Queries

### Counting

```typescript
// Count vertices
const personCount = await client.query()
  .match('(p:Person)')
  .return('count(p) as total')
  .execute();

// Count relationships
const relationshipCount = await client.query()
  .match('()-[r:KNOWS]->()')
  .return('count(r) as friendships')
  .execute();
```

### Grouping

```typescript
// Group by property
const ageGroups = await client.query()
  .match('(p:Person)')
  .return('p.age, count(p) as count')
  .groupBy('p.age')
  .orderBy('p.age')
  .execute();
```

## Conditional Logic

### Using CASE

```typescript
// Conditional values
const ageCategories = await client.query()
  .match('(p:Person)')
  .return(`
    p.name,
    CASE 
      WHEN p.age < 18 THEN 'Minor'
      WHEN p.age < 65 THEN 'Adult'
      ELSE 'Senior'
    END as category
  `)
  .execute();
```

### Optional Matches

```typescript
// Optional relationships
const peopleWithOptionalFriends = await client.query()
  .match('(p:Person)')
  .optionalMatch('(p)-[:KNOWS]->(friend)')
  .return('p.name, collect(friend.name) as friends')
  .execute();
```

## Performance Tips

### Use Indexes

```typescript
// Create index for better performance
await client.query()
  .raw('CREATE INDEX FOR (p:Person) ON (p.name)')
  .execute();
```

### Limit Results

```typescript
// Limit and skip for pagination
const page1 = await client.query()
  .match('(p:Person)')
  .return('p')
  .orderBy('p.name')
  .limit(10)
  .execute();

const page2 = await client.query()
  .match('(p:Person)')
  .return('p')
  .orderBy('p.name')
  .skip(10)
  .limit(10)
  .execute();
```

## Next Steps

- [Advanced Queries](./advanced-queries) - Complex patterns and optimizations
- [Batch Operations](./batch-operations) - Efficient data loading
- [Schema Validation](./schema-validation) - Ensuring data integrity
