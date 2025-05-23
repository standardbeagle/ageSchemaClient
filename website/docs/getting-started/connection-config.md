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

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('ca-certificate.crt').toString(),
    key: fs.readFileSync('client-key.key').toString(),
    cert: fs.readFileSync('client-cert.crt').toString(),
  }
});
```

### Connection Pool Settings

```typescript
const client = new AgeSchemaClient({
  // ... basic config
  max: 20,                    // Maximum number of connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
});
```

## Environment Variables

Use environment variables for production deployments:

```bash
# .env
AGE_HOST=localhost
AGE_PORT=5432
AGE_DATABASE=production_db
AGE_USER=app_user
AGE_PASSWORD=secure_password
AGE_GRAPH=main_graph
AGE_SSL=true
AGE_MAX_CONNECTIONS=20
```

```typescript
const client = new AgeSchemaClient({
  host: process.env.AGE_HOST,
  port: parseInt(process.env.AGE_PORT || '5432'),
  database: process.env.AGE_DATABASE,
  user: process.env.AGE_USER,
  password: process.env.AGE_PASSWORD,
  graph: process.env.AGE_GRAPH,
  ssl: process.env.AGE_SSL === 'true',
  max: parseInt(process.env.AGE_MAX_CONNECTIONS || '10'),
});
```

## Next Steps

- [First Graph](./first-graph) - Create your first graph
- [Basic Queries](../how-to-guides/basic-queries) - Start querying data
