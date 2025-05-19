/**
 * Core type definitions for the ageSchemaClient library
 *
 * @packageDocumentation
 */

/**
 * Configuration options for the ageSchemaClient
 */
export interface ClientConfig {
  /**
   * Database connection configuration
   */
  connection: ConnectionConfig;

  /**
   * Schema configuration
   */
  schema?: SchemaConfig;

  /**
   * Query configuration
   */
  query?: QueryConfig;
}

/**
 * Database connection configuration
 */
export interface ConnectionConfig {
  /**
   * Database host
   */
  host: string;

  /**
   * Database port
   */
  port: number;

  /**
   * Database name
   */
  database: string;

  /**
   * Database user
   */
  user: string;

  /**
   * Database password
   */
  password: string;

  /**
   * SSL configuration
   */
  ssl?: boolean | SSLConfig;

  /**
   * PostgreSQL-specific connection options
   */
  pgOptions?: {
    /**
     * Search path for PostgreSQL schemas
     * @default "ag_catalog, public"
     */
    searchPath?: string;

    /**
     * Application name
     */
    applicationName?: string;

    /**
     * Statement timeout in milliseconds
     */
    statementTimeout?: number;

    /**
     * Query timeout in milliseconds
     */
    queryTimeout?: number;

    /**
     * Idle in transaction session timeout in milliseconds
     */
    idleInTransactionSessionTimeout?: number;
  };
}

/**
 * SSL configuration
 */
export interface SSLConfig {
  /**
   * Require SSL
   */
  rejectUnauthorized?: boolean;

  /**
   * CA certificate
   */
  ca?: string;

  /**
   * Client certificate
   */
  cert?: string;

  /**
   * Client key
   */
  key?: string;
}

/**
 * Schema configuration
 */
export interface SchemaConfig {
  /**
   * Path to schema file
   */
  path?: string;

  /**
   * Schema object
   */
  schema?: unknown;

  /**
   * Validation options
   */
  validation?: ValidationOptions;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Strict mode
   */
  strict?: boolean;

  /**
   * Ignore unknown properties
   */
  ignoreUnknown?: boolean;
}

/**
 * Query configuration
 */
export interface QueryConfig {
  /**
   * Query timeout in milliseconds
   */
  timeout?: number;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;

  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;
}

/**
 * Error codes
 */
export enum ErrorCode {
  SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  BATCH_LOADER_ERROR = 'BATCH_LOADER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
