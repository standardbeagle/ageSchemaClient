# Installation

This guide will help you install and set up ageSchemaClient in your project.

## Prerequisites

Before installing ageSchemaClient, ensure you have:

- **Node.js 16.0+** - The library requires Node.js version 16 or higher
- **Apache AGE** - A PostgreSQL database with Apache AGE extension installed
- **TypeScript 4.5+** (recommended) - For full type safety support

## Installing ageSchemaClient

### Using npm

```bash
npm install age-schema-client
```

### Using yarn

```bash
yarn add age-schema-client
```

### Using pnpm

```bash
pnpm add age-schema-client
```

## Apache AGE Setup

ageSchemaClient requires Apache AGE to be installed and configured in your PostgreSQL database.

### Installing Apache AGE

Follow the [official Apache AGE installation guide](https://age.apache.org/age-manual/master/intro/setup.html) for your platform.

### Database Setup

1. **Create the AGE extension** in your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS age;
```

2. **Load the AGE extension** in your session:

```sql
LOAD 'age';
```

3. **Set the search path** to include AGE catalog:

```sql
SET search_path = ag_catalog, "$user", public;
```

### Creating a Test Graph

Create a test graph to verify your setup:

```sql
SELECT create_graph('test_graph');
```

## Basic Configuration

Create a basic configuration to connect to your database:

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  host: 'localhost',
  port: 5432,
  database: 'your_database',
  user: 'your_user',
  password: 'your_password',
  graph: 'test_graph'
});
```

## Environment Variables

For production applications, use environment variables:

```bash
# .env file
AGE_HOST=localhost
AGE_PORT=5432
AGE_DATABASE=your_database
AGE_USER=your_user
AGE_PASSWORD=your_password
AGE_GRAPH=your_graph
```

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const client = new AgeSchemaClient({
  host: process.env.AGE_HOST,
  port: parseInt(process.env.AGE_PORT || '5432'),
  database: process.env.AGE_DATABASE,
  user: process.env.AGE_USER,
  password: process.env.AGE_PASSWORD,
  graph: process.env.AGE_GRAPH
});
```

## Verification

Test your installation with a simple query:

```typescript
async function testConnection() {
  try {
    const result = await client.query()
      .match('(n)')
      .return('count(n) as node_count')
      .execute();
    
    console.log('Connection successful!', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
```

## Next Steps

Now that you have ageSchemaClient installed and configured:

- [Basic Usage](./basic-usage) - Learn the fundamentals
- [Connection Configuration](./connection-config) - Advanced connection options
- [First Graph](./first-graph) - Create your first graph database

## Troubleshooting

### Common Issues

**AGE extension not found**
- Ensure Apache AGE is properly installed
- Verify the extension is created in your database
- Check that AGE is loaded in your session

**Connection refused**
- Verify PostgreSQL is running
- Check host, port, and credentials
- Ensure the database exists

**Permission denied**
- Verify user has necessary permissions
- Check that the user can access the AGE extension

For more help, see our [Troubleshooting Guide](../how-to-guides/troubleshooting) or [open an issue](https://github.com/standardbeagle/ageSchemaClient/issues).
