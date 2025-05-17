/**
 * Raw integration test for age_params table isolation between concurrent connections
 *
 * This test verifies that the age_params temporary table is properly isolated
 * between concurrent connections. It specifically tests:
 * 
 * 1. Two connections can be acquired concurrently
 * 2. Each connection has its own isolated age_params table
 * 3. Data inserted into one connection's age_params table doesn't affect the other
 * 4. Both connections can execute Cypher queries using their own parameters
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

describe('age_params Table Isolation', () => {
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
  
  it('should maintain isolation between concurrent connections', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }
    
    // Get two connections from the pool
    console.log('Acquiring two concurrent connections...');
    const connection1 = await connectionManager.getConnection();
    const connection2 = await connectionManager.getConnection();
    
    // Create query executors for each connection
    const queryExecutor1 = new QueryExecutor(connection1);
    const queryExecutor2 = new QueryExecutor(connection2);
    
    try {
      // 1. Verify both age_params tables are empty
      const emptyCheck1 = await queryExecutor1.executeSQL(`
        SELECT COUNT(*) as count FROM age_params
      `);
      
      const emptyCheck2 = await queryExecutor2.executeSQL(`
        SELECT COUNT(*) as count FROM age_params
      `);
      
      expect(emptyCheck1.rows[0].count).toBe('0');
      expect(emptyCheck2.rows[0].count).toBe('0');
      console.log('✓ Both age_params tables are empty initially');
      
      // 2. Insert different data into each connection's age_params table
      await queryExecutor1.executeSQL(`
        INSERT INTO age_params (key, value) 
        VALUES ('test_key', '{"value": "connection1_value"}')
      `);
      
      await queryExecutor2.executeSQL(`
        INSERT INTO age_params (key, value) 
        VALUES ('test_key', '{"value": "connection2_value"}')
      `);
      
      // 3. Verify each connection has its own data
      const dataCheck1 = await queryExecutor1.executeSQL(`
        SELECT * FROM age_params
      `);
      
      const dataCheck2 = await queryExecutor2.executeSQL(`
        SELECT * FROM age_params
      `);
      
      // Check if values are already objects or need to be parsed
      const valueObj1 = typeof dataCheck1.rows[0].value === 'object'
        ? dataCheck1.rows[0].value
        : JSON.parse(dataCheck1.rows[0].value);
        
      const valueObj2 = typeof dataCheck2.rows[0].value === 'object'
        ? dataCheck2.rows[0].value
        : JSON.parse(dataCheck2.rows[0].value);
      
      expect(valueObj1.value).toBe('connection1_value');
      expect(valueObj2.value).toBe('connection2_value');
      console.log(`✓ Connection 1 has its own data: ${JSON.stringify(valueObj1)}`);
      console.log(`✓ Connection 2 has its own data: ${JSON.stringify(valueObj2)}`);
      
      // 4. Create functions to retrieve parameters for each connection
      await queryExecutor1.executeSQL(`
        CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_test_param1()
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
      
      await queryExecutor2.executeSQL(`
        CREATE OR REPLACE FUNCTION ${TEST_SCHEMA}.get_test_param2()
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
      
      // 5. Execute Cypher queries using the parameters from each connection
      const cypher1 = `
        WITH ${TEST_SCHEMA}.get_test_param1() AS param
        RETURN param.value AS test_value
      `;
      
      const cypher2 = `
        WITH ${TEST_SCHEMA}.get_test_param2() AS param
        RETURN param.value AS test_value
      `;
      
      const cypherResult1 = await queryExecutor1.executeCypher(
        cypher1,
        {},
        AGE_GRAPH_NAME
      );
      
      const cypherResult2 = await queryExecutor2.executeCypher(
        cypher2,
        {},
        AGE_GRAPH_NAME
      );
      
      // Parse the results if needed
      const testValue1 = typeof cypherResult1.rows[0].test_value === 'string'
        ? JSON.parse(cypherResult1.rows[0].test_value)
        : cypherResult1.rows[0].test_value;
        
      const testValue2 = typeof cypherResult2.rows[0].test_value === 'string'
        ? JSON.parse(cypherResult2.rows[0].test_value)
        : cypherResult2.rows[0].test_value;
      
      expect(testValue1).toBe('connection1_value');
      expect(testValue2).toBe('connection2_value');
      console.log(`✓ Cypher query from connection 1 used its own parameter: ${JSON.stringify(testValue1)}`);
      console.log(`✓ Cypher query from connection 2 used its own parameter: ${JSON.stringify(testValue2)}`);
      
      // 6. Clean up the functions
      await queryExecutor1.executeSQL(`
        DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_test_param1()
      `);
      
      await queryExecutor2.executeSQL(`
        DROP FUNCTION IF EXISTS ${TEST_SCHEMA}.get_test_param2()
      `);
      
      // 7. Verify modifying one connection's table doesn't affect the other
      await queryExecutor1.executeSQL(`
        TRUNCATE TABLE age_params
      `);
      
      const afterTruncate1 = await queryExecutor1.executeSQL(`
        SELECT COUNT(*) as count FROM age_params
      `);
      
      const afterTruncate2 = await queryExecutor2.executeSQL(`
        SELECT COUNT(*) as count FROM age_params
      `);
      
      expect(afterTruncate1.rows[0].count).toBe('0');
      expect(afterTruncate2.rows[0].count).toBe('1');
      console.log('✓ Truncating age_params in connection 1 did not affect connection 2');
      
    } finally {
      // Clean up and release connections
      try {
        await connection1.release();
        console.log('✓ Connection 1 released back to the pool');
      } catch (error) {
        console.error(`Error releasing connection 1: ${error.message}`);
      }
      
      try {
        await connection2.release();
        console.log('✓ Connection 2 released back to the pool');
      } catch (error) {
        console.error(`Error releasing connection 2: ${error.message}`);
      }
    }
  });
});
