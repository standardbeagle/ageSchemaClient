# Bulk Loading Strategies

Learn efficient techniques for loading large datasets into Apache AGE using ageSchemaClient.

## Overview

Bulk loading is essential when working with large datasets. This guide covers strategies to optimize performance and memory usage.

## Basic Batch Loading

### Using the Batch Loader

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'large_graph'
});

// Create batch loader
const batchLoader = client.createBatchLoader();

// Prepare data
const graphData = {
  vertices: [
    { label: 'Person', properties: { id: 1, name: 'Alice', age: 30 } },
    { label: 'Person', properties: { id: 2, name: 'Bob', age: 25 } },
    // ... thousands more
  ],
  edges: [
    {
      label: 'KNOWS',
      from: { label: 'Person', properties: { id: 1 } },
      to: { label: 'Person', properties: { id: 2 } },
      properties: { since: '2020' }
    },
    // ... thousands more
  ]
};

// Load data
await batchLoader.load(graphData);
```

## Chunked Loading

### Processing Large Datasets in Chunks

```typescript
async function loadLargeDataset(data: any[], chunkSize: number = 1000) {
  const batchLoader = client.createBatchLoader();
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    const graphData = {
      vertices: chunk.map(item => ({
        label: item.type,
        properties: item.properties
      })),
      edges: [] // Process edges separately
    };
    
    await batchLoader.load(graphData);
    
    console.log(`Processed ${Math.min(i + chunkSize, data.length)} of ${data.length} items`);
    
    // Optional: Add delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### Memory-Efficient Streaming

```typescript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function loadFromCSV(filePath: string) {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const batchLoader = client.createBatchLoader();
  let batch: any[] = [];
  const BATCH_SIZE = 1000;

  for await (const line of rl) {
    const [id, name, age] = line.split(',');
    
    batch.push({
      label: 'Person',
      properties: { id: parseInt(id), name, age: parseInt(age) }
    });

    if (batch.length >= BATCH_SIZE) {
      await batchLoader.load({ vertices: batch, edges: [] });
      batch = [];
    }
  }

  // Process remaining items
  if (batch.length > 0) {
    await batchLoader.load({ vertices: batch, edges: [] });
  }
}
```

## Optimized Loading Patterns

### Vertices First, Then Edges

```typescript
async function loadVerticesAndEdges(vertexData: any[], edgeData: any[]) {
  const batchLoader = client.createBatchLoader();
  
  // 1. Load all vertices first
  console.log('Loading vertices...');
  await batchLoader.load({ vertices: vertexData, edges: [] });
  
  // 2. Load edges in chunks
  console.log('Loading edges...');
  const EDGE_CHUNK_SIZE = 500; // Smaller chunks for edges
  
  for (let i = 0; i < edgeData.length; i += EDGE_CHUNK_SIZE) {
    const edgeChunk = edgeData.slice(i, i + EDGE_CHUNK_SIZE);
    await batchLoader.load({ vertices: [], edges: edgeChunk });
    
    console.log(`Loaded ${Math.min(i + EDGE_CHUNK_SIZE, edgeData.length)} of ${edgeData.length} edges`);
  }
}
```

### Parallel Loading with Connection Pools

```typescript
async function parallelLoad(datasets: any[][]) {
  const promises = datasets.map(async (dataset, index) => {
    // Each parallel operation gets its own client
    const parallelClient = new AgeSchemaClient({
      connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
      graphName: 'large_graph'
    });
    
    const batchLoader = parallelClient.createBatchLoader();
    
    try {
      await batchLoader.load({
        vertices: dataset,
        edges: []
      });
      console.log(`Parallel batch ${index} completed`);
    } finally {
      await parallelClient.close();
    }
  });
  
  await Promise.all(promises);
}
```

## Data Preparation Strategies

### Pre-processing for Efficiency

```typescript
// Group data by label for better performance
function groupDataByLabel(rawData: any[]) {
  const grouped = rawData.reduce((acc, item) => {
    if (!acc[item.label]) {
      acc[item.label] = [];
    }
    acc[item.label].push(item);
    return acc;
  }, {});
  
  return grouped;
}

// Load grouped data
async function loadGroupedData(rawData: any[]) {
  const grouped = groupDataByLabel(rawData);
  const batchLoader = client.createBatchLoader();
  
  for (const [label, items] of Object.entries(grouped)) {
    console.log(`Loading ${items.length} ${label} vertices...`);
    
    await batchLoader.load({
      vertices: items as any[],
      edges: []
    });
  }
}
```

### Data Validation and Cleaning

```typescript
function validateAndCleanData(data: any[]) {
  return data
    .filter(item => {
      // Remove invalid items
      if (!item.properties || !item.properties.id) {
        console.warn(`Skipping invalid item: ${JSON.stringify(item)}`);
        return false;
      }
      return true;
    })
    .map(item => {
      // Clean and normalize data
      return {
        ...item,
        properties: {
          ...item.properties,
          // Ensure consistent data types
          id: parseInt(item.properties.id),
          name: String(item.properties.name).trim(),
          // Remove null/undefined values
          ...Object.fromEntries(
            Object.entries(item.properties).filter(([_, v]) => v != null)
          )
        }
      };
    });
}
```

## Performance Monitoring

### Progress Tracking

```typescript
class LoadingProgressTracker {
  private startTime: number;
  private totalItems: number;
  private processedItems: number = 0;

  constructor(totalItems: number) {
    this.totalItems = totalItems;
    this.startTime = Date.now();
  }

  update(itemsProcessed: number) {
    this.processedItems += itemsProcessed;
    const elapsed = Date.now() - this.startTime;
    const rate = this.processedItems / (elapsed / 1000);
    const remaining = this.totalItems - this.processedItems;
    const eta = remaining / rate;

    console.log(`Progress: ${this.processedItems}/${this.totalItems} (${(this.processedItems/this.totalItems*100).toFixed(1)}%)`);
    console.log(`Rate: ${rate.toFixed(1)} items/sec, ETA: ${eta.toFixed(0)}s`);
  }
}

// Usage
async function loadWithProgress(data: any[]) {
  const tracker = new LoadingProgressTracker(data.length);
  const CHUNK_SIZE = 1000;
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    await client.createBatchLoader().load({
      vertices: chunk,
      edges: []
    });
    
    tracker.update(chunk.length);
  }
}
```

### Memory Usage Monitoring

```typescript
function logMemoryUsage(label: string) {
  const used = process.memoryUsage();
  console.log(`${label} - Memory usage:`);
  for (let key in used) {
    console.log(`  ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
}

async function loadWithMemoryMonitoring(data: any[]) {
  logMemoryUsage('Before loading');
  
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    await client.createBatchLoader().load({
      vertices: chunk,
      edges: []
    });
    
    if (i % (CHUNK_SIZE * 10) === 0) {
      logMemoryUsage(`After ${i} items`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
  
  logMemoryUsage('After loading');
}
```

## Error Handling and Recovery

### Robust Error Handling

```typescript
async function loadWithErrorHandling(data: any[]) {
  const batchLoader = client.createBatchLoader();
  const CHUNK_SIZE = 1000;
  const failedChunks: any[] = [];
  
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    try {
      await batchLoader.load({
        vertices: chunk,
        edges: []
      });
      console.log(`Successfully loaded chunk ${i / CHUNK_SIZE + 1}`);
    } catch (error) {
      console.error(`Failed to load chunk ${i / CHUNK_SIZE + 1}:`, error);
      failedChunks.push({ chunk, index: i });
    }
  }
  
  // Retry failed chunks with smaller batch sizes
  if (failedChunks.length > 0) {
    console.log(`Retrying ${failedChunks.length} failed chunks...`);
    
    for (const { chunk, index } of failedChunks) {
      await retryChunkWithSmallerBatches(chunk, index);
    }
  }
}

async function retryChunkWithSmallerBatches(chunk: any[], originalIndex: number) {
  const SMALL_BATCH_SIZE = 100;
  
  for (let i = 0; i < chunk.length; i += SMALL_BATCH_SIZE) {
    const smallBatch = chunk.slice(i, i + SMALL_BATCH_SIZE);
    
    try {
      await client.createBatchLoader().load({
        vertices: smallBatch,
        edges: []
      });
    } catch (error) {
      console.error(`Failed to load small batch at ${originalIndex + i}:`, error);
      // Log individual items for manual inspection
      console.error('Failed items:', smallBatch);
    }
  }
}
```

## Best Practices

### Configuration Optimization

```typescript
// Optimized client configuration for bulk loading
const bulkLoadClient = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'large_graph',
  poolConfig: {
    max: 20,           // Increase connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  }
});
```

### Transaction Management

```typescript
async function loadInTransactions(data: any[]) {
  const TRANSACTION_SIZE = 5000;
  
  for (let i = 0; i < data.length; i += TRANSACTION_SIZE) {
    const chunk = data.slice(i, i + TRANSACTION_SIZE);
    
    await client.transaction(async (tx) => {
      const batchLoader = tx.createBatchLoader();
      await batchLoader.load({
        vertices: chunk,
        edges: []
      });
    });
    
    console.log(`Committed transaction for items ${i} to ${i + chunk.length}`);
  }
}
```

## Next Steps

- [Performance Optimization](./performance-optimization) - Query and system optimization
- [Relational to Graph](./relational-to-graph) - Data transformation strategies
- [Error Handling](./error-handling) - Comprehensive error management
