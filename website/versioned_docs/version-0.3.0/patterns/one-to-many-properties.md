# One-to-Many Property Relationships

One-to-many property relationships model scenarios where entities have multiple attributes or properties that can't be efficiently stored as simple vertex properties. This pattern is ideal for user preferences, product specifications, contact information, and any flexible attribute system.

## Pattern Overview

### Key Characteristics
- **Flexible Attributes**: Support for dynamic property sets
- **Typed Properties**: Different property types (string, number, boolean, etc.)
- **Versioning**: Track property changes over time
- **Validation**: Property-specific validation rules
- **Grouping**: Organize properties into logical groups

### Common Use Cases
- User preferences and settings
- Product attributes and specifications
- Contact information (multiple emails, phones)
- Configuration parameters
- Metadata and tags
- Custom fields and extensions

## Schema Definition

### Basic Property Schema

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const propertySchema = {
  vertices: {
    User: {
      properties: {
        id: { type: 'string', required: true },
        username: { type: 'string', required: true },
        email: { type: 'string', required: true },
        created_at: { type: 'string' },
        status: { type: 'string', default: 'active' }
      },
      required: ['id', 'username', 'email']
    },
    Property: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        value: { type: 'string', required: true },
        data_type: { type: 'string', required: true }, // 'string', 'number', 'boolean', 'json'
        category: { type: 'string' },
        description: { type: 'string' },
        is_public: { type: 'boolean', default: false },
        is_required: { type: 'boolean', default: false },
        validation_rules: { type: 'string' }, // JSON validation rules
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      },
      required: ['id', 'name', 'value', 'data_type']
    },
    PropertyDefinition: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        data_type: { type: 'string', required: true },
        category: { type: 'string' },
        description: { type: 'string' },
        default_value: { type: 'string' },
        validation_rules: { type: 'string' },
        is_required: { type: 'boolean', default: false },
        is_system: { type: 'boolean', default: false },
        sort_order: { type: 'number' }
      },
      required: ['id', 'name', 'data_type']
    },
    Product: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        sku: { type: 'string', required: true },
        category: { type: 'string' },
        price: { type: 'number' },
        status: { type: 'string', default: 'active' }
      },
      required: ['id', 'name', 'sku']
    }
  },
  edges: {
    HAS_PROPERTY: {
      from: 'User',
      to: 'Property',
      properties: {
        created_at: { type: 'string' },
        created_by: { type: 'string' },
        is_inherited: { type: 'boolean', default: false },
        source: { type: 'string' } // e.g., 'user_input', 'system', 'import'
      }
    },
    HAS_ATTRIBUTE: {
      from: 'Product',
      to: 'Property',
      properties: {
        display_order: { type: 'number' },
        is_searchable: { type: 'boolean', default: true },
        is_filterable: { type: 'boolean', default: true },
        created_at: { type: 'string' }
      }
    },
    DEFINED_BY: {
      from: 'Property',
      to: 'PropertyDefinition',
      properties: {
        version: { type: 'string' },
        created_at: { type: 'string' }
      }
    },
    INHERITS_FROM: {
      from: 'PropertyDefinition',
      to: 'PropertyDefinition',
      properties: {
        inheritance_type: { type: 'string' }, // 'extends', 'overrides'
        created_at: { type: 'string' }
      }
    }
  }
};
```

### Contact Information Schema

```typescript
const contactSchema = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'string', required: true },
        first_name: { type: 'string', required: true },
        last_name: { type: 'string', required: true },
        title: { type: 'string' },
        company: { type: 'string' }
      },
      required: ['id', 'first_name', 'last_name']
    },
    ContactInfo: {
      properties: {
        id: { type: 'string', required: true },
        type: { type: 'string', required: true }, // 'email', 'phone', 'address', 'social'
        value: { type: 'string', required: true },
        label: { type: 'string' }, // 'home', 'work', 'mobile', 'primary'
        is_primary: { type: 'boolean', default: false },
        is_verified: { type: 'boolean', default: false },
        country_code: { type: 'string' }, // for phone numbers
        extension: { type: 'string' }, // for phone numbers
        created_at: { type: 'string' },
        verified_at: { type: 'string' }
      },
      required: ['id', 'type', 'value']
    }
  },
  edges: {
    HAS_CONTACT: {
      from: 'Person',
      to: 'ContactInfo',
      properties: {
        priority: { type: 'number' },
        notes: { type: 'string' },
        created_at: { type: 'string' },
        last_used: { type: 'string' }
      }
    }
  }
};
```

## Bulk Loading Examples

### User Preferences Data

```typescript
const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'user_properties'
});

await client.loadSchema(propertySchema);

// User preferences and properties data
const userPropertiesData = {
  vertices: [
    // Users
    { label: 'User', properties: {
      id: 'user-001', username: 'alice_smith', email: 'alice@example.com',
      created_at: '2024-01-15T10:00:00Z', status: 'active'
    }},
    { label: 'User', properties: {
      id: 'user-002', username: 'bob_jones', email: 'bob@example.com',
      created_at: '2024-01-20T14:30:00Z', status: 'active'
    }},

    // Property Definitions
    { label: 'PropertyDefinition', properties: {
      id: 'prop-def-001', name: 'theme', data_type: 'string',
      category: 'ui', description: 'UI theme preference',
      default_value: 'light', validation_rules: '{"enum": ["light", "dark", "auto"]}',
      sort_order: 1
    }},
    { label: 'PropertyDefinition', properties: {
      id: 'prop-def-002', name: 'language', data_type: 'string',
      category: 'localization', description: 'Preferred language',
      default_value: 'en', validation_rules: '{"pattern": "^[a-z]{2}$"}',
      sort_order: 2
    }},
    { label: 'PropertyDefinition', properties: {
      id: 'prop-def-003', name: 'notifications_enabled', data_type: 'boolean',
      category: 'notifications', description: 'Enable email notifications',
      default_value: 'true', is_required: true, sort_order: 3
    }},
    { label: 'PropertyDefinition', properties: {
      id: 'prop-def-004', name: 'max_items_per_page', data_type: 'number',
      category: 'ui', description: 'Items per page in lists',
      default_value: '25', validation_rules: '{"minimum": 10, "maximum": 100}',
      sort_order: 4
    }},

    // User Properties (actual values)
    { label: 'Property', properties: {
      id: 'prop-001', name: 'theme', value: 'dark', data_type: 'string',
      category: 'ui', is_public: false, created_at: '2024-01-15T10:05:00Z'
    }},
    { label: 'Property', properties: {
      id: 'prop-002', name: 'language', value: 'en', data_type: 'string',
      category: 'localization', is_public: true, created_at: '2024-01-15T10:05:00Z'
    }},
    { label: 'Property', properties: {
      id: 'prop-003', name: 'notifications_enabled', value: 'true', data_type: 'boolean',
      category: 'notifications', is_public: false, created_at: '2024-01-15T10:05:00Z'
    }},
    { label: 'Property', properties: {
      id: 'prop-004', name: 'max_items_per_page', value: '50', data_type: 'number',
      category: 'ui', is_public: false, created_at: '2024-01-15T10:05:00Z'
    }},

    // Bob's properties (different values)
    { label: 'Property', properties: {
      id: 'prop-005', name: 'theme', value: 'light', data_type: 'string',
      category: 'ui', is_public: false, created_at: '2024-01-20T14:35:00Z'
    }},
    { label: 'Property', properties: {
      id: 'prop-006', name: 'language', value: 'es', data_type: 'string',
      category: 'localization', is_public: true, created_at: '2024-01-20T14:35:00Z'
    }},
    { label: 'Property', properties: {
      id: 'prop-007', name: 'notifications_enabled', value: 'false', data_type: 'boolean',
      category: 'notifications', is_public: false, created_at: '2024-01-20T14:35:00Z'
    }}
  ],
  edges: [
    // Alice's properties
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-001' } },
      to: { label: 'Property', properties: { id: 'prop-001' } },
      properties: { created_at: '2024-01-15T10:05:00Z', source: 'user_input' }
    },
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-001' } },
      to: { label: 'Property', properties: { id: 'prop-002' } },
      properties: { created_at: '2024-01-15T10:05:00Z', source: 'system' }
    },
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-001' } },
      to: { label: 'Property', properties: { id: 'prop-003' } },
      properties: { created_at: '2024-01-15T10:05:00Z', source: 'system' }
    },
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-001' } },
      to: { label: 'Property', properties: { id: 'prop-004' } },
      properties: { created_at: '2024-01-15T10:05:00Z', source: 'user_input' }
    },

    // Bob's properties
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-002' } },
      to: { label: 'Property', properties: { id: 'prop-005' } },
      properties: { created_at: '2024-01-20T14:35:00Z', source: 'user_input' }
    },
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-002' } },
      to: { label: 'Property', properties: { id: 'prop-006' } },
      properties: { created_at: '2024-01-20T14:35:00Z', source: 'user_input' }
    },
    { label: 'HAS_PROPERTY',
      from: { label: 'User', properties: { id: 'user-002' } },
      to: { label: 'Property', properties: { id: 'prop-007' } },
      properties: { created_at: '2024-01-20T14:35:00Z', source: 'user_input' }
    },

    // Property definitions
    { label: 'DEFINED_BY',
      from: { label: 'Property', properties: { id: 'prop-001' } },
      to: { label: 'PropertyDefinition', properties: { id: 'prop-def-001' } },
      properties: { version: '1.0', created_at: '2024-01-15T10:05:00Z' }
    },
    { label: 'DEFINED_BY',
      from: { label: 'Property', properties: { id: 'prop-002' } },
      to: { label: 'PropertyDefinition', properties: { id: 'prop-def-002' } },
      properties: { version: '1.0', created_at: '2024-01-15T10:05:00Z' }
    },
    { label: 'DEFINED_BY',
      from: { label: 'Property', properties: { id: 'prop-005' } },
      to: { label: 'PropertyDefinition', properties: { id: 'prop-def-001' } },
      properties: { version: '1.0', created_at: '2024-01-20T14:35:00Z' }
    }
  ]
};

// Load the user properties data
const batchLoader = client.createBatchLoader();
await batchLoader.load(userPropertiesData);
```

## Common Query Patterns

### 1. Get All User Properties

```typescript
// Get all properties for a specific user
const userProperties = await client.query()
  .match('User', 'user')
  .where({ 'user.id': 'user-001' })
  .match('user', 'HAS_PROPERTY', 'property')
  .return([
    'property.name',
    'property.value',
    'property.data_type',
    'property.category'
  ])
  .orderBy('property.category')
  .execute();
```

### 2. Get Properties by Category

```typescript
// Get UI-related properties for a user
const uiProperties = await client.query()
  .match('User', 'user')
  .where({ 'user.id': 'user-001' })
  .match('user', 'HAS_PROPERTY', 'property')
  .where({ 'property.category': 'ui' })
  .return([
    'property.name',
    'property.value',
    'property.data_type'
  ])
  .execute();
```

### 3. Property Validation Query

```typescript
// Get property with its definition for validation
const propertyWithDefinition = await client.query()
  .match('User', 'user')
  .where({ 'user.id': 'user-001' })
  .match('user', 'HAS_PROPERTY', 'property')
  .match('property', 'DEFINED_BY', 'definition')
  .return([
    'property.name',
    'property.value',
    'property.data_type',
    'definition.validation_rules',
    'definition.default_value'
  ])
  .execute();
```

### 4. Find Users by Property Value

```typescript
// Find all users with dark theme preference
const darkThemeUsers = await client.query()
  .match('User', 'user')
  .match('user', 'HAS_PROPERTY', 'property')
  .where({
    'property.name': 'theme',
    'property.value': 'dark'
  })
  .return(['user.username', 'user.email'])
  .execute();
```

### 5. Property Usage Statistics

```typescript
// Get statistics on property usage
const propertyStats = await client.query()
  .match('PropertyDefinition', 'definition')
  .match('(property:Property)-[:DEFINED_BY]->(definition)')
  .match('(user:User)-[:HAS_PROPERTY]->(property)')
  .with('definition.name as property_name, collect(property.value) as values, count(user) as user_count')
  .return([
    'property_name',
    'user_count',
    'size(apoc.coll.toSet(values)) as unique_values',
    'values'
  ])
  .orderBy('user_count DESC')
  .execute();
```

### 6. Contact Information Queries

```typescript
// Get all contact information for a person
const contactInfo = await client.query()
  .match('Person', 'person')
  .where({ 'person.id': 'person-001' })
  .match('person', 'HAS_CONTACT', 'contact', 'has_contact_rel')
  .return([
    'contact.type',
    'contact.value',
    'contact.label',
    'contact.is_primary',
    'has_contact_rel.priority'
  ])
  .orderBy(['contact.type', 'has_contact_rel.priority'])
  .execute();
```

### 7. Primary Contact Information

```typescript
// Get primary contact information by type
const primaryContacts = await client.query()
  .match('Person', 'person')
  .where({ 'person.id': 'person-001' })
  .match('person', 'HAS_CONTACT', 'contact')
  .where({ 'contact.is_primary': true })
  .return([
    'contact.type',
    'contact.value',
    'contact.label'
  ])
  .execute();
```

## Performance Optimization

### 1. Property Indexing

```typescript
// Create indexes for property queries
await client.executeSQL(`
  CREATE INDEX IF NOT EXISTS idx_property_name_value
  ON ag_catalog.property_vertex USING btree ((properties->>'name'), (properties->>'value'));

  CREATE INDEX IF NOT EXISTS idx_property_category
  ON ag_catalog.property_vertex USING btree ((properties->>'category'));

  CREATE INDEX IF NOT EXISTS idx_contact_type_primary
  ON ag_catalog.contactinfo_vertex USING btree ((properties->>'type'), ((properties->>'is_primary')::boolean));
`);
```

### 2. Property Caching Strategy

```typescript
// Cache frequently accessed properties
const propertyCache = {
  vertices: {
    UserPropertyCache: {
      properties: {
        user_id: { type: 'string', required: true },
        properties_json: { type: 'string', required: true }, // JSON blob of all properties
        last_updated: { type: 'string', required: true },
        cache_version: { type: 'string', default: '1.0' }
      }
    }
  }
};
```

## Best Practices

### 1. Property Definition Management
- Define property schemas before creating instances
- Use consistent naming conventions
- Implement proper validation rules
- Version property definitions

### 2. Data Type Handling
- Store all values as strings with type metadata
- Implement proper type conversion in application layer
- Validate data types before storage
- Handle null and undefined values consistently

### 3. Performance Considerations
- Index frequently queried properties
- Consider denormalization for read-heavy scenarios
- Use property categories for efficient filtering
- Implement caching for static properties

### 4. Schema Evolution
- Support property definition versioning
- Implement migration strategies for property changes
- Maintain backward compatibility
- Track property usage for cleanup

## Next Steps

- [Parent-Child Relationships](./parent-child) - For hierarchical structures
- [Product-Part Relationships](./product-part) - For component hierarchies
- [Schema Validation](../how-to-guides/schema-validation) - Property validation techniques