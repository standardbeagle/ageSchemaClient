/**
 * Integration tests for SQL generation
 * 
 * These tests verify SQL generation for various operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaDefinition } from '../../../src/schema';
import { SQLGenerator } from '../../../src/sql/generator';
import { 
  connectionManager, 
  queryExecutor, 
  AGE_GRAPH_NAME, 
  loadSchemaFixture
} from '../../setup/integration';

describe('SQL Generator Integration', () => {
  let basicSchema: SchemaDefinition;
  let sqlGenerator: SQLGenerator;
  
  beforeEach(async () => {
    // Load the basic schema
    basicSchema = loadSchemaFixture('basic-schema');
    
    // Create SQL generator
    sqlGenerator = new SQLGenerator(basicSchema);
    
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
   * Create test data for SQL generation tests
   */
  async function createTestData() {
    // Create a person vertex
    await queryExecutor.executeCypher(
      `
      CREATE (p:Person {
        name: 'Test Person',
        email: 'test@example.com',
        age: 30,
        active: true
      })
      RETURN p
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Create a product vertex
    await queryExecutor.executeCypher(
      `
      CREATE (p:Product {
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST-001',
        inStock: true
      })
      RETURN p
      `,
      {},
      AGE_GRAPH_NAME
    );
  }
  
  describe('Vertex SQL Generation', () => {
    it('should generate SQL for creating a vertex', async () => {
      // Generate SQL for creating a person vertex
      const personData = {
        name: 'SQL Person',
        email: 'sql@example.com',
        age: 35,
        active: true
      };
      
      const { sql, params } = sqlGenerator.generateCreateVertexSQL(
        'Person',
        personData,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('INSERT INTO');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('"Person"');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
      
      // Verify the vertex was created
      const vertexResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'SQL Person'})
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      expect(vertexResult.rows).toHaveLength(1);
      expect(vertexResult.rows[0].p.properties.email).toBe('sql@example.com');
    });
    
    it('should generate SQL for retrieving a vertex', async () => {
      // First create a vertex
      const createResult = await queryExecutor.executeCypher(
        `
        CREATE (p:Person {
          name: 'Retrieve Person',
          email: 'retrieve@example.com',
          age: 40,
          active: true
        })
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const vertexId = createResult.rows[0].p.id;
      
      // Generate SQL for retrieving the vertex
      const { sql, params } = sqlGenerator.generateGetVertexSQL(
        'Person',
        vertexId,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('SELECT');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('"Person"');
      expect(sql).toContain('id');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(vertexId);
      expect(result.rows[0].properties.name).toBe('Retrieve Person');
    });
    
    it('should generate SQL for updating a vertex', async () => {
      // First create a vertex
      const createResult = await queryExecutor.executeCypher(
        `
        CREATE (p:Person {
          name: 'Update Person',
          email: 'update@example.com',
          age: 45,
          active: true
        })
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const vertexId = createResult.rows[0].p.id;
      
      // Generate SQL for updating the vertex
      const updateData = {
        name: 'Updated Person',
        age: 46,
        active: false
      };
      
      const { sql, params } = sqlGenerator.generateUpdateVertexSQL(
        'Person',
        vertexId,
        updateData,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('UPDATE');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('"Person"');
      expect(sql).toContain('SET');
      expect(sql).toContain('properties');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // Verify the vertex was updated
      const vertexResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Updated Person'})
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      expect(vertexResult.rows).toHaveLength(1);
      expect(vertexResult.rows[0].p.properties.age).toBe(46);
      expect(vertexResult.rows[0].p.properties.active).toBe(false);
      // Email should remain unchanged
      expect(vertexResult.rows[0].p.properties.email).toBe('update@example.com');
    });
    
    it('should generate SQL for deleting a vertex', async () => {
      // First create a vertex
      const createResult = await queryExecutor.executeCypher(
        `
        CREATE (p:Person {
          name: 'Delete Person',
          email: 'delete@example.com',
          age: 50,
          active: true
        })
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const vertexId = createResult.rows[0].p.id;
      
      // Generate SQL for deleting the vertex
      const { sql, params } = sqlGenerator.generateDeleteVertexSQL(
        'Person',
        vertexId,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('DELETE FROM');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('"Person"');
      expect(sql).toContain('id');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rowCount).toBe(1);
      
      // Verify the vertex was deleted
      const vertexResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Delete Person'})
        RETURN p
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      expect(vertexResult.rows).toHaveLength(0);
    });
    
    it('should generate SQL for finding vertices by properties', async () => {
      // Create multiple vertices
      await queryExecutor.executeCypher(
        `
        CREATE (p:Person {name: 'Find Person 1', email: 'find1@example.com', age: 30, active: true})
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      await queryExecutor.executeCypher(
        `
        CREATE (p:Person {name: 'Find Person 2', email: 'find2@example.com', age: 35, active: true})
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      await queryExecutor.executeCypher(
        `
        CREATE (p:Person {name: 'Find Person 3', email: 'find3@example.com', age: 40, active: false})
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Generate SQL for finding vertices by properties
      const { sql, params } = sqlGenerator.generateFindVerticesSQL(
        'Person',
        { active: true },
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('SELECT');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('"Person"');
      expect(sql).toContain('properties');
      expect(sql).toContain('active');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
      
      // All returned vertices should have active=true
      for (const row of result.rows) {
        expect(row.properties.active).toBe(true);
      }
    });
  });
  
  describe('Edge SQL Generation', () => {
    let personId: string;
    let productId: string;
    
    beforeEach(async () => {
      // Get IDs of the test person and product
      const personResult = await queryExecutor.executeCypher(
        `MATCH (p:Person {name: 'Test Person'}) RETURN p`,
        {},
        AGE_GRAPH_NAME
      );
      
      const productResult = await queryExecutor.executeCypher(
        `MATCH (p:Product {name: 'Test Product'}) RETURN p`,
        {},
        AGE_GRAPH_NAME
      );
      
      personId = personResult.rows[0].p.id;
      productId = productResult.rows[0].p.id;
    });
    
    it('should generate SQL for creating an edge', async () => {
      // Generate SQL for creating a purchase edge
      const purchaseData = {
        date: new Date('2023-01-01'),
        quantity: 2,
        total: 199.98
      };
      
      const { sql, params } = sqlGenerator.generateCreateEdgeSQL(
        'PURCHASED',
        personId,
        productId,
        purchaseData,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('INSERT INTO');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('_edges');
      expect(sql).toContain('from_id');
      expect(sql).toContain('to_id');
      expect(sql).toContain('label');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBeDefined();
      
      // Verify the edge was created
      const edgeResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Test Person'})-[r:PURCHASED]->(prod:Product {name: 'Test Product'})
        RETURN r
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      expect(edgeResult.rows).toHaveLength(1);
      expect(edgeResult.rows[0].r.properties.quantity).toBe(2);
    });
    
    it('should generate SQL for retrieving an edge', async () => {
      // First create an edge
      const createResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Test Person'}), (prod:Product {name: 'Test Product'})
        CREATE (p)-[r:REVIEWED {date: date('2023-01-15'), rating: 5, comment: 'Great product!'}]->(prod)
        RETURN r
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const edgeId = createResult.rows[0].r.id;
      
      // Generate SQL for retrieving the edge
      const { sql, params } = sqlGenerator.generateGetEdgeSQL(
        'REVIEWED',
        edgeId,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('SELECT');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('_edges');
      expect(sql).toContain('id');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(edgeId);
      expect(result.rows[0].properties.rating).toBe(5);
    });
    
    it('should generate SQL for updating an edge', async () => {
      // First create an edge
      const createResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Test Person'}), (prod:Product {name: 'Test Product'})
        CREATE (p)-[r:REVIEWED {date: date('2023-01-15'), rating: 3, comment: 'Average product'}]->(prod)
        RETURN r
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const edgeId = createResult.rows[0].r.id;
      
      // Generate SQL for updating the edge
      const updateData = {
        rating: 4,
        comment: 'Updated review'
      };
      
      const { sql, params } = sqlGenerator.generateUpdateEdgeSQL(
        'REVIEWED',
        edgeId,
        updateData,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('UPDATE');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('_edges');
      expect(sql).toContain('SET');
      expect(sql).toContain('properties');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // Verify the edge was updated
      const edgeResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Test Person'})-[r:REVIEWED]->(prod:Product {name: 'Test Product'})
        RETURN r
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      expect(edgeResult.rows).toHaveLength(1);
      expect(edgeResult.rows[0].r.properties.rating).toBe(4);
      expect(edgeResult.rows[0].r.properties.comment).toBe('Updated review');
      // Date should remain unchanged
      expect(edgeResult.rows[0].r.properties.date).toBeDefined();
    });
    
    it('should generate SQL for deleting an edge', async () => {
      // First create an edge
      const createResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Test Person'}), (prod:Product {name: 'Test Product'})
        CREATE (p)-[r:REVIEWED {date: date('2023-01-15'), rating: 5, comment: 'Delete me'}]->(prod)
        RETURN r
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      const edgeId = createResult.rows[0].r.id;
      
      // Generate SQL for deleting the edge
      const { sql, params } = sqlGenerator.generateDeleteEdgeSQL(
        'REVIEWED',
        edgeId,
        AGE_GRAPH_NAME
      );
      
      // Verify the SQL
      expect(sql).toContain('DELETE FROM');
      expect(sql).toContain(AGE_GRAPH_NAME);
      expect(sql).toContain('_edges');
      expect(sql).toContain('id');
      
      // Execute the generated SQL
      const result = await queryExecutor.executeSQL(sql, params);
      
      // Verify the result
      expect(result.rowCount).toBe(1);
      
      // Verify the edge was deleted
      const edgeResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person {name: 'Test Person'})-[r:REVIEWED {comment: 'Delete me'}]->(prod:Product {name: 'Test Product'})
        RETURN r
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      expect(edgeResult.rows).toHaveLength(0);
    });
  });
});
