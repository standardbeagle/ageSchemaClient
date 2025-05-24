# Extension System Architecture

This document describes the extensible architecture of ageSchemaClient that allows integration with multiple PostgreSQL extensions beyond Apache AGE.

## Overview

The extension system provides a flexible framework for:
- Loading and configuring multiple PostgreSQL extensions
- Managing extension-specific initialization
- Handling extension dependencies and conflicts
- Providing hooks for custom functionality

## Architecture Components

### 1. Extension Hook System

The extension system is built around lifecycle hooks that allow custom code execution at key points:

```typescript
interface ExtensionHooks {
  beforeConnect?: (config: ConnectionConfig) => Promise<void>;
  onConnectionCreate?: (connection: Connection) => Promise<void>;
  onConnectionReady?: (connection: Connection) => Promise<void>;
  onError?: (connection: Connection, error: Error) => Promise<void>;
  onDisconnect?: (connection: Connection) => Promise<void>;
}
```

### 2. Hook Execution Flow

```
┌─────────────────┐
│  Connection     │
│  Request        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  beforeConnect  │
│  Hook           │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Create         │
│  Connection     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ onConnectionCreate │
│  Hook           │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ onConnectionReady │
│  Hook           │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Connection     │
│  Available      │
└─────────────────┘
```

## Supported Extensions

### 1. Apache AGE (Core)

**Purpose**: Graph database functionality with Cypher queries

**Initialization**:
```typescript
async function initializeAGE(connection: Connection): Promise<void> {
  await connection.query("LOAD 'age'");
  await connection.query("SET search_path = ag_catalog, public");
  
  // Create parameter management infrastructure
  await connection.query(`
    CREATE TABLE IF NOT EXISTS age_params (
      key TEXT PRIMARY KEY,
      value JSONB
    )
  `);
  
  // Create parameter retrieval functions
  await createParameterFunctions(connection);
}
```

### 2. pgvector

**Purpose**: Vector similarity search and embeddings

**Initialization**:
```typescript
async function initializePgVector(connection: Connection): Promise<void> {
  await connection.query("CREATE EXTENSION IF NOT EXISTS vector");
  await connection.query("SET search_path = vector, ag_catalog, public");
}
```

**Usage Example**:
```typescript
const client = new AgeSchemaClient({
  connectionString: '...',
  onConnectionCreate: async (connection) => {
    await initializeAGE(connection);
    await initializePgVector(connection);
  }
});
```

### 3. PostGIS

**Purpose**: Spatial and geographic data support

**Initialization**:
```typescript
async function initializePostGIS(connection: Connection): Promise<void> {
  await connection.query("CREATE EXTENSION IF NOT EXISTS postgis");
  await connection.query("SET search_path = public, postgis, ag_catalog");
}
```

### 4. Custom Extensions

**Purpose**: Application-specific extensions and schemas

**Example**:
```typescript
async function initializeCustomExtension(connection: Connection): Promise<void> {
  // Create custom schema
  await connection.query("CREATE SCHEMA IF NOT EXISTS my_app");
  
  // Load custom functions
  await connection.query(`
    CREATE OR REPLACE FUNCTION my_app.custom_function()
    RETURNS TEXT AS $$
    BEGIN
      RETURN 'Custom functionality';
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Update search path
  await connection.query("SET search_path = my_app, ag_catalog, public");
}
```

## Configuration Patterns

### 1. Simple Extension Loading

```typescript
const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost/db',
  onConnectionCreate: async (connection) => {
    // Load required extensions
    await connection.query("LOAD 'age'");
    await connection.query("CREATE EXTENSION IF NOT EXISTS vector");
    
    // Set search path
    await connection.query("SET search_path = ag_catalog, vector, public");
  }
});
```

### 2. Conditional Extension Loading

```typescript
const client = new AgeSchemaClient({
  connectionString: '...',
  onConnectionCreate: async (connection) => {
    // Always load AGE
    await connection.query("LOAD 'age'");
    
    // Conditionally load other extensions
    if (process.env.ENABLE_VECTOR === 'true') {
      await connection.query("CREATE EXTENSION IF NOT EXISTS vector");
    }
    
    if (process.env.ENABLE_POSTGIS === 'true') {
      await connection.query("CREATE EXTENSION IF NOT EXISTS postgis");
    }
    
    // Build dynamic search path
    const searchPath = ['ag_catalog'];
    if (process.env.ENABLE_VECTOR === 'true') searchPath.push('vector');
    if (process.env.ENABLE_POSTGIS === 'true') searchPath.push('postgis');
    searchPath.push('public');
    
    await connection.query(`SET search_path = ${searchPath.join(', ')}`);
  }
});
```

### 3. Extension Factory Pattern

```typescript
interface ExtensionInitializer {
  name: string;
  initialize: (connection: Connection) => Promise<void>;
  dependencies?: string[];
}

class ExtensionManager {
  private extensions: Map<string, ExtensionInitializer> = new Map();
  
  register(extension: ExtensionInitializer): void {
    this.extensions.set(extension.name, extension);
  }
  
  async initializeAll(connection: Connection): Promise<void> {
    // Sort by dependencies
    const sorted = this.topologicalSort();
    
    for (const extension of sorted) {
      await extension.initialize(connection);
    }
  }
}

// Usage
const extensionManager = new ExtensionManager();

extensionManager.register({
  name: 'age',
  initialize: initializeAGE
});

extensionManager.register({
  name: 'vector',
  initialize: initializePgVector,
  dependencies: ['age']
});

const client = new AgeSchemaClient({
  connectionString: '...',
  onConnectionCreate: (connection) => extensionManager.initializeAll(connection)
});
```

## Advanced Patterns

### 1. Extension Configuration

```typescript
interface ExtensionConfig {
  age: {
    schemaName?: string;
    enableParameterFunctions?: boolean;
  };
  vector: {
    dimensions?: number;
    indexType?: 'ivfflat' | 'hnsw';
  };
  postgis: {
    enableRaster?: boolean;
    enableTopology?: boolean;
  };
}

const client = new AgeSchemaClient({
  connectionString: '...',
  extensions: {
    age: { schemaName: 'custom_age' },
    vector: { dimensions: 1536 },
    postgis: { enableRaster: true }
  },
  onConnectionCreate: async (connection, config) => {
    await initializeExtensions(connection, config.extensions);
  }
});
```

### 2. Extension Health Checks

```typescript
class ExtensionHealthChecker {
  async checkAGE(connection: Connection): Promise<boolean> {
    try {
      const result = await connection.query(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'cypher'
      `);
      return result.rows[0]?.age_available || false;
    } catch {
      return false;
    }
  }
  
  async checkVector(connection: Connection): Promise<boolean> {
    try {
      await connection.query("SELECT '[]'::vector");
      return true;
    } catch {
      return false;
    }
  }
  
  async checkAll(connection: Connection): Promise<Record<string, boolean>> {
    return {
      age: await this.checkAGE(connection),
      vector: await this.checkVector(connection),
      // Add more checks as needed
    };
  }
}
```

### 3. Extension Conflict Resolution

```typescript
class ExtensionConflictResolver {
  private searchPathPriority = ['ag_catalog', 'vector', 'postgis', 'public'];
  
  resolveSearchPath(enabledExtensions: string[]): string {
    const orderedPaths = this.searchPathPriority.filter(path => 
      enabledExtensions.includes(path) || path === 'public'
    );
    return orderedPaths.join(', ');
  }
  
  async resolveConflicts(connection: Connection, extensions: string[]): Promise<void> {
    // Handle function name conflicts
    if (extensions.includes('postgis') && extensions.includes('age')) {
      // PostGIS and AGE both have geometry functions
      await connection.query(`
        SET search_path = ag_catalog, postgis, public
      `);
    }
  }
}
```

## Error Handling

### 1. Extension Loading Errors

```typescript
class ExtensionError extends BaseError {
  constructor(
    extensionName: string, 
    message: string, 
    cause?: Error
  ) {
    super(
      ErrorCode.EXTENSION_ERROR, 
      `Extension '${extensionName}': ${message}`, 
      cause
    );
  }
}

async function safeExtensionLoad(
  connection: Connection, 
  extensionName: string
): Promise<boolean> {
  try {
    await connection.query(`CREATE EXTENSION IF NOT EXISTS ${extensionName}`);
    return true;
  } catch (error) {
    console.warn(`Failed to load extension ${extensionName}:`, error);
    return false;
  }
}
```

### 2. Graceful Degradation

```typescript
const client = new AgeSchemaClient({
  connectionString: '...',
  onConnectionCreate: async (connection) => {
    // AGE is required
    await connection.query("LOAD 'age'");
    
    // Other extensions are optional
    const vectorLoaded = await safeExtensionLoad(connection, 'vector');
    const postgisLoaded = await safeExtensionLoad(connection, 'postgis');
    
    // Build search path based on what loaded successfully
    const searchPath = ['ag_catalog'];
    if (vectorLoaded) searchPath.push('vector');
    if (postgisLoaded) searchPath.push('postgis');
    searchPath.push('public');
    
    await connection.query(`SET search_path = ${searchPath.join(', ')}`);
  }
});
```

## Testing Extensions

### 1. Extension Mocking

```typescript
class MockExtensionManager {
  private mockExtensions = new Set<string>();
  
  enableMock(extensionName: string): void {
    this.mockExtensions.add(extensionName);
  }
  
  async initialize(connection: Connection): Promise<void> {
    if (this.mockExtensions.has('vector')) {
      // Mock vector extension
      await connection.query(`
        CREATE OR REPLACE FUNCTION vector_similarity(a text, b text)
        RETURNS float AS $$ SELECT 0.5 $$ LANGUAGE sql;
      `);
    }
  }
}
```

### 2. Integration Testing

```typescript
describe('Extension System', () => {
  it('should load multiple extensions', async () => {
    const client = new AgeSchemaClient({
      connectionString: testConnectionString,
      onConnectionCreate: async (connection) => {
        await initializeAGE(connection);
        await initializePgVector(connection);
      }
    });
    
    await client.connect();
    
    // Test AGE functionality
    const ageResult = await client.query()
      .match('(n)')
      .return('count(n)')
      .execute();
    
    // Test vector functionality
    const vectorResult = await client.executeSQL(
      "SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector as distance"
    );
    
    expect(ageResult).toBeDefined();
    expect(vectorResult).toBeDefined();
  });
});
```

## Best Practices

### 1. Extension Ordering
- Load core extensions (AGE) first
- Load dependent extensions in dependency order
- Set search path after all extensions are loaded

### 2. Error Handling
- Use graceful degradation for optional extensions
- Provide clear error messages for required extensions
- Implement health checks for critical functionality

### 3. Performance
- Cache extension availability checks
- Minimize search path changes
- Use connection pooling for extension-heavy applications

### 4. Security
- Validate extension names before loading
- Use least-privilege principles for extension permissions
- Monitor extension usage and access patterns

This extension system provides a flexible foundation for integrating multiple PostgreSQL extensions while maintaining the core Apache AGE functionality.
