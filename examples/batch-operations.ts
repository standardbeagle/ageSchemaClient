/**
 * Batch operations example for the ageSchemaClient library
 */

import {
  PgConnectionManager,
  QueryExecutor,
  VertexOperations,
  EdgeOperations,
  BatchOperations,
} from '../src/db';
import { SQLGenerator } from '../src/sql/generator';
import { extendSQLGeneratorWithBatchOperations } from '../src/sql/batch';

// Extend SQLGenerator with batch operations
extendSQLGeneratorWithBatchOperations(SQLGenerator);

// Sample schema definition
const schema = {
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' },
        active: { type: 'boolean' },
      },
      required: ['name', 'email'],
    },
    Company: {
      properties: {
        name: { type: 'string' },
        industry: { type: 'string' },
        founded: { type: 'date' },
        employees: { type: 'integer' },
      },
      required: ['name'],
    },
  },
  edges: {
    WORKS_AT: {
      properties: {
        since: { type: 'date' },
        position: { type: 'string' },
        salary: { type: 'integer' },
      },
      fromVertex: 'Person',
      toVertex: 'Company',
      required: ['since', 'position'],
    },
    KNOWS: {
      properties: {
        since: { type: 'date' },
        relationship: { type: 'string' },
      },
      fromVertex: 'Person',
      toVertex: 'Person',
    },
  },
};

// Example usage
async function main() {
  try {
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
    });

    // Get a connection from the pool
    const connection = await connectionManager.getConnection();
    console.log('Connection acquired');

    // Create a query executor
    const queryExecutor = new QueryExecutor(connection);

    // Create a SQL generator
    const sqlGenerator = new SQLGenerator(schema);

    // Create vertex and edge operations
    const vertexOperations = new VertexOperations(schema, queryExecutor, sqlGenerator);
    const edgeOperations = new EdgeOperations(schema, queryExecutor, sqlGenerator, vertexOperations);

    // Create batch operations
    const batchOperations = new BatchOperations(
      schema,
      queryExecutor,
      sqlGenerator,
      vertexOperations,
      edgeOperations
    );

    // Generate sample data
    const people = Array(1000).fill(0).map((_, i) => ({
      name: `Person ${i}`,
      age: 20 + (i % 50),
      email: `person${i}@example.com`,
      active: i % 3 === 0,
    }));

    const companies = Array(10).fill(0).map((_, i) => ({
      name: `Company ${i}`,
      industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][i % 5],
      founded: new Date(1980 + i * 5, 0, 1),
      employees: 100 * (i + 1),
    }));

    console.log('Creating vertices in batch...');
    console.time('Create people');
    const createdPeople = await batchOperations.createVerticesBatch('Person', people, {
      batchSize: 200,
      collectMetrics: true,
    });
    console.timeEnd('Create people');
    console.log(`Created ${createdPeople.length} people`);

    console.time('Create companies');
    const createdCompanies = await batchOperations.createVerticesBatch('Company', companies);
    console.timeEnd('Create companies');
    console.log(`Created ${createdCompanies.length} companies`);

    // Create employment relationships
    const employmentEdges = createdPeople.slice(0, 500).map((person, i) => ({
      fromVertex: person,
      toVertex: createdCompanies[i % createdCompanies.length],
      data: {
        since: new Date(2010 + (i % 10), (i % 12), 1),
        position: ['Engineer', 'Manager', 'Director', 'VP', 'CEO'][i % 5],
        salary: 50000 + (i % 10) * 10000,
      },
    }));

    console.log('Creating employment edges in batch...');
    console.time('Create employment edges');
    const createdEmploymentEdges = await batchOperations.createEdgesBatch('WORKS_AT', employmentEdges, {
      batchSize: 100,
      collectMetrics: true,
    });
    console.timeEnd('Create employment edges');
    console.log(`Created ${createdEmploymentEdges.length} employment relationships`);

    // Create friendship relationships
    const friendshipEdges = [];
    for (let i = 0; i < 1000; i++) {
      const fromIndex = Math.floor(Math.random() * createdPeople.length);
      let toIndex;
      do {
        toIndex = Math.floor(Math.random() * createdPeople.length);
      } while (toIndex === fromIndex);

      friendshipEdges.push({
        fromVertex: createdPeople[fromIndex],
        toVertex: createdPeople[toIndex],
        data: {
          since: new Date(2015 + (i % 5), (i % 12), 1),
          relationship: ['Friend', 'Colleague', 'Family', 'Acquaintance'][i % 4],
        },
      });
    }

    console.log('Creating friendship edges in batch...');
    console.time('Create friendship edges');
    const createdFriendshipEdges = await batchOperations.createEdgesBatch('KNOWS', friendshipEdges, {
      batchSize: 200,
      useTempTables: true,
      collectMetrics: true,
    });
    console.timeEnd('Create friendship edges');
    console.log(`Created ${createdFriendshipEdges.length} friendship relationships`);

    // Release the connection
    connection.release();
    console.log('Connection released');

    // Close all connections
    await connectionManager.closeAll();
    console.log('All connections closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
if (require.main === module) {
  main();
}

export default main;
