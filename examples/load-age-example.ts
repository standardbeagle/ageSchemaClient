/**
 * Example demonstrating the automatic loading of Apache AGE extension
 * 
 * This example shows how the PgConnectionManager automatically loads
 * the Apache AGE extension for each new connection.
 */

import { PgConnectionManager } from '../src/db';

async function main() {
  // Create a connection manager with minimal configuration
  const connectionManager = new PgConnectionManager({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    console.log('Getting a connection from the pool...');
    const connection = await connectionManager.getConnection();
    
    console.log('Connection established successfully.');
    console.log('The Apache AGE extension has been automatically loaded.');
    
    // Execute a simple query to verify AGE is loaded
    try {
      const result = await connection.query(`SELECT 'test'::ag_catalog.agtype`);
      console.log('AGE test query result:', result.rows[0]);
    } catch (error) {
      console.error('Error executing AGE test query:', error.message);
    }
    
    // Release the connection back to the pool
    await connectionManager.releaseConnection(connection);
    
    // Close all connections
    await connectionManager.closeAll();
    console.log('All connections closed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
main().catch(console.error);
