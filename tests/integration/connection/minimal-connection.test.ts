/**
 * Minimal connection test for ageSchemaClient
 * 
 * This test uses our library's code with minimal configuration
 * to isolate the connection issue.
 */

import { describe, it, expect } from 'vitest';
import { PgConnectionManager } from '../../src/db/connector';
import * as dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

describe('Minimal Database Connection', () => {
  it('should connect to the database with minimal configuration', async () => {
    // Create a direct pg Pool for comparison
    const pgPool = new pg.Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'age-integration',
      user: process.env.PGUSER || 'age',
      password: process.env.PGPASSWORD || 'agepassword',
      max: 1,
      connectionTimeoutMillis: 100,
    });
    
    try {
      // Test direct pg connection first
      console.log('Testing direct pg connection...');
      const pgClient = await pgPool.connect();
      const pgResult = await pgClient.query('SELECT 1 as value');
      console.log('Direct pg query result:', pgResult.rows[0]);
      pgClient.release();
      
      // Now test our library's connection
      console.log('Testing PgConnectionManager connection...');
      const connectionManager = new PgConnectionManager({
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'age-integration',
        user: process.env.PGUSER || 'age',
        password: process.env.PGPASSWORD || 'agepassword',
        pool: {
          max: 1,
          connectionTimeoutMillis: 100,
        }
      });
      
      const connection = await connectionManager.getConnection();
      const result = await connection.query('SELECT 1 as value');
      console.log('PgConnectionManager query result:', result.rows[0]);
      
      await connectionManager.releaseConnection(connection);
      await connectionManager.closeAll();
      
      expect(result.rows[0].value).toBe(1);
    } finally {
      await pgPool.end();
    }
  });
});
