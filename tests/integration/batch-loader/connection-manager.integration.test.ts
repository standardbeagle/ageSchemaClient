/**
 * Integration tests for the BatchLoaderConnectionManager
 * 
 * These tests verify that the BatchLoaderConnectionManager correctly integrates with
 * the existing connection pool and manages the age_params temporary table.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PgConnectionManager } from '../../../src/db/connector';
import { QueryExecutor } from '../../../src/db/query';
import { BatchLoaderConnectionManager } from '../../../src/loader/connection-manager';

// Connection manager
let connectionManager: PgConnectionManager;
// Batch loader connection manager
let batchLoaderConnectionManager: BatchLoaderConnectionManager;
// Flag to indicate if AGE is available
let ageAvailable = false;

// Setup before all tests
beforeAll(async () => {
  // Create connection manager
  connectionManager = new PgConnectionManager({
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
  });

  // Create batch loader connection manager
  batchLoaderConnectionManager = new BatchLoaderConnectionManager(connectionManager);

  try {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Check if AGE is available
    try {
      // Try to check if AGE is installed
      const result = await queryExecutor.executeSQL(`
        SELECT 1 FROM pg_extension WHERE extname = 'age'
      `);
      
      if (result.rows.length > 0) {
        ageAvailable = true;
      } else {
        console.warn('AGE extension not found');
        ageAvailable = false;
      }
    } catch (error) {
      console.warn('Error checking AGE availability:', error);
      ageAvailable = false;
    }
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  } catch (error) {
    console.error('Error setting up tests:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close all connections
  await batchLoaderConnectionManager.closeAll();
});

// Test suite
describe('BatchLoaderConnectionManager', () => {
  // Skip all tests if AGE is not available
  if (!ageAvailable) {
    it.skip('AGE not available, skipping tests', () => {});
    return;
  }
  
  // Test getting a connection
  it('should get a connection from the pool', async () => {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Verify the connection is valid
    expect(connection).toBeDefined();
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  });
  
  // Test the age_params table is created
  it('should create the age_params table', async () => {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Check if the age_params table exists
    const result = await queryExecutor.executeSQL(`
      SELECT 1 FROM pg_tables WHERE tablename = 'age_params'
    `);
    
    // Verify the table exists
    expect(result.rows.length).toBeGreaterThan(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  });
  
  // Test the age_schema_client functions are created
  it('should create the age_schema_client functions', async () => {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Check if the get_vertices function exists
    const verticesResult = await queryExecutor.executeSQL(`
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'age_schema_client' AND p.proname = 'get_vertices'
    `);
    
    // Verify the function exists
    expect(verticesResult.rows.length).toBeGreaterThan(0);
    
    // Check if the get_edges function exists
    const edgesResult = await queryExecutor.executeSQL(`
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'age_schema_client' AND p.proname = 'get_edges'
    `);
    
    // Verify the function exists
    expect(edgesResult.rows.length).toBeGreaterThan(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  });
  
  // Test storing and retrieving data from the age_params table
  it('should store and retrieve data from the age_params table', async () => {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Store data in the age_params table
    await queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ('test_key', '{"value": "test_value"}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = '{"value": "test_value"}'::jsonb
    `);
    
    // Retrieve data from the age_params table
    const result = await queryExecutor.executeSQL(`
      SELECT * FROM age_params WHERE key = 'test_key'
    `);
    
    // Verify the data was stored
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].key).toBe('test_key');
    expect(result.rows[0].value).toEqual({ value: 'test_value' });
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
  });
  
  // Test the age_params table is truncated when a connection is released
  it('should truncate the age_params table when a connection is released', async () => {
    // Get a connection
    const connection = await batchLoaderConnectionManager.getConnection();
    
    // Create query executor
    const queryExecutor = batchLoaderConnectionManager.getQueryExecutor(connection);
    
    // Store data in the age_params table
    await queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ('test_key', '{"value": "test_value"}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = '{"value": "test_value"}'::jsonb
    `);
    
    // Verify the data was stored
    const beforeResult = await queryExecutor.executeSQL(`
      SELECT COUNT(*) FROM age_params
    `);
    
    expect(parseInt(beforeResult.rows[0].count)).toBeGreaterThan(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(connection);
    
    // Get a new connection
    const newConnection = await batchLoaderConnectionManager.getConnection();
    
    // Create a new query executor
    const newQueryExecutor = batchLoaderConnectionManager.getQueryExecutor(newConnection);
    
    // Check if the age_params table is empty
    const afterResult = await newQueryExecutor.executeSQL(`
      SELECT COUNT(*) FROM age_params
    `);
    
    // Verify the table is empty
    expect(parseInt(afterResult.rows[0].count)).toBe(0);
    
    // Release the connection
    await batchLoaderConnectionManager.releaseConnection(newConnection);
  });
  
  // Test concurrent connections have independent age_params tables
  it('should have independent age_params tables for concurrent connections', async () => {
    // Get two connections
    const connection1 = await batchLoaderConnectionManager.getConnection();
    const connection2 = await batchLoaderConnectionManager.getConnection();
    
    // Create query executors
    const queryExecutor1 = batchLoaderConnectionManager.getQueryExecutor(connection1);
    const queryExecutor2 = new QueryExecutor(connection2);
    
    // Store data in the age_params table for connection 1
    await queryExecutor1.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ('test_key_1', '{"value": "test_value_1"}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = '{"value": "test_value_1"}'::jsonb
    `);
    
    // Store data in the age_params table for connection 2
    await queryExecutor2.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ('test_key_2', '{"value": "test_value_2"}'::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = '{"value": "test_value_2"}'::jsonb
    `);
    
    // Verify connection 1 only has its own data
    const result1 = await queryExecutor1.executeSQL(`
      SELECT * FROM age_params
    `);
    
    expect(result1.rows).toHaveLength(1);
    expect(result1.rows[0].key).toBe('test_key_1');
    expect(result1.rows[0].value).toEqual({ value: 'test_value_1' });
    
    // Verify connection 2 only has its own data
    const result2 = await queryExecutor2.executeSQL(`
      SELECT * FROM age_params
    `);
    
    expect(result2.rows).toHaveLength(1);
    expect(result2.rows[0].key).toBe('test_key_2');
    expect(result2.rows[0].value).toEqual({ value: 'test_value_2' });
    
    // Release the connections
    await batchLoaderConnectionManager.releaseConnection(connection1);
    await batchLoaderConnectionManager.releaseConnection(connection2);
  });
});
