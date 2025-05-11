/**
 * Integration tests for schema compatibility
 * 
 * These tests verify schema compatibility with database operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition, SchemaValidator } from '../../../src/schema';
import { 
  connectionManager, 
  queryExecutor, 
  AGE_GRAPH_NAME, 
  createTestVertex, 
  createTestEdge,
  findTestVertex,
  findTestEdge,
  loadSchemaFixture 
} from '../../setup/integration';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { EdgeOperations } from '../../../src/db/edge';

describe('Schema Compatibility Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  
  beforeEach(async () => {
    // Load the basic schema
    basicSchema = loadSchemaFixture('basic-schema');
    
    // Create SQL generator
    sqlGenerator = new SQLGenerator(basicSchema);
    
    // Create vertex and edge operations
    vertexOperations = new VertexOperations(basicSchema, queryExecutor, sqlGenerator);
    edgeOperations = new EdgeOperations(basicSchema, queryExecutor, sqlGenerator);
    
    // Clear existing data
    try {
      await queryExecutor.executeCypher(
        `MATCH (n) DETACH DELETE n`,
        {},
        AGE_GRAPH_NAME
      );
    } catch (error) {
      // Ignore errors if AGE is not installed
    }
  });
  
  it('should create vertices that conform to the schema', async () => {
    // Create a person vertex
    const personData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };
    
    const person = await vertexOperations.createVertex('Person', personData, AGE_GRAPH_NAME);
    expect(person).toBeDefined();
    expect(person.properties).toMatchObject(personData);
    
    // Create a product vertex
    const productData = {
      name: 'Test Product',
      price: 99.99,
      sku: 'TEST-123'
    };
    
    const product = await vertexOperations.createVertex('Product', productData, AGE_GRAPH_NAME);
    expect(product).toBeDefined();
    expect(product.properties).toMatchObject(productData);
    
    // Verify vertices were created in the database
    const foundPerson = await findTestVertex('Person', { name: 'John Doe' });
    expect(foundPerson).toBeDefined();
    
    const foundProduct = await findTestVertex('Product', { sku: 'TEST-123' });
    expect(foundProduct).toBeDefined();
  });
  
  it('should reject vertices that violate the schema', async () => {
    // Missing required property
    const invalidPerson = {
      name: 'Invalid Person'
      // Missing required email
    };
    
    await expect(vertexOperations.createVertex('Person', invalidPerson, AGE_GRAPH_NAME))
      .rejects.toThrow();
    
    // Wrong property type
    const invalidProduct = {
      name: 'Invalid Product',
      price: 'not a number', // Should be a number
      sku: 'INVALID-123'
    };
    
    await expect(vertexOperations.createVertex('Product', invalidProduct, AGE_GRAPH_NAME))
      .rejects.toThrow();
    
    // Unknown vertex label
    const unknownData = {
      name: 'Unknown'
    };
    
    await expect(vertexOperations.createVertex('Unknown', unknownData, AGE_GRAPH_NAME))
      .rejects.toThrow();
  });
  
  it('should create edges that conform to the schema', async () => {
    // Create source and target vertices
    const person = await createTestVertex('Person', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
    
    const product = await createTestVertex('Product', {
      name: 'Test Product',
      price: 99.99,
      sku: 'TEST-123'
    });
    
    // Create a purchase edge
    const purchaseData = {
      date: new Date('2023-01-01'),
      quantity: 2,
      total: 199.98
    };
    
    const purchase = await edgeOperations.createEdge(
      'PURCHASED',
      person,
      product,
      purchaseData,
      AGE_GRAPH_NAME
    );
    
    expect(purchase).toBeDefined();
    expect(purchase.properties).toMatchObject(purchaseData);
    
    // Verify edge was created in the database
    const foundEdge = await findTestEdge(
      'Person',
      { name: 'John Doe' },
      'Product',
      { sku: 'TEST-123' },
      'PURCHASED'
    );
    
    expect(foundEdge).toBeDefined();
  });
  
  it('should reject edges that violate the schema', async () => {
    // Create source and target vertices
    const person = await createTestVertex('Person', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
    
    const product = await createTestVertex('Product', {
      name: 'Test Product',
      price: 99.99,
      sku: 'TEST-123'
    });
    
    // Missing required property
    const invalidPurchase = {
      date: new Date('2023-01-01')
      // Missing required quantity
    };
    
    await expect(edgeOperations.createEdge(
      'PURCHASED',
      person,
      product,
      invalidPurchase,
      AGE_GRAPH_NAME
    )).rejects.toThrow();
    
    // Wrong property type
    const invalidReview = {
      date: new Date('2023-01-01'),
      rating: 'five stars' // Should be a number
    };
    
    await expect(edgeOperations.createEdge(
      'REVIEWED',
      person,
      product,
      invalidReview,
      AGE_GRAPH_NAME
    )).rejects.toThrow();
    
    // Unknown edge label
    const unknownData = {
      timestamp: new Date()
    };
    
    await expect(edgeOperations.createEdge(
      'UNKNOWN',
      person,
      product,
      unknownData,
      AGE_GRAPH_NAME
    )).rejects.toThrow();
  });
  
  it('should handle schema evolution with backward compatibility', async () => {
    // Create a vertex with the original schema
    const person = await vertexOperations.createVertex('Person', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    }, AGE_GRAPH_NAME);
    
    // Evolve the schema (add a new required property to Product but not to Person)
    const evolvedSchema: SchemaDefinition = {
      ...basicSchema,
      version: '1.1.0',
      vertices: {
        ...basicSchema.vertices,
        Product: {
          ...basicSchema.vertices.Product,
          properties: {
            ...basicSchema.vertices.Product.properties,
            description: { type: 'string', description: 'Product description' }
          },
          required: [...basicSchema.vertices.Product.required, 'description']
        }
      }
    };
    
    // Create new operations with evolved schema
    const evolvedSqlGenerator = new SQLGenerator(evolvedSchema);
    const evolvedVertexOperations = new VertexOperations(evolvedSchema, queryExecutor, evolvedSqlGenerator);
    
    // Should still be able to retrieve the existing person
    const retrievedPerson = await evolvedVertexOperations.getVertex('Person', person.id, AGE_GRAPH_NAME);
    expect(retrievedPerson).toBeDefined();
    expect(retrievedPerson!.properties.name).toBe('John Doe');
    
    // Should be able to create a new person with the evolved schema
    const newPerson = await evolvedVertexOperations.createVertex('Person', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 28
    }, AGE_GRAPH_NAME);
    
    expect(newPerson).toBeDefined();
    
    // Should require the new field for Product
    await expect(evolvedVertexOperations.createVertex('Product', {
      name: 'New Product',
      price: 149.99,
      sku: 'NEW-123'
      // Missing required description
    }, AGE_GRAPH_NAME)).rejects.toThrow();
    
    // Should accept a product with the new field
    const newProduct = await evolvedVertexOperations.createVertex('Product', {
      name: 'New Product',
      price: 149.99,
      sku: 'NEW-123',
      description: 'A new product with description'
    }, AGE_GRAPH_NAME);
    
    expect(newProduct).toBeDefined();
  });
});
