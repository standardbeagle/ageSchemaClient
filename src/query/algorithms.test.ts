/**
 * Tests for the graph algorithm query builders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlgorithmQueryBuilder, PathFindingOptions, CentralityOptions, CommunityDetectionOptions } from './algorithms';
import { QueryExecutor } from '../db/query';
import { SchemaDefinition } from '../schema/types';

// Mock schema definition
const mockSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Person: {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    },
    Location: {
      properties: {
        name: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' }
      },
      required: ['name']
    }
  },
  edges: {
    KNOWS: {
      properties: {
        since: { type: 'date' },
        weight: { type: 'number' }
      },
      source: 'Person',
      target: 'Person'
    },
    VISITED: {
      properties: {
        date: { type: 'date' },
        rating: { type: 'number' },
        distance: { type: 'number' }
      },
      source: 'Person',
      target: 'Location'
    }
  }
};

// Mock query executor
const mockExecutor = {
  executeCypher: vi.fn().mockResolvedValue({ rows: [] })
} as unknown as QueryExecutor;

describe('AlgorithmQueryBuilder', () => {
  let queryBuilder: AlgorithmQueryBuilder<typeof mockSchema>;

  beforeEach(() => {
    queryBuilder = new AlgorithmQueryBuilder(mockSchema, mockExecutor);
    vi.clearAllMocks();
  });

  describe('shortestPath', () => {
    it('should generate a basic shortest path query', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .where('p1.name = $name1')
        .where('p2.name = $name2')
        .shortestPath('p1', 'p2')
        .toCypher();

      expect(query).toContain('MATCH (p1:Person)');
      expect(query).toContain('MATCH (p2:Person)');
      expect(query).toContain('WHERE p1.name = $name1');
      expect(query).toContain('WHERE p2.name = $name2');
      expect(query).toContain('RETURN shortestPath((p1)-[]*->(p2)) AS path');
    });

    it('should support relationship types and max depth', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .shortestPath('p1', 'p2', 'path', {
          relationshipTypes: ['KNOWS'],
          maxDepth: 3
        })
        .toCypher();

      expect(query).toContain('RETURN shortestPath((p1)-[:KNOWS]*1..3->(p2)) AS path');
    });
  });

  describe('allShortestPaths', () => {
    it('should generate a query for all shortest paths', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .allShortestPaths('p1', 'p2', 'allPaths')
        .toCypher();

      expect(query).toContain('RETURN allShortestPaths((p1)-[]*->(p2)) AS allPaths');
    });
  });

  describe('dijkstra', () => {
    it('should generate a dijkstra algorithm query', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .dijkstra('p1', 'p2', 'distance', 'weightedPath')
        .toCypher();

      expect(query).toContain("RETURN apoc.algo.dijkstra(p1, p2, '', 'distance') AS weightedPath");
    });

    it('should support relationship types', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .dijkstra('p1', 'p2', 'distance', 'weightedPath', {
          relationshipTypes: ['VISITED']
        })
        .toCypher();

      expect(query).toContain("RETURN apoc.algo.dijkstra(p1, p2, ':VISITED', 'distance') AS weightedPath");
    });
  });

  describe('centrality algorithms', () => {
    it('should generate a betweenness centrality query', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .betweennessCentrality('p')
        .toCypher();

      expect(query).toContain('RETURN apoc.algo.betweenness(p, null) AS centrality');
    });

    it('should generate a pageRank query', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .pageRank('p', 'rank', 0.9, 30)
        .toCypher();

      expect(query).toContain('RETURN apoc.algo.pageRank(p, 0.9, 30) AS rank');
    });
  });

  describe('community detection', () => {
    it('should generate a louvain community detection query', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .louvain('p')
        .toCypher();

      expect(query).toContain('RETURN apoc.algo.louvain(p, 10) AS community');
    });

    it('should support custom iterations', () => {
      const query = queryBuilder
        .match('Person', 'p')
        .louvain('p', 'community', { maxIterations: 20 })
        .toCypher();

      expect(query).toContain('RETURN apoc.algo.louvain(p, 20) AS community');
    });
  });

  describe('path utilities', () => {
    it('should extract nodes from a path', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .shortestPath('p1', 'p2', 'p')
        .extractNodes('p', 'pathNodes')
        .toCypher();

      expect(query).toContain('RETURN shortestPath((p1)-[]*->(p2)) AS p');
      expect(query).toContain('RETURN nodes(p) AS pathNodes');
    });

    it('should extract relationships from a path', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .shortestPath('p1', 'p2')
        .extractRelationships()
        .toCypher();

      expect(query).toContain('RETURN relationships(path) AS relationships');
    });

    it('should calculate path length', () => {
      const query = queryBuilder
        .match('Person', 'p1')
        .match('Person', 'p2')
        .shortestPath('p1', 'p2', 'p')
        .pathLength('p', 'pathLength')
        .toCypher();

      expect(query).toContain('RETURN length(p) AS pathLength');
    });
  });
});
