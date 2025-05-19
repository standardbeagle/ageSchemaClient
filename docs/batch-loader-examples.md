# BatchLoader Examples

This document provides examples of using the BatchLoader component in the ageSchemaClient library.

## Basic Example

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

## Example with Progress Reporting

```typescript
// Load graph data with progress reporting
batchLoader.loadGraphData(graphData, {
  onProgress: (progress) => {
    console.log(`Progress: ${progress.phase} ${progress.type} - ${progress.processed}/${progress.total} (${progress.percentage}%)`);
  }
})
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```

## Example with Custom Configuration

```typescript
// Load graph data with custom configuration
batchLoader.loadGraphData(graphData, {
  graphName: 'custom_graph',
  batchSize: 500,
  validateBeforeLoad: true,
  continueOnError: false,
  transactionTimeout: 120000,
  debug: true
})
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```

## Example with Validation

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

## Example with Optimized BatchLoader

```typescript
import { createOptimizedBatchLoader } from 'age-schema-client/loader/optimized-index';

// Create an optimized batch loader
const optimizedBatchLoader = createOptimizedBatchLoader(schema, queryExecutor, {
  defaultGraphName: 'my_graph',
  validateBeforeLoad: true,
  defaultBatchSize: 1000,
  schemaName: 'age_schema_client'
});

// Load graph data with the optimized batch loader
optimizedBatchLoader.loadGraphData(graphData)
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```

## Example with Large Dataset

```typescript
// Generate a large dataset
function generateLargeDataset(personCount = 1000, companyCount = 10) {
  const vertices = {
    Person: [],
    Company: []
  };
  
  const edges = {
    WORKS_AT: []
  };
  
  // Generate persons
  for (let i = 0; i < personCount; i++) {
    vertices.Person.push({
      id: `p${i}`,
      name: `Person ${i}`,
      age: 20 + (i % 50)
    });
  }
  
  // Generate companies
  for (let i = 0; i < companyCount; i++) {
    vertices.Company.push({
      id: `c${i}`,
      name: `Company ${i}`,
      founded: 1980 + (i * 5)
    });
  }
  
  // Generate employment relationships
  for (let i = 0; i < personCount; i++) {
    edges.WORKS_AT.push({
      from: `p${i}`,
      to: `c${i % companyCount}`,
      since: 2010 + (i % 10),
      position: ['Engineer', 'Manager', 'Director', 'VP', 'CEO'][i % 5]
    });
  }
  
  return { vertices, edges };
}

// Generate a large dataset
const largeDataset = generateLargeDataset(10000, 100);

// Load the large dataset with the optimized batch loader
optimizedBatchLoader.loadGraphData(largeDataset, {
  batchSize: 1000,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.phase} ${progress.type} - ${progress.processed}/${progress.total} (${progress.percentage}%)`);
  }
})
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```

## Example with Error Handling

```typescript
// Load graph data with error handling
batchLoader.loadGraphData(graphData)
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
    
    // Check for warnings
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
    
    // Check for BatchLoaderError
    if (error.name === 'BatchLoaderError') {
      console.error('Error context:', error.context);
      console.error('Original error:', error.cause);
    }
    
    // Check for ValidationError
    if (error.name === 'ValidationError') {
      console.error('Validation error:', error.message);
    }
  });
```

## Example with Continue on Error

```typescript
// Load graph data with continue on error
batchLoader.loadGraphData(graphData, {
  continueOnError: true
})
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
    
    // Check for warnings
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```

## Example with Complex Schema

```typescript
// Define a complex schema
const complexSchema = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' },
        email: { type: 'string' },
        active: { type: 'boolean' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' },
        industry: { type: 'string' },
        public: { type: 'boolean' }
      }
    },
    Product: {
      label: 'Product',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        price: { type: 'number', required: true },
        category: { type: 'string' },
        inStock: { type: 'boolean' }
      }
    },
    Location: {
      label: 'Location',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        country: { type: 'string' }
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
        position: { type: 'string' },
        salary: { type: 'number' }
      }
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        relationship: { type: 'string' }
      }
    },
    SELLS: {
      label: 'SELLS',
      from: 'Company',
      to: 'Product',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        price: { type: 'number' }
      }
    },
    LOCATED_AT: {
      label: 'LOCATED_AT',
      from: 'Company',
      to: 'Location',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        headquarters: { type: 'boolean' }
      }
    }
  }
};

// Create a batch loader with the complex schema
const complexBatchLoader = createBatchLoader(complexSchema, queryExecutor, {
  defaultGraphName: 'complex_graph',
  validateBeforeLoad: true,
  defaultBatchSize: 1000,
  schemaName: 'age_schema_client'
});

// Load complex graph data
complexBatchLoader.loadGraphData(complexGraphData)
  .then(result => {
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration} ms`);
  })
  .catch(error => {
    console.error('Error loading graph data:', error);
  });
```
