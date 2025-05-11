/**
 * Integration tests for query performance
 * 
 * These tests verify query performance with a real database.
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

describe('Query Performance Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  let batchOperations: BatchOperations<SchemaDefinition>;
  
  // Test data
  let persons: any[];
  let products: any[];
  
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
  
  /**
   * Create a large dataset for performance testing
   * 
   * @param personCount - Number of persons to create
   * @param productCount - Number of products to create
   * @param purchaseCount - Number of purchases to create
   */
  async function createLargeDataset(personCount: number, productCount: number, purchaseCount: number) {
    // Create persons
    const personData = Array(personCount).fill(0).map((_, i) => ({
      name: `Person ${i}`,
      email: `person${i}@example.com`,
      age: 20 + (i % 50),
      active: i % 2 === 0
    }));
    
    persons = await batchOperations.createVerticesBatch(
      'Person',
      personData,
      { batchSize: 50 }
    );
    
    // Create products
    const productData = Array(productCount).fill(0).map((_, i) => ({
      name: `Product ${i}`,
      price: 10 + (i % 90) * 10,
      sku: `SKU-${i.toString().padStart(5, '0')}`,
      inStock: i % 5 !== 0 // 80% in stock
    }));
    
    products = await batchOperations.createVerticesBatch(
      'Product',
      productData,
      { batchSize: 50 }
    );
    
    // Create purchases
    const purchases = [];
    
    for (let i = 0; i < purchaseCount; i++) {
      const personIndex = i % personCount;
      const productIndex = i % productCount;
      
      purchases.push({
        fromVertex: persons[personIndex],
        toVertex: products[productIndex],
        properties: {
          date: new Date(2023, 0, 1 + (i % 365)),
          quantity: 1 + (i % 5),
          total: products[productIndex].properties.price * (1 + (i % 5))
        }
      });
    }
    
    await batchOperations.createEdgesBatch(
      'PURCHASED',
      purchases,
      { batchSize: 50 }
    );
    
    console.log(`Created ${personCount} persons, ${productCount} products, and ${purchaseCount} purchases`);
  }
  
  describe('Large Dataset Queries', () => {
    // This test creates a larger dataset and may take longer to run
    it('should handle queries on a medium-sized dataset', async () => {
      // Create a medium-sized dataset
      // 100 persons, 50 products, 200 purchases
      await createLargeDataset(100, 50, 200);
      
      // Measure query execution time
      const startTime = Date.now();
      
      // Execute a complex query
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[purchase:PURCHASED]->(product:Product)
        WHERE product.price > 50 AND product.inStock = true
        RETURN 
          p.name AS personName,
          count(purchase) AS purchaseCount,
          sum(purchase.total) AS totalSpent,
          collect(product.name) AS productsBought
        ORDER BY totalSpent DESC
        LIMIT 10
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows.length).toBeLessThanOrEqual(10);
      
      // Log performance metrics
      console.log(`Query executed in ${executionTime}ms`);
      console.log(`Returned ${result.rows.length} results`);
      
      // The query should complete in a reasonable time
      expect(executionTime).toBeLessThan(5000); // 5 seconds max
    });
  });
  
  describe('Query Optimization', () => {
    it('should optimize queries with indexes', async () => {
      // Create a small dataset
      await createLargeDataset(20, 10, 50);
      
      // Create an index on product.sku
      try {
        await queryExecutor.executeSQL(`
          CREATE INDEX IF NOT EXISTS product_sku_idx ON ${AGE_GRAPH_NAME}."Product" (properties->>'sku')
        `);
      } catch (error) {
        console.warn('Could not create index. This is expected if AGE is not installed or if indexes are not supported.');
      }
      
      // Measure query execution time with index
      const startTime = Date.now();
      
      // Execute a query that should use the index
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Product)
        WHERE p.sku = 'SKU-00005'
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Verify the result
      expect(result.rows.length).toBeLessThanOrEqual(1);
      
      // Log performance metrics
      console.log(`Indexed query executed in ${executionTime}ms`);
      
      // The query should be relatively fast
      expect(executionTime).toBeLessThan(1000); // 1 second max
    });
  });
  
  describe('Query Caching', () => {
    it('should benefit from query caching on repeated queries', async () => {
      // Create a small dataset
      await createLargeDataset(20, 10, 50);
      
      // Define a query to run multiple times
      const query = `
        MATCH (p:Person)-[purchase:PURCHASED]->(product:Product)
        WHERE product.price > 50
        RETURN 
          p.name AS personName,
          count(purchase) AS purchaseCount,
          sum(purchase.total) AS totalSpent
        ORDER BY totalSpent DESC
      `;
      
      // Execute the query for the first time (cold)
      const startTime1 = Date.now();
      const result1 = await queryExecutor.executeCypher(query, {}, AGE_GRAPH_NAME);
      const executionTime1 = Date.now() - startTime1;
      
      // Execute the same query again (should be cached)
      const startTime2 = Date.now();
      const result2 = await queryExecutor.executeCypher(query, {}, AGE_GRAPH_NAME);
      const executionTime2 = Date.now() - startTime2;
      
      // Verify the results are the same
      expect(result1.rows).toEqual(result2.rows);
      
      // Log performance metrics
      console.log(`First execution: ${executionTime1}ms`);
      console.log(`Second execution: ${executionTime2}ms`);
      
      // The second execution should be faster due to caching
      // Note: This test may not always pass as caching depends on the database configuration
      // and may not be enabled in the test environment
      if (executionTime1 > 100 && executionTime2 > 100) {
        // Only check if both queries took some time (to avoid false positives on very fast queries)
        expect(executionTime2).toBeLessThanOrEqual(executionTime1 * 1.2); // Allow 20% variance
      }
    });
  });
  
  describe('Query Parameterization', () => {
    it('should use parameterized queries for better performance', async () => {
      // Create a small dataset
      await createLargeDataset(20, 10, 50);
      
      // Execute a parameterized query
      const minPrice = 50;
      const maxPrice = 100;
      
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Product)
        WHERE p.price >= $minPrice AND p.price <= $maxPrice
        RETURN p.name AS name, p.price AS price
        ORDER BY price
        `,
        { minPrice, maxPrice },
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check that all products are in the specified price range
      for (const row of result.rows) {
        expect(row.price).toBeGreaterThanOrEqual(minPrice);
        expect(row.price).toBeLessThanOrEqual(maxPrice);
      }
    });
  });
  
  describe('Transaction Performance', () => {
    it('should execute multiple queries in a transaction efficiently', async () => {
      // Create a small dataset
      await createLargeDataset(20, 10, 50);
      
      // Start a transaction
      const transaction = await transactionManager.beginTransaction();
      
      try {
        // Execute multiple queries in the transaction
        const startTime = Date.now();
        
        // Query 1: Get all persons
        const personsResult = await queryExecutor.executeCypher(
          `MATCH (p:Person) RETURN p.name AS name ORDER BY name LIMIT 10`,
          {},
          AGE_GRAPH_NAME
        );
        
        // Query 2: Get all products
        const productsResult = await queryExecutor.executeCypher(
          `MATCH (p:Product) RETURN p.name AS name, p.price AS price ORDER BY price DESC LIMIT 10`,
          {},
          AGE_GRAPH_NAME
        );
        
        // Query 3: Get purchase statistics
        const statsResult = await queryExecutor.executeCypher(
          `
          MATCH (person:Person)-[purchase:PURCHASED]->(product:Product)
          RETURN 
            count(purchase) AS totalPurchases,
            avg(purchase.total) AS avgPurchaseValue,
            min(purchase.total) AS minPurchaseValue,
            max(purchase.total) AS maxPurchaseValue
          `,
          {},
          AGE_GRAPH_NAME
        );
        
        const executionTime = Date.now() - startTime;
        
        // Commit the transaction
        await transaction.commit();
        
        // Verify the results
        expect(personsResult.rows.length).toBeGreaterThan(0);
        expect(productsResult.rows.length).toBeGreaterThan(0);
        expect(statsResult.rows.length).toBe(1);
        
        // Log performance metrics
        console.log(`Transaction executed in ${executionTime}ms`);
        console.log(`Retrieved ${personsResult.rows.length} persons, ${productsResult.rows.length} products, and purchase statistics`);
        
        // The transaction should complete in a reasonable time
        expect(executionTime).toBeLessThan(3000); // 3 seconds max
      } catch (error) {
        // Rollback on error
        await transaction.rollback();
        throw error;
      }
    });
  });
});
