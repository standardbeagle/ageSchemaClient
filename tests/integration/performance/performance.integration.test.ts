/**
 * Integration tests for performance with large datasets
 *
 * These tests verify performance with large datasets.
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

describe('Performance Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  let batchOperations: BatchOperations<SchemaDefinition>;

  let ageAvailable = false;

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

    // Check if AGE is available
    try {
      await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.age_version()`);
      ageAvailable = true;

      // Clear existing data
      try {
        await queryExecutor.executeCypher(
          `MATCH (n) DETACH DELETE n`,
          {},
          AGE_GRAPH_NAME
        );
      } catch (error) {
        console.warn(`Warning: Could not clear graph data: ${error.message}`);
      }
    } catch (error) {
      ageAvailable = false;
      console.warn('AGE extension not available, skipping AGE-dependent tests');
    }
  });

  /**
   * Create a large dataset for performance testing
   *
   * @param personCount - Number of persons to create
   * @param productCount - Number of products to create
   * @param purchaseCount - Number of purchases to create
   * @param reviewCount - Number of reviews to create
   */
  async function createLargeDataset(
    personCount: number,
    productCount: number,
    purchaseCount: number,
    reviewCount: number
  ) {
    console.log(`Creating large dataset: ${personCount} persons, ${productCount} products, ${purchaseCount} purchases, ${reviewCount} reviews`);

    const startTime = Date.now();

    // Create persons
    const personData = Array(personCount).fill(0).map((_, i) => ({
      name: `Person ${i}`,
      email: `person${i}@example.com`,
      age: 20 + (i % 50),
      active: i % 2 === 0
    }));

    const persons = await batchOperations.createVerticesBatch(
      'Person',
      personData,
      { batchSize: 100 }
    );

    console.log(`Created ${persons.length} persons in ${Date.now() - startTime}ms`);

    // Create products
    const productStartTime = Date.now();

    const productData = Array(productCount).fill(0).map((_, i) => ({
      name: `Product ${i}`,
      price: 10 + (i % 90) * 10,
      sku: `SKU-${i.toString().padStart(5, '0')}`,
      inStock: i % 5 !== 0 // 80% in stock
    }));

    const products = await batchOperations.createVerticesBatch(
      'Product',
      productData,
      { batchSize: 100 }
    );

    console.log(`Created ${products.length} products in ${Date.now() - productStartTime}ms`);

    // Create purchases
    const purchaseStartTime = Date.now();

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
      { batchSize: 100 }
    );

    console.log(`Created ${purchases.length} purchases in ${Date.now() - purchaseStartTime}ms`);

    // Create reviews
    const reviewStartTime = Date.now();

    const reviews = [];

    for (let i = 0; i < reviewCount; i++) {
      const personIndex = i % personCount;
      const productIndex = i % productCount;

      reviews.push({
        fromVertex: persons[personIndex],
        toVertex: products[productIndex],
        properties: {
          date: new Date(2023, 0, 15 + (i % 365)),
          rating: 1 + (i % 5),
          comment: `Review ${i} from Person ${personIndex} for Product ${productIndex}`
        }
      });
    }

    await batchOperations.createEdgesBatch(
      'REVIEWED',
      reviews,
      { batchSize: 100 }
    );

    console.log(`Created ${reviews.length} reviews in ${Date.now() - reviewStartTime}ms`);
    console.log(`Total dataset creation time: ${Date.now() - startTime}ms`);

    return {
      persons,
      products,
      purchaseCount,
      reviewCount
    };
  }

  describe('Large Dataset Performance', () => {
    it('should handle large batch operations efficiently', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping large batch operations test: AGE not available');
        return;
      }

      try {
        // Create a medium-sized dataset
        // 200 persons, 100 products, 500 purchases, 300 reviews
        await createLargeDataset(200, 100, 500, 300);

        // Measure query execution time for a complex query
        const startTime = Date.now();

        // Execute a complex query with multiple joins and aggregations
        const result = await queryExecutor.executeCypher(
          `
          MATCH (p:Person)-[purchase:PURCHASED]->(product:Product)
          WHERE product.price > 50 AND product.inStock = true
          WITH p, count(purchase) AS purchaseCount, sum(purchase.total) AS totalSpent

          MATCH (p)-[review:REVIEWED]->(reviewedProduct:Product)
          WHERE review.rating >= 4

          RETURN
            p.name AS personName,
            purchaseCount,
            totalSpent,
            count(review) AS highRatingReviews,
            collect(reviewedProduct.name) AS highlyRatedProducts
          ORDER BY totalSpent DESC
          LIMIT 10
          `,
          {},
          AGE_GRAPH_NAME
        );

        const executionTime = Date.now() - startTime;

        // Verify the result
        expect(result.rows.length).toBeGreaterThan(0);
        expect(result.rows.length).toBeLessThanOrEqual(10);

        // Log performance metrics
        console.log(`Complex query executed in ${executionTime}ms`);
        console.log(`Returned ${result.rows.length} results`);

        // The query should complete in a reasonable time
        expect(executionTime).toBeLessThan(10000); // 10 seconds max
      } catch (error) {
        console.error('Error in large batch operations test:', error.message);
        throw error;
      }
    });

    it('should handle parallel query execution efficiently', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping parallel query execution test: AGE not available');
        return;
      }

      try {
        // Create a medium-sized dataset
        // 100 persons, 50 products, 200 purchases, 150 reviews
        await createLargeDataset(100, 50, 200, 150);

        // Define multiple queries to execute in parallel
        const queries = [
          // Query 1: Top 5 persons by purchase amount
          queryExecutor.executeCypher(
            `
            MATCH (p:Person)-[purchase:PURCHASED]->(product:Product)
            RETURN
              p.name AS personName,
              count(purchase) AS purchaseCount,
              sum(purchase.total) AS totalSpent
            ORDER BY totalSpent DESC
            LIMIT 5
            `,
            {},
            AGE_GRAPH_NAME
          ),

          // Query 2: Top 5 products by rating
          queryExecutor.executeCypher(
            `
            MATCH (p:Person)-[review:REVIEWED]->(product:Product)
            RETURN
              product.name AS productName,
              avg(review.rating) AS avgRating,
              count(review) AS reviewCount
            ORDER BY avgRating DESC, reviewCount DESC
            LIMIT 5
            `,
            {},
            AGE_GRAPH_NAME
          ),

          // Query 3: Persons who both purchased and reviewed the same product
          queryExecutor.executeCypher(
            `
            MATCH (p:Person)-[:PURCHASED]->(product:Product)<-[:REVIEWED]-(p)
            RETURN
              p.name AS personName,
              count(product) AS productCount,
              collect(product.name) AS products
            ORDER BY productCount DESC
            LIMIT 5
            `,
            {},
            AGE_GRAPH_NAME
          ),

          // Query 4: Products with no reviews
          queryExecutor.executeCypher(
            `
            MATCH (product:Product)
            WHERE NOT (product)<-[:REVIEWED]-()
            RETURN
              product.name AS productName,
              product.price AS price,
              product.inStock AS inStock
            ORDER BY price DESC
            LIMIT 5
            `,
            {},
            AGE_GRAPH_NAME
          ),

          // Query 5: Persons with no purchases
          queryExecutor.executeCypher(
            `
            MATCH (p:Person)
            WHERE NOT (p)-[:PURCHASED]->()
            RETURN
              p.name AS personName,
              p.email AS email,
              p.age AS age
            ORDER BY age DESC
            LIMIT 5
            `,
            {},
            AGE_GRAPH_NAME
          )
        ];

        // Execute queries in parallel
        const startTime = Date.now();
        const results = await Promise.all(queries);
        const executionTime = Date.now() - startTime;

        // Verify the results
        for (const result of results) {
          expect(result.rows).toBeDefined();
        }

        // Log performance metrics
        console.log(`Parallel queries executed in ${executionTime}ms`);
        console.log(`Average time per query: ${executionTime / queries.length}ms`);

        // The queries should complete in a reasonable time
        expect(executionTime).toBeLessThan(15000); // 15 seconds max
      } catch (error) {
        console.error('Error in parallel query execution test:', error.message);
        throw error;
      }
    });
  });

  describe('Query Optimization', () => {
    it('should optimize queries with parameterization', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping query parameterization test: AGE not available');
        return;
      }

      try {
        // Create a small dataset
        await createLargeDataset(50, 25, 100, 75);

        // Execute a non-parameterized query
        const nonParamStartTime = Date.now();

        await queryExecutor.executeCypher(
          `
          MATCH (p:Person)
          WHERE p.name = 'Person 10'
          RETURN p
          `,
          {},
          AGE_GRAPH_NAME
        );

        const nonParamTime = Date.now() - nonParamStartTime;

        // Execute a parameterized query
        const paramStartTime = Date.now();

        await queryExecutor.executeCypher(
          `
          MATCH (p:Person)
          WHERE p.name = $name
          RETURN p
          `,
          { name: 'Person 10' },
          AGE_GRAPH_NAME
        );

        const paramTime = Date.now() - paramStartTime;

        // Log performance metrics
        console.log(`Non-parameterized query: ${nonParamTime}ms`);
        console.log(`Parameterized query: ${paramTime}ms`);

        // The second execution might be faster due to caching
        // but we're mainly checking that parameterization works
      } catch (error) {
        console.error('Error in query parameterization test:', error.message);
        throw error;
      }
    });

    it('should optimize queries with transactions', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping transaction optimization test: AGE not available');
        return;
      }

      try {
        // Create a small dataset
        await createLargeDataset(50, 25, 100, 75);

        // Execute multiple queries without a transaction
        const noTxStartTime = Date.now();

        await queryExecutor.executeCypher(
          `MATCH (p:Person) WHERE p.age > 30 RETURN p LIMIT 10`,
          {},
          AGE_GRAPH_NAME
        );

        await queryExecutor.executeCypher(
          `MATCH (p:Product) WHERE p.price > 50 RETURN p LIMIT 10`,
          {},
          AGE_GRAPH_NAME
        );

        await queryExecutor.executeCypher(
          `MATCH (p:Person)-[purchase:PURCHASED]->(product:Product) RETURN p, purchase, product LIMIT 10`,
          {},
          AGE_GRAPH_NAME
        );

        const noTxTime = Date.now() - noTxStartTime;

        // Execute multiple queries in a transaction
        const txStartTime = Date.now();

        const transaction = await transactionManager.beginTransaction();

        try {
          await queryExecutor.executeCypher(
            `MATCH (p:Person) WHERE p.age > 30 RETURN p LIMIT 10`,
            {},
            AGE_GRAPH_NAME,
            { transaction }
          );

          await queryExecutor.executeCypher(
            `MATCH (p:Product) WHERE p.price > 50 RETURN p LIMIT 10`,
            {},
            AGE_GRAPH_NAME,
            { transaction }
          );

          await queryExecutor.executeCypher(
            `MATCH (p:Person)-[purchase:PURCHASED]->(product:Product) RETURN p, purchase, product LIMIT 10`,
            {},
            AGE_GRAPH_NAME,
            { transaction }
          );

          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          throw error;
        }

        const txTime = Date.now() - txStartTime;

        // Log performance metrics
        console.log(`Queries without transaction: ${noTxTime}ms`);
        console.log(`Queries with transaction: ${txTime}ms`);

        // Transactions may have overhead for small operations
        // but should be more efficient for larger operations
      } catch (error) {
        console.error('Error in transaction optimization test:', error.message);
        throw error;
      }
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle multiple concurrent operations efficiently', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping concurrent operations test: AGE not available');
        return;
      }

      try {
        // Create a small dataset
        await createLargeDataset(50, 25, 100, 75);

        // Define multiple operations to execute concurrently
        const operations = [];

        // Add vertex creation operations
        for (let i = 0; i < 20; i++) {
          operations.push(
            vertexOperations.createVertex(
              'Person',
              {
                name: `Concurrent Person ${i}`,
                email: `concurrent${i}@example.com`,
                age: 20 + i,
                active: i % 2 === 0
              },
              AGE_GRAPH_NAME
            )
          );
        }

        // Add vertex query operations
        for (let i = 0; i < 20; i++) {
          operations.push(
            vertexOperations.findVertices(
              'Person',
              { active: i % 2 === 0 },
              AGE_GRAPH_NAME
            )
          );
        }

        // Execute operations concurrently
        const startTime = Date.now();
        const results = await Promise.all(operations);
        const executionTime = Date.now() - startTime;

        // Verify the results
        for (const result of results) {
          expect(result).toBeDefined();
        }

        // Log performance metrics
        console.log(`Concurrent operations executed in ${executionTime}ms`);
        console.log(`Average time per operation: ${executionTime / operations.length}ms`);

        // The operations should complete in a reasonable time
        expect(executionTime).toBeLessThan(10000); // 10 seconds max
      } catch (error) {
        console.error('Error in concurrent operations test:', error.message);
        throw error;
      }
    });
  });
});
