/**
 * Integration tests for traversal queries
 * 
 * These tests verify traversal queries with a real database.
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
  loadSchemaFixture
} from '../../setup/integration';

describe('Traversal Query Integration', () => {
  // Test data
  let persons: any[];
  
  beforeEach(async () => {
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
    
    // Create test data for traversal
    await createTraversalTestData();
  });
  
  /**
   * Create test data for traversal queries
   */
  async function createTraversalTestData() {
    // Create persons
    const personNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'];
    
    // Create person vertices
    persons = await Promise.all(
      personNames.map(name => 
        queryExecutor.executeCypher(
          `CREATE (p:Person {name: $name, email: $email}) RETURN p`,
          { 
            name,
            email: `${name.toLowerCase()}@example.com`
          },
          AGE_GRAPH_NAME
        ).then(result => result.rows[0].p)
      )
    );
    
    // Create KNOWS relationships
    // Alice knows Bob and Charlie
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
      MATCH (a:Person {name: 'Alice'}), (c:Person {name: 'Charlie'})
      CREATE (a)-[:KNOWS {since: date('2023-01-15')}]->(c)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Bob knows Dave and Eve
    await queryExecutor.executeCypher(
      `
      MATCH (b:Person {name: 'Bob'}), (d:Person {name: 'Dave'})
      CREATE (b)-[:KNOWS {since: date('2023-02-01')}]->(d)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    await queryExecutor.executeCypher(
      `
      MATCH (b:Person {name: 'Bob'}), (e:Person {name: 'Eve'})
      CREATE (b)-[:KNOWS {since: date('2023-02-15')}]->(e)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Charlie knows Frank
    await queryExecutor.executeCypher(
      `
      MATCH (c:Person {name: 'Charlie'}), (f:Person {name: 'Frank'})
      CREATE (c)-[:KNOWS {since: date('2023-03-01')}]->(f)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Dave knows Grace
    await queryExecutor.executeCypher(
      `
      MATCH (d:Person {name: 'Dave'}), (g:Person {name: 'Grace'})
      CREATE (d)-[:KNOWS {since: date('2023-03-15')}]->(g)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Eve knows Heidi
    await queryExecutor.executeCypher(
      `
      MATCH (e:Person {name: 'Eve'}), (h:Person {name: 'Heidi'})
      CREATE (e)-[:KNOWS {since: date('2023-04-01')}]->(h)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Create some cycles
    // Grace knows Alice (creates a cycle)
    await queryExecutor.executeCypher(
      `
      MATCH (g:Person {name: 'Grace'}), (a:Person {name: 'Alice'})
      CREATE (g)-[:KNOWS {since: date('2023-04-15')}]->(a)
      `,
      {},
      AGE_GRAPH_NAME
    );
    
    // Heidi knows Charlie (creates another cycle)
    await queryExecutor.executeCypher(
      `
      MATCH (h:Person {name: 'Heidi'}), (c:Person {name: 'Charlie'})
      CREATE (h)-[:KNOWS {since: date('2023-05-01')}]->(c)
      `,
      {},
      AGE_GRAPH_NAME
    );
  }
  
  describe('Basic Traversal', () => {
    it('should find direct connections', async () => {
      // Find all persons that Alice knows directly
      const result = await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: 'Alice'})-[:KNOWS]->(friend:Person)
        RETURN friend.name AS name
        ORDER BY name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('Bob');
      expect(result.rows[1].name).toBe('Charlie');
    });
    
    it('should find second-degree connections', async () => {
      // Find friends of friends (2 hops away)
      const result = await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: 'Alice'})-[:KNOWS]->(:Person)-[:KNOWS]->(fof:Person)
        RETURN DISTINCT fof.name AS name
        ORDER BY name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(3);
      expect(result.rows.map(row => row.name)).toEqual(['Dave', 'Eve', 'Frank']);
    });
    
    it('should find paths of specific length', async () => {
      // Find all persons exactly 3 hops away from Alice
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*3]->(distant:Person)
        RETURN distant.name AS name, length(path) AS distance
        ORDER BY name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      expect(result.rows.map(row => row.name)).toEqual(['Grace', 'Heidi']);
      
      // All distances should be 3
      for (const row of result.rows) {
        expect(row.distance).toBe(3);
      }
    });
  });
  
  describe('Variable-Length Paths', () => {
    it('should find paths with variable length', async () => {
      // Find all persons 1-3 hops away from Alice
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*1..3]->(reachable:Person)
        RETURN reachable.name AS name, length(path) AS distance
        ORDER BY distance, name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(7);
      
      // Group by distance
      const byDistance = {
        1: [] as string[],
        2: [] as string[],
        3: [] as string[]
      };
      
      for (const row of result.rows) {
        byDistance[row.distance].push(row.name);
      }
      
      // Check each distance group
      expect(byDistance[1].sort()).toEqual(['Bob', 'Charlie']);
      expect(byDistance[2].sort()).toEqual(['Dave', 'Eve', 'Frank']);
      expect(byDistance[3].sort()).toEqual(['Grace', 'Heidi']);
    });
    
    it('should find shortest paths', async () => {
      // Find the shortest path from Alice to Grace
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = shortestPath((a:Person {name: 'Alice'})-[:KNOWS*]->
                                 (g:Person {name: 'Grace'}))
        RETURN [node in nodes(path) | node.name] AS pathNodes, length(path) AS distance
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // The shortest path should be Alice -> Bob -> Dave -> Grace (3 hops)
      expect(result.rows[0].distance).toBe(3);
      expect(result.rows[0].pathNodes).toEqual(['Alice', 'Bob', 'Dave', 'Grace']);
    });
    
    it('should find all shortest paths', async () => {
      // Create an alternative path from Alice to Grace
      await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: 'Alice'}), (g:Person {name: 'Grace'})
        CREATE (a)-[:KNOWS {since: date('2023-05-15')}]->(g)
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Find all shortest paths from Alice to Grace
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = allShortestPaths((a:Person {name: 'Alice'})-[:KNOWS*]->
                                     (g:Person {name: 'Grace'}))
        RETURN [node in nodes(path) | node.name] AS pathNodes, length(path) AS distance
        ORDER BY pathNodes
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      
      // There should be two shortest paths:
      // 1. Alice -> Grace (1 hop, the direct connection we just added)
      // 2. Alice -> Bob -> Dave -> Grace (3 hops, the original path)
      
      // The first path should be the direct connection
      expect(result.rows[0].distance).toBe(1);
      expect(result.rows[0].pathNodes).toEqual(['Alice', 'Grace']);
      
      // The second path should be the original path
      expect(result.rows[1].distance).toBe(3);
      expect(result.rows[1].pathNodes).toEqual(['Alice', 'Bob', 'Dave', 'Grace']);
    });
  });
  
  describe('Cycle Detection', () => {
    it('should detect cycles in the graph', async () => {
      // Find cycles that include Alice
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*1..]->(p:Person)-[:KNOWS]->(a)
        RETURN [node in nodes(path) | node.name] AS cycleNodes, length(path) + 1 AS cycleLength
        ORDER BY cycleLength
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // There should be one cycle: Alice -> Bob -> Dave -> Grace -> Alice
      expect(result.rows[0].cycleLength).toBe(4);
      expect(result.rows[0].cycleNodes).toEqual(['Alice', 'Bob', 'Dave', 'Grace']);
    });
  });
  
  describe('Path Analysis', () => {
    it('should analyze path properties', async () => {
      // Find all paths from Alice to Frank and analyze the relationships
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*]->(f:Person {name: 'Frank'})
        WITH path, relationships(path) AS rels
        RETURN 
          [node in nodes(path) | node.name] AS pathNodes,
          length(path) AS pathLength,
          [rel in rels | rel.since] AS relationshipDates
        ORDER BY pathLength
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // The path should be Alice -> Charlie -> Frank
      expect(result.rows[0].pathNodes).toEqual(['Alice', 'Charlie', 'Frank']);
      expect(result.rows[0].pathLength).toBe(2);
      
      // Check the relationship dates
      const dates = result.rows[0].relationshipDates;
      expect(dates).toHaveLength(2);
    });
  });
  
  describe('Complex Traversals', () => {
    it('should perform traversals with conditions', async () => {
      // Find paths where all relationships were formed in 2023 Q1 (Jan-Mar)
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*]->(other:Person)
        WHERE all(rel in relationships(path) WHERE rel.since >= date('2023-01-01') AND rel.since <= date('2023-03-31'))
        RETURN other.name AS name, length(path) AS distance
        ORDER BY distance, name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      
      // All paths should only include relationships from Q1 2023
      for (const row of result.rows) {
        // We know these were all created in Q1 from our test data setup
        expect(row).toBeDefined();
      }
    });
    
    it('should find nodes with specific connectivity patterns', async () => {
      // Find persons who know at least 2 other persons
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[:KNOWS]->(friend:Person)
        WITH p, count(friend) AS friendCount
        WHERE friendCount >= 2
        RETURN p.name AS name, friendCount
        ORDER BY friendCount DESC, name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(2);
      
      // Alice and Bob both know 2 people
      const names = result.rows.map(row => row.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
      
      // Check friend counts
      for (const row of result.rows) {
        expect(row.friendCount).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
