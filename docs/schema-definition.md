# Schema Definition

The schema definition is the foundation of the Apache AGE Schema Client. It defines the structure of your graph database, including vertex labels, edge labels, properties, and constraints.

## Basic Structure

A schema definition consists of:

- **Vertices**: The nodes in your graph
- **Edges**: The relationships between nodes
- **Properties**: The attributes of vertices and edges
- **Constraints**: Rules that properties must follow

Here's a basic example:

```typescript
const schema = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' }
      },
      required: ['name', 'email']
    },
    Movie: {
      properties: {
        title: { type: 'string' },
        year: { type: 'integer' },
        genre: { type: 'string' }
      },
      required: ['title']
    }
  },
  edges: {
    ACTED_IN: {
      properties: {
        role: { type: 'string' },
        salary: { type: 'number' }
      },
      fromVertex: 'Person',
      toVertex: 'Movie',
      required: ['role']
    },
    DIRECTED: {
      properties: {
        year: { type: 'integer' }
      },
      fromVertex: 'Person',
      toVertex: 'Movie'
    }
  }
};
```

## Vertex Definition

A vertex definition includes:

- **Properties**: The attributes of the vertex
- **Required Properties**: Properties that must be provided when creating a vertex

```typescript
const personVertex = {
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
    email: { type: 'string' }
  },
  required: ['name', 'email']
};
```

## Edge Definition

An edge definition includes:

- **Properties**: The attributes of the edge
- **Required Properties**: Properties that must be provided when creating an edge
- **From Vertex**: The vertex label that this edge can start from
- **To Vertex**: The vertex label that this edge can point to
- **Multiplicity** (optional): The cardinality of the relationship (one-to-one, one-to-many, etc.)
- **Direction** (optional): The direction of the relationship (outgoing, incoming, or both)

```typescript
const actedInEdge = {
  properties: {
    role: { type: 'string' },
    salary: { type: 'number' }
  },
  fromVertex: 'Person',
  toVertex: 'Movie',
  required: ['role'],
  multiplicity: 'many-to-many', // Optional
  direction: 'outgoing' // Optional
};
```

## Property Types

The following property types are supported:

- `string`: Text values
- `integer`: Whole numbers
- `number`: Decimal numbers
- `boolean`: True/false values
- `date`: Date values
- `datetime`: Date and time values
- `array`: Arrays of values
- `object`: Nested objects
- `any`: Any type of value

## Property Constraints

You can add constraints to properties to enforce data validation:

### String Constraints

```typescript
const emailProperty = {
  type: 'string',
  stringConstraints: {
    minLength: 5,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    format: 'email'
  }
};
```

### Number Constraints

```typescript
const ageProperty = {
  type: 'integer',
  numberConstraints: {
    minimum: 0,
    maximum: 120,
    exclusiveMinimum: true,
    exclusiveMaximum: false,
    multipleOf: 1
  }
};
```

### Array Constraints

```typescript
const tagsProperty = {
  type: 'array',
  items: { type: 'string' },
  arrayConstraints: {
    minItems: 1,
    maxItems: 10,
    uniqueItems: true
  }
};
```

### Object Constraints

```typescript
const addressProperty = {
  type: 'object',
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
    zipCode: { type: 'string' }
  },
  objectConstraints: {
    required: ['street', 'city'],
    additionalProperties: false
  }
};
```

## Schema Validation

The schema is validated when you create a `SQLGenerator` or when you explicitly call the schema validator:

```typescript
import { validateSchema } from 'age-schema-client';

// Validate the schema
const validationResult = validateSchema(schema);

if (!validationResult.valid) {
  console.error('Schema validation failed:', validationResult.errors);
} else {
  console.log('Schema is valid');
}
```

## Type Safety

The schema definition provides type safety throughout the library. When you define a schema, TypeScript will enforce type checking for all operations:

```typescript
// This will type-check
const person = await vertexOperations.createVertex('Person', {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
});

// This will cause a TypeScript error
const invalidPerson = await vertexOperations.createVertex('Person', {
  name: 'John Doe',
  age: 'thirty' // Type error: 'thirty' is not assignable to type 'number'
});
```

## Next Steps

- [Vertex Operations](./vertex-operations.md)
- [Edge Operations](./edge-operations.md)
- [Schema Evolution](./schema-evolution.md)
