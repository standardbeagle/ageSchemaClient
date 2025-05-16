# API Reference

This document provides a comprehensive reference for the Apache AGE Schema Client API.

## Table of Contents

- [Connection Management](#connection-management)
- [Query Execution](#query-execution)
- [SQL Generation](#sql-generation)
- [Vertex Operations](#vertex-operations)
- [Edge Operations](#edge-operations)
- [Batch Operations](#batch-operations)
- [Schema Migration](#schema-migration)
- [SchemaLoader](#schemaloader)
- [Error Handling](#error-handling)

## Connection Management

### PgConnectionManager

```typescript
class PgConnectionManager {
  constructor(config: PgConnectionConfig);

  async getConnection(): Promise<Connection>;
  async closeAll(): Promise<void>;
  getPoolStatus(): PoolStatus;
}
```

#### PgConnectionConfig

```typescript
interface PgConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  pool?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  retry?: {
    maxAttempts?: number;
    delay?: number;
  };
}
```

#### Connection

```typescript
interface Connection {
  query(text: string | any, params?: any[]): Promise<any>;
  release(): void;
  getClient?(): any;
}
```

#### PoolStatus

```typescript
interface PoolStatus {
  total: number;
  idle: number;
  waiting: number;
}
```

## Query Execution

### QueryExecutor

```typescript
class QueryExecutor {
  constructor(connection: Connection, options?: QueryExecutorOptions);

  async executeSQL(sql: string, params?: any[], options?: QueryOptions): Promise<QueryResult>;
  async executeCypher(query: string, params?: any, options?: QueryOptions): Promise<QueryResult>;
  async executeCopyFrom(sql: string, data: string, options?: QueryOptions): Promise<QueryResult>;
  async beginTransaction(): Promise<Transaction>;
  transformResult<T, R>(result: QueryResult<T>, transformer: (row: T) => R): R[];
}
```

#### QueryExecutorOptions

```typescript
interface QueryExecutorOptions {
  logger?: Logger;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}
```

#### QueryOptions

```typescript
interface QueryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  transaction?: Transaction;
}
```

#### QueryResult

```typescript
interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields: any[];
  command: string;
  oid: number;
}
```

#### Transaction

```typescript
interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

## SQL Generation

### SQLGenerator

```typescript
class SQLGenerator<T extends SchemaDefinition> {
  constructor(schema: T, options?: SQLGeneratorOptions);

  generateCreateVertexTableSQL(label: string): SQLResult;
  generateCreateEdgeTableSQL(label: string): SQLResult;
  generateInsertVertexSQL(label: string, data: any): SQLResult;
  generateInsertEdgeSQL(label: string, sourceId: string, targetId: string, data?: any): SQLResult;
  generateUpdateVertexSQL(label: string, id: string, data: any): SQLResult;
  generateUpdateEdgeSQL(label: string, id: string, data: any): SQLResult;
  generateDeleteVertexSQL(label: string, id: string): SQLResult;
  generateDeleteEdgeSQL(label: string, id: string): SQLResult;
  generateGetVertexSQL(label: string, id: string): SQLResult;
  generateGetEdgeSQL(label: string, id: string): SQLResult;
  generateFindVerticesSQL(label: string, filter?: any, options?: FindOptions): SQLResult;
  generateFindEdgesSQL(label: string, filter?: any, options?: FindOptions): SQLResult;
  generateBatchInsertVertexSQL(label: string, dataArray: any[]): SQLResult;
  generateBatchInsertEdgeSQL(label: string, edgeData: any[]): SQLResult;

  // Migration methods
  generateDropVertexTableSQL(label: string): SQLResult;
  generateDropEdgeTableSQL(label: string): SQLResult;
  generateAddColumnSQL(label: string, propertyName: string, propertyDef: PropertyDefinition, isEdge?: boolean): SQLResult;
  generateDropColumnSQL(label: string, propertyName: string, isEdge?: boolean): SQLResult;
  generateAlterColumnTypeSQL(label: string, propertyName: string, propertyDef: PropertyDefinition, isEdge?: boolean): SQLResult;
  generateSetNotNullSQL(label: string, propertyName: string, isEdge?: boolean): SQLResult;
  generateDropNotNullSQL(label: string, propertyName: string, isEdge?: boolean): SQLResult;
  generateRenameColumnSQL(label: string, oldName: string, newName: string, isEdge?: boolean): SQLResult;
  generateSetDefaultSQL(label: string, propertyName: string, defaultValue: any, isEdge?: boolean): SQLResult;
  generateDropDefaultSQL(label: string, propertyName: string, isEdge?: boolean): SQLResult;
}
```

#### SQLGeneratorOptions

```typescript
interface SQLGeneratorOptions {
  tablePrefix?: string;
  includeMetadata?: boolean;
  primaryKeyColumn?: string;
  sourceIdColumn?: string;
  targetIdColumn?: string;
}
```

#### SQLResult

```typescript
interface SQLResult {
  sql: string;
  params: any[];
}
```

#### FindOptions

```typescript
interface FindOptions {
  limit?: number;
  offset?: number;
  orderBy?: string | string[];
  orderDirection?: 'ASC' | 'DESC';
}
```

## Vertex Operations

### VertexOperations

```typescript
class VertexOperations<T extends SchemaDefinition> {
  constructor(schema: T, queryExecutor: QueryExecutor, sqlGenerator: SQLGenerator<T>);

  async createVertex<L extends keyof T['vertices']>(
    label: L,
    data: VertexData<T, L>
  ): Promise<Vertex<T, L>>;

  async getVertex<L extends keyof T['vertices']>(
    label: L,
    id: string
  ): Promise<Vertex<T, L> | null>;

  async updateVertex<L extends keyof T['vertices']>(
    label: L,
    id: string,
    data: Partial<VertexData<T, L>>
  ): Promise<Vertex<T, L>>;

  async deleteVertex<L extends keyof T['vertices']>(
    label: L,
    id: string
  ): Promise<boolean>;

  async findVertices<L extends keyof T['vertices']>(
    label: L,
    filter?: VertexFilter<T, L>,
    options?: FindOptions
  ): Promise<Vertex<T, L>[]>;

  validateVertexData<L extends keyof T['vertices']>(
    label: L,
    data: VertexData<T, L>
  ): void;

  transformToVertex<L extends keyof T['vertices']>(
    label: L,
    row: any
  ): Vertex<T, L>;
}
```

#### Vertex

```typescript
interface Vertex<T extends SchemaDefinition, L extends keyof T['vertices']> {
  id: string;
  label: L;
  properties: VertexData<T, L>;
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### VertexData

```typescript
type VertexData<T extends SchemaDefinition, L extends keyof T['vertices']> = {
  [P in keyof T['vertices'][L]['properties']]?: PropertyType<T['vertices'][L]['properties'][P]['type']>;
} & {
  id?: string;
};
```

#### VertexFilter

```typescript
type VertexFilter<T extends SchemaDefinition, L extends keyof T['vertices']> = {
  [P in keyof T['vertices'][L]['properties']]?: any;
} & {
  id?: string;
};
```

## Edge Operations

### EdgeOperations

```typescript
class EdgeOperations<T extends SchemaDefinition> {
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    sqlGenerator: SQLGenerator<T>,
    vertexOperations: VertexOperations<T>
  );

  async createEdge<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>,
    data?: EdgeData<T, L>
  ): Promise<Edge<T, L>>;

  async getEdge<L extends keyof T['edges']>(
    label: L,
    id: string
  ): Promise<Edge<T, L> | null>;

  async updateEdge<L extends keyof T['edges']>(
    label: L,
    id: string,
    data: Partial<EdgeData<T, L>>
  ): Promise<Edge<T, L>>;

  async deleteEdge<L extends keyof T['edges']>(
    label: L,
    id: string
  ): Promise<boolean>;

  async findEdges<L extends keyof T['edges']>(
    label: L,
    filter?: EdgeFilter<T, L>,
    options?: FindOptions
  ): Promise<Edge<T, L>[]>;

  validateEdgeData<L extends keyof T['edges']>(
    label: L,
    data: EdgeData<T, L>
  ): void;

  validateVertexTypes<L extends keyof T['edges']>(
    label: L,
    fromVertex: Vertex<T, any>,
    toVertex: Vertex<T, any>
  ): void;

  transformToEdge<L extends keyof T['edges']>(
    label: L,
    row: any
  ): Edge<T, L>;
}
```

#### Edge

```typescript
interface Edge<T extends SchemaDefinition, L extends keyof T['edges']> {
  id: string;
  label: L;
  sourceId: string;
  targetId: string;
  properties: EdgeData<T, L>;
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### EdgeData

```typescript
type EdgeData<T extends SchemaDefinition, L extends keyof T['edges']> = {
  [P in keyof T['edges'][L]['properties']]?: PropertyType<T['edges'][L]['properties'][P]['type']>;
} & {
  id?: string;
};
```

#### EdgeFilter

```typescript
type EdgeFilter<T extends SchemaDefinition, L extends keyof T['edges']> = {
  [P in keyof T['edges'][L]['properties']]?: any;
} & {
  id?: string;
  sourceId?: string;
  targetId?: string;
};
```

## Batch Operations

### BatchOperations

```typescript
class BatchOperations<T extends SchemaDefinition> {
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    sqlGenerator: SQLGenerator<T>,
    vertexOperations: VertexOperations<T>,
    edgeOperations: EdgeOperations<T>
  );

  async createVerticesBatch<L extends keyof T['vertices']>(
    label: L,
    dataArray: VertexData<T, L>[],
    options?: BatchOperationOptions
  ): Promise<Vertex<T, L>[]>;

  async createEdgesBatch<L extends keyof T['edges']>(
    label: L,
    edges: Array<{
      fromVertex: Vertex<T, any>;
      toVertex: Vertex<T, any>;
      data?: EdgeData<T, L>;
    }>,
    options?: BatchOperationOptions
  ): Promise<Edge<T, L>[]>;
}
```

#### BatchOperationOptions

```typescript
interface BatchOperationOptions {
  batchSize?: number;
  useTempTables?: boolean;
  collectMetrics?: boolean;
  transaction?: Transaction;
}
```

#### BatchPerformanceMetrics

```typescript
interface BatchPerformanceMetrics {
  totalDuration: number;
  sqlGenerationDuration: number;
  dbExecutionDuration: number;
  validationDuration: number;
  itemCount: number;
  batchCount: number;
  itemsPerSecond: number;
}
```

## Schema Migration

### SchemaMigrationExecutor

```typescript
class SchemaMigrationExecutor {
  constructor(queryExecutor: QueryExecutor, sqlGenerator: SQLGenerator);

  createMigrationPlan(
    sourceSchema: SchemaDefinition,
    targetSchema: SchemaDefinition,
    options?: MigrationOptions
  ): MigrationPlan;

  async executeMigrationPlan(
    plan: MigrationPlan,
    options?: MigrationOptions
  ): Promise<MigrationResult>;
}
```

#### MigrationOptions

```typescript
interface MigrationOptions {
  allowDataLoss?: boolean;
  execute?: boolean;
  createBackup?: boolean;
  logMigration?: boolean;
}
```

#### MigrationPlan

```typescript
interface MigrationPlan {
  sourceVersion: string;
  targetVersion: string;
  steps: MigrationStep[];
  canCauseDataLoss: boolean;
}
```

#### MigrationStep

```typescript
interface MigrationStep {
  description: string;
  sql: string;
  params: any[];
  canCauseDataLoss: boolean;
}
```

#### MigrationResult

```typescript
interface MigrationResult {
  success: boolean;
  error?: string;
  plan: MigrationPlan;
  executedSteps: number;
  totalSteps: number;
}
```

### Schema Migration Utilities

```typescript
function compareSchemas(
  oldSchema: SchemaDefinition,
  newSchema: SchemaDefinition
): SchemaChange[];

function migrateSchema(
  oldSchema: SchemaDefinition,
  newSchema: SchemaDefinition,
  options?: SchemaMigrationOptions
): SchemaDefinition;
```

#### SchemaChange

```typescript
interface SchemaChange {
  type: SchemaChangeType;
  path: string;
  breaking: boolean;
  oldValue?: unknown;
  newValue?: unknown;
}
```

#### SchemaChangeType

```typescript
enum SchemaChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified'
}
```

#### SchemaMigrationOptions

```typescript
interface SchemaMigrationOptions {
  allowBreakingChanges?: boolean;
  autoIncrementVersion?: boolean;
  preserveUnknown?: boolean;
}
```

## SchemaLoader

The SchemaLoader class provides functionality for loading graph data into Apache AGE using the single-function approach.

### SchemaLoader

```typescript
class SchemaLoader<T extends SchemaDefinition> {
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    options?: SchemaLoaderOptions
  );

  // Load both vertices and edges
  async loadGraphData(
    data: GraphData,
    options?: LoadOptions
  ): Promise<LoadResult>;

  // Load only vertices
  async loadVertices(
    vertices: Record<string, any[]>,
    options?: LoadOptions
  ): Promise<LoadResult>;

  // Load only edges
  async loadEdges(
    edges: Record<string, any[]>,
    options?: LoadOptions
  ): Promise<LoadResult>;

  // Load from a JSON file
  async loadFromFile(
    filePath: string,
    options?: LoadOptions
  ): Promise<LoadResult>;

  // Execute a callback within a transaction
  async withTransaction<R>(
    callback: (transaction: Transaction) => Promise<R>
  ): Promise<R>;
}
```

### SchemaLoaderOptions

```typescript
interface SchemaLoaderOptions {
  validateBeforeLoad?: boolean; // Default: true
  batchSize?: number; // Default: 1000
  logger?: Logger;
  parallelInserts?: boolean; // Default: false
  maxParallelBatches?: number; // Default: 4
  useStreamingForLargeDatasets?: boolean; // Default: false
  largeDatasetThreshold?: number; // Default: 10000
}
```

### LoadOptions

```typescript
interface LoadOptions {
  transaction?: Transaction;
  graphName?: string; // Default: 'default'
  batchSize?: number;
  onProgress?: (progress: ProgressInfo) => void;
  validateData?: boolean;
}
```

### ProgressInfo

```typescript
interface ProgressInfo {
  phase: 'validation' | 'storing' | 'creating';
  current: number;
  total: number;
  percentage: number;
  vertexCount?: number;
  edgeCount?: number;
  currentType?: string;
  currentBatch?: number;
  totalBatches?: number;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
}
```

### LoadResult

```typescript
interface LoadResult {
  success: boolean;
  vertexCount: number;
  edgeCount: number;
  vertexTypes: string[];
  edgeTypes: string[];
  errors?: Error[];
  warnings?: string[];
  duration: number;
}
```

### GraphData

```typescript
interface GraphData {
  vertex: Record<string, any[]>;
  edge: Record<string, any[]>;
}
```

## Error Handling

### Error Classes

```typescript
class ValidationError extends Error {
  constructor(message: string, details?: any);
  details?: any;
  validationErrors: ValidationErrorDetail[];
}

class ValidationErrorDetail {
  path: string;
  message: string;
  value?: any;
  constraint?: any;
}

class QueryError extends Error {
  constructor(message: string, cause?: Error, details?: any);
  cause?: Error;
  details?: any;
}

class DatabaseError extends Error {
  constructor(message: string, originalError?: any);
  originalError: any;
}

class TimeoutError extends Error {
  constructor(message: string);
}

class SchemaVersionError extends Error {
  constructor(message: string, sourceVersion: string, targetVersion: string);
  sourceVersion: string;
  targetVersion: string;
}

class LoadError extends Error {
  constructor(message: string, phase: string, data?: any);
  phase: 'validation' | 'storing' | 'creating';
  data: any;
}
```
