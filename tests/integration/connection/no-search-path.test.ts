/**
 * Connection test without search_path in connection string
 * 
 * This test verifies that we can connect to the database without
 * setting the search_path in the connection string.
 */

import { describe, it, expect } from 'vitest';
import { PgConnectionManager } from '../../../src/db/connector';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

describe('Connection without search_path', () => {
  it('should connect to the database without search_path in connection string', async () => {
    // Connection configuration without pgOptions
    const connectionConfig = {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'age-integration',
      user: process.env.PGUSER || 'age',
      password: process.env.PGPASSWORD || 'agepassword',
      pool: {
        max: 1,
        connectionTimeoutMillis: 100,
      }
      // No pgOptions with searchPath
    };
    
    console.log('Creating connection manager without search_path...');
    const connectionManager = new PgConnectionManager(connectionConfig);
    
    try {
      console.log('Attempting to get connection...');
      const connection = await connectionManager.getConnection();
      
      console.log('Connection established, executing test query...');
      const result = await connection.query('SELECT 1 as value');
      
      console.log('Query result:', result.rows[0]);
      expect(result.rows[0].value).toBe(1);
      
      console.log('Releasing connection...');
      await connectionManager.releaseConnection(connection);
    } finally {
      console.log('Closing connection manager...');
      await connectionManager.closeAll();
    }
  });
});
