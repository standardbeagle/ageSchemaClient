/**
 * Schema migration example for the ageSchemaClient library
 */

import {
  PgConnectionManager,
  QueryExecutor,
} from '../src/db';
import { SQLGenerator } from '../src/sql/generator';
import { extendSQLGeneratorWithMigrationMethods } from '../src/sql/migration';
import { SchemaMigrationExecutor } from '../src/schema/migration-executor';
import { SchemaDefinition } from '../src/schema/types';
import { compareSchemas } from '../src/schema/migration';

// Extend SQLGenerator with migration methods
extendSQLGeneratorWithMigrationMethods(SQLGenerator);

// Original schema definition
const originalSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['name'],
    },
    Product: {
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        description: { type: 'string' },
      },
      required: ['name', 'price'],
    },
  },
  edges: {
    PURCHASED: {
      properties: {
        date: { type: 'date' },
        quantity: { type: 'integer' },
      },
      fromVertex: 'Person',
      toVertex: 'Product',
      required: ['date'],
    },
  },
};

// Updated schema definition
const updatedSchema: SchemaDefinition = {
  version: '1.1.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
        email: { type: 'string' }, // Added property
      },
      required: ['name', 'email'], // Added required property
    },
    Product: {
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        description: { type: 'string' },
        category: { type: 'string' }, // Added property
        inStock: { type: 'boolean' }, // Added property
      },
      required: ['name', 'price'],
    },
    Supplier: { // Added vertex
      properties: {
        name: { type: 'string' },
        address: { type: 'string' },
        contact: { type: 'string' },
      },
      required: ['name'],
    },
  },
  edges: {
    PURCHASED: {
      properties: {
        date: { type: 'date' },
        quantity: { type: 'integer' },
        totalPrice: { type: 'number' }, // Added property
      },
      fromVertex: 'Person',
      toVertex: 'Product',
      required: ['date'],
    },
    SUPPLIES: { // Added edge
      properties: {
        since: { type: 'date' },
        contract: { type: 'string' },
      },
      fromVertex: 'Supplier',
      toVertex: 'Product',
      required: ['since'],
    },
  },
};

// Example usage
async function main() {
  try {
    // Create a connection manager
    const connectionManager = new PgConnectionManager({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
      pool: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      retry: {
        maxAttempts: 3,
        delay: 1000,
      },
    });

    // Get a connection from the pool
    const connection = await connectionManager.getConnection();
    console.log('Connection acquired');

    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);

    // Create a SQL generator
    const sqlGenerator = new SQLGenerator(originalSchema);

    // Create a migration executor
    const migrationExecutor = new SchemaMigrationExecutor(queryExecutor, sqlGenerator);

    // Compare schemas to identify changes
    console.log('Comparing schemas...');
    const changes = compareSchemas(originalSchema, updatedSchema);
    
    console.log(`Found ${changes.length} changes:`);
    for (const change of changes) {
      console.log(`- ${change.type} ${change.path} (breaking: ${change.breaking})`);
    }

    // Create a migration plan
    console.log('\nCreating migration plan...');
    const plan = migrationExecutor.createMigrationPlan(originalSchema, updatedSchema, {
      allowDataLoss: true, // Allow data loss for this example
    });
    
    console.log(`Migration plan created with ${plan.steps.length} steps:`);
    for (const step of plan.steps) {
      console.log(`- ${step.description}`);
      console.log(`  SQL: ${step.sql}`);
      console.log(`  Can cause data loss: ${step.canCauseDataLoss}`);
    }

    // Execute the migration plan
    console.log('\nExecuting migration plan...');
    const result = await migrationExecutor.executeMigrationPlan(plan, {
      execute: true, // Actually execute the migration
      allowDataLoss: true, // Allow data loss for this example
      createBackup: true, // Create a backup before migration
      logMigration: true, // Log migration steps
    });
    
    if (result.success) {
      console.log(`Migration successful! Executed ${result.executedSteps} of ${result.totalSteps} steps.`);
    } else {
      console.error(`Migration failed: ${result.error}`);
      console.log(`Executed ${result.executedSteps} of ${result.totalSteps} steps before failure.`);
    }

    // Release the connection
    connection.release();
    console.log('Connection released');

    // Close all connections
    await connectionManager.closeAll();
    console.log('All connections closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main();
}

export default main;
