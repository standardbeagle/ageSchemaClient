# Integration Testing

This document describes the integration testing environment for the ageSchemaClient library.

## Overview

The integration tests connect to a real PostgreSQL database with the Apache AGE extension to verify that the library works correctly with a real database. The tests are designed to be run in a CI/CD pipeline or locally during development.

## Setup

### Prerequisites

- PostgreSQL 14+ with Apache AGE extension installed
- Node.js 16+
- pnpm 10+

### Environment Configuration

Integration tests use environment variables to configure the database connection. These can be set in a `.env.test` file in the project root:

```
# PostgreSQL connection details for integration tests
PGHOST=localhost
PGPORT=5432
PGDATABASE=age-integration
PGUSER=age
PGPASSWORD=agepassword

# AGE extension settings
AGE_GRAPH_NAME=test_graph

# Connection pool settings (optional)
PG_POOL_MAX=5
PG_POOL_IDLE_TIMEOUT=30000
PG_POOL_CONNECTION_TIMEOUT=2000

# Retry settings (optional)
PG_RETRY_MAX_ATTEMPTS=3
PG_RETRY_DELAY=1000
```

### Docker Environment

A Docker Compose file is provided to set up a PostgreSQL database with the Apache AGE extension for testing:

```bash
# Start the Docker environment
docker-compose -f docker-compose.test.yml up -d

# Stop the Docker environment
docker-compose -f docker-compose.test.yml down
```

### Database Setup

The database setup script `setup_age_integration.sql` is automatically run when the Docker container starts. It creates the necessary user, database, and installs the AGE extension.

If you're using an existing PostgreSQL installation, you can run the script manually:

```bash
psql -U postgres -f setup_age_integration.sql
```

## Running Tests

### All Tests

```bash
pnpm test:all
```

### Integration Tests Only

```bash
pnpm test:integration
```

### Integration Tests in Watch Mode

```bash
pnpm test:integration:watch
```

## Test Structure

Integration tests are organized by feature and are located in the `tests/integration` directory. Each test file focuses on a specific feature or component of the library.

### Test Fixtures

Test fixtures are located in the `tests/fixtures` directory. These include:

- Schema definitions
- Sample data
- Configuration templates

### Helper Functions

The integration test setup provides several helper functions to simplify test writing:

- `createTestVertex(label, properties)` - Create a test vertex
- `createTestVertices(label, propertiesArray)` - Create multiple test vertices
- `createTestEdge(fromLabel, fromProps, toLabel, toProps, edgeLabel, edgeProps)` - Create a test edge
- `findTestVertex(label, properties)` - Find a test vertex
- `findTestEdge(fromLabel, fromProps, toLabel, toProps, edgeLabel)` - Find a test edge
- `deleteTestVertex(label, properties)` - Delete a test vertex
- `deleteTestEdge(fromLabel, fromProps, toLabel, toProps, edgeLabel)` - Delete a test edge
- `loadSchemaFixture(name)` - Load a schema fixture
- `getSchemaValidator(name)` - Get a schema validator for a fixture
- `createTestDatabase(schemaName)` - Create a test database with the given schema

## Writing Tests

Integration tests should follow this structure:

```typescript
/**
 * Integration tests for [feature]
 */

import { describe, it, expect } from 'vitest';
import { 
  // Import test helpers and fixtures
  createTestVertex,
  loadSchemaFixture,
  // ...
} from '../../setup/integration';
import {
  // Import components being tested
} from '../../../src/[module]';

describe('[Feature] Integration', () => {
  // Setup specific to this test suite
  
  describe('[Sub-feature]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      
      // Act
      
      // Assert
    });
    
    // More tests...
  });
  
  // More sub-features...
});
```

## Troubleshooting

### AGE Extension Not Installed

If the AGE extension is not installed, some tests will be skipped. You'll see warnings in the console output:

```
WARNING: AGE extension is not installed in the database. Some tests may fail.
Run the setup_age_integration.sql script to install the AGE extension.
```

### Connection Issues

If you're having trouble connecting to the database, check:

1. The database is running
2. The connection parameters in `.env.test` are correct
3. The user has the necessary permissions

### Test Failures

If tests are failing, check:

1. The AGE extension is installed and working
2. The database schema is correct
3. The test fixtures are valid
