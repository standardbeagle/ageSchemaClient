/**
 * Integration tests for connection pool behavior
 * 
 * These tests verify connection pool behavior under load.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PgConnectionManager } from '../../../src/db';
import { connectionConfig } from '../../setup/integration';

describe('Connection Pool Behavior', () => {
  let poolManager: PgConnectionManager;
  
  beforeEach(() => {
    // Create a connection manager with a small pool
    poolManager = new PgConnectionManager({
      ...connectionConfig,
      pool: {
        max: 5, // Small pool size for testing
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 1000,
      }
    });
  });
  
  afterEach(async () => {
    // Clean up
    if (poolManager) {
      await poolManager.closeAll();
    }
  });
  
  it('should handle concurrent connection requests within pool limits', async () => {
    // Request connections up to the pool limit
    const connections = await Promise.all(
      Array(5).fill(0).map(() => poolManager.getConnection())
    );
    
    // Verify we got all connections
    expect(connections).toHaveLength(5);
    
    // Check pool stats
    const stats = poolManager.getPoolStats();
    expect(stats.active).toBe(5);
    expect(stats.idle).toBe(0);
    
    // Release all connections
    await Promise.all(
      connections.map(conn => poolManager.releaseConnection(conn))
    );
    
    // Check pool stats after release
    const statsAfterRelease = poolManager.getPoolStats();
    expect(statsAfterRelease.active).toBe(0);
    expect(statsAfterRelease.idle).toBe(5);
  });
  
  it('should queue connection requests that exceed pool limits', async () => {
    // Get all available connections
    const initialConnections = await Promise.all(
      Array(5).fill(0).map(() => poolManager.getConnection())
    );
    
    // Verify we got all connections
    expect(initialConnections).toHaveLength(5);
    
    // Start a timer
    const startTime = Date.now();
    
    // Request one more connection (this should be queued)
    const connectionPromise = poolManager.getConnection();
    
    // Release one connection after a short delay
    setTimeout(() => {
      poolManager.releaseConnection(initialConnections[0]);
    }, 500);
    
    // Wait for the queued connection
    const extraConnection = await connectionPromise;
    
    // Verify the connection was queued and then fulfilled
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(500);
    expect(extraConnection).toBeDefined();
    
    // Release all remaining connections
    await Promise.all([
      ...initialConnections.slice(1).map(conn => poolManager.releaseConnection(conn)),
      poolManager.releaseConnection(extraConnection)
    ]);
  });
  
  it('should handle connection release and reuse', async () => {
    // Get a connection
    const connection1 = await poolManager.getConnection();
    
    // Execute a query
    await connection1.query('SELECT 1 as value');
    
    // Release the connection
    await poolManager.releaseConnection(connection1);
    
    // Get another connection (should reuse the released one)
    const connection2 = await poolManager.getConnection();
    
    // Execute another query
    const result = await connection2.query('SELECT 2 as value');
    
    // Verify the query worked
    expect(result.rows[0].value).toBe(2);
    
    // Release the connection
    await poolManager.releaseConnection(connection2);
  });
  
  it('should handle many short-lived connections', async () => {
    // Perform many short operations
    const operations = 20; // Number of operations
    
    for (let i = 0; i < operations; i++) {
      // Get a connection
      const connection = await poolManager.getConnection();
      
      // Execute a simple query
      await connection.query(`SELECT ${i} as value`);
      
      // Release the connection
      await poolManager.releaseConnection(connection);
    }
    
    // Check pool stats
    const stats = poolManager.getPoolStats();
    
    // All connections should be idle now
    expect(stats.active).toBe(0);
    expect(stats.idle).toBeGreaterThan(0);
    expect(stats.idle).toBeLessThanOrEqual(5); // Should not exceed pool max
  });
  
  it('should handle connection errors during high load', async () => {
    // Create a connection manager with a small pool and short timeout
    const errorPoolManager = new PgConnectionManager({
      ...connectionConfig,
      pool: {
        max: 3,
        connectionTimeoutMillis: 500, // Short timeout
      }
    });
    
    try {
      // Get all available connections
      const connections = await Promise.all(
        Array(3).fill(0).map(() => errorPoolManager.getConnection())
      );
      
      // Make one connection unusable
      try {
        await connections[0].query('SELECT pg_sleep(10)'); // Long-running query
      } catch (e) {
        // Ignore error
      }
      
      // Try to get more connections than the pool size with a short timeout
      // Some of these should fail due to timeout
      const connectionPromises = Array(10).fill(0).map(() => {
        return errorPoolManager.getConnection()
          .catch(err => err); // Catch errors to continue the test
      });
      
      // Wait for all promises to settle
      const results = await Promise.all(connectionPromises);
      
      // Some should be connections, some should be errors
      const successfulConnections = results.filter(r => !(r instanceof Error));
      const errors = results.filter(r => r instanceof Error);
      
      // We should have some of each
      expect(successfulConnections.length).toBeGreaterThan(0);
      expect(errors.length).toBeGreaterThan(0);
      
      // Release all successful connections
      await Promise.all(
        successfulConnections.map(conn => errorPoolManager.releaseConnection(conn))
      );
    } finally {
      // Clean up
      await errorPoolManager.closeAll();
    }
  });
});
