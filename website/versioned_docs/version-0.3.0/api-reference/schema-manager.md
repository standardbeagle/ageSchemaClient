# SchemaManager

Schema validation and management for graph databases.

## Overview

```typescript
const schema = client.schema();

await schema.validate(graphData);
```

## Methods

### validate(data: GraphData)

Validate graph data against schema.

### define(schema: SchemaDefinition)

Define a new schema.

### migrate(migration: Migration)

Apply schema migrations.

## Examples

See [Schema Validation](../how-to-guides/schema-validation) for detailed examples.
