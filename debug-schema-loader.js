/**
 * Debug script to test SchemaLoader functionality
 *
 * This script tests if the SchemaLoader is working correctly by:
 * 1. Creating a simple schema
 * 2. Loading test data
 * 3. Querying the data to verify it was loaded
 */

import { SchemaLoader } from './dist/src/loader/schema-loader.js';
import { QueryExecutor } from './dist/src/db/query.js';
import { PgConnectionManager } from './dist/src/db/connector.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Simple test schema
const testSchema = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true }
      },
      required: ['id', 'name']
    }
  },
  edges: {}
};

// Simple test data
const testData = {
  vertices: {
    Person: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' }
    ]
  },
  edges: {}
};

async function debugSchemaLoader() {
  let connectionManager;
  let queryExecutor;
  let schemaLoader;

  try {
    console.log('1. Creating connection manager...');
    connectionManager = new PgConnectionManager({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('2. Getting connection...');
    const connection = await connectionManager.getConnection();
    queryExecutor = new QueryExecutor(connection);

    console.log('3. Creating test graph...');
    const graphName = 'debug_test_graph';
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${graphName}')`);
      console.log(`   Graph '${graphName}' created successfully`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`   Graph '${graphName}' already exists, dropping and recreating...`);
        await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
        await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.create_graph('${graphName}')`);
        console.log(`   Graph '${graphName}' recreated successfully`);
      } else {
        throw error;
      }
    }

    console.log('4. Creating SchemaLoader...');
    schemaLoader = new SchemaLoader(testSchema, queryExecutor, {
      defaultGraphName: graphName,
      validateBeforeLoad: true,
      logger: {
        debug: (msg, ...args) => console.log(`   DEBUG: ${msg}`, ...args),
        info: (msg, ...args) => console.log(`   INFO: ${msg}`, ...args),
        warn: (msg, ...args) => console.log(`   WARN: ${msg}`, ...args),
        error: (msg, ...args) => console.log(`   ERROR: ${msg}`, ...args)
      }
    });

    console.log('5. Loading test data...');
    const result = await schemaLoader.loadGraphData(testData, {
      graphName: graphName
    });

    console.log('6. Load result:', {
      success: result.success,
      vertexCount: result.vertexCount,
      edgeCount: result.edgeCount,
      errors: result.errors?.map(e => e.message),
      warnings: result.warnings
    });

    if (result.success) {
      console.log('7. Querying loaded data...');
      const queryResult = await queryExecutor.executeCypher(`
        MATCH (p:Person)
        RETURN p.id AS id, p.name AS name
      `, {}, graphName);

      console.log('   Query result:', {
        rowCount: queryResult.rows.length,
        rows: queryResult.rows
      });
    }

    console.log('8. Cleaning up...');
    await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
    console.log('   Graph dropped successfully');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connectionManager) {
      await connectionManager.close();
    }
  }
}

// Run the debug script
debugSchemaLoader().then(() => {
  console.log('Debug script completed');
  process.exit(0);
}).catch(error => {
  console.error('Debug script failed:', error);
  process.exit(1);
});
