# Connection Options

This document describes the connection options available in the ageSchemaClient library.

## PostgreSQL Connection Options

The ageSchemaClient library provides a set of options for configuring PostgreSQL connections. These options are available through the `pgOptions` property in the connection configuration.

### Search Path

The `searchPath` option is used to set the PostgreSQL search path for the connection. This is particularly important for Apache AGE, which requires the `ag_catalog` schema to be in the search path.

By default, the library ensures that `ag_catalog` is always included in the search path. If you provide a custom search path, the library will automatically add `ag_catalog` to the beginning of the path if it's not already included.

```typescript
// Create a connection manager with a custom search path
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  pgOptions: {
    // Custom search path with ag_catalog
    searchPath: 'ag_catalog, "$user", public, my_schema',
  },
});
```

### Other PostgreSQL Options

In addition to the search path, the following PostgreSQL-specific options are available:

- `applicationName`: Sets the application name for the connection, which can be useful for monitoring and debugging.
- `statementTimeout`: Sets the statement timeout in milliseconds.
- `queryTimeout`: Sets the query timeout in milliseconds.
- `idleInTransactionSessionTimeout`: Sets the idle in transaction session timeout in milliseconds.

```typescript
// Create a connection manager with various PostgreSQL options
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'my-application',
    statementTimeout: 30000, // 30 seconds
    queryTimeout: 10000, // 10 seconds
    idleInTransactionSessionTimeout: 60000, // 1 minute
  },
});
```

## Apache AGE Requirements

Apache AGE requires the `ag_catalog` schema to be in the search path for Cypher queries to work correctly. The ageSchemaClient library automatically ensures that `ag_catalog` is included in the search path in the following ways:

1. When creating a connection pool, the library adds `ag_catalog` to the search path if it's not already included.
2. When getting a connection from the pool, the library sets the search path for that connection.
3. When executing a Cypher query, the library ensures the search path includes `ag_catalog`.

This ensures that Apache AGE functions and types are always available, even if the user doesn't explicitly set the search path.

## Connection Pool Configuration

In addition to PostgreSQL-specific options, the library also supports standard connection pool configuration options:

```typescript
// Create a connection manager with pool configuration
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  pool: {
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 2000, // 2 seconds
    allowExitOnIdle: false, // Don't allow the pool to exit when idle
  },
});
```

## Retry Configuration

The library also supports retry configuration for connection attempts:

```typescript
// Create a connection manager with retry configuration
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  retry: {
    maxAttempts: 3, // Maximum number of retry attempts
    delay: 1000, // Initial delay in milliseconds
    maxDelay: 5000, // Maximum delay in milliseconds
    factor: 2, // Factor to increase delay between retries
    jitter: 0.1, // Jitter to add to delay between retries
  },
});
```

## SSL Configuration

The library supports SSL configuration for secure connections:

```typescript
// Create a connection manager with SSL configuration
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  ssl: {
    rejectUnauthorized: false, // Don't reject unauthorized connections
    ca: 'path/to/ca.crt', // CA certificate
    cert: 'path/to/client.crt', // Client certificate
    key: 'path/to/client.key', // Client key
  },
});
```

## Complete Example

Here's a complete example that demonstrates all the available connection options:

```typescript
import { PgConnectionManager } from 'age-schema-client';

// Create a connection manager with all available options
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  pool: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    allowExitOnIdle: false,
  },
  retry: {
    maxAttempts: 3,
    delay: 1000,
    maxDelay: 5000,
    factor: 2,
    jitter: 0.1,
  },
  ssl: {
    rejectUnauthorized: false,
    ca: 'path/to/ca.crt',
    cert: 'path/to/client.crt',
    key: 'path/to/client.key',
  },
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public, my_schema',
    applicationName: 'my-application',
    statementTimeout: 30000,
    queryTimeout: 10000,
    idleInTransactionSessionTimeout: 60000,
  },
});
```
