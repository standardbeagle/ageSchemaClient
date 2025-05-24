# Batch Operations

Efficient loading of large datasets into Apache AGE.

## Batch Loading Vertices

```typescript
const loader = client.batch();

const vertices = [
  { label: 'Person', properties: { name: 'Alice', age: 30 } },
  { label: 'Person', properties: { name: 'Bob', age: 25 } },
  // ... thousands more
];

await loader.loadVertices(vertices);
```

## Batch Loading Edges

```typescript
const edges = [
  {
    from: { label: 'Person', properties: { name: 'Alice' } },
    to: { label: 'Person', properties: { name: 'Bob' } },
    label: 'KNOWS',
    properties: { since: '2020' }
  }
];

await loader.loadEdges(edges);
```

## Progress Monitoring

```typescript
loader.on('progress', (progress) => {
  console.log(`${progress.completed}/${progress.total} (${progress.percentage}%)`);
});
```

## Performance Tuning

Configure batch size and parallel processing for optimal performance.
