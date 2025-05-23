/**
 * Extension usage example for the ageSchemaClient library
 *
 * This example demonstrates how to use the new extension system to initialize
 * PostgreSQL extensions like AGE, pgvector, and PostGIS on connection pool
 * connections, and how to register custom extension initializers.
 *
 * Prompt Log:
 * - Initial creation: Added example showing how to use the new extension system
 */

import {
  PgConnectionManager,
  ExtensionInitializer,
  AgeExtensionInitializer,
  PgVectorExtensionInitializer,
  PostGISExtensionInitializer,
  SearchPathInitializer,
} from '../src/db';
import { PoolClient } from 'pg';

// Example 1: Basic usage with multiple extensions
async function basicExtensionUsage() {
  console.log('=== Basic Extension Usage ===');

  // Create a connection manager with multiple extensions
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
    // Configure multiple extensions
    extensions: [
      new AgeExtensionInitializer(),
      new PgVectorExtensionInitializer(),
      new PostGISExtensionInitializer(),
      new SearchPathInitializer(['my_schema', 'analytics'])
    ],
    pgOptions: {
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'extension-example',
    },
  });

  try {
    // Get a connection - all extensions will be initialized automatically
    const connection = await connectionManager.getConnection();
    console.log('Connection established with all extensions initialized');

    // Test that AGE is available
    const ageResult = await connection.query(`
      SELECT COUNT(*) > 0 as age_available
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
    `);
    console.log('AGE available:', ageResult.rows[0].age_available);

    // Test that pgvector is available (if installed)
    try {
      const vectorResult = await connection.query(`
        SELECT COUNT(*) > 0 as vector_available
        FROM pg_extension
        WHERE extname = 'vector'
      `);
      console.log('pgvector available:', vectorResult.rows[0].vector_available);
    } catch (error) {
      console.log('pgvector not available (extension may not be installed)');
    }

    // Test that PostGIS is available (if installed)
    try {
      const postgisResult = await connection.query(`
        SELECT COUNT(*) > 0 as postgis_available
        FROM pg_extension
        WHERE extname = 'postgis'
      `);
      console.log('PostGIS available:', postgisResult.rows[0].postgis_available);
    } catch (error) {
      console.log('PostGIS not available (extension may not be installed)');
    }

    // Check the search path
    const searchPathResult = await connection.query('SHOW search_path');
    console.log('Search path:', searchPathResult.rows[0].search_path);

    // Release the connection
    await connectionManager.releaseConnection(connection);
  } catch (error) {
    console.error('Error in basic extension usage:', error);
  } finally {
    await connectionManager.closeAll();
  }
}

// Example 2: Custom extension initializer
class CustomSchemaInitializer implements ExtensionInitializer {
  readonly name = 'Custom Schema';
  private schemaName: string;

  constructor(schemaName: string) {
    this.schemaName = schemaName;
  }

  async initialize(client: PoolClient): Promise<void> {
    try {
      // Create a custom schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.schemaName}`);

      // Create some custom functions or tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.schemaName}.app_config (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log(`Custom schema '${this.schemaName}' initialized`);
    } catch (error) {
      console.error(`Error initializing custom schema '${this.schemaName}':`, error);
      throw error;
    }
  }

  async cleanup(client: PoolClient): Promise<void> {
    try {
      // Clean up any temporary data if needed
      await client.query(`DELETE FROM ${this.schemaName}.app_config WHERE key LIKE 'temp_%'`);
    } catch (error) {
      console.warn(`Error cleaning up custom schema '${this.schemaName}':`, error);
    }
  }
}

async function customExtensionUsage() {
  console.log('\n=== Custom Extension Usage ===');

  // Create a connection manager with custom extension
  const connectionManager = new PgConnectionManager({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
    pool: {
      max: 5,
      idleTimeoutMillis: 30000,
    },
    // Use AGE and custom extension
    extensions: [
      new AgeExtensionInitializer(),
      new CustomSchemaInitializer('my_app'),
    ],
    pgOptions: {
      searchPath: 'ag_catalog, my_app, "$user", public',
      applicationName: 'custom-extension-example',
    },
  });

  try {
    const connection = await connectionManager.getConnection();
    console.log('Connection established with custom extension');

    // Test the custom schema
    const schemaResult = await connection.query(`
      SELECT COUNT(*) > 0 as schema_exists
      FROM information_schema.schemata
      WHERE schema_name = 'my_app'
    `);
    console.log('Custom schema exists:', schemaResult.rows[0].schema_exists);

    // Test the custom table
    const tableResult = await connection.query(`
      SELECT COUNT(*) > 0 as table_exists
      FROM information_schema.tables
      WHERE table_schema = 'my_app' AND table_name = 'app_config'
    `);
    console.log('Custom table exists:', tableResult.rows[0].table_exists);

    // Insert some test data
    await connection.query(`
      INSERT INTO my_app.app_config (key, value)
      VALUES ('temp_test', '{"message": "Hello from custom extension!"}')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `);

    // Query the test data
    const dataResult = await connection.query(`
      SELECT value FROM my_app.app_config WHERE key = 'temp_test'
    `);
    console.log('Custom data:', dataResult.rows[0]?.value);

    await connectionManager.releaseConnection(connection);
  } catch (error) {
    console.error('Error in custom extension usage:', error);
  } finally {
    await connectionManager.closeAll();
  }
}

// Example 3: AGE-only usage (default behavior)
async function ageOnlyUsage() {
  console.log('\n=== AGE-Only Usage (Default) ===');

  // Create a connection manager without specifying extensions
  // This will default to AGE extension only
  const connectionManager = new PgConnectionManager({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
    pool: {
      max: 5,
      idleTimeoutMillis: 30000,
    },
    // No extensions specified - defaults to AGE
    pgOptions: {
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'age-only-example',
    },
  });

  try {
    const connection = await connectionManager.getConnection();
    console.log('Connection established with default AGE extension');

    // Test AGE functionality
    const ageResult = await connection.query(`
      SELECT COUNT(*) > 0 as age_available
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
    `);
    console.log('AGE available:', ageResult.rows[0].age_available);

    await connectionManager.releaseConnection(connection);
  } catch (error) {
    console.error('Error in AGE-only usage:', error);
  } finally {
    await connectionManager.closeAll();
  }
}

// Run all examples
async function runExamples() {
  try {
    await basicExtensionUsage();
    await customExtensionUsage();
    await ageOnlyUsage();
    console.log('\n=== All examples completed ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other files
export {
  basicExtensionUsage,
  customExtensionUsage,
  ageOnlyUsage,
  CustomSchemaInitializer,
  runExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}
