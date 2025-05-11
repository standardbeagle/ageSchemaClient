/**
 * Basic usage example for the ageSchemaClient library
 */

import { AgeSchemaClient } from '../src';

// Create a client
const client = new AgeSchemaClient({
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'my_database',
    user: 'postgres',
    password: 'postgres',
  },
  schema: {
    // This will be a schema object or path in the future
  },
});

// In future implementations, we'll be able to:
// 1. Create query builders
// 2. Execute queries
// 3. Manage transactions
// 4. Generate SQL
// 5. Validate schemas

// For now, we can just get the configuration
console.log('Client configuration:', client.getConfig());

// And create a basic query builder
const queryBuilder = client.createQueryBuilder('my_graph');
console.log('Query builder:', queryBuilder);
