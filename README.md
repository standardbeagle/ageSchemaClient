# ageSchemaClient

A TypeScript library for Apache AGE graph databases with schema validation and efficient data loading.

📚 **[Full Documentation](https://standardbeagle.github.io/ageSchemaClient/)** | 🚀 **[Getting Started](https://standardbeagle.github.io/ageSchemaClient/docs/getting-started/installation)** | 📖 **[API Reference](https://standardbeagle.github.io/ageSchemaClient/docs/api-reference/)**

## Features

- Schema-aware graph database operations
- Type-safe query building
- SQL generation for batch operations
- Efficient data loading with single-function approach
- **Extensible connection pool system** - Support for multiple PostgreSQL extensions
- Transaction management
- Progress tracking for large operations
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
import { 
  PgConnectionManager, 
  QueryBuilder, 
  QueryExecutor,
  SchemaLoader 
} from 'age-schema-client';

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
  },
});

// 2. Set up query executor and schema loader
const queryExecutor = new QueryExecutor(connectionManager);
const schemaLoader = new SchemaLoader(connectionManager);

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

// 3. Create query builder with schema
const queryBuilder = new QueryBuilder(schema, queryExecutor, 'movie_graph');

// 4. Build and execute queries
const result = await queryBuilder
  .match('Person', 'p')
  .where('p.name = $actorName')
  .withParam('actorName', 'Tom Hanks')
  .match('p', 'ACTED_IN', 'm', 'Movie')
  .return('p.name', 'm.title')
  .execute();
```

## Documentation

📚 **Full documentation is available at [https://standardbeagle.github.io/ageSchemaClient/](https://standardbeagle.github.io/ageSchemaClient/)**

### Quick Links

- 🚀 [Getting Started Guide](https://standardbeagle.github.io/ageSchemaClient/docs/getting-started/installation)
- 📖 [API Reference](https://standardbeagle.github.io/ageSchemaClient/docs/api-reference/)
- 🏗️ [Architecture Overview](https://standardbeagle.github.io/ageSchemaClient/docs/architecture/overview)
- 💡 [How-to Guides](https://standardbeagle.github.io/ageSchemaClient/docs/how-to-guides/basic-queries)
- 🔧 [Examples](./examples/) - Example code for common use cases

### Key Topics

- [Extension System](https://standardbeagle.github.io/ageSchemaClient/docs/architecture/extension-development) - **NEW**: Pluggable extension system for PostgreSQL extensions
- [Schema Loader](https://standardbeagle.github.io/ageSchemaClient/docs/api-reference/schema-manager) - Documentation for the SchemaLoader class
- [Batch Operations](https://standardbeagle.github.io/ageSchemaClient/docs/how-to-guides/batch-operations) - Efficient bulk data loading
- [Query Builder](https://standardbeagle.github.io/ageSchemaClient/docs/api-reference/query-builder) - Type-safe query construction

### API Reference

A comprehensive API reference is available in the [online documentation](https://standardbeagle.github.io/ageSchemaClient/docs/api-reference/). This includes detailed information about:

- Connection Management
- Query Execution
- SQL Generation
- Vertex Operations
- Edge Operations
- Batch Operations
- Schema Migration
- Error Handling
- SchemaLoader Operations

### Examples

#### Basic Usage

See [basic-usage.ts](./examples/basic-usage.ts) for a simple example of using the client.

#### Transactions

See [schema-loader-transaction.ts](./examples/schema-loader-transaction.ts) for an example of using transactions.

#### Progress Tracking

See [schema-loader-progress.ts](./examples/schema-loader-progress.ts) for an example of tracking progress during data loading.

#### Error Handling

See [schema-loader-error-handling.ts](./examples/schema-loader-error-handling.ts) for examples of handling various error scenarios.

### Connection Options

For detailed information about connection options, including PostgreSQL-specific options like search_path, see the [Connection Configuration guide](https://standardbeagle.github.io/ageSchemaClient/docs/getting-started/connection-config) in our documentation.

## Apache AGE Integration

This library is designed to work with Apache AGE, a PostgreSQL extension for graph database functionality. It handles the complexities of working with AGE, including:

- Proper parameter passing using temporary tables
- Handling AGE-specific data types (agtype)
- Optimizing queries for performance
- Managing graph data loading efficiently
- Ensuring ag_catalog is in the search path

### Important AGE-Specific Considerations

1. **Search Path**: Always include `ag_catalog` in the search path:
   ```typescript
   searchPath: 'ag_catalog, "$user", public'
   ```

2. **Loading AGE Extension**: The library automatically loads the AGE extension with `LOAD 'age';` for each new connection.

3. **Parameter Passing**: Due to AGE limitations with dynamic parameters, the library uses temporary tables for parameter passing.

4. **AGE Data Types**: The library properly handles the `ag_catalog.agtype` data type, including proper string formatting.

5. **Query Structure**: For optimal performance with AGE, the library structures queries to minimize the number of database roundtrips.

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
