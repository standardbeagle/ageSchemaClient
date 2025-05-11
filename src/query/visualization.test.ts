/**
 * Tests for the query visualization helpers
 */

import { describe, it, expect } from 'vitest';
import { QueryVisualization, GraphVisualizationOptions, GraphVisualizationData, QueryPlanNode } from './visualization';
import { QueryResult } from '../db/query';

describe('QueryVisualization', () => {
  describe('toGraphVisualization', () => {
    it('should convert query result to graph visualization data', () => {
      const result: QueryResult = {
        rows: [
          {
            nodes: [
              { id: '1', name: 'Alice', age: 30 },
              { id: '2', name: 'Bob', age: 25 }
            ],
            relationships: [
              { id: '101', source: '1', target: '2', type: 'KNOWS', since: '2020-01-01' }
            ]
          }
        ]
      };

      const visualData = QueryVisualization.toGraphVisualization(result);
      
      expect(visualData.nodes.length).toBe(2);
      expect(visualData.edges.length).toBe(1);
      
      expect(visualData.nodes[0].id).toBe('1');
      expect(visualData.nodes[0].label).toBe('Alice');
      expect(visualData.nodes[1].id).toBe('2');
      expect(visualData.nodes[1].label).toBe('Bob');
      
      expect(visualData.edges[0].id).toBe('101');
      expect(visualData.edges[0].source).toBe('1');
      expect(visualData.edges[0].target).toBe('2');
    });

    it('should apply custom visualization options', () => {
      const result: QueryResult = {
        rows: [
          {
            nodes: [
              { id: '1', name: 'Alice', age: 30, category: 'User', importance: 5 },
              { id: '2', name: 'Bob', age: 25, category: 'Admin', importance: 8 }
            ],
            relationships: [
              { 
                id: '101', 
                source: '1', 
                target: '2', 
                type: 'KNOWS', 
                since: '2020-01-01',
                strength: 3,
                relationship: 'Friend'
              }
            ]
          }
        ]
      };

      const options: GraphVisualizationOptions = {
        nodeLabelProperty: 'name',
        nodeColorProperty: 'category',
        nodeSizeProperty: 'importance',
        edgeLabelProperty: 'relationship',
        edgeWidthProperty: 'strength',
        defaultNodeColor: '#ff0000',
        defaultEdgeColor: '#00ff00',
        defaultNodeSize: 5,
        defaultEdgeWidth: 2
      };

      const visualData = QueryVisualization.toGraphVisualization(result, options);
      
      expect(visualData.nodes[0].label).toBe('Alice');
      expect(visualData.nodes[0].color).toBe('User');
      expect(visualData.nodes[0].size).toBe(5);
      
      expect(visualData.nodes[1].label).toBe('Bob');
      expect(visualData.nodes[1].color).toBe('Admin');
      expect(visualData.nodes[1].size).toBe(8);
      
      expect(visualData.edges[0].label).toBe('Friend');
      expect(visualData.edges[0].width).toBe(3);
    });

    it('should handle empty results', () => {
      const result: QueryResult = {
        rows: []
      };

      const visualData = QueryVisualization.toGraphVisualization(result);
      
      expect(visualData.nodes.length).toBe(0);
      expect(visualData.edges.length).toBe(0);
    });
  });

  describe('toDot', () => {
    it('should generate DOT language representation of a graph', () => {
      const graphData: GraphVisualizationData = {
        nodes: [
          { id: '1', label: 'Alice', color: '#ff0000', size: 10, data: { name: 'Alice' } },
          { id: '2', label: 'Bob', color: '#00ff00', size: 15, data: { name: 'Bob' } }
        ],
        edges: [
          { 
            id: '101', 
            source: '1', 
            target: '2', 
            label: 'KNOWS', 
            color: '#0000ff', 
            width: 2, 
            data: { type: 'KNOWS' } 
          }
        ]
      };

      const dot = QueryVisualization.toDot(graphData);
      
      expect(dot).toContain('digraph G {');
      expect(dot).toContain('"1" [label="Alice", color="#ff0000", width=10];');
      expect(dot).toContain('"2" [label="Bob", color="#00ff00", width=15];');
      expect(dot).toContain('"1" -> "2" [label="KNOWS", color="#0000ff", penwidth=2];');
      expect(dot).toContain('}');
    });

    it('should support undirected graphs', () => {
      const graphData: GraphVisualizationData = {
        nodes: [
          { id: '1', label: 'Alice', data: { name: 'Alice' } },
          { id: '2', label: 'Bob', data: { name: 'Bob' } }
        ],
        edges: [
          { id: '101', source: '1', target: '2', data: { type: 'KNOWS' } }
        ]
      };

      const dot = QueryVisualization.toDot(graphData, false);
      
      expect(dot).toContain('graph G {');
      expect(dot).toContain('"1" -- "2"');
    });
  });

  describe('parseQueryPlan', () => {
    it('should parse a query execution plan', () => {
      const planResult = {
        plan: {
          id: 'root',
          type: 'Projection',
          details: { expressions: ['n', 'r', 'm'] },
          estimatedRows: 10,
          actualRows: 5,
          executionTime: 15,
          children: [
            {
              id: 'child1',
              type: 'NodeByLabelScan',
              details: { label: 'Person' },
              estimatedRows: 100,
              actualRows: 50,
              executionTime: 5
            }
          ]
        }
      };

      const plan = QueryVisualization.parseQueryPlan(planResult);
      
      expect(plan).not.toBeNull();
      expect(plan?.id).toBe('root');
      expect(plan?.type).toBe('Projection');
      expect(plan?.details).toEqual({ expressions: ['n', 'r', 'm'] });
      expect(plan?.estimatedRows).toBe(10);
      expect(plan?.actualRows).toBe(5);
      expect(plan?.executionTime).toBe(15);
      
      expect(plan?.children?.length).toBe(1);
      expect(plan?.children?.[0].id).toBe('child1');
      expect(plan?.children?.[0].type).toBe('NodeByLabelScan');
    });

    it('should handle null or undefined plan result', () => {
      expect(QueryVisualization.parseQueryPlan(null as any)).toBeNull();
      expect(QueryVisualization.parseQueryPlan(undefined as any)).toBeNull();
      expect(QueryVisualization.parseQueryPlan({} as any)).toBeNull();
    });
  });

  describe('queryPlanToDot', () => {
    it('should generate DOT language representation of a query plan', () => {
      const plan: QueryPlanNode = {
        id: 'root',
        type: 'Projection',
        details: { expressions: ['n', 'r', 'm'] },
        estimatedRows: 10,
        actualRows: 5,
        executionTime: 15,
        children: [
          {
            id: 'child1',
            type: 'NodeByLabelScan',
            details: { label: 'Person' },
            estimatedRows: 100,
            actualRows: 50,
            executionTime: 5
          }
        ]
      };

      const dot = QueryVisualization.queryPlanToDot(plan);
      
      expect(dot).toContain('digraph QueryPlan {');
      expect(dot).toContain('"root" [label="Projection\\nexpressions: n,r,m"');
      expect(dot).toContain('"child1" [label="NodeByLabelScan\\nlabel: Person"');
      expect(dot).toContain('"root" -> "child1";');
      expect(dot).toContain('}');
    });
  });
});
