/**
 * Integration tests for graph algorithms
 * 
 * These tests verify graph algorithms with a real database.
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

describe('Graph Algorithm Integration', () => {
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
    
    // Create test data for graph algorithms
    await createGraphAlgorithmTestData();
  });
  
  /**
   * Create test data for graph algorithm tests
   */
  async function createGraphAlgorithmTestData() {
    // Create a social network graph for algorithm testing
    
    // Create persons
    const persons = [
      { name: 'Alice', age: 30, influence: 8 },
      { name: 'Bob', age: 35, influence: 6 },
      { name: 'Charlie', age: 40, influence: 9 },
      { name: 'Dave', age: 45, influence: 5 },
      { name: 'Eve', age: 50, influence: 7 },
      { name: 'Frank', age: 55, influence: 4 },
      { name: 'Grace', age: 60, influence: 8 },
      { name: 'Heidi', age: 65, influence: 3 },
      { name: 'Ivan', age: 70, influence: 7 },
      { name: 'Judy', age: 75, influence: 5 }
    ];
    
    // Create person vertices
    for (const person of persons) {
      await queryExecutor.executeCypher(
        `CREATE (p:Person $props) RETURN p`,
        { props: person },
        AGE_GRAPH_NAME
      );
    }
    
    // Create KNOWS relationships with weights
    const relationships = [
      { from: 'Alice', to: 'Bob', weight: 0.7 },
      { from: 'Alice', to: 'Charlie', weight: 0.9 },
      { from: 'Alice', to: 'Dave', weight: 0.3 },
      { from: 'Bob', to: 'Eve', weight: 0.8 },
      { from: 'Bob', to: 'Frank', weight: 0.5 },
      { from: 'Charlie', to: 'Grace', weight: 0.6 },
      { from: 'Charlie', to: 'Heidi', weight: 0.2 },
      { from: 'Dave', to: 'Ivan', weight: 0.7 },
      { from: 'Eve', to: 'Judy', weight: 0.4 },
      { from: 'Frank', to: 'Alice', weight: 0.3 }, // Creates a cycle
      { from: 'Grace', to: 'Bob', weight: 0.5 },   // Creates another cycle
      { from: 'Heidi', to: 'Eve', weight: 0.6 },
      { from: 'Ivan', to: 'Frank', weight: 0.8 },
      { from: 'Judy', to: 'Grace', weight: 0.9 }
    ];
    
    for (const rel of relationships) {
      await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: $from}), (b:Person {name: $to})
        CREATE (a)-[r:KNOWS {weight: $weight}]->(b)
        RETURN r
        `,
        rel,
        AGE_GRAPH_NAME
      );
    }
    
    // Create a different type of relationship for community detection
    const communities = [
      { from: 'Alice', to: 'Bob', group: 'A' },
      { from: 'Alice', to: 'Charlie', group: 'A' },
      { from: 'Bob', to: 'Charlie', group: 'A' },
      { from: 'Dave', to: 'Eve', group: 'B' },
      { from: 'Dave', to: 'Frank', group: 'B' },
      { from: 'Eve', to: 'Frank', group: 'B' },
      { from: 'Grace', to: 'Heidi', group: 'C' },
      { from: 'Grace', to: 'Ivan', group: 'C' },
      { from: 'Heidi', to: 'Ivan', group: 'C' },
      { from: 'Judy', to: 'Alice', group: 'D' }, // Bridge between communities
      { from: 'Frank', to: 'Grace', group: 'D' } // Another bridge
    ];
    
    for (const comm of communities) {
      await queryExecutor.executeCypher(
        `
        MATCH (a:Person {name: $from}), (b:Person {name: $to})
        CREATE (a)-[r:IN_GROUP {group: $group}]->(b)
        RETURN r
        `,
        comm,
        AGE_GRAPH_NAME
      );
    }
  }
  
  describe('Path Finding Algorithms', () => {
    it('should find shortest path', async () => {
      // Find the shortest path from Alice to Judy
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = shortestPath((a:Person {name: 'Alice'})-[:KNOWS*]->
                                 (j:Person {name: 'Judy'}))
        RETURN [node in nodes(path) | node.name] AS pathNodes, length(path) AS distance
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // The shortest path should be Alice -> Bob -> Eve -> Judy (3 hops)
      expect(result.rows[0].distance).toBe(3);
      expect(result.rows[0].pathNodes).toEqual(['Alice', 'Bob', 'Eve', 'Judy']);
    });
    
    it('should find all paths', async () => {
      // Find all paths from Alice to Frank with max length 3
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*1..3]->(f:Person {name: 'Frank'})
        RETURN [node in nodes(path) | node.name] AS pathNodes, length(path) AS distance
        ORDER BY distance
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      
      // All paths should end at Frank
      for (const row of result.rows) {
        const pathNodes = row.pathNodes;
        expect(pathNodes[0]).toBe('Alice');
        expect(pathNodes[pathNodes.length - 1]).toBe('Frank');
        expect(row.distance).toBeLessThanOrEqual(3);
      }
    });
    
    it('should find weighted shortest path', async () => {
      // Find the shortest weighted path from Alice to Grace
      // using the weight property as the cost
      const result = await queryExecutor.executeCypher(
        `
        MATCH path = (a:Person {name: 'Alice'})-[:KNOWS*]->(g:Person {name: 'Grace'})
        WITH path, reduce(weight = 0, r IN relationships(path) | weight + r.weight) AS totalWeight
        RETURN [node in nodes(path) | node.name] AS pathNodes, 
               length(path) AS hopCount,
               totalWeight
        ORDER BY totalWeight ASC
        LIMIT 1
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(1);
      
      // The path with the lowest total weight should be returned
      expect(result.rows[0].pathNodes[0]).toBe('Alice');
      expect(result.rows[0].pathNodes[result.rows[0].pathNodes.length - 1]).toBe('Grace');
      expect(result.rows[0].totalWeight).toBeGreaterThan(0);
    });
  });
  
  describe('Centrality Algorithms', () => {
    it('should calculate degree centrality', async () => {
      // Calculate degree centrality (number of relationships)
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[:KNOWS]-(other)
        WITH p, count(distinct other) AS degree
        RETURN p.name AS name, degree
        ORDER BY degree DESC
        LIMIT 5
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(5);
      
      // The persons with the highest degree should be at the top
      expect(result.rows[0].degree).toBeGreaterThan(0);
      
      // Degrees should be in descending order
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i-1].degree).toBeGreaterThanOrEqual(result.rows[i].degree);
      }
    });
    
    it('should calculate weighted centrality', async () => {
      // Calculate weighted centrality (sum of relationship weights)
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[r:KNOWS]-(other)
        WITH p, sum(r.weight) AS weightedDegree
        RETURN p.name AS name, weightedDegree
        ORDER BY weightedDegree DESC
        LIMIT 5
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows).toHaveLength(5);
      
      // The persons with the highest weighted degree should be at the top
      expect(result.rows[0].weightedDegree).toBeGreaterThan(0);
      
      // Weighted degrees should be in descending order
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i-1].weightedDegree).toBeGreaterThanOrEqual(result.rows[i].weightedDegree);
      }
    });
    
    it('should identify bridge nodes', async () => {
      // Find bridge nodes (nodes that connect different communities)
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[r:IN_GROUP]->(other)
        WITH p, collect(distinct r.group) AS groups
        WHERE size(groups) > 1
        RETURN p.name AS name, groups, size(groups) AS groupCount
        ORDER BY groupCount DESC
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Bridge nodes should belong to multiple groups
      for (const row of result.rows) {
        expect(row.groupCount).toBeGreaterThan(1);
      }
    });
  });
  
  describe('Community Detection', () => {
    it('should detect communities based on relationship groups', async () => {
      // Detect communities based on the IN_GROUP relationship
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)-[r:IN_GROUP]->(other)
        WITH r.group AS community, collect(distinct p.name) AS members
        RETURN community, members, size(members) AS memberCount
        ORDER BY memberCount DESC
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Verify the result
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Each community should have at least 2 members
      for (const row of result.rows) {
        expect(row.memberCount).toBeGreaterThanOrEqual(2);
      }
    });
    
    it('should identify isolated nodes', async () => {
      // Find nodes that don't belong to any community
      const result = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        WHERE NOT (p)-[:IN_GROUP]-()
        RETURN p.name AS name
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // There may or may not be isolated nodes
      console.log(`Found ${result.rows.length} isolated nodes`);
    });
  });
  
  describe('Custom Algorithms', () => {
    it('should implement a custom influence propagation algorithm', async () => {
      // Implement a simple influence propagation algorithm
      // Each person's influence is propagated to their neighbors,
      // weighted by the relationship weight
      
      // First, get all persons and their initial influence
      const personsResult = await queryExecutor.executeCypher(
        `
        MATCH (p:Person)
        RETURN p.name AS name, p.influence AS influence
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Calculate propagated influence
      const propagatedInfluence = new Map<string, number>();
      
      // Initialize with base influence
      for (const row of personsResult.rows) {
        propagatedInfluence.set(row.name, row.influence);
      }
      
      // Get all relationships
      const relationshipsResult = await queryExecutor.executeCypher(
        `
        MATCH (a:Person)-[r:KNOWS]->(b:Person)
        RETURN a.name AS from, b.name AS to, r.weight AS weight, a.influence AS influence
        `,
        {},
        AGE_GRAPH_NAME
      );
      
      // Propagate influence through relationships
      for (const rel of relationshipsResult.rows) {
        const currentInfluence = propagatedInfluence.get(rel.to) || 0;
        const propagatedValue = rel.influence * rel.weight * 0.5; // 50% of influence is propagated
        propagatedInfluence.set(rel.to, currentInfluence + propagatedValue);
      }
      
      // Convert to array for easier testing
      const results = Array.from(propagatedInfluence.entries())
        .map(([name, influence]) => ({ name, influence }))
        .sort((a, b) => b.influence - a.influence);
      
      // Verify the result
      expect(results.length).toBeGreaterThan(0);
      
      // The most influential person after propagation should have a higher influence
      // than their base influence
      const mostInfluential = results[0];
      const baseInfluence = personsResult.rows.find(p => p.name === mostInfluential.name)?.influence || 0;
      
      expect(mostInfluential.influence).toBeGreaterThan(baseInfluence);
    });
  });
});
