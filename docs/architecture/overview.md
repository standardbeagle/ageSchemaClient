# Architecture Overview

This document provides a comprehensive overview of the ageSchemaClient library architecture, including its core components, design patterns, and architectural decisions.

## High-Level Architecture

The ageSchemaClient library follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  AgeSchemaClient │  │   QueryBuilder  │  │   BatchLoader   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ VertexOperations│  │  EdgeOperations │  │ BatchOperations │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Data Access Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  QueryExecutor  │  │   SQLGenerator  │  │TransactionMgr   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │PgConnectionMgr  │  │  Schema System  │  │ Extension Hooks │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Apache AGE                            │
│                    PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. AgeSchemaClient (Main Entry Point)

The `AgeSchemaClient` class serves as the primary interface for the library:

- **Purpose**: Provides a unified API for all graph database operations
- **Responsibilities**:
  - Configuration management
  - Component initialization and lifecycle
  - Factory methods for builders and operations
- **Key Features**:
  - Type-safe schema integration
  - Lazy initialization of components
  - Extensible configuration system

### 2. Connection Management

#### PgConnectionManager
- **Purpose**: Manages PostgreSQL connection pools with Apache AGE support
- **Key Features**:
  - Connection pooling with configurable limits
  - Extension system for multiple PostgreSQL extensions
  - Automatic retry logic with exponential backoff
  - Health monitoring and connection state tracking
  - Graceful shutdown and resource cleanup

#### Connection Extension System
- **Purpose**: Allows initialization of multiple PostgreSQL extensions
- **Supported Extensions**: Apache AGE, pgvector, PostGIS, custom schemas
- **Hook System**: `onConnectionCreate`, `beforeConnect`, `onError`

### 3. Query Processing

#### QueryBuilder
- **Purpose**: Fluent API for constructing type-safe Cypher queries
- **Architecture Pattern**: Builder pattern with method chaining
- **Key Features**:
  - Type-safe query construction
  - Parameter management using temporary tables
  - Support for complex query patterns (MATCH, WHERE, RETURN, etc.)
  - Automatic parameter sanitization

#### QueryExecutor
- **Purpose**: Executes queries against Apache AGE with proper error handling
- **Key Features**:
  - Cypher query execution with parameter binding
  - SQL query execution for administrative operations
  - Retry logic for transient failures
  - Comprehensive logging and debugging support
  - Timeout management

### 4. Data Operations

#### VertexOperations & EdgeOperations
- **Purpose**: Specialized operations for vertices and edges
- **Features**:
  - CRUD operations with schema validation
  - Bulk operations for performance
  - Type-safe data transformations
  - Relationship management

#### BatchOperations
- **Purpose**: Efficient batch processing for large datasets
- **Architecture**:
  - Chunked processing to manage memory usage
  - Temporary table approach for parameter passing
  - Transaction management for consistency
  - Progress tracking and metrics collection

### 5. Schema System

#### Schema Definition & Validation
- **Purpose**: Type-safe schema definitions for vertices and edges
- **Features**:
  - TypeScript interface generation
  - Runtime validation
  - Schema evolution support
  - Property type checking

### 6. SQL Generation

#### SQLGenerator
- **Purpose**: Generates optimized SQL for Apache AGE operations
- **Features**:
  - Batch insert optimization
  - Parameter binding for security
  - Query optimization for performance
  - Support for complex data types

## Design Patterns

### 1. Factory Pattern
Used in `AgeSchemaClient` for creating specialized builders and operations:
```typescript
client.query()     // Creates QueryBuilder
client.batch()     // Creates BatchLoader
client.vertex()    // Creates VertexOperations
```

### 2. Builder Pattern
Implemented in `QueryBuilder` for fluent query construction:
```typescript
query
  .match('(p:Person)')
  .where({ age: { $gte: 18 } })
  .return('p.name, p.age')
  .execute()
```

### 3. Strategy Pattern
Used in connection management for different extension initialization strategies.

### 4. Singleton Pattern
Applied to connection pool management to ensure resource efficiency.

### 5. Template Method Pattern
Used in batch operations for consistent processing workflows.

## Key Architectural Decisions

### 1. Temporary Table Approach for Parameters

**Decision**: Use temporary tables instead of direct parameter binding for Apache AGE queries.

**Rationale**: 
- Apache AGE's third parameter limitation makes standard parameter binding impossible
- Temporary tables provide secure parameter passing
- Enables complex data structures and bulk operations

**Implementation**:
- `age_params` table for parameter storage
- PostgreSQL functions for parameter retrieval
- Automatic cleanup after query execution

### 2. Layered Architecture

**Decision**: Implement clear separation between application, service, data access, and infrastructure layers.

**Benefits**:
- Clear separation of concerns
- Testability and maintainability
- Flexibility for future extensions
- Consistent error handling across layers

### 3. Type-Safe Schema Integration

**Decision**: Deep integration with TypeScript for compile-time type safety.

**Benefits**:
- Prevents runtime errors
- Improved developer experience
- Better IDE support
- Self-documenting code

### 4. Extension System

**Decision**: Pluggable extension system for PostgreSQL extensions beyond Apache AGE.

**Benefits**:
- Support for pgvector, PostGIS, and custom extensions
- Future-proof architecture
- Flexible configuration
- Reusable across different use cases

## Performance Considerations

### 1. Connection Pooling
- Configurable pool sizes based on application needs
- Connection reuse to minimize overhead
- Health checks to ensure connection quality

### 2. Batch Processing
- Chunked processing to manage memory usage
- Parallel processing where possible
- Optimized SQL generation for bulk operations

### 3. Query Optimization
- Parameter binding for query plan reuse
- Efficient temporary table management
- Minimal data transfer between client and server

### 4. Memory Management
- Streaming for large datasets
- Automatic resource cleanup
- Configurable batch sizes

## Error Handling Strategy

### 1. Hierarchical Error Types
- `BaseError` as the foundation
- Specialized errors for different scenarios
- Rich error context and debugging information

### 2. Retry Logic
- Exponential backoff for transient failures
- Configurable retry policies
- Circuit breaker pattern for cascading failures

### 3. Graceful Degradation
- Fallback strategies for non-critical operations
- Resource cleanup on failures
- Comprehensive logging for debugging

## Security Considerations

### 1. SQL Injection Prevention
- Parameterized queries for all user input
- Input validation and sanitization
- Temporary table approach eliminates injection vectors

### 2. Connection Security
- SSL/TLS support for encrypted connections
- Credential management best practices
- Connection timeout and limits

### 3. Data Validation
- Schema-based validation
- Type checking at runtime
- Sanitization of user inputs

## Extensibility

### 1. Plugin Architecture
- Hook system for custom functionality
- Extension points at key lifecycle events
- Configurable behavior modification

### 2. Custom Operations
- Extensible operation classes
- Custom query builders
- Pluggable SQL generators

### 3. Schema Evolution
- Version management for schema changes
- Migration support
- Backward compatibility considerations

This architecture provides a solid foundation for working with Apache AGE while maintaining flexibility, performance, and type safety.
