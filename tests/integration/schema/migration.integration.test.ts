/**
 * Integration tests for schema migration
 * 
 * These tests verify schema migration and versioning.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  SchemaDefinition, 
  SchemaVersionError, 
  compareSchemas, 
  migrateSchema, 
  SchemaChangeType 
} from '../../../src/schema';
import { loadSchemaFixture } from '../../setup/integration';
import fs from 'fs';
import path from 'path';

describe('Schema Migration Integration', () => {
  // Create a temporary schema for migration tests
  let baseSchema: SchemaDefinition;
  let tempSchemaPath: string;
  
  beforeEach(() => {
    // Load the basic schema as the base
    baseSchema = loadSchemaFixture('basic-schema');
    
    // Create a temporary schema file
    tempSchemaPath = path.join(__dirname, '../../fixtures/temp-schema.json');
    fs.writeFileSync(tempSchemaPath, JSON.stringify(baseSchema, null, 2));
  });
  
  it('should detect non-breaking changes', () => {
    // Create a new schema with non-breaking changes
    const newSchema: SchemaDefinition = {
      ...baseSchema,
      version: '1.1.0',
      vertices: {
        ...baseSchema.vertices,
        // Add a new vertex (non-breaking)
        Category: {
          properties: {
            name: { type: 'string', description: 'Category name' },
            slug: { type: 'string', description: 'Category slug' }
          },
          required: ['name'],
          description: 'A category vertex'
        }
      }
    };
    
    // Compare schemas
    const changes = compareSchemas(baseSchema, newSchema);
    
    // Verify changes
    expect(changes).toHaveLength(2); // Version change + new vertex
    
    // Find the version change
    const versionChange = changes.find(c => c.path === 'version');
    expect(versionChange).toBeDefined();
    expect(versionChange!.type).toBe(SchemaChangeType.MODIFIED);
    expect(versionChange!.breaking).toBe(false);
    expect(versionChange!.oldValue).toBe('1.0.0');
    expect(versionChange!.newValue).toBe('1.1.0');
    
    // Find the new vertex
    const vertexChange = changes.find(c => c.path === 'vertices.Category');
    expect(vertexChange).toBeDefined();
    expect(vertexChange!.type).toBe(SchemaChangeType.ADDED);
    expect(vertexChange!.breaking).toBe(false);
    
    // Migrate schema
    const migratedSchema = migrateSchema(baseSchema, newSchema);
    expect(migratedSchema.version).toBe('1.1.0');
    expect(migratedSchema.vertices.Category).toBeDefined();
  });
  
  it('should detect breaking changes', () => {
    // Create a new schema with breaking changes
    const newSchema: SchemaDefinition = {
      ...baseSchema,
      version: '2.0.0',
      vertices: {
        ...baseSchema.vertices,
        // Modify Person vertex to require a new field (breaking)
        Person: {
          ...baseSchema.vertices.Person,
          required: [...baseSchema.vertices.Person.required, 'phone']
        }
      }
    };
    
    // Compare schemas
    const changes = compareSchemas(baseSchema, newSchema);
    
    // Verify changes
    expect(changes.length).toBeGreaterThan(1);
    
    // Find the breaking change
    const breakingChange = changes.find(c => c.breaking);
    expect(breakingChange).toBeDefined();
    expect(breakingChange!.path).toContain('Person.required');
    
    // Migrate schema should fail with allowBreakingChanges=false
    expect(() => migrateSchema(baseSchema, newSchema)).toThrow(SchemaVersionError);
    
    // Migrate schema should succeed with allowBreakingChanges=true
    const migratedSchema = migrateSchema(baseSchema, newSchema, { allowBreakingChanges: true });
    expect(migratedSchema.version).toBe('2.0.0');
    expect(migratedSchema.vertices.Person.required).toContain('phone');
  });
  
  it('should handle property modifications', () => {
    // Create a new schema with property modifications
    const newSchema: SchemaDefinition = {
      ...baseSchema,
      version: '1.1.0',
      vertices: {
        ...baseSchema.vertices,
        // Modify Product vertex properties
        Product: {
          ...baseSchema.vertices.Product,
          properties: {
            ...baseSchema.vertices.Product.properties,
            // Add a new property
            description: { type: 'string', description: 'Product description' },
            // Modify an existing property
            price: { 
              type: 'number', 
              description: 'Product price in USD',
              numberConstraints: {
                minimum: 0
              }
            }
          }
        }
      }
    };
    
    // Compare schemas
    const changes = compareSchemas(baseSchema, newSchema);
    
    // Verify changes
    expect(changes.length).toBeGreaterThan(1);
    
    // Find the property changes
    const newPropertyChange = changes.find(c => c.path.includes('description'));
    expect(newPropertyChange).toBeDefined();
    expect(newPropertyChange!.type).toBe(SchemaChangeType.ADDED);
    
    const modifiedPropertyChange = changes.find(c => c.path.includes('price'));
    expect(modifiedPropertyChange).toBeDefined();
    expect(modifiedPropertyChange!.type).toBe(SchemaChangeType.MODIFIED);
    
    // Migrate schema
    const migratedSchema = migrateSchema(baseSchema, newSchema);
    expect(migratedSchema.version).toBe('1.1.0');
    expect(migratedSchema.vertices.Product.properties.description).toBeDefined();
    expect(migratedSchema.vertices.Product.properties.price.numberConstraints).toBeDefined();
  });
  
  it('should handle edge modifications', () => {
    // Create a new schema with edge modifications
    const newSchema: SchemaDefinition = {
      ...baseSchema,
      version: '1.1.0',
      edges: {
        ...baseSchema.edges,
        // Add a new edge
        CATEGORIZED_AS: {
          properties: {
            since: { type: 'date', description: 'Categorization date' }
          },
          required: ['since'],
          fromVertex: 'Product',
          toVertex: 'Category',
          description: 'Product belongs to category'
        },
        // Modify an existing edge
        PURCHASED: {
          ...baseSchema.edges.PURCHASED,
          properties: {
            ...baseSchema.edges.PURCHASED.properties,
            // Add a new property
            discount: { type: 'number', description: 'Purchase discount' }
          }
        }
      }
    };
    
    // Compare schemas
    const changes = compareSchemas(baseSchema, newSchema);
    
    // Verify changes
    expect(changes.length).toBeGreaterThan(1);
    
    // Find the edge changes
    const newEdgeChange = changes.find(c => c.path === 'edges.CATEGORIZED_AS');
    expect(newEdgeChange).toBeDefined();
    expect(newEdgeChange!.type).toBe(SchemaChangeType.ADDED);
    
    const modifiedEdgeChange = changes.find(c => c.path.includes('PURCHASED') && c.path.includes('discount'));
    expect(modifiedEdgeChange).toBeDefined();
    expect(modifiedEdgeChange!.type).toBe(SchemaChangeType.ADDED);
    
    // Migrate schema
    const migratedSchema = migrateSchema(baseSchema, newSchema);
    expect(migratedSchema.version).toBe('1.1.0');
    expect(migratedSchema.edges.CATEGORIZED_AS).toBeDefined();
    expect(migratedSchema.edges.PURCHASED.properties.discount).toBeDefined();
  });
  
  it('should handle removing vertices and edges', () => {
    // Create a new schema with removals
    const newSchema: SchemaDefinition = {
      ...baseSchema,
      version: '2.0.0',
      vertices: {
        // Keep only Person vertex
        Person: baseSchema.vertices.Person
      },
      edges: {
        // Remove all edges
      }
    };
    
    // Compare schemas
    const changes = compareSchemas(baseSchema, newSchema);
    
    // Verify changes
    expect(changes.length).toBeGreaterThan(1);
    
    // Find the removal changes
    const removedVertexChange = changes.find(c => c.path === 'vertices.Product');
    expect(removedVertexChange).toBeDefined();
    expect(removedVertexChange!.type).toBe(SchemaChangeType.REMOVED);
    expect(removedVertexChange!.breaking).toBe(true);
    
    const removedEdgeChanges = changes.filter(c => c.path.startsWith('edges.') && c.type === SchemaChangeType.REMOVED);
    expect(removedEdgeChanges.length).toBeGreaterThan(0);
    
    // Migrate schema should fail with allowBreakingChanges=false
    expect(() => migrateSchema(baseSchema, newSchema)).toThrow(SchemaVersionError);
    
    // Migrate schema should succeed with allowBreakingChanges=true
    const migratedSchema = migrateSchema(baseSchema, newSchema, { allowBreakingChanges: true });
    expect(migratedSchema.version).toBe('2.0.0');
    expect(Object.keys(migratedSchema.vertices)).toHaveLength(1);
    expect(migratedSchema.vertices.Person).toBeDefined();
    expect(Object.keys(migratedSchema.edges)).toHaveLength(0);
  });
});
