# ageSchemaClient

A TypeScript library for Apache AGE graph databases with schema validation.

## Features

- Schema-aware graph database operations
- Type-safe query building
- SQL generation for batch operations
- Comprehensive error handling
- Support for both Node.js and browser environments

## Installation

```bash
# Using pnpm
pnpm add age-schema-client

# Using npm
npm install age-schema-client

# Using yarn
yarn add age-schema-client
```

## Quick Start

```typescript
import { AgeSchemaClient } from 'age-schema-client';

// Create a client
const client = new AgeSchemaClient({
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'my_database',
    user: 'postgres',
    password: 'postgres',
    // PostgreSQL-specific options
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public',
    },
  },
  schema: {
    path: './schema.json',
  },
});

// Define a schema
const schema = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'number' }
      }
    },
    Movie: {
      properties: {
        title: { type: 'string', required: true },
        year: { type: 'number' }
      }
    }
  },
  edges: {
    ACTED_IN: {
      properties: {
        role: { type: 'string' }
      },
      from: ['Person'],
      to: ['Movie']
    }
  }
};

// Create vertices
const tom = await client.vertices.createVertex('Person', {
  name: 'Tom Hanks',
  age: 66
});

const forrestGump = await client.vertices.createVertex('Movie', {
  title: 'Forrest Gump',
  year: 1994
});

// Create an edge
const actedIn = await client.edges.createEdge('ACTED_IN', tom, forrestGump, {
  role: 'Forrest Gump'
});

// Query the database
const result = await client.query
  .match('p', 'Person')
  .where('p.name', '=', 'Tom Hanks')
  .match('p', '-[a:ACTED_IN]->', 'm:Movie')
  .return('p', 'm', 'a.role')
  .execute();
```

## Documentation

For more detailed documentation, see the [docs](./docs) directory.

### API Reference

A comprehensive API reference is available in the [API Reference](./docs/api-reference.md) document. This includes detailed information about:

- Connection Management
- Query Execution
- SQL Generation
- Vertex Operations
- Edge Operations
- Batch Operations
- Schema Migration
- Error Handling

### Connection Options

For detailed information about connection options, including PostgreSQL-specific options like search_path, see the [Connection Options](./docs/connection-options.md) document.

## Development

### Prerequisites

- Node.js 16+
- pnpm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/beagle/age-schema-client.git
cd age-schema-client

# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test
```

## License

MIT
