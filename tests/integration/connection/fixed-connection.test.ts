/**
 * Test for fixed connection handling
 * 
 * This test verifies that we can connect to the database with the updated
 * connection handling code that sets the search_path with a SQL query.
 */

import { describe, it, expect } from 'vitest';
import { PgConnectionManager } from '../../src/db/connector';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

describe('Fixed Connection Handling', () => {
  it('should connect to the database with short timeout', async () => {
    // Connection configuration with reduced timeout
    const connectionConfig = {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'age-integration',
      user: process.env.PGUSER || 'age',
      password: process.env.PGPASSWORD || 'agepassword',
      pool: {
        max: 1, // Just one connection for this test
        connectionTimeoutMillis: 100, // Short timeout for local server
      }
    };
    
    console.log('Creating connection manager...');
    const connectionManager = new PgConnectionManager(connectionConfig);
    
    try {
      console.log('Attempting to get connection...');
      const connection = await connectionManager.getConnection();
      
      console.log('Connection established, executing test query...');
      const result = await connection.query('SELECT 1 as value');
      
      console.log('Query result:', result.rows[0]);
      expect(result.rows[0].value).toBe(1);
      
      // Verify search_path includes ag_catalog
      const searchPathResult = await connection.query('SHOW search_path');
      console.log('Search path:', searchPathResult.rows[0].search_path);
      expect(searchPathResult.rows[0].search_path).toContain('ag_catalog');
      
      console.log('Releasing connection...');
      await connectionManager.releaseConnection(connection);
    } finally {
      console.log('Closing connection manager...');
      await connectionManager.closeAll();
    }
  });
});
