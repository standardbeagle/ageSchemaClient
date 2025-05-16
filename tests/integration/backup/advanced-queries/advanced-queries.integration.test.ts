/**
 * Integration tests for advanced query features
 *
 * These tests verify that the query builder can generate and execute
 * complex queries with advanced AGE syntax features.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { EdgeOperations } from '../../../src/db/edge';
import { BatchOperations } from '../../../src/db/batch';
import { QueryBuilder } from '../../../src/query/builder';
import { AnalyticsQueryBuilder } from '../../../src/query/analytics';
import {
  connectionManager,
  queryExecutor,
  transactionManager,
  AGE_GRAPH_NAME,
  loadSchemaFixture
} from '../../setup/integration';

describe('Advanced Query Features Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  let batchOperations: BatchOperations<SchemaDefinition>;
  let queryBuilder: QueryBuilder<SchemaDefinition>;
  let analyticsQueryBuilder: AnalyticsQueryBuilder<SchemaDefinition>;

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

    // Create query builders
    queryBuilder = new QueryBuilder(basicSchema, queryExecutor, AGE_GRAPH_NAME);
    analyticsQueryBuilder = new AnalyticsQueryBuilder(basicSchema, queryExecutor, AGE_GRAPH_NAME);

    // Check if AGE is available
    try {
      await queryExecutor.executeSQL(`
        SELECT COUNT(*) > 0 as age_available
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'ag_catalog' AND p.proname = 'create_graph'
      `);
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

      // Create test data
      await createTestData();
    } catch (error) {
      ageAvailable = false;
      console.warn('AGE extension not available, skipping AGE-dependent tests');
    }
  });

  /**
   * Create test data for advanced query tests
   */
  async function createTestData() {
    // Create persons
    const personData = [
      { name: 'Alice', age: 30, email: 'alice@example.com', active: true },
      { name: 'Bob', age: 25, email: 'bob@example.com', active: true },
      { name: 'Charlie', age: 35, email: 'charlie@example.com', active: false },
      { name: 'Diana', age: 28, email: 'diana@example.com', active: true },
      { name: 'Eve', age: 40, email: 'eve@example.com', active: false }
    ];

    const persons = await batchOperations.createVerticesBatch(
      'Person',
      personData
    );

    // Create products
    const productData = [
      { name: 'Laptop', price: 1200, sku: 'TECH-001', inStock: true },
      { name: 'Phone', price: 800, sku: 'TECH-002', inStock: true },
      { name: 'Headphones', price: 200, sku: 'TECH-003', inStock: true },
      { name: 'Monitor', price: 300, sku: 'TECH-004', inStock: false },
      { name: 'Keyboard', price: 100, sku: 'TECH-005', inStock: true }
    ];

    const products = await batchOperations.createVerticesBatch(
      'Product',
      productData
    );

    // Create purchases
    const purchases = [
      {
        fromVertex: persons[0], // Alice
        toVertex: products[0], // Laptop
        properties: {
          date: new Date(2023, 0, 15),
          quantity: 1,
          total: 1200
        }
      },
      {
        fromVertex: persons[0], // Alice
        toVertex: products[2], // Headphones
        properties: {
          date: new Date(2023, 1, 20),
          quantity: 1,
          total: 200
        }
      },
      {
        fromVertex: persons[1], // Bob
        toVertex: products[1], // Phone
        properties: {
          date: new Date(2023, 2, 10),
          quantity: 1,
          total: 800
        }
      },
      {
        fromVertex: persons[2], // Charlie
        toVertex: products[3], // Monitor
        properties: {
          date: new Date(2023, 3, 5),
          quantity: 2,
          total: 600
        }
      },
      {
        fromVertex: persons[3], // Diana
        toVertex: products[4], // Keyboard
        properties: {
          date: new Date(2023, 4, 12),
          quantity: 1,
          total: 100
        }
      }
    ];

    await batchOperations.createEdgesBatch(
      'PURCHASED',
      purchases
    );

    // Create reviews
    const reviews = [
      {
        fromVertex: persons[0], // Alice
        toVertex: products[0], // Laptop
        properties: {
          date: new Date(2023, 0, 20),
          rating: 5,
          comment: 'Great laptop!'
        }
      },
      {
        fromVertex: persons[0], // Alice
        toVertex: products[2], // Headphones
        properties: {
          date: new Date(2023, 1, 25),
          rating: 4,
          comment: 'Good sound quality'
        }
      },
      {
        fromVertex: persons[1], // Bob
        toVertex: products[1], // Phone
        properties: {
          date: new Date(2023, 2, 15),
          rating: 3,
          comment: 'Decent phone'
        }
      },
      {
        fromVertex: persons[2], // Charlie
        toVertex: products[0], // Laptop
        properties: {
          date: new Date(2023, 1, 10),
          rating: 5,
          comment: 'Excellent performance'
        }
      },
      {
        fromVertex: persons[3], // Diana
        toVertex: products[4], // Keyboard
        properties: {
          date: new Date(2023, 4, 15),
          rating: 2,
          comment: 'Keys are too stiff'
        }
      }
    ];

    await batchOperations.createEdgesBatch(
      'REVIEWED',
      reviews
    );

    return { persons, products };
  }

  describe('Aggregation Functions', () => {
    it('should execute COUNT aggregation', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping COUNT aggregation test: AGE not available');
        return;
      }

      const result = await analyticsQueryBuilder
        .match('Person', 'p')
        .count('p', 'personCount')
        .execute();

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].personCount).toBe(5);
    });

    it('should execute SUM aggregation', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping SUM aggregation test: AGE not available');
        return;
      }

      const result = await analyticsQueryBuilder
        .match('Product', 'p')
        .sum('p.price', 'totalPrice')
        .execute();

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].totalPrice).toBe(2600); // Sum of all product prices
    });

    it('should execute AVG aggregation', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping AVG aggregation test: AGE not available');
        return;
      }

      const result = await analyticsQueryBuilder
        .match('Person', 'p')
        .avg('p.age', 'averageAge')
        .execute();

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].averageAge).toBe(31.6); // (30+25+35+28+40)/5 = 31.6
    });

    it('should execute MIN and MAX aggregations', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping MIN/MAX aggregation test: AGE not available');
        return;
      }

      const minResult = await analyticsQueryBuilder
        .match('Product', 'p')
        .min('p.price', 'minPrice')
        .execute();

      expect(minResult.rows.length).toBe(1);
      expect(minResult.rows[0].minPrice).toBe(100); // Keyboard price

      const maxResult = await analyticsQueryBuilder
        .match('Product', 'p')
        .max('p.price', 'maxPrice')
        .execute();

      expect(maxResult.rows.length).toBe(1);
      expect(maxResult.rows[0].maxPrice).toBe(1200); // Laptop price
    });

    it('should execute COLLECT aggregation', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping COLLECT aggregation test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        RETURN collect(p.name) AS names
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].names).toBeInstanceOf(Array);
      expect(result.rows[0].names.length).toBe(5);
      expect(result.rows[0].names).toContain('Alice');
      expect(result.rows[0].names).toContain('Bob');
    });
  });

  describe('ORDER BY Clause', () => {
    it('should execute query with ORDER BY (single field)', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping ORDER BY test: AGE not available');
        return;
      }

      const result = await queryBuilder
        .match('Person', 'p')
        .return('p.name', 'p.age')
        .orderBy('p.age')
        .execute();

      expect(result.rows.length).toBe(5);
      expect(result.rows[0].p.age).toBe(25); // Bob (youngest)
      expect(result.rows[4].p.age).toBe(40); // Eve (oldest)
    });

    it('should execute query with ORDER BY DESC', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping ORDER BY DESC test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        RETURN p.name, p.age
        ORDER BY p.age DESC
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(5);
      expect(result.rows[0].p.age).toBe(40); // Eve (oldest)
      expect(result.rows[4].p.age).toBe(25); // Bob (youngest)
    });

    it('should execute query with multiple ORDER BY fields', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping multiple ORDER BY test: AGE not available');
        return;
      }

      // First create some test data with same ages
      await vertexOperations.createVertex(
        'Person',
        { name: 'Frank', age: 30, email: 'frank@example.com', active: true },
        AGE_GRAPH_NAME
      );

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        RETURN p.name, p.age
        ORDER BY p.age ASC, p.name ASC
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(6);

      // Check that Alice and Frank (both age 30) are ordered by name
      const age30Persons = result.rows.filter(row => row.p.age === 30);
      expect(age30Persons.length).toBe(2);
      expect(age30Persons[0].p.name).toBe('Alice');
      expect(age30Persons[1].p.name).toBe('Frank');
    });
  });

  describe('WITH Clause', () => {
    it('should execute query with WITH for query composition', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping WITH clause test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        WITH p
        WHERE p.age > 30
        RETURN p.name, p.age
        ORDER BY p.age
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].p.name).toBe('Charlie');
      expect(result.rows[1].p.name).toBe('Eve');
    });

    it('should execute query with WITH for aggregation', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping WITH aggregation test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[purchase:PURCHASED]->(product:Product)
        WITH p, count(purchase) AS purchaseCount, sum(purchase.total) AS totalSpent
        WHERE purchaseCount > 0
        RETURN p.name, purchaseCount, totalSpent
        ORDER BY totalSpent DESC
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(4);
      expect(result.rows[0].p.name).toBe('Alice'); // Alice spent the most (1400)
      expect(result.rows[0].totalSpent).toBe(1400);
      expect(result.rows[0].purchaseCount).toBe(2);
    });
  });

  describe('SKIP and LIMIT', () => {
    it('should execute query with LIMIT', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping LIMIT test: AGE not available');
        return;
      }

      const result = await queryBuilder
        .match('Person', 'p')
        .return('p.name', 'p.age')
        .orderBy('p.age')
        .limit(3)
        .execute();

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].p.age).toBe(25); // Bob
      expect(result.rows[1].p.age).toBe(28); // Diana
      expect(result.rows[2].p.age).toBe(30); // Alice
    });

    it('should execute query with SKIP', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping SKIP test: AGE not available');
        return;
      }

      const result = await queryBuilder
        .match('Person', 'p')
        .return('p.name', 'p.age')
        .orderBy('p.age')
        .skip(2)
        .execute();

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].p.age).toBe(30); // Alice
      expect(result.rows[1].p.age).toBe(35); // Charlie
      expect(result.rows[2].p.age).toBe(40); // Eve
    });

    it('should execute query with SKIP and LIMIT for pagination', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping SKIP and LIMIT test: AGE not available');
        return;
      }

      const result = await queryBuilder
        .match('Person', 'p')
        .return('p.name', 'p.age')
        .orderBy('p.age')
        .skip(1)
        .limit(2)
        .execute();

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].p.age).toBe(28); // Diana
      expect(result.rows[1].p.age).toBe(30); // Alice
    });
  });

  describe('UNWIND Clause', () => {
    it('should execute query with UNWIND for array expansion', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping UNWIND test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        WITH [1, 2, 3, 4, 5] AS numbers
        UNWIND numbers AS number
        RETURN number
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(result.rows[i].number).toBe(i + 1);
      }
    });

    it('should execute query with UNWIND for data processing', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping UNWIND data processing test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[r:REVIEWED]->(product:Product)
        WITH collect({person: p.name, product: product.name, rating: r.rating}) AS reviews
        UNWIND reviews AS review
        RETURN review.person, review.product, review.rating
        ORDER BY review.rating DESC
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBe(5);
      expect(result.rows[0].review.rating).toBe(5); // Highest rating
      expect(result.rows[4].review.rating).toBe(2); // Lowest rating
    });
  });

  describe('Complex Queries', () => {
    it('should execute complex query with multiple features', async () => {
      // Skip if AGE is not available
      if (!ageAvailable) {
        console.log('Skipping complex query test: AGE not available');
        return;
      }

      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[purchase:PURCHASED]->(product:Product)
        WHERE product.price > 100
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
        SKIP 0
        LIMIT 10
        `,
        {},
        AGE_GRAPH_NAME
      );

      expect(result.rows.length).toBeGreaterThan(0);

      // Alice should be first with highest totalSpent
      expect(result.rows[0].personName).toBe('Alice');
      expect(result.rows[0].purchaseCount).toBe(2);
      expect(result.rows[0].totalSpent).toBe(1400);
      expect(result.rows[0].highRatingReviews).toBe(2);
      expect(result.rows[0].highlyRatedProducts).toContain('Laptop');
      expect(result.rows[0].highlyRatedProducts).toContain('Headphones');
    });
  });
});