# Optimized BatchLoader

This document describes the optimized BatchLoader implementation in the ageSchemaClient library.

## Overview

The optimized BatchLoader is an improved implementation of the BatchLoader interface for loading graph data into Apache AGE. It provides better performance, reduced memory usage, and improved error handling compared to the original implementation.

## Key Features

The optimized BatchLoader includes the following key features:

- **Efficient Data Loading**: Uses more efficient methods for loading data into the database.
- **Improved Error Handling**: Provides better error handling and reporting.
- **Progress Reporting**: Includes detailed progress reporting during data loading.
- **Memory Efficiency**: Reduces memory usage during data loading.
- **Configurable Options**: Provides options for customizing the loading process.

## Usage

To use the optimized BatchLoader, import it from the `optimized-index` module:

```typescript
import { createOptimizedBatchLoader } from '../src/loader/optimized-index';
import { QueryExecutor } from '../src/db/query';
import { PgConnectionManager } from '../src/db/pg-connection-manager';
import { SchemaDefinition } from '../src/schema/types';

// Define your schema
const schema: SchemaDefinition = {
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
        since: { type: 'number' }
      }
    }
  }
};

// Create a connection manager
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'age-integration',
  user: 'age',
  password: 'agepassword',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient',
  },
});

// Create a query executor
const queryExecutor = new QueryExecutor(connectionManager);

// Create an optimized batch loader
const batchLoader = createOptimizedBatchLoader(schema, queryExecutor, {
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
      { from: 'p1', to: 'c1', since: 2015 },
      { from: 'p2', to: 'c1', since: 2018 }
    ]
  }
};

// Load the graph data
batchLoader.loadGraphData(graphData, {
  graphName: 'my_graph',
  batchSize: 1000,
  validateBeforeLoad: true,
  continueOnError: false,
  transactionTimeout: 60000,
  debug: false,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.phase} ${progress.type} - ${progress.processed}/${progress.total} (${progress.percentage}%)`);
  }
})
  .then((result) => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
  })
  .catch((error) => {
    console.error('Error loading graph data:', error);
  });
```

## Configuration Options

The optimized BatchLoader supports the following configuration options:

### BatchLoaderOptions

- **defaultGraphName**: Default graph name to use if not specified in the load options.
- **validateBeforeLoad**: Whether to validate the data before loading it.
- **defaultBatchSize**: Default batch size to use if not specified in the load options.
- **schemaName**: Schema name for the PostgreSQL functions.

### LoadOptions

- **graphName**: Graph name to load the data into.
- **batchSize**: Batch size for loading data.
- **validateBeforeLoad**: Whether to validate the data before loading it.
- **continueOnError**: Whether to continue loading on error.
- **transactionTimeout**: Transaction timeout in milliseconds.
- **debug**: Whether to enable debug logging.
- **onProgress**: Callback function for progress reporting.

## Progress Reporting

The optimized BatchLoader provides detailed progress reporting during data loading. The progress callback function receives a `LoadProgress` object with the following properties:

- **phase**: The current loading phase ('vertices' or 'edges').
- **type**: The current vertex or edge type being loaded.
- **processed**: The number of vertices or edges processed so far.
- **total**: The total number of vertices or edges to process.
- **percentage**: The percentage of vertices or edges processed.
- **batchNumber**: The current batch number.
- **totalBatches**: The total number of batches.
- **elapsedTime**: The elapsed time in milliseconds.
- **warnings**: Any warnings generated during loading.

## Error Handling

The optimized BatchLoader provides improved error handling and reporting. Errors are wrapped in a `BatchLoaderError` class with the following properties:

- **message**: The error message.
- **context**: The context in which the error occurred.
- **cause**: The original error that caused this error.

The context includes information about the phase, type, index, and data being processed when the error occurred.

## Performance Considerations

The optimized BatchLoader is designed for high performance and low memory usage. To achieve the best performance, consider the following:

- **Batch Size**: Use a batch size of 500-1000 for optimal performance.
- **Validation**: Enable validation before loading to catch errors early.
- **Transaction Timeout**: Set an appropriate transaction timeout based on the dataset size.
- **Memory Usage**: Monitor memory usage when loading very large datasets and adjust batch size accordingly.

## Conclusion

The optimized BatchLoader provides a high-performance, memory-efficient, and robust solution for loading graph data into Apache AGE. It is suitable for production workloads with large datasets and provides detailed progress reporting and error handling.
