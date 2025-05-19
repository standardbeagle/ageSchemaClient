/**
 * Enhanced Transaction Manager for ageSchemaClient
 *
 * This module provides an enhanced transaction management system with:
 * 1. Proper commit and rollback support
 * 2. Batch processing capabilities
 * 3. Nested transaction support
 * 4. Performance monitoring
 * 5. Resource cleanup
 *
 * @packageDocumentation
 */

import { Connection, ConnectionManager } from './types';
import { Transaction, TransactionOptions, TransactionStatus } from './transaction';
import { TransactionError } from './types';

/**
 * Nested transaction context
 */
interface NestedTransactionContext {
  /**
   * Savepoint name
   */
  savepointName: string;

  /**
   * Transaction options
   */
  options: TransactionOptions;

  /**
   * Start time
   */
  startTime: number;
}

/**
 * Transaction with savepoint support
 */
export class SavepointTransaction {
  private connection: Connection;
  private transactionManager: TransactionManager;
  private savepointStack: NestedTransactionContext[] = [];
  private active = false;

  /**
   * Create a new savepoint transaction
   *
   * @param connection - Database connection
   * @param transactionManager - Transaction manager
   */
  constructor(connection: Connection, transactionManager: TransactionManager) {
    this.connection = connection;
    this.transactionManager = transactionManager;
  }

  /**
   * Begin the transaction
   *
   * @param options - Transaction options
   */
  async begin(options: TransactionOptions = {}): Promise<void> {
    if (!this.active) {
      // Start a new transaction
      let beginCommand = 'BEGIN';

      // Add isolation level if specified
      if (options.isolationLevel) {
        beginCommand += ` ISOLATION LEVEL ${options.isolationLevel}`;
      }

      // Add read-only if specified
      if (options.readOnly) {
        beginCommand += ' READ ONLY';
      }

      // Add deferrable if specified (only applies to SERIALIZABLE)
      if (
        options.deferrable &&
        options.isolationLevel === 'SERIALIZABLE'
      ) {
        beginCommand += ' DEFERRABLE';
      }

      await this.connection.query(beginCommand);
      this.active = true;
    } else {
      // Create a savepoint for nested transaction
      const savepointName = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      await this.connection.query(`SAVEPOINT ${savepointName}`);

      // Push to savepoint stack
      this.savepointStack.push({
        savepointName,
        options,
        startTime: Date.now()
      });
    }
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (!this.active) {
      throw new TransactionError('Cannot commit inactive transaction');
    }

    if (this.savepointStack.length > 0) {
      // Release the savepoint for nested transaction
      const context = this.savepointStack.pop()!;
      await this.connection.query(`RELEASE SAVEPOINT ${context.savepointName}`);

      // Update transaction stats
      this.transactionManager['updateStats']({
        committed: true,
        duration: Date.now() - context.startTime
      });
    } else {
      // Commit the transaction
      await this.connection.query('COMMIT');
      this.active = false;
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (!this.active) {
      throw new TransactionError('Cannot rollback inactive transaction');
    }

    if (this.savepointStack.length > 0) {
      // Rollback to the savepoint for nested transaction
      const context = this.savepointStack.pop()!;
      await this.connection.query(`ROLLBACK TO SAVEPOINT ${context.savepointName}`);

      // Update transaction stats
      this.transactionManager['updateStats']({
        rolledBack: true,
        duration: Date.now() - context.startTime
      });
    } else {
      // Rollback the transaction
      await this.connection.query('ROLLBACK');
      this.active = false;
    }
  }

  /**
   * Check if the transaction is active
   *
   * @returns True if the transaction is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get the nesting level
   *
   * @returns Nesting level (0 for top-level transaction)
   */
  getNestingLevel(): number {
    return this.savepointStack.length;
  }

  /**
   * Get the connection
   *
   * @returns Database connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}

/**
 * Transaction statistics
 */
export interface TransactionStats {
  /**
   * Total number of transactions
   */
  total: number;

  /**
   * Number of committed transactions
   */
  committed: number;

  /**
   * Number of rolled back transactions
   */
  rolledBack: number;

  /**
   * Number of failed transactions
   */
  failed: number;

  /**
   * Average transaction duration in milliseconds
   */
  averageDuration: number;

  /**
   * Maximum transaction duration in milliseconds
   */
  maxDuration: number;

  /**
   * Minimum transaction duration in milliseconds
   */
  minDuration: number;
}

/**
 * Batch processing options
 */
export interface BatchOptions extends TransactionOptions {
  /**
   * Batch size
   * @default 1000
   */
  batchSize?: number;

  /**
   * Whether to continue processing on error
   * @default false
   */
  continueOnError?: boolean;

  /**
   * Progress callback
   */
  progressCallback?: (processed: number, total: number) => void;
}

/**
 * Enhanced Transaction Manager class
 */
export class TransactionManager {
  private connectionManager: ConnectionManager;
  private stats: {
    total: number;
    committed: number;
    rolledBack: number;
    failed: number;
    durations: number[];
  };
  private activeTransactions: Map<string, SavepointTransaction> = new Map();

  /**
   * Create a new transaction manager
   *
   * @param connectionManager - Connection manager
   */
  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
    this.stats = {
      total: 0,
      committed: 0,
      rolledBack: 0,
      failed: 0,
      durations: [],
    };
  }

  /**
   * Update transaction statistics
   *
   * @param stats - Statistics to update
   */
  private updateStats(stats: {
    committed?: boolean;
    rolledBack?: boolean;
    failed?: boolean;
    duration: number;
  }): void {
    this.stats.total++;

    if (stats.committed) {
      this.stats.committed++;
    }

    if (stats.rolledBack) {
      this.stats.rolledBack++;
    }

    if (stats.failed) {
      this.stats.failed++;
    }

    this.stats.durations.push(stats.duration);
  }

  /**
   * Execute a function within a transaction
   *
   * @param callback - Function to execute
   * @param options - Transaction options
   * @returns Result of the callback function
   */
  async executeInTransaction<T>(
    callback: (connection: Connection) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    // Create a transaction
    const transaction = await this.beginTransaction(options);
    const startTime = Date.now();

    try {
      // Execute callback with the connection
      const result = await callback(transaction.getConnection());

      // Commit transaction
      await transaction.commit();

      // Update stats
      this.updateStats({
        committed: true,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      // Rollback transaction
      try {
        await transaction.rollback();
        this.updateStats({
          rolledBack: true,
          duration: Date.now() - startTime
        });
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
        this.updateStats({
          failed: true,
          duration: Date.now() - startTime
        });
      }

      throw new TransactionError(
        `Transaction failed: ${(error as Error).message}`,
        error as Error
      );
    } finally {
      // Release connection if this is a top-level transaction
      if (transaction.getNestingLevel() === 0) {
        await this.connectionManager.releaseConnection(transaction.getConnection());

        // Remove from active transactions
        for (const [id, tx] of this.activeTransactions.entries()) {
          if (tx === transaction) {
            this.activeTransactions.delete(id);
            break;
          }
        }
      }
    }
  }

  /**
   * Begin a new transaction
   *
   * @param options - Transaction options
   * @returns Transaction object
   */
  async beginTransaction(options: TransactionOptions = {}): Promise<SavepointTransaction> {
    const connection = await this.connectionManager.getConnection();
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const transaction = new SavepointTransaction(connection, this);

    try {
      // Begin the transaction
      await transaction.begin(options);

      // Store in active transactions
      this.activeTransactions.set(transactionId, transaction);

      return transaction;
    } catch (error) {
      // Release connection on error
      await this.connectionManager.releaseConnection(connection);
      throw error;
    }
  }

  /**
   * Begin a nested transaction
   *
   * @param parentTransaction - Parent transaction
   * @param options - Transaction options
   * @returns Nested transaction
   */
  async beginNestedTransaction(
    parentTransaction: SavepointTransaction,
    options: TransactionOptions = {}
  ): Promise<SavepointTransaction> {
    if (!parentTransaction.isActive()) {
      throw new TransactionError('Parent transaction is not active');
    }

    try {
      // Create a savepoint
      await parentTransaction.begin(options);
      return parentTransaction;
    } catch (error) {
      throw new TransactionError(
        `Failed to begin nested transaction: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Execute a function within a transaction using the SavepointTransaction object
   *
   * @param callback - Function to execute
   * @param options - Transaction options
   * @returns Result of the callback function
   */
  async withTransaction<T>(
    callback: (transaction: SavepointTransaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const transaction = await this.beginTransaction(options);
    const startTime = Date.now();

    try {
      // Execute callback
      const result = await callback(transaction);

      // Commit transaction
      await transaction.commit();

      // Update stats
      this.updateStats({
        committed: true,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      // Rollback transaction
      try {
        await transaction.rollback();
        this.updateStats({
          rolledBack: true,
          duration: Date.now() - startTime
        });
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
        this.updateStats({
          failed: true,
          duration: Date.now() - startTime
        });
      }

      throw error;
    } finally {
      // Release connection if this is a top-level transaction
      if (transaction.getNestingLevel() === 0) {
        await this.connectionManager.releaseConnection(transaction.getConnection());

        // Remove from active transactions
        for (const [id, tx] of this.activeTransactions.entries()) {
          if (tx === transaction) {
            this.activeTransactions.delete(id);
            break;
          }
        }
      }
    }
  }

  /**
   * Execute a function within a nested transaction
   *
   * @param parentTransaction - Parent transaction
   * @param callback - Function to execute
   * @param options - Transaction options
   * @returns Result of the callback function
   */
  async withNestedTransaction<T>(
    parentTransaction: SavepointTransaction,
    callback: (transaction: SavepointTransaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const startTime = Date.now();

    // Begin nested transaction (creates a savepoint)
    await parentTransaction.begin(options);

    try {
      // Execute callback
      const result = await callback(parentTransaction);

      // Commit nested transaction (releases the savepoint)
      await parentTransaction.commit();

      // Update stats
      this.updateStats({
        committed: true,
        duration: Date.now() - startTime
      });

      return result;
    } catch (error) {
      // Rollback to savepoint
      try {
        await parentTransaction.rollback();
        this.updateStats({
          rolledBack: true,
          duration: Date.now() - startTime
        });
      } catch (rollbackError) {
        console.error('Error during nested transaction rollback:', rollbackError);
        this.updateStats({
          failed: true,
          duration: Date.now() - startTime
        });
      }

      throw error;
    }
  }

  /**
   * Execute a batch operation with multiple items
   *
   * @param items - Array of items to process
   * @param batchSize - Number of items to process in each batch
   * @param callback - Function to execute for each batch
   * @param options - Batch options
   * @returns Array of results from each batch
   */
  async executeInBatch<T, R>(
    items: T[],
    batchSize: number,
    callback: (batch: T[], connection: Connection) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<R[]> {
    if (!items || items.length === 0) {
      return [];
    }

    const results: R[] = [];
    const totalItems = items.length;
    const actualBatchSize = batchSize || options.batchSize || 1000;
    let processedItems = 0;
    const errors: Error[] = [];

    // Process items in batches
    for (let i = 0; i < items.length; i += actualBatchSize) {
      const batch = items.slice(i, i + actualBatchSize);
      const batchIndex = Math.floor(i / actualBatchSize);

      try {
        // Create a transaction for this batch
        const transaction = await this.beginTransaction(options);
        const startTime = Date.now();

        try {
          // Process batch in the transaction
          const batchResult = await callback(batch, transaction.getConnection());

          // Commit the transaction
          await transaction.commit();

          // Update stats
          this.updateStats({
            committed: true,
            duration: Date.now() - startTime
          });

          results.push(batchResult);
        } catch (error) {
          // Rollback the transaction
          try {
            await transaction.rollback();
            this.updateStats({
              rolledBack: true,
              duration: Date.now() - startTime
            });
          } catch (rollbackError) {
            console.error('Error during batch rollback:', rollbackError);
            this.updateStats({
              failed: true,
              duration: Date.now() - startTime
            });
          }

          // Add to errors
          errors.push(error as Error);

          // Stop processing if continueOnError is false
          if (!options.continueOnError) {
            throw new TransactionError(
              `Batch processing failed at batch ${batchIndex + 1}: ${(error as Error).message}`,
              error as Error,
              { processedItems, totalItems, batchIndex }
            );
          }
        } finally {
          // Release connection
          await this.connectionManager.releaseConnection(transaction.getConnection());

          // Remove from active transactions
          for (const [id, tx] of this.activeTransactions.entries()) {
            if (tx === transaction) {
              this.activeTransactions.delete(id);
              break;
            }
          }
        }
      } catch (error) {
        if (!options.continueOnError) {
          throw error;
        }

        errors.push(error as Error);
      }

      // Update processed items count
      processedItems += batch.length;

      // Call progress callback if provided
      if (options.progressCallback) {
        options.progressCallback(processedItems, totalItems);
      }
    }

    // If there were errors but we continued processing, throw a summary error
    if (errors.length > 0 && options.continueOnError) {
      throw new TransactionError(
        `Batch processing completed with ${errors.length} errors`,
        errors[0],
        {
          processedItems,
          totalItems,
          errorCount: errors.length,
          errors: errors.map(e => e.message)
        }
      );
    }

    return results;
  }

  /**
   * Get transaction statistics
   *
   * @returns Transaction statistics
   */
  getStats(): TransactionStats {
    const durations = this.stats.durations;
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

    return {
      total: this.stats.total,
      committed: this.stats.committed,
      rolledBack: this.stats.rolledBack,
      failed: this.stats.failed,
      averageDuration: durations.length > 0 ? totalDuration / durations.length : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
    };
  }

  /**
   * Reset transaction statistics
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      committed: 0,
      rolledBack: 0,
      failed: 0,
      durations: [],
    };
  }

  /**
   * Get the number of active transactions
   *
   * @returns Number of active transactions
   */
  getActiveTransactionCount(): number {
    return this.activeTransactions.size;
  }

  /**
   * Get detailed information about active transactions
   *
   * @returns Array of active transaction details
   */
  getActiveTransactions(): { id: string; nestingLevel: number }[] {
    const result: { id: string; nestingLevel: number }[] = [];

    for (const [id, transaction] of this.activeTransactions.entries()) {
      result.push({
        id,
        nestingLevel: transaction.getNestingLevel(),
      });
    }

    return result;
  }

  /**
   * Get performance metrics for transactions
   *
   * @returns Performance metrics
   */
  getPerformanceMetrics(): {
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
    throughput: number;
    successRate: number;
  } {
    const durations = [...this.stats.durations].sort((a, b) => a - b);
    const total = this.stats.total;

    if (durations.length === 0) {
      return {
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        throughput: 0,
        successRate: 0,
      };
    }

    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // Calculate throughput (transactions per second)
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const throughput = total / (totalDuration / 1000);

    // Calculate success rate
    const successRate = this.stats.committed / total;

    return {
      averageDuration: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
      p95Duration: durations[p95Index] || durations[durations.length - 1],
      p99Duration: durations[p99Index] || durations[durations.length - 1],
      throughput,
      successRate,
    };
  }

  /**
   * Log performance metrics
   *
   * @param logger - Logger function (defaults to console.log)
   */
  logPerformanceMetrics(logger: (message: string) => void = console.log): void {
    const stats = this.getStats();
    const metrics = this.getPerformanceMetrics();

    logger('Transaction Performance Metrics:');
    logger(`- Total transactions: ${stats.total}`);
    logger(`- Committed: ${stats.committed} (${(stats.committed / stats.total * 100).toFixed(2)}%)`);
    logger(`- Rolled back: ${stats.rolledBack} (${(stats.rolledBack / stats.total * 100).toFixed(2)}%)`);
    logger(`- Failed: ${stats.failed} (${(stats.failed / stats.total * 100).toFixed(2)}%)`);
    logger(`- Average duration: ${metrics.averageDuration.toFixed(2)}ms`);
    logger(`- P95 duration: ${metrics.p95Duration.toFixed(2)}ms`);
    logger(`- P99 duration: ${metrics.p99Duration.toFixed(2)}ms`);
    logger(`- Min duration: ${stats.minDuration}ms`);
    logger(`- Max duration: ${stats.maxDuration}ms`);
    logger(`- Throughput: ${metrics.throughput.toFixed(2)} transactions/second`);
    logger(`- Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
    logger(`- Active transactions: ${this.getActiveTransactionCount()}`);
  }
}
