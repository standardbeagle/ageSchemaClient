# Schema Validation

Ensure data integrity with comprehensive schema validation.

## Defining Schemas

```typescript
const schema = client.schema();

await schema.define({
  vertices: {
    Person: {
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'number', minimum: 0 },
        email: { type: 'string', format: 'email' }
      }
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'string', format: 'date' },
        relationship: { type: 'string', enum: ['friend', 'colleague', 'family'] }
      }
    }
  }
});
```

## Validating Data

```typescript
const isValid = await schema.validate({
  vertices: [
    { label: 'Person', properties: { name: 'Alice', age: 30 } }
  ],
  edges: []
});
```

## Schema Migrations

```typescript
await schema.migrate({
  version: '2.0.0',
  up: async () => {
    // Migration logic
  },
  down: async () => {
    // Rollback logic
  }
});
```

## Error Handling

Comprehensive error reporting for validation failures.
