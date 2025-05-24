# Performance Optimization

Learn how to optimize your Apache AGE graph database queries and operations for maximum performance.

## Query Optimization

### Use Indexes Effectively

```typescript
// Create indexes for frequently queried properties
await client.query()
  .raw('CREATE INDEX FOR (p:Person) ON (p.name)')
  .execute();

await client.query()
  .raw('CREATE INDEX FOR (p:Person) ON (p.email)')
  .execute();

// Composite indexes for multi-property queries
await client.query()
  .raw('CREATE INDEX FOR (p:Person) ON (p.age, p.city)')
  .execute();
```

### Optimize MATCH Patterns

```typescript
// ❌ Inefficient: No labels specified
const inefficient = await client.query()
  .match('(a)-[r]->(b)')
  .where({ 'a.name': 'Alice' })
  .return('b')
  .execute();

// ✅ Efficient: Labels specified
const efficient = await client.query()
  .match('(a:Person)-[r:KNOWS]->(b:Person)')
  .where({ 'a.name': 'Alice' })
  .return('b')
  .execute();

// ✅ Even better: Use indexed properties first
const optimized = await client.query()
  .match('(a:Person)')
  .where({ 'a.name': 'Alice' })  // Indexed property first
  .match('(a)-[r:KNOWS]->(b:Person)')
  .return('b')
  .execute();
```

### Limit Result Sets

```typescript
// Always use LIMIT for large result sets
const limitedResults = await client.query()
  .match('(p:Person)')
  .return('p')
  .orderBy('p.name')
  .limit(100)
  .execute();

// Use SKIP for pagination
const page2 = await client.query()
  .match('(p:Person)')
  .return('p')
  .orderBy('p.name')
  .skip(100)
  .limit(100)
  .execute();
```

### Optimize Path Queries

```typescript
// ❌ Inefficient: Unbounded path
const unbounded = await client.query()
  .match('(a:Person)-[:KNOWS*]->(b:Person)')
  .where({ 'a.name': 'Alice' })
  .return('b')
  .execute();

// ✅ Efficient: Bounded path
const bounded = await client.query()
  .match('(a:Person)-[:KNOWS*1..3]->(b:Person)')
  .where({ 'a.name': 'Alice' })
  .return('b')
  .execute();

// ✅ Even better: Use shortest path when appropriate
const shortestPath = await client.query()
  .match('path = shortestPath((a:Person)-[:KNOWS*]->(b:Person))')
  .where({ 'a.name': 'Alice', 'b.name': 'Bob' })
  .return('path')
  .execute();
```

## Connection Pool Optimization

### Configure Pool Settings

```typescript
const optimizedClient = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'my_graph',
  poolConfig: {
    max: 20,                    // Maximum connections
    min: 5,                     // Minimum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Timeout for new connections
    acquireTimeoutMillis: 60000,    // Timeout for acquiring connection
    createTimeoutMillis: 30000,     // Timeout for creating connection
    destroyTimeoutMillis: 5000,     // Timeout for destroying connection
    reapIntervalMillis: 1000,       // How often to check for idle connections
    createRetryIntervalMillis: 200, // Retry interval for failed connections
    propagateCreateError: false     // Don't fail fast on connection errors
  }
});
```

### Monitor Pool Health

```typescript
// Monitor connection pool metrics
function logPoolStats() {
  const pool = client.getPool();
  console.log('Pool Stats:', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
}

// Set up periodic monitoring
setInterval(logPoolStats, 30000); // Every 30 seconds
```

## Batch Operations

### Optimize Batch Sizes

```typescript
// Test different batch sizes to find optimal performance
async function findOptimalBatchSize(data: any[]) {
  const batchSizes = [100, 500, 1000, 2000, 5000];
  const results: { size: number; time: number }[] = [];
  
  for (const batchSize of batchSizes) {
    const startTime = Date.now();
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await client.createBatchLoader().load({
        vertices: batch,
        edges: []
      });
    }
    
    const endTime = Date.now();
    results.push({ size: batchSize, time: endTime - startTime });
    
    console.log(`Batch size ${batchSize}: ${endTime - startTime}ms`);
  }
  
  // Find optimal batch size
  const optimal = results.reduce((min, current) => 
    current.time < min.time ? current : min
  );
  
  console.log(`Optimal batch size: ${optimal.size} (${optimal.time}ms)`);
  return optimal.size;
}
```

### Parallel Processing

```typescript
// Process multiple batches in parallel
async function parallelBatchLoad(data: any[], batchSize: number = 1000) {
  const chunks = [];
  for (let i = 0; i < data.length; i += batchSize) {
    chunks.push(data.slice(i, i + batchSize));
  }
  
  // Process chunks in parallel (limit concurrency)
  const CONCURRENCY_LIMIT = 5;
  
  for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
    const parallelChunks = chunks.slice(i, i + CONCURRENCY_LIMIT);
    
    await Promise.all(
      parallelChunks.map(async (chunk) => {
        const batchLoader = client.createBatchLoader();
        await batchLoader.load({
          vertices: chunk,
          edges: []
        });
      })
    );
    
    console.log(`Processed ${Math.min(i + CONCURRENCY_LIMIT, chunks.length)} of ${chunks.length} batches`);
  }
}
```

## Query Caching

### Implement Query Result Caching

```typescript
class QueryCache {
  private cache = new Map<string, { result: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(query: string, params: any): string {
    return `${query}:${JSON.stringify(params)}`;
  }

  get(query: string, params: any): any | null {
    const key = this.getCacheKey(query, params);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result;
    }
    
    this.cache.delete(key);
    return null;
  }

  set(query: string, params: any, result: any): void {
    const key = this.getCacheKey(query, params);
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Usage
const queryCache = new QueryCache();

async function cachedQuery(query: string, params: any = {}) {
  const cached = queryCache.get(query, params);
  if (cached) {
    console.log('Cache hit');
    return cached;
  }
  
  console.log('Cache miss - executing query');
  const result = await client.query()
    .raw(query)
    .setParams(params)
    .execute();
  
  queryCache.set(query, params, result);
  return result;
}
```

## Memory Management

### Optimize Large Result Sets

```typescript
// Stream large result sets instead of loading all into memory
async function* streamLargeResults(query: string) {
  const BATCH_SIZE = 1000;
  let offset = 0;
  
  while (true) {
    const batch = await client.query()
      .raw(`${query} SKIP ${offset} LIMIT ${BATCH_SIZE}`)
      .execute();
    
    if (batch.length === 0) break;
    
    for (const row of batch) {
      yield row;
    }
    
    offset += BATCH_SIZE;
  }
}

// Usage
for await (const person of streamLargeResults('MATCH (p:Person) RETURN p')) {
  // Process one person at a time
  console.log(person);
}
```

### Garbage Collection Optimization

```typescript
// Force garbage collection periodically during large operations
async function loadWithGC(data: any[]) {
  const BATCH_SIZE = 1000;
  const GC_INTERVAL = 10; // Run GC every 10 batches
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    await client.createBatchLoader().load({
      vertices: batch,
      edges: []
    });
    
    // Trigger garbage collection periodically
    if ((i / BATCH_SIZE) % GC_INTERVAL === 0 && global.gc) {
      global.gc();
      console.log(`GC triggered after batch ${i / BATCH_SIZE}`);
    }
  }
}
```

## Database Configuration

### PostgreSQL Optimization

```sql
-- Optimize PostgreSQL settings for graph workloads
-- Add to postgresql.conf

-- Memory settings
shared_buffers = '256MB'              -- 25% of RAM
effective_cache_size = '1GB'          -- 75% of RAM
work_mem = '16MB'                     -- Per operation memory
maintenance_work_mem = '64MB'         -- For maintenance operations

-- Connection settings
max_connections = 100                 -- Adjust based on your needs

-- Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = '16MB'
checkpoint_timeout = '10min'

-- Query planner settings
random_page_cost = 1.1               -- For SSD storage
effective_io_concurrency = 200       -- For SSD storage

-- Logging (for performance analysis)
log_min_duration_statement = 1000    -- Log slow queries (>1s)
log_statement = 'none'               -- Don't log all statements
log_duration = off
```

### Apache AGE Configuration

```sql
-- Load AGE extension with optimized settings
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Create graph with optimized settings
SELECT create_graph('optimized_graph');

-- Analyze tables regularly for better query plans
ANALYZE ag_catalog.ag_graph;
ANALYZE ag_catalog.ag_label;
```

## Monitoring and Profiling

### Query Performance Analysis

```typescript
// Wrapper to measure query performance
async function profileQuery(queryFn: () => Promise<any>, label: string) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  try {
    const result = await queryFn();
    
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    console.log(`${label}:`);
    console.log(`  Duration: ${duration.toFixed(2)}ms`);
    console.log(`  Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Result count: ${Array.isArray(result) ? result.length : 1}`);
    
    return result;
  } catch (error) {
    console.error(`${label} failed:`, error);
    throw error;
  }
}

// Usage
const result = await profileQuery(
  () => client.query()
    .match('(p:Person)-[:KNOWS]->(f:Person)')
    .return('p.name, f.name')
    .execute(),
  'Friends query'
);
```

### System Resource Monitoring

```typescript
// Monitor system resources during operations
class ResourceMonitor {
  private interval: NodeJS.Timeout | null = null;
  
  start(intervalMs: number = 5000) {
    this.interval = setInterval(() => {
      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();
      
      console.log('Resource Usage:', {
        memory: {
          rss: `${(memory.rss / 1024 / 1024).toFixed(2)}MB`,
          heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)}MB`
        },
        cpu: {
          user: `${(cpu.user / 1000).toFixed(2)}ms`,
          system: `${(cpu.system / 1000).toFixed(2)}ms`
        }
      });
    }, intervalMs);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// Usage
const monitor = new ResourceMonitor();
monitor.start();

// ... perform operations ...

monitor.stop();
```

## Best Practices Summary

1. **Always use labels** in MATCH clauses
2. **Create indexes** for frequently queried properties
3. **Limit result sets** with LIMIT and SKIP
4. **Bound path queries** to prevent infinite traversals
5. **Use appropriate batch sizes** for bulk operations
6. **Monitor connection pool** health
7. **Cache frequently used queries**
8. **Stream large result sets** to manage memory
9. **Profile queries** to identify bottlenecks
10. **Optimize PostgreSQL configuration** for your workload

## Next Steps

- [Bulk Loading](./bulk-loading) - Efficient data loading strategies
- [Error Handling](./error-handling) - Robust error management
- [Troubleshooting](./troubleshooting) - Common issues and solutions
