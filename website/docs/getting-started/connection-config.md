# Connection Configuration

Advanced configuration options for connecting to Apache AGE databases.

## Basic Configuration

```typescript
const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  graph: 'your_graph'
});
```

## Advanced Options

### SSL Configuration

For secure connections to your PostgreSQL database:

```typescript
import fs from 'fs';

const client = new AgeSchemaClient({
  // ... basic config
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('ca-certificate.crt').toString(),
    key: fs.readFileSync('client-key.key').toString(),
    cert: fs.readFileSync('client-cert.crt').toString(),
  }
});
```

#### SSL Options

| Option | Type | Description |
|--------|------|-------------|
| `rejectUnauthorized` | boolean | Whether to reject unauthorized certificates (default: true) |
| `ca` | string | Certificate Authority certificate |
| `key` | string | Client private key |
| `cert` | string | Client certificate |
| `passphrase` | string | Passphrase for the private key |
| `servername` | string | Server name for SNI |

#### SSL for Cloud Providers

**AWS RDS:**
```typescript
const client = new AgeSchemaClient({
  // ... basic config
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('rds-ca-2019-root.pem').toString(),
  }
});
```

**Google Cloud SQL:**
```typescript
const client = new AgeSchemaClient({
  // ... basic config
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('server-ca.pem').toString(),
    key: fs.readFileSync('client-key.pem').toString(),
    cert: fs.readFileSync('client-cert.pem').toString(),
  }
});
```

### Connection Pool Settings

Configure connection pooling for optimal performance:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  pool: {
    min: 2,                     // Minimum number of connections
    max: 20,                    // Maximum number of connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Connection timeout
    acquireTimeoutMillis: 60000,   // Time to wait for connection
    createTimeoutMillis: 30000,    // Time to wait for connection creation
    destroyTimeoutMillis: 5000,    // Time to wait for connection destruction
    reapIntervalMillis: 1000,      // How often to check for idle connections
    createRetryIntervalMillis: 200, // Delay between connection creation attempts
    propagateCreateError: false     // Whether to propagate connection creation errors
  }
});
```

#### Pool Configuration Guidelines

**Development:**
```typescript
pool: {
  min: 1,
  max: 5,
  idleTimeoutMillis: 10000
}
```

**Production:**
```typescript
pool: {
  min: 5,
  max: 50,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 60000
}
```

**High-Traffic Applications:**
```typescript
pool: {
  min: 10,
  max: 100,
  idleTimeoutMillis: 60000,
  acquireTimeoutMillis: 30000
}
```

### Query Configuration

Configure query execution behavior:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  query: {
    timeout: 30000,           // Query timeout in milliseconds
    maxRetries: 3,            // Number of retry attempts
    retryDelay: 1000,         // Delay between retries
    enableQueryLogging: true, // Log all queries (development only)
    enableParameterLogging: false, // Log query parameters (security risk)
  }
});
```

### Schema Configuration

Configure schema validation and management:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  schema: {
    strict: true,             // Enforce strict schema validation
    autoCreate: false,        // Automatically create missing labels
    validateOnWrite: true,    // Validate data before writing
    validateOnRead: false,    // Validate data after reading
    cacheSchemas: true,       // Cache schema definitions
    schemaCacheTTL: 300000,   // Schema cache TTL (5 minutes)
  }
});
```

### Transaction Configuration

Configure transaction behavior:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  transaction: {
    isolationLevel: 'READ_COMMITTED', // Transaction isolation level
    timeout: 60000,                   // Transaction timeout
    maxRetries: 3,                    // Retry failed transactions
    retryDelay: 1000,                 // Delay between retries
  }
});
```

### Logging Configuration

Configure logging for debugging and monitoring:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  logging: {
    level: 'info',            // Log level: 'error', 'warn', 'info', 'debug'
    queries: false,           // Log all queries (performance impact)
    parameters: false,        // Log query parameters (security risk)
    connections: true,        // Log connection events
    transactions: true,       // Log transaction events
    performance: true,        // Log performance metrics
    logger: console,          // Custom logger instance
  }
});
```

### Custom Logger

Use a custom logger for better integration:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'age-client.log' })
  ]
});

const client = new AgeSchemaClient({
  // ... basic config
  logging: {
    logger: logger,
    level: 'debug'
  }
});
```

## Environment Variables

Use environment variables for production deployments:

```bash
# .env file
AGE_HOST=localhost
AGE_PORT=5432
AGE_DATABASE=production_db
AGE_USER=app_user
AGE_PASSWORD=secure_password
AGE_GRAPH=main_graph

# SSL Configuration
AGE_SSL=true
AGE_SSL_CA_PATH=/path/to/ca-cert.pem
AGE_SSL_KEY_PATH=/path/to/client-key.pem
AGE_SSL_CERT_PATH=/path/to/client-cert.pem

# Pool Configuration
AGE_POOL_MIN=5
AGE_POOL_MAX=50
AGE_POOL_IDLE_TIMEOUT=30000
AGE_POOL_CONNECTION_TIMEOUT=2000

# Query Configuration
AGE_QUERY_TIMEOUT=30000
AGE_QUERY_MAX_RETRIES=3
AGE_QUERY_RETRY_DELAY=1000

# Logging Configuration
AGE_LOG_LEVEL=info
AGE_LOG_QUERIES=false
AGE_LOG_PARAMETERS=false
```

```typescript
import fs from 'fs';

const client = new AgeSchemaClient({
  host: process.env.AGE_HOST,
  port: parseInt(process.env.AGE_PORT || '5432'),
  database: process.env.AGE_DATABASE,
  user: process.env.AGE_USER,
  password: process.env.AGE_PASSWORD,
  graph: process.env.AGE_GRAPH,

  ssl: process.env.AGE_SSL === 'true' ? {
    rejectUnauthorized: true,
    ca: process.env.AGE_SSL_CA_PATH ? fs.readFileSync(process.env.AGE_SSL_CA_PATH).toString() : undefined,
    key: process.env.AGE_SSL_KEY_PATH ? fs.readFileSync(process.env.AGE_SSL_KEY_PATH).toString() : undefined,
    cert: process.env.AGE_SSL_CERT_PATH ? fs.readFileSync(process.env.AGE_SSL_CERT_PATH).toString() : undefined,
  } : false,

  pool: {
    min: parseInt(process.env.AGE_POOL_MIN || '2'),
    max: parseInt(process.env.AGE_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.AGE_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.AGE_POOL_CONNECTION_TIMEOUT || '2000'),
  },

  query: {
    timeout: parseInt(process.env.AGE_QUERY_TIMEOUT || '30000'),
    maxRetries: parseInt(process.env.AGE_QUERY_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.AGE_QUERY_RETRY_DELAY || '1000'),
  },

  logging: {
    level: process.env.AGE_LOG_LEVEL || 'info',
    queries: process.env.AGE_LOG_QUERIES === 'true',
    parameters: process.env.AGE_LOG_PARAMETERS === 'true',
  }
});
```

### Environment-Specific Configurations

**Development (.env.development):**
```bash
AGE_HOST=localhost
AGE_PORT=5432
AGE_DATABASE=dev_db
AGE_USER=dev_user
AGE_PASSWORD=dev_password
AGE_GRAPH=dev_graph
AGE_SSL=false
AGE_POOL_MIN=1
AGE_POOL_MAX=5
AGE_LOG_LEVEL=debug
AGE_LOG_QUERIES=true
```

**Testing (.env.test):**
```bash
AGE_HOST=localhost
AGE_PORT=5433
AGE_DATABASE=test_db
AGE_USER=test_user
AGE_PASSWORD=test_password
AGE_GRAPH=test_graph
AGE_SSL=false
AGE_POOL_MIN=1
AGE_POOL_MAX=3
AGE_LOG_LEVEL=error
AGE_LOG_QUERIES=false
```

**Production (.env.production):**
```bash
AGE_HOST=prod-db.example.com
AGE_PORT=5432
AGE_DATABASE=production_db
AGE_USER=app_user
AGE_PASSWORD=${SECURE_PASSWORD}
AGE_GRAPH=main_graph
AGE_SSL=true
AGE_SSL_CA_PATH=/etc/ssl/certs/ca-cert.pem
AGE_POOL_MIN=10
AGE_POOL_MAX=100
AGE_QUERY_TIMEOUT=60000
AGE_LOG_LEVEL=warn
AGE_LOG_QUERIES=false
AGE_LOG_PARAMETERS=false
```

## Connection Validation

Always validate your connection configuration:

```typescript
async function validateConnection(client: AgeSchemaClient) {
  try {
    // Test basic connectivity
    await client.connect();
    console.log('✅ Database connection successful');

    // Test AGE extension
    const result = await client.query()
      .raw('SELECT age_version()')
      .execute();
    console.log('✅ Apache AGE extension available');

    // Test graph access
    const graphResult = await client.query()
      .match('(n)')
      .return('count(n) as node_count')
      .limit(1)
      .execute();
    console.log('✅ Graph access successful');

    // Test schema operations
    const schema = await client.getSchema();
    console.log('✅ Schema operations working');

    return true;
  } catch (error) {
    console.error('❌ Connection validation failed:', error.message);
    return false;
  } finally {
    await client.disconnect();
  }
}

// Usage
const isValid = await validateConnection(client);
if (!isValid) {
  process.exit(1);
}
```

## Performance Tuning

### Connection Pool Optimization

Monitor and tune your connection pool:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  pool: {
    min: 5,
    max: 50,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 60000,

    // Performance monitoring
    onConnect: (connection) => {
      console.log('New connection established');
    },
    onDisconnect: (connection) => {
      console.log('Connection closed');
    },
    onAcquire: (connection) => {
      console.log('Connection acquired from pool');
    },
    onRelease: (connection) => {
      console.log('Connection returned to pool');
    }
  }
});

// Monitor pool statistics
setInterval(() => {
  const stats = client.getPoolStats();
  console.log('Pool stats:', {
    total: stats.total,
    idle: stats.idle,
    waiting: stats.waiting
  });
}, 30000);
```

### Query Performance

Optimize query performance:

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  query: {
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,

    // Performance settings
    enableQueryCache: true,
    queryCacheSize: 1000,
    queryCacheTTL: 300000, // 5 minutes

    // Monitoring
    onQueryStart: (query) => {
      console.time(`Query: ${query.id}`);
    },
    onQueryEnd: (query, result) => {
      console.timeEnd(`Query: ${query.id}`);
      console.log(`Returned ${result.length} rows`);
    },
    onQueryError: (query, error) => {
      console.error(`Query failed: ${query.id}`, error);
    }
  }
});
```

## Security Best Practices

### Secure Configuration

```typescript
const client = new AgeSchemaClient({
  // Use environment variables for sensitive data
  host: process.env.AGE_HOST,
  user: process.env.AGE_USER,
  password: process.env.AGE_PASSWORD,

  // Enable SSL in production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.AGE_SSL_CA_PATH).toString(),
  } : false,

  // Secure logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    queries: process.env.NODE_ENV !== 'production',
    parameters: false, // Never log parameters in production
  },

  // Connection limits
  pool: {
    max: parseInt(process.env.AGE_POOL_MAX || '20'),
    acquireTimeoutMillis: 30000, // Prevent connection exhaustion
  }
});
```

### Connection String Security

Never expose sensitive information in connection strings:

```typescript
// ❌ Bad - exposes credentials
const badClient = new AgeSchemaClient({
  connectionString: 'postgresql://user:password@host:5432/database'
});

// ✅ Good - uses environment variables
const goodClient = new AgeSchemaClient({
  host: process.env.AGE_HOST,
  user: process.env.AGE_USER,
  password: process.env.AGE_PASSWORD,
  database: process.env.AGE_DATABASE
});
```

## Troubleshooting

### Common Connection Issues

**Connection Timeout:**
```typescript
// Increase timeout values
const client = new AgeSchemaClient({
  // ... config
  pool: {
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 60000
  }
});
```

**SSL Certificate Issues:**
```typescript
// For development, you might need to disable SSL verification
const client = new AgeSchemaClient({
  // ... config
  ssl: process.env.NODE_ENV === 'development' ? {
    rejectUnauthorized: false
  } : true
});
```

**Pool Exhaustion:**
```typescript
// Monitor and adjust pool settings
const client = new AgeSchemaClient({
  // ... config
  pool: {
    max: 50,
    acquireTimeoutMillis: 30000,
    onPoolError: (error) => {
      console.error('Pool error:', error);
    }
  }
});
```

## Next Steps

Now that you have your connection configured:

- [First Graph](./first-graph) - Create your first graph database
- [Basic Usage](./basic-usage) - Learn the fundamentals
- [Query Builder Guide](../how-to-guides/query-builder) - Master query building
- [Performance Optimization](../how-to-guides/performance) - Optimize your application
- [Monitoring and Logging](../how-to-guides/monitoring) - Monitor your database operations
