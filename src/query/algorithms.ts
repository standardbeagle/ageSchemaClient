/**
 * Graph algorithm query builders
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import { AnalyticsQueryBuilder, AnalyticsMatchClause } from './analytics';
import { VertexPattern, IEdgeMatchClause, MatchPatternType } from './types';
import { MatchPart } from './parts';

/**
 * Algorithm type
 */
export enum AlgorithmType {
  SHORTEST_PATH = 'shortestPath',
  ALL_SHORTEST_PATHS = 'allShortestPaths',
  DIJKSTRA = 'dijkstra',
  BETWEENNESS_CENTRALITY = 'betweennessCentrality',
  CLOSENESS_CENTRALITY = 'closenessCentrality',
  PAGE_RANK = 'pageRank',
  COMMUNITY_DETECTION = 'communityDetection',
  STRONGLY_CONNECTED_COMPONENTS = 'stronglyConnectedComponents',
  WEAKLY_CONNECTED_COMPONENTS = 'weaklyConnectedComponents',
  TRIANGLE_COUNT = 'triangleCount',
  LABEL_PROPAGATION = 'labelPropagation',
  LOUVAIN = 'louvain'
}

/**
 * Path finding options
 */
export interface PathFindingOptions {
  /**
   * Maximum path length
   */
  maxDepth?: number;

  /**
   * Relationship types to traverse
   */
  relationshipTypes?: string[];

  /**
   * Cost property for weighted path algorithms
   */
  costProperty?: string;

  /**
   * Default cost for relationships without cost property
   */
  defaultCost?: number;

  /**
   * Whether to include relationship properties in the result
   */
  includeRelationshipProperties?: boolean;
}

/**
 * Centrality algorithm options
 */
export interface CentralityOptions {
  /**
   * Maximum path length to consider
   */
  maxDepth?: number;

  /**
   * Relationship types to traverse
   */
  relationshipTypes?: string[];

  /**
   * Cost property for weighted algorithms
   */
  costProperty?: string;

  /**
   * Default cost for relationships without cost property
   */
  defaultCost?: number;

  /**
   * Whether to normalize results (0-1 range)
   */
  normalize?: boolean;
}

/**
 * Community detection options
 */
export interface CommunityDetectionOptions {
  /**
   * Maximum number of iterations
   */
  maxIterations?: number;

  /**
   * Relationship types to consider
   */
  relationshipTypes?: string[];

  /**
   * Weight property for weighted algorithms
   */
  weightProperty?: string;

  /**
   * Default weight for relationships without weight property
   */
  defaultWeight?: number;

  /**
   * Convergence threshold
   */
  convergenceThreshold?: number;
}

/**
 * Algorithm match clause class
 *
 * Extends the analytics match clause with graph algorithm capabilities
 */
export class AlgorithmMatchClause<
  T extends SchemaDefinition,
  L extends keyof T['vertices']
> extends AnalyticsMatchClause<T, L> {
  /**
   * Create a new algorithm match clause
   *
   * @param queryBuilder - Query builder
   * @param matchPart - Match part
   * @param vertexPattern - Vertex pattern
   */
  constructor(
    queryBuilder: AlgorithmQueryBuilder<T>,
    matchPart: MatchPart,
    vertexPattern: VertexPattern
  ) {
    // Cast to AnalyticsQueryBuilder to satisfy the parent constructor
    super(queryBuilder as unknown as AnalyticsQueryBuilder<T>, matchPart, vertexPattern);
  }

  /**
   * Find the shortest path between two vertices
   *
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param resultAlias - Result path alias
   * @param options - Path finding options
   * @returns This algorithm query builder
   */
  shortestPath(
    startAlias: string,
    endAlias: string,
    resultAlias: string = 'path',
    options: PathFindingOptions = {}
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.shortestPath(startAlias, endAlias, resultAlias, options);
    return queryBuilder;
  }

  /**
   * Find all shortest paths between two vertices
   *
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param resultAlias - Result paths alias
   * @param options - Path finding options
   * @returns This algorithm query builder
   */
  allShortestPaths(
    startAlias: string,
    endAlias: string,
    resultAlias: string = 'paths',
    options: PathFindingOptions = {}
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.allShortestPaths(startAlias, endAlias, resultAlias, options);
    return queryBuilder;
  }

  /**
   * Find the shortest weighted path between two vertices using Dijkstra's algorithm
   *
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param costProperty - Relationship property to use as cost
   * @param resultAlias - Result path alias
   * @param options - Path finding options
   * @returns This algorithm query builder
   */
  dijkstra(
    startAlias: string,
    endAlias: string,
    costProperty: string,
    resultAlias: string = 'path',
    options: PathFindingOptions = {}
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.dijkstra(startAlias, endAlias, costProperty, resultAlias, options);
    return queryBuilder;
  }

  /**
   * Calculate betweenness centrality for vertices
   *
   * @param vertexAlias - Vertex alias
   * @param resultAlias - Result alias
   * @param options - Centrality options
   * @returns This algorithm query builder
   */
  betweennessCentrality(
    vertexAlias: string,
    resultAlias: string = 'centrality',
    options: CentralityOptions = {}
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.betweennessCentrality(vertexAlias, resultAlias, options);
    return queryBuilder;
  }

  /**
   * Calculate PageRank for vertices
   *
   * @param vertexAlias - Vertex alias
   * @param resultAlias - Result alias
   * @param dampingFactor - Damping factor (default: 0.85)
   * @param iterations - Number of iterations (default: 20)
   * @returns This algorithm query builder
   */
  pageRank(
    vertexAlias: string,
    resultAlias: string = 'pagerank',
    dampingFactor: number = 0.85,
    iterations: number = 20
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.pageRank(vertexAlias, resultAlias, dampingFactor, iterations);
    return queryBuilder;
  }

  /**
   * Detect communities using the Louvain method
   *
   * @param vertexAlias - Vertex alias
   * @param resultAlias - Result alias
   * @param options - Community detection options
   * @returns This algorithm query builder
   */
  louvain(
    vertexAlias: string,
    resultAlias: string = 'community',
    options: CommunityDetectionOptions = {}
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.louvain(vertexAlias, resultAlias, options);
    return queryBuilder;
  }

  /**
   * Extract nodes from a path
   *
   * @param pathAlias - Path alias
   * @param resultAlias - Result alias
   * @returns This algorithm query builder
   */
  extractNodes(
    pathAlias: string = 'path',
    resultAlias: string = 'nodes'
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.extractNodes(pathAlias, resultAlias);
    return queryBuilder;
  }

  /**
   * Extract relationships from a path
   *
   * @param pathAlias - Path alias
   * @param resultAlias - Result alias
   * @returns This algorithm query builder
   */
  extractRelationships(
    pathAlias: string = 'path',
    resultAlias: string = 'relationships'
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.extractRelationships(pathAlias, resultAlias);
    return queryBuilder;
  }

  /**
   * Calculate the length of a path
   *
   * @param pathAlias - Path alias
   * @param resultAlias - Result alias
   * @returns This algorithm query builder
   */
  pathLength(
    pathAlias: string = 'path',
    resultAlias: string = 'length'
  ): AlgorithmQueryBuilder<T> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    queryBuilder.pathLength(pathAlias, resultAlias);
    return queryBuilder;
  }

  /**
   * Add another match clause
   *
   * @param label - Vertex label
   * @param alias - Vertex alias
   * @returns A new algorithm match clause
   */
  match<K extends keyof T['vertices']>(label: K, alias: string): AlgorithmMatchClause<T, K> {
    const queryBuilder = this.done() as unknown as AlgorithmQueryBuilder<T>;
    return queryBuilder.match(label, alias);
  }
}

/**
 * Graph algorithm query builder
 *
 * Specialized query builder for graph algorithms
 */
export class AlgorithmQueryBuilder<T extends SchemaDefinition> extends AnalyticsQueryBuilder<T> {
  /**
   * Create a new algorithm query builder
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
   * Add MATCH clause for a vertex
   */
  match<L extends keyof T['vertices']>(label: L, alias: string): AlgorithmMatchClause<T, L>;

  /**
   * Add MATCH clause for an edge between two previously matched vertices
   */
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string
  ): IEdgeMatchClause<T>;

  /**
   * Add MATCH clause for an edge between two previously matched vertices with an edge alias
   */
  match<E extends keyof T['edges']>(
    sourceAlias: string,
    edgeLabel: E,
    targetAlias: string,
    edgeAlias: string
  ): IEdgeMatchClause<T>;

  /**
   * Implementation of the match method for algorithms
   */
  match(
    labelOrSourceAlias: any,
    aliasOrEdgeLabel: string,
    targetAlias?: string,
    edgeAlias?: string
  ): any {
    // If targetAlias is provided, this is an edge match
    if (targetAlias !== undefined) {
      return super.match(labelOrSourceAlias, aliasOrEdgeLabel, targetAlias, edgeAlias);
    }

    // This is a vertex match - create algorithm match clause
    const label = labelOrSourceAlias;
    const alias = aliasOrEdgeLabel;

    // Create a vertex pattern
    const vertexPattern: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: label as string,
      alias,
      properties: {},
      toCypher: () => `(${alias}:${String(label)})`
    };

    // Create a match part
    const matchPart = new MatchPart([vertexPattern]);

    // Add the match part to query parts
    (this as any).queryParts.push(matchPart);

    // Return algorithm match clause
    return new AlgorithmMatchClause<T, any>(this, matchPart, vertexPattern);
  }

  /**
   * Find the shortest path between two vertices
   *
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param resultAlias - Result path alias
   * @param options - Path finding options
   * @returns This algorithm query builder
   */
  shortestPath(
    startAlias: string,
    endAlias: string,
    resultAlias: string = 'path',
    options: PathFindingOptions = {}
  ): this {
    const relTypes = options.relationshipTypes
      ? `:${options.relationshipTypes.join('|')}`
      : '';

    const depthConstraint = options.maxDepth !== undefined
      ? `*1..${options.maxDepth}`
      : '*';

    const pathPattern = `shortestPath((${startAlias})-[${relTypes}]${depthConstraint}->(${endAlias}))`;

    this.return(`${pathPattern} AS ${resultAlias}`);

    return this;
  }

  /**
   * Find all shortest paths between two vertices
   *
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param resultAlias - Result paths alias
   * @param options - Path finding options
   * @returns This algorithm query builder
   */
  allShortestPaths(
    startAlias: string,
    endAlias: string,
    resultAlias: string = 'paths',
    options: PathFindingOptions = {}
  ): this {
    const relTypes = options.relationshipTypes
      ? `:${options.relationshipTypes.join('|')}`
      : '';

    const depthConstraint = options.maxDepth !== undefined
      ? `*1..${options.maxDepth}`
      : '*';

    const pathPattern = `allShortestPaths((${startAlias})-[${relTypes}]${depthConstraint}->(${endAlias}))`;

    this.return(`${pathPattern} AS ${resultAlias}`);

    return this;
  }

  /**
   * Find the shortest weighted path between two vertices using Dijkstra's algorithm
   *
   * @param startAlias - Start vertex alias
   * @param endAlias - End vertex alias
   * @param costProperty - Relationship property to use as cost
   * @param resultAlias - Result path alias
   * @param options - Path finding options
   * @returns This algorithm query builder
   */
  dijkstra(
    startAlias: string,
    endAlias: string,
    costProperty: string,
    resultAlias: string = 'path',
    options: PathFindingOptions = {}
  ): this {
    const relTypes = options.relationshipTypes
      ? `:${options.relationshipTypes.join('|')}`
      : '';

    // Using APOC procedure for Dijkstra (this is a placeholder, actual implementation depends on available procedures)
    this.return(`apoc.algo.dijkstra(${startAlias}, ${endAlias}, '${relTypes}', '${costProperty}') AS ${resultAlias}`);

    return this;
  }

  /**
   * Calculate betweenness centrality for vertices
   *
   * @param vertexAlias - Vertex alias
   * @param resultAlias - Result alias
   * @param options - Centrality options
   * @returns This algorithm query builder
   */
  betweennessCentrality(
    vertexAlias: string,
    resultAlias: string = 'centrality',
    options: CentralityOptions = {}
  ): this {
    // Using APOC procedure for betweenness centrality (this is a placeholder)
    this.return(`apoc.algo.betweenness(${vertexAlias}, ${options.maxDepth || 'null'}) AS ${resultAlias}`);

    return this;
  }

  /**
   * Calculate PageRank for vertices
   *
   * @param vertexAlias - Vertex alias
   * @param resultAlias - Result alias
   * @param dampingFactor - Damping factor (default: 0.85)
   * @param iterations - Number of iterations (default: 20)
   * @returns This algorithm query builder
   */
  pageRank(
    vertexAlias: string,
    resultAlias: string = 'pagerank',
    dampingFactor: number = 0.85,
    iterations: number = 20
  ): this {
    // Using APOC procedure for PageRank (this is a placeholder)
    this.return(`apoc.algo.pageRank(${vertexAlias}, ${dampingFactor}, ${iterations}) AS ${resultAlias}`);

    return this;
  }

  /**
   * Detect communities using the Louvain method
   *
   * @param vertexAlias - Vertex alias
   * @param resultAlias - Result alias
   * @param options - Community detection options
   * @returns This algorithm query builder
   */
  louvain(
    vertexAlias: string,
    resultAlias: string = 'community',
    options: CommunityDetectionOptions = {}
  ): this {
    // Using APOC procedure for Louvain community detection (this is a placeholder)
    this.return(`apoc.algo.louvain(${vertexAlias}, ${options.maxIterations || 10}) AS ${resultAlias}`);

    return this;
  }

  /**
   * Extract nodes from a path
   *
   * @param pathAlias - Path alias
   * @param resultAlias - Result alias
   * @returns This algorithm query builder
   */
  extractNodes(
    pathAlias: string = 'path',
    resultAlias: string = 'nodes'
  ): this {
    this.return(`nodes(${pathAlias}) AS ${resultAlias}`);
    return this;
  }

  /**
   * Extract relationships from a path
   *
   * @param pathAlias - Path alias
   * @param resultAlias - Result alias
   * @returns This algorithm query builder
   */
  extractRelationships(
    pathAlias: string = 'path',
    resultAlias: string = 'relationships'
  ): this {
    this.return(`relationships(${pathAlias}) AS ${resultAlias}`);
    return this;
  }

  /**
   * Calculate the length of a path
   *
   * @param pathAlias - Path alias
   * @param resultAlias - Result alias
   * @returns This algorithm query builder
   */
  pathLength(
    pathAlias: string = 'path',
    resultAlias: string = 'length'
  ): this {
    this.return(`length(${pathAlias}) AS ${resultAlias}`);
    return this;
  }
}
