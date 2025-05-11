/**
 * Query result processing utilities
 *
 * @packageDocumentation
 */

import { QueryResult } from '../db/query';

/**
 * Result processing options
 */
export interface ResultProcessingOptions {
  /**
   * Whether to flatten nested objects
   */
  flatten?: boolean;

  /**
   * Whether to convert graph paths to arrays of nodes and relationships
   */
  expandPaths?: boolean;

  /**
   * Whether to convert date strings to Date objects
   */
  parseDates?: boolean;

  /**
   * Whether to remove null values from results
   */
  removeNulls?: boolean;

  /**
   * Whether to convert numeric strings to numbers
   */
  parseNumbers?: boolean;

  /**
   * Custom transformers for specific fields
   */
  transformers?: Record<string, (value: any) => any>;
}

/**
 * Path representation
 */
export interface PathRepresentation {
  /**
   * Nodes in the path
   */
  nodes: any[];

  /**
   * Relationships in the path
   */
  relationships: any[];

  /**
   * Path length
   */
  length: number;
}

/**
 * Result processor class
 *
 * Provides utilities for processing query results
 */
export class ResultProcessor {
  /**
   * Process a query result
   *
   * @param result - Query result
   * @param options - Processing options
   * @returns Processed result
   */
  static process(result: QueryResult, options: ResultProcessingOptions = {}): any[] {
    if (!result || !result.rows) {
      return [];
    }

    return result.rows.map(row => this.processRow(row, options));
  }

  /**
   * Process a single result row
   *
   * @param row - Result row
   * @param options - Processing options
   * @returns Processed row
   */
  private static processRow(row: Record<string, any>, options: ResultProcessingOptions): Record<string, any> {
    let processed: Record<string, any> = {};

    // First pass: process all values
    for (const [key, value] of Object.entries(row)) {
      let processedValue = value;

      // Apply custom transformers if provided
      if (options.transformers && options.transformers[key]) {
        processedValue = options.transformers[key](processedValue);
        processed[key] = processedValue;
        continue;
      }

      // Process value based on type and options
      if (processedValue === null && options.removeNulls) {
        continue;
      } else if (typeof processedValue === 'string') {
        if (options.parseDates && this.isDateString(processedValue)) {
          processedValue = new Date(processedValue);
        } else if (options.parseNumbers && this.isNumericString(processedValue)) {
          processedValue = parseFloat(processedValue);
        }
      } else if (typeof processedValue === 'object' && processedValue !== null) {
        if (this.isPath(processedValue) && options.expandPaths) {
          processedValue = this.expandPath(processedValue);
        }
      }

      processed[key] = processedValue;
    }

    // Second pass: flatten if needed
    if (options.flatten) {
      const flattened: Record<string, any> = {};

      for (const [key, value] of Object.entries(processed)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !this.isPath(value)) {
          const flattenedObj = this.flattenObject(value, key);
          Object.assign(flattened, flattenedObj);
        } else {
          flattened[key] = value;
        }
      }

      processed = flattened;
    }

    return processed;
  }

  /**
   * Check if a value is a path object
   *
   * @param value - Value to check
   * @returns Whether the value is a path
   */
  private static isPath(value: any): boolean {
    return value &&
           typeof value === 'object' &&
           Array.isArray(value.nodes) &&
           Array.isArray(value.relationships);
  }

  /**
   * Expand a path into a more detailed representation
   *
   * @param path - Path object
   * @returns Expanded path representation
   */
  private static expandPath(path: any): PathRepresentation {
    return {
      nodes: path.nodes || [],
      relationships: path.relationships || [],
      length: path.length || (path.relationships ? path.relationships.length : 0)
    };
  }

  /**
   * Flatten a nested object
   *
   * @param obj - Object to flatten
   * @param prefix - Key prefix for flattened properties
   * @returns Flattened object
   */
  private static flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const nestedFlattened = this.flattenObject(value, newKey);
        for (const [nestedKey, nestedValue] of Object.entries(nestedFlattened)) {
          flattened[nestedKey] = nestedValue;
        }
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Check if a string is a date string
   *
   * @param str - String to check
   * @returns Whether the string is a date string
   */
  private static isDateString(str: string): boolean {
    // ISO date format regex
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;
    return isoDateRegex.test(str) && !isNaN(Date.parse(str));
  }

  /**
   * Check if a string is a numeric string
   *
   * @param str - String to check
   * @returns Whether the string is a numeric string
   */
  private static isNumericString(str: string): boolean {
    return /^-?\d+(\.\d+)?$/.test(str);
  }

  /**
   * Extract a specific field from all result rows
   *
   * @param result - Query result
   * @param field - Field to extract
   * @returns Array of field values
   */
  static extractField<T = any>(result: QueryResult, field: string): T[] {
    if (!result || !result.rows) {
      return [];
    }

    return result.rows.map(row => row[field]) as T[];
  }

  /**
   * Group results by a specific field
   *
   * @param result - Query result
   * @param field - Field to group by
   * @returns Grouped results
   */
  static groupBy(result: QueryResult, field: string): Record<string, any[]> {
    if (!result || !result.rows) {
      return {};
    }

    const grouped: Record<string, any[]> = {};

    for (const row of result.rows) {
      const key = String(row[field]);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(row);
    }

    return grouped;
  }

  /**
   * Convert results to a graph structure
   *
   * @param result - Query result
   * @param nodeField - Field containing nodes
   * @param edgeField - Field containing edges
   * @returns Graph structure
   */
  static toGraph(
    result: QueryResult,
    nodeField: string = 'nodes',
    edgeField: string = 'relationships'
  ): { nodes: any[], edges: any[] } {
    if (!result || !result.rows) {
      return { nodes: [], edges: [] };
    }

    const nodes = new Map<string, any>();
    const edges = new Map<string, any>();

    for (const row of result.rows) {
      const rowNodes = row[nodeField];
      const rowEdges = row[edgeField];

      if (Array.isArray(rowNodes)) {
        for (const node of rowNodes) {
          if (node && node.id) {
            nodes.set(node.id, node);
          }
        }
      }

      if (Array.isArray(rowEdges)) {
        for (const edge of rowEdges) {
          if (edge && edge.id) {
            edges.set(edge.id, edge);
          }
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };
  }
}
