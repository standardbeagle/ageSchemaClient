/**
 * Integration tests for vertex operations
 * 
 * These tests verify vertex creation, retrieval, update, deletion, batch operations,
 * and property constraints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { 
  connectionManager, 
  queryExecutor, 
  AGE_GRAPH_NAME, 
  loadSchemaFixture,
  findTestVertex
} from '../../setup/integration';

describe('Vertex Operations Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  
  beforeEach(async () => {
    // Load the basic schema
    basicSchema = loadSchemaFixture('basic-schema');
    
    // Create SQL generator
    sqlGenerator = new SQLGenerator(basicSchema);
    
    // Create vertex operations
    vertexOperations = new VertexOperations(basicSchema, queryExecutor, sqlGenerator);
    
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
  
  describe('Basic Vertex Operations', () => {
    it('should create a vertex', async () => {
      // Create a person vertex
      const personData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true
      };
      
      const person = await vertexOperations.createVertex('Person', personData, AGE_GRAPH_NAME);
      
      // Verify the vertex was created
      expect(person).toBeDefined();
      expect(person.id).toBeDefined();
      expect(person.label).toBe('Person');
      expect(person.properties).toMatchObject(personData);
      
      // Verify the vertex exists in the database
      const foundPerson = await findTestVertex('Person', { name: 'John Doe' });
      expect(foundPerson).toBeDefined();
    });
    
    it('should retrieve a vertex by ID', async () => {
      // Create a vertex
      const personData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 28,
        active: true
      };
      
      const createdPerson = await vertexOperations.createVertex('Person', personData, AGE_GRAPH_NAME);
      
      // Retrieve the vertex by ID
      const retrievedPerson = await vertexOperations.getVertex('Person', createdPerson.id, AGE_GRAPH_NAME);
      
      // Verify the retrieved vertex
      expect(retrievedPerson).toBeDefined();
      expect(retrievedPerson!.id).toBe(createdPerson.id);
      expect(retrievedPerson!.label).toBe('Person');
      expect(retrievedPerson!.properties).toMatchObject(personData);
    });
    
    it('should update a vertex', async () => {
      // Create a vertex
      const personData = {
        name: 'John Smith',
        email: 'john.smith@example.com',
        age: 35,
        active: true
      };
      
      const createdPerson = await vertexOperations.createVertex('Person', personData, AGE_GRAPH_NAME);
      
      // Update the vertex
      const updatedData = {
        name: 'John Smith Jr.',
        email: 'john.jr@example.com',
        age: 36,
        active: false
      };
      
      const updatedPerson = await vertexOperations.updateVertex(
        'Person',
        createdPerson.id,
        updatedData,
        AGE_GRAPH_NAME
      );
      
      // Verify the update
      expect(updatedPerson).toBeDefined();
      expect(updatedPerson.id).toBe(createdPerson.id);
      expect(updatedPerson.properties).toMatchObject(updatedData);
      
      // Verify the update in the database
      const retrievedPerson = await vertexOperations.getVertex('Person', createdPerson.id, AGE_GRAPH_NAME);
      expect(retrievedPerson!.properties).toMatchObject(updatedData);
    });
    
    it('should delete a vertex', async () => {
      // Create a vertex
      const personData = {
        name: 'To Be Deleted',
        email: 'delete.me@example.com',
        age: 40,
        active: true
      };
      
      const createdPerson = await vertexOperations.createVertex('Person', personData, AGE_GRAPH_NAME);
      
      // Delete the vertex
      const deleted = await vertexOperations.deleteVertex('Person', createdPerson.id, AGE_GRAPH_NAME);
      
      // Verify the deletion
      expect(deleted).toBe(true);
      
      // Verify the vertex no longer exists
      const retrievedPerson = await vertexOperations.getVertex('Person', createdPerson.id, AGE_GRAPH_NAME);
      expect(retrievedPerson).toBeNull();
    });
    
    it('should find vertices by properties', async () => {
      // Create multiple vertices
      const people = [
        {
          name: 'Alice',
          email: 'alice@example.com',
          age: 25,
          active: true
        },
        {
          name: 'Bob',
          email: 'bob@example.com',
          age: 30,
          active: true
        },
        {
          name: 'Charlie',
          email: 'charlie@example.com',
          age: 35,
          active: false
        }
      ];
      
      for (const person of people) {
        await vertexOperations.createVertex('Person', person, AGE_GRAPH_NAME);
      }
      
      // Find vertices by property
      const activePersons = await vertexOperations.findVertices(
        'Person',
        { active: true },
        AGE_GRAPH_NAME
      );
      
      // Verify the results
      expect(activePersons).toHaveLength(2);
      expect(activePersons.map(p => p.properties.name)).toContain('Alice');
      expect(activePersons.map(p => p.properties.name)).toContain('Bob');
      expect(activePersons.map(p => p.properties.name)).not.toContain('Charlie');
      
      // Find vertices by multiple properties
      const bobQuery = await vertexOperations.findVertices(
        'Person',
        { name: 'Bob', age: 30 },
        AGE_GRAPH_NAME
      );
      
      expect(bobQuery).toHaveLength(1);
      expect(bobQuery[0].properties.name).toBe('Bob');
      expect(bobQuery[0].properties.email).toBe('bob@example.com');
    });
  });
  
  describe('Batch Vertex Operations', () => {
    it('should create multiple vertices in a batch', async () => {
      // Batch of vertices
      const products = [
        {
          name: 'Product 1',
          price: 10.99,
          sku: 'SKU-001',
          inStock: true
        },
        {
          name: 'Product 2',
          price: 20.99,
          sku: 'SKU-002',
          inStock: true
        },
        {
          name: 'Product 3',
          price: 30.99,
          sku: 'SKU-003',
          inStock: false
        }
      ];
      
      // Create vertices in a batch
      const createdProducts = await vertexOperations.createVerticesBatch(
        'Product',
        products,
        AGE_GRAPH_NAME
      );
      
      // Verify the batch creation
      expect(createdProducts).toHaveLength(3);
      
      for (let i = 0; i < products.length; i++) {
        expect(createdProducts[i].label).toBe('Product');
        expect(createdProducts[i].properties).toMatchObject(products[i]);
      }
      
      // Verify in the database
      const retrievedProducts = await vertexOperations.findVertices(
        'Product',
        {},
        AGE_GRAPH_NAME
      );
      
      expect(retrievedProducts).toHaveLength(3);
    });
    
    it('should update multiple vertices in a batch', async () => {
      // Create vertices first
      const products = [
        {
          name: 'Product A',
          price: 10.99,
          sku: 'SKU-A',
          inStock: true
        },
        {
          name: 'Product B',
          price: 20.99,
          sku: 'SKU-B',
          inStock: true
        }
      ];
      
      const createdProducts = await vertexOperations.createVerticesBatch(
        'Product',
        products,
        AGE_GRAPH_NAME
      );
      
      // Update batch
      const updates = [
        {
          id: createdProducts[0].id,
          properties: {
            price: 15.99,
            inStock: false
          }
        },
        {
          id: createdProducts[1].id,
          properties: {
            price: 25.99,
            inStock: false
          }
        }
      ];
      
      const updatedProducts = await vertexOperations.updateVerticesBatch(
        'Product',
        updates,
        AGE_GRAPH_NAME
      );
      
      // Verify the batch update
      expect(updatedProducts).toHaveLength(2);
      expect(updatedProducts[0].properties.price).toBe(15.99);
      expect(updatedProducts[0].properties.inStock).toBe(false);
      expect(updatedProducts[1].properties.price).toBe(25.99);
      expect(updatedProducts[1].properties.inStock).toBe(false);
      
      // Verify in the database
      const retrievedProducts = await vertexOperations.findVertices(
        'Product',
        { inStock: false },
        AGE_GRAPH_NAME
      );
      
      expect(retrievedProducts).toHaveLength(2);
    });
    
    it('should delete multiple vertices in a batch', async () => {
      // Create vertices first
      const products = [
        {
          name: 'Delete Me 1',
          price: 10.99,
          sku: 'DEL-001',
          inStock: true
        },
        {
          name: 'Delete Me 2',
          price: 20.99,
          sku: 'DEL-002',
          inStock: true
        },
        {
          name: 'Keep Me',
          price: 30.99,
          sku: 'KEEP-001',
          inStock: true
        }
      ];
      
      const createdProducts = await vertexOperations.createVerticesBatch(
        'Product',
        products,
        AGE_GRAPH_NAME
      );
      
      // Delete batch
      const deleteIds = [createdProducts[0].id, createdProducts[1].id];
      
      const deleteResult = await vertexOperations.deleteVerticesBatch(
        'Product',
        deleteIds,
        AGE_GRAPH_NAME
      );
      
      // Verify the batch deletion
      expect(deleteResult).toBe(true);
      
      // Verify in the database
      const remainingProducts = await vertexOperations.findVertices(
        'Product',
        {},
        AGE_GRAPH_NAME
      );
      
      expect(remainingProducts).toHaveLength(1);
      expect(remainingProducts[0].properties.name).toBe('Keep Me');
    });
  });
  
  describe('Property Constraints', () => {
    it('should enforce required properties', async () => {
      // Missing required email
      const invalidPerson = {
        name: 'Missing Email',
        age: 30,
        active: true
      };
      
      // Attempt to create with missing required property
      await expect(vertexOperations.createVertex(
        'Person',
        invalidPerson,
        AGE_GRAPH_NAME
      )).rejects.toThrow();
    });
    
    it('should enforce property types', async () => {
      // Wrong type for age (should be number)
      const invalidPerson = {
        name: 'Wrong Type',
        email: 'wrong.type@example.com',
        age: 'thirty',
        active: true
      };
      
      // Attempt to create with wrong property type
      await expect(vertexOperations.createVertex(
        'Person',
        invalidPerson,
        AGE_GRAPH_NAME
      )).rejects.toThrow();
    });
    
    it('should handle default values', async () => {
      // Create without specifying a property that has a default
      const personWithoutActive = {
        name: 'Default Value',
        email: 'default.value@example.com',
        age: 30
        // active has a default of true
      };
      
      const person = await vertexOperations.createVertex(
        'Person',
        personWithoutActive,
        AGE_GRAPH_NAME
      );
      
      // Verify the default value was applied
      expect(person.properties.active).toBe(true);
    });
  });
});
