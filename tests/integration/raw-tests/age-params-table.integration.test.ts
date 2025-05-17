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
import { QueryBuilder } from '../../../src/query/builder';
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

// Define a simple schema for testing
const testSchema = {
  vertices: {},
  edges: {},
  version: '1.0.0'
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

    // Reduce the number of iterations to avoid potential connection pool issues
    const iterations = 5;

    // Run the test multiple times to verify consistent behavior
    for (let i = 0; i < iterations; i++) {
      console.log(`\nIteration ${i + 1} of ${iterations}`);

      // Get a connection from the pool
      let connection: Connection | undefined;
      let testQueryExecutor: QueryExecutor | undefined;

      try {
        connection = await connectionManager.getConnection();
        testQueryExecutor = new QueryExecutor(connection);

        // 1. Verify the age_params table exists and check if there's any existing data
        const emptyCheckResult = await testQueryExecutor.executeSQL(`
          SELECT value as count FROM age_params WHERE key = 'test_key'
        `);

        const originalValue = emptyCheckResult.rows.length > 0 ? emptyCheckResult.rows[0].value : null;
        console.log(`Original value: ${JSON.stringify(originalValue)}`);

        // 2. Insert data into the age_params table using QueryBuilder's setParam method
        const queryBuilder = new QueryBuilder(testSchema, testQueryExecutor, AGE_GRAPH_NAME);
        await queryBuilder.setParam('test_key', { value: `test_value_${i}` });

        // Verify the data was inserted
        const insertCheckResult = await testQueryExecutor.executeSQL(`
          SELECT * FROM age_params
        `);

        expect(insertCheckResult.rows).toHaveLength(1);
        expect(insertCheckResult.rows[0].key).toBe('test_key');

        if (originalValue !== null) {
          expect(originalValue).not.toBe(insertCheckResult.rows[0].value);
        }

        // Check if value is already an object or needs to be parsed
        const valueObj = typeof insertCheckResult.rows[0].value === 'object'
          ? insertCheckResult.rows[0].value
          : JSON.parse(insertCheckResult.rows[0].value);

        expect(valueObj.value).toBe(`test_value_${i}`);
        console.log(`✓ Data inserted into age_params table (key: ${insertCheckResult.rows[0].key}, value: ${JSON.stringify(valueObj)})`);

        // 3. Use the data in a Cypher query with QueryBuilder's withAgeParam method
        // Build a query that uses the withAgeParam method
        const cypherResult = await queryBuilder
          .withAgeParam('test_key', 'param')
          .return('param.value AS test_value')
          .execute();

        expect(cypherResult.rows).toHaveLength(1);

        // The test_value might be returned as an object or as a string
        const testValueObj = typeof cypherResult.rows[0].test_value === 'string'
          ? JSON.parse(cypherResult.rows[0].test_value)
          : cypherResult.rows[0].test_value;

        expect(testValueObj).toBe(`test_value_${i}`);
        console.log(`✓ Successfully used parameter in Cypher query (value: ${JSON.stringify(testValueObj)})`);

        // Reset the query builder for next use
        queryBuilder.reset();

        // Manually truncate the age_params table to ensure it's clean for the next iteration
        await testQueryExecutor.executeSQL('TRUNCATE TABLE age_params');
      } finally {
        // 4. Release the connection back to the pool if it was acquired
        if (connection) {
          try {
            await connectionManager.releaseConnection(connection);
            console.log('✓ Connection released back to the pool');
          } catch (error) {
            console.error(`Error releasing connection: ${error.message}`);
          }
        }
      }
    }
  });
});
