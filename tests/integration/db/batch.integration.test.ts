/**
 * Integration tests for batch operations
 * 
 * These tests verify batch operations for vertices and edges,
 * including performance with large datasets.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { EdgeOperations } from '../../../src/db/edge';
import { BatchOperations } from '../../../src/db/batch';
import { 
  connectionManager, 
  queryExecutor, 
  transactionManager,
  AGE_GRAPH_NAME, 
  loadSchemaFixture
} from '../../setup/integration';

describe('Batch Operations Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  let batchOperations: BatchOperations<SchemaDefinition>;
  
  beforeEach(async () => {
    // Load the basic schema
    basicSchema = loadSchemaFixture('basic-schema');
    
    // Create SQL generator
    sqlGenerator = new SQLGenerator(basicSchema);
    
    // Create operations
    vertexOperations = new VertexOperations(basicSchema, queryExecutor, sqlGenerator);
    edgeOperations = new EdgeOperations(basicSchema, queryExecutor, sqlGenerator);
    batchOperations = new BatchOperations(
      basicSchema,
      queryExecutor,
      sqlGenerator,
      vertexOperations,
      edgeOperations
    );
    
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
  
  describe('Batch Vertex Operations', () => {
    it('should create a large batch of vertices', async () => {
      // Create a large batch of vertices
      const batchSize = 100;
      const persons = Array(batchSize).fill(0).map((_, i) => ({
        name: `Person ${i}`,
        email: `person${i}@example.com`,
        age: 20 + (i % 50),
        active: i % 2 === 0
      }));
      
      // Create vertices in a batch
      const createdPersons = await batchOperations.createVerticesBatch(
        'Person',
        persons,
        { batchSize: 25 } // Use smaller chunks
      );
      
      // Verify the batch creation
      expect(createdPersons).toHaveLength(batchSize);
      
      for (let i = 0; i < batchSize; i++) {
        expect(createdPersons[i].label).toBe('Person');
        expect(createdPersons[i].properties.name).toBe(`Person ${i}`);
        expect(createdPersons[i].properties.email).toBe(`person${i}@example.com`);
      }
      
      // Verify in the database
      const retrievedPersons = await vertexOperations.findVertices(
        'Person',
        {},
        AGE_GRAPH_NAME
      );
      
      expect(retrievedPersons).toHaveLength(batchSize);
    });
    
    it('should handle batch operations with transactions', async () => {
      // Start a transaction
      const transaction = await transactionManager.beginTransaction();
      
      try {
        // Create vertices in a transaction
        const products = Array(10).fill(0).map((_, i) => ({
          name: `Product ${i}`,
          price: 10.99 + i * 5,
          sku: `SKU-${i.toString().padStart(3, '0')}`,
          inStock: i % 2 === 0
        }));
        
        const createdProducts = await batchOperations.createVerticesBatch(
          'Product',
          products,
          { transaction }
        );
        
        expect(createdProducts).toHaveLength(10);
        
        // Verify the vertices exist in the transaction
        const retrievedProducts = await vertexOperations.findVertices(
          'Product',
          {},
          AGE_GRAPH_NAME
        );
        
        expect(retrievedProducts).toHaveLength(10);
        
        // Rollback the transaction
        await transaction.rollback();
        
        // Verify the vertices no longer exist
        const productsAfterRollback = await vertexOperations.findVertices(
          'Product',
          {},
          AGE_GRAPH_NAME
        );
        
        expect(productsAfterRollback).toHaveLength(0);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
    
    it('should handle batch updates with optimistic concurrency', async () => {
      // Create initial vertices
      const products = Array(5).fill(0).map((_, i) => ({
        name: `Product ${i}`,
        price: 10.99 + i * 5,
        sku: `SKU-${i.toString().padStart(3, '0')}`,
        inStock: true
      }));
      
      const createdProducts = await batchOperations.createVerticesBatch(
        'Product',
        products
      );
      
      // Update the vertices with version check
      const updates = createdProducts.map(product => ({
        id: product.id,
        properties: {
          ...product.properties,
          price: product.properties.price * 1.1, // 10% price increase
          inStock: false
        },
        version: product.version // Include version for optimistic concurrency
      }));
      
      const updatedProducts = await batchOperations.updateVerticesBatch(
        'Product',
        updates,
        { optimisticConcurrency: true }
      );
      
      // Verify the updates
      expect(updatedProducts).toHaveLength(5);
      
      for (let i = 0; i < 5; i++) {
        expect(updatedProducts[i].properties.price).toBeCloseTo(products[i].price * 1.1, 2);
        expect(updatedProducts[i].properties.inStock).toBe(false);
        expect(updatedProducts[i].version).not.toBe(createdProducts[i].version);
      }
    });
  });
  
  describe('Batch Edge Operations', () => {
    let persons: any[];
    let products: any[];
    
    beforeEach(async () => {
      // Create test vertices
      persons = await batchOperations.createVerticesBatch(
        'Person',
        Array(5).fill(0).map((_, i) => ({
          name: `Person ${i}`,
          email: `person${i}@example.com`,
          age: 20 + i * 5,
          active: true
        }))
      );
      
      products = await batchOperations.createVerticesBatch(
        'Product',
        Array(5).fill(0).map((_, i) => ({
          name: `Product ${i}`,
          price: 10.99 + i * 10,
          sku: `SKU-${i.toString().padStart(3, '0')}`,
          inStock: true
        }))
      );
    });
    
    it('should create a batch of edges', async () => {
      // Create a batch of purchase edges
      const purchases = [];
      
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 2; j++) {
          purchases.push({
            fromVertex: persons[i],
            toVertex: products[j],
            properties: {
              date: new Date(2023, 0, i + 1),
              quantity: j + 1,
              total: (j + 1) * products[j].properties.price
            }
          });
        }
      }
      
      // Create edges in a batch
      const createdPurchases = await batchOperations.createEdgesBatch(
        'PURCHASED',
        purchases
      );
      
      // Verify the batch creation
      expect(createdPurchases).toHaveLength(10);
      
      // Verify in the database
      const retrievedPurchases = await edgeOperations.findEdges(
        'PURCHASED',
        {},
        AGE_GRAPH_NAME
      );
      
      expect(retrievedPurchases).toHaveLength(10);
    });
    
    it('should handle batch edge operations with chunking', async () => {
      // Create a large batch of review edges
      const reviews = [];
      
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          reviews.push({
            fromVertex: persons[i],
            toVertex: products[j],
            properties: {
              date: new Date(2023, 0, i + j + 1),
              rating: 1 + (i + j) % 5,
              comment: `Review from Person ${i} for Product ${j}`
            }
          });
        }
      }
      
      // Create edges in a batch with chunking
      const createdReviews = await batchOperations.createEdgesBatch(
        'REVIEWED',
        reviews,
        { batchSize: 10 }
      );
      
      // Verify the batch creation
      expect(createdReviews).toHaveLength(25);
      
      // Verify in the database
      const highRatingReviews = await edgeOperations.findEdges(
        'REVIEWED',
        { rating: 5 },
        AGE_GRAPH_NAME
      );
      
      expect(highRatingReviews.length).toBeGreaterThan(0);
    });
    
    it('should handle batch edge updates', async () => {
      // Create initial edges
      const purchases = [];
      
      for (let i = 0; i < 3; i++) {
        purchases.push({
          fromVertex: persons[i],
          toVertex: products[i],
          properties: {
            date: new Date(2023, 0, i + 1),
            quantity: 1,
            total: products[i].properties.price
          }
        });
      }
      
      const createdPurchases = await batchOperations.createEdgesBatch(
        'PURCHASED',
        purchases
      );
      
      // Update the edges
      const updates = createdPurchases.map(purchase => ({
        id: purchase.id,
        properties: {
          ...purchase.properties,
          quantity: 2,
          total: purchase.properties.total * 2
        }
      }));
      
      const updatedPurchases = await batchOperations.updateEdgesBatch(
        'PURCHASED',
        updates
      );
      
      // Verify the updates
      expect(updatedPurchases).toHaveLength(3);
      
      for (let i = 0; i < 3; i++) {
        expect(updatedPurchases[i].properties.quantity).toBe(2);
        expect(updatedPurchases[i].properties.total).toBeCloseTo(purchases[i].properties.total * 2, 2);
      }
    });
  });
  
  describe('Performance Metrics', () => {
    it('should track performance metrics for batch operations', async () => {
      // Create a batch of vertices with performance tracking
      const persons = Array(50).fill(0).map((_, i) => ({
        name: `Person ${i}`,
        email: `person${i}@example.com`,
        age: 20 + (i % 50),
        active: i % 2 === 0
      }));
      
      const options = {
        batchSize: 10,
        trackPerformance: true
      };
      
      const result = await batchOperations.createVerticesBatch(
        'Person',
        persons,
        options
      );
      
      // Verify the result
      expect(result).toHaveLength(50);
      
      // Verify performance metrics
      const metrics = batchOperations.getLastOperationMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalDuration).toBeGreaterThan(0);
      expect(metrics.batchCount).toBe(5); // 50 items with batch size 10
      expect(metrics.itemCount).toBe(50);
      expect(metrics.averageBatchDuration).toBeGreaterThan(0);
      expect(metrics.averageItemDuration).toBeGreaterThan(0);
    });
  });
});
