# BatchLoader Documentation

## Overview

The BatchLoader is a specialized component of the ageSchemaClient library designed to efficiently load large volumes of graph data into Apache AGE graph databases. It uses a temporary table approach to minimize transactions and improve performance, making it ideal for loading large datasets.

## Features

- **Efficient Loading**: Uses a temporary table approach to minimize transactions and improve performance
- **Schema Validation**: Validates data against a schema before loading
- **Batch Processing**: Processes data in configurable batches to optimize memory usage and performance
- **Transaction Management**: Manages transactions to ensure data consistency
- **Error Handling**: Provides comprehensive error handling and reporting
- **Progress Reporting**: Reports progress during loading operations
- **Configurable**: Offers various configuration options to customize the loading process

## Installation

The BatchLoader is part of the ageSchemaClient library. To install the library, use npm or yarn:

```bash
npm install age-schema-client
```

or

```bash
yarn add age-schema-client
```

## Usage

### Basic Usage

```typescript
import { createBatchLoader } from 'age-schema-client/loader';
import { QueryExecutor } from 'age-schema-client/db';
import { PgConnectionManager } from 'age-schema-client/db';

// Define your schema
const schema = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' }
      }
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' }
      }
    }
  }
};

// Create a connection manager
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'my_database',
  user: 'my_user',
  password: 'my_password',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient',
  },
});

// Create a query executor
const queryExecutor = new QueryExecutor(connectionManager);

// Create a batch loader
const batchLoader = createBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'my_graph',
  validateBeforeLoad: true,
  defaultBatchSize: 1000,
  schemaName: 'age_schema_client'
});

// Define your graph data
const graphData = {
  vertices: {
    Person: [
      { id: 'p1', name: 'Alice', age: 30 },
      { id: 'p2', name: 'Bob', age: 25 }
    ],
    Company: [
      { id: 'c1', name: 'Acme Inc.', founded: 1990 }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: 'p1', to: 'c1', since: 2015, position: 'Manager' },
      { from: 'p2', to: 'c1', since: 2018, position: 'Developer' }
    ],
    KNOWS: [
      { from: 'p1', to: 'p2', since: 2010 }
    ]
  }
};

// Load the graph data
batchLoader.loadGraphData(graphData)
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```

### Advanced Usage

```typescript
// Load graph data with custom options
batchLoader.loadGraphData(graphData, {
  graphName: 'custom_graph',
  batchSize: 500,
  validateBeforeLoad: true,
  continueOnError: false,
  transactionTimeout: 120000,
  debug: true,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.phase} ${progress.type} - ${progress.processed}/${progress.total} (${progress.percentage}%)`);
  }
})
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
    if (error.context) {
      console.error('Error context:', error.context);
    }
  });
```

### Validating Graph Data

```typescript
// Validate graph data without loading it
batchLoader.validateGraphData(graphData)
  .then(result => {
    if (result.isValid) {
      console.log('Graph data is valid');
    } else {
      console.error('Graph data is invalid:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }
  })
  .catch(error => {
    console.error('Error validating graph data:', error);
  });
```

## API Reference

### `createBatchLoader(schema, queryExecutor, options)`

Creates a new BatchLoader instance.

#### Parameters

- `schema` (SchemaDefinition): The schema definition for the graph data.
- `queryExecutor` (QueryExecutor): The query executor to use for database operations.
- `options` (BatchLoaderOptions, optional): Configuration options for the BatchLoader.

#### Returns

- (BatchLoader): A new BatchLoader instance.

### `BatchLoaderOptions`

Configuration options for the BatchLoader.

#### Properties

- `defaultGraphName` (string, optional): The default graph name to use if not specified in the load options. Default: 'default'.
- `validateBeforeLoad` (boolean, optional): Whether to validate the data before loading it. Default: true.
- `defaultBatchSize` (number, optional): The default batch size to use if not specified in the load options. Default: 1000.
- `schemaName` (string, optional): The schema name for the PostgreSQL functions. Default: 'age_schema_client'.

### `BatchLoader.loadGraphData(graphData, options)`

Loads graph data into the database.

#### Parameters

- `graphData` (GraphData): The graph data to load.
- `options` (LoadOptions, optional): Options for loading the graph data.

#### Returns

- (Promise<LoadResult>): A promise that resolves to the load result.

### `GraphData`

The graph data to load.

#### Properties

- `vertices` (Record<string, any[]>): The vertices to load, grouped by type.
- `edges` (Record<string, any[]>): The edges to load, grouped by type.

### `LoadOptions`

Options for loading graph data.

#### Properties

- `graphName` (string, optional): The graph name to use. Default: defaultGraphName.
- `batchSize` (number, optional): The batch size to use. Default: defaultBatchSize.
- `validateBeforeLoad` (boolean, optional): Whether to validate the data before loading it. Default: true.
- `continueOnError` (boolean, optional): Whether to continue loading on error. Default: false.
- `transactionTimeout` (number, optional): The transaction timeout in milliseconds. Default: 60000.
- `debug` (boolean, optional): Whether to enable debug logging. Default: false.
- `onProgress` (function, optional): A callback for progress reporting.

### `LoadResult`

The result of loading graph data.

#### Properties

- `success` (boolean): Whether the loading was successful.
- `vertexCount` (number): The number of vertices loaded.
- `edgeCount` (number): The number of edges loaded.
- `duration` (number): The duration of the loading operation in milliseconds.
- `warnings` (string[], optional): Warnings generated during loading.
- `errors` (Error[], optional): Errors generated during loading.

### `BatchLoader.validateGraphData(graphData)`

Validates graph data against the schema.

#### Parameters

- `graphData` (GraphData): The graph data to validate.

#### Returns

- (Promise<ValidationResult>): A promise that resolves to the validation result.

### `ValidationResult`

The result of validating graph data.

#### Properties

- `isValid` (boolean): Whether the graph data is valid.
- `errors` (string[]): Errors generated during validation.
- `warnings` (string[]): Warnings generated during validation.

## Performance Recommendations

### Batch Size

The batch size is a critical parameter that affects the performance of the BatchLoader. A larger batch size reduces the number of database operations but increases memory usage. A smaller batch size reduces memory usage but increases the number of database operations.

For most use cases, a batch size of 500-1000 provides a good balance between performance and memory usage. However, the optimal batch size depends on the dataset size, the available memory, and the database performance.

### Validation

Validating data before loading it can prevent errors during loading and avoid transaction rollbacks. However, validation adds overhead to the loading process. For large datasets, you may want to disable validation if you are confident that the data is valid.

### Transaction Timeout

The transaction timeout should be set based on the dataset size and the database performance. For large datasets, you may need to increase the transaction timeout to avoid transaction timeouts.

### Connection Pool

The BatchLoader uses a connection pool to manage database connections. The connection pool should be configured with an appropriate number of connections based on the expected load and the database capacity.

### Memory Usage

The BatchLoader processes data in batches to optimize memory usage. However, for very large datasets, you may need to monitor memory usage and adjust the batch size accordingly.

## Known Limitations

### Apache AGE Compatibility

The BatchLoader is designed to work with Apache AGE and may not be compatible with other graph databases.

### PostgreSQL Functions

The BatchLoader uses PostgreSQL functions to retrieve data from the temporary table. These functions must be available in the database.

### Search Path

The BatchLoader requires the ag_catalog schema to be in the search_path. This is typically configured in the connection options.

### Temporary Table

The BatchLoader uses a temporary table named age_params to store data. This table must be available in the database.

### Transaction Isolation

The BatchLoader uses READ COMMITTED transaction isolation level. This may not be suitable for all use cases.

## Troubleshooting

### Error: "age_params table not found"

This error occurs when the age_params temporary table is not available in the database. Make sure the table is created before using the BatchLoader.

### Error: "ag_catalog schema not in search_path"

This error occurs when the ag_catalog schema is not in the search_path. Make sure the search_path is configured correctly in the connection options.

### Error: "Transaction timeout"

This error occurs when the transaction timeout is exceeded. Try increasing the transaction timeout in the load options.

### Error: "Out of memory"

This error occurs when the process runs out of memory. Try reducing the batch size or using a machine with more memory.

## Conclusion

The BatchLoader is a powerful tool for loading large volumes of graph data into Apache AGE graph databases. By using a temporary table approach and batch processing, it provides efficient and reliable data loading with comprehensive error handling and progress reporting.
