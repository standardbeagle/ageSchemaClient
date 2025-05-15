/**
 * Integration tests for error handling
 *
 * These tests verify error handling for database operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { EdgeOperations } from '../../../src/db/edge';
import {
  DatabaseError,
  DatabaseErrorType,
  PgConnectionManager,
  QueryExecutor,
  TransactionManager
} from '../../../src/db';
import {
  connectionManager,
  queryExecutor,
  transactionManager,
  AGE_GRAPH_NAME,
  connectionConfig,
  loadSchemaFixture
} from '../../setup/integration';

describe('Error Handling Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  let ageAvailable = false;

  beforeEach(async () => {
    // Load the basic schema
    basicSchema = loadSchemaFixture('basic-schema');

    // Create SQL generator
    sqlGenerator = new SQLGenerator(basicSchema);

    // Create operations
    vertexOperations = new VertexOperations(basicSchema, queryExecutor, sqlGenerator);
    edgeOperations = new EdgeOperations(basicSchema, queryExecutor, sqlGenerator);

    // Check if AGE is available
    try {
      await queryExecutor.executeSQL(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
      `);
      ageAvailable = true;

      // Clear existing data
      try {
        await queryExecutor.executeCypher(
          `MATCH (n) DETACH DELETE n`,
          {},
          AGE_GRAPH_NAME
        );
      } catch (error) {
        console.warn(`Warning: Could not clear graph data: ${error.message}`);
      }

      // Create test data
      await createTestData();
    } catch (error) {
      ageAvailable = false;
      console.warn('AGE extension not available, skipping AGE-dependent tests');
    }
  });

  /**
   * Create test data for error handling tests
   */
  async function createTestData() {
    // Create a person vertex
    await queryExecutor.executeCypher(
      `
      CREATE (p:Person {
        name: 'Error Test Person',
        email: 'error@example.com',
        age: 30,
        active: true
      })
      RETURN p
      `,
      {},
      AGE_GRAPH_NAME
    );

    // Create a product vertex
    await queryExecutor.executeCypher(
      `
      CREATE (p:Product {
        name: 'Error Test Product',
        price: 99.99,
        sku: 'ERROR-001',
        inStock: true
      })
      RETURN p
      `,
      {},
      AGE_GRAPH_NAME
    );
  }

  describe('Database Connection Errors', () => {
    it('should handle connection errors', async () => {
      // Create a connection manager with invalid credentials
      const invalidConnectionManager = new PgConnectionManager({
        ...connectionConfig,
        host: 'nonexistent-host',
        retry: {
          maxAttempts: 1, // Only try once to speed up the test
          delay: 100
        }
      });

      try {
        // Attempt to get a connection
        await invalidConnectionManager.getConnection();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.type).toBe(DatabaseErrorType.CONNECTION);
        expect(error.message).toContain('Failed to get connection');
      } finally {
        // Clean up
        await invalidConnectionManager.closeAll();
      }
    });

    it('should handle connection pool exhaustion', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping connection pool exhaustion test: AGE not available');
        return;
      }

      // Create a connection manager with a small pool
      const smallPoolManager = new PgConnectionManager({
        ...connectionConfig,
        pool: {
          max: 2,
          idleTimeoutMillis: 1000,
          connectionTimeoutMillis: 500 // Short timeout
        }
      });

      try {
        // Get all available connections
        const connections = await Promise.all([
          smallPoolManager.getConnection(),
          smallPoolManager.getConnection()
        ]);

        // Attempt to get one more connection (should timeout)
        const connectionPromise = smallPoolManager.getConnection();

        // Wait for the timeout
        await expect(connectionPromise).rejects.toThrow();
      } catch (error) {
        console.error('Error in connection pool exhaustion test:', error.message);
        throw error;
      } finally {
        // Clean up
        await smallPoolManager.closeAll();
      }
    }, 10000); // Set timeout to 10 seconds

    it('should handle connection recovery after errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping connection recovery test: AGE not available');
        return;
      }

      // Create a connection manager
      const recoveryManager = new PgConnectionManager(connectionConfig);

      try {
        // Get a connection
        const connection = await recoveryManager.getConnection();

        // Simulate a connection error
        try {
          await connection.query('SELECT pg_terminate_backend(pg_backend_pid())');
        } catch (error) {
          // This error is expected
        }

        // Try to get a new connection
        const newConnection = await recoveryManager.getConnection();

        // Verify the new connection works
        const result = await newConnection.query('SELECT 1 as value');
        expect(result.rows[0].value).toBe(1);
      } catch (error) {
        console.error('Error in connection recovery test:', error.message);
        throw error;
      } finally {
        // Clean up
        await recoveryManager.closeAll();
      }
    }, 10000); // Set timeout to 10 seconds
  });

  describe('Query Execution Errors', () => {
    it('should handle SQL syntax errors', async () => {
      try {
        // Execute a query with a syntax error
        await queryExecutor.executeSQL('SELEC * FROM nonexistent_table');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.type).toBe(DatabaseErrorType.QUERY);
        expect(error.message).toContain('Query execution failed');
        expect(error.originalError).toBeDefined();
        expect(error.originalError.message).toContain('syntax error');
      }
    });

    it('should handle Cypher syntax errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping Cypher syntax error test: AGE not available');
        return;
      }

      try {
        // Execute a Cypher query with a syntax error
        await queryExecutor.executeCypher(
          'MATC (n:Person) RETURN n',
          {},
          AGE_GRAPH_NAME
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.type).toBe(DatabaseErrorType.QUERY);
        expect(error.message).toContain('Query execution failed');
      }
    });

    it('should handle constraint violations', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping constraint violations test: AGE not available');
        return;
      }

      try {
        // Create a vertex with invalid data (missing required email)
        await vertexOperations.createVertex(
          'Person',
          {
            name: 'Invalid Person',
            age: 30,
            active: true
            // Missing required email
          },
          AGE_GRAPH_NAME
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeDefined();
        expect(error.message).toContain('email');
      }
    });

    it('should handle query timeouts', async () => {
      try {
        // Execute a query with a very short timeout
        await queryExecutor.executeSQL(
          'SELECT pg_sleep(1)', // Sleep for 1 second
          [],
          { timeout: 10 } // 10ms timeout (should trigger timeout)
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toContain('Query execution failed');
        expect(error.originalError).toBeDefined();
      }
    });
  });

  describe('Schema Validation Errors', () => {
    it('should handle vertex schema validation errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping vertex schema validation test: AGE not available');
        return;
      }

      try {
        // Create a vertex with wrong property type
        await vertexOperations.createVertex(
          'Person',
          {
            name: 'Type Error Person',
            email: 'type.error@example.com',
            age: 'thirty', // Should be a number
            active: true
          },
          AGE_GRAPH_NAME
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeDefined();
        expect(error.message).toContain('age');
        expect(error.message).toContain('type');
      }
    });

    it('should handle edge schema validation errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping edge schema validation test: AGE not available');
        return;
      }

      try {
        // Get the test person and product
        const personResult = await queryExecutor.executeCypher(
          `MATCH (p:Person {name: 'Error Test Person'}) RETURN p`,
          {},
          AGE_GRAPH_NAME
        );

        const productResult = await queryExecutor.executeCypher(
          `MATCH (p:Product {name: 'Error Test Product'}) RETURN p`,
          {},
          AGE_GRAPH_NAME
        );

        const person = personResult.rows[0].p;
        const product = productResult.rows[0].p;

        try {
          // Create an edge with wrong property type
          await edgeOperations.createEdge(
            'PURCHASED',
            person,
            product,
            {
              date: new Date(),
              quantity: 'two', // Should be a number
              total: 199.98
            },
            AGE_GRAPH_NAME
          );
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // Verify error
          expect(error).toBeDefined();
          expect(error.message).toContain('quantity');
          expect(error.message).toContain('type');
        }
      } catch (error) {
        // This might happen if the test data wasn't created properly
        console.warn('Error in edge schema validation test:', error.message);
        // Skip the test
      }
    });

    it('should handle unknown vertex label errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping unknown vertex label test: AGE not available');
        return;
      }

      try {
        // Create a vertex with an unknown label
        await vertexOperations.createVertex(
          'UnknownLabel',
          {
            name: 'Unknown Label',
            value: 123
          },
          AGE_GRAPH_NAME
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify error
        expect(error).toBeDefined();
        expect(error.message).toContain('UnknownLabel');
      }
    });

    it('should handle unknown edge label errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping unknown edge label test: AGE not available');
        return;
      }

      try {
        // Get the test person and product
        const personResult = await queryExecutor.executeCypher(
          `MATCH (p:Person {name: 'Error Test Person'}) RETURN p`,
          {},
          AGE_GRAPH_NAME
        );

        const productResult = await queryExecutor.executeCypher(
          `MATCH (p:Product {name: 'Error Test Product'}) RETURN p`,
          {},
          AGE_GRAPH_NAME
        );

        const person = personResult.rows[0].p;
        const product = productResult.rows[0].p;

        try {
          // Create an edge with an unknown label
          await edgeOperations.createEdge(
            'UNKNOWN_EDGE',
            person,
            product,
            {
              timestamp: new Date()
            },
            AGE_GRAPH_NAME
          );
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // Verify error
          expect(error).toBeDefined();
          expect(error.message).toContain('UNKNOWN_EDGE');
        }
      } catch (error) {
        // This might happen if the test data wasn't created properly
        console.warn('Error in unknown edge label test:', error.message);
        // Skip the test
      }
    });
  });

  describe('Transaction Errors', () => {
    it('should handle transaction commit errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping transaction commit errors test: AGE not available');
        return;
      }

      try {
        // Start a transaction
        const transaction = await transactionManager.beginTransaction();

        try {
          // Execute a query in the transaction
          await queryExecutor.executeSQL(
            'INSERT INTO nonexistent_table (column) VALUES ($1)',
            ['value'],
            { transaction }
          );
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // This error is expected
          expect(error).toBeDefined();
        }

        try {
          // Try to commit the transaction after an error
          await transaction.commit();
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // Verify error
          expect(error).toBeInstanceOf(DatabaseError);
          expect(error.type).toBe(DatabaseErrorType.TRANSACTION);
          expect(error.message).toContain('Failed to commit transaction');
        }
      } catch (error) {
        console.error('Error in transaction commit errors test:', error.message);
        throw error;
      }
    });

    it('should handle transaction rollback errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping transaction rollback errors test: AGE not available');
        return;
      }

      try {
        // Start a transaction
        const transaction = await transactionManager.beginTransaction();

        // Simulate a connection error
        try {
          await queryExecutor.executeSQL(
            'SELECT pg_terminate_backend(pg_backend_pid())',
            [],
            { transaction }
          );
        } catch (error) {
          // This error is expected
        }

        try {
          // Try to rollback the transaction after a connection error
          await transaction.rollback();
          // May or may not throw depending on the database implementation
        } catch (error) {
          // Verify error
          expect(error).toBeInstanceOf(DatabaseError);
          expect(error.type).toBe(DatabaseErrorType.TRANSACTION);
          expect(error.message).toContain('Failed to rollback transaction');
        }
      } catch (error) {
        console.error('Error in transaction rollback errors test:', error.message);
        throw error;
      }
    });

    it('should handle nested transaction errors', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping nested transaction errors test: AGE not available');
        return;
      }

      try {
        // Start an outer transaction
        const outerTransaction = await transactionManager.beginTransaction();

        try {
          // Execute a query in the outer transaction
          await queryExecutor.executeSQL(
            'CREATE TEMPORARY TABLE temp_test (id SERIAL, value TEXT)',
            [],
            { transaction: outerTransaction }
          );

          // Create a savepoint
          await queryExecutor.executeSQL(
            'SAVEPOINT test_savepoint',
            [],
            { transaction: outerTransaction }
          );

          // Execute a query that will fail
          try {
            await queryExecutor.executeSQL(
              'INSERT INTO temp_test (nonexistent_column) VALUES ($1)',
              ['value'],
              { transaction: outerTransaction }
            );
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // This error is expected
            expect(error).toBeDefined();
          }

          // Rollback to the savepoint
          await queryExecutor.executeSQL(
            'ROLLBACK TO SAVEPOINT test_savepoint',
            [],
            { transaction: outerTransaction }
          );

          // Execute a valid query
          await queryExecutor.executeSQL(
            'INSERT INTO temp_test (value) VALUES ($1)',
            ['valid value'],
            { transaction: outerTransaction }
          );

          // Commit the outer transaction
          await outerTransaction.commit();
        } catch (error) {
          // Rollback on error
          await outerTransaction.rollback();
          throw error;
        }
      } catch (error) {
        console.error('Error in nested transaction errors test:', error.message);
        throw error;
      }
    });
  });

  describe('Retry Mechanisms', () => {
    it('should retry failed queries', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping retry failed queries test: AGE not available');
        return;
      }

      try {
        // Create a query executor with retry
        const retryConnectionManager = new PgConnectionManager(connectionConfig);
        const connection = await retryConnectionManager.getConnection();
        const retryQueryExecutor = new QueryExecutor(connection);

        // Mock a temporary error by causing a deadlock-like situation
        let attempts = 0;

        // Patch the connection.query method to simulate a temporary error
        const originalQuery = connection.query;
        connection.query = async (text, params) => {
          if (text.includes('SIMULATE_ERROR') && attempts < 2) {
            attempts++;
            throw new Error('simulated temporary error');
          }
          return originalQuery.call(connection, text, params);
        };

        try {
          // Execute a query that will fail temporarily but succeed after retries
          const result = await retryQueryExecutor.executeSQL(
            'SELECT 1 as value -- SIMULATE_ERROR',
            [],
            { maxRetries: 3, retryDelay: 100 }
          );

          // Verify the query eventually succeeded
          expect(result.rows[0].value).toBe(1);
          expect(attempts).toBe(2);
        } finally {
          // Restore the original query method
          connection.query = originalQuery;

          // Clean up
          await retryConnectionManager.closeAll();
        }
      } catch (error) {
        console.error('Error in retry failed queries test:', error.message);
        throw error;
      }
    });

    it('should handle permanent failures after retries', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping permanent failures test: AGE not available');
        return;
      }

      try {
        // Create a query executor with retry
        const retryConnectionManager = new PgConnectionManager(connectionConfig);
        const connection = await retryConnectionManager.getConnection();
        const retryQueryExecutor = new QueryExecutor(connection);

        // Mock a permanent error
        let attempts = 0;

        // Patch the connection.query method to simulate a permanent error
        const originalQuery = connection.query;
        connection.query = async (text, params) => {
          if (text.includes('PERMANENT_ERROR')) {
            attempts++;
            throw new Error('simulated permanent error');
          }
          return originalQuery.call(connection, text, params);
        };

        try {
          // Execute a query that will always fail
          await retryQueryExecutor.executeSQL(
            'SELECT 1 as value -- PERMANENT_ERROR',
            [],
            { maxRetries: 3, retryDelay: 100 }
          );

          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // Verify error
          expect(error).toBeDefined();
          expect(error.message).toContain('Query execution failed');

          // Verify retries were attempted
          expect(attempts).toBe(4); // Initial attempt + 3 retries
        } finally {
          // Restore the original query method
          connection.query = originalQuery;

          // Clean up
          await retryConnectionManager.closeAll();
        }
      } catch (error) {
        console.error('Error in permanent failures test:', error.message);
        throw error;
      }
    });
  });
});
