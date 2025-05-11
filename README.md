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
  },
  schema: {
    path: './schema.json',
  },
});

// Use the client to query the database
const queryBuilder = client.createQueryBuilder('my_graph');
// ... more to come
```

## Documentation

For more detailed documentation, see the [docs](./docs) directory.

## Development

### Prerequisites

- Node.js 16+
- pnpm 10+

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/age-schema-client.git
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
