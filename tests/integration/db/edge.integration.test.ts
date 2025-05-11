/**
 * Integration tests for edge operations
 * 
 * These tests verify edge creation, retrieval, update, deletion, batch operations,
 * and property constraints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { EdgeOperations } from '../../../src/db/edge';
import { 
  connectionManager, 
  queryExecutor, 
  AGE_GRAPH_NAME, 
  loadSchemaFixture,
  findTestEdge
} from '../../setup/integration';

describe('Edge Operations Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  
  // Test vertices
  let person1: any;
  let person2: any;
  let product1: any;
  let product2: any;
  
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
    
    // Create test vertices
    person1 = await vertexOperations.createVertex('Person', {
      name: 'Person 1',
      email: 'person1@example.com',
      age: 30,
      active: true
    }, AGE_GRAPH_NAME);
    
    person2 = await vertexOperations.createVertex('Person', {
      name: 'Person 2',
      email: 'person2@example.com',
      age: 35,
      active: true
    }, AGE_GRAPH_NAME);
    
    product1 = await vertexOperations.createVertex('Product', {
      name: 'Product 1',
      price: 99.99,
      sku: 'PROD-001',
      inStock: true
    }, AGE_GRAPH_NAME);
    
    product2 = await vertexOperations.createVertex('Product', {
      name: 'Product 2',
      price: 149.99,
      sku: 'PROD-002',
      inStock: true
    }, AGE_GRAPH_NAME);
  });
  
  describe('Basic Edge Operations', () => {
    it('should create an edge', async () => {
      // Create a purchase edge
      const purchaseData = {
        date: new Date('2023-01-01'),
        quantity: 2,
        total: 199.98
      };
      
      const purchase = await edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product1,
        purchaseData,
        AGE_GRAPH_NAME
      );
      
      // Verify the edge was created
      expect(purchase).toBeDefined();
      expect(purchase.id).toBeDefined();
      expect(purchase.label).toBe('PURCHASED');
      expect(purchase.fromId).toBe(person1.id);
      expect(purchase.toId).toBe(product1.id);
      expect(purchase.properties).toMatchObject(purchaseData);
      
      // Verify the edge exists in the database
      const foundEdge = await findTestEdge(
        'Person',
        { name: 'Person 1' },
        'Product',
        { sku: 'PROD-001' },
        'PURCHASED'
      );
      
      expect(foundEdge).toBeDefined();
    });
    
    it('should retrieve an edge by ID', async () => {
      // Create an edge
      const reviewData = {
        date: new Date('2023-01-15'),
        rating: 5,
        comment: 'Great product!'
      };
      
      const createdReview = await edgeOperations.createEdge(
        'REVIEWED',
        person1,
        product1,
        reviewData,
        AGE_GRAPH_NAME
      );
      
      // Retrieve the edge by ID
      const retrievedReview = await edgeOperations.getEdge(
        'REVIEWED',
        createdReview.id,
        AGE_GRAPH_NAME
      );
      
      // Verify the retrieved edge
      expect(retrievedReview).toBeDefined();
      expect(retrievedReview!.id).toBe(createdReview.id);
      expect(retrievedReview!.label).toBe('REVIEWED');
      expect(retrievedReview!.fromId).toBe(person1.id);
      expect(retrievedReview!.toId).toBe(product1.id);
      expect(retrievedReview!.properties).toMatchObject(reviewData);
    });
    
    it('should update an edge', async () => {
      // Create an edge
      const purchaseData = {
        date: new Date('2023-01-01'),
        quantity: 1,
        total: 99.99
      };
      
      const createdPurchase = await edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product1,
        purchaseData,
        AGE_GRAPH_NAME
      );
      
      // Update the edge
      const updatedData = {
        date: new Date('2023-01-01'),
        quantity: 2,
        total: 199.98
      };
      
      const updatedPurchase = await edgeOperations.updateEdge(
        'PURCHASED',
        createdPurchase.id,
        updatedData,
        AGE_GRAPH_NAME
      );
      
      // Verify the update
      expect(updatedPurchase).toBeDefined();
      expect(updatedPurchase.id).toBe(createdPurchase.id);
      expect(updatedPurchase.properties).toMatchObject(updatedData);
      
      // Verify the update in the database
      const retrievedPurchase = await edgeOperations.getEdge(
        'PURCHASED',
        createdPurchase.id,
        AGE_GRAPH_NAME
      );
      
      expect(retrievedPurchase!.properties).toMatchObject(updatedData);
    });
    
    it('should delete an edge', async () => {
      // Create an edge
      const purchaseData = {
        date: new Date('2023-01-01'),
        quantity: 1,
        total: 99.99
      };
      
      const createdPurchase = await edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product1,
        purchaseData,
        AGE_GRAPH_NAME
      );
      
      // Delete the edge
      const deleted = await edgeOperations.deleteEdge(
        'PURCHASED',
        createdPurchase.id,
        AGE_GRAPH_NAME
      );
      
      // Verify the deletion
      expect(deleted).toBe(true);
      
      // Verify the edge no longer exists
      const retrievedPurchase = await edgeOperations.getEdge(
        'PURCHASED',
        createdPurchase.id,
        AGE_GRAPH_NAME
      );
      
      expect(retrievedPurchase).toBeNull();
    });
    
    it('should find edges by properties', async () => {
      // Create multiple edges
      const purchases = [
        {
          date: new Date('2023-01-01'),
          quantity: 1,
          total: 99.99
        },
        {
          date: new Date('2023-01-15'),
          quantity: 2,
          total: 299.98
        }
      ];
      
      await edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product1,
        purchases[0],
        AGE_GRAPH_NAME
      );
      
      await edgeOperations.createEdge(
        'PURCHASED',
        person2,
        product2,
        purchases[1],
        AGE_GRAPH_NAME
      );
      
      // Find edges by property
      const largeQuantityPurchases = await edgeOperations.findEdges(
        'PURCHASED',
        { quantity: 2 },
        AGE_GRAPH_NAME
      );
      
      // Verify the results
      expect(largeQuantityPurchases).toHaveLength(1);
      expect(largeQuantityPurchases[0].properties.total).toBe(299.98);
      
      // Find edges by multiple properties
      const specificPurchase = await edgeOperations.findEdges(
        'PURCHASED',
        { quantity: 1, total: 99.99 },
        AGE_GRAPH_NAME
      );
      
      expect(specificPurchase).toHaveLength(1);
      expect(specificPurchase[0].fromId).toBe(person1.id);
      expect(specificPurchase[0].toId).toBe(product1.id);
    });
    
    it('should find edges by vertex IDs', async () => {
      // Create edges
      await edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product1,
        {
          date: new Date('2023-01-01'),
          quantity: 1,
          total: 99.99
        },
        AGE_GRAPH_NAME
      );
      
      await edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product2,
        {
          date: new Date('2023-01-15'),
          quantity: 1,
          total: 149.99
        },
        AGE_GRAPH_NAME
      );
      
      // Find edges by from vertex
      const person1Purchases = await edgeOperations.findEdgesByVertex(
        'PURCHASED',
        person1.id,
        'from',
        AGE_GRAPH_NAME
      );
      
      expect(person1Purchases).toHaveLength(2);
      
      // Find edges by to vertex
      const product1Purchases = await edgeOperations.findEdgesByVertex(
        'PURCHASED',
        product1.id,
        'to',
        AGE_GRAPH_NAME
      );
      
      expect(product1Purchases).toHaveLength(1);
      expect(product1Purchases[0].fromId).toBe(person1.id);
      
      // Find edges by both vertices
      const specificPurchase = await edgeOperations.findEdgesBetweenVertices(
        'PURCHASED',
        person1.id,
        product2.id,
        AGE_GRAPH_NAME
      );
      
      expect(specificPurchase).toHaveLength(1);
      expect(specificPurchase[0].properties.total).toBe(149.99);
    });
  });
  
  describe('Batch Edge Operations', () => {
    it('should create multiple edges in a batch', async () => {
      // Batch of edges
      const reviews = [
        {
          fromVertex: person1,
          toVertex: product1,
          properties: {
            date: new Date('2023-01-15'),
            rating: 5,
            comment: 'Excellent!'
          }
        },
        {
          fromVertex: person1,
          toVertex: product2,
          properties: {
            date: new Date('2023-01-20'),
            rating: 4,
            comment: 'Good but expensive'
          }
        },
        {
          fromVertex: person2,
          toVertex: product1,
          properties: {
            date: new Date('2023-01-25'),
            rating: 3,
            comment: 'Average'
          }
        }
      ];
      
      // Create edges in a batch
      const createdReviews = await edgeOperations.createEdgesBatch(
        'REVIEWED',
        reviews,
        AGE_GRAPH_NAME
      );
      
      // Verify the batch creation
      expect(createdReviews).toHaveLength(3);
      
      for (let i = 0; i < reviews.length; i++) {
        expect(createdReviews[i].label).toBe('REVIEWED');
        expect(createdReviews[i].fromId).toBe(reviews[i].fromVertex.id);
        expect(createdReviews[i].toId).toBe(reviews[i].toVertex.id);
        expect(createdReviews[i].properties).toMatchObject(reviews[i].properties);
      }
      
      // Verify in the database
      const retrievedReviews = await edgeOperations.findEdges(
        'REVIEWED',
        {},
        AGE_GRAPH_NAME
      );
      
      expect(retrievedReviews).toHaveLength(3);
    });
    
    it('should update multiple edges in a batch', async () => {
      // Create edges first
      const reviews = [
        {
          fromVertex: person1,
          toVertex: product1,
          properties: {
            date: new Date('2023-01-15'),
            rating: 3,
            comment: 'Initial review 1'
          }
        },
        {
          fromVertex: person2,
          toVertex: product2,
          properties: {
            date: new Date('2023-01-20'),
            rating: 3,
            comment: 'Initial review 2'
          }
        }
      ];
      
      const createdReviews = await edgeOperations.createEdgesBatch(
        'REVIEWED',
        reviews,
        AGE_GRAPH_NAME
      );
      
      // Update batch
      const updates = [
        {
          id: createdReviews[0].id,
          properties: {
            rating: 5,
            comment: 'Updated review 1'
          }
        },
        {
          id: createdReviews[1].id,
          properties: {
            rating: 4,
            comment: 'Updated review 2'
          }
        }
      ];
      
      const updatedReviews = await edgeOperations.updateEdgesBatch(
        'REVIEWED',
        updates,
        AGE_GRAPH_NAME
      );
      
      // Verify the batch update
      expect(updatedReviews).toHaveLength(2);
      expect(updatedReviews[0].properties.rating).toBe(5);
      expect(updatedReviews[0].properties.comment).toBe('Updated review 1');
      expect(updatedReviews[1].properties.rating).toBe(4);
      expect(updatedReviews[1].properties.comment).toBe('Updated review 2');
      
      // Verify in the database
      const highRatingReviews = await edgeOperations.findEdges(
        'REVIEWED',
        { rating: 5 },
        AGE_GRAPH_NAME
      );
      
      expect(highRatingReviews).toHaveLength(1);
      expect(highRatingReviews[0].properties.comment).toBe('Updated review 1');
    });
    
    it('should delete multiple edges in a batch', async () => {
      // Create edges first
      const purchases = [
        {
          fromVertex: person1,
          toVertex: product1,
          properties: {
            date: new Date('2023-01-01'),
            quantity: 1,
            total: 99.99
          }
        },
        {
          fromVertex: person2,
          toVertex: product1,
          properties: {
            date: new Date('2023-01-15'),
            quantity: 2,
            total: 199.98
          }
        },
        {
          fromVertex: person1,
          toVertex: product2,
          properties: {
            date: new Date('2023-01-20'),
            quantity: 1,
            total: 149.99
          }
        }
      ];
      
      const createdPurchases = await edgeOperations.createEdgesBatch(
        'PURCHASED',
        purchases,
        AGE_GRAPH_NAME
      );
      
      // Delete batch
      const deleteIds = [createdPurchases[0].id, createdPurchases[1].id];
      
      const deleteResult = await edgeOperations.deleteEdgesBatch(
        'PURCHASED',
        deleteIds,
        AGE_GRAPH_NAME
      );
      
      // Verify the batch deletion
      expect(deleteResult).toBe(true);
      
      // Verify in the database
      const remainingPurchases = await edgeOperations.findEdges(
        'PURCHASED',
        {},
        AGE_GRAPH_NAME
      );
      
      expect(remainingPurchases).toHaveLength(1);
      expect(remainingPurchases[0].toId).toBe(product2.id);
    });
  });
  
  describe('Property Constraints', () => {
    it('should enforce required properties', async () => {
      // Missing required quantity
      const invalidPurchase = {
        date: new Date('2023-01-01'),
        // Missing quantity
        total: 99.99
      };
      
      // Attempt to create with missing required property
      await expect(edgeOperations.createEdge(
        'PURCHASED',
        person1,
        product1,
        invalidPurchase,
        AGE_GRAPH_NAME
      )).rejects.toThrow();
    });
    
    it('should enforce property types', async () => {
      // Wrong type for rating (should be number)
      const invalidReview = {
        date: new Date('2023-01-15'),
        rating: 'five stars', // Should be a number
        comment: 'Great product!'
      };
      
      // Attempt to create with wrong property type
      await expect(edgeOperations.createEdge(
        'REVIEWED',
        person1,
        product1,
        invalidReview,
        AGE_GRAPH_NAME
      )).rejects.toThrow();
    });
    
    it('should enforce vertex label constraints', async () => {
      // Create an edge between incompatible vertices
      // PURCHASED should be from Person to Product, not Person to Person
      await expect(edgeOperations.createEdge(
        'PURCHASED',
        person1,
        person2, // Wrong vertex type
        {
          date: new Date('2023-01-01'),
          quantity: 1,
          total: 99.99
        },
        AGE_GRAPH_NAME
      )).rejects.toThrow();
    });
  });
});
