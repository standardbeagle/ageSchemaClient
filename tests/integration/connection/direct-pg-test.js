/**
 * Direct PostgreSQL connection test
 *
 * This script tests a direct connection to PostgreSQL using the pg module
 * without any of our library's code.
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Create a connection pool with the same settings
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'age-integration',
  user: process.env.PGUSER || 'age',
  password: process.env.PGPASSWORD || 'agepassword',
  max: 1, // Just one connection for this test
  connectionTimeoutMillis: 100, // Short timeout for local server
});

// Add error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function testConnection() {
  console.log('Testing direct pg connection...');
  console.log('Connection config:', {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: '********',
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();

    try {
      console.log('Connection established, executing test query...');
      const result = await client.query('SELECT 1 as value');
      console.log('Query result:', result.rows[0]);

      // Try to load AGE extension
      try {
        console.log('Testing AGE extension...');
        await client.query('LOAD \'age\';');

        // Check if AGE is available
        const ageResult = await client.query(`
          SELECT COUNT(*) > 0 as age_available
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
        `);

        console.log('AGE availability result:', ageResult.rows[0]);
      } catch (ageError) {
        console.error('Error testing AGE extension:', ageError.message);
      }
    } finally {
      console.log('Releasing client...');
      client.release();
    }
  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    console.log('Ending pool...');
    await pool.end();
    console.log('Pool ended');
  }
}

// Run the test
testConnection().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
