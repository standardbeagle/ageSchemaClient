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
          // No more retries or non-retryable error
          break;
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
    graphName: string = 'default',
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    // Convert parameters to JSON string
    const paramsJson = params ? JSON.stringify(params) : '{}';

    // Use dollar-quoted strings to avoid escaping issues
    // Apache AGE requires dollar-quoted strings for Cypher queries
    // The third parameter must be a SQL parameter ($1) not a dollar-quoted string
    const sql = `SELECT * FROM ag_catalog.cypher('${graphName}', $q$${cypher}$q$, $1) AS (result agtype)`;

    return this.executeSQL<T>(sql, [paramsJson], options);
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
              this.executeCopyOperation(client, sql, data, options.transaction),
              timeoutPromise,
            ])
          : this.executeCopyOperation(client, sql, data, options.transaction));

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
   * @param transaction - Transaction object
   * @returns Query result
   * @private
   */
  private async executeCopyOperation(
    client: any,
    sql: string,
    data: string,
    transaction?: any
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
    const result = await this.executeSQL('BEGIN');
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
