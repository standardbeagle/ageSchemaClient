/**
 * Database connection example for the ageSchemaClient library
 */

import {
  PgConnectionManager,
  TransactionManager,
  QueryExecutor,
  IsolationLevel,
} from '../src/db';

// Create a connection manager
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  pool: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  retry: {
    maxAttempts: 3,
    delay: 1000,
  },
  // PostgreSQL-specific options
  pgOptions: {
    // Ensure ag_catalog is in the search path for Apache AGE
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'ageSchemaClient-example',
    statementTimeout: 30000, // 30 seconds
  },
});

// Example usage
async function main() {
  try {
    // Get a connection from the pool
    const connection = await connectionManager.getConnection();
    console.log('Connection acquired');

    // Create a transaction manager
    const transactionManager = new TransactionManager(connection);

    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);

    // Execute a simple query
    const result = await queryExecutor.executeSQL('SELECT NOW() as current_time');
    console.log('Current time:', result.rows[0].current_time);

    // Execute a query with parameters
    const paramResult = await queryExecutor.executeSQL(
      'SELECT $1::text as message',
      ['Hello from ageSchemaClient!']
    );
    console.log('Message:', paramResult.rows[0].message);

    // Execute a transaction
    await transactionManager.withTransaction(async (transaction) => {
      console.log('Transaction started');

      // Execute a query within the transaction
      await queryExecutor.executeSQL('SELECT 1');

      console.log('Transaction committed');
    }, { isolationLevel: IsolationLevel.READ_COMMITTED });

    // Execute a Cypher query (requires Apache AGE extension)
    try {
      const cypherResult = await queryExecutor.executeCypher(
        'MATCH (n) RETURN n LIMIT 5',
        {},
        'default'
      );
      console.log('Cypher query result:', cypherResult.rows);
    } catch (error) {
      console.error('Cypher query failed (AGE extension might not be installed):', error.message);
    }

    // Release the connection back to the pool
    await connectionManager.releaseConnection(connection);
    console.log('Connection released');

    // Get pool statistics
    const stats = connectionManager.getPoolStats();
    console.log('Pool statistics:', stats);

    // Close all connections
    await connectionManager.closeAll();
    console.log('All connections closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
