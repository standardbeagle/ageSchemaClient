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
import { MatchClause, EdgeMatchClause } from './clauses';

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
   * Add MATCH clause for a vertex or an edge
   *
   * @param labelOrSourceAlias - Vertex label or source vertex alias
   * @param aliasOrEdgeLabel - Vertex alias or edge label
   * @param targetAlias - Target vertex alias (optional)
   * @param edgeAlias - Edge alias (optional)
   * @returns Match clause or edge match clause
   */
  match<L extends keyof T['vertices'] | keyof T['edges']>(
    labelOrSourceAlias: L | string,
    aliasOrEdgeLabel: string,
    targetAlias?: string,
    edgeAlias?: string
  ): IMatchClause<T, any> | IEdgeMatchClause<T> {
    // Case 1: match('Person', 'p') - Match a vertex
    if (targetAlias === undefined) {
      // This is a vertex match
      const label = labelOrSourceAlias as keyof T['vertices'];
      const alias = aliasOrEdgeLabel;

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

      return new MatchClause<T, any>(this, matchPart, vertexPattern);
    }

    // Case 2: match('p', 'WORKS_AT', 'c') or match('p', 'WORKS_AT', 'c', 'e')
    // This is an edge match between two previously matched vertices
    const sourceAlias = labelOrSourceAlias as string;
    const edgeLabel = aliasOrEdgeLabel as keyof T['edges'];
    const edgeAliasToUse = edgeAlias || 'e'; // Default edge alias if not provided

    // Create source vertex pattern (without label, as it's already matched)
    const sourceVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: '',
      alias: sourceAlias,
      properties: {},
      toCypher: () => `(${sourceAlias})`
    };

    // Create target vertex pattern (without label, as it's already matched)
    const targetVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: '',
      alias: targetAlias,
      properties: {},
      toCypher: () => `(${targetAlias})`
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: edgeLabel as string,
      alias: edgeAliasToUse,
      fromVertex: sourceVertex,
      toVertex: targetVertex,
      direction: 'OUTGOING',
      properties: {},
      toCypher: () => {
        const sourceStr = sourceVertex.toCypher();
        const targetStr = targetVertex.toCypher();
        const labelStr = edgeLabel ? `:${String(edgeLabel)}` : '';
        return `${sourceStr}-[${edgeAliasToUse}${labelStr}]->${targetStr}`;
      }
    };

    // Create and add match part
    const matchPart = new MatchPart([edgePattern]);
    this.queryParts.push(matchPart);

    // Return an EdgeMatchClause instance
    return new EdgeMatchClause<T>(this, matchPart, edgePattern);
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
   * Set a parameter in the age_params temporary table
   *
   * This method inserts a parameter into the age_params temporary table
   * using an INSERT ON CONFLICT UPDATE statement. The parameter can then
   * be referenced in a Cypher query using the get_age_param() function.
   *
   * @param key - Parameter key
   * @param value - Parameter value (will be converted to JSON)
   * @returns This query builder
   */
  async setParam(key: string, value: any): Promise<this> {
    // Convert the value to a JSON string
    const jsonValue = JSON.stringify(value);

    // Insert the parameter into the age_params table
    // Use ON CONFLICT DO UPDATE to handle existing keys
    await this.queryExecutor.executeSQL(`
      INSERT INTO age_params (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `, [key, jsonValue]);

    return this;
  }

  /**
   * Add a WITH clause that calls a function to get parameters
   *
   * This is specifically for Apache AGE compatibility, as it requires
   * parameters to be passed via a function call in a WITH clause.
   *
   * @param functionName - Fully qualified function name (e.g., 'schema.get_params')
   * @param alias - Alias for the function result (e.g., 'params')
   * @returns This query builder
   */
  withParamFunction(functionName: string, alias: string): this {
    this.queryParts.push(new WithPart([`${functionName}() AS ${alias}`]));
    return this;
  }

  /**
   * Add a WITH clause that calls the get_age_param function
   *
   * This method adds a WITH clause that calls the get_age_param function
   * to retrieve a parameter from the age_params temporary table.
   *
   * @param key - Parameter key to retrieve
   * @param alias - Alias for the parameter in the query
   * @returns This query builder
   */
  withAgeParam(key: string, alias: string): this {
    // Add a WITH clause that calls the get_age_param function
    this.queryParts.push(new WithPart([`age_schema_client.get_age_param('${key}') AS ${alias}`]));
    return this;
  }

  /**
   * Add a WITH clause that calls the get_all_age_params function
   *
   * This method adds a WITH clause that calls the get_all_age_params function
   * to retrieve all parameters from the age_params temporary table.
   *
   * @param alias - Alias for the parameters object in the query
   * @returns This query builder
   */
  withAllAgeParams(alias: string = 'params'): this {
    // Add a WITH clause that calls the get_all_age_params function
    this.queryParts.push(new WithPart([`age_schema_client.get_all_age_params() AS ${alias}`]));
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
    try {
      const params = this.getParameters();
      const graphName = options.graphName || this.graphName;

      if (!graphName) {
        throw new Error('Graph name is required for executing Cypher queries');
      }

      // If there are no parameters, use the standard Cypher query
      if (Object.keys(params).length === 0) {
        const cypher = this.toCypher();
        console.log('Executing Cypher query without parameters:', cypher);

        try {
          // Try to execute the Cypher query
          const result = await this.queryExecutor.executeCypher<R>(
            cypher,
            {},
            graphName,
            {
              timeout: options.timeout,
              maxRetries: options.maxRetries,
            }
          );

          // Check if the result is null or undefined
          if (!result) {
            console.error('Cypher query returned null or undefined result');
            throw new Error('Cypher query returned null or undefined result');
          }

          return result;
        } catch (error) {
          console.error('Error executing Cypher query:', error);

          // Add more context to the error
          const contextError = new Error(
            `Error executing Cypher query: ${error?.message || 'Unknown error'}\n` +
            `Cypher: ${cypher}\n` +
            `Graph: ${graphName}`
          );

          // Preserve the original error's stack if possible
          if (error && error.stack) {
            contextError.stack = error.stack;
          }

          throw contextError;
        }
      }

      // For queries with parameters, use the WITH clause approach
      // This is more compatible with Apache AGE
      console.log('Executing Cypher query with parameters using WITH clause');

      // Add a WITH clause at the beginning of the query with all parameters
      const withClauseParams = Object.entries(params)
        .map(([key, value]) => {
          // Convert the value to a string representation for the WITH clause
          let valueStr: string;
          if (typeof value === 'string') {
            valueStr = `'${value.replace(/'/g, "''")}'`;
          } else if (value === null) {
            valueStr = 'null';
          } else if (typeof value === 'number') {
            valueStr = value.toString();
          } else if (typeof value === 'boolean') {
            valueStr = value ? 'true' : 'false';
          } else if (Array.isArray(value) || typeof value === 'object') {
            valueStr = `'${JSON.stringify(value)}'`;
          } else {
            valueStr = `'${value}'`;
          }

          return `${valueStr} AS ${key}`;
        })
        .join(', ');

      // Prepend the WITH clause to the Cypher query
      const cypher = `WITH ${withClauseParams}\n${this.toCypher()}`;
      console.log('Modified Cypher query:', cypher);

      try {
        // Try to execute the Cypher query with parameters
        const result = await this.queryExecutor.executeCypher<R>(
          cypher,
          {},
          graphName,
          {
            timeout: options.timeout,
            maxRetries: options.maxRetries,
          }
        );

        // Check if the result is null or undefined
        if (!result) {
          console.error('Cypher query returned null or undefined result');
          throw new Error('Cypher query returned null or undefined result');
        }

        return result;
      } catch (error) {
        console.error('Error executing Cypher query with parameters:', error);

        // Add more context to the error
        const contextError = new Error(
          `Error executing Cypher query with parameters: ${error?.message || 'Unknown error'}\n` +
          `Cypher: ${cypher}\n` +
          `Parameters: ${JSON.stringify(params)}\n` +
          `Graph: ${graphName}`
        );

        // Preserve the original error's stack if possible
        if (error && error.stack) {
          contextError.stack = error.stack;
        }

        throw contextError;
      }
    } catch (error) {
      // Catch any other errors that might occur
      console.error('Unhandled error in QueryBuilder.execute:', error);
      throw error;
    } finally {
      // Reset query parts and parameters after execution
      this.reset();
    }
  }

  /**
   * Reset the query builder state
   *
   * @returns This query builder
   */
  reset(): this {
    this.queryParts = [];
    this.parameters = {};
    return this;
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
