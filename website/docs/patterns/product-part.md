# Product-Part Relationship Patterns

Product-part relationships model complex component hierarchies where products are composed of multiple parts, and parts can themselves be composed of sub-parts. This pattern is essential for bill of materials (BOM), manufacturing assemblies, software dependencies, and any system with compositional relationships.

## Pattern Overview

### Key Characteristics
- **Composition**: Products are composed of multiple parts
- **Multi-level Hierarchy**: Parts can contain sub-parts (nested composition)
- **Quantity Relationships**: Parts have quantities and specifications
- **Assembly Operations**: Support for assembly/disassembly workflows
- **Variant Support**: Different configurations and versions

### Common Use Cases
- Manufacturing bill of materials (BOM)
- Software component dependencies
- Recipe ingredients and sub-recipes
- System architecture components
- Product configurations and variants

## Schema Definition

### Basic Product-Part Schema

```typescript
import { AgeSchemaClient } from 'age-schema-client';

const productPartSchema = {
  vertices: {
    Product: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        version: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string', default: 'active' },
        created_date: { type: 'string' },
        unit_cost: { type: 'number' },
        lead_time_days: { type: 'number' }
      },
      required: ['id', 'name']
    },
    Part: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        part_number: { type: 'string' },
        category: { type: 'string' },
        unit: { type: 'string' }, // e.g., 'each', 'kg', 'meter'
        unit_cost: { type: 'number' },
        supplier: { type: 'string' },
        status: { type: 'string', default: 'active' },
        is_assembly: { type: 'boolean', default: false }
      },
      required: ['id', 'name', 'part_number']
    },
    Assembly: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        assembly_number: { type: 'string' },
        version: { type: 'string' },
        complexity_level: { type: 'number' },
        assembly_time_minutes: { type: 'number' },
        status: { type: 'string', default: 'active' }
      },
      required: ['id', 'name', 'assembly_number']
    }
  },
  edges: {
    CONTAINS: {
      from: 'Product',
      to: 'Part',
      properties: {
        quantity: { type: 'number', required: true },
        unit: { type: 'string' },
        position: { type: 'string' }, // Position in assembly
        is_optional: { type: 'boolean', default: false },
        substitutable: { type: 'boolean', default: false },
        assembly_order: { type: 'number' },
        notes: { type: 'string' }
      }
    },
    COMPOSED_OF: {
      from: 'Assembly',
      to: 'Part',
      properties: {
        quantity: { type: 'number', required: true },
        unit: { type: 'string' },
        assembly_step: { type: 'number' },
        is_critical: { type: 'boolean', default: false },
        installation_notes: { type: 'string' }
      }
    },
    PART_OF: {
      from: 'Part',
      to: 'Assembly',
      properties: {
        quantity: { type: 'number', required: true },
        role: { type: 'string' }, // e.g., 'structural', 'fastener', 'component'
        required: { type: 'boolean', default: true }
      }
    },
    SUBASSEMBLY_OF: {
      from: 'Assembly',
      to: 'Assembly',
      properties: {
        quantity: { type: 'number', required: true },
        assembly_level: { type: 'number' },
        dependency_type: { type: 'string' } // e.g., 'sequential', 'parallel'
      }
    },
    REQUIRES: {
      from: 'Part',
      to: 'Part',
      properties: {
        dependency_type: { type: 'string' }, // e.g., 'before', 'with', 'after'
        quantity_ratio: { type: 'number' },
        notes: { type: 'string' }
      }
    }
  }
};
```

### Software Component Schema

```typescript
const softwareComponentSchema = {
  vertices: {
    Application: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        version: { type: 'string', required: true },
        description: { type: 'string' },
        repository_url: { type: 'string' },
        build_status: { type: 'string' },
        deployment_environment: { type: 'string' }
      },
      required: ['id', 'name', 'version']
    },
    Component: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        version: { type: 'string', required: true },
        type: { type: 'string' }, // e.g., 'library', 'service', 'module'
        language: { type: 'string' },
        license: { type: 'string' },
        maintainer: { type: 'string' },
        security_level: { type: 'string' }
      },
      required: ['id', 'name', 'version']
    },
    Module: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        namespace: { type: 'string' },
        file_path: { type: 'string' },
        size_bytes: { type: 'number' },
        complexity_score: { type: 'number' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    DEPENDS_ON: {
      from: 'Application',
      to: 'Component',
      properties: {
        version_constraint: { type: 'string' }, // e.g., '^1.2.0', '>=2.0.0'
        dependency_type: { type: 'string' }, // e.g., 'runtime', 'dev', 'peer'
        is_optional: { type: 'boolean', default: false },
        import_path: { type: 'string' }
      }
    },
    INCLUDES: {
      from: 'Component',
      to: 'Module',
      properties: {
        export_type: { type: 'string' }, // e.g., 'default', 'named', 'namespace'
        is_public: { type: 'boolean', default: true },
        load_order: { type: 'number' }
      }
    },
    IMPORTS: {
      from: 'Module',
      to: 'Module',
      properties: {
        import_type: { type: 'string' }, // e.g., 'static', 'dynamic', 'conditional'
        symbols: { type: 'string' }, // JSON array of imported symbols
        is_circular: { type: 'boolean', default: false }
      }
    }
  }
};
```

## Bulk Loading Examples

### Manufacturing BOM Data

```typescript
const client = new AgeSchemaClient({
  connectionString: 'postgresql://user:pass@localhost:5432/graphdb',
  graphName: 'manufacturing_bom'
});

await client.loadSchema(productPartSchema);

// Manufacturing bill of materials data
const bomData = {
  vertices: [
    // Products
    { label: 'Product', properties: {
      id: 'bike-001', name: 'Mountain Bike Pro', version: '2024.1',
      description: 'Professional mountain bike', category: 'Bicycles',
      unit_cost: 1200.00, lead_time_days: 14
    }},

    // Major assemblies
    { label: 'Assembly', properties: {
      id: 'frame-asm-001', name: 'Frame Assembly', assembly_number: 'FA-001',
      version: '1.0', complexity_level: 3, assembly_time_minutes: 120
    }},
    { label: 'Assembly', properties: {
      id: 'wheel-asm-001', name: 'Front Wheel Assembly', assembly_number: 'WA-001',
      version: '1.0', complexity_level: 2, assembly_time_minutes: 45
    }},
    { label: 'Assembly', properties: {
      id: 'wheel-asm-002', name: 'Rear Wheel Assembly', assembly_number: 'WA-002',
      version: '1.0', complexity_level: 2, assembly_time_minutes: 45
    }},

    // Individual parts
    { label: 'Part', properties: {
      id: 'frame-001', name: 'Aluminum Frame', part_number: 'FR-ALU-001',
      category: 'Frame', unit: 'each', unit_cost: 300.00, supplier: 'FrameCorp'
    }},
    { label: 'Part', properties: {
      id: 'wheel-001', name: '27.5" Rim', part_number: 'WH-RIM-275',
      category: 'Wheels', unit: 'each', unit_cost: 80.00, supplier: 'WheelTech'
    }},
    { label: 'Part', properties: {
      id: 'tire-001', name: 'Mountain Tire 27.5"', part_number: 'TR-MT-275',
      category: 'Tires', unit: 'each', unit_cost: 45.00, supplier: 'TirePro'
    }},
    { label: 'Part', properties: {
      id: 'spoke-001', name: 'Steel Spoke', part_number: 'SP-STL-001',
      category: 'Hardware', unit: 'each', unit_cost: 2.50, supplier: 'SpokeInc'
    }},
    { label: 'Part', properties: {
      id: 'hub-001', name: 'Front Hub', part_number: 'HB-FRT-001',
      category: 'Hubs', unit: 'each', unit_cost: 35.00, supplier: 'HubMaster'
    }},
    { label: 'Part', properties: {
      id: 'hub-002', name: 'Rear Hub', part_number: 'HB-RR-001',
      category: 'Hubs', unit: 'each', unit_cost: 45.00, supplier: 'HubMaster'
    }},
    { label: 'Part', properties: {
      id: 'brake-001', name: 'Disc Brake Set', part_number: 'BR-DSC-001',
      category: 'Brakes', unit: 'set', unit_cost: 120.00, supplier: 'BrakeTech'
    }},
    { label: 'Part', properties: {
      id: 'chain-001', name: '11-Speed Chain', part_number: 'CH-11SP-001',
      category: 'Drivetrain', unit: 'each', unit_cost: 25.00, supplier: 'ChainCorp'
    }}
  ],
  edges: [
    // Product contains major assemblies
    { label: 'CONTAINS',
      from: { label: 'Product', properties: { id: 'bike-001' } },
      to: { label: 'Assembly', properties: { id: 'frame-asm-001' } },
      properties: { quantity: 1, unit: 'each', assembly_order: 1 }
    },
    { label: 'CONTAINS',
      from: { label: 'Product', properties: { id: 'bike-001' } },
      to: { label: 'Assembly', properties: { id: 'wheel-asm-001' } },
      properties: { quantity: 1, unit: 'each', assembly_order: 2 }
    },
    { label: 'CONTAINS',
      from: { label: 'Product', properties: { id: 'bike-001' } },
      to: { label: 'Assembly', properties: { id: 'wheel-asm-002' } },
      properties: { quantity: 1, unit: 'each', assembly_order: 3 }
    },

    // Product contains direct parts
    { label: 'CONTAINS',
      from: { label: 'Product', properties: { id: 'bike-001' } },
      to: { label: 'Part', properties: { id: 'brake-001' } },
      properties: { quantity: 1, unit: 'set', assembly_order: 4 }
    },
    { label: 'CONTAINS',
      from: { label: 'Product', properties: { id: 'bike-001' } },
      to: { label: 'Part', properties: { id: 'chain-001' } },
      properties: { quantity: 1, unit: 'each', assembly_order: 5 }
    },

    // Frame assembly composition
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'frame-asm-001' } },
      to: { label: 'Part', properties: { id: 'frame-001' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 1, is_critical: true }
    },

    // Front wheel assembly composition
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-001' } },
      to: { label: 'Part', properties: { id: 'wheel-001' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 1, is_critical: true }
    },
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-001' } },
      to: { label: 'Part', properties: { id: 'tire-001' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 3 }
    },
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-001' } },
      to: { label: 'Part', properties: { id: 'spoke-001' } },
      properties: { quantity: 32, unit: 'each', assembly_step: 2 }
    },
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-001' } },
      to: { label: 'Part', properties: { id: 'hub-001' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 1, is_critical: true }
    },

    // Rear wheel assembly composition (similar to front but with different hub)
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-002' } },
      to: { label: 'Part', properties: { id: 'wheel-001' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 1, is_critical: true }
    },
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-002' } },
      to: { label: 'Part', properties: { id: 'tire-001' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 3 }
    },
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-002' } },
      to: { label: 'Part', properties: { id: 'spoke-001' } },
      properties: { quantity: 32, unit: 'each', assembly_step: 2 }
    },
    { label: 'COMPOSED_OF',
      from: { label: 'Assembly', properties: { id: 'wheel-asm-002' } },
      to: { label: 'Part', properties: { id: 'hub-002' } },
      properties: { quantity: 1, unit: 'each', assembly_step: 1, is_critical: true }
    }
  ]
};

// Load the BOM data
const batchLoader = client.createBatchLoader();
await batchLoader.load(bomData);
```

## Common Query Patterns

### 1. Complete Bill of Materials (Exploded BOM)

```typescript
// Get all parts required for a product (multi-level explosion)
const explodedBOM = await client.query()
  .match('Product', 'product')
  .where({ 'product.id': 'bike-001' })
  .match('product', 'CONTAINS*1..', 'component')
  .match('(component)-[rel:CONTAINS|COMPOSED_OF]->(part:Part)')
  .return([
    'part.name',
    'part.part_number',
    'rel.quantity',
    'part.unit_cost',
    'rel.quantity * part.unit_cost as total_cost'
  ])
  .orderBy('part.category')
  .execute();
```

### 2. Direct Components Only

```typescript
// Get only direct components of a product (single level)
const directComponents = await client.query()
  .match('Product', 'product')
  .where({ 'product.id': 'bike-001' })
  .match('product', 'CONTAINS', 'component', 'contains_rel')
  .return([
    'component.name',
    'labels(component) as component_type',
    'contains_rel.quantity',
    'contains_rel.assembly_order'
  ])
  .orderBy('contains_rel.assembly_order')
  .execute();
```

### 3. Where Used Analysis

```typescript
// Find all products that use a specific part
const whereUsed = await client.query()
  .match('Part', 'part')
  .where({ 'part.part_number': 'SP-STL-001' })
  .match('(product:Product)-[:CONTAINS*1..]->(assembly)-[:COMPOSED_OF]->(part)')
  .return([
    'product.name',
    'product.version',
    'assembly.name as used_in_assembly'
  ])
  .execute();
```

### 4. Assembly Instructions (Ordered Steps)

```typescript
// Get assembly steps for a specific assembly
const assemblySteps = await client.query()
  .match('Assembly', 'assembly')
  .where({ 'assembly.id': 'wheel-asm-001' })
  .match('assembly', 'COMPOSED_OF', 'part', 'composed_rel')
  .return([
    'composed_rel.assembly_step',
    'part.name',
    'composed_rel.quantity',
    'composed_rel.is_critical',
    'composed_rel.installation_notes'
  ])
  .orderBy('composed_rel.assembly_step')
  .execute();
```

### 5. Cost Rollup Analysis

```typescript
// Calculate total cost for a product including all components
const costRollup = await client.query()
  .match('Product', 'product')
  .where({ 'product.id': 'bike-001' })
  .match('product', 'CONTAINS*1..', 'component')
  .match('(component)-[rel:CONTAINS|COMPOSED_OF]->(part:Part)')
  .with('product, sum(rel.quantity * part.unit_cost) as total_parts_cost')
  .return([
    'product.name',
    'product.unit_cost as product_cost',
    'total_parts_cost',
    'product.unit_cost - total_parts_cost as margin'
  ])
  .execute();
```

### 6. Critical Path Analysis

```typescript
// Find critical parts in assemblies
const criticalParts = await client.query()
  .match('Assembly', 'assembly')
  .match('assembly', 'COMPOSED_OF', 'part', 'composed_rel')
  .where({ 'composed_rel.is_critical': true })
  .return([
    'assembly.name',
    'part.name',
    'part.supplier',
    'composed_rel.assembly_step'
  ])
  .orderBy(['assembly.name', 'composed_rel.assembly_step'])
  .execute();
```

### 7. Supplier Analysis

```typescript
// Analyze parts by supplier for a product
const supplierAnalysis = await client.query()
  .match('Product', 'product')
  .where({ 'product.id': 'bike-001' })
  .match('product', 'CONTAINS*1..', 'component')
  .match('(component)-[rel:CONTAINS|COMPOSED_OF]->(part:Part)')
  .with('part.supplier as supplier, collect(part) as parts, sum(rel.quantity * part.unit_cost) as supplier_cost')
  .return([
    'supplier',
    'size(parts) as part_count',
    'supplier_cost',
    'parts'
  ])
  .orderBy('supplier_cost DESC')
  .execute();
```

## Performance Optimization

### 1. Indexing for BOM Queries

```typescript
// Create indexes for common BOM query patterns
await client.executeSQL(`
  CREATE INDEX IF NOT EXISTS idx_part_number
  ON ag_catalog.part_vertex USING btree ((properties->>'part_number'));

  CREATE INDEX IF NOT EXISTS idx_part_supplier
  ON ag_catalog.part_vertex USING btree ((properties->>'supplier'));

  CREATE INDEX IF NOT EXISTS idx_assembly_step
  ON ag_catalog.composed_of_edge USING btree (((properties->>'assembly_step')::int));
`);
```

### 2. Materialized BOM Views

```typescript
// Create materialized views for frequently accessed BOM data
const materializedBOM = {
  vertices: {
    BOMItem: {
      properties: {
        product_id: { type: 'string', required: true },
        part_id: { type: 'string', required: true },
        total_quantity: { type: 'number' },
        level: { type: 'number' },
        path: { type: 'string' }, // JSON path from product to part
        total_cost: { type: 'number' }
      }
    }
  }
};
```

## Best Practices

### 1. Version Management
- Track component versions and compatibility
- Support multiple product configurations
- Maintain historical BOM data

### 2. Quantity Calculations
- Handle unit conversions properly
- Support fractional quantities
- Validate quantity constraints

### 3. Assembly Optimization
- Order assembly steps logically
- Identify parallel assembly opportunities
- Track assembly time and complexity

### 4. Change Management
- Track engineering change orders (ECOs)
- Maintain approval workflows
- Support effectivity dates

## Next Steps

- [One-to-Many Properties](./one-to-many-properties) - For attribute modeling
- [Parent-Child Relationships](./parent-child) - For hierarchical structures
- [Bulk Loading Strategies](../how-to-guides/bulk-loading) - Efficient data loading