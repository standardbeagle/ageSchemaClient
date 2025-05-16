/**
 * Error handling example for SchemaLoader
 * 
 * This example demonstrates how to:
 * 1. Handle validation errors
 * 2. Handle database errors
 * 3. Use try-catch blocks for error handling
 * 4. Process error information from LoadResult
 */

import { 
  SchemaLoader, 
  SchemaDefinition, 
  PostgresQueryExecutor,
  ValidationError,
  DatabaseError
} from '../src';

// Define your schema with validation constraints
const schema: SchemaDefinition = {
  vertex: {
    Person: {
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 0, max: 120 }
      }
    },
    Movie: {
      properties: {
        title: { type: 'string', required: true },
        year: { type: 'number', min: 1900, max: 2100 }
      }
    }
  },
  edge: {
    ACTED_IN: {
      properties: {
        role: { type: 'string', required: true }
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

/**
 * Example of handling validation errors
 */
async function handleValidationErrors() {
  console.log('Demonstrating validation error handling...');
  
  // Data with validation errors
  const invalidData = {
    vertex: {
      Person: [
        { name: 'Tom Hanks', age: 65 },
        { name: 'Invalid Person', age: -10 }, // Invalid age (negative)
        { age: 40 } // Missing required name
      ],
      Movie: [
        { title: 'Sleepless in Seattle', year: 1993 },
        { title: 'Future Movie', year: 2200 }, // Invalid year (too high)
        { year: 2000 } // Missing required title
      ]
    },
    edge: {
      ACTED_IN: [
        { from: 1, to: 4, role: 'Sam Baldwin' },
        { from: 2, to: 4 } // Missing required role
      ]
    }
  };
  
  try {
    console.log('Loading data with validation errors...');
    
    const result = await schemaLoader.loadGraphData(invalidData, {
      graphName: 'mygraph',
      validateData: true // Ensure validation is enabled
    });
    
    // This should not be reached if validation fails
    if (result.success) {
      console.log('Unexpectedly succeeded in loading invalid data');
    } else {
      console.error('Loading failed as expected:');
      
      // Process and display validation errors
      result.errors?.forEach(error => {
        console.error(`- ${error.message}`);
        
        if (error instanceof ValidationError) {
          console.error('  Validation errors:');
          error.validationErrors.forEach(validationError => {
            console.error(`  - ${validationError.path}: ${validationError.message}`);
          });
        }
      });
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}

/**
 * Example of handling database errors
 */
async function handleDatabaseErrors() {
  console.log('\nDemonstrating database error handling...');
  
  // Valid data but we'll use an invalid graph name
  const validData = {
    vertex: {
      Person: [
        { name: 'Tom Hanks', age: 65 },
        { name: 'Meg Ryan', age: 59 }
      ]
    },
    edge: {}
  };
  
  try {
    console.log('Loading data with an invalid graph name...');
    
    const result = await schemaLoader.loadGraphData(validData, {
      graphName: 'invalid-graph-name-with-special-characters!@#$',
      validateData: true
    });
    
    // This should not be reached if the database operation fails
    if (result.success) {
      console.log('Unexpectedly succeeded in loading with invalid graph name');
    } else {
      console.error('Loading failed as expected:');
      
      // Process and display database errors
      result.errors?.forEach(error => {
        console.error(`- ${error.message}`);
        
        if (error instanceof DatabaseError) {
          console.error('  Original database error:');
          console.error(`  - Code: ${error.originalError.code}`);
          console.error(`  - Detail: ${error.originalError.detail}`);
        }
      });
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}

/**
 * Example of using try-catch for error handling
 */
async function handleErrorsWithTryCatch() {
  console.log('\nDemonstrating try-catch error handling...');
  
  // Valid data
  const validData = {
    vertex: {
      Person: [
        { name: 'Tom Hanks', age: 65 },
        { name: 'Meg Ryan', age: 59 }
      ]
    },
    edge: {}
  };
  
  try {
    console.log('Attempting to load data with an invalid connection...');
    
    // Create a schema loader with an invalid connection
    const invalidQueryExecutor = new PostgresQueryExecutor({
      host: 'non-existent-host',
      port: 5432,
      database: 'mydb',
      user: 'postgres',
      password: 'password'
    });
    
    const invalidSchemaLoader = new SchemaLoader(schema, invalidQueryExecutor);
    
    // This should throw a connection error
    await invalidSchemaLoader.loadGraphData(validData, {
      graphName: 'mygraph'
    });
  } catch (error) {
    console.error('Caught expected connection error:');
    console.error(`- ${error.message}`);
    
    if (error instanceof DatabaseError) {
      console.error('  Original database error:');
      console.error(`  - Code: ${error.originalError.code}`);
      console.error(`  - Detail: ${error.originalError.detail}`);
    }
  }
}

// Run the examples if this file is executed directly
if (require.main === module) {
  async function runExamples() {
    try {
      await handleValidationErrors();
      await handleDatabaseErrors();
      await handleErrorsWithTryCatch();
    } finally {
      // Close the connection
      await queryExecutor.close();
    }
  }
  
  runExamples().catch(console.error);
}

export { schema, handleValidationErrors, handleDatabaseErrors, handleErrorsWithTryCatch };
