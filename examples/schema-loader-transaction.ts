/**
 * Transaction usage example for SchemaLoader
 *
 * This example demonstrates how to:
 * 1. Use transactions with SchemaLoader
 * 2. Handle transaction errors
 * 3. Ensure atomicity of operations
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
  batchSize: 1000
});

// Sample graph data
const data = {
  vertices: {
    Person: [
      { name: 'Tom Hanks', age: 65 },
      { name: 'Meg Ryan', age: 59 }
    ],
    Movie: [
      { title: 'Sleepless in Seattle', year: 1993 },
      { title: 'You've Got Mail', year: 1998 }
    ]
  },
  edges: {
    ACTED_IN: [
      { from: 1, to: 3, role: 'Sam Baldwin' },
      { from: 2, to: 3, role: 'Annie Reed' },
      { from: 1, to: 4, role: 'Joe Fox' },
      { from: 2, to: 4, role: 'Kathleen Kelly' }
    ]
  }
};

/**
 * Example of using transactions with SchemaLoader
 */
async function loadDataWithTransaction() {
  console.log('Loading graph data with transaction...');

  try {
    // Use the withTransaction method to ensure atomicity
    const result = await schemaLoader.withTransaction(async (transaction) => {
      console.log('Transaction started');

      // Load vertices first
      console.log('Loading vertices...');
      const vertexResult = await schemaLoader.loadVertices(data.vertices, {
        transaction,
        graphName: 'mygraph'
      });

      if (!vertexResult.success) {
        console.error('Failed to load vertices:');
        vertexResult.errors?.forEach(error => {
          console.error(`- ${error.message}`);
        });
        throw new Error('Failed to load vertices');
      }

      console.log(`Successfully loaded ${vertexResult.vertexCount} vertices`);

      // Then load edges
      console.log('Loading edges...');
      const edgeResult = await schemaLoader.loadEdges(data.edges, {
        transaction,
        graphName: 'mygraph'
      });

      if (!edgeResult.success) {
        console.error('Failed to load edges:');
        edgeResult.errors?.forEach(error => {
          console.error(`- ${error.message}`);
        });
        throw new Error('Failed to load edges');
      }

      console.log(`Successfully loaded ${edgeResult.edgeCount} edges`);

      // Return the combined result
      return {
        success: true,
        vertexCount: vertexResult.vertexCount,
        edgeCount: edgeResult.edgeCount,
        duration: vertexResult.duration + edgeResult.duration
      };
    });

    console.log('Transaction completed successfully');
    console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${result.duration}ms`);
  } catch (error) {
    console.error('Transaction failed:', error.message);
    console.error('All changes have been rolled back');
  } finally {
    // Close the connection
    await queryExecutor.close();
  }
}

/**
 * Example of handling transaction errors
 */
async function loadDataWithTransactionError() {
  console.log('Demonstrating transaction error handling...');

  try {
    // Use the withTransaction method
    await schemaLoader.withTransaction(async (transaction) => {
      console.log('Transaction started');

      // Load vertices first
      console.log('Loading vertices...');
      const vertexResult = await schemaLoader.loadVertices(data.vertices, {
        transaction,
        graphName: 'mygraph'
      });

      console.log(`Successfully loaded ${vertexResult.vertexCount} vertices`);

      // Simulate an error
      console.log('Simulating an error...');
      throw new Error('Simulated error during transaction');

      // This code will never execute due to the error above
      return { success: true };
    });
  } catch (error) {
    console.error('Transaction failed as expected:', error.message);
    console.error('All changes have been rolled back');
  } finally {
    // Close the connection
    await queryExecutor.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  // Choose which example to run
  const exampleToRun = process.argv[2] || 'success';

  if (exampleToRun === 'error') {
    loadDataWithTransactionError().catch(console.error);
  } else {
    loadDataWithTransaction().catch(console.error);
  }
}

export { schema, data, loadDataWithTransaction, loadDataWithTransactionError };
