/**
 * Basic usage example for the ageSchemaClient library
 * 
 * This example shows how to use the individual components:
 * - Connection Pool Management
 * - Query Building  
 * - Schema Loading
 */

import { 
  PgConnectionManager, 
  QueryBuilder, 
  QueryExecutor,
  SchemaLoader 
} from '../src';

async function basicUsageExample() {
  // 1. Set up connection pool
  const connectionManager = new PgConnectionManager({
    host: 'localhost',
    port: 5432,
    database: 'my_database',
    user: 'postgres',
    password: 'postgres',
    // PostgreSQL-specific options
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'ageSchemaClient-basic',
    },
  });

  // 2. Set up query executor
  const queryExecutor = new QueryExecutor(connectionManager);

  // 3. Load and validate schema
  const schemaLoader = new SchemaLoader(connectionManager);
  
  // Example schema definition
  const schema = {
    version: '1.0.0',
    vertices: {
      Person: {
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          age: { type: 'integer' }
        },
        required: ['id', 'name']
      }
    },
    edges: {
      KNOWS: {
        properties: {},
        fromVertex: 'Person',
        toVertex: 'Person'
      }
    }
  };

  // 4. Create query builder with schema and executor
  const queryBuilder = new QueryBuilder(schema, queryExecutor, 'my_graph');

  // 5. Build and execute queries
  const query = queryBuilder
    .match('Person', 'p')
    .where('p.age > $minAge')
    .return('p.name', 'p.age')
    .limit(10);

  console.log('Query built successfully');
  console.log('Components initialized:', {
    connectionManager: !!connectionManager,
    queryExecutor: !!queryExecutor,
    schemaLoader: !!schemaLoader,
    queryBuilder: !!queryBuilder
  });

  // Note: In a real application, you would execute the query:
  // const results = await query.execute();
}

// Run the example
basicUsageExample().catch(console.error);
