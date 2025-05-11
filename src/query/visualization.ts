/**
 * Query visualization and optimization helpers
 *
 * @packageDocumentation
 */

import { QueryResult } from '../db/query';
import { ResultProcessor } from './results';

/**
 * Graph visualization options
 */
export interface GraphVisualizationOptions {
  /**
   * Node label property
   */
  nodeLabelProperty?: string;

  /**
   * Edge label property
   */
  edgeLabelProperty?: string;

  /**
   * Node color property
   */
  nodeColorProperty?: string;

  /**
   * Edge color property
   */
  edgeColorProperty?: string;

  /**
   * Node size property
   */
  nodeSizeProperty?: string;

  /**
   * Edge width property
   */
  edgeWidthProperty?: string;

  /**
   * Default node color
   */
  defaultNodeColor?: string;

  /**
   * Default edge color
   */
  defaultEdgeColor?: string;

  /**
   * Default node size
   */
  defaultNodeSize?: number;

  /**
   * Default edge width
   */
  defaultEdgeWidth?: number;
}

/**
 * Graph visualization data
 */
export interface GraphVisualizationData {
  /**
   * Nodes
   */
  nodes: Array<{
    /**
     * Node ID
     */
    id: string;

    /**
     * Node label
     */
    label: string;

    /**
     * Node color
     */
    color?: string;

    /**
     * Node size
     */
    size?: number;

    /**
     * Original node data
     */
    data: any;
  }>;

  /**
   * Edges
   */
  edges: Array<{
    /**
     * Edge ID
     */
    id: string;

    /**
     * Source node ID
     */
    source: string;

    /**
     * Target node ID
     */
    target: string;

    /**
     * Edge label
     */
    label?: string;

    /**
     * Edge color
     */
    color?: string;

    /**
     * Edge width
     */
    width?: number;

    /**
     * Original edge data
     */
    data: any;
  }>;
}

/**
 * Query plan node
 */
export interface QueryPlanNode {
  /**
   * Node ID
   */
  id: string;

  /**
   * Node type
   */
  type: string;

  /**
   * Node details
   */
  details: Record<string, any>;

  /**
   * Child nodes
   */
  children?: QueryPlanNode[];

  /**
   * Estimated rows
   */
  estimatedRows?: number;

  /**
   * Actual rows
   */
  actualRows?: number;

  /**
   * Execution time (ms)
   */
  executionTime?: number;
}

/**
 * Query visualization helper
 *
 * Provides utilities for visualizing query results and execution plans
 */
export class QueryVisualization {
  /**
   * Convert query result to graph visualization data
   *
   * @param result - Query result
   * @param options - Visualization options
   * @returns Graph visualization data
   */
  static toGraphVisualization(
    result: QueryResult,
    options: GraphVisualizationOptions = {}
  ): GraphVisualizationData {
    const graph = ResultProcessor.toGraph(result);

    const nodeLabelProp = options.nodeLabelProperty || 'name';
    const edgeLabelProp = options.edgeLabelProperty || 'type';
    const nodeColorProp = options.nodeColorProperty;
    const edgeColorProp = options.edgeColorProperty;
    const nodeSizeProp = options.nodeSizeProperty;
    const edgeWidthProp = options.edgeWidthProperty;

    const defaultNodeColor = options.defaultNodeColor || '#1f77b4';
    const defaultEdgeColor = options.defaultEdgeColor || '#7f7f7f';
    const defaultNodeSize = options.defaultNodeSize || 10;
    const defaultEdgeWidth = options.defaultEdgeWidth || 1;

    const nodes = graph.nodes.map(node => ({
      id: node.id,
      label: String(node[nodeLabelProp] || node.id),
      color: nodeColorProp ? node[nodeColorProp] : defaultNodeColor,
      size: nodeSizeProp ? Number(node[nodeSizeProp]) || defaultNodeSize : defaultNodeSize,
      data: node
    }));

    const edges = graph.edges.map(edge => ({
      id: edge.id,
      source: edge.source || edge.start || edge.from,
      target: edge.target || edge.end || edge.to,
      label: edgeLabelProp ? String(edge[edgeLabelProp] || '') : undefined,
      color: edgeColorProp ? edge[edgeColorProp] : defaultEdgeColor,
      width: edgeWidthProp ? Number(edge[edgeWidthProp]) || defaultEdgeWidth : defaultEdgeWidth,
      data: edge
    }));

    return { nodes, edges };
  }

  /**
   * Generate a DOT language representation of a graph
   *
   * @param graphData - Graph visualization data
   * @param directed - Whether the graph is directed
   * @returns DOT language representation
   */
  static toDot(graphData: GraphVisualizationData, directed: boolean = true): string {
    const graphType = directed ? 'digraph' : 'graph';
    const edgeOp = directed ? '->' : '--';

    let dot = `${graphType} G {\n`;
    dot += '  // Node definitions\n';

    // Add nodes
    for (const node of graphData.nodes) {
      const attrs = [
        `label="${node.label}"`,
        `color="${node.color || '#000000'}"`,
        `width=${node.size || 1}`
      ];

      dot += `  "${node.id}" [${attrs.join(', ')}];\n`;
    }

    dot += '\n  // Edge definitions\n';

    // Add edges
    for (const edge of graphData.edges) {
      const attrs = [];

      if (edge.label) {
        attrs.push(`label="${edge.label}"`);
      }

      if (edge.color) {
        attrs.push(`color="${edge.color}"`);
      }

      if (edge.width) {
        attrs.push(`penwidth=${edge.width}`);
      }

      const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
      dot += `  "${edge.source}" ${edgeOp} "${edge.target}"${attrStr};\n`;
    }

    dot += '}\n';

    return dot;
  }

  /**
   * Parse a query execution plan
   *
   * @param planResult - Query execution plan result
   * @returns Parsed query plan
   */
  static parseQueryPlan(planResult: any): QueryPlanNode | null {
    if (!planResult || !planResult.plan) {
      return null;
    }

    return this.parsePlanNode(planResult.plan);
  }

  /**
   * Parse a query plan node
   *
   * @param node - Query plan node
   * @returns Parsed query plan node
   */
  private static parsePlanNode(node: any): QueryPlanNode {
    const { id, type, details = {}, children = [], estimatedRows, actualRows, executionTime } = node;

    const parsedChildren = Array.isArray(children)
      ? children.map(child => this.parsePlanNode(child))
      : [];

    return {
      id: id || `node-${Math.random().toString(36).substring(2, 9)}`,
      type: type || 'Unknown',
      details,
      children: parsedChildren,
      estimatedRows,
      actualRows,
      executionTime
    };
  }

  /**
   * Generate a DOT language representation of a query plan
   *
   * @param plan - Query plan
   * @returns DOT language representation
   */
  static queryPlanToDot(plan: QueryPlanNode): string {
    let dot = 'digraph QueryPlan {\n';
    dot += '  // Node definitions\n';

    const nodeMap = new Map<string, QueryPlanNode>();
    this.collectPlanNodes(plan, nodeMap);

    // Add nodes
    for (const [id, node] of nodeMap.entries()) {
      const label = `${node.type}\\n${Object.entries(node.details)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\\n')}`;

      const attrs = [
        `label="${label}"`,
        `shape="box"`
      ];

      if (node.estimatedRows !== undefined) {
        attrs.push(`tooltip="Est. rows: ${node.estimatedRows}"`);
      }

      if (node.executionTime !== undefined) {
        attrs.push(`color="${this.getColorForExecutionTime(node.executionTime)}"`);
      }

      dot += `  "${id}" [${attrs.join(', ')}];\n`;
    }

    dot += '\n  // Edge definitions\n';

    // Add edges
    dot = this.addPlanEdges(plan, dot);

    dot += '}\n';

    return dot;
  }

  /**
   * Collect all nodes in a query plan
   *
   * @param node - Query plan node
   * @param nodeMap - Node map
   */
  private static collectPlanNodes(node: QueryPlanNode, nodeMap: Map<string, QueryPlanNode>): void {
    nodeMap.set(node.id, node);

    if (node.children) {
      for (const child of node.children) {
        this.collectPlanNodes(child, nodeMap);
      }
    }
  }

  /**
   * Add edges for a query plan
   *
   * @param node - Query plan node
   * @param dot - DOT language representation
   * @returns Updated DOT language representation
   */
  private static addPlanEdges(node: QueryPlanNode, dot: string): string {
    let updatedDot = dot;

    if (node.children) {
      for (const child of node.children) {
        updatedDot += `  "${node.id}" -> "${child.id}";\n`;
        updatedDot = this.addPlanEdges(child, updatedDot);
      }
    }

    return updatedDot;
  }

  /**
   * Get color for execution time
   *
   * @param time - Execution time (ms)
   * @returns Color
   */
  private static getColorForExecutionTime(time: number): string {
    if (time < 10) {
      return '#00ff00'; // Green for fast
    } else if (time < 100) {
      return '#ffff00'; // Yellow for medium
    } else {
      return '#ff0000'; // Red for slow
    }
  }
}
