# Product Requirements Document: AgeSchemaClient Refactoring

**Document Version:** 2.0  
**Date:** January 6, 2025  
**Project:** AgeSchemaClient Library Refactoring  
**Updated:** Based on comprehensive codebase analysis

---

## Executive Summary

This PRD outlines the refactoring of the AgeSchemaClient from a monolithic, incomplete facade pattern to a collection of focused, single-responsibility classes. Through detailed codebase analysis, we've identified that the current AgeSchemaClient is largely unimplemented with critical TODOs preventing functionality, while individual components are well-structured and already working independently.

The proposed refactoring will eliminate unimplemented features, remove the master component anti-pattern, and establish single-concept classes that can be composed together, addressing the design requirement for "a collection of single concept classes that are used together not a master component that binds separate features together."

### Business Value
- **Eliminate Broken Functionality**: Remove unimplemented TODOs that prevent core features from working
- **Improved Developer Experience**: Clear, focused APIs that are easier to understand and use
- **Enhanced Testability**: Individual components can be tested in isolation with better mocking capabilities
- **Increased Flexibility**: Users can compose only the features they need rather than importing everything
- **Better Maintainability**: Single-responsibility classes are easier to maintain and extend
- **Reduced Complexity**: Elimination of unimplemented features and complex initialization logic

### Impact Assessment
- **High Impact**: Fundamental architectural change affecting all library users
- **Breaking Changes**: Yes, but analysis shows most users already bypass the main client
- **Migration Path**: Clear upgrade path since individual components already exist and work well

### Risk Assessment
- **Low-Medium Risk**: Individual components are well-tested and functional
- **Mitigation**: Comprehensive test coverage for each refactored component with TDD approach
- **User Impact**: Low - examples and tests show users prefer direct component usage

## Current State Analysis

### Critical Findings from Codebase Analysis

#### Current AgeSchemaClient is Largely Broken (`src/core/client.ts`)

**Unimplemented Core Functionality:**
```typescript
// Lines 37-38 in src/core/client.ts
// TODO: Initialize schema from config
// TODO: Initialize connection manager and query executor
```

**Current State Assessment:**
- **Constructor**: Only stores configuration, doesn't initialize anything functional
- **Query Builder Methods**: Fail at runtime due to uninitialized dependencies
- **Operations Methods**: Use lazy initialization that can fail unpredictably
- **Factory Pattern**: Client attempts to be a factory for 6+ distinct responsibilities

#### User Adoption Patterns Reveal Design Problems

**Analysis of Examples Directory:**
- Users prefer direct component instantiation over the main client
- Examples show manual assembly of components rather than using AgeSchemaClient
- Most functionality demonstrated bypasses the client entirely

**Analysis of Test Suite:**
- Integration tests avoid the main client due to initialization issues
- Unit tests focus on individual components, not the client
- No comprehensive client integration tests exist

#### Well-Functioning Components Already Exist

**Production-Ready Components:**
1. **PgConnectionManager** (`src/db/connector.ts`): Excellent single-responsibility connection management
2. **QueryBuilder** (`src/query/builder.ts`): Type-safe, fluent API for Cypher queries  
3. **BatchLoader** (`src/loader/batch-loader.ts`): Efficient bulk data loading with progress reporting
4. **SchemaValidator/Parser** (`src/schema/`): Focused schema validation and parsing
5. **TransactionManager**: Clear transaction lifecycle management

#### Architecture Anti-Patterns Identified

1. **God Object Pattern**: AgeSchemaClient attempts to manage everything
2. **Incomplete Facade**: Client provides interface but lacks implementation
3. **Hidden Dependencies**: Complex initialization dependencies not visible to users
4. **Single Responsibility Violations**: One class handling 6+ distinct concerns

### Current Component Structure

```
AgeSchemaClient (Master Class)
├── PgConnectionManager (Connection handling)
├── QueryExecutor (Query execution)
├── SQLGenerator (SQL generation)
├── VertexOperations (Vertex CRUD)
├── EdgeOperations (Edge CRUD)
├── QueryBuilder (Query building)
└── PathQueryBuilder (Path queries)
```

## Proposed Changes

### New Architecture: Composition over Inheritance

Replace the monolithic AgeSchemaClient with focused, composable classes:

```
Individual Classes (Composition)
├── ConnectionManager (Database connections)
├── SchemaValidator (Schema validation)
├── QueryExecutor (Query execution)
├── VertexOperations (Vertex operations)
├── EdgeOperations (Edge operations)
├── QueryBuilder (Basic queries)
├── PathQueryBuilder (Path queries)
├── AlgorithmQueryBuilder (Graph algorithms)
└── AnalyticsQueryBuilder (Analytics queries)
```

### Target User Experience

**Before (Current):**
```typescript
const client = new AgeSchemaClient(config);
const queryBuilder = client.createQueryBuilder('graph');
const vertexOps = client.getVertexOperations();
```

**After (Proposed):**
```typescript
const connectionManager = new ConnectionManager(config);
const schemaValidator = new SchemaValidator(schema);
const queryExecutor = new QueryExecutor(connectionManager);
const queryBuilder = new QueryBuilder(schemaValidator, queryExecutor, 'graph');
const vertexOps = new VertexOperations(schemaValidator, queryExecutor);
```

## Requirements Breakdown

### Functional Requirements

#### FR1: Decompose AgeSchemaClient
**User Story**: As a developer, I want to use individual components instead of a monolithic client class so that I can import only what I need and have better control over initialization.

**Acceptance Criteria**:
- Remove AgeSchemaClient as a master component
- Each component can be instantiated independently
- Components accept their dependencies through constructor injection
- No lazy initialization - all dependencies must be provided upfront

**Technical Requirements**:
- Modify `src/core/client.ts` to remove the master class
- Update imports in `src/index.ts` to export individual classes
- Update component constructors to accept dependencies explicitly

#### FR2: Improve Component Initialization
**User Story**: As a developer, I want predictable component initialization so that I don't encounter runtime errors from uninitialized dependencies.

**Acceptance Criteria**:
- All components initialize fully in their constructor
- No lazy initialization or factory methods
- Clear error messages for missing dependencies
- Constructor validates all required dependencies

**Technical Requirements**:
- Remove TODO comments in `src/core/client.ts:37-38`
- Implement proper validation in component constructors
- Add dependency injection patterns

#### FR3: Implement Missing Features
**User Story**: As a developer, I want all advertised functionality to be fully implemented so that I can use the library without encountering unimplemented features.

**Acceptance Criteria**:
- Complete parameter collection in `src/query/parts.ts:119`
- Implement all TODO/FIXME items
- Add proper error handling for edge cases

#### FR4: Create Focused Component APIs
**User Story**: As a developer, I want each component to have a focused API that handles only its specific responsibility.

**Acceptance Criteria**:
- ConnectionManager: Only handles database connections
- SchemaValidator: Only handles schema validation
- QueryExecutor: Only executes queries
- VertexOperations: Only handles vertex CRUD
- EdgeOperations: Only handles edge CRUD
- QueryBuilder variants: Only build specific types of queries

### Non-Functional Requirements

#### NFR1: Performance
- No performance degradation from refactoring
- Lazy loading replaced with efficient initialization
- Memory usage remains constant or improves

#### NFR2: Backwards Compatibility
- Provide migration guide for existing users
- Consider providing a compatibility wrapper (optional)
- Clear deprecation warnings

#### NFR3: Type Safety
- Maintain or improve TypeScript type safety
- Generic type parameters preserved where appropriate
- Better type inference for component composition

### Testing Requirements

#### TR1: Mandatory Test-Driven Development (TDD)
**Critical Requirement**: Tests MUST be written before any implementation
- **Red Phase**: Write failing test for new functionality
- **Green Phase**: Implement minimal code to make test pass  
- **Refactor Phase**: Improve implementation while keeping tests green
- **Repeat**: Continue for each component and feature

#### TR2: Comprehensive Test Coverage 
- **Unit Tests**: 100% coverage for each new component class
- **Integration Tests**: Component interaction scenarios  
- **Performance Tests**: Baseline comparisons to prevent regression
- **Migration Tests**: Verify upgrade path works correctly

#### TR3: Test-First Implementation Strategy
**For Every Task**: 
1. Write failing test that defines expected behavior
2. Run test to confirm it fails (Red)
3. Write minimal implementation to make test pass (Green)  
4. Refactor implementation while keeping test green
5. No code changes without corresponding test coverage

## Implementation Plan

### Phase 1: Foundation & Core Components (Week 1-2)

#### Task 1.1: Create ConnectionManager (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/core/connection-manager.test.ts (WRITE FIRST)
describe('ConnectionManager', () => {
  describe('initialization', () => {
    test('should initialize with valid config') // FAIL initially
    test('should validate config parameters') // FAIL initially  
    test('should handle invalid config gracefully') // FAIL initially
  })
  
  describe('connection management', () => {
    test('should establish database connection') // FAIL initially
    test('should manage connection pool') // FAIL initially
    test('should handle connection failures') // FAIL initially
  })
})
```

**Step 2 - Implement to Pass Tests:**
- File: `src/core/connection-manager.ts` (IMPLEMENT AFTER TESTS)
- Extract connection logic from existing connector
- Make tests pass one by one

#### Task 1.2: Create SchemaManager (TDD Approach)  
**Step 1 - Write Tests First:**
```typescript
// tests/unit/core/schema-manager.test.ts (WRITE FIRST)
describe('SchemaManager', () => {
  test('should load schema from definition') // FAIL initially
  test('should validate schema structure') // FAIL initially
  test('should handle schema migration') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- File: `src/core/schema-manager.ts` (IMPLEMENT AFTER TESTS)

#### Task 1.3: Refactor QueryExecutor Independence (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/db/query-executor-independence.test.ts (WRITE FIRST)
describe('QueryExecutor Independence', () => {
  test('should work without AgeSchemaClient') // FAIL initially
  test('should accept injected dependencies') // FAIL initially
  test('should execute queries independently') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- File: `src/db/query.ts` (MODIFY AFTER TESTS)

### Phase 2: Query System Independence (Week 3)

#### Task 2.1: QueryBuilder Independence (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/query/builder-independence.test.ts (WRITE FIRST)
describe('QueryBuilder Independence', () => {
  test('should create QueryBuilder without AgeSchemaClient') // FAIL initially
  test('should accept schema and executor dependencies') // FAIL initially
  test('should build queries independently') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- File: `src/query/builder.ts` (MODIFY AFTER TESTS)

#### Task 2.2: Complete Parameter Collection (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/query/parameter-collection.test.ts (WRITE FIRST)
describe('Parameter Collection', () => {
  test('should collect parameters from match patterns') // FAIL initially
  test('should handle nested parameter structures') // FAIL initially
  test('should validate parameter types') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- File: `src/query/parts.ts` line 119 (IMPLEMENT AFTER TESTS)

#### Task 2.3: Specialized Query Builders (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/query/specialized-builders.test.ts (WRITE FIRST)
describe('Specialized Query Builders', () => {
  test('PathQueryBuilder should work independently') // FAIL initially
  test('AlgorithmQueryBuilder should work independently') // FAIL initially
  test('AnalyticsQueryBuilder should work independently') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Files: `src/query/path.ts`, `src/query/algorithms.ts`, `src/query/analytics.ts`

### Phase 3: Remove AgeSchemaClient (Week 4)

#### Task 3.1: Component Composition (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/core/component-composition.test.ts (WRITE FIRST)
describe('Component Composition', () => {
  test('should compose components for basic operations') // FAIL initially
  test('should handle component dependencies correctly') // FAIL initially
  test('should provide same functionality as old client') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Create factory functions for common compositions
- Update `src/index.ts` exports

#### Task 3.2: Migration Integration Tests (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/integration/component-migration.test.ts (WRITE FIRST) 
describe('Migration Integration', () => {
  test('new composition provides same results as old client') // FAIL initially
  test('performance is maintained or improved') // FAIL initially
  test('all existing workflows work with new architecture') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Migrate integration tests from AgeSchemaClient to component composition
- Ensure all integration scenarios work

#### Task 3.3: Remove Master Client Class (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/core/legacy-compatibility.test.ts (WRITE FIRST)
describe('Legacy Compatibility', () => {
  test('migration guide examples work correctly') // FAIL initially
  test('common usage patterns are preserved') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Remove `src/core/client.ts` or replace with compatibility wrapper
- Update exports and documentation

### Phase 4: Polish & Optimization (Week 5)

#### Task 4.1: Performance Validation (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/performance/refactoring-performance.test.ts (WRITE FIRST)
describe('Refactoring Performance', () => {
  test('component initialization is under 10ms per component') // FAIL initially
  test('query execution times maintained or improved') // FAIL initially
  test('memory usage not increased') // FAIL initially
  test('batch loading performance preserved') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Run performance benchmarks and optimize if needed
- Ensure no regression in critical paths

#### Task 4.2: Type Safety Enhancement (TDD Approach) 
**Step 1 - Write Tests First:**
```typescript
// tests/unit/core/type-safety.test.ts (WRITE FIRST)
describe('Type Safety', () => {
  test('component composition has proper type inference') // FAIL initially
  test('generic constraints prevent invalid usage') // FAIL initially
  test('compile-time dependency validation works') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Improve TypeScript types and generic constraints
- Add better type inference for component composition

#### Task 4.3: Documentation and Examples (TDD Approach)
**Step 1 - Write Tests First:**
```typescript
// tests/unit/docs/example-validation.test.ts (WRITE FIRST)
describe('Documentation Examples', () => {
  test('README examples compile and run correctly') // FAIL initially
  test('migration guide examples work as documented') // FAIL initially
  test('API documentation examples are accurate') // FAIL initially
})
```

**Step 2 - Implement to Pass Tests:**
- Update all documentation and examples
- Ensure examples are accurate and functional

## Testing Strategy

### Test-Driven Development Approach

For each component refactoring:

1. **Write Failing Test First**
   ```typescript
   // Example: tests/unit/core/connection-manager.test.ts
   describe('ConnectionManager', () => {
     it('should initialize with valid config', () => {
       const config = { host: 'localhost', port: 5432 };
       const manager = new ConnectionManager(config);
       expect(manager.isConnected()).toBe(false);
     });
   });
   ```

2. **Implement Component**
   ```typescript
   // src/core/connection-manager.ts
   export class ConnectionManager {
     constructor(private config: ConnectionConfig) {
       this.validateConfig(config);
     }
   }
   ```

3. **Verify Test Passes**
4. **Refactor and Repeat**

### Specific Test Cases

#### Component Independence Tests
- Each component can be instantiated without AgeSchemaClient
- Components work with mocked dependencies
- No hidden dependencies or global state

#### Composition Tests
- Components can be composed to replicate current functionality
- Integration tests verify end-to-end workflows
- Error handling works correctly across component boundaries

#### Migration Tests
- Existing functionality still works (if compatibility wrapper provided)
- New API provides same capabilities as old API
- Performance characteristics maintained

### Test File Structure
```
tests/
├── unit/
│   ├── core/
│   │   ├── connection-manager.test.ts
│   │   └── schema-validator.test.ts
│   ├── db/
│   │   ├── query-executor-independence.test.ts
│   │   ├── vertex-operations-independence.test.ts
│   │   └── edge-operations-independence.test.ts
│   └── query/
│       ├── builder-independence.test.ts
│       ├── parameter-collection.test.ts
│       └── specialized-builders.test.ts
├── integration/
│   ├── component-composition.integration.test.ts
│   └── migration-compatibility.integration.test.ts
└── performance/
    └── refactoring-performance.test.ts
```

## Timeline & Milestones

### Week 1: Foundation Setup
- **Milestone**: Base component classes created
- **Deliverables**: ConnectionManager, SchemaValidator classes with tests
- **Success Criteria**: New classes pass all unit tests

### Week 2: Core Component Refactoring
- **Milestone**: Database components independent
- **Deliverables**: QueryExecutor, VertexOperations, EdgeOperations refactored
- **Success Criteria**: Components work without AgeSchemaClient

### Week 3: Query Builder Independence
- **Milestone**: Query builders decoupled
- **Deliverables**: All query builders work independently
- **Success Criteria**: Query building works with new architecture

### Week 4: AgeSchemaClient Removal
- **Milestone**: Master client removed
- **Deliverables**: AgeSchemaClient deleted, exports updated
- **Success Criteria**: Library works without master client

### Week 5: Final Polish
- **Milestone**: Production ready
- **Deliverables**: Documentation, migration guide, performance validation
- **Success Criteria**: All tests pass, performance maintained

## Risks & Mitigation

### Risk 1: Breaking Changes for Users
**Probability**: High
**Impact**: High
**Mitigation**: 
- Provide comprehensive migration guide
- Consider offering compatibility wrapper temporarily
- Use semantic versioning to indicate breaking changes

### Risk 2: Performance Regression
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Comprehensive performance testing before/after
- Optimize component initialization
- Monitor memory usage and query execution times

### Risk 3: Increased Complexity for Simple Use Cases
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Provide convenience functions for common compositions
- Clear documentation with examples
- Consider factory functions for common patterns

### Risk 4: Incomplete Feature Implementation
**Probability**: Low
**Impact**: High
**Mitigation**:
- Complete audit of all TODO/FIXME items
- Comprehensive testing of all features
- Phased implementation with validation at each step

## Documentation Updates

### Files Requiring Updates

1. **README.md**
   - Update installation and basic usage examples
   - Show component composition instead of master client

2. **docs/getting-started.md**
   - Rewrite to use new architecture
   - Add component composition examples

3. **docs/api-reference/**
   - Update all API documentation
   - Remove AgeSchemaClient references
   - Add individual component documentation

4. **examples/**
   - Update all example files
   - Show new usage patterns
   - Demonstrate component composition

### New Documentation

1. **Migration Guide** (`docs/migration-guide.md`)
   - Step-by-step migration instructions
   - Before/after code examples
   - Common patterns and recipes

2. **Component Composition Guide** (`docs/component-composition.md`)
   - How to combine components effectively
   - Common composition patterns
   - Best practices and anti-patterns

## Success Metrics

### Technical Metrics
- [ ] All existing tests pass with new architecture
- [ ] Code coverage maintained at 90%+
- [ ] No performance regression (< 5% slower)
- [ ] Zero unimplemented features (TODO/FIXME)
- [ ] All components have focused, single-responsibility APIs

### Developer Experience Metrics
- [ ] Users can import only needed components
- [ ] Clear error messages for missing dependencies
- [ ] Predictable initialization without runtime surprises
- [ ] Comprehensive documentation and examples

### Maintenance Metrics
- [ ] Reduced coupling between components
- [ ] Each component can be tested in isolation
- [ ] Clear dependency relationships
- [ ] Easier to add new functionality without affecting existing components

---

*This PRD provides a comprehensive roadmap for refactoring the AgeSchemaClient into a collection of focused, composable classes. The implementation follows Test-Driven Development principles and prioritizes backward compatibility while improving the overall architecture.*
- **Better Testability**: Individual components can be tested in isolation with clear boundaries
- **Enhanced Flexibility**: Users can compose only the features they need instead of loading all functionality
- **Reduced Coupling**: Components interact through well-defined interfaces rather than through a central orchestrator
- **Clearer API Surface**: Each component exposes its own focused API

### Impact Assessment
- **Breaking Change**: This is a major architectural change that will require API migration
- **Testing Effort**: Comprehensive testing required for each individual component
- **Documentation**: Extensive documentation updates needed to reflect new usage patterns

### Risk Assessment
- **Low Risk**: The underlying functionality is already well-implemented in separate modules
- **Mitigation**: Test-driven development approach ensures functionality preservation
- **Rollback Strategy**: Current implementation can be preserved during transition period

## Current State Analysis

### Architecture Assessment

#### Current Master Component Design (`src/core/client.ts`)
```typescript
export class AgeSchemaClient<T extends SchemaDefinition = SchemaDefinition> {
  private config: ClientConfig;
  private schema?: T;
  private connectionManager?: PgConnectionManager;
  private queryExecutor?: QueryExecutor;
  private sqlGenerator?: SQLGenerator;
  private vertexOperations?: VertexOperations<T>;
  private edgeOperations?: EdgeOperations<T>;

  // TODO: Initialize schema from config
  // TODO: Initialize connection manager and query executor
}
```

**Problems Identified:**
1. **Unimplemented Initialization**: Constructor has critical TODOs preventing functionality
2. **God Object Pattern**: Single class tries to manage all functionality
3. **Hidden Dependencies**: Complex initialization dependencies not clear to users
4. **Factory Pattern Overuse**: Client acts as factory for all other components
5. **Poor Separation of Concerns**: Connection management, schema handling, and query execution mixed

#### Well-Implemented Components Ready for Independence
1. **Schema System** (`src/schema/`): Complete and self-contained
2. **Connection Management** (`src/db/connector.ts`): Production-ready
3. **Query Builders** (`src/query/`): Multiple specialized builders working independently
4. **Batch Loading** (`src/loader/`): Self-contained with clear interfaces
5. **Database Operations** (`src/db/`): Vertex and edge operations with minimal dependencies
6. **SQL Generation** (`src/sql/`): Pure functions, no state dependencies

#### Integration Pain Points
```typescript
// Current problematic pattern - everything through client
const client = new AgeSchemaClient(config);
const queryBuilder = client.createQueryBuilder('graph'); // Fails due to uninitialized dependencies
const vertexOps = client.getVertexOperations(); // Complex dependency chain
```

### Testing Infrastructure Analysis

#### Current Test Structure
- **Unit Tests**: 23 test files with good component isolation
- **Integration Tests**: 25+ files testing real database interactions
- **Performance Tests**: Comprehensive benchmarking suite
- **Test Categories**: Connection, schema, loader, query builder

#### Test Coverage Gaps
1. **Client Integration Tests**: Current client tests cannot run due to unimplemented initialization
2. **Component Composition Tests**: Missing tests for how components work together
3. **Lifecycle Management Tests**: No tests for proper resource cleanup

## Proposed Changes

### New Architecture: Single-Concept Classes

#### Core Components
1. **ConnectionManager**: Database connection and pool management
2. **SchemaRegistry**: Schema loading, validation, and management
3. **QueryExecutor**: Query execution with transaction support
4. **VertexManager**: Vertex operations (create, read, update, delete)
5. **EdgeManager**: Edge operations (create, read, update, delete)
6. **BatchLoader**: Bulk data loading operations
7. **QueryBuilder**: Fluent query construction (multiple specialized builders)

#### Component Interaction Pattern
```typescript
// New composition pattern
const connectionManager = new ConnectionManager(connectionConfig);
const schemaRegistry = new SchemaRegistry(schemaConfig);
const queryExecutor = new QueryExecutor(connectionManager);
const vertexManager = new VertexManager(schemaRegistry, queryExecutor);

// Components work together through explicit composition
const vertices = await vertexManager.createBatch(vertexData);
```

### Detailed Component Specifications

#### 1. ConnectionManager
**File**: `src/db/connection-manager.ts`
**Responsibilities**:
- PostgreSQL connection pool management
- AGE extension initialization
- Connection health monitoring

```typescript
export class ConnectionManager {
  constructor(config: ConnectionConfig)
  
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async getConnection(): Promise<PoolClient>
  async executeQuery<T>(query: string, params?: any[]): Promise<QueryResult<T>>
  async executeInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>
}
```

#### 2. SchemaRegistry
**File**: `src/schema/schema-registry.ts`
**Responsibilities**:
- Schema loading from files or objects
- Schema validation and parsing
- Schema migration management

```typescript
export class SchemaRegistry<T extends SchemaDefinition = SchemaDefinition> {
  constructor(config?: SchemaConfig)
  
  async loadSchema(source: string | T): Promise<void>
  validateData(vertexType: string, data: any): ValidationResult
  getVertexLabels(): string[]
  getEdgeLabels(): string[]
  getSchema(): T
}
```

#### 3. QueryExecutor
**File**: `src/db/query-executor.ts`
**Responsibilities**:
- Query execution coordination
- Transaction management
- Result processing

```typescript
export class QueryExecutor {
  constructor(connectionManager: ConnectionManager)
  
  async execute<T>(query: string, params?: any[]): Promise<QueryResult<T>>
  async executeTransaction<T>(queries: QueryRequest[]): Promise<T[]>
  async executeCypher<T>(cypher: string, graphName: string): Promise<T[]>
}
```

#### 4. VertexManager
**File**: `src/db/vertex-manager.ts`
**Responsibilities**:
- Vertex CRUD operations
- Vertex validation
- Bulk vertex operations

```typescript
export class VertexManager<T extends SchemaDefinition = SchemaDefinition> {
  constructor(schemaRegistry: SchemaRegistry<T>, queryExecutor: QueryExecutor)
  
  async create(label: string, properties: any): Promise<Vertex>
  async createBatch(label: string, vertices: any[]): Promise<BatchResult>
  async findById(label: string, id: string): Promise<Vertex | null>
  async update(label: string, id: string, properties: any): Promise<Vertex>
  async delete(label: string, id: string): Promise<boolean>
}
```

#### 5. EdgeManager
**File**: `src/db/edge-manager.ts`
**Responsibilities**:
- Edge CRUD operations
- Edge validation
- Relationship management

```typescript
export class EdgeManager<T extends SchemaDefinition = SchemaDefinition> {
  constructor(schemaRegistry: SchemaRegistry<T>, queryExecutor: QueryExecutor)
  
  async create(label: string, fromId: string, toId: string, properties?: any): Promise<Edge>
  async createBatch(label: string, edges: EdgeInput[]): Promise<BatchResult>
  async findById(label: string, id: string): Promise<Edge | null>
  async findByVertices(fromId: string, toId: string): Promise<Edge[]>
  async delete(label: string, id: string): Promise<boolean>
}
```

#### 6. BatchLoader
**File**: `src/loader/batch-loader.ts` (refactored)
**Responsibilities**:
- High-performance bulk data loading
- Progress reporting
- Error handling and recovery

```typescript
export class BatchLoader<T extends SchemaDefinition = SchemaDefinition> {
  constructor(
    schemaRegistry: SchemaRegistry<T>, 
    queryExecutor: QueryExecutor,
    options?: BatchLoaderOptions
  )
  
  async loadVertices(label: string, data: any[]): Promise<BatchResult>
  async loadEdges(label: string, data: EdgeInput[]): Promise<BatchResult>
  on(event: 'progress' | 'error', callback: Function): void
}
```

## Requirements Breakdown

### Functional Requirements

#### FR-1: Independent Component Initialization
**User Story**: As a developer, I want to initialize only the components I need for my use case.

**Acceptance Criteria**:
- [ ] Each component can be instantiated independently
- [ ] Components explicitly declare their dependencies in constructor
- [ ] No hidden initialization or global state
- [ ] Components can be mocked for testing

**Tests Required**:
```typescript
describe('Component Independence', () => {
  test('ConnectionManager can be initialized without other components')
  test('SchemaRegistry can be initialized without database connection')
  test('Components fail gracefully with invalid dependencies')
})
```

#### FR-2: Explicit Dependency Management
**User Story**: As a developer, I want clear visibility into which components depend on others.

**Acceptance Criteria**:
- [ ] All dependencies passed through constructor
- [ ] No service locator or dependency injection container
- [ ] TypeScript types enforce correct dependency relationships
- [ ] Circular dependencies prevented by design

#### FR-3: Backward Compatibility Layer
**User Story**: As an existing user, I want a migration path from the current API.

**Acceptance Criteria**:
- [ ] Compatibility wrapper class maintains existing API
- [ ] Clear migration guide with examples
- [ ] Deprecation warnings for old patterns
- [ ] Side-by-side usage during transition

**Implementation**:
```typescript
// Compatibility layer
export class AgeSchemaClientLegacy<T extends SchemaDefinition = SchemaDefinition> {
  private connectionManager: ConnectionManager;
  private schemaRegistry: SchemaRegistry<T>;
  private queryExecutor: QueryExecutor;
  
  constructor(config: ClientConfig) {
    // Initialize new components internally
    this.connectionManager = new ConnectionManager(config.connection);
    this.schemaRegistry = new SchemaRegistry(config.schema);
    this.queryExecutor = new QueryExecutor(this.connectionManager);
  }
  
  // Legacy methods delegate to new components
  createQueryBuilder(graphName: string = 'default') {
    return new QueryBuilder(this.schemaRegistry, this.queryExecutor, graphName);
  }
}
```

### Non-Functional Requirements

#### NFR-1: Performance
- Component initialization overhead < 10ms per component
- Memory usage not increased compared to current implementation
- Query execution performance maintained or improved

#### NFR-2: Type Safety
- Full TypeScript type coverage for all new components
- Generic type constraints for schema definitions
- Compile-time dependency validation

#### NFR-3: Error Handling
- Each component defines its own error types
- Clear error propagation between components
- Graceful degradation when optional components fail

#### NFR-4: Testing
- 100% unit test coverage for each component
- Integration tests for component interactions
- Performance benchmarks for critical paths

## Implementation Plan

### Phase 1: Foundation Components (Week 1-2)
**Goal**: Create core infrastructure components

#### Tasks:
1. **Create ConnectionManager** (`src/db/connection-manager.ts`)
   - [ ] Extract connection logic from existing connector
   - [ ] Write unit tests before implementation
   - [ ] Add integration tests with real PostgreSQL
   - [ ] Implement health monitoring
   
2. **Create SchemaRegistry** (`src/schema/schema-registry.ts`)
   - [ ] Extract schema loading from client
   - [ ] Write unit tests for schema validation
   - [ ] Add file loading capabilities
   - [ ] Implement migration support

3. **Create QueryExecutor** (`src/db/query-executor.ts`)
   - [ ] Extract query execution logic
   - [ ] Write unit tests with mocked connections
   - [ ] Add transaction management
   - [ ] Implement result processing

**Tests to Write First (TDD)**:
```typescript
// tests/unit/db/connection-manager.test.ts
describe('ConnectionManager', () => {
  test('should initialize with valid config')
  test('should establish connection to PostgreSQL')
  test('should handle connection failures gracefully')
  test('should manage connection pool lifecycle')
})

// tests/unit/schema/schema-registry.test.ts
describe('SchemaRegistry', () => {
  test('should load schema from object')
  test('should load schema from file path')
  test('should validate vertex data against schema')
  test('should reject invalid schema definitions')
})

// tests/unit/db/query-executor.test.ts
describe('QueryExecutor', () => {
  test('should execute simple queries')
  test('should handle parameterized queries')
  test('should manage transactions')
  test('should process query results correctly')
})
```

### Phase 2: Manager Components (Week 3-4)
**Goal**: Create domain-specific manager components

#### Tasks:
1. **Create VertexManager** (`src/db/vertex-manager.ts`)
   - [ ] Extract vertex operations from existing code
   - [ ] Write unit tests with mocked dependencies
   - [ ] Add batch operations support
   - [ ] Implement validation integration

2. **Create EdgeManager** (`src/db/edge-manager.ts`)
   - [ ] Extract edge operations
   - [ ] Write unit tests for CRUD operations
   - [ ] Add relationship management features
   - [ ] Implement validation integration

3. **Refactor BatchLoader** (`src/loader/batch-loader.ts`)
   - [ ] Update to use new component dependencies
   - [ ] Write unit tests for refactored implementation
   - [ ] Maintain existing performance characteristics
   - [ ] Add progress reporting improvements

**Tests to Write First**:
```typescript
// tests/unit/db/vertex-manager.test.ts
describe('VertexManager', () => {
  test('should create vertex with valid data')
  test('should validate vertex data against schema')
  test('should handle batch vertex creation')
  test('should update existing vertices')
  test('should delete vertices safely')
})

// tests/unit/db/edge-manager.test.ts
describe('EdgeManager', () => {
  test('should create edge between valid vertices')
  test('should validate edge data against schema')
  test('should handle batch edge creation')
  test('should find edges by vertex relationships')
  test('should delete edges safely')
})
```

### Phase 3: Query System Integration (Week 5)
**Goal**: Update query builders to work with new components

#### Tasks:
1. **Update QueryBuilder** (`src/query/builder.ts`)
   - [ ] Modify constructor to accept new dependencies
   - [ ] Write unit tests for updated integration
   - [ ] Ensure backward compatibility
   - [ ] Update specialized builders (Path, Analytics, Algorithms)

2. **Integration Testing**
   - [ ] Write integration tests for component composition
   - [ ] Test full workflow scenarios
   - [ ] Performance regression testing
   - [ ] Error handling integration tests

### Phase 4: Compatibility & Migration (Week 6)
**Goal**: Provide migration path and documentation

#### Tasks:
1. **Backward Compatibility Layer**
   - [ ] Create legacy wrapper class
   - [ ] Write tests for compatibility layer
   - [ ] Add deprecation warnings
   - [ ] Document migration path

2. **Documentation Updates**
   - [ ] Update getting started guide
   - [ ] Create component composition examples
   - [ ] Update API documentation
   - [ ] Write migration guide

3. **Example Updates**
   - [ ] Update all examples to new pattern
   - [ ] Add component composition examples
   - [ ] Create side-by-side comparison examples
   - [ ] Update integration test examples

### Phase 5: Cleanup & Optimization (Week 7)
**Goal**: Remove deprecated code and optimize

#### Tasks:
1. **Remove Unimplemented Features**
   - [ ] Remove TODOs from original client
   - [ ] Delete unused initialization code
   - [ ] Clean up import dependencies
   - [ ] Update type definitions

2. **Performance Optimization**
   - [ ] Run performance benchmarks
   - [ ] Optimize component initialization
   - [ ] Reduce memory footprint
   - [ ] Improve type inference

## Testing Strategy

### Test-Driven Development Approach

#### Before Implementation Checklist:
1. **Write failing unit tests** for each component
2. **Write integration tests** for component interactions
3. **Write performance tests** for critical paths
4. **Document expected behavior** in test descriptions

#### Component Testing Pattern:
```typescript
// Example test structure for each component
describe('ComponentName', () => {
  describe('initialization', () => {
    test('should initialize with valid config')
    test('should fail with invalid config')
    test('should handle missing dependencies')
  })
  
  describe('core functionality', () => {
    test('should perform primary operations')
    test('should handle edge cases')
    test('should validate inputs')
  })
  
  describe('error handling', () => {
    test('should handle network errors')
    test('should handle validation errors')
    test('should clean up resources on error')
  })
  
  describe('resource management', () => {
    test('should clean up resources properly')
    test('should handle concurrent access')
    test('should prevent memory leaks')
  })
})
```

#### Integration Testing Strategy:
```typescript
// Component composition tests
describe('Component Integration', () => {
  test('ConnectionManager + QueryExecutor integration')
  test('SchemaRegistry + VertexManager validation')
  test('Full workflow: schema load → connect → create vertices → query')
  test('Error propagation across components')
  test('Resource cleanup on component failure')
})
```

### Specific Test Cases by Component

#### ConnectionManager Tests:
- Connection establishment and teardown
- Pool management and limits
- Health monitoring and reconnection
- AGE extension loading
- Error handling for connection failures

#### SchemaRegistry Tests:
- Schema loading from various sources
- Validation rule enforcement
- Type constraint checking
- Migration compatibility
- Invalid schema rejection

#### QueryExecutor Tests:
- Query execution with parameters
- Transaction management
- Result set processing
- Error handling and rollback
- Concurrent query execution

#### VertexManager Tests:
- CRUD operations for vertices
- Batch operations performance
- Schema validation integration
- Constraint enforcement
- ID generation and uniqueness

#### EdgeManager Tests:
- Edge creation with valid vertices
- Relationship constraint validation
- Batch edge operations
- Orphaned edge prevention
- Complex relationship queries

#### BatchLoader Tests:
- Large dataset loading performance
- Progress reporting accuracy
- Error recovery and rollback
- Memory usage optimization
- Concurrent loading scenarios

## Timeline & Milestones

### Week 1-2: Foundation Components
- **Milestone**: Core infrastructure components functional
- **Deliverables**: ConnectionManager, SchemaRegistry, QueryExecutor
- **Tests**: 100% unit test coverage for core components
- **Success Criteria**: Components can be instantiated and used independently

### Week 3-4: Manager Components  
- **Milestone**: Domain-specific managers implemented
- **Deliverables**: VertexManager, EdgeManager, refactored BatchLoader
- **Tests**: Integration tests for component interactions
- **Success Criteria**: Basic CRUD operations work through new components

### Week 5: Query System Integration
- **Milestone**: Query builders updated for new architecture
- **Deliverables**: Updated query builders, integration tests
- **Tests**: End-to-end workflow tests
- **Success Criteria**: Complete graph operations possible through composition

### Week 6: Compatibility & Migration
- **Milestone**: Migration path established
- **Deliverables**: Compatibility layer, migration guide, updated examples
- **Tests**: Backward compatibility tests
- **Success Criteria**: Existing code can migrate with minimal changes

### Week 7: Cleanup & Optimization
- **Milestone**: Production-ready refactored library
- **Deliverables**: Optimized components, cleaned codebase, performance benchmarks
- **Tests**: Performance regression tests pass
- **Success Criteria**: Library ready for release with improved architecture

## Risks & Mitigation

### Technical Risks

#### Risk 1: Performance Regression
**Probability**: Medium  
**Impact**: High  
**Mitigation**:
- Comprehensive performance benchmarking before and after
- Component initialization pooling for frequently created objects
- Lazy loading for optional dependencies
- Memory profiling during development

#### Risk 2: Complex Component Interactions
**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:
- Clear interface definitions between components
- Extensive integration testing
- Documentation of component interaction patterns
- Examples showing proper composition

#### Risk 3: Breaking Changes for Users
**Probability**: High  
**Impact**: High  
**Mitigation**:
- Comprehensive backward compatibility layer
- Detailed migration guide with code examples
- Deprecation warnings with clear upgrade paths
- Side-by-side API comparison documentation

### Project Risks

#### Risk 1: Timeline Overrun
**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:
- Conservative estimates with buffer time
- Prioritize core functionality over nice-to-have features
- Early integration testing to catch issues
- Regular milestone reviews and adjustments

#### Risk 2: Test Coverage Gaps
**Probability**: Low  
**Impact**: High  
**Mitigation**:
- Test-driven development approach
- Automated coverage reporting
- Mandatory test review for all components
- Integration test requirements for each milestone

## Success Metrics

### Technical Metrics
- **Component Independence**: Each component can be tested in isolation
- **Type Safety**: 100% TypeScript coverage with strict mode
- **Performance**: No regression in query execution times
- **Memory Usage**: No increase in memory footprint
- **Test Coverage**: 100% unit test coverage, 90% integration test coverage

### User Experience Metrics
- **API Clarity**: New API requires fewer lines of code for common operations
- **Documentation Quality**: Complete examples for all component compositions
- **Migration Ease**: Existing users can migrate in < 1 hour with guide
- **Error Messages**: Clear error messages with actionable suggestions

### Business Metrics
- **Maintainability**: Reduced time to add new features
- **Onboarding**: New contributors can understand component architecture quickly
- **Flexibility**: Users can compose minimal feature sets for their needs
- **Ecosystem Growth**: Foundation for plugins and extensions

## Critical Implementation Requirements Summary

### Test-Driven Development is Mandatory
- **Every task must start with writing failing tests**
- **No implementation without corresponding test coverage**
- **Follow Red-Green-Refactor cycle for all changes**
- **Tests define the behavior before code is written**

### Key Success Criteria
1. **Eliminate Unimplemented Features**: Remove all TODO items and incomplete functionality
2. **Single-Responsibility Classes**: Each class focuses on one core concept
3. **Test Coverage**: 100% coverage for all new components with TDD approach
4. **Performance**: No regression in any component
5. **Migration Path**: Clear upgrade path with working examples

## Conclusion

This refactoring from a monolithic, incomplete client to focused single-concept classes will transform the AgeSchemaClient library from a broken facade pattern into a robust, composable architecture. The analysis revealed that the current AgeSchemaClient is largely non-functional with critical unimplemented features, while individual components are already well-designed and working.

The mandatory test-driven development approach ensures that:
- **All functionality is properly implemented** (no more TODOs)
- **Quality is built-in from the start** (tests written before code)
- **Refactoring is safe** (comprehensive test coverage)
- **Performance is preserved** (baseline comparisons)

The result will be a library that follows solid software engineering principles, eliminates the master component anti-pattern, and provides users with flexible, composable classes that can be used independently or together as needed.