/**
 * Integration tests for query building and execution
 * 
 * These tests verify query building and execution with a real database.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { VertexOperations } from '../../../src/db/vertex';
import { EdgeOperations } from '../../../src/db/edge';
import { QueryBuilder } from '../../../src/query/builder';
import { 
  connectionManager, 
  queryExecutor, 
  AGE_GRAPH_NAME, 
  loadSchemaFixture
} from '../../setup/integration';

describe('Query Builder Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  let vertexOperations: VertexOperations<SchemaDefinition>;
  let edgeOperations: EdgeOperations<SchemaDefinition>;
  let queryBuilder: QueryBuilder<SchemaDefinition>;
  
  // Test data
  let persons: any[];
  let products: any[];
  let purchases: any[];
  let reviews: any[];
  
  beforeEach(async () => {
    // Load the basic schema
    basicSchema = loadSchemaFixture('basic-schema');
    
    // Create SQL generator
    sqlGenerator = new SQLGenerator(basicSchema);
    
    // Create operations
    vertexOperations = new VertexOperations(basicSchema, queryExecutor, sqlGenerator);
    edgeOperations = new EdgeOperations(basicSchema, queryExecutor, sqlGenerator);
    
    // Create query builder
    queryBuilder = new QueryBuilder(basicSchema, queryExecutor, AGE_GRAPH_NAME);
    
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
    
    // Create test data
    await createTestData();
  });
  
  /**
   * Create test data for query tests
   */
  async function createTestData() {
    // Create persons
    const personData = [
      { name: 'Alice', email: 'alice@example.com', age: 30, active: true },
      { name: 'Bob', email: 'bob@example.com', age: 35, active: true },
      { name: 'Charlie', email: 'charlie@example.com', age: 40, active: false },
      { name: 'Dave', email: 'dave@example.com', age: 45, active: true },
      { name: 'Eve', email: 'eve@example.com', age: 50, active: false }
    ];
    
    persons = await Promise.all(
      personData.map(data => vertexOperations.createVertex('Person', data, AGE_GRAPH_NAME))
    );
    
    // Create products
    const productData = [
      { name: 'Laptop', price: 999.99, sku: 'TECH-001', inStock: true },
      { name: 'Smartphone', price: 499.99, sku: 'TECH-002', inStock: true },
      { name: 'Headphones', price: 99.99, sku: 'TECH-003', inStock: true },
      { name: 'Tablet', price: 299.99, sku: 'TECH-004', inStock: false },
      { name: 'Smartwatch', price: 199.99, sku: 'TECH-005', inStock: true }
    ];
    
    products = await Promise.all(
      productData.map(data => vertexOperations.createVertex('Product', data, AGE_GRAPH_NAME))
    );
    
    // Create purchases
    const purchaseData = [
      { from: 0, to: 0, data: { date: new Date('2023-01-01'), quantity: 1, total: 999.99 } },
      { from: 0, to: 2, data: { date: new Date('2023-01-15'), quantity: 2, total: 199.98 } },
      { from: 1, to: 1, data: { date: new Date('2023-02-01'), quantity: 1, total: 499.99 } },
      { from: 2, to: 4, data: { date: new Date('2023-02-15'), quantity: 1, total: 199.99 } },
      { from: 3, to: 0, data: { date: new Date('2023-03-01'), quantity: 1, total: 999.99 } },
      { from: 4, to: 2, data: { date: new Date('2023-03-15'), quantity: 3, total: 299.97 } }
    ];
    
    purchases = await Promise.all(
      purchaseData.map(({ from, to, data }) => 
        edgeOperations.createEdge('PURCHASED', persons[from], products[to], data, AGE_GRAPH_NAME)
      )
    );
    
    // Create reviews
    const reviewData = [
      { from: 0, to: 0, data: { date: new Date('2023-01-05'), rating: 5, comment: 'Excellent laptop!' } },
      { from: 0, to: 2, data: { date: new Date('2023-01-20'), rating: 4, comment: 'Good headphones' } },
      { from: 1, to: 1, data: { date: new Date('2023-02-05'), rating: 3, comment: 'Average smartphone' } },
      { from: 2, to: 4, data: { date: new Date('2023-02-20'), rating: 5, comment: 'Love this smartwatch!' } },
      { from: 3, to: 0, data: { date: new Date('2023-03-05'), rating: 2, comment: 'Laptop is too heavy' } },
      { from: 4, to: 2, data: { date: new Date('2023-03-20'), rating: 4, comment: 'Nice headphones' } }
    ];
    
    reviews = await Promise.all(
      reviewData.map(({ from, to, data }) => 
        edgeOperations.createEdge('REVIEWED', persons[from], products[to], data, AGE_GRAPH_NAME)
      )
    );
  }
  
  describe('Basic Queries', () => {
    it('should execute a simple match query', async () => {
      // Build a query to find all active persons
      const result = await queryBuilder
        .match('p', 'Person')
        .where('p.active', '=', true)
        .return('p')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(3);
      
      // Check that all returned persons are active
      for (const row of result.rows) {
        expect(row.p.properties.active).toBe(true);
      }
    });
    
    it('should execute a query with multiple conditions', async () => {
      // Build a query to find persons over 40 who are active
      const result = await queryBuilder
        .match('p', 'Person')
        .where('p.age', '>', 40)
        .and('p.active', '=', true)
        .return('p')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].p.properties.name).toBe('Dave');
      expect(result.rows[0].p.properties.age).toBe(45);
    });
    
    it('should execute a query with OR conditions', async () => {
      // Build a query to find persons who are either under 35 or inactive
      const result = await queryBuilder
        .match('p', 'Person')
        .where('p.age', '<', 35)
        .or('p.active', '=', false)
        .return('p')
        .orderBy('p.name')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(3);
      
      const names = result.rows.map(row => row.p.properties.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Charlie');
      expect(names).toContain('Eve');
    });
    
    it('should execute a query with pattern matching', async () => {
      // Build a query to find all purchases
      const result = await queryBuilder
        .match('p', 'Person')
        .match('p', '-[purchase:PURCHASED]->', 'product:Product')
        .return('p', 'purchase', 'product')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(6);
      
      // Check that the relationships are correct
      for (const row of result.rows) {
        expect(row.p).toBeDefined();
        expect(row.purchase).toBeDefined();
        expect(row.product).toBeDefined();
        expect(row.purchase.fromId).toBe(row.p.id);
        expect(row.purchase.toId).toBe(row.product.id);
      }
    });
  });
  
  describe('Path Queries', () => {
    it('should execute a path query', async () => {
      // Build a query to find paths between persons and products via purchases
      const result = await queryBuilder
        .match('p', 'Person')
        .where('p.name', '=', 'Alice')
        .match('p', '-[purchase:PURCHASED]->', 'product:Product')
        .return('p', 'purchase', 'product')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      
      // Check that both of Alice's purchases are returned
      const productNames = result.rows.map(row => row.product.properties.name);
      expect(productNames).toContain('Laptop');
      expect(productNames).toContain('Headphones');
    });
    
    it('should execute a variable-length path query', async () => {
      // First create some person-to-person relationships
      await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})
        CREATE (a)-[:KNOWS {since: date('2023-01-01')}]->(b)
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      await queryExecutor.executeCypher(
        `
        MATCH (b:Person {name: 'Bob'}), (c:Person {name: 'Charlie'})
        CREATE (b)-[:KNOWS {since: date('2023-02-01')}]->(c)
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      await queryExecutor.executeCypher(
        `
        MATCH (c:Person {name: 'Charlie'}), (d:Person {name: 'Dave'})
        CREATE (c)-[:KNOWS {since: date('2023-03-01')}]->(d)
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Build a query to find all persons connected to Alice by 1-3 KNOWS relationships
      const result = await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: 'Alice'})-[:KNOWS*1..3]->(other:Person)
        RETURN other.name AS name, length(path) AS distance
        ORDER BY distance
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(3);
      
      const names = result.rows.map(row => row.name);
      expect(names).toContain('Bob');
      expect(names).toContain('Charlie');
      expect(names).toContain('Dave');
    });
  });
  
  describe('Aggregation Queries', () => {
    it('should execute a count aggregation query', async () => {
      // Build a query to count purchases by person
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[purchase:PURCHASED]->(:Product)
        RETURN p.name AS name, count(purchase) AS purchaseCount
        ORDER BY purchaseCount DESC
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(5);
      
      // Alice has 2 purchases
      expect(result.rows[0].name).toBe('Alice');
      expect(result.rows[0].purchaseCount).toBe(2);
    });
    
    it('should execute a sum aggregation query', async () => {
      // Build a query to sum purchase totals by person
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[purchase:PURCHASED]->(:Product)
        RETURN p.name AS name, sum(purchase.total) AS totalSpent
        ORDER BY totalSpent DESC
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(5);
      
      // Check the total spent by Alice
      const aliceRow = result.rows.find(row => row.name === 'Alice');
      expect(aliceRow).toBeDefined();
      expect(aliceRow.totalSpent).toBeCloseTo(1199.97, 2); // 999.99 + 199.98
    });
    
    it('should execute a group by query', async () => {
      // Build a query to group products by whether they're in stock
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Product)
        RETURN p.inStock AS inStock, count(p) AS productCount, avg(p.price) AS avgPrice
        ORDER BY inStock
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      
      // Check in-stock products
      const inStockRow = result.rows.find(row => row.inStock === true);
      expect(inStockRow).toBeDefined();
      expect(inStockRow.productCount).toBe(4);
      
      // Check out-of-stock products
      const outOfStockRow = result.rows.find(row => row.inStock === false);
      expect(outOfStockRow).toBeDefined();
      expect(outOfStockRow.productCount).toBe(1);
    });
  });
  
  describe('Filtering, Sorting, and Pagination', () => {
    it('should execute a query with filtering', async () => {
      // Build a query to find high-rated reviews (rating >= 4)
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[r:REVIEWED]->(prod:Product)
        WHERE r.rating >= 4
        RETURN p.name AS reviewer, prod.name AS product, r.rating AS rating, r.comment AS comment
        ORDER BY rating DESC
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(4);
      
      // All ratings should be 4 or 5
      for (const row of result.rows) {
        expect(row.rating).toBeGreaterThanOrEqual(4);
      }
    });
    
    it('should execute a query with sorting', async () => {
      // Build a query to find all products sorted by price
      const result = await queryBuilder
        .match('p', 'Product')
        .return('p')
        .orderBy('p.price', 'DESC')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(5);
      
      // Check that products are sorted by price in descending order
      const prices = result.rows.map(row => row.p.properties.price);
      expect(prices).toEqual([999.99, 499.99, 299.99, 199.99, 99.99]);
    });
    
    it('should execute a query with pagination', async () => {
      // Build a query to find all persons with pagination
      const page1 = await queryBuilder
        .match('p', 'Person')
        .return('p')
        .orderBy('p.name')
        .limit(2)
        .execute();
      
      // Verify page 1
      expect(page1.rows).toHaveLength(2);
      expect(page1.rows[0].p.properties.name).toBe('Alice');
      expect(page1.rows[1].p.properties.name).toBe('Bob');
      
      // Get page 2
      const page2 = await queryBuilder
        .match('p', 'Person')
        .return('p')
        .orderBy('p.name')
        .skip(2)
        .limit(2)
        .execute();
      
      // Verify page 2
      expect(page2.rows).toHaveLength(2);
      expect(page2.rows[0].p.properties.name).toBe('Charlie');
      expect(page2.rows[1].p.properties.name).toBe('Dave');
      
      // Get page 3
      const page3 = await queryBuilder
        .match('p', 'Person')
        .return('p')
        .orderBy('p.name')
        .skip(4)
        .limit(2)
        .execute();
      
      // Verify page 3
      expect(page3.rows).toHaveLength(1);
      expect(page3.rows[0].p.properties.name).toBe('Eve');
    });
  });
  
  describe('Performance Queries', () => {
    it('should execute a complex query with multiple joins', async () => {
      // Build a query to find persons who purchased products that were also reviewed by others
      const result = await queryExecutor.executeCypher(
        `
        MATCH (buyer:Person)-[:PURCHASED]->(product:Product)<-[:REVIEWED]-(reviewer:Person)
        WHERE buyer <> reviewer
        RETURN buyer.name AS buyer, product.name AS product, reviewer.name AS reviewer
        ORDER BY buyer, product, reviewer
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Check that buyers and reviewers are different persons
      for (const row of result.rows) {
        expect(row.buyer).not.toBe(row.reviewer);
      }
    });
    
    it('should execute a query with parameters', async () => {
      // Build a query to find products in a specific price range
      const minPrice = 100;
      const maxPrice = 300;
      
      const result = await queryBuilder
        .match('p', 'Product')
        .where('p.price', '>=', minPrice)
        .and('p.price', '<=', maxPrice)
        .return('p')
        .orderBy('p.price')
        .execute();
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      
      // Check that all products are in the specified price range
      for (const row of result.rows) {
        const price = row.p.properties.price;
        expect(price).toBeGreaterThanOrEqual(minPrice);
        expect(price).toBeLessThanOrEqual(maxPrice);
      }
    });
  });
});
