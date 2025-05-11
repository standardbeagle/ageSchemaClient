/**
 * Database connectivity types for the ageSchemaClient library
 *
 * @packageDocumentation
 */

import { ConnectionConfig as PgConnectionConfig } from 'pg';

/**
 * Connection state
 */
export enum ConnectionState {
  /**
   * Connection is idle
   */
  IDLE = 'idle',
  
  /**
   * Connection is active
   */
  ACTIVE = 'active',
  
  /**
   * Connection is closed
   */
  CLOSED = 'closed',
  
  /**
   * Connection is in error state
   */
  ERROR = 'error',
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  /**
   * Maximum number of connections in the pool
   * @default 10
   */
  max?: number;
  
  /**
   * Idle timeout in milliseconds
   * @default 30000
   */
  idleTimeoutMillis?: number;
  
  /**
   * Connection timeout in milliseconds
   * @default 0 (no timeout)
   */
  connectionTimeoutMillis?: number;
  
  /**
   * Allow exit on idle
   * @default false
   */
  allowExitOnIdle?: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;
  
  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  delay?: number;
  
  /**
   * Maximum delay between retries in milliseconds
   * @default 5000
   */
  maxDelay?: number;
  
  /**
   * Factor to increase delay between retries
   * @default 2
   */
  factor?: number;
  
  /**
   * Jitter to add to delay between retries
   * @default 0.1
   */
  jitter?: number;
}

/**
 * Driver type
 */
export enum DriverType {
  /**
   * Node-postgres driver
   */
  PG = 'pg',
  
  /**
   * Other drivers can be added in the future
   */
}

/**
 * Driver-specific options
 */
export interface DriverOptions {
  /**
   * Driver type
   * @default DriverType.PG
   */
  type?: DriverType;
  
  /**
   * Driver-specific options
   */
  [key: string]: any;
}

/**
 * Extended connection configuration
 */
export interface ConnectionConfig extends PgConnectionConfig {
  /**
   * Connection pool configuration
   */
  pool?: PoolConfig;
  
  /**
   * Retry configuration
   */
  retry?: RetryConfig;
  
  /**
   * Driver-specific options
   */
  driver?: DriverOptions;
}

/**
 * Connection interface
 */
export interface Connection {
  /**
   * Execute a query
   * 
   * @param text - Query text
   * @param params - Query parameters
   * @returns Query result
   */
  query(text: string, params?: any[]): Promise<any>;
  
  /**
   * Release the connection back to the pool
   */
  release(): void;
}

/**
 * Connection event
 */
export interface ConnectionEvent {
  /**
   * Event type
   */
  type: 'connect' | 'disconnect' | 'error' | 'status';
  
  /**
   * Connection state
   */
  state: ConnectionState;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Error (if any)
   */
  error?: Error;
  
  /**
   * Additional data
   */
  data?: any;
}

/**
 * Connection lifecycle hook
 */
export type ConnectionHook = (connection: Connection, event: ConnectionEvent) => Promise<void> | void;

/**
 * Connection lifecycle hooks
 */
export interface ConnectionHooks {
  /**
   * Before connect hook
   */
  beforeConnect?: ConnectionHook;
  
  /**
   * After connect hook
   */
  afterConnect?: ConnectionHook;
  
  /**
   * Before disconnect hook
   */
  beforeDisconnect?: ConnectionHook;
  
  /**
   * After disconnect hook
   */
  afterDisconnect?: ConnectionHook;
  
  /**
   * On error hook
   */
  onError?: ConnectionHook;
}

/**
 * Connection manager interface
 */
export interface ConnectionManager {
  /**
   * Get a connection from the pool
   * 
   * @returns A connection
   */
  getConnection(): Promise<Connection>;
  
  /**
   * Release a connection back to the pool
   * 
   * @param connection - Connection to release
   */
  releaseConnection(connection: Connection): Promise<void>;
  
  /**
   * Close all connections
   */
  closeAll(): Promise<void>;
  
  /**
   * Get connection pool statistics
   * 
   * @returns Pool statistics
   */
  getPoolStats(): PoolStats;
  
  /**
   * Register connection lifecycle hooks
   * 
   * @param hooks - Connection lifecycle hooks
   */
  registerHooks(hooks: ConnectionHooks): void;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  /**
   * Total number of connections
   */
  total: number;
  
  /**
   * Number of idle connections
   */
  idle: number;
  
  /**
   * Number of active connections
   */
  active: number;
  
  /**
   * Number of waiting clients
   */
  waiting: number;
  
  /**
   * Maximum number of connections
   */
  max: number;
}

/**
 * Database error types
 */
export enum DatabaseErrorType {
  /**
   * Connection error
   */
  CONNECTION = 'connection',
  
  /**
   * Query error
   */
  QUERY = 'query',
  
  /**
   * Transaction error
   */
  TRANSACTION = 'transaction',
  
  /**
   * Pool error
   */
  POOL = 'pool',
  
  /**
   * Timeout error
   */
  TIMEOUT = 'timeout',
  
  /**
   * Unknown error
   */
  UNKNOWN = 'unknown',
}

/**
 * Database error
 */
export class DatabaseError extends Error {
  /**
   * Error type
   */
  public readonly type: DatabaseErrorType;
  
  /**
   * Original error
   */
  public readonly originalError?: Error;
  
  /**
   * Additional data
   */
  public readonly data?: any;
  
  /**
   * Create a new database error
   * 
   * @param message - Error message
   * @param type - Error type
   * @param originalError - Original error
   * @param data - Additional data
   */
  constructor(
    message: string,
    type: DatabaseErrorType = DatabaseErrorType.UNKNOWN,
    originalError?: Error,
    data?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.originalError = originalError;
    this.data = data;
  }
}

/**
 * Connection error
 */
export class ConnectionError extends DatabaseError {
  /**
   * Create a new connection error
   * 
   * @param message - Error message
   * @param originalError - Original error
   * @param data - Additional data
   */
  constructor(message: string, originalError?: Error, data?: any) {
    super(message, DatabaseErrorType.CONNECTION, originalError, data);
    this.name = 'ConnectionError';
  }
}

/**
 * Query error
 */
export class QueryError extends DatabaseError {
  /**
   * Create a new query error
   * 
   * @param message - Error message
   * @param originalError - Original error
   * @param data - Additional data
   */
  constructor(message: string, originalError?: Error, data?: any) {
    super(message, DatabaseErrorType.QUERY, originalError, data);
    this.name = 'QueryError';
  }
}

/**
 * Transaction error
 */
export class TransactionError extends DatabaseError {
  /**
   * Create a new transaction error
   * 
   * @param message - Error message
   * @param originalError - Original error
   * @param data - Additional data
   */
  constructor(message: string, originalError?: Error, data?: any) {
    super(message, DatabaseErrorType.TRANSACTION, originalError, data);
    this.name = 'TransactionError';
  }
}

/**
 * Pool error
 */
export class PoolError extends DatabaseError {
  /**
   * Create a new pool error
   * 
   * @param message - Error message
   * @param originalError - Original error
   * @param data - Additional data
   */
  constructor(message: string, originalError?: Error, data?: any) {
    super(message, DatabaseErrorType.POOL, originalError, data);
    this.name = 'PoolError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends DatabaseError {
  /**
   * Create a new timeout error
   * 
   * @param message - Error message
   * @param originalError - Original error
   * @param data - Additional data
   */
  constructor(message: string, originalError?: Error, data?: any) {
    super(message, DatabaseErrorType.TIMEOUT, originalError, data);
    this.name = 'TimeoutError';
  }
}
