# Connection Pool Architecture

This document describes the connection pool management system in ageSchemaClient, including design decisions, implementation details, and best practices.

## Overview

The connection pool system provides efficient, reliable database connectivity with:
- Automatic connection lifecycle management
- Extension initialization on connection creation
- Health monitoring and error recovery
- Resource cleanup and graceful shutdown
- Configurable pool sizing and behavior

## Architecture Components

### 1. Connection Pool Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                 PgConnectionManager                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Pool Config    │  │  Hook System    │  │  Health Monitor │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Pool                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Connection    │  │   Connection    │  │   Connection    │ │
│  │   Wrapper       │  │   Wrapper       │  │   Wrapper       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Server                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Connection Wrapper

Each connection is wrapped with additional functionality:

```typescript
class PgConnection implements Connection {
  private client: PoolClient;
  private manager: PgConnectionManager;
  private state: ConnectionState;
  private lastQuery?: string;
  private lastQueryTime?: number;
  
  constructor(client: PoolClient, manager: PgConnectionManager) {
    this.client = client;
    this.manager = manager;
    this.state = ConnectionState.IDLE;
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    try {
      this.state = ConnectionState.ACTIVE;
      this.lastQuery = text;
      this.lastQueryTime = Date.now();
      
      const result = await this.client.query(text, params);
      this.state = ConnectionState.IDLE;
      return result;
    } catch (error) {
      this.state = ConnectionState.ERROR;
      await this.manager.triggerHook('onError', this, {
        type: 'error',
        state: this.state,
        timestamp: Date.now(),
        error: error as Error,
        data: { query: text, params }
      });
      throw error;
    }
  }
}
```

## Configuration

### 1. Basic Configuration

```typescript
interface ConnectionConfig {
  // Connection parameters
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
  
  // Pool configuration
  pool?: {
    max?: number;                    // Maximum connections (default: 10)
    idleTimeoutMillis?: number;      // Idle timeout (default: 30000)
    connectionTimeoutMillis?: number; // Connection timeout (default: 2000)
    allowExitOnIdle?: boolean;       // Allow process exit when idle
  };
  
  // Extension hooks
  onConnectionCreate?: (connection: Connection) => Promise<void>;
  beforeConnect?: (config: ConnectionConfig) => Promise<void>;
  onError?: (connection: Connection, event: ConnectionEvent) => Promise<void>;
  
  // Retry configuration
  retry?: {
    maxAttempts?: number;            // Maximum retry attempts (default: 3)
    initialDelay?: number;           // Initial delay in ms (default: 1000)
    maxDelay?: number;               // Maximum delay in ms (default: 10000)
    backoffFactor?: number;          // Backoff multiplier (default: 2)
  };
}
```

### 2. Advanced Configuration

```typescript
const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost/db',
  pool: {
    max: 20,                         // Higher concurrency
    idleTimeoutMillis: 60000,        // Longer idle timeout
    connectionTimeoutMillis: 5000,   // Longer connection timeout
    allowExitOnIdle: false           // Keep pool alive
  },
  retry: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 30000,
    backoffFactor: 1.5
  },
  onConnectionCreate: async (connection) => {
    // Initialize extensions
    await connection.query("LOAD 'age'");
    await connection.query("CREATE EXTENSION IF NOT EXISTS vector");
    await connection.query("SET search_path = ag_catalog, vector, public");
    
    // Create application-specific setup
    await connection.query(`
      CREATE TABLE IF NOT EXISTS age_params (
        key TEXT PRIMARY KEY,
        value JSONB
      )
    `);
  }
});
```

## Connection Lifecycle

### 1. Connection Creation Flow

```
┌─────────────────┐
│  Request        │
│  Connection     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  beforeConnect  │
│  Hook           │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Create Pool    │
│  Connection     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ onConnectionCreate │
│  Hook           │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Connection     │
│  Ready          │
└─────────────────┘
```

### 2. Connection States

```typescript
enum ConnectionState {
  IDLE = 'idle',           // Available for use
  ACTIVE = 'active',       // Currently executing query
  ERROR = 'error',         // Error state, needs recovery
  CLOSED = 'closed'        // Connection closed
}
```

### 3. State Transitions

```
     ┌─────────┐
     │  IDLE   │◀─────────────────┐
     └────┬────┘                  │
          │                       │
          │ query()               │ query complete
          ▼                       │
     ┌─────────┐                  │
     │ ACTIVE  │──────────────────┘
     └────┬────┘
          │
          │ error
          ▼
     ┌─────────┐
     │ ERROR   │
     └────┬────┘
          │
          │ close()
          ▼
     ┌─────────┐
     │ CLOSED  │
     └─────────┘
```

## Pool Management

### 1. Singleton Pattern

```typescript
// Singleton connection manager for application-wide use
let instance: PgConnectionManager | null = null;

export function getConnectionManager(config: ConnectionConfig): PgConnectionManager {
  if (!instance) {
    console.log('Creating singleton connection manager...');
    instance = new PgConnectionManager(config);
    
    // Register cleanup handler
    process.on('exit', () => {
      if (instance) {
        try {
          instance.pool.end();
        } catch (error) {
          console.error('Error closing connection pool:', error);
        }
      }
    });
  }
  
  return instance;
}
```

### 2. Pool Monitoring

```typescript
interface PoolStatus {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingClients: number;
}

class PgConnectionManager {
  getPoolStatus(): PoolStatus {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      waitingClients: this.pool.waitingCount
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      return true;
    } catch {
      return false;
    }
  }
}
```

## Error Handling and Recovery

### 1. Connection Error Recovery

```typescript
class PgConnectionManager {
  async getConnection(): Promise<Connection> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...this.config.retry };
    let attempts = 0;
    let lastError: Error;
    
    while (attempts < retryConfig.maxAttempts!) {
      try {
        const client = await this.pool.connect();
        const connection = new PgConnection(client, this);
        
        // Trigger connection ready hook
        await this.triggerHook('onConnectionReady', connection, {
          type: 'ready',
          state: ConnectionState.IDLE,
          timestamp: Date.now()
        });
        
        return connection;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts < retryConfig.maxAttempts!) {
          const delay = Math.min(
            retryConfig.initialDelay! * Math.pow(retryConfig.backoffFactor!, attempts - 1),
            retryConfig.maxDelay!
          );
          
          console.warn(`Connection attempt ${attempts} failed, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new ConnectionError(
      `Failed to get connection after ${attempts} attempts: ${lastError.message}`,
      lastError
    );
  }
}
```

### 2. Pool Recovery

```typescript
class PgConnectionManager {
  async recoverPool(): Promise<void> {
    console.log('Attempting pool recovery...');
    
    try {
      // Close all connections
      await this.closeAll();
      
      // Recreate pool
      this.pool = this.createPool(this.config);
      
      // Test new pool
      const testConnection = await this.getConnection();
      await testConnection.query('SELECT 1');
      testConnection.release();
      
      console.log('Pool recovery successful');
    } catch (error) {
      console.error('Pool recovery failed:', error);
      throw error;
    }
  }
}
```

## Performance Optimization

### 1. Connection Reuse

```typescript
class ConnectionPool {
  private connectionCache = new Map<string, Connection>();
  
  async getOptimizedConnection(key: string): Promise<Connection> {
    // Try to reuse connection for same operation type
    const cached = this.connectionCache.get(key);
    if (cached && cached.state === ConnectionState.IDLE) {
      return cached;
    }
    
    // Get new connection and cache it
    const connection = await this.getConnection();
    this.connectionCache.set(key, connection);
    return connection;
  }
}
```

### 2. Batch Connection Management

```typescript
class BatchConnectionManager {
  async withConnections<T>(
    count: number,
    operation: (connections: Connection[]) => Promise<T>
  ): Promise<T> {
    const connections: Connection[] = [];
    
    try {
      // Acquire multiple connections
      for (let i = 0; i < count; i++) {
        connections.push(await this.getConnection());
      }
      
      // Execute operation
      return await operation(connections);
    } finally {
      // Release all connections
      await Promise.all(
        connections.map(conn => conn.release())
      );
    }
  }
}
```

## Testing Support

### 1. Test Pool Configuration

```typescript
export function createTestConnectionManager(): PgConnectionManager {
  return new PgConnectionManager({
    connectionString: process.env.TEST_DATABASE_URL,
    pool: {
      max: 5,                      // Smaller pool for tests
      idleTimeoutMillis: 1000,     // Quick cleanup
      allowExitOnIdle: true        // Allow test process to exit
    },
    onConnectionCreate: async (connection) => {
      // Minimal setup for tests
      await connection.query("LOAD 'age'");
      await connection.query("SET search_path = ag_catalog, public");
    }
  });
}
```

### 2. Connection Mocking

```typescript
class MockConnection implements Connection {
  private queries: Array<{ sql: string; params?: any[]; result: any }> = [];
  
  mockQuery(sql: string, params: any[], result: any): void {
    this.queries.push({ sql, params, result });
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    const mock = this.queries.find(q => 
      q.sql === text && JSON.stringify(q.params) === JSON.stringify(params)
    );
    
    if (mock) {
      return mock.result;
    }
    
    throw new Error(`Unexpected query: ${text}`);
  }
}
```

## Best Practices

### 1. Pool Sizing
- Start with 10 connections for most applications
- Scale based on concurrent user load
- Monitor pool utilization and adjust accordingly

### 2. Connection Lifecycle
- Always release connections after use
- Use try/finally blocks for guaranteed cleanup
- Implement proper error handling

### 3. Extension Management
- Initialize extensions once per connection
- Cache extension availability checks
- Handle extension failures gracefully

### 4. Monitoring
- Track pool metrics (active, idle, waiting)
- Monitor connection errors and recovery
- Set up alerts for pool exhaustion

This connection pool architecture provides a robust foundation for database connectivity while supporting the complex requirements of Apache AGE and other PostgreSQL extensions.
