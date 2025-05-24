# Your First Graph

Create and populate your first graph database using ageSchemaClient. This tutorial will walk you through building a social network graph from scratch.

## What We'll Build

In this tutorial, we'll create a social network graph with:
- **People** (vertices) with properties like name, age, and city
- **Relationships** (edges) showing how people know each other
- **Companies** (vertices) where people work
- **Employment relationships** connecting people to companies

## Prerequisites

Before starting, ensure you have:
- ageSchemaClient installed ([Installation Guide](./installation))
- Apache AGE database running
- Basic understanding of graph concepts (vertices and edges)

## Setting Up the Client

First, let's set up our client connection:

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password'
});

// Connect to the database
await client.connect();
console.log('Connected to Apache AGE database');
```

## Creating a Graph

Create a new graph for our social network:

```typescript
// Create a new graph
await client.createGraph('social_network');
console.log('Graph "social_network" created');

// Switch to the new graph
client.useGraph('social_network');
console.log('Now using graph: social_network');

// Verify the graph exists
const graphs = await client.listGraphs();
console.log('Available graphs:', graphs);
```

### Graph Management

You can also manage graphs programmatically:

```typescript
// Check if a graph exists
const exists = await client.graphExists('social_network');
console.log('Graph exists:', exists);

// Get graph information
const graphInfo = await client.getGraphInfo('social_network');
console.log('Graph info:', graphInfo);

// List all graphs
const allGraphs = await client.listGraphs();
console.log('All graphs:', allGraphs);
```

## Adding Vertices

Let's start by adding people to our social network graph.

### Creating Individual Vertices

```typescript
// Add individual people with properties
const alice = await client.query()
  .create('(p:Person {name: $name, age: $age, city: $city, email: $email})')
  .setParam('name', 'Alice Johnson')
  .setParam('age', 30)
  .setParam('city', 'New York')
  .setParam('email', 'alice@example.com')
  .return('p')
  .execute();

console.log('Created person:', alice[0]);

const bob = await client.query()
  .create('(p:Person {name: $name, age: $age, city: $city, email: $email})')
  .setParam('name', 'Bob Smith')
  .setParam('age', 25)
  .setParam('city', 'San Francisco')
  .setParam('email', 'bob@example.com')
  .return('p')
  .execute();

const charlie = await client.query()
  .create('(p:Person {name: $name, age: $age, city: $city, email: $email})')
  .setParam('name', 'Charlie Brown')
  .setParam('age', 35)
  .setParam('city', 'Chicago')
  .setParam('email', 'charlie@example.com')
  .return('p')
  .execute();
```

### Creating Multiple Vertices at Once

For better performance, create multiple vertices in a single query:

```typescript
// Create multiple people using UNWIND
const people = await client.query()
  .unwind('$people', 'person')
  .create('(p:Person)')
  .set('p = person')
  .setParam('people', [
    { name: 'Diana Prince', age: 28, city: 'Boston', email: 'diana@example.com' },
    { name: 'Eve Wilson', age: 32, city: 'Seattle', email: 'eve@example.com' },
    { name: 'Frank Miller', age: 29, city: 'Austin', email: 'frank@example.com' }
  ])
  .return('p')
  .execute();

console.log('Created people:', people);
```

### Adding Company Vertices

Let's also add some companies:

```typescript
// Create companies
const companies = await client.query()
  .unwind('$companies', 'company')
  .create('(c:Company)')
  .set('c = company')
  .setParam('companies', [
    {
      name: 'TechCorp',
      industry: 'Technology',
      location: 'San Francisco',
      founded: 2010,
      employees: 500
    },
    {
      name: 'DataSystems',
      industry: 'Software',
      location: 'New York',
      founded: 2015,
      employees: 200
    },
    {
      name: 'InnovateLab',
      industry: 'Research',
      location: 'Boston',
      founded: 2018,
      employees: 50
    }
  ])
  .return('c')
  .execute();

console.log('Created companies:', companies);
```

### Verifying Vertices

Let's check what we've created:

```typescript
// Count all vertices
const vertexCount = await client.query()
  .match('(n)')
  .return('count(n) as total_vertices')
  .execute();

console.log('Total vertices:', vertexCount[0].total_vertices);

// Get all people
const allPeople = await client.query()
  .match('(p:Person)')
  .return('p.name, p.age, p.city, p.email')
  .orderBy('p.name')
  .execute();

console.log('All people:', allPeople);

// Get all companies
const allCompanies = await client.query()
  .match('(c:Company)')
  .return('c.name, c.industry, c.location, c.employees')
  .orderBy('c.name')
  .execute();

console.log('All companies:', allCompanies);
```

## Adding Relationships

Now let's connect our people and companies with relationships.

### Social Relationships

Create friendships and professional relationships between people:

```typescript
// Create social relationships
const socialRelationships = await client.query()
  .unwind('$relationships', 'rel')
  .match('(from:Person {name: rel.from})')
  .match('(to:Person {name: rel.to})')
  .create('(from)-[r:KNOWS]->(to)')
  .set('r = rel.properties')
  .setParam('relationships', [
    {
      from: 'Alice Johnson',
      to: 'Bob Smith',
      properties: { since: '2020-01-15', type: 'friend', strength: 8 }
    },
    {
      from: 'Bob Smith',
      to: 'Charlie Brown',
      properties: { since: '2019-06-10', type: 'colleague', strength: 6 }
    },
    {
      from: 'Alice Johnson',
      to: 'Diana Prince',
      properties: { since: '2021-03-20', type: 'friend', strength: 9 }
    },
    {
      from: 'Charlie Brown',
      to: 'Eve Wilson',
      properties: { since: '2020-11-05', type: 'mentor', strength: 7 }
    },
    {
      from: 'Diana Prince',
      to: 'Frank Miller',
      properties: { since: '2022-01-12', type: 'colleague', strength: 5 }
    }
  ])
  .return('r')
  .execute();

console.log('Created social relationships:', socialRelationships.length);
```

### Employment Relationships

Connect people to companies where they work:

```typescript
// Create employment relationships
const employmentRelationships = await client.query()
  .unwind('$jobs', 'job')
  .match('(person:Person {name: job.person})')
  .match('(company:Company {name: job.company})')
  .create('(person)-[r:WORKS_AT]->(company)')
  .set('r = job.properties')
  .setParam('jobs', [
    {
      person: 'Alice Johnson',
      company: 'DataSystems',
      properties: {
        position: 'Senior Developer',
        startDate: '2019-03-01',
        salary: 95000,
        department: 'Engineering'
      }
    },
    {
      person: 'Bob Smith',
      company: 'TechCorp',
      properties: {
        position: 'Product Manager',
        startDate: '2020-07-15',
        salary: 110000,
        department: 'Product'
      }
    },
    {
      person: 'Charlie Brown',
      company: 'DataSystems',
      properties: {
        position: 'Engineering Manager',
        startDate: '2018-01-10',
        salary: 130000,
        department: 'Engineering'
      }
    },
    {
      person: 'Diana Prince',
      company: 'InnovateLab',
      properties: {
        position: 'Research Scientist',
        startDate: '2021-09-01',
        salary: 105000,
        department: 'Research'
      }
    },
    {
      person: 'Eve Wilson',
      company: 'TechCorp',
      properties: {
        position: 'UX Designer',
        startDate: '2020-02-20',
        salary: 85000,
        department: 'Design'
      }
    }
  ])
  .return('r')
  .execute();

console.log('Created employment relationships:', employmentRelationships.length);
```

### Bidirectional Relationships

Some relationships should be bidirectional:

```typescript
// Create mutual friendships (bidirectional)
await client.query()
  .match('(a:Person)-[r:KNOWS {type: "friend"}]->(b:Person)')
  .where('NOT (b)-[:KNOWS]->(a)')
  .create('(b)-[r2:KNOWS]->(a)')
  .set('r2 = r')
  .execute();

console.log('Created bidirectional friendships');
```

## Querying Your Graph

Now let's explore our graph with various queries.

### Basic Queries

```typescript
// Get all people with their basic information
const people = await client.query()
  .match('(p:Person)')
  .return('p.name, p.age, p.city, p.email')
  .orderBy('p.name')
  .execute();

console.log('People in our graph:', people);

// Get all companies
const companies = await client.query()
  .match('(c:Company)')
  .return('c.name, c.industry, c.location, c.employees')
  .orderBy('c.employees DESC')
  .execute();

console.log('Companies by size:', companies);

// Count vertices and edges
const stats = await client.query()
  .match('(n)')
  .optional('(n)-[r]-()')
  .return('count(DISTINCT n) as vertices, count(r) as edges')
  .execute();

console.log('Graph statistics:', stats[0]);
```

### Relationship Queries

```typescript
// Find all social relationships
const socialConnections = await client.query()
  .match('(a:Person)-[r:KNOWS]->(b:Person)')
  .return('a.name as from, b.name as to, r.type, r.since, r.strength')
  .orderBy('r.strength DESC')
  .execute();

console.log('Social connections by strength:', socialConnections);

// Find employment information
const employment = await client.query()
  .match('(p:Person)-[r:WORKS_AT]->(c:Company)')
  .return('p.name as employee, c.name as company, r.position, r.salary, r.department')
  .orderBy('r.salary DESC')
  .execute();

console.log('Employment information:', employment);

// Find colleagues (people working at the same company)
const colleagues = await client.query()
  .match('(p1:Person)-[:WORKS_AT]->(c:Company)<-[:WORKS_AT]-(p2:Person)')
  .where('p1 <> p2')
  .return('p1.name as person1, p2.name as person2, c.name as company')
  .execute();

console.log('Colleagues:', colleagues);
```

### Advanced Queries

```typescript
// Find friends of friends (2-degree connections)
const friendsOfFriends = await client.query()
  .match('(start:Person {name: $name})-[:KNOWS*2]-(fof:Person)')
  .where('start <> fof')
  .setParam('name', 'Alice Johnson')
  .return('DISTINCT fof.name as friend_of_friend, fof.city')
  .execute();

console.log("Alice's friends of friends:", friendsOfFriends);

// Find the shortest path between two people
const shortestPath = await client.query()
  .match('path = shortestPath((start:Person {name: $start})-[*]-(end:Person {name: $end}))')
  .setParam('start', 'Alice Johnson')
  .setParam('end', 'Frank Miller')
  .return('path, length(path) as pathLength')
  .execute();

console.log('Shortest path:', shortestPath);

// Find people with mutual friends
const mutualFriends = await client.query()
  .match('(p1:Person)-[:KNOWS]-(mutual:Person)-[:KNOWS]-(p2:Person)')
  .where('p1 <> p2 AND p1.name < p2.name') // Avoid duplicates
  .return('p1.name as person1, p2.name as person2, collect(mutual.name) as mutual_friends')
  .execute();

console.log('People with mutual friends:', mutualFriends);

// Find the most connected person
const mostConnected = await client.query()
  .match('(p:Person)-[r:KNOWS]-()')
  .return('p.name, count(r) as connections')
  .orderBy('connections DESC')
  .limit(1)
  .execute();

console.log('Most connected person:', mostConnected[0]);
```

### Analytical Queries

```typescript
// Average age by city
const avgAgeByCity = await client.query()
  .match('(p:Person)')
  .return('p.city, avg(p.age) as average_age, count(p) as people_count')
  .orderBy('average_age DESC')
  .execute();

console.log('Average age by city:', avgAgeByCity);

// Company statistics
const companyStats = await client.query()
  .match('(c:Company)<-[r:WORKS_AT]-(p:Person)')
  .return('c.name as company, count(p) as employee_count, avg(r.salary) as avg_salary')
  .orderBy('employee_count DESC')
  .execute();

console.log('Company statistics:', companyStats);

// Relationship type distribution
const relationshipTypes = await client.query()
  .match('()-[r:KNOWS]-()')
  .return('r.type, count(r) as count')
  .orderBy('count DESC')
  .execute();

console.log('Relationship types:', relationshipTypes);
```

## Batch Loading

For larger datasets, use the batch loader for better performance:

```typescript
// Initialize the batch loader
const loader = client.batch();

// Load multiple vertices efficiently
await loader.loadVertices([
  {
    label: 'Person',
    properties: {
      name: 'Grace Hopper',
      age: 85,
      city: 'Washington DC',
      email: 'grace@example.com',
      profession: 'Computer Scientist'
    }
  },
  {
    label: 'Person',
    properties: {
      name: 'Alan Turing',
      age: 41,
      city: 'London',
      email: 'alan@example.com',
      profession: 'Mathematician'
    }
  },
  {
    label: 'Company',
    properties: {
      name: 'QuantumTech',
      industry: 'Quantum Computing',
      location: 'Boston',
      founded: 2022,
      employees: 25
    }
  }
]);

// Load relationships in batch
await loader.loadEdges([
  {
    from: { label: 'Person', properties: { name: 'Grace Hopper' } },
    to: { label: 'Person', properties: { name: 'Alan Turing' } },
    label: 'KNOWS',
    properties: { since: '1940', type: 'colleague', strength: 10 }
  },
  {
    from: { label: 'Person', properties: { name: 'Grace Hopper' } },
    to: { label: 'Company', properties: { name: 'QuantumTech' } },
    label: 'WORKS_AT',
    properties: {
      position: 'Chief Technology Officer',
      startDate: '2022-01-01',
      salary: 200000,
      department: 'Executive'
    }
  }
]);

console.log('Batch loading completed');
```

### Large Dataset Example

For very large datasets, process in chunks:

```typescript
async function loadLargeDataset() {
  const BATCH_SIZE = 1000;

  // Example: Load 10,000 people
  for (let i = 0; i < 10000; i += BATCH_SIZE) {
    const batch = [];

    for (let j = 0; j < BATCH_SIZE && (i + j) < 10000; j++) {
      batch.push({
        label: 'Person',
        properties: {
          name: `Person ${i + j}`,
          age: Math.floor(Math.random() * 50) + 20,
          city: ['New York', 'San Francisco', 'Chicago', 'Boston'][Math.floor(Math.random() * 4)],
          email: `person${i + j}@example.com`
        }
      });
    }

    await loader.loadVertices(batch);
    console.log(`Loaded batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }
}

// Uncomment to run large dataset loading
// await loadLargeDataset();
```

## Data Validation and Schema

Add schema validation to ensure data quality:

```typescript
// Define a schema for our graph
const schema = {
  vertices: {
    Person: {
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 0, max: 150 },
        email: { type: 'string', format: 'email' },
        city: { type: 'string', required: true }
      }
    },
    Company: {
      properties: {
        name: { type: 'string', required: true },
        industry: { type: 'string', required: true },
        employees: { type: 'number', min: 1 },
        founded: { type: 'number', min: 1800, max: 2030 }
      }
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'string', required: true },
        type: { type: 'string', enum: ['friend', 'colleague', 'mentor'] },
        strength: { type: 'number', min: 1, max: 10 }
      }
    },
    WORKS_AT: {
      properties: {
        position: { type: 'string', required: true },
        salary: { type: 'number', min: 0 },
        startDate: { type: 'string', format: 'date' }
      }
    }
  }
};

// Apply the schema
client.setSchema(schema);
console.log('Schema validation enabled');

// Now all operations will be validated
try {
  await client.query()
    .create('(p:Person {name: $name, age: $age})')
    .setParam('name', 'Invalid Person')
    .setParam('age', 200) // This will fail validation
    .execute();
} catch (error) {
  console.log('Validation error:', error.message);
}
```

## Updating and Deleting Data

### Updating Vertices and Edges

```typescript
// Update a person's information
await client.query()
  .match('(p:Person {name: $name})')
  .set('p.age = $newAge, p.city = $newCity')
  .setParam('name', 'Alice Johnson')
  .setParam('newAge', 31)
  .setParam('newCity', 'Boston')
  .execute();

// Update relationship properties
await client.query()
  .match('(a:Person {name: $name1})-[r:KNOWS]->(b:Person {name: $name2})')
  .set('r.strength = $newStrength')
  .setParam('name1', 'Alice Johnson')
  .setParam('name2', 'Bob Smith')
  .setParam('newStrength', 9)
  .execute();
```

### Deleting Data

```typescript
// Delete a specific relationship
await client.query()
  .match('(a:Person {name: $name1})-[r:KNOWS]->(b:Person {name: $name2})')
  .delete('r')
  .setParam('name1', 'Alice Johnson')
  .setParam('name2', 'Bob Smith')
  .execute();

// Delete a person and all their relationships
await client.query()
  .match('(p:Person {name: $name})')
  .detachDelete('p')
  .setParam('name', 'Frank Miller')
  .execute();
```

## Cleanup

When you're done, clean up resources:

```typescript
// Close the connection
await client.disconnect();
console.log('Disconnected from database');

// Optionally, drop the graph (be careful!)
// await client.dropGraph('social_network');
```

## Complete Example

Here's a complete example that puts it all together:

```typescript
import { AgeSchemaClient } from 'age-schema-client';

async function createSocialNetwork() {
  const client = new AgeSchemaClient({
    host: 'localhost',
    port: 5432,
    database: 'your_database',
    user: 'your_user',
    password: 'your_password'
  });

  try {
    // Connect and create graph
    await client.connect();
    await client.createGraph('social_network');
    client.useGraph('social_network');

    // Create people
    await client.query()
      .unwind('$people', 'person')
      .create('(p:Person)')
      .set('p = person')
      .setParam('people', [
        { name: 'Alice Johnson', age: 30, city: 'New York', email: 'alice@example.com' },
        { name: 'Bob Smith', age: 25, city: 'San Francisco', email: 'bob@example.com' }
      ])
      .execute();

    // Create relationships
    await client.query()
      .match('(a:Person {name: "Alice Johnson"})')
      .match('(b:Person {name: "Bob Smith"})')
      .create('(a)-[r:KNOWS {since: "2020", type: "friend", strength: 8}]->(b)')
      .execute();

    // Query the graph
    const result = await client.query()
      .match('(a:Person)-[r:KNOWS]->(b:Person)')
      .return('a.name as from, b.name as to, r.type')
      .execute();

    console.log('Social connections:', result);

  } finally {
    await client.disconnect();
  }
}

// Run the example
createSocialNetwork().catch(console.error);
```

## Next Steps

Congratulations! You've successfully created your first graph database with ageSchemaClient. You now know how to:

✅ Create and manage graphs
✅ Add vertices and edges with properties
✅ Query your graph data effectively
✅ Use batch operations for performance
✅ Implement schema validation
✅ Update and delete data safely

### Continue Learning

- **[Basic Queries](../how-to-guides/basic-queries)** - Master advanced query patterns
- **[Schema Validation](../how-to-guides/schema-validation)** - Learn comprehensive schema validation
- **[Batch Operations](../how-to-guides/batch-operations)** - Optimize for large datasets
- **[Performance Optimization](../how-to-guides/performance-optimization)** - Make your queries faster
- **[API Reference](../api-reference/)** - Explore all available methods

### Example Projects

Try building these projects to practice:
- **Social Network Analysis** - Analyze friend networks and communities
- **Recommendation Engine** - Build product or content recommendations
- **Knowledge Graph** - Create a knowledge base with entities and relationships
- **Fraud Detection** - Model transactions and detect suspicious patterns
- **Supply Chain Tracking** - Track products through complex supply chains

### Get Help

- **[Troubleshooting Guide](../how-to-guides/troubleshooting)** - Common issues and solutions
- **[GitHub Issues](https://github.com/standardbeagle/ageSchemaClient/issues)** - Report bugs or ask questions
- **[Community Forum](https://github.com/standardbeagle/ageSchemaClient/discussions)** - Connect with other users
