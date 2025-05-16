# Schema Loading with Single Function Approach

This module provides functionality for loading graph data into Apache AGE using the single-function approach. This approach significantly improves the efficiency and reliability of loading graph data by reducing the number of queries and providing a more robust parameter passing mechanism.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
  - [SchemaLoader](#schemaloader)
  - [Options](#options)
- [Examples](#examples)
  - [Basic Usage](#basic-usage-1)
  - [Using Transactions](#using-transactions)
  - [Loading from a File](#loading-from-a-file)
  - [Progress Tracking](#progress-tracking)
  - [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Error Handling](#error-handling-1)
- [Logging](#logging)

## Installation

```bash
npm install age-schema-client
```

## Basic Usage

```typescript
import { SchemaLoader, SchemaDefinition } from 'age-schema-client';

// Define your schema
const schema: SchemaDefinition = {
  vertex: {
    Person: {
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Movie: {
      properties: {
        title: { type: 'string', required: true },
        year: { type: 'number' }
      }
    }
  },
  edge: {
    ACTED_IN: {
      properties: {
        role: { type: 'string' }
      }
    }
  }
};

// Create a query executor
const queryExecutor = new PostgresQueryExecutor({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postgres',
  password: 'password',
  options: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
  }
});

// Create a schema loader
const schemaLoader = new SchemaLoader(schema, queryExecutor, {
  validateBeforeLoad: true,
  batchSize: 1000
});

// Load graph data
const data = {
  vertex: {
    Person: [
      { name: 'Tom Hanks', age: 65 },
      { name: 'Meg Ryan', age: 59 }
    ],
    Movie: [
      { title: 'Sleepless in Seattle', year: 1993 },
      { title: 'You've Got Mail', year: 1998 }
    ]
  },
  edge: {
    ACTED_IN: [
      { from: 1, to: 3, role: 'Sam Baldwin' },
      { from: 2, to: 3, role: 'Annie Reed' },
      { from: 1, to: 4, role: 'Joe Fox' },
      { from: 2, to: 4, role: 'Kathleen Kelly' }
    ]
  }
};

async function loadData() {
  const result = await schemaLoader.loadGraphData(data, {
    graphName: 'mygraph',
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentage}%`);
    }
  });
  
  console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
}

loadData().catch(console.error);
```

## API Reference

### SchemaLoader

```typescript
class SchemaLoader<T extends SchemaDefinition> {
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    options?: SchemaLoaderOptions
  );
  
  // Load both vertices and edges
  async loadGraphData(
    data: GraphData,
    options?: LoadOptions
  ): Promise<LoadResult>;
  
  // Load only vertices
  async loadVertices(
    vertices: Record<string, any[]>,
    options?: LoadOptions
  ): Promise<LoadResult>;
  
  // Load only edges
  async loadEdges(
    edges: Record<string, any[]>,
    options?: LoadOptions
  ): Promise<LoadResult>;
  
  // Load from a JSON file
  async loadFromFile(
    filePath: string,
    options?: LoadOptions
  ): Promise<LoadResult>;
  
  // Execute a callback within a transaction
  async withTransaction<R>(
    callback: (transaction: Transaction) => Promise<R>
  ): Promise<R>;
}
```

### Options

```typescript
interface SchemaLoaderOptions {
  validateBeforeLoad?: boolean; // Default: true
  batchSize?: number; // Default: 1000
  logger?: Logger;
  parallelInserts?: boolean; // Default: false
  maxParallelBatches?: number; // Default: 4
  useStreamingForLargeDatasets?: boolean; // Default: false
  largeDatasetThreshold?: number; // Default: 10000
}

interface LoadOptions {
  transaction?: Transaction;
  graphName?: string; // Default: 'default'
  batchSize?: number;
  onProgress?: (progress: ProgressInfo) => void;
  validateData?: boolean;
}

interface ProgressInfo {
  phase: 'validation' | 'storing' | 'creating';
  current: number;
  total: number;
  percentage: number;
  vertexCount?: number;
  edgeCount?: number;
  currentType?: string;
  currentBatch?: number;
  totalBatches?: number;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
}

interface LoadResult {
  success: boolean;
  vertexCount: number;
  edgeCount: number;
  vertexTypes: string[];
  edgeTypes: string[];
  errors?: Error[];
  warnings?: string[];
  duration: number;
}

interface GraphData {
  vertex: Record<string, any[]>;
  edge: Record<string, any[]>;
}
```

## Examples

### Basic Usage

See the [Basic Usage](#basic-usage) section above.

### Using Transactions

```typescript
async function loadDataWithTransaction() {
  const result = await schemaLoader.withTransaction(async (transaction) => {
    // Load vertices first
    const vertexResult = await schemaLoader.loadVertices(data.vertex, {
      transaction,
      graphName: 'mygraph'
    });
    
    if (!vertexResult.success) {
      throw new Error('Failed to load vertices');
    }
    
    // Then load edges
    const edgeResult = await schemaLoader.loadEdges(data.edge, {
      transaction,
      graphName: 'mygraph'
    });
    
    return {
      vertexCount: vertexResult.vertexCount,
      edgeCount: edgeResult.edgeCount
    };
  });
  
  console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
}
```

### Loading from a File

```typescript
async function loadFromFile() {
  const result = await schemaLoader.loadFromFile('./data.json', {
    graphName: 'mygraph'
  });
  
  console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
}
```

### Progress Tracking

```typescript
async function loadWithProgressTracking() {
  const result = await schemaLoader.loadGraphData(data, {
    graphName: 'mygraph',
    onProgress: (progress) => {
      console.log(`Phase: ${progress.phase}`);
      console.log(`Progress: ${progress.percentage.toFixed(2)}%`);
      console.log(`Current: ${progress.current} / ${progress.total}`);
      
      if (progress.currentType) {
        console.log(`Current type: ${progress.currentType}`);
      }
      
      if (progress.currentBatch) {
        console.log(`Batch: ${progress.currentBatch} / ${progress.totalBatches}`);
      }
      
      if (progress.estimatedTimeRemaining) {
        console.log(`Estimated time remaining: ${progress.estimatedTimeRemaining.toFixed(2)}s`);
      }
    }
  });
  
  console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration}ms`);
}
```

### Error Handling

```typescript
async function loadWithErrorHandling() {
  try {
    const result = await schemaLoader.loadGraphData(data, {
      graphName: 'mygraph'
    });
    
    if (!result.success) {
      console.error('Loading failed:');
      result.errors?.forEach(error => {
        console.error(error.message);
        
        if (error instanceof ValidationError) {
          console.error('Validation errors:', error.validationErrors);
        } else if (error instanceof DatabaseError) {
          console.error('Original database error:', error.originalError);
        }
      });
    } else {
      console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Considerations

- For large datasets, consider using the `parallelInserts` option to improve performance
- For very large datasets, enable `useStreamingForLargeDatasets` to reduce memory usage
- Adjust `batchSize` based on your database performance characteristics
- Use transactions to ensure atomicity of operations

## Error Handling

The SchemaLoader provides detailed error information through the `LoadResult` object:

```typescript
const result = await schemaLoader.loadGraphData(data);

if (!result.success) {
  console.error('Loading failed:');
  result.errors?.forEach(error => {
    console.error(error.message);
    
    if (error instanceof ValidationError) {
      console.error('Validation errors:', error.validationErrors);
    } else if (error instanceof DatabaseError) {
      console.error('Original database error:', error.originalError);
    }
  });
}
```

## Logging

You can provide a custom logger to the SchemaLoader:

```typescript
const logger = {
  debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
  info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args)
};

const schemaLoader = new SchemaLoader(schema, queryExecutor, { logger });
```
