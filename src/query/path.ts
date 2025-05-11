/**
 * Path query builder implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { QueryBuilder } from './builder';
import {
  QueryPart,
  QueryPartType,
  MatchPatternType,
  VertexPattern,
  EdgePattern,
  PathPattern,
  QueryExecutionOptions,
  QueryBuilderResult,
} from './types';
import { MatchPart, ReturnPart } from './parts';

/**
 * Path part class
 */
export class PathPart implements QueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.MATCH;
  
  /**
   * Path pattern
   */
  private pattern: string;
  
  /**
   * Path alias
   */
  private alias: string;
  
  /**
   * Create a new path part
   * 
   * @param pattern - Path pattern
   * @param alias - Path alias
   */
  constructor(pattern: string, alias: string) {
    this.pattern = pattern;
    this.alias = alias;
  }
  
  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    return `MATCH ${this.alias} = ${this.pattern}`;
  }
  
  /**
   * Get parameters used in this query part
   */
  getParameters(): Record<string, any> {
    return {};
  }
}

/**
 * Path query builder class
 * 
 * Specialized query builder for path finding and traversal operations
 */
export class PathQueryBuilder<T extends SchemaDefinition> extends QueryBuilder<T> {
  /**
   * Create a new path query builder
   * 
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param graphName - Graph name
   */
  constructor(
    schema: T,
    queryExecutor: QueryExecutor,
    graphName: string = 'default'
  ) {
    super(schema, queryExecutor, graphName);
  }
  
  /**
   * Find the shortest path between two vertices
   * 
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param relationshipTypes - Relationship types to traverse
   * @param maxDepth - Maximum path depth
   * @returns This path query builder
   */
  shortestPath(
    startAlias: string,
    endAlias: string,
    relationshipTypes?: string[],
    maxDepth?: number
  ): this {
    const relTypes = relationshipTypes ? `:${relationshipTypes.join('|')}` : '';
    const depthConstraint = maxDepth !== undefined ? `*1..${maxDepth}` : '*';
    const pathPattern = `shortestPath((${startAlias})-[${relTypes}]${depthConstraint}->(${endAlias}))`;
    
    this.queryParts.push(new PathPart(pathPattern, 'p'));
    return this;
  }
  
  /**
   * Find all paths between two vertices
   * 
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param relationshipTypes - Relationship types to traverse
   * @param maxDepth - Maximum path depth
   * @returns This path query builder
   */
  allPaths(
    startAlias: string,
    endAlias: string,
    relationshipTypes?: string[],
    maxDepth?: number
  ): this {
    const relTypes = relationshipTypes ? `:${relationshipTypes.join('|')}` : '';
    const depthConstraint = maxDepth !== undefined ? `*1..${maxDepth}` : '*';
    const pathPattern = `allShortestPaths((${startAlias})-[${relTypes}]${depthConstraint}->(${endAlias}))`;
    
    this.queryParts.push(new PathPart(pathPattern, 'p'));
    return this;
  }
  
  /**
   * Create a variable-length path query
   * 
   * @param startAlias - Start vertex alias
   * @param relationshipAlias - Relationship alias
   * @param endAlias - End vertex alias
   * @param relationshipTypes - Relationship types to traverse
   * @param minDepth - Minimum path depth
   * @param maxDepth - Maximum path depth
   * @returns This path query builder
   */
  variableLengthPath(
    startAlias: string,
    relationshipAlias: string,
    endAlias: string,
    relationshipTypes?: string[],
    minDepth: number = 1,
    maxDepth?: number
  ): this {
    const relTypes = relationshipTypes ? `:${relationshipTypes.join('|')}` : '';
    const depthConstraint = maxDepth !== undefined ? `*${minDepth}..${maxDepth}` : `*${minDepth}..`;
    
    const pattern = `(${startAlias})-[${relationshipAlias}${relTypes}]${depthConstraint}->(${endAlias})`;
    this.queryParts.push(new MatchPart([{
      type: MatchPatternType.PATH,
      toCypher: () => pattern,
    }]));
    
    return this;
  }
  
  /**
   * Perform a breadth-first search
   * 
   * @param startAlias - Start vertex alias
   * @param relationshipAlias - Relationship alias
   * @param endAlias - End vertex alias
   * @param relationshipTypes - Relationship types to traverse
   * @param maxDepth - Maximum depth
   * @returns This path query builder
   */
  breadthFirstSearch(
    startAlias: string,
    relationshipAlias: string,
    endAlias: string,
    relationshipTypes?: string[],
    maxDepth: number = 5
  ): this {
    // First match the start and end vertices
    this.queryParts.push(new MatchPart([{
      type: MatchPatternType.VERTEX,
      alias: startAlias,
      label: '',
      properties: {},
      toCypher: () => `(${startAlias})`
    }]));
    
    // Then use APOC to perform BFS (this is a placeholder, actual implementation depends on available procedures)
    const relTypes = relationshipTypes ? `:${relationshipTypes.join('|')}` : '';
    const cypher = `CALL apoc.path.expandBFS(${startAlias}, "${relTypes}", null, 1, ${maxDepth}) YIELD path`;
    
    // Add WITH clause to pass the path to the next part of the query
    this.with('path');
    
    return this;
  }
  
  /**
   * Extract nodes from a path
   * 
   * @param pathAlias - Path alias
   * @returns This path query builder
   */
  extractNodes(pathAlias: string = 'p'): this {
    this.return(`nodes(${pathAlias}) AS nodes`);
    return this;
  }
  
  /**
   * Extract relationships from a path
   * 
   * @param pathAlias - Path alias
   * @returns This path query builder
   */
  extractRelationships(pathAlias: string = 'p'): this {
    this.return(`relationships(${pathAlias}) AS relationships`);
    return this;
  }
  
  /**
   * Extract both nodes and relationships from a path
   * 
   * @param pathAlias - Path alias
   * @returns This path query builder
   */
  extractPath(pathAlias: string = 'p'): this {
    this.return(
      `nodes(${pathAlias}) AS nodes`,
      `relationships(${pathAlias}) AS relationships`,
      `length(${pathAlias}) AS length`
    );
    return this;
  }
}
