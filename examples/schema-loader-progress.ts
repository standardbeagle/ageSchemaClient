/**
 * Progress tracking example for SchemaLoader
 * 
 * This example demonstrates how to:
 * 1. Track progress during data loading
 * 2. Display detailed progress information
 * 3. Estimate remaining time
 */

import { SchemaLoader, SchemaDefinition, PostgresQueryExecutor } from '../src';

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
  batchSize: 100 // Smaller batch size to demonstrate progress tracking
});

// Generate a larger dataset for better progress demonstration
function generateLargeDataset(personCount = 500, movieCount = 100) {
  const persons = [];
  const movies = [];
  const actedIn = [];
  
  // Generate persons
  for (let i = 1; i <= personCount; i++) {
    persons.push({
      name: `Person ${i}`,
      age: 20 + Math.floor(Math.random() * 60)
    });
  }
  
  // Generate movies
  for (let i = 1; i <= movieCount; i++) {
    movies.push({
      title: `Movie ${i}`,
      year: 1950 + Math.floor(Math.random() * 70)
    });
  }
  
  // Generate acted_in relationships
  // Each person acts in 1-5 random movies
  for (let personId = 1; personId <= personCount; personId++) {
    const moviesPerPerson = 1 + Math.floor(Math.random() * 5);
    const movieIds = new Set();
    
    while (movieIds.size < moviesPerPerson) {
      const movieId = 1 + Math.floor(Math.random() * movieCount);
      movieIds.add(movieId);
    }
    
    for (const movieId of movieIds) {
      actedIn.push({
        from: personId,
        to: personCount + movieId,
        role: `Role in Movie ${movieId}`
      });
    }
  }
  
  return {
    vertex: {
      Person: persons,
      Movie: movies
    },
    edge: {
      ACTED_IN: actedIn
    }
  };
}

/**
 * Example of tracking progress during data loading
 */
async function loadWithProgressTracking() {
  console.log('Generating large dataset...');
  const data = generateLargeDataset();
  
  console.log(`Dataset contains:`);
  console.log(`- ${data.vertex.Person.length} persons`);
  console.log(`- ${data.vertex.Movie.length} movies`);
  console.log(`- ${data.edge.ACTED_IN.length} acted_in relationships`);
  
  console.log('\nLoading graph data with progress tracking...');
  
  // Track start time
  const startTime = Date.now();
  
  try {
    const result = await schemaLoader.loadGraphData(data, {
      graphName: 'mygraph',
      onProgress: (progress) => {
        // Clear the console line
        process.stdout.write('\r\x1b[K');
        
        // Format the progress message based on the current phase
        let message = `[${progress.phase.toUpperCase()}] `;
        
        // Add percentage
        message += `Progress: ${progress.percentage.toFixed(2)}% `;
        
        // Add current/total
        message += `(${progress.current}/${progress.total}) `;
        
        // Add type information if available
        if (progress.currentType) {
          message += `Type: ${progress.currentType} `;
        }
        
        // Add batch information if available
        if (progress.currentBatch && progress.totalBatches) {
          message += `Batch: ${progress.currentBatch}/${progress.totalBatches} `;
        }
        
        // Add time information if available
        if (progress.elapsedTime) {
          message += `Elapsed: ${(progress.elapsedTime / 1000).toFixed(2)}s `;
        }
        
        if (progress.estimatedTimeRemaining) {
          message += `Remaining: ${(progress.estimatedTimeRemaining / 1000).toFixed(2)}s `;
        }
        
        // Print the message without a newline
        process.stdout.write(message);
      }
    });
    
    // Calculate total duration
    const duration = Date.now() - startTime;
    
    // Print a newline to ensure the next output starts on a new line
    console.log('');
    
    if (result.success) {
      console.log(`\nSuccessfully loaded graph data:`);
      console.log(`- Vertices: ${result.vertexCount}`);
      console.log(`- Edges: ${result.edgeCount}`);
      console.log(`- Duration: ${duration}ms`);
      console.log(`- Vertex types: ${result.vertexTypes.join(', ')}`);
      console.log(`- Edge types: ${result.edgeTypes.join(', ')}`);
    } else {
      console.error('\nFailed to load graph data:');
      result.errors?.forEach(error => {
        console.error(`- ${error.message}`);
      });
    }
  } catch (error) {
    console.error('\nUnexpected error:', error);
  } finally {
    // Close the connection
    await queryExecutor.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  loadWithProgressTracking().catch(console.error);
}

export { schema, generateLargeDataset, loadWithProgressTracking };
