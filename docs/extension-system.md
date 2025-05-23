# Extension System

The ageSchemaClient library now includes a flexible extension system that allows you to initialize multiple PostgreSQL extensions and custom schemas when connections are created in the connection pool.

## Overview

The extension system provides:

- **Pluggable Architecture**: Add support for multiple PostgreSQL extensions (AGE, pgvector, PostGIS, etc.)
- **Custom Initializers**: Create your own extension initializers for custom schemas and functions
- **Backward Compatibility**: Existing code continues to work without changes
- **Connection Lifecycle Management**: Extensions are initialized on connection creation and cleaned up on release

## Built-in Extension Initializers

### AgeExtensionInitializer

The default extension initializer that loads Apache AGE and sets up the required infrastructure:

- Loads the AGE extension (`LOAD 'age'`)
- Sets the search path to include `ag_catalog`
- Creates the `age_params` temporary table
- Initializes AGE-specific functions in the `age_schema_client` schema

### PgVectorExtensionInitializer

Initializes the pgvector extension for vector similarity search:

- Creates the `vector` extension if it doesn't exist
- Enables vector data types and operations

### PostGISExtensionInitializer

Initializes the PostGIS extension for spatial data support:

- Creates the `postgis` extension if it doesn't exist
- Enables spatial data types and functions

### SearchPathInitializer

Adds additional schemas to the PostgreSQL search path:

- Takes an array of schema names to add to the search path
- Useful for custom application schemas

## Usage Examples

### Default Behavior (Backward Compatible)

```typescript
import { PgConnectionManager } from 'age-schema-client';

// Creates connection manager with default AGE extension
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'my-app',
  },
});
```

### Multiple Extensions

```typescript
import {
  PgConnectionManager,
  AgeExtensionInitializer,
  PgVectorExtensionInitializer,
  PostGISExtensionInitializer,
  SearchPathInitializer,
} from 'age-schema-client';

const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  // Specify multiple extensions
  extensions: [
    new AgeExtensionInitializer(),
    new PgVectorExtensionInitializer(),
    new PostGISExtensionInitializer(),
    new SearchPathInitializer(['my_schema', 'analytics']),
  ],
  pgOptions: {
    searchPath: 'ag_catalog, "$user", public',
    applicationName: 'multi-extension-app',
  },
});
```

### Custom Extension Initializer

```typescript
import { ExtensionInitializer } from 'age-schema-client';
import { PoolClient } from 'pg';

class CustomSchemaInitializer implements ExtensionInitializer {
  readonly name = 'Custom Schema';
  private schemaName: string;

  constructor(schemaName: string) {
    this.schemaName = schemaName;
  }

  async initialize(client: PoolClient): Promise<void> {
    // Create custom schema and tables
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.schemaName}`);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${this.schemaName}.app_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async cleanup(client: PoolClient): Promise<void> {
    // Clean up temporary data
    await client.query(`
      DELETE FROM ${this.schemaName}.app_config 
      WHERE key LIKE 'temp_%'
    `);
  }
}

// Use the custom initializer
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  extensions: [
    new AgeExtensionInitializer(),
    new CustomSchemaInitializer('my_app'),
  ],
  pgOptions: {
    searchPath: 'ag_catalog, my_app, "$user", public',
    applicationName: 'custom-app',
  },
});
```

## ExtensionInitializer Interface

```typescript
interface ExtensionInitializer {
  /**
   * The name of the extension (for logging and identification)
   */
  readonly name: string;

  /**
   * Initialize the extension on a new connection
   */
  initialize(client: PoolClient, config: ConnectionConfig): Promise<void>;

  /**
   * Optional cleanup when connection is released
   */
  cleanup?(client: PoolClient, config: ConnectionConfig): Promise<void>;
}
```

## Connection Lifecycle

1. **Connection Creation**: When a new connection is created in the pool:
   - The `connect` event is triggered
   - Each extension's `initialize()` method is called in order
   - Extensions can set up schemas, tables, functions, etc.

2. **Connection Usage**: The connection is available for normal use with all extensions initialized

3. **Connection Release**: When a connection is released back to the pool:
   - Each extension's `cleanup()` method is called (if defined)
   - Extensions can clean up temporary data, reset state, etc.
   - The connection is returned to the pool for reuse

## Error Handling

- If an extension fails to initialize, an error is logged but the connection process continues
- Other extensions will still be initialized
- The connection will still be available for use
- This ensures that optional extensions don't break the core functionality

## Best Practices

1. **Keep Extensions Lightweight**: Extension initialization happens on every new connection, so keep the setup minimal

2. **Use Cleanup Wisely**: Only implement cleanup if you need to reset state between connection uses

3. **Handle Errors Gracefully**: Extensions should handle their own errors and not throw unless critical

4. **Order Matters**: Extensions are initialized in the order they're specified in the array

5. **Schema Dependencies**: If your custom extension depends on another extension's schema, make sure to order them correctly

## Migration from Previous Versions

The extension system is fully backward compatible. Existing code will continue to work without any changes:

- If no `extensions` array is provided, the default `AgeExtensionInitializer` is used
- All existing AGE functionality remains the same
- The `age_params` table and AGE functions are still created automatically

## Troubleshooting

### Extension Not Initializing

Check the console logs for "Initializing extension: [Extension Name]" messages. If you don't see your extension being initialized:

1. Verify the extension is included in the `extensions` array
2. Check that the extension's `initialize()` method doesn't throw errors
3. Ensure the database user has permissions to create the required objects

### Connection Errors

If connections fail after adding extensions:

1. Check that all required PostgreSQL extensions are installed
2. Verify database permissions for creating schemas/tables
3. Review the extension initialization code for syntax errors

### Performance Issues

If connection creation becomes slow:

1. Minimize work done in extension initializers
2. Consider moving heavy setup to application startup instead of per-connection
3. Use connection pooling effectively to reuse initialized connections
