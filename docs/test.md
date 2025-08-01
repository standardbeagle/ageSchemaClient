# Testing Guide for AgeSchemaClient

This document provides comprehensive guidance for testing the AgeSchemaClient project.

## Prerequisites

### Database Setup
- PostgreSQL 12+ with Apache AGE extension installed
- Database with `ag_catalog` in search_path
- Test database separate from production

### Environment
- Node.js 18+
- pnpm package manager
- PostgreSQL connection credentials

## Test Commands

### Quick Test Suite
```bash
pnpm test                    # Run all tests
pnpm test:unit              # Unit tests only (fast, no DB required)
pnpm test:integration       # Integration tests (requires PostgreSQL + AGE)
pnpm test:connection        # Connection-specific tests
pnpm test:performance       # Performance benchmarks
```

### Running Specific Tests
```bash
# Single test file
pnpm test:unit src/query/builder.test.ts

# Pattern matching
pnpm test:unit --grep "batch loader"

# Watch mode for development
pnpm test:unit --watch
```

## Test Categories

### Unit Tests (`tests/unit/`)
- **Purpose**: Test isolated components without database dependencies
- **Speed**: Fast (< 1 second per test)
- **Coverage**: Business logic, validation, type guards, utilities
- **Mocking**: Database operations are mocked

**Key Areas:**
- Schema validation logic
- Query builder construction
- Error handling
- Type utilities
- Data validators

### Integration Tests (`tests/integration/`)
- **Purpose**: Test real database interactions with Apache AGE
- **Speed**: Slower (requires DB setup/teardown)
- **Coverage**: End-to-end workflows, database operations
- **Dependencies**: Live PostgreSQL with AGE extension

**Key Areas:**
- Batch loading operations
- Schema migration execution
- Connection management
- Transaction handling
- Vertex/edge operations

### Performance Tests (`tests/performance/`)
- **Purpose**: Measure throughput and identify bottlenecks
- **Metrics**: Operations per second, memory usage, query execution time
- **Scenarios**: Large dataset loading, complex queries, concurrent operations

## Test Structure

### Naming Conventions
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- Performance tests: `*-performance.test.ts`

### Test Organization
```
tests/
├── unit/                   # Fast, isolated tests
├── integration/           # Database-dependent tests
├── performance/           # Benchmark tests
├── fixtures/             # Shared test data
└── setup/               # Test configuration
```

### Isolation Strategy
- Tests run sequentially to avoid conflicts
- Each integration test uses unique graph/table names
- Automatic cleanup after test completion
- Resource registry tracks temporary objects

## Writing Tests

### Unit Test Example
```typescript
import { SchemaValidator } from '../src/schema/validator';

describe('SchemaValidator', () => {
  it('should validate basic vertex schema', () => {
    const schema = { /* test schema */ };
    const validator = new SchemaValidator();
    const result = validator.validate(schema);
    expect(result.isValid).toBe(true);
  });
});
```

### Integration Test Example
```typescript
import { AgeSchemaClient } from '../src';

describe('Batch Loading Integration', () => {
  let client: AgeSchemaClient;
  
  beforeEach(async () => {
    client = new AgeSchemaClient(testConfig);
    await client.connect();
  });
  
  afterEach(async () => {
    await client.disconnect();
  });
  
  it('should load vertices in batch', async () => {
    const vertices = [/* test data */];
    const result = await client.loadVertices('Person', vertices);
    expect(result.loaded).toBe(vertices.length);
  });
});
```

## Test Data Management

### Fixtures (`tests/fixtures/`)
- Reusable schema definitions
- Sample data generators
- Mock configurations

### Dynamic Data Generation
```typescript
import { generateVertices } from '../fixtures/data-generator';

const testVertices = generateVertices('Person', 1000);
```

## Debugging Tests

### Debug Configuration
```bash
# Enable debug output
DEBUG=age-schema:* pnpm test:integration

# Run with verbose logging
pnpm test:integration --verbose
```

### Common Issues
1. **Connection failures**: Check PostgreSQL service and AGE extension
2. **Permission errors**: Ensure test user has CREATE privileges
3. **Timeout errors**: Increase timeout for large data tests
4. **Memory issues**: Use smaller datasets for performance tests

## Continuous Integration

### GitHub Actions
- Automated test runs on PR/push
- Matrix testing across Node.js versions
- PostgreSQL service with AGE extension
- Test result reporting and coverage

### Local CI Simulation
```bash
# Run full test suite like CI
pnpm lint && pnpm test && pnpm build
```

## Performance Testing

### Benchmark Scenarios
- Vertex loading: 1K, 10K, 100K records
- Edge creation: Various relationship patterns
- Query execution: Simple vs complex Cypher
- Concurrent operations: Multiple clients

### Metrics Collection
```typescript
const startTime = performance.now();
await client.loadVertices('Person', largeDataset);
const duration = performance.now() - startTime;
console.log(`Loaded ${largeDataset.length} vertices in ${duration}ms`);
```

## Best Practices

### Test Design
1. **Arrange-Act-Assert**: Clear test structure
2. **Single responsibility**: One assertion per test
3. **Descriptive names**: What is being tested and expected outcome
4. **Cleanup**: Always clean up test resources
5. **Isolation**: Tests should not depend on each other

### Performance Considerations
1. **Mock external dependencies** in unit tests
2. **Use test doubles** for database operations where possible
3. **Minimize database round trips** in integration tests
4. **Clean up efficiently** to avoid resource leaks

### Error Testing
1. **Test error conditions** explicitly
2. **Verify error messages** and error types
3. **Test recovery scenarios** after failures
4. **Validate rollback behavior** in transactions

## Troubleshooting

### Common Test Failures
- **Schema validation errors**: Check test schema format
- **Connection timeouts**: Verify database connectivity
- **Memory leaks**: Ensure proper cleanup in afterEach
- **Race conditions**: Use proper async/await patterns

### Debug Tools
- VS Code debugger with test configurations
- Database query logs for integration tests
- Memory profiling for performance tests
- Network monitoring for connection issues