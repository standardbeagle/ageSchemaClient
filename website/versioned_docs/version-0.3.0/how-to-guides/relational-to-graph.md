# Converting Relational Data to Graph Format

Learn how to transform traditional relational database structures into graph database format using ageSchemaClient.

## Understanding the Transformation

### Key Concepts

- **Tables → Vertex Labels**: Each table becomes a vertex label
- **Rows → Vertices**: Each row becomes a vertex with properties
- **Foreign Keys → Edges**: Relationships become edges between vertices
- **Join Tables → Edge Labels**: Many-to-many relationships become edge types

### Example Relational Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  created_at TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(200),
  content TEXT,
  created_at TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50)
);

-- Post-Tag junction table
CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id),
  tag_id INTEGER REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);
```

## Step-by-Step Conversion

### Step 1: Define Graph Schema

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const schema = {
  vertices: {
    User: {
      properties: {
        id: { type: 'integer', required: true },
        name: { type: 'string', required: true },
        email: { type: 'string', required: true },
        created_at: { type: 'string' }
      }
    },
    Post: {
      properties: {
        id: { type: 'integer', required: true },
        title: { type: 'string', required: true },
        content: { type: 'string' },
        created_at: { type: 'string' }
      }
    },
    Tag: {
      properties: {
        id: { type: 'integer', required: true },
        name: { type: 'string', required: true }
      }
    }
  },
  edges: {
    AUTHORED: {
      from: 'User',
      to: 'Post',
      properties: {
        created_at: { type: 'string' }
      }
    },
    TAGGED_WITH: {
      from: 'Post',
      to: 'Tag',
      properties: {}
    }
  }
};

const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'blog_graph'
});

await client.loadSchema(schema);
```

### Step 2: Extract and Transform Data

```typescript
// Function to convert relational data to graph format
async function convertRelationalToGraph() {
  // 1. Load vertices (entities)
  const users = await loadUsersFromRelationalDB();
  const posts = await loadPostsFromRelationalDB();
  const tags = await loadTagsFromRelationalDB();

  // 2. Create vertices
  for (const user of users) {
    await client.query()
      .create('(u:User)')
      .setParam('id', user.id)
      .setParam('name', user.name)
      .setParam('email', user.email)
      .setParam('created_at', user.created_at.toISOString())
      .execute();
  }

  for (const post of posts) {
    await client.query()
      .create('(p:Post)')
      .setParam('id', post.id)
      .setParam('title', post.title)
      .setParam('content', post.content)
      .setParam('created_at', post.created_at.toISOString())
      .execute();
  }

  for (const tag of tags) {
    await client.query()
      .create('(t:Tag)')
      .setParam('id', tag.id)
      .setParam('name', tag.name)
      .execute();
  }

  // 3. Create edges (relationships)
  // User -> Post relationships
  for (const post of posts) {
    await client.query()
      .match('(u:User), (p:Post)')
      .where({ 'u.id': post.user_id, 'p.id': post.id })
      .create('(u)-[r:AUTHORED {created_at: p.created_at}]->(p)')
      .execute();
  }

  // Post -> Tag relationships
  const postTags = await loadPostTagsFromRelationalDB();
  for (const pt of postTags) {
    await client.query()
      .match('(p:Post), (t:Tag)')
      .where({ 'p.id': pt.post_id, 't.id': pt.tag_id })
      .create('(p)-[r:TAGGED_WITH]->(t)')
      .execute();
  }
}
```

### Step 3: Optimize with Batch Operations

```typescript
// More efficient batch loading
async function batchConvertRelationalToGraph() {
  const batchLoader = client.createBatchLoader();

  // Load all data first
  const users = await loadUsersFromRelationalDB();
  const posts = await loadPostsFromRelationalDB();
  const tags = await loadTagsFromRelationalDB();
  const postTags = await loadPostTagsFromRelationalDB();

  // Prepare batch data
  const graphData = {
    vertices: [
      ...users.map(user => ({
        label: 'User',
        properties: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at.toISOString()
        }
      })),
      ...posts.map(post => ({
        label: 'Post',
        properties: {
          id: post.id,
          title: post.title,
          content: post.content,
          created_at: post.created_at.toISOString()
        }
      })),
      ...tags.map(tag => ({
        label: 'Tag',
        properties: {
          id: tag.id,
          name: tag.name
        }
      }))
    ],
    edges: [
      ...posts.map(post => ({
        label: 'AUTHORED',
        from: { label: 'User', properties: { id: post.user_id } },
        to: { label: 'Post', properties: { id: post.id } },
        properties: { created_at: post.created_at.toISOString() }
      })),
      ...postTags.map(pt => ({
        label: 'TAGGED_WITH',
        from: { label: 'Post', properties: { id: pt.post_id } },
        to: { label: 'Tag', properties: { id: pt.tag_id } },
        properties: {}
      }))
    ]
  };

  // Execute batch load
  await batchLoader.load(graphData);
}
```

## Common Patterns

### One-to-Many Relationships

```typescript
// Customer -> Orders
const customerOrders = {
  vertices: [
    { label: 'Customer', properties: { id: 1, name: 'John' } },
    { label: 'Order', properties: { id: 101, total: 99.99 } },
    { label: 'Order', properties: { id: 102, total: 149.99 } }
  ],
  edges: [
    {
      label: 'PLACED',
      from: { label: 'Customer', properties: { id: 1 } },
      to: { label: 'Order', properties: { id: 101 } },
      properties: { date: '2024-01-15' }
    },
    {
      label: 'PLACED',
      from: { label: 'Customer', properties: { id: 1 } },
      to: { label: 'Order', properties: { id: 102 } },
      properties: { date: '2024-01-20' }
    }
  ]
};
```

### Many-to-Many Relationships

```typescript
// Students <-> Courses
const studentCourses = {
  vertices: [
    { label: 'Student', properties: { id: 1, name: 'Alice' } },
    { label: 'Course', properties: { id: 'CS101', title: 'Intro to CS' } }
  ],
  edges: [
    {
      label: 'ENROLLED_IN',
      from: { label: 'Student', properties: { id: 1 } },
      to: { label: 'Course', properties: { id: 'CS101' } },
      properties: { 
        semester: 'Fall 2024',
        grade: 'A',
        enrollment_date: '2024-08-15'
      }
    }
  ]
};
```

### Hierarchical Data

```typescript
// Categories with parent-child relationships
const categories = {
  vertices: [
    { label: 'Category', properties: { id: 1, name: 'Electronics' } },
    { label: 'Category', properties: { id: 2, name: 'Computers' } },
    { label: 'Category', properties: { id: 3, name: 'Laptops' } }
  ],
  edges: [
    {
      label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 1 } },
      to: { label: 'Category', properties: { id: 2 } },
      properties: {}
    },
    {
      label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 2 } },
      to: { label: 'Category', properties: { id: 3 } },
      properties: {}
    }
  ]
};
```

## Data Validation

### Ensure Data Integrity

```typescript
// Validate before conversion
function validateRelationalData(data) {
  const errors = [];
  
  // Check for missing required fields
  data.users.forEach(user => {
    if (!user.id || !user.name || !user.email) {
      errors.push(`Invalid user: ${JSON.stringify(user)}`);
    }
  });
  
  // Check foreign key integrity
  data.posts.forEach(post => {
    const userExists = data.users.some(u => u.id === post.user_id);
    if (!userExists) {
      errors.push(`Post ${post.id} references non-existent user ${post.user_id}`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Data validation failed:\n${errors.join('\n')}`);
  }
}
```

## Performance Considerations

### Memory Management

```typescript
// Process large datasets in chunks
async function convertLargeDataset() {
  const CHUNK_SIZE = 1000;
  const totalUsers = await getUserCount();
  
  for (let offset = 0; offset < totalUsers; offset += CHUNK_SIZE) {
    const userChunk = await loadUsersFromRelationalDB(offset, CHUNK_SIZE);
    
    const vertexData = userChunk.map(user => ({
      label: 'User',
      properties: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }));
    
    await client.createBatchLoader().load({ vertices: vertexData, edges: [] });
    
    // Optional: Add delay to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

## Next Steps

- [Bulk Loading Strategies](./bulk-loading) - Efficient data loading techniques
- [Performance Optimization](./performance-optimization) - Optimizing graph queries
- [Schema Validation](./schema-validation) - Ensuring data integrity
