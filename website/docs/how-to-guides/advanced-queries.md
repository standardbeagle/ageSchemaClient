# Advanced Queries

Complex query patterns and optimization techniques.

## Path Queries

```typescript
// Variable length paths
const paths = await client.query()
  .match('(a:Person)-[:KNOWS*1..3]->(b:Person)')
  .where({ 'a.name': 'Alice' })
  .return('b.name, length(path) as distance')
  .execute();
```

## Aggregations

```typescript
// Complex aggregations
const stats = await client.query()
  .match('(p:Person)')
  .return('avg(p.age) as avg_age, count(p) as total')
  .execute();
```

## Transactions

```typescript
const tx = await client.transaction();
try {
  await tx.query().create('(p:Person {name: "Alice"})').execute();
  await tx.query().create('(p:Person {name: "Bob"})').execute();
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

## Performance Optimization

Tips for optimizing query performance with Apache AGE.
