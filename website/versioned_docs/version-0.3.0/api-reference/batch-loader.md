# BatchLoader

Efficient batch loading for large datasets.

## Overview

```typescript
const loader = client.batch();

await loader.loadVertices([
  { label: 'Person', properties: { name: 'Alice', age: 30 } },
  { label: 'Person', properties: { name: 'Bob', age: 25 } }
]);
```

## Methods

### loadVertices(vertices: VertexData[])

Load multiple vertices efficiently.

### loadEdges(edges: EdgeData[])

Load multiple edges efficiently.

### setBatchSize(size: number)

Configure batch processing size.

### on(event: string, callback: Function)

Listen for progress events.

## Examples

See [Batch Operations](../how-to-guides/batch-operations) for detailed examples.
