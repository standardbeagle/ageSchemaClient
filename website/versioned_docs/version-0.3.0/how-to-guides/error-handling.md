# Error Handling and Recovery

Learn comprehensive error handling strategies for robust Apache AGE applications using ageSchemaClient.

## Understanding Error Types

### Connection Errors

```typescript
import { ConnectionError, DatabaseError } from 'age-schema-client';

try {
  const client = new AgeSchemaClient({
    connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
    graphName: 'my_graph'
  });
  
  await client.connect();
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error('Failed to connect to database:', error.message);
    // Handle connection issues
    await handleConnectionError(error);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Query Errors

```typescript
import { QueryError, SchemaError } from 'age-schema-client';

try {
  const result = await client.query()
    .match('(p:Person)')
    .where({ name: 'Alice' })
    .return('p')
    .execute();
} catch (error) {
  if (error instanceof QueryError) {
    console.error('Query failed:', error.message);
    console.error('Query:', error.query);
    console.error('Parameters:', error.parameters);
  } else if (error instanceof SchemaError) {
    console.error('Schema validation failed:', error.message);
    console.error('Validation errors:', error.errors);
  }
}
```

### Batch Loading Errors

```typescript
import { BatchLoaderError } from 'age-schema-client';

try {
  const batchLoader = client.createBatchLoader();
  await batchLoader.load(graphData);
} catch (error) {
  if (error instanceof BatchLoaderError) {
    console.error('Batch loading failed:', error.message);
    console.error('Failed items:', error.failedItems);
    console.error('Context:', error.context);
    
    // Retry failed items individually
    await retryFailedItems(error.failedItems);
  }
}
```

## Retry Strategies

### Exponential Backoff

```typescript
class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
        
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay + jitter}ms...`);
        await this.sleep(delay + jitter);
      }
    }
    
    throw lastError!;
  }
  
  private isRetryableError(error: any): boolean {
    // Connection timeouts, temporary network issues
    if (error instanceof ConnectionError) {
      return true;
    }
    
    // Database connection issues
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // PostgreSQL specific retryable errors
    const retryableCodes = [
      '53300', // too_many_connections
      '53400', // configuration_limit_exceeded
      '08006', // connection_failure
      '08001', // sqlclient_unable_to_establish_sqlconnection
    ];
    
    return retryableCodes.includes(error.code);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const retryManager = new RetryManager();

const result = await retryManager.executeWithRetry(
  () => client.query()
    .match('(p:Person)')
    .return('p')
    .execute(),
  3, // max retries
  1000 // base delay
);
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Usage
const circuitBreaker = new CircuitBreaker(5, 60000);

try {
  const result = await circuitBreaker.execute(() =>
    client.query()
      .match('(p:Person)')
      .return('p')
      .execute()
  );
} catch (error) {
  console.error('Operation failed or circuit breaker is open:', error.message);
}
```

## Graceful Degradation

### Fallback Strategies

```typescript
class GraphService {
  constructor(
    private client: AgeSchemaClient,
    private cache: Map<string, any> = new Map()
  ) {}
  
  async getPersonWithFallback(name: string): Promise<any> {
    try {
      // Primary: Try graph database
      return await this.getPersonFromGraph(name);
    } catch (error) {
      console.warn('Graph query failed, trying cache:', error.message);
      
      try {
        // Fallback 1: Try cache
        const cached = this.cache.get(`person:${name}`);
        if (cached) {
          return cached;
        }
        
        // Fallback 2: Return minimal data
        return {
          name,
          source: 'fallback',
          message: 'Limited data available due to system issues'
        };
      } catch (fallbackError) {
        console.error('All fallbacks failed:', fallbackError);
        throw new Error('Service temporarily unavailable');
      }
    }
  }
  
  private async getPersonFromGraph(name: string): Promise<any> {
    const result = await this.client.query()
      .match('(p:Person)')
      .where({ name })
      .return('p')
      .execute();
    
    if (result.length > 0) {
      // Cache successful results
      this.cache.set(`person:${name}`, result[0]);
      return result[0];
    }
    
    throw new Error('Person not found');
  }
}
```

### Partial Failure Handling

```typescript
async function loadDataWithPartialFailures(datasets: any[][]) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as any[]
  };
  
  // Process each dataset independently
  const promises = datasets.map(async (dataset, index) => {
    try {
      const batchLoader = client.createBatchLoader();
      await batchLoader.load({
        vertices: dataset,
        edges: []
      });
      
      results.successful++;
      console.log(`Dataset ${index} loaded successfully`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        dataset: index,
        error: error.message,
        itemCount: dataset.length
      });
      
      console.error(`Dataset ${index} failed:`, error.message);
    }
  });
  
  await Promise.allSettled(promises);
  
  console.log('Loading summary:', results);
  
  // Decide whether to continue based on success rate
  const successRate = results.successful / (results.successful + results.failed);
  if (successRate < 0.5) {
    throw new Error(`Too many failures: ${results.failed}/${datasets.length} datasets failed`);
  }
  
  return results;
}
```

## Validation and Data Integrity

### Input Validation

```typescript
function validateGraphData(data: any): void {
  const errors: string[] = [];
  
  // Validate vertices
  if (data.vertices) {
    data.vertices.forEach((vertex: any, index: number) => {
      if (!vertex.label) {
        errors.push(`Vertex ${index}: Missing label`);
      }
      
      if (!vertex.properties || typeof vertex.properties !== 'object') {
        errors.push(`Vertex ${index}: Invalid properties`);
      }
      
      if (vertex.properties && !vertex.properties.id) {
        errors.push(`Vertex ${index}: Missing required 'id' property`);
      }
    });
  }
  
  // Validate edges
  if (data.edges) {
    data.edges.forEach((edge: any, index: number) => {
      if (!edge.label) {
        errors.push(`Edge ${index}: Missing label`);
      }
      
      if (!edge.from || !edge.to) {
        errors.push(`Edge ${index}: Missing from/to specification`);
      }
      
      if (edge.from && (!edge.from.label || !edge.from.properties)) {
        errors.push(`Edge ${index}: Invalid 'from' specification`);
      }
      
      if (edge.to && (!edge.to.label || !edge.to.properties)) {
        errors.push(`Edge ${index}: Invalid 'to' specification`);
      }
    });
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
}

// Usage
try {
  validateGraphData(graphData);
  await client.createBatchLoader().load(graphData);
} catch (error) {
  console.error('Data validation failed:', error.message);
  // Handle validation errors appropriately
}
```

### Transaction Rollback

```typescript
async function safeDataOperation() {
  try {
    await client.transaction(async (tx) => {
      // Multiple operations within transaction
      await tx.query()
        .create('(p:Person {name: "Alice", age: 30})')
        .execute();
      
      await tx.query()
        .create('(p:Person {name: "Bob", age: 25})')
        .execute();
      
      // This might fail
      await tx.query()
        .match('(a:Person), (b:Person)')
        .where({ 'a.name': 'Alice', 'b.name': 'Bob' })
        .create('(a)-[r:KNOWS]->(b)')
        .execute();
      
      console.log('All operations completed successfully');
    });
  } catch (error) {
    console.error('Transaction failed and was rolled back:', error.message);
    // All changes are automatically rolled back
  }
}
```

## Monitoring and Alerting

### Error Tracking

```typescript
class ErrorTracker {
  private errors: Map<string, number> = new Map();
  private errorDetails: any[] = [];
  
  track(error: Error, context?: any) {
    const errorKey = `${error.constructor.name}:${error.message}`;
    const count = this.errors.get(errorKey) || 0;
    this.errors.set(errorKey, count + 1);
    
    this.errorDetails.push({
      timestamp: new Date().toISOString(),
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
      context
    });
    
    // Keep only last 1000 errors
    if (this.errorDetails.length > 1000) {
      this.errorDetails = this.errorDetails.slice(-1000);
    }
    
    // Alert on high error rates
    if (count > 10) {
      this.alert(`High error rate detected: ${errorKey} occurred ${count} times`);
    }
  }
  
  getStats() {
    return {
      errorCounts: Object.fromEntries(this.errors),
      recentErrors: this.errorDetails.slice(-10),
      totalErrors: this.errorDetails.length
    };
  }
  
  private alert(message: string) {
    console.error('ALERT:', message);
    // Send to monitoring system, email, etc.
  }
}

// Global error tracker
const errorTracker = new ErrorTracker();

// Wrap operations with error tracking
async function trackedOperation<T>(
  operation: () => Promise<T>,
  context?: any
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    errorTracker.track(error as Error, context);
    throw error;
  }
}

// Usage
try {
  await trackedOperation(
    () => client.query().match('(p:Person)').return('p').execute(),
    { operation: 'get_all_persons' }
  );
} catch (error) {
  // Error is already tracked
  console.error('Operation failed:', error.message);
}
```

### Health Checks

```typescript
class HealthChecker {
  constructor(private client: AgeSchemaClient) {}
  
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: any[];
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check database connection
    try {
      await this.client.query().raw('SELECT 1').execute();
      checks.push({ name: 'database_connection', status: 'healthy' });
    } catch (error) {
      checks.push({ 
        name: 'database_connection', 
        status: 'unhealthy',
        error: error.message 
      });
      overallStatus = 'unhealthy';
    }
    
    // Check graph accessibility
    try {
      await this.client.query()
        .raw('SELECT * FROM ag_catalog.ag_graph LIMIT 1')
        .execute();
      checks.push({ name: 'graph_access', status: 'healthy' });
    } catch (error) {
      checks.push({ 
        name: 'graph_access', 
        status: 'degraded',
        error: error.message 
      });
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }
    
    // Check connection pool
    const pool = this.client.getPool();
    const poolHealth = pool.totalCount > 0 && pool.idleCount >= 0;
    checks.push({
      name: 'connection_pool',
      status: poolHealth ? 'healthy' : 'degraded',
      details: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    });
    
    return { status: overallStatus, checks };
  }
}

// Usage
const healthChecker = new HealthChecker(client);

setInterval(async () => {
  try {
    const health = await healthChecker.checkHealth();
    console.log('Health check:', health);
    
    if (health.status === 'unhealthy') {
      // Trigger alerts, restart services, etc.
      console.error('System is unhealthy!');
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}, 30000); // Every 30 seconds
```

## Best Practices

1. **Always wrap operations in try-catch blocks**
2. **Use specific error types** for different failure scenarios
3. **Implement retry logic** for transient failures
4. **Use circuit breakers** for external dependencies
5. **Validate input data** before processing
6. **Use transactions** for multi-step operations
7. **Monitor error rates** and patterns
8. **Implement graceful degradation** strategies
9. **Log errors with context** for debugging
10. **Test error scenarios** in your application

## Next Steps

- [Performance Optimization](./performance-optimization) - Optimize for better reliability
- [Troubleshooting](./troubleshooting) - Common issues and solutions
- [Bulk Loading](./bulk-loading) - Robust data loading strategies
