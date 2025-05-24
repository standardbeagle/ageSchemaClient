# Parent-Child Relationship Patterns

Parent-child relationships are fundamental hierarchical patterns where entities have clear parent-child relationships forming tree-like structures. This pattern is ideal for organizational charts, category taxonomies, file systems, and any data with natural hierarchies.

## Pattern Overview

### Key Characteristics
- **Single Parent**: Each child has at most one parent
- **Multiple Children**: Parents can have multiple children
- **Tree Structure**: Forms a directed acyclic graph (DAG) or tree
- **Hierarchical Queries**: Supports ancestor/descendant traversals

### Common Use Cases
- Organizational hierarchies (employees and managers)
- Category and subcategory systems
- File and folder structures
- Geographic regions (country → state → city)
- Comment threads and replies

## Schema Definition

### Basic Parent-Child Schema

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const hierarchySchema = {
  vertices: {
    Employee: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        title: { type: 'string', required: true },
        department: { type: 'string' },
        email: { type: 'string' },
        hire_date: { type: 'string' },
        salary: { type: 'number' },
        active: { type: 'boolean', default: true }
      },
      required: ['id', 'name', 'title']
    }
  },
  edges: {
    REPORTS_TO: {
      from: 'Employee',
      to: 'Employee',
      properties: {
        since: { type: 'string' },
        direct: { type: 'boolean', default: true },
        relationship_type: { type: 'string', default: 'reports_to' }
      }
    },
    MANAGES: {
      from: 'Employee',
      to: 'Employee',
      properties: {
        since: { type: 'string' },
        span_of_control: { type: 'number' },
        management_level: { type: 'number' }
      }
    }
  }
};
```

### Category Hierarchy Schema

```typescript
const categorySchema = {
  vertices: {
    Category: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        level: { type: 'number' },
        sort_order: { type: 'number' },
        active: { type: 'boolean', default: true },
        created_at: { type: 'string' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    PARENT_OF: {
      from: 'Category',
      to: 'Category',
      properties: {
        order: { type: 'number' },
        created_at: { type: 'string' }
      }
    }
  }
};
```

## Bulk Loading Examples

### Organizational Chart Data

```typescript
const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'org_chart'
});

await client.loadSchema(hierarchySchema);

// Organizational hierarchy data
const orgData = {
  vertices: [
    // C-Level
    { label: 'Employee', properties: {
      id: 'ceo-001', name: 'Sarah Chen', title: 'CEO',
      department: 'Executive', salary: 250000, hire_date: '2018-01-15'
    }},

    // VPs
    { label: 'Employee', properties: {
      id: 'vp-eng-001', name: 'Michael Rodriguez', title: 'VP Engineering',
      department: 'Engineering', salary: 180000, hire_date: '2019-03-01'
    }},
    { label: 'Employee', properties: {
      id: 'vp-sales-001', name: 'Jennifer Kim', title: 'VP Sales',
      department: 'Sales', salary: 175000, hire_date: '2019-06-15'
    }},

    // Directors
    { label: 'Employee', properties: {
      id: 'dir-backend-001', name: 'David Thompson', title: 'Director Backend',
      department: 'Engineering', salary: 150000, hire_date: '2020-01-10'
    }},
    { label: 'Employee', properties: {
      id: 'dir-frontend-001', name: 'Lisa Wang', title: 'Director Frontend',
      department: 'Engineering', salary: 145000, hire_date: '2020-02-01'
    }},

    // Managers
    { label: 'Employee', properties: {
      id: 'mgr-api-001', name: 'Robert Johnson', title: 'API Team Manager',
      department: 'Engineering', salary: 120000, hire_date: '2020-08-15'
    }},
    { label: 'Employee', properties: {
      id: 'mgr-ui-001', name: 'Emily Davis', title: 'UI Team Manager',
      department: 'Engineering', salary: 115000, hire_date: '2021-01-20'
    }},

    // Individual Contributors
    { label: 'Employee', properties: {
      id: 'dev-001', name: 'Alex Martinez', title: 'Senior Developer',
      department: 'Engineering', salary: 95000, hire_date: '2021-06-01'
    }},
    { label: 'Employee', properties: {
      id: 'dev-002', name: 'Priya Patel', title: 'Frontend Developer',
      department: 'Engineering', salary: 85000, hire_date: '2022-03-15'
    }}
  ],
  edges: [
    // CEO relationships
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'ceo-001' } },
      to: { label: 'Employee', properties: { id: 'vp-eng-001' } },
      properties: { since: '2019-03-01', management_level: 1 }
    },
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'ceo-001' } },
      to: { label: 'Employee', properties: { id: 'vp-sales-001' } },
      properties: { since: '2019-06-15', management_level: 1 }
    },

    // VP to Director relationships
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'vp-eng-001' } },
      to: { label: 'Employee', properties: { id: 'dir-backend-001' } },
      properties: { since: '2020-01-10', management_level: 2 }
    },
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'vp-eng-001' } },
      to: { label: 'Employee', properties: { id: 'dir-frontend-001' } },
      properties: { since: '2020-02-01', management_level: 2 }
    },

    // Director to Manager relationships
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'dir-backend-001' } },
      to: { label: 'Employee', properties: { id: 'mgr-api-001' } },
      properties: { since: '2020-08-15', management_level: 3 }
    },
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'dir-frontend-001' } },
      to: { label: 'Employee', properties: { id: 'mgr-ui-001' } },
      properties: { since: '2021-01-20', management_level: 3 }
    },

    // Manager to IC relationships
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'mgr-api-001' } },
      to: { label: 'Employee', properties: { id: 'dev-001' } },
      properties: { since: '2021-06-01', management_level: 4 }
    },
    { label: 'MANAGES',
      from: { label: 'Employee', properties: { id: 'mgr-ui-001' } },
      to: { label: 'Employee', properties: { id: 'dev-002' } },
      properties: { since: '2022-03-15', management_level: 4 }
    },

    // Corresponding REPORTS_TO relationships (reverse direction)
    { label: 'REPORTS_TO',
      from: { label: 'Employee', properties: { id: 'vp-eng-001' } },
      to: { label: 'Employee', properties: { id: 'ceo-001' } },
      properties: { since: '2019-03-01', direct: true }
    },
    { label: 'REPORTS_TO',
      from: { label: 'Employee', properties: { id: 'vp-sales-001' } },
      to: { label: 'Employee', properties: { id: 'ceo-001' } },
      properties: { since: '2019-06-15', direct: true }
    }
    // ... additional REPORTS_TO relationships
  ]
};

// Load the organizational data
const batchLoader = client.createBatchLoader();
await batchLoader.load(orgData);
```

### Category Hierarchy Data

```typescript
const categoryData = {
  vertices: [
    // Root categories
    { label: 'Category', properties: {
      id: 'electronics', name: 'Electronics', level: 0, sort_order: 1,
      description: 'Electronic devices and components'
    }},
    { label: 'Category', properties: {
      id: 'clothing', name: 'Clothing', level: 0, sort_order: 2,
      description: 'Apparel and accessories'
    }},

    // Level 1 subcategories
    { label: 'Category', properties: {
      id: 'computers', name: 'Computers', level: 1, sort_order: 1,
      description: 'Desktop and laptop computers'
    }},
    { label: 'Category', properties: {
      id: 'phones', name: 'Phones', level: 1, sort_order: 2,
      description: 'Mobile phones and accessories'
    }},
    { label: 'Category', properties: {
      id: 'mens-clothing', name: "Men's Clothing", level: 1, sort_order: 1,
      description: 'Clothing for men'
    }},

    // Level 2 subcategories
    { label: 'Category', properties: {
      id: 'laptops', name: 'Laptops', level: 2, sort_order: 1,
      description: 'Portable computers'
    }},
    { label: 'Category', properties: {
      id: 'smartphones', name: 'Smartphones', level: 2, sort_order: 1,
      description: 'Smart mobile phones'
    }},
    { label: 'Category', properties: {
      id: 'mens-shirts', name: "Men's Shirts", level: 2, sort_order: 1,
      description: 'Shirts for men'
    }}
  ],
  edges: [
    // Electronics hierarchy
    { label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 'electronics' } },
      to: { label: 'Category', properties: { id: 'computers' } },
      properties: { order: 1 }
    },
    { label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 'electronics' } },
      to: { label: 'Category', properties: { id: 'phones' } },
      properties: { order: 2 }
    },
    { label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 'computers' } },
      to: { label: 'Category', properties: { id: 'laptops' } },
      properties: { order: 1 }
    },
    { label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 'phones' } },
      to: { label: 'Category', properties: { id: 'smartphones' } },
      properties: { order: 1 }
    },

    // Clothing hierarchy
    { label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 'clothing' } },
      to: { label: 'Category', properties: { id: 'mens-clothing' } },
      properties: { order: 1 }
    },
    { label: 'PARENT_OF',
      from: { label: 'Category', properties: { id: 'mens-clothing' } },
      to: { label: 'Category', properties: { id: 'mens-shirts' } },
      properties: { order: 1 }
    }
  ]
};

await batchLoader.load(categoryData);
```

## Common Query Patterns

### 1. Find Direct Reports

```typescript
// Find all employees who report directly to a specific manager
const directReports = await client.query()
  .match('Employee', 'manager')
  .where({ 'manager.id': 'vp-eng-001' })
  .match('manager', 'MANAGES', 'employee', 'manages_rel')
  .return(['employee.name', 'employee.title', 'manages_rel.since'])
  .orderBy('employee.name')
  .execute();
```

### 2. Find All Descendants (Recursive)

```typescript
// Find all employees in the reporting chain under a manager
const allReports = await client.query()
  .match('Employee', 'manager')
  .where({ 'manager.id': 'vp-eng-001' })
  .match('manager', 'MANAGES*1..', 'employee')
  .return(['employee.name', 'employee.title', 'employee.department'])
  .orderBy('employee.name')
  .execute();
```

### 3. Find Management Chain (Path to Root)

```typescript
// Find the complete management chain for an employee
const managementChain = await client.query()
  .match('Employee', 'employee')
  .where({ 'employee.id': 'dev-001' })
  .match('path = (employee)-[:REPORTS_TO*0..]->(manager:Employee)')
  .return(['path', 'nodes(path) as chain'])
  .execute();
```

### 4. Find Siblings (Same Parent)

```typescript
// Find all employees with the same manager
const siblings = await client.query()
  .match('Employee', 'employee')
  .where({ 'employee.id': 'dev-001' })
  .match('(employee)-[:REPORTS_TO]->(manager:Employee)')
  .match('(manager)-[:MANAGES]->(sibling:Employee)')
  .where('sibling.id <> employee.id')
  .return(['sibling.name', 'sibling.title'])
  .execute();
```

### 5. Category Tree Traversal

```typescript
// Get all subcategories under Electronics
const subcategories = await client.query()
  .match('Category', 'root')
  .where({ 'root.id': 'electronics' })
  .match('root', 'PARENT_OF*1..', 'subcategory')
  .return(['subcategory.name', 'subcategory.level', 'subcategory.description'])
  .orderBy(['subcategory.level', 'subcategory.sort_order'])
  .execute();
```

### 6. Find Leaf Nodes

```typescript
// Find categories with no children (leaf nodes)
const leafCategories = await client.query()
  .match('Category', 'category')
  .where('NOT (category)-[:PARENT_OF]->()')
  .return(['category.name', 'category.level'])
  .orderBy('category.name')
  .execute();
```

## Performance Optimization

### 1. Indexing Strategy

```typescript
// Create indexes for frequently queried properties
await client.executeSQL(`
  CREATE INDEX IF NOT EXISTS idx_employee_id
  ON ag_catalog.employee_vertex USING btree ((properties->>'id'));

  CREATE INDEX IF NOT EXISTS idx_employee_department
  ON ag_catalog.employee_vertex USING btree ((properties->>'department'));

  CREATE INDEX IF NOT EXISTS idx_category_level
  ON ag_catalog.category_vertex USING btree (((properties->>'level')::int));
`);
```

### 2. Denormalization for Read Performance

```typescript
// Add computed fields for common queries
const optimizedSchema = {
  vertices: {
    Employee: {
      properties: {
        // ... existing properties
        management_level: { type: 'number' }, // Computed: distance from CEO
        direct_report_count: { type: 'number' }, // Computed: number of direct reports
        total_report_count: { type: 'number' }, // Computed: total reports in chain
        manager_id: { type: 'string' }, // Denormalized: direct manager ID
        manager_name: { type: 'string' } // Denormalized: direct manager name
      }
    }
  }
};
```

### 3. Batch Hierarchy Updates

```typescript
// Efficient bulk updates for hierarchy changes
async function updateManagementLevels() {
  // Use a single query to update all management levels
  await client.query()
    .match('(ceo:Employee {title: "CEO"})')
    .match('path = (ceo)-[:MANAGES*0..]->(employee:Employee)')
    .with('employee, length(path) as level')
    .set('employee.management_level = level')
    .execute();
}
```

## Best Practices

### 1. Maintain Data Consistency
- Always update both directions of relationships (MANAGES ↔ REPORTS_TO)
- Use transactions for hierarchy modifications
- Validate hierarchy constraints (no cycles, single parent)

### 2. Handle Edge Cases
- Root nodes (employees with no manager)
- Leaf nodes (employees with no direct reports)
- Orphaned nodes (broken hierarchy links)

### 3. Query Optimization
- Use path length limits to prevent infinite recursion
- Index properties used in WHERE clauses
- Consider materialized views for complex hierarchy queries

### 4. Schema Evolution
- Plan for hierarchy restructuring
- Support temporary dual reporting relationships
- Maintain audit trails for organizational changes

## Next Steps

- [Product-Part Relationships](./product-part) - For component hierarchies
- [One-to-Many Properties](./one-to-many-properties) - For attribute modeling
- [Performance Optimization](../how-to-guides/performance-optimization) - Advanced optimization techniques
