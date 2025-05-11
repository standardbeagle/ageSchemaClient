/**
 * Database connector implementation
 *
 * @packageDocumentation
 */

import { Pool, PoolClient } from 'pg';
import {
  Connection,
  ConnectionConfig,
  ConnectionError,
  ConnectionEvent,
  ConnectionHooks,
  ConnectionManager,
  ConnectionState,
  DatabaseErrorType,
  DriverType,
  PoolError,
  PoolStats,
  RetryConfig,
  TimeoutError,
} from './types';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delay: 1000,
  maxDelay: 5000,
  factor: 2,
  jitter: 0.1,
};

/**
 * PgConnection class that implements the Connection interface
 */
class PgConnection implements Connection {
  private client: PoolClient;
  private state: ConnectionState;
  private lastQuery: string | null = null;
  private lastQueryTime: number | null = null;
  private manager: PgConnectionManager;

  /**
   * Create a new PgConnection
   * 
   * @param client - Pool client
   * @param manager - Connection manager
   */
  constructor(client: PoolClient, manager: PgConnectionManager) {
    this.client = client;
    this.state = ConnectionState.IDLE;
    this.manager = manager;
  }

  /**
   * Execute a query
   * 
   * @param text - Query text
   * @param params - Query parameters
   * @returns Query result
   */
  async query(text: string, params?: any[]): Promise<any> {
    try {
      this.state = ConnectionState.ACTIVE;
      this.lastQuery = text;
      this.lastQueryTime = Date.now();
      
      const result = await this.client.query(text, params);
      
      this.state = ConnectionState.IDLE;
      return result;
    } catch (error) {
      this.state = ConnectionState.ERROR;
      
      // Trigger error hook if registered
      const event: ConnectionEvent = {
        type: 'error',
        state: this.state,
        timestamp: Date.now(),
        error: error as Error,
        data: { query: text, params },
      };
      
      await this.manager.triggerHook('onError', this, event);
      
      throw new ConnectionError(
        `Query execution failed: ${(error as Error).message}`,
        error as Error,
        { query: text, params }
      );
    }
  }

  /**
   * Release the connection back to the pool
   */
  release(): void {
    this.state = ConnectionState.IDLE;
    this.client.release();
  }

  /**
   * Get the connection state
   * 
   * @returns Connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get the last query
   * 
   * @returns Last query
   */
  getLastQuery(): string | null {
    return this.lastQuery;
  }

  /**
   * Get the last query time
   * 
   * @returns Last query time
   */
  getLastQueryTime(): number | null {
    return this.lastQueryTime;
  }
}

/**
 * PgConnectionManager class that implements the ConnectionManager interface
 */
export class PgConnectionManager implements ConnectionManager {
  private pool: Pool;
  private config: ConnectionConfig;
  private hooks: ConnectionHooks = {};
  private activeConnections: Set<PgConnection> = new Set();

  /**
   * Create a new PgConnectionManager
   * 
   * @param config - Connection configuration
   */
  constructor(config: ConnectionConfig) {
    this.config = this.validateConfig(config);
    this.pool = this.createPool(this.config);
    
    // Set up pool error handler
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      this.handlePoolError(err);
    });
  }

  /**
   * Validate connection configuration
   * 
   * @param config - Connection configuration
   * @returns Validated connection configuration
   */
  private validateConfig(config: ConnectionConfig): ConnectionConfig {
    if (!config) {
      throw new ConnectionError('Connection configuration is required');
    }

    if (!config.host) {
      throw new ConnectionError('Database host is required');
    }

    if (!config.database) {
      throw new ConnectionError('Database name is required');
    }

    // Set default retry configuration
    if (!config.retry) {
      config.retry = { ...DEFAULT_RETRY_CONFIG };
    } else {
      config.retry = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    }

    // Set default driver type
    if (!config.driver) {
      config.driver = { type: DriverType.PG };
    } else if (!config.driver.type) {
      config.driver.type = DriverType.PG;
    }

    return config;
  }

  /**
   * Create a connection pool
   * 
   * @param config - Connection configuration
   * @returns Connection pool
   */
  private createPool(config: ConnectionConfig): Pool {
    const poolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.pool?.max,
      idleTimeoutMillis: config.pool?.idleTimeoutMillis,
      connectionTimeoutMillis: config.pool?.connectionTimeoutMillis,
      allowExitOnIdle: config.pool?.allowExitOnIdle,
    };

    return new Pool(poolConfig);
  }

  /**
   * Handle pool error
   * 
   * @param error - Error
   */
  private handlePoolError(error: Error): void {
    const poolError = new PoolError(
      `Pool error: ${error.message}`,
      error
    );

    // Log the error
    console.error('Pool error:', poolError);
  }

  /**
   * Get a connection from the pool with retry logic
   * 
   * @returns A connection
   */
  async getConnection(): Promise<Connection> {
    const retryConfig = this.config.retry!;
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < retryConfig.maxAttempts!) {
      try {
        // Trigger beforeConnect hook if registered
        const beforeConnectEvent: ConnectionEvent = {
          type: 'connect',
          state: ConnectionState.IDLE,
          timestamp: Date.now(),
        };
        
        await this.triggerHook('beforeConnect', null as any, beforeConnectEvent);
        
        // Get client from pool
        const client = await this.pool.connect();
        
        // Create connection wrapper
        const connection = new PgConnection(client, this);
        
        // Add to active connections
        this.activeConnections.add(connection);
        
        // Trigger afterConnect hook if registered
        const afterConnectEvent: ConnectionEvent = {
          type: 'connect',
          state: ConnectionState.IDLE,
          timestamp: Date.now(),
        };
        
        await this.triggerHook('afterConnect', connection, afterConnectEvent);
        
        return connection;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts < retryConfig.maxAttempts!) {
          // Calculate delay with exponential backoff and jitter
          const delay = Math.min(
            retryConfig.delay! * Math.pow(retryConfig.factor!, attempts - 1),
            retryConfig.maxDelay!
          );
          
          const jitter = delay * retryConfig.jitter! * (Math.random() * 2 - 1);
          const finalDelay = Math.max(0, delay + jitter);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, finalDelay));
        }
      }
    }

    // All retry attempts failed
    throw new ConnectionError(
      `Failed to get connection after ${retryConfig.maxAttempts} attempts: ${lastError?.message}`,
      lastError || undefined
    );
  }

  /**
   * Release a connection back to the pool
   * 
   * @param connection - Connection to release
   */
  async releaseConnection(connection: Connection): Promise<void> {
    if (connection instanceof PgConnection) {
      // Trigger beforeDisconnect hook if registered
      const beforeDisconnectEvent: ConnectionEvent = {
        type: 'disconnect',
        state: connection.getState(),
        timestamp: Date.now(),
      };
      
      await this.triggerHook('beforeDisconnect', connection, beforeDisconnectEvent);
      
      // Release the connection
      connection.release();
      
      // Remove from active connections
      this.activeConnections.delete(connection);
      
      // Trigger afterDisconnect hook if registered
      const afterDisconnectEvent: ConnectionEvent = {
        type: 'disconnect',
        state: ConnectionState.IDLE,
        timestamp: Date.now(),
      };
      
      await this.triggerHook('afterDisconnect', connection, afterDisconnectEvent);
    } else {
      throw new ConnectionError('Invalid connection object');
    }
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    try {
      // End the pool
      await this.pool.end();
      
      // Clear active connections
      this.activeConnections.clear();
    } catch (error) {
      throw new PoolError(
        `Failed to close all connections: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Get connection pool statistics
   * 
   * @returns Pool statistics
   */
  getPoolStats(): PoolStats {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      active: this.activeConnections.size,
      waiting: this.pool.waitingCount,
      max: this.pool.options.max || 10,
    };
  }

  /**
   * Register connection lifecycle hooks
   * 
   * @param hooks - Connection lifecycle hooks
   */
  registerHooks(hooks: ConnectionHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Trigger a hook
   * 
   * @param hookName - Hook name
   * @param connection - Connection
   * @param event - Connection event
   */
  async triggerHook(
    hookName: keyof ConnectionHooks,
    connection: Connection,
    event: ConnectionEvent
  ): Promise<void> {
    const hook = this.hooks[hookName];
    
    if (hook) {
      try {
        await hook(connection, event);
      } catch (error) {
        console.error(`Error in ${hookName} hook:`, error);
      }
    }
  }
}
