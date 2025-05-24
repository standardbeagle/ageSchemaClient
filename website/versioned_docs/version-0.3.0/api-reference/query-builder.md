# QueryBuilder

The QueryBuilder provides a fluent API for constructing type-safe Cypher queries.

## Overview

```typescript
const query = client.query()
  .match('(p:Person)')
  .where({ age: { $gte: 18 } })
  .return('p.name, p.age')
  .orderBy('p.age DESC')
  .limit(10);

const results = await query.execute();
```

## Methods

### match(pattern: string)

Add a MATCH clause to the query.

```typescript
query.match('(p:Person)')
query.match('(p:Person)-[r:KNOWS]->(f:Person)')
```

### where(conditions: object | string)

Add WHERE conditions to the query.

```typescript
// Object syntax
query.where({ name: 'Alice', age: { $gte: 18 } })

// String syntax
query.where('p.age > 18 AND p.city = "New York"')
```

### create(pattern: string)

Add a CREATE clause.

```typescript
query.create('(p:Person {name: "Alice", age: 30})')
```

### return(fields: string)

Specify what to return from the query.

```typescript
query.return('p.name, p.age')
query.return('count(p) as total')
```

### orderBy(field: string)

Add ordering to the results.

```typescript
query.orderBy('p.name')
query.orderBy('p.age DESC')
```

### limit(count: number)

Limit the number of results.

```typescript
query.limit(10)
```

### skip(count: number)

Skip a number of results (for pagination).

```typescript
query.skip(20)
```

### execute()

Execute the query and return results.

```typescript
const results = await query.execute();
```

## Parameter Management

### setParam(key: string, value: any)

Set a parameter for the query.

```typescript
query
  .match('(p:Person)')
  .where('p.name = $name')
  .setParam('name', 'Alice')
```

## Advanced Features

### Raw Cypher

For complex queries, you can use raw Cypher:

```typescript
query.raw(`
  MATCH (p:Person)-[:KNOWS*1..3]-(friend)
  WHERE p.name = $name
  RETURN DISTINCT friend.name
`).setParam('name', 'Alice')
```

### Query Optimization

The QueryBuilder automatically optimizes queries for Apache AGE.

## Examples

See [Basic Queries](../how-to-guides/basic-queries) for comprehensive examples.
