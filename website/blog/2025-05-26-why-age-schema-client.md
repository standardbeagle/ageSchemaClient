---
slug: why-age-schema-client
title: Why Age Schema Client - Loading Data Quickly and Securely
authors: [andy]
tags: [apache-age, performance, security, typescript]
---

# Why Age Schema Client: Loading Data Quickly and Securely

When working with Apache AGE (A Graph Extension) for PostgreSQL, developers often face challenges around performance, type safety, and security. The Age Schema Client was born from the need to address these challenges head-on, providing a robust solution for working with graph databases in TypeScript applications.

## The Performance Challenge

One of the biggest hurdles when working with Apache AGE is efficiently loading large volumes of data. Traditional approaches often involve:

- Multiple round trips to the database
- Complex transaction management
- Inefficient parameter passing in Cypher queries

Age Schema Client solves these issues with its optimized batch loading system that leverages PostgreSQL's native capabilities.

### How We Achieve Fast Data Loading

Our batch loader uses a clever approach that works around Apache AGE's limitations:

```typescript
// Traditional approach - slow and inefficient
for (const vertex of vertices) {
  await client.query(
    `SELECT * FROM cypher('my_graph', $$
      CREATE (v:Person {name: $1, age: $2})
    $$) as (v agtype)`,
    [vertex.name, vertex.age]
  );
}

// Age Schema Client approach - fast and efficient
const loader = client.createBatchLoader();
await loader.loadVertices('Person', vertices);
```

The key innovation is our use of temporary tables and a single SQL function call:

1. **Temporary Table Staging**: We create temporary tables to stage the data
2. **Single Function Call**: One optimized SQL function processes all the data
3. **Minimal Round Trips**: Reduces database communication overhead
4. **Progress Reporting**: Real-time feedback on loading progress

This approach can load thousands of vertices and edges in seconds rather than minutes.

## The Security Advantage: SQL Parameters Done Right

Security is paramount when working with databases. Age Schema Client ensures that all data is properly parameterized, preventing SQL injection attacks.

### Client-Side SQL Parameterization

Unlike many graph database clients that construct queries through string concatenation, Age Schema Client uses proper SQL parameterization at every level:

```typescript
// Secure parameter handling
const result = await client.query({
  text: `
    SELECT * FROM cypher($1, $$
      MATCH (p:Person {name: $name})
      WHERE p.age > $age
      RETURN p
    $$, $2) as (p agtype)
  `,
  values: [
    graphName,
    { name: userInput, age: ageInput } // Safely parameterized
  ]
});
```

### Why This Matters

1. **SQL Injection Prevention**: All user input is properly escaped and parameterized
2. **Type Safety**: TypeScript ensures parameters match expected types
3. **Performance**: Prepared statements can be reused efficiently
4. **Debugging**: Clear separation between query structure and data

## Real-World Performance Gains

In production environments, we've seen dramatic improvements:

- **Bulk Loading**: 10,000 vertices load in under 5 seconds (vs. minutes with traditional approaches)
- **Memory Efficiency**: Streaming approach handles datasets larger than available RAM
- **Connection Pooling**: Optimized connection management reduces overhead
- **Transaction Safety**: Automatic rollback on errors ensures data integrity

## The Type Safety Bonus

Beyond performance and security, Age Schema Client provides full TypeScript support:

```typescript
// Define your schema with full type safety
interface PersonVertex {
  name: string;
  age: number;
  email?: string;
}

// TypeScript ensures correctness at compile time
const client = new AgeSchemaClient<{
  vertices: {
    Person: PersonVertex;
  };
  edges: {
    KNOWS: { since: Date };
  };
}>(config);

// Compile-time type checking
const person = await client.getVertex('Person', id);
console.log(person.name); // ✓ TypeScript knows this exists
console.log(person.invalid); // ✗ Compile error
```

## Conclusion

Age Schema Client represents a significant step forward in working with Apache AGE. By focusing on performance through intelligent batching, security through proper parameterization, and developer experience through TypeScript integration, we've created a tool that makes graph databases accessible and practical for production use.

Whether you're building a social network, recommendation engine, or knowledge graph, Age Schema Client provides the foundation you need to work quickly and securely with your graph data.

Try it out today and experience the difference proper tooling can make in your graph database projects.

```bash
npm install age-schema-client
```

For more information, check out our [documentation](https://standardbeagle.github.io/ageSchemaClient/) and [GitHub repository](https://github.com/standardbeagle/ageSchemaClient).