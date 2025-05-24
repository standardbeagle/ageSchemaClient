/**
 * Direct vs Wrapper connection test
 *
 * This test compares a direct pg connection with our PgConnectionManager
 * using identical configuration.
 */

import { describe, it, expect } from 'vitest';
import { PgConnectionManager } from '../../src/db/connector';
import * as dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Create identical configuration for both
const connectionConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  max: 1,
  connectionTimeoutMillis: 100,
};

describe('Direct vs Wrapper Connection', () => {
  it('should connect directly with pg', async () => {
    // Create a direct pg Pool
    const pgPool = new pg.Pool(connectionConfig);

    try {
      console.log('Testing direct pg connection...');
      const pgClient = await pgPool.connect();

      console.log('Direct connection established, executing test query...');
      const pgResult = await pgClient.query('SELECT 1 as value');

      console.log('Direct query result:', pgResult.rows[0]);
      expect(pgResult.rows[0].value).toBe(1);

      pgClient.release();
    } finally {
      await pgPool.end();
    }
  });

  it('should connect with PgConnectionManager', async () => {
    // Create a connection manager with the same config
    const connectionManager = new PgConnectionManager({
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
      user: connectionConfig.user,
      password: connectionConfig.password,
      pool: {
        max: connectionConfig.max,
        connectionTimeoutMillis: connectionConfig.connectionTimeoutMillis,
      },
      // Explicitly disable pgOptions to avoid search_path issues
      pgOptions: null as any
    });

    try {
      console.log('Testing PgConnectionManager connection...');
      const connection = await connectionManager.getConnection();

      console.log('PgConnectionManager connection established, executing test query...');
      const result = await connection.query('SELECT 1 as value');

      console.log('PgConnectionManager query result:', result.rows[0]);
      expect(result.rows[0].value).toBe(1);

      await connectionManager.releaseConnection(connection);
    } finally {
      await connectionManager.closeAll();
    }
  });
});
