/**
 * Query builder implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import { QueryExecutor } from '../db/query';
import {
  IQueryBuilder,
  IMatchClause,
  QueryPart,
  QueryPartType,
  OrderDirection,
  QueryExecutionOptions,
  QueryBuilderResult,
  MatchPatternType,
  VertexPattern,
  EdgePattern,
} from './types';
import {
  MatchPart,
  WherePart,
  ReturnPart,
  OrderByPart,
  LimitPart,
  SkipPart,
  WithPart,
  UnwindPart,
} from './parts';
import { MatchClause } from './clauses';

/**
 * Query builder class
 */
export class QueryBuilder<T extends SchemaDefinition> implements IQueryBuilder<T> {
  /**
   * Query parts
   */
  private queryParts: QueryPart[] = [];

  /**
   * Query parameters
   */
  private parameters: Record<string, any> = {};

  /**
   * Graph name
   */
  private graphName: string;

  /**
   * Create a new query builder
   *
   * @param schema - Schema definition
   * @param queryExecutor - Query executor
   * @param graphName - Graph name
   */
  constructor(
    private schema: T,
    private queryExecutor: QueryExecutor,
    graphName: string = 'default'
  ) {
    this.graphName = graphName;
  }

  /**
   * Add MATCH clause
   *
   * @param label - Vertex label
   * @param alias - Vertex alias
   * @returns Match clause
   */
  match<L extends keyof T['vertices']>(label: L, alias: string): IMatchClause<T, L> {
    const vertexPattern: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: label as string,
      alias,
      properties: {},
      toCypher: () => {
        const labelStr = label ? `:${String(label)}` : '';
        return `(${alias}${labelStr})`;
      }
    };

    const matchPart = new MatchPart([vertexPattern]);
    this.queryParts.push(matchPart);

    return new MatchClause<T, L>(this, matchPart, vertexPattern);
  }

  /**
   * Add WHERE clause
   *
   * @param condition - Condition expression
   * @param params - Parameters
   * @returns This query builder
   */
  where(condition: string, params: Record<string, any> = {}): this {
    this.queryParts.push(new WherePart(condition));

    if (params) {
      this.parameters = { ...this.parameters, ...params };
    }

    return this;
  }

  /**
   * Add RETURN clause
   *
   * @param expressions - Return expressions
   * @returns This query builder
   */
  return(...expressions: string[]): this {
    this.queryParts.push(new ReturnPart(expressions));
    return this;
  }

  /**
   * Add ORDER BY clause
   *
   * @param expression - Expression to order by
   * @param direction - Order direction
   * @returns This query builder
   */
  orderBy(expression: string, direction: OrderDirection = OrderDirection.ASC): this {
    // Look for existing ORDER BY part
    const existingPart = this.queryParts.find(part => part.type === QueryPartType.ORDER_BY) as OrderByPart | undefined;

    if (existingPart) {
      existingPart.addItem(expression, direction);
    } else {
      const orderByPart = new OrderByPart();
      orderByPart.addItem(expression, direction);
      this.queryParts.push(orderByPart);
    }

    return this;
  }

  /**
   * Add LIMIT clause
   *
   * @param count - Limit count
   * @returns This query builder
   */
  limit(count: number): this {
    this.queryParts.push(new LimitPart(count));
    return this;
  }

  /**
   * Add SKIP clause
   *
   * @param count - Skip count
   * @returns This query builder
   */
  skip(count: number): this {
    this.queryParts.push(new SkipPart(count));
    return this;
  }

  /**
   * Add WITH clause
   *
   * @param expressions - With expressions
   * @returns This query builder
   */
  with(...expressions: string[]): this {
    this.queryParts.push(new WithPart(expressions));
    return this;
  }

  /**
   * Add UNWIND clause
   *
   * @param expression - Expression to unwind
   * @param alias - Alias for unwound items
   * @returns This query builder
   */
  unwind(expression: string, alias: string): this {
    this.queryParts.push(new UnwindPart(expression, alias));
    return this;
  }

  /**
   * Add a parameter to the query
   *
   * @param name - Parameter name
   * @param value - Parameter value
   * @returns This query builder
   */
  withParam(name: string, value: any): this {
    this.parameters[name] = value;
    return this;
  }

  /**
   * Execute the query
   *
   * @param options - Query execution options
   * @returns Query result
   * @throws Error if query validation fails
   */
  async execute<R = any>(options: QueryExecutionOptions = {}): QueryBuilderResult<R> {
    // Validate query against schema
    if (options.validate !== false) {
      const errors = this.validateQuery();

      if (errors.length > 0) {
        throw new Error(`Query validation failed: ${errors.join(', ')}`);
      }
    }

    const cypher = this.toCypher();
    const params = this.getParameters();
    const graphName = options.graphName || this.graphName;

    return this.queryExecutor.executeCypher<R>(
      cypher,
      params,
      graphName,
      {
        timeout: options.timeout,
        maxRetries: options.maxRetries,
      }
    );
  }

  /**
   * Get the Cypher query string
   *
   * @returns Cypher query string
   */
  toCypher(): string {
    return this.queryParts
      .map(part => part.toCypher())
      .filter(cypher => cypher.length > 0)
      .join('\n');
  }

  /**
   * Get the query parameters
   *
   * @returns Query parameters
   */
  getParameters(): Record<string, any> {
    // Merge parameters from all query parts
    const params = { ...this.parameters };

    for (const part of this.queryParts) {
      const partParams = part.getParameters();
      Object.assign(params, partParams);
    }

    return params;
  }

  /**
   * Validate the query against the schema
   *
   * @returns Validation errors, if any
   */
  validateQuery(): string[] {
    const errors: string[] = [];

    // Validate vertex labels
    for (const part of this.queryParts) {
      if (part instanceof MatchPart) {
        for (const pattern of part.getPatterns()) {
          if (pattern.type === MatchPatternType.VERTEX) {
            const vertexPattern = pattern as VertexPattern;

            // Skip validation for patterns without labels
            if (!vertexPattern.label) {
              continue;
            }

            // Validate vertex label
            if (!this.schema.vertices[vertexPattern.label]) {
              errors.push(`Invalid vertex label: ${vertexPattern.label}`);
            } else {
              // Validate vertex properties
              const vertexDef = this.schema.vertices[vertexPattern.label];

              if (vertexPattern.properties) {
                for (const propName of Object.keys(vertexPattern.properties)) {
                  if (!vertexDef.properties[propName]) {
                    errors.push(`Invalid property '${propName}' for vertex label '${vertexPattern.label}'`);
                  }
                }
              }
            }
          } else if (pattern.type === MatchPatternType.EDGE) {
            const edgePattern = pattern as EdgePattern;

            // Skip validation for patterns without labels
            if (!edgePattern.label) {
              continue;
            }

            // Validate edge label
            if (!this.schema.edges[edgePattern.label]) {
              errors.push(`Invalid edge label: ${edgePattern.label}`);
            } else {
              // Validate edge properties
              const edgeDef = this.schema.edges[edgePattern.label];

              if (edgePattern.properties) {
                for (const propName of Object.keys(edgePattern.properties)) {
                  if (!edgeDef.properties[propName]) {
                    errors.push(`Invalid property '${propName}' for edge label '${edgePattern.label}'`);
                  }
                }
              }

              // Validate edge relationship constraints
              if (edgeDef.fromVertex && edgePattern.fromVertex.label) {
                if (typeof edgeDef.fromVertex === 'string') {
                  if (edgePattern.fromVertex.label !== edgeDef.fromVertex) {
                    errors.push(`Invalid source vertex label for edge '${edgePattern.label}': expected '${edgeDef.fromVertex}', got '${edgePattern.fromVertex.label}'`);
                  }
                }
              }

              if (edgeDef.toVertex && edgePattern.toVertex.label) {
                if (typeof edgeDef.toVertex === 'string') {
                  if (edgePattern.toVertex.label !== edgeDef.toVertex) {
                    errors.push(`Invalid target vertex label for edge '${edgePattern.label}': expected '${edgeDef.toVertex}', got '${edgePattern.toVertex.label}'`);
                  }
                }
              }
            }
          }
        }
      }
    }

    return errors;
  }
}
