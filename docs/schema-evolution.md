# Schema Evolution

The Schema Evolution module provides tools for managing schema changes over time. It includes features for comparing schemas, creating migration plans, and executing migrations.

## Overview

As your application evolves, your graph schema will need to change. The Schema Evolution module helps you:

- Compare two schemas to identify changes
- Determine if changes are breaking or non-breaking
- Create a migration plan to update the database schema
- Execute migrations with safety features like backups
- Manage schema versioning

## Schema Comparison

To compare two schemas and identify changes:

```typescript
import { compareSchemas } from 'age-schema-client';

// Original schema
const originalSchema = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' }
      },
      required: ['name']
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'date' }
      },
      fromVertex: 'Person',
      toVertex: 'Person'
    }
  }
};

// Updated schema
const updatedSchema = {
  version: '1.1.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' } // Added property
      },
      required: ['name', 'email'] // Added required property
    },
    Company: { // Added vertex
      properties: {
        name: { type: 'string' },
        founded: { type: 'date' }
      },
      required: ['name']
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'date' },
        strength: { type: 'integer' } // Added property
      },
      fromVertex: 'Person',
      toVertex: 'Person'
    },
    WORKS_AT: { // Added edge
      properties: {
        since: { type: 'date' },
        position: { type: 'string' }
      },
      fromVertex: 'Person',
      toVertex: 'Company',
      required: ['position']
    }
  }
};

// Compare schemas
const changes = compareSchemas(originalSchema, updatedSchema);

// Print changes
for (const change of changes) {
  console.log(`${change.type} ${change.path} (breaking: ${change.breaking})`);
}
```

## Migration Planning

To create a migration plan:

```typescript
import { 
  PgConnectionManager, 
  QueryExecutor, 
  SQLGenerator,
  SchemaMigrationExecutor 
} from 'age-schema-client';

// Create a connection
const connectionManager = new PgConnectionManager({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// Get a connection from the pool
const connection = await connectionManager.getConnection();

// Create a query executor
const queryExecutor = new QueryExecutor(connection);

// Create a SQL generator
const sqlGenerator = new SQLGenerator(originalSchema);

// Create a migration executor
const migrationExecutor = new SchemaMigrationExecutor(queryExecutor, sqlGenerator);

// Create a migration plan
const plan = migrationExecutor.createMigrationPlan(originalSchema, updatedSchema, {
  allowDataLoss: false // Whether to allow changes that can cause data loss
});

// Print migration steps
for (const step of plan.steps) {
  console.log(`${step.description}`);
  console.log(`SQL: ${step.sql}`);
  console.log(`Can cause data loss: ${step.canCauseDataLoss}`);
}
```

## Executing Migrations

To execute a migration plan:

```typescript
// Execute the migration plan
const result = await migrationExecutor.executeMigrationPlan(plan, {
  execute: true, // Whether to actually execute the migration
  allowDataLoss: false, // Whether to allow changes that can cause data loss
  createBackup: true, // Whether to create a backup before migration
  logMigration: true // Whether to log migration steps
});

if (result.success) {
  console.log(`Migration successful! Executed ${result.executedSteps} of ${result.totalSteps} steps.`);
} else {
  console.error(`Migration failed: ${result.error}`);
  console.log(`Executed ${result.executedSteps} of ${result.totalSteps} steps before failure.`);
}
```

## Migration Options

The migration executor accepts the following options:

```typescript
interface MigrationOptions {
  /**
   * Whether to allow data loss
   * @default false
   */
  allowDataLoss?: boolean;
  
  /**
   * Whether to execute the migration
   * @default false
   */
  execute?: boolean;
  
  /**
   * Whether to create a backup before migration
   * @default true
   */
  createBackup?: boolean;
  
  /**
   * Whether to log migration steps
   * @default true
   */
  logMigration?: boolean;
}
```

## Schema Versioning

The schema definition includes a version field that follows semantic versioning:

```typescript
const schema = {
  version: '1.0.0',
  vertices: { /* ... */ },
  edges: { /* ... */ }
};
```

When migrating schemas, the version is automatically updated based on the changes:

- **Major version** (1.x.x): Incremented for breaking changes
- **Minor version** (x.1.x): Incremented for non-breaking additions
- **Patch version** (x.x.1): Incremented for non-breaking modifications

## Breaking vs. Non-Breaking Changes

The following changes are considered breaking:

- Removing a vertex label
- Removing an edge label
- Removing a required property
- Adding a required property
- Changing a property type
- Changing vertex type constraints for edges

The following changes are considered non-breaking:

- Adding a vertex label
- Adding an edge label
- Adding an optional property
- Removing an optional property
- Making a required property optional

## Database Backup

Before executing a migration, the migration executor can create a backup of the affected tables:

```typescript
// Create a backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
const backupSQL = `
  CREATE SCHEMA IF NOT EXISTS backup;
  
  -- Create backup tables for vertices
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'v_%')
    LOOP
      EXECUTE 'CREATE TABLE backup.' || r.table_name || '_${timestamp} AS SELECT * FROM public.' || r.table_name;
    END LOOP;
  END $$;
  
  -- Create backup tables for edges
  DO $$
  DECLARE
    r RECORD;
  BEGIN
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'e_%')
    LOOP
      EXECUTE 'CREATE TABLE backup.' || r.table_name || '_${timestamp} AS SELECT * FROM public.' || r.table_name;
    END LOOP;
  END $$;
`;
```

## Example

Here's a complete example of schema evolution:

```typescript
// Original schema
const originalSchema = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['name'],
    },
    Product: {
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        description: { type: 'string' },
      },
      required: ['name', 'price'],
    },
  },
  edges: {
    PURCHASED: {
      properties: {
        date: { type: 'date' },
        quantity: { type: 'integer' },
      },
      fromVertex: 'Person',
      toVertex: 'Product',
      required: ['date'],
    },
  },
};

// Updated schema
const updatedSchema = {
  version: '1.1.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        active: { type: 'boolean' },
        email: { type: 'string' }, // Added property
      },
      required: ['name', 'email'], // Added required property
    },
    Product: {
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        description: { type: 'string' },
        category: { type: 'string' }, // Added property
        inStock: { type: 'boolean' }, // Added property
      },
      required: ['name', 'price'],
    },
    Supplier: { // Added vertex
      properties: {
        name: { type: 'string' },
        address: { type: 'string' },
        contact: { type: 'string' },
      },
      required: ['name'],
    },
  },
  edges: {
    PURCHASED: {
      properties: {
        date: { type: 'date' },
        quantity: { type: 'integer' },
        totalPrice: { type: 'number' }, // Added property
      },
      fromVertex: 'Person',
      toVertex: 'Product',
      required: ['date'],
    },
    SUPPLIES: { // Added edge
      properties: {
        since: { type: 'date' },
        contract: { type: 'string' },
      },
      fromVertex: 'Supplier',
      toVertex: 'Product',
      required: ['since'],
    },
  },
};

// Compare schemas
const changes = compareSchemas(originalSchema, updatedSchema);
console.log(`Found ${changes.length} changes`);

// Create migration plan
const plan = migrationExecutor.createMigrationPlan(originalSchema, updatedSchema, {
  allowDataLoss: true,
});

// Execute migration
const result = await migrationExecutor.executeMigrationPlan(plan, {
  execute: true,
  allowDataLoss: true,
  createBackup: true,
  logMigration: true,
});

if (result.success) {
  console.log('Migration successful!');
} else {
  console.error(`Migration failed: ${result.error}`);
}
```

## Next Steps

- [Error Handling](./error-handling.md)
- [API Reference](./api-reference.md)
