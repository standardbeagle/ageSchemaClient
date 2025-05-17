# Apache AGE Schema Client Examples

This directory contains examples of how to use the Apache AGE Schema Client.

## Query Builder Example

The `query-builder-example.ts` file demonstrates how to use the QueryBuilder with Apache AGE correctly. It shows:

1. How to create a connection to an Apache AGE database
2. How to create a test schema and graph
3. How to create PostgreSQL functions to handle data conversion between Apache AGE and your application
4. How to execute Cypher queries using UNWIND with function return values
5. How to handle different types of queries (basic MATCH, WHERE, ORDER BY, etc.)

### Running the Example

To run the example, you need to have an Apache AGE database running. You can use the `.env.test` file to configure the connection.

```bash
# Install dependencies
pnpm install

# Run the example
pnpm ts-node examples/query-builder-example.ts
```

## Best Practices

When working with Apache AGE, follow these best practices:

1. **Use PostgreSQL Functions for Data Conversion**: Create PostgreSQL functions that handle the data conversion between Apache AGE and your application.

2. **Use UNWIND with Function Return Values for Parameterized Queries**: When you need to pass parameters to a Cypher query, use a PostgreSQL function that returns the parameters as an `ag_catalog.agtype` and then use UNWIND in your Cypher query.

3. **Use Fully Qualified Names**: Always use fully qualified names for all entities in your Cypher queries.

4. **Handle Arrays of Objects**: When working with arrays of objects, create a function that returns the array as an `ag_catalog.agtype`.

5. **Use the Correct Data Types**: When working with Apache AGE, make sure to use the correct data types.

For more detailed information, see the [Query Builder Usage Guide](../docs/query-builder-usage.md).
