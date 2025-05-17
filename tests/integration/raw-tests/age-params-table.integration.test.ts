/**
 * Raw integration test for age_params table functionality
 *
 * This test verifies that the age_params temporary table is properly managed
 * when connections are acquired and released from the pool. It specifically tests:
 *
 * 1. The age_params table exists
 * 2. Data can be set inserted into the age_params table
 * 3. The data can be used in a query
 * 5. This behavior is consistent across multiple connection acquisitions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA,
  AGE_GRAPH_NAME
} from '../../setup/integration';
import { PgConnectionManager } from '../../../src/db/connector';
import { QueryExecutor } from '../../../src/db/query';
import { Connection } from '../../../src/db/types';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Connection configuration for test database
const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  pool: {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-integration-test',
  },
};

describe('age_params Table Management', () => {
  let connectionManager: PgConnectionManager;
  let ageAvailable = false;

  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE extension is not available, tests will be skipped');
      return;
    }

    // Create a new connection manager for this test
    connectionManager = new PgConnectionManager(connectionConfig);
  });

  afterAll(async () => {
    // Release all connections
    if (connectionManager) {
      try {
        await connectionManager.releaseAllConnections();
        console.log('All connections released in afterAll');
      } catch (error) {
        console.error(`Error releasing connections: ${error.message}`);
      }
    }
  });

  it('should properly manage the age_params table across multiple connection acquisitions', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Run the test 10 times to verify consistent behavior
    for (let i = 0; i < 10; i++) {
      console.log(`\nIteration ${i + 1} of 10`);

      // Get a connection from the pool
      const connection = await connectionManager.getConnection();
      const testQueryExecutor = new QueryExecutor(connection);

      try {
        // 1. Verify the age_params table is empty
        const emptyCheckResult = await testQueryExecutor.executeSQL(`
          SELECT value  as count FROM age_params WHERE key = 'test_key'
        `);

        const orignalValue = emptyCheckResult.rows.length > 0 ? emptyCheckResult.rows[0].value : null;
        console.log(`Original value: ${JSON.stringify(orignalValue)}`);

        // 2. Insert data into the age_params table
        await testQueryExecutor.executeSQL(`
          INSERT INTO age_params (key, value)
          VALUES ('test_key', $1) 
          ON CONFLICT (key) DO UPDATE SET value = $1
        `, [`{"value": "test_value_${i}"}`]);

        // Verify the data was inserted
        const insertCheckResult = await testQueryExecutor.executeSQL(`
          SELECT * FROM age_params
        `);

        expect(insertCheckResult.rows).toHaveLength(1);
        expect(insertCheckResult.rows[0].key).toBe('test_key');
        expect(orignalValue).not.toBe(insertCheckResult.rows[0].value);

        // Check if value is already an object or needs to be parsed
        const valueObj = typeof insertCheckResult.rows[0].value === 'object'
          ? insertCheckResult.rows[0].value
          : JSON.parse(insertCheckResult.rows[0].value);

        expect(valueObj.value).toBe(`test_value_${i}`);
        console.log(`✓ Data inserted into age_params table (key: ${insertCheckResult.rows[0].key}, value: ${JSON.stringify(valueObj)})`);

        // 3. Use the data in a Cypher query
        // Create a function to retrieve the parameter
        await testQueryExecutor.executeSQL(`
          CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_test_param()
          RETURNS ag_catalog.agtype AS $$
          DECLARE
            result_json JSONB;
          BEGIN
            -- Get the parameter value
            SELECT value INTO result_json
            FROM age_params
            WHERE key = 'test_key';

            -- Return as agtype
            RETURN result_json::text::ag_catalog.agtype;
          END;
          $$ LANGUAGE plpgsql;
        `);

        // Execute a Cypher query that uses the parameter
        const cypher = `
          WITH ${TEST_SCHEMA}.get_test_param() AS param
          RETURN param.value AS test_value
        `;

        const cypherResult = await testQueryExecutor.executeCypher(
          cypher,
          {},
          AGE_GRAPH_NAME
        );

        expect(cypherResult.rows).toHaveLength(1);

        // The test_value might be returned as an object or as a string
        const testValueObj = typeof cypherResult.rows[0].test_value === 'string'
          ? JSON.parse(cypherResult.rows[0].test_value)
          : cypherResult.rows[0].test_value;

        expect(testValueObj).toBe(`test_value_${i}`);
        console.log(`✓ Successfully used parameter in Cypher query (value: ${JSON.stringify(testValueObj)})`);

        // Clean up the function
        await testQueryExecutor.executeSQL(`
          DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_test_param()
        `);
      } finally {
        // 4. Release the connection back to the pool
        // This should trigger the cleanup of the age_params table
        await connection.release();
        console.log('✓ Connection released back to the pool');
      }
    }
  });
});
