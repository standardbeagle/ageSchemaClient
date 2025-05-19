# BatchLoader API Reference

This document provides a detailed API reference for the BatchLoader component in the ageSchemaClient library.

## Table of Contents

- [BatchLoader Interface](#batchloader-interface)
- [createBatchLoader](#createbatchloader)
- [BatchLoaderOptions](#batchloaderoptions)
- [GraphData](#graphdata)
- [LoadOptions](#loadoptions)
- [LoadResult](#loadresult)
- [ValidationResult](#validationresult)
- [LoadProgress](#loadprogress)
- [BatchLoaderError](#batchloadererror)
- [ValidationError](#validationerror)
- [OptimizedBatchLoader](#optimizedbatchloader)

## BatchLoader Interface

The BatchLoader interface defines the contract for batch loading graph data into Apache AGE.

```typescript
interface BatchLoader<T extends SchemaDefinition> {
  /**
   * Validate graph data against the schema
   * 
   * @param graphData - Graph data to validate
   * @returns Promise resolving to a validation result
   */
  validateGraphData(graphData: GraphData): Promise<ValidationResult>;

  /**
   * Load graph data into the database
   * 
   * @param graphData - Graph data to load
   * @param options - Load options
   * @returns Promise resolving to a load result
   */
  loadGraphData(graphData: GraphData, options?: LoadOptions): Promise<LoadResult>;
}
```

## createBatchLoader

Creates a new BatchLoader instance.

```typescript
function createBatchLoader<T extends SchemaDefinition>(
  schema: T,
  queryExecutor: QueryExecutor,
  options?: BatchLoaderOptions
): BatchLoader<T>;
```

### Parameters

- `schema` (SchemaDefinition): The schema definition for the graph data.
- `queryExecutor` (QueryExecutor): The query executor to use for database operations.
- `options` (BatchLoaderOptions, optional): Configuration options for the BatchLoader.

### Returns

- (BatchLoader): A new BatchLoader instance.

### Example

```typescript
import { createBatchLoader } from 'age-schema-client/loader';
import { QueryExecutor } from 'age-schema-client/db';

const batchLoader = createBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'my_graph',
  validateBeforeLoad: true,
  defaultBatchSize: 1000,
  schemaName: 'age_schema_client'
});
```

## BatchLoaderOptions

Configuration options for the BatchLoader.

```typescript
interface BatchLoaderOptions {
  /**
   * Default graph name to use if not specified in the load options
   * @default 'default'
   */
  defaultGraphName?: string;

  /**
   * Whether to validate the data before loading it
   * @default true
   */
  validateBeforeLoad?: boolean;

  /**
   * Default batch size to use if not specified in the load options
   * @default 1000
   */
  defaultBatchSize?: number;

  /**
   * Schema name for the PostgreSQL functions
   * @default 'age_schema_client'
   */
  schemaName?: string;
}
```

## GraphData

The graph data to load.

```typescript
interface GraphData {
  /**
   * Vertices to load, grouped by type
   */
  vertices?: Record<string, any[]>;

  /**
   * Edges to load, grouped by type
   */
  edges?: Record<string, any[]>;
}
```

### Example

```typescript
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
    ]
  }
};
```

## LoadOptions

Options for loading graph data.

```typescript
interface LoadOptions {
  /**
   * Graph name to use
   * @default defaultGraphName
   */
  graphName?: string;

  /**
   * Batch size to use
   * @default defaultBatchSize
   */
  batchSize?: number;

  /**
   * Whether to validate the data before loading it
   * @default validateBeforeLoad
   */
  validateBeforeLoad?: boolean;

  /**
   * Whether to continue loading on error
   * @default false
   */
  continueOnError?: boolean;

  /**
   * Transaction timeout in milliseconds
   * @default 60000
   */
  transactionTimeout?: number;

  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Callback for progress reporting
   */
  onProgress?: (progress: LoadProgress) => void;
}
```

## LoadResult

The result of loading graph data.

```typescript
interface LoadResult {
  /**
   * Whether the loading was successful
   */
  success: boolean;

  /**
   * Number of vertices loaded
   */
  vertexCount: number;

  /**
   * Number of edges loaded
   */
  edgeCount: number;

  /**
   * Duration of the loading operation in milliseconds
   */
  duration: number;

  /**
   * Warnings generated during loading
   */
  warnings?: string[];

  /**
   * Errors generated during loading
   */
  errors?: Error[];
}
```

## ValidationResult

The result of validating graph data.

```typescript
interface ValidationResult {
  /**
   * Whether the graph data is valid
   */
  isValid: boolean;

  /**
   * Errors generated during validation
   */
  errors: string[];

  /**
   * Warnings generated during validation
   */
  warnings: string[];
}
```

## LoadProgress

Progress information during loading.

```typescript
interface LoadProgress {
  /**
   * Current loading phase ('vertices' or 'edges')
   */
  phase: 'vertices' | 'edges';

  /**
   * Current vertex or edge type being loaded
   */
  type: string;

  /**
   * Number of vertices or edges processed so far
   */
  processed: number;

  /**
   * Total number of vertices or edges to process
   */
  total: number;

  /**
   * Percentage of vertices or edges processed
   */
  percentage: number;

  /**
   * Current batch number
   */
  batchNumber?: number;

  /**
   * Total number of batches
   */
  totalBatches?: number;

  /**
   * Elapsed time in milliseconds
   */
  elapsedTime?: number;

  /**
   * Warnings generated during loading
   */
  warnings?: string[];
}
```

## BatchLoaderError

Error thrown during batch loading.

```typescript
class BatchLoaderError extends Error {
  /**
   * Error name
   */
  name: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error context
   */
  context?: BatchLoaderErrorContext;

  /**
   * Original error that caused this error
   */
  cause?: unknown;

  /**
   * Create a new BatchLoaderError
   * 
   * @param message - Error message
   * @param context - Error context
   * @param cause - Original error that caused this error
   */
  constructor(message: string, context?: BatchLoaderErrorContext, cause?: unknown);
}

/**
 * Context for a BatchLoaderError
 */
interface BatchLoaderErrorContext {
  /**
   * Loading phase ('vertices' or 'edges')
   */
  phase: 'vertices' | 'edges';

  /**
   * Vertex or edge type
   */
  type: string;

  /**
   * Index of the vertex or edge in the array
   */
  index: number;

  /**
   * Additional data
   */
  data?: Record<string, any>;
}
```

## ValidationError

Error thrown during validation.

```typescript
class ValidationError extends Error {
  /**
   * Error name
   */
  name: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Create a new ValidationError
   * 
   * @param message - Error message
   */
  constructor(message: string);
}
```

## OptimizedBatchLoader

The OptimizedBatchLoader is a high-performance implementation of the BatchLoader interface.

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'my_graph',
  validateBeforeLoad: true,
  defaultBatchSize: 1000,
  schemaName: 'age_schema_client'
});
```

The OptimizedBatchLoader implements the same interface as the BatchLoader but provides better performance and reduced memory usage. It includes the following optimizations:

- More efficient Cypher query templates
- Improved property mapping
- Index hints for better performance
- Optimized batch templates
- Improved error handling and reporting

For detailed documentation on the OptimizedBatchLoader, see [Optimized BatchLoader Documentation](./optimized-batch-loader.md).
