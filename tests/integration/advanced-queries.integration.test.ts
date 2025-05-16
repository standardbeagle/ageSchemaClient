/**
 * Advanced Query Features integration tests
 * 
 * These tests verify that the query builder can generate and execute
 * complex queries with advanced AGE syntax features.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  setupIntegrationTest,
  teardownIntegrationTest,
  queryExecutor,
  AGE_GRAPH_NAME,
  createQueryBuilder
} from './base-test';
import { SchemaDefinition } from '../../../src/schema/types';
import { QueryBuilder } from '../../../src/query/builder';
import { AnalyticsQueryBuilder } from '../../../src/query/analytics';

// Define a schema for the test data
const testSchema: SchemaDefinition = {
  vertices: {
    Person: {
      properties: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
        email: { type: 'string' },
        active: { type: 'boolean', default: true }
      }
    },
    Product: {
      properties: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        price: { type: 'number', required: true },
        category: { type: 'string' },
        inStock: { type: 'boolean', default: true }
      }
    }
  },
  edges: {
    PURCHASED: {
      properties: {
        date: { type: 'string' },
        quantity: { type: 'number', default: 1 },
        total: { type: 'number' }
      }
    },
    REVIEWED: {
      properties: {
        date: { type: 'string' },
        rating: { type: 'number', required: true },
        comment: { type: 'string' }
      }
    },
    FRIEND_OF: {
      properties: {
        since: { type: 'string' },
        strength: { type: 'number', default: 1 }
      }
    }
  }
};

describe('Advanced Query Features', () => {
  let ageAvailable = false;
  let queryBuilder: QueryBuilder<typeof testSchema>;
  let analyticsQueryBuilder: AnalyticsQueryBuilder<typeof testSchema>;

  // Set up the test environment
  beforeAll(async () => {
    const setup = await setupIntegrationTest('Advanced Query Features');
    ageAvailable = setup.ageAvailable;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    await teardownIntegrationTest(ageAvailable);
  }, 30000);

  // Initialize query builders before each test
  beforeEach(() => {
    queryBuilder = createQueryBuilder(testSchema);
    analyticsQueryBuilder = new AnalyticsQueryBuilder(testSchema, queryExecutor, AGE_GRAPH_NAME);
  });

  // Helper function to create test data
  async function createTestData() {
    if (!ageAvailable) {
      return { persons: [], products: [] };
    }

    // Create Person vertices
    const persons = [
      { id: 1, name: 'Alice', age: 30, email: 'alice@example.com' },
      { id: 2, name: 'Bob', age: 25, email: 'bob@example.com' },
      { id: 3, name: 'Charlie', age: 35, email: 'charlie@example.com' },
      { id: 4, name: 'Diana', age: 28, email: 'diana@example.com' },
      { id: 5, name: 'Eve', age: 40, email: 'eve@example.com' }
    ];

    for (const person of persons) {
      await queryExecutor.executeCypher(`
        CREATE (p:Person {
          id: ${person.id},
          name: '${person.name}',
          age: ${person.age},
          email: '${person.email}',
          active: true
        })
      `, {}, AGE_GRAPH_NAME);
    }

    // Create Product vertices
    const products = [
      { id: 1, name: 'Laptop', price: 1200, category: 'Electronics' },
      { id: 2, name: 'Smartphone', price: 800, category: 'Electronics' },
      { id: 3, name: 'Headphones', price: 150, category: 'Electronics' },
      { id: 4, name: 'Keyboard', price: 100, category: 'Electronics' },
      { id: 5, name: 'Book', price: 20, category: 'Books' }
    ];

    for (const product of products) {
      await queryExecutor.executeCypher(`
        CREATE (p:Product {
          id: ${product.id},
          name: '${product.name}',
          price: ${product.price},
          category: '${product.category}',
          inStock: true
        })
      `, {}, AGE_GRAPH_NAME);
    }

    // Create PURCHASED edges
    const purchases = [
      { from: 1, to: 1, date: '2023-01-15', quantity: 1, total: 1200 },
      { from: 1, to: 3, date: '2023-02-20', quantity: 1, total: 150 },
      { from: 2, to: 2, date: '2023-01-10', quantity: 1, total: 800 },
      { from: 3, to: 5, date: '2023-03-05', quantity: 2, total: 40 },
      { from: 4, to: 4, date: '2023-02-28', quantity: 1, total: 100 },
      { from: 5, to: 1, date: '2023-01-20', quantity: 1, total: 1200 }
    ];

    for (const purchase of purchases) {
      await queryExecutor.executeCypher(`
        MATCH (person:Person {id: ${purchase.from}}), (product:Product {id: ${purchase.to}})
        CREATE (person)-[:PURCHASED {
          date: '${purchase.date}',
          quantity: ${purchase.quantity},
          total: ${purchase.total}
        }]->(product)
      `, {}, AGE_GRAPH_NAME);
    }

    // Create REVIEWED edges
    const reviews = [
      { from: 1, to: 1, date: '2023-01-20', rating: 5, comment: 'Great laptop!' },
      { from: 2, to: 2, date: '2023-01-15', rating: 4, comment: 'Good phone' },
      { from: 3, to: 5, date: '2023-03-10', rating: 5, comment: 'Excellent book' },
      { from: 4, to: 4, date: '2023-03-05', rating: 2, comment: 'Keys are too stiff' }
    ];

    for (const review of reviews) {
      await queryExecutor.executeCypher(`
        MATCH (person:Person {id: ${review.from}}), (product:Product {id: ${review.to}})
        CREATE (person)-[:REVIEWED {
          date: '${review.date}',
          rating: ${review.rating},
          comment: '${review.comment}'
        }]->(product)
      `, {}, AGE_GRAPH_NAME);
    }

    // Create FRIEND_OF edges
    const friendships = [
      { from: 1, to: 2, since: '2020-01-15', strength: 3 },
      { from: 1, to: 3, since: '2019-05-10', strength: 2 },
      { from: 2, to: 4, since: '2021-03-20', strength: 1 },
      { from: 3, to: 5, since: '2018-11-05', strength: 3 },
      { from: 4, to: 5, since: '2022-02-15', strength: 2 }
    ];

    for (const friendship of friendships) {
      await queryExecutor.executeCypher(`
        MATCH (person1:Person {id: ${friendship.from}}), (person2:Person {id: ${friendship.to}})
        CREATE (person1)-[:FRIEND_OF {
          since: '${friendship.since}',
          strength: ${friendship.strength}
        }]->(person2)
      `, {}, AGE_GRAPH_NAME);
    }

    return { persons, products };
  }

  // Test: Create test data
  it('should create test data', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    const { persons, products } = await createTestData();
    expect(persons.length).toBe(5);
    expect(products.length).toBe(5);

    // Verify Person vertices were created
    const personResult = await queryBuilder
      .match('Person', 'p')
      .return('count(p) AS count')
      .execute();

    expect(personResult.rows.length).toBe(1);
    expect(personResult.rows[0].count).toBe(5);

    // Verify Product vertices were created
    const productResult = await queryBuilder
      .match('Product', 'p')
      .return('count(p) AS count')
      .execute();

    expect(productResult.rows.length).toBe(1);
    expect(productResult.rows[0].count).toBe(5);

    // Verify PURCHASED edges were created
    const purchaseResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[p:PURCHASED]->(:Product)
      RETURN count(p) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(purchaseResult.rows.length).toBe(1);
    expect(purchaseResult.rows[0].count).toBe(6);

    // Verify REVIEWED edges were created
    const reviewResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[r:REVIEWED]->(:Product)
      RETURN count(r) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(reviewResult.rows.length).toBe(1);
    expect(reviewResult.rows[0].count).toBe(4);

    // Verify FRIEND_OF edges were created
    const friendshipResult = await queryExecutor.executeCypher(`
      MATCH (:Person)-[f:FRIEND_OF]->(:Person)
      RETURN count(f) AS count
    `, {}, AGE_GRAPH_NAME);

    expect(friendshipResult.rows.length).toBe(1);
    expect(friendshipResult.rows[0].count).toBe(5);
  });

  // Test: COUNT aggregation
  it('should execute COUNT aggregation', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await analyticsQueryBuilder
      .match('Person', 'p')
      .count('p', 'personCount')
      .execute();

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].personCount).toBe(5);
  });

  // Test: AVG aggregation
  it('should execute AVG aggregation', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await analyticsQueryBuilder
      .match('Person', 'p')
      .avg('p.age', 'avgAge')
      .execute();

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].avgAge).toBe(31.6); // (30 + 25 + 35 + 28 + 40) / 5 = 31.6
  });

  // Test: ORDER BY clause
  it('should execute query with ORDER BY', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Person', 'p')
      .return('p.name', 'p.age')
      .orderBy('p.age')
      .execute();

    expect(result.rows.length).toBe(5);
    expect(result.rows[0].p.age).toBe(25); // Bob (youngest)
    expect(result.rows[4].p.age).toBe(40); // Eve (oldest)
  });

  // Test: SKIP and LIMIT for pagination
  it('should execute query with SKIP and LIMIT for pagination', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    const result = await queryBuilder
      .match('Person', 'p')
      .return('p.name', 'p.age')
      .orderBy('p.age')
      .skip(1)
      .limit(2)
      .execute();

    expect(result.rows.length).toBe(2);
    expect(result.rows[0].p.name).toBe('Diana');
    expect(result.rows[1].p.name).toBe('Alice');
  });

  // Test: WITH clause for intermediate results
  it('should execute query with WITH clause', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    await createTestData();

    // Use WITH to filter persons by age before matching their friends
    const result = await queryExecutor.executeCypher(`
      MATCH (p:Person)
      WHERE p.age > 30
      WITH p
      MATCH (p)-[:FRIEND_OF]->(friend:Person)
      RETURN p.name AS person, friend.name AS friend
    `, {}, AGE_GRAPH_NAME);

    // Only Charlie (35) and Eve (40) are over 30
    // Charlie is friends with Eve, and Eve is not explicitly friends with anyone
    // (in our directed friendship graph)
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].person).toBe('Charlie');
    expect(result.rows[0].friend).toBe('Eve');
  });
});
