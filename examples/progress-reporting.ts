/**
 * Example of using progress reporting with the batch loader
 *
 * This example demonstrates how to use the progress reporting feature
 * of the batch loader to track the progress of loading graph data.
 */

import { createBatchLoader } from '../src/loader/batch-loader-impl';
import { QueryExecutor } from '../src/db/query';
import { PgConnectionManager } from '../src/db/connector';
import { GraphData, LoadProgress } from '../src/loader/batch-loader';

// Define a schema
const schema = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Company: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' }
      }
    }
  },
  edges: {
    WORKS_AT: {
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

// Create test data
const graphData: GraphData = {
  vertices: {
    Person: [
      { id: '1', name: 'Alice', age: 30 },
      { id: '2', name: 'Bob', age: 25 },
      { id: '3', name: 'Charlie', age: 35 },
      { id: '4', name: 'Dave', age: 40 },
      { id: '5', name: 'Eve', age: 28 }
    ],
    Company: [
      { id: '101', name: 'Acme Inc.', founded: 1990 },
      { id: '102', name: 'TechCorp', founded: 2005 }
    ]
  },
  edges: {
    WORKS_AT: [
      { from: '1', to: '101', since: 2015, position: 'Engineer' },
      { from: '2', to: '101', since: 2018, position: 'Manager' },
      { from: '3', to: '102', since: 2010, position: 'Developer' },
      { from: '4', to: '102', since: 2012, position: 'Designer' },
      { from: '5', to: '101', since: 2020, position: 'Intern' }
    ],
    KNOWS: [
      { from: '1', to: '2', since: 2015 },
      { from: '1', to: '3', since: 2016 },
      { from: '2', to: '4', since: 2017 },
      { from: '3', to: '5', since: 2018 },
      { from: '4', to: '5', since: 2019 }
    ]
  }
};

/**
 * Progress callback function
 *
 * This function is called periodically during the loading process
 * to report progress. It can be used to update a progress bar or
 * display status messages to the user.
 *
 * @param progress - Progress information
 */
function onProgress(progress: LoadProgress): void {
  // Handle errors
  if (progress.error) {
    console.error(`Error in ${progress.phase} phase (${progress.type}): ${progress.error.message}`);

    if (progress.error.recoverable) {
      console.warn('This error is recoverable, continuing...');
    } else {
      console.error('This error is not recoverable, loading will fail.');
    }

    return;
  }

  // Format the progress message based on the phase
  let message = '';

  switch (progress.phase) {
    case 'validation':
      message = `Validating schema: ${progress.percentage}%`;
      break;

    case 'vertices':
      message = `Loading vertices of type ${progress.type}: ${progress.processed}/${progress.total} (${progress.percentage}%)`;

      // Add batch information if available
      if (progress.batchNumber && progress.totalBatches) {
        message += ` [Batch ${progress.batchNumber}/${progress.totalBatches}]`;
      }
      break;

    case 'edges':
      message = `Loading edges of type ${progress.type}: ${progress.processed}/${progress.total} (${progress.percentage}%)`;

      // Add batch information if available
      if (progress.batchNumber && progress.totalBatches) {
        message += ` [Batch ${progress.batchNumber}/${progress.totalBatches}]`;
      }
      break;

    case 'cleanup':
      message = `Cleaning up ${progress.type}: ${progress.percentage}%`;
      break;
  }

  // Add timing information if available
  if (progress.elapsedTime) {
    const elapsedSeconds = Math.round(progress.elapsedTime / 1000);
    message += ` (Elapsed: ${elapsedSeconds}s`;

    if (progress.estimatedTimeRemaining) {
      const remainingSeconds = Math.round(progress.estimatedTimeRemaining / 1000);
      message += `, Remaining: ${remainingSeconds}s`;
    }

    message += ')';
  }

  // Log the progress message
  console.log(message);

  // Display any warnings
  if (progress.warnings && progress.warnings.length > 0) {
    progress.warnings.forEach(warning => {
      console.warn(`  Warning: ${warning}`);
    });
  }

  // In a real application, you might update a progress bar or UI element
  // updateProgressBar(progress.percentage);
}

/**
 * Main function to demonstrate progress reporting
 */
async function main() {
  // Create a connection manager
  const connectionManager = new PgConnectionManager({
    host: 'localhost',
    port: 5432,
    database: 'age_database',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    // Get a connection
    const connection = await connectionManager.getConnection();

    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);

    // Create a batch loader
    const batchLoader = createBatchLoader(schema, queryExecutor, {
      defaultGraphName: 'my_graph',
      defaultBatchSize: 2 // Small batch size to demonstrate progress reporting
    });

    console.log('Starting data loading process...');

    // Load the data with progress reporting
    const result = await batchLoader.loadGraphData(graphData, {
      onProgress,
      collectWarnings: true
    });

    // Check if loading was successful
    if (result.success) {
      console.log(`\nLoading completed successfully in ${result.duration}ms`);
      console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges`);

      // Display any warnings
      if (result.warnings && result.warnings.length > 0) {
        console.warn('\nWarnings during loading:');
        result.warnings.forEach(warning => console.warn(`- ${warning}`));
      }
    } else {
      console.error('\nLoading failed');

      // Display errors
      if (result.errors && result.errors.length > 0) {
        console.error('\nErrors during loading:');
        result.errors.forEach(error => console.error(`- ${error.message}`));
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Close all connections
    await connectionManager.closeAll();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export the example functions for testing
export { onProgress };
