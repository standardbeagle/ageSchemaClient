/**
 * Integration tests for the database connector
 * 
 * These tests connect to a real PostgreSQL database with the AGE extension.
 */

import { describe, it, expect } from 'vitest';
import { connectionManager, queryExecutor, AGE_GRAPH_NAME } from '../../setup/integration';

describe('PgConnectionManager Integration', () => {
  it('should connect to the database', async () => {
    // Get a connection from the pool
    const connection = await connectionManager.getConnection();
    
    // Execute a simple query to verify connection
    const result = await connection.query('SELECT 1 as value');
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);
    
    // Release the connection back to the pool
    await connectionManager.releaseConnection(connection);
  });
  
  it('should get pool statistics', () => {
    const stats = connectionManager.getPoolStats();
    
    expect(stats).toBeDefined();
    expect(stats.max).toBeGreaterThan(0);
  });
});

describe('QueryExecutor Integration', () => {
  it('should execute a SQL query', async () => {
    const result = await queryExecutor.executeSQL('SELECT 1 as value');
    
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe(1);
  });
  
  it('should execute a SQL query with parameters', async () => {
    const result = await queryExecutor.executeSQL(
      'SELECT $1::text as message',
      ['Hello from integration test']
    );
    
    expect(result).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].message).toBe('Hello from integration test');
  });
  
  it('should execute a Cypher query', async () => {
    // Create a test vertex
    const createResult = await queryExecutor.executeCypher(
      'CREATE (n:Person {name: $name, age: $age}) RETURN n',
      { name: 'Test Person', age: 30 },
      AGE_GRAPH_NAME
    );
    
    expect(createResult).toBeDefined();
    expect(createResult.rows).toHaveLength(1);
    
    // Query the vertex
    const queryResult = await queryExecutor.executeCypher(
      'MATCH (n:Person {name: $name}) RETURN n',
      { name: 'Test Person' },
      AGE_GRAPH_NAME
    );
    
    expect(queryResult).toBeDefined();
    expect(queryResult.rows).toHaveLength(1);
    
    // The result structure depends on AGE's response format
    // This is a basic check that we got something back
    const person = queryResult.rows[0];
    expect(person).toBeDefined();
  });
});
