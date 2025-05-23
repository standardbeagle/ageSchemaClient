# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build
- `pnpm build` - TypeScript compilation + Vite build
- `pnpm build:publish` - Clean build for publishing with declarations

### Testing
- `pnpm test` - Run all tests
- `pnpm test:unit` - Unit tests only
- `pnpm test:integration` - Integration tests only (requires PostgreSQL with Apache AGE)
- `pnpm test:connection` - Connection-specific tests
- `pnpm test:performance` - Performance testing suite
- Run single test file: `pnpm test:unit path/to/test.test.ts`

### Linting & Formatting
- `pnpm lint` - ESLint for TypeScript
- `pnpm format` - Prettier formatting

### Documentation
- `pnpm docs:api` - Generate API docs with TypeDoc
- `pnpm docs:build` - Build Docusaurus website
- `pnpm docs:full` - API docs + website build

## High-Level Architecture

### Core Components

1. **AgeSchemaClient** (`src/core/client.ts`)
   - Main entry point for all operations
   - Manages connection pool, schema validation, and operations
   - Provides unified API for graph operations

2. **Schema System** (`src/schema/`)
   - JSON-based schema definitions with TypeScript types
   - Runtime validation using AJV
   - Schema migration support
   - Type guards and validation utilities

3. **Query Builder** (`src/query/`)
   - Fluent API for building Cypher queries
   - Type-safe query construction
   - Support for analytics, algorithms, and path queries
   - Result processing and visualization

4. **Batch Loader** (`src/loader/`)
   - Optimized bulk data loading using temporary tables
   - Single-function approach for performance
   - Progress reporting and error handling
   - Data validation before loading

5. **Database Operations** (`src/db/`)
   - Vertex and edge operations
   - Transaction management
   - Connection pool handling
   - Extension system for PostgreSQL

### Key Architectural Patterns

1. **Apache AGE Integration**
   - Uses temporary tables for parameter passing (AGE limitation workaround)
   - Requires `ag_catalog` in search_path
   - Automatic AGE extension loading
   - Custom SQL functions for batch operations in `sql/batch-loader-functions.sql`

2. **Type Safety**
   - Schema-driven TypeScript types
   - Runtime validation matches compile-time types
   - Extensive use of type guards
   - Generic type parameters for schema definitions

3. **Error Handling**
   - Custom error hierarchy extending BaseError
   - Context-aware error messages
   - Transaction rollback on errors
   - Validation error collection

4. **Testing Strategy**
   - Unit tests mock database interactions
   - Integration tests require real PostgreSQL with AGE
   - Performance tests measure throughput
   - Tests run sequentially to avoid conflicts
   - Fork-based isolation for parallel execution

### Important Implementation Details

1. **Connection Configuration**
   - Must include `ag_catalog` in search_path
   - Supports all PostgreSQL connection options
   - Extension loading happens automatically
   - Connection pool with configurable limits

2. **Batch Loading Approach**
   - Creates temporary tables for data staging
   - Uses single SQL function call for loading
   - Avoids parameter limitations in Cypher
   - Progress reporting with event emitters

3. **Schema Validation**
   - JSON Schema format with custom extensions
   - Compile-time and runtime validation
   - Circular dependency detection
   - Migration planning and execution

4. **Query Building**
   - Immutable query parts
   - Composable query operations
   - Parameter sanitization
   - Result type inference