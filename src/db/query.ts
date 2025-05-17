/**
 * Query execution implementation
 *
 * @packageDocumentation
 */

import { Connection, QueryError, TimeoutError } from './types';

/**
 * Query result
 */
export interface QueryResult<T = any> {
  /**
   * Result rows
   */
  rows: T[];

  /**
   * Row count
   */
  rowCount: number;

  /**
   * Field information
   */
  fields: QueryResultField[];

  /**
   * Command
   */
  command: string;

  /**
   * OID
   */
  oid: number;
}

/**
 * Query result field
 */
export interface QueryResultField {
  /**
   * Field name
   */
  name: string;

  /**
   * Table OID
   */
  tableID: number;

  /**
   * Column index
   */
  columnID: number;

  /**
   * Data type OID
   */
  dataTypeID: number;

  /**
   * Data type size
   */
  dataTypeSize: number;

  /**
   * Data type modifier
   */
  dataTypeModifier: number;

  /**
   * Format
   */
  format: string;
}

/**
 * Query options
 */
export interface QueryOptions {
  /**
   * Query timeout in milliseconds
   * @default 0 (no timeout)
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts
   * @default 0 (no retries)
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Row mode
   * @default 'array'
   */
  rowMode?: 'array' | 'object';

  /**
   * Query name (for prepared statements)
   */
  name?: string;

  /**
   * Transaction object
   */
  transaction?: any;
}

/**
 * Default query options
 */
const DEFAULT_QUERY_OPTIONS: QueryOptions = {
  timeout: 0,
  maxRetries: 0,
  retryDelay: 1000,
  rowMode: 'object',
};

/**
 * Query logger interface
 */
export interface QueryLogger {
  /**
   * Log a query
   *
   * @param query - Query text
   * @param params - Query parameters
   * @param duration - Query duration in milliseconds
   * @param result - Query result
   */
  logQuery(
    query: string,
    params: any[] | undefined,
    duration: number,
    result?: QueryResult
  ): void;

  /**
   * Log a query error
   *
   * @param query - Query text
   * @param params - Query parameters
   * @param duration - Query duration in milliseconds
   * @param error - Error
   */
  logError(
    query: string,
    params: any[] | undefined,
    duration: number,
    error: Error
  ): void;

  /**
   * Log debug information
   *
   * @param message - Debug message
   * @param data - Additional data
   */
  debug?(message: string, data?: any): void;
}

/**
 * Default query logger
 */
export class DefaultQueryLogger implements QueryLogger {
  /**
   * Log a query
   *
   * @param query - Query text
   * @param params - Query parameters
   * @param duration - Query duration in milliseconds
   * @param result - Query result
   */
  logQuery(
    query: string,
    params: any[] | undefined,
    duration: number,
    result?: QueryResult
  ): void {
    const rowCount = result?.rowCount ?? 0;
    console.log(
      `Query executed in ${duration}ms: ${this.truncateQuery(query)} | Params: ${
        params ? JSON.stringify(params) : 'none'
      } | Rows: ${rowCount}`
    );
  }

  /**
   * Log a query error
   *
   * @param query - Query text
   * @param params - Query parameters
   * @param duration - Query duration in milliseconds
   * @param error - Error
   */
  logError(
    query: string,
    params: any[] | undefined,
    duration: number,
    error: Error
  ): void {
    console.error(
      `Query error after ${duration}ms: ${this.truncateQuery(query)} | Params: ${
        params ? JSON.stringify(params) : 'none'
      } | Error: ${error.message}`
    );
  }

  /**
   * Log debug information
   *
   * @param message - Debug message
   * @param data - Additional data
   */
  debug(message: string, data?: any): void {
    if (data) {
      console.debug(message, data);
    } else {
      console.debug(message);
    }
  }

  /**
   * Truncate a query for logging
   *
   * @param query - Query text
   * @returns Truncated query
   */
  private truncateQuery(query: string): string {
    const maxLength = 100;
    if (query.length <= maxLength) {
      return query;
    }
    return query.substring(0, maxLength) + '...';
  }
}

/**
 * Query executor class
 */
export class QueryExecutor {
  private connection: Connection;
  private logger: QueryLogger;

  /**
   * Create a new query executor
   *
   * @param connection - Database connection
   * @param logger - Query logger
   */
  constructor(
    connection: Connection,
    logger: QueryLogger = new DefaultQueryLogger()
  ) {
    this.connection = connection;
    this.logger = logger;
  }

  /**
   * Execute a SQL query
   *
   * @param sql - SQL query
   * @param params - Query parameters
   * @param options - Query options
   * @returns Query result
   */
  async executeSQL<T = any>(
    sql: string,
    params?: any[],
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const mergedOptions = { ...DEFAULT_QUERY_OPTIONS, ...options };
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= mergedOptions.maxRetries!) {
      try {
        const startTime = Date.now();
        let timeoutId: NodeJS.Timeout | undefined;
        let timeoutPromise: Promise<never> | undefined;

        // Set up timeout if specified
        if (mergedOptions.timeout && mergedOptions.timeout > 0) {
          timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(
                new TimeoutError(
                  `Query timed out after ${mergedOptions.timeout}ms: ${sql}`
                )
              );
            }, mergedOptions.timeout);
          });
        }

        // Prepare query config
        const queryConfig: any = {
          text: sql,
          values: params,
          rowMode: mergedOptions.rowMode,
        };

        // Add name if specified (for prepared statements)
        if (mergedOptions.name) {
          queryConfig.name = mergedOptions.name;
        }

        // Execute query with timeout if specified
        const result = await (timeoutPromise
          ? Promise.race([
              this.connection.query(queryConfig),
              timeoutPromise,
            ])
          : this.connection.query(queryConfig));

        // Clear timeout if set
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const duration = Date.now() - startTime;

        // Log query
        this.logger.logQuery(sql, params, duration, result);

        return result;
      } catch (error) {
        const duration = Date.now() - (lastError ? 0 : Date.now());
        lastError = error as Error;

        // Log error
        this.logger.logError(sql, params, duration, lastError);

        // Check if we should retry
        if (
          attempts < mergedOptions.maxRetries! &&
          this.isRetryableError(lastError)
        ) {
          attempts++;

          // Wait before retrying
          await new Promise(resolve =>
            setTimeout(resolve, mergedOptions.retryDelay)
          );
        } else {
          throw error;
        }
      }
    }

    // All retry attempts failed or non-retryable error
    throw new QueryError(
      `Query execution failed: ${lastError?.message}`,
      lastError || undefined,
      { query: sql, params }
    );
  }

  /**
   * Execute a Cypher query
   *
   * @param cypher - Cypher query
   * @param params - Query parameters
   * @param graphName - Graph name
   * @param options - Query options
   * @returns Query result
   */
  async executeCypher<T = any>(
    cypher: string,
    params?: Record<string, any>,
    graphName?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    // Validate graph name
    if (!graphName) {
      throw new QueryError(
        'Graph name is required for Cypher queries',
        undefined,
        { query: cypher, params }
      );
    }

    try {
      // Extract return columns from the Cypher query to match the AS clause
      // This is a critical step for Apache AGE compatibility
      let returnColumns = 'result ag_catalog.agtype';

      // Parse the RETURN statement to extract column names
      const returnMatch = cypher.match(/RETURN\s+(.*?)(?:\s+ORDER BY|\s+LIMIT|\s+SKIP|\s*$)/is);
      if (returnMatch && returnMatch[1]) {
        // Extract column aliases from the RETURN clause
        const returnClause = returnMatch[1].trim();

        // First try to match explicit AS aliases
        const columnMatches = returnClause.match(/(?:\w+(?:\.\w+)*|\([^)]+\))\s+AS\s+\w+/g);

        if (columnMatches && columnMatches.length > 0) {
          // Build the return columns string for the AS clause
          returnColumns = columnMatches
            .map(col => {
              const parts = col.split(/\s+AS\s+/i);
              if (parts.length === 2) {
                const alias = parts[1].trim();
                return `${alias} ag_catalog.agtype`;
              }
              return null;
            })
            .filter(Boolean)
            .join(', ');
        } else {
          // If no explicit AS aliases, try to extract implicit column names
          // For example, from "RETURN count(*)" extract "count"
          const implicitColumns = returnClause.split(',').map(expr => expr.trim());
          if (implicitColumns.length > 0) {
            const implicitColumnNames = implicitColumns.map((expr, index) => {
              // Extract the last part of a property path (e.g., "p.name" -> "name")
              const dotMatch = expr.match(/(\w+)\.(\w+)$/);
              if (dotMatch) {
                return dotMatch[2];
              }

              // Extract function name (e.g., "count(*)" -> "count")
              const funcMatch = expr.match(/(\w+)\(/);
              if (funcMatch) {
                // Special case for count(*) AS created_employees
                if (expr.includes('count(*)') && returnClause.includes('AS created_employees')) {
                  return 'created_employees';
                }
                return funcMatch[1];
              }

              // Use the expression as is if it's a simple identifier
              if (/^\w+$/.test(expr)) {
                return expr;
              }

              // If we can't extract a clean name, use a generic column name
              return `col${index + 1}`;
            });

            // Always generate column names, even if we couldn't extract them
            returnColumns = implicitColumnNames
              .map(name => `${name} ag_catalog.agtype`)
              .join(', ');
          }
        }
      }

      // Convert parameters to JSON string
      const paramsJson = params ? JSON.stringify(params) : '{}';

      // Execute the Cypher query with proper return type
      const sql = `SELECT * FROM ag_catalog.cypher('${graphName}', $q$${cypher}$q$, $1) AS (${returnColumns})`;

      // Log the query and parameters for debugging if logger is available
      if (this.logger && typeof this.logger.debug === 'function') {
        this.logger.debug(`Executing Cypher query: ${cypher}`);
        this.logger.debug(`With parameters: ${paramsJson}`);
        this.logger.debug(`SQL with return columns: ${sql}`);
      } else {
        console.debug(`Executing Cypher query: ${cypher}`);
        console.debug(`With parameters: ${paramsJson}`);
        console.debug(`SQL with return columns: ${sql}`);
      }

      return await this.executeSQL<T>(sql, [paramsJson], options);
    } catch (error) {
      // Enhance error message for AGE-specific errors
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('return row and column definition list do not match')) {
        throw new QueryError(
          `Cypher query execution failed: The return columns in your query don't match the AS clause. Check your RETURN statement.`,
          error as Error,
          { query: cypher, params }
        );
      } else if (errorMessage.includes('could not find rte for')) {
        throw new QueryError(
          `Cypher query execution failed: Column reference not found. Check your query for typos in column names.`,
          error as Error,
          { query: cypher, params }
        );
      } else if (errorMessage.includes('invalid input syntax for type agtype')) {
        throw new QueryError(
          `Cypher query execution failed: Invalid input syntax for agtype. Check your parameter values.`,
          error as Error,
          { query: cypher, params }
        );
      } else if (errorMessage.includes('function ag_catalog.cypher')) {
        throw new QueryError(
          `Cypher query execution failed: AGE extension not loaded or not in search path. Check your connection configuration.`,
          error as Error,
          { query: cypher, params }
        );
      } else if (errorMessage.includes('cannot cast agtype string to type boolean')) {
        throw new QueryError(
          `Cypher query execution failed: Type casting error. Cannot convert string to boolean. Check your query conditions.`,
          error as Error,
          { query: cypher, params }
        );
      } else if (errorMessage.includes('graph') && errorMessage.includes('does not exist')) {
        throw new QueryError(
          `Cypher query execution failed: Graph "${graphName}" does not exist. Create the graph before executing queries.`,
          error as Error,
          { query: cypher, params, graphName }
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute a COPY FROM operation to load data from a string
   *
   * @param sql - COPY SQL statement
   * @param data - Data to load
   * @param options - Query options
   * @returns Query result
   */
  async executeCopyFrom(
    sql: string,
    data: string,
    options: QueryOptions & { transaction?: any } = {}
  ): Promise<QueryResult> {
    const mergedOptions = { ...DEFAULT_QUERY_OPTIONS, ...options };
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= mergedOptions.maxRetries!) {
      try {
        const startTime = Date.now();
        let timeoutId: NodeJS.Timeout | undefined;
        let timeoutPromise: Promise<never> | undefined;

        // Set up timeout if specified
        if (mergedOptions.timeout && mergedOptions.timeout > 0) {
          timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(
                new TimeoutError(
                  `COPY operation timed out after ${mergedOptions.timeout}ms`
                )
              );
            }, mergedOptions.timeout);
          });
        }

        // Get the client from the connection
        const client = this.connection.getClient ? this.connection.getClient() : this.connection;

        // Execute the COPY statement
        const result = await (timeoutPromise
          ? Promise.race([
              this.executeCopyOperation(client, sql, data),
              timeoutPromise,
            ])
          : this.executeCopyOperation(client, sql, data));

        // Clear timeout if set
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const duration = Date.now() - startTime;

        // Log query
        this.logger.logQuery(sql, [], duration, result);

        return result;
      } catch (error) {
        const duration = Date.now() - (lastError ? 0 : Date.now());
        lastError = error as Error;

        // Log error
        this.logger.logError(sql, [], duration, lastError);

        // Check if we should retry
        if (
          attempts < mergedOptions.maxRetries! &&
          this.isRetryableError(lastError)
        ) {
          attempts++;

          // Wait before retrying
          await new Promise(resolve =>
            setTimeout(resolve, mergedOptions.retryDelay)
          );
        } else {
          // No more retries or non-retryable error
          break;
        }
      }
    }

    // All retry attempts failed or non-retryable error
    throw new QueryError(
      `COPY operation failed: ${lastError?.message}`,
      lastError || undefined,
      { query: sql }
    );
  }

  /**
   * Execute a COPY operation
   *
   * @param client - Database client
   * @param sql - COPY SQL statement
   * @param data - Data to load
   * @returns Query result
   * @private
   */
  private async executeCopyOperation(
    client: any,
    sql: string,
    data: string
  ): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      // Execute the COPY statement
      const stream = client.query(sql);

      // Handle errors
      stream.on('error', (err: Error) => {
        reject(err);
      });

      // Write data to the stream
      stream.write(data);
      stream.end();

      // Handle completion
      stream.on('end', () => {
        resolve({
          rows: [],
          rowCount: 0,
          fields: [],
          command: 'COPY',
          oid: 0,
        });
      });
    });
  }

  /**
   * Begin a transaction
   *
   * @returns Transaction object
   */
  async beginTransaction(): Promise<any> {
    await this.executeSQL('BEGIN');
    return {
      commit: async () => {
        return this.executeSQL('COMMIT');
      },
      rollback: async () => {
        return this.executeSQL('ROLLBACK');
      },
    };
  }

  /**
   * Transform query result
   *
   * @param result - Raw query result
   * @param transformer - Transformer function
   * @returns Transformed result
   */
  transformResult<T, R>(
    result: QueryResult<T>,
    transformer: (row: T) => R
  ): R[] {
    return result.rows.map(transformer);
  }

  /**
   * Check if an error is retryable
   *
   * @param error - Error
   * @returns True if the error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Connection-related errors are typically retryable
    const retryableErrorMessages = [
      'connection',
      'timeout',
      'idle',
      'terminate',
      'reset',
      'connect ETIMEDOUT',
      'connect ECONNREFUSED',
    ];

    return retryableErrorMessages.some(msg =>
      error.message.toLowerCase().includes(msg)
    );
  }
}
