# AgeSchemaClient

The main client class for interacting with Apache AGE graph databases.

## Constructor

```typescript
new AgeSchemaClient(config: ConnectionConfig)
```

### Parameters

- `config` - Connection configuration object

### ConnectionConfig Interface

```typescript
interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  graph?: string;
  ssl?: boolean | SSLConfig;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
}
```

## Methods

### query()

Creates a new query builder instance.

```typescript
query(): QueryBuilder
```

**Returns:** A new `QueryBuilder` instance for constructing Cypher queries.

**Example:**
```typescript
const result = await client.query()
  .match('(p:Person)')
  .where({ name: 'John' })
  .return('p')
  .execute();
```

### batch()

Creates a new batch loader instance for efficient data loading.

```typescript
batch(): BatchLoader
```

**Returns:** A new `BatchLoader` instance for batch operations.

**Example:**
```typescript
const loader = client.batch();
await loader.loadVertices([
  { label: 'Person', properties: { name: 'Alice', age: 30 } },
  { label: 'Person', properties: { name: 'Bob', age: 25 } }
]);
```

### schema()

Access schema validation and management functionality.

```typescript
schema(): SchemaManager
```

**Returns:** A `SchemaManager` instance for schema operations.

**Example:**
```typescript
const schema = client.schema();
await schema.validate(myGraphData);
```

### transaction()

Start a new database transaction.

```typescript
transaction(): Promise<Transaction>
```

**Returns:** A `Transaction` instance for transactional operations.

**Example:**
```typescript
const tx = await client.transaction();
try {
  await tx.query().create('(p:Person {name: "Alice"})').execute();
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

### connect()

Establish connection to the database.

```typescript
connect(): Promise<void>
```

**Returns:** Promise that resolves when connection is established.

### disconnect()

Close the database connection.

```typescript
disconnect(): Promise<void>
```

**Returns:** Promise that resolves when connection is closed.

### isConnected()

Check if the client is currently connected.

```typescript
isConnected(): boolean
```

**Returns:** `true` if connected, `false` otherwise.

## Properties

### config

Read-only access to the connection configuration.

```typescript
readonly config: ConnectionConfig
```

### graph

The current graph name being used.

```typescript
readonly graph: string | undefined
```

## Events

The client extends EventEmitter and emits the following events:

### 'connect'

Emitted when a connection is established.

```typescript
client.on('connect', () => {
  console.log('Connected to database');
});
```

### 'disconnect'

Emitted when the connection is closed.

```typescript
client.on('disconnect', () => {
  console.log('Disconnected from database');
});
```

### 'error'

Emitted when an error occurs.

```typescript
client.on('error', (error) => {
  console.error('Database error:', error);
});
```

## Example Usage

```typescript
import { AgeSchemaClient } from 'age-schema-client';

// Create client
const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'myuser',
  password: 'mypassword',
  graph: 'mygraph'
});

// Connect
await client.connect();

// Query data
const people = await client.query()
  .match('(p:Person)')
  .where({ age: { $gte: 18 } })
  .return('p.name, p.age')
  .execute();

// Load data
const loader = client.batch();
await loader.loadVertices([
  { label: 'Person', properties: { name: 'Charlie', age: 35 } }
]);

// Disconnect
await client.disconnect();
```

## See Also

- [QueryBuilder](./query-builder) - Building and executing queries
- [BatchLoader](./batch-loader) - Batch data operations
- [SchemaManager](./schema-manager) - Schema validation and management
- [Transaction](./transaction) - Transactional operations
