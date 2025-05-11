/**
 * Transaction management implementation
 *
 * @packageDocumentation
 */

import { Connection, TransactionError, TimeoutError } from './types';

/**
 * Transaction isolation level
 */
export enum IsolationLevel {
  /**
   * Read uncommitted isolation level
   */
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  
  /**
   * Read committed isolation level
   */
  READ_COMMITTED = 'READ COMMITTED',
  
  /**
   * Repeatable read isolation level
   */
  REPEATABLE_READ = 'REPEATABLE READ',
  
  /**
   * Serializable isolation level
   */
  SERIALIZABLE = 'SERIALIZABLE',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  /**
   * Transaction is active
   */
  ACTIVE = 'active',
  
  /**
   * Transaction is committed
   */
  COMMITTED = 'committed',
  
  /**
   * Transaction is rolled back
   */
  ROLLED_BACK = 'rolled_back',
  
  /**
   * Transaction is in error state
   */
  ERROR = 'error',
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  /**
   * Isolation level
   * @default IsolationLevel.READ_COMMITTED
   */
  isolationLevel?: IsolationLevel;
  
  /**
   * Transaction timeout in milliseconds
   * @default 0 (no timeout)
   */
  timeout?: number;
  
  /**
   * Read-only transaction
   * @default false
   */
  readOnly?: boolean;
  
  /**
   * Deferrable transaction (only applies to SERIALIZABLE isolation level)
   * @default false
   */
  deferrable?: boolean;
}

/**
 * Default transaction options
 */
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  isolationLevel: IsolationLevel.READ_COMMITTED,
  timeout: 0,
  readOnly: false,
  deferrable: false,
};

/**
 * Transaction information
 */
export interface TransactionInfo {
  /**
   * Transaction ID
   */
  id: string;
  
  /**
   * Transaction status
   */
  status: TransactionStatus;
  
  /**
   * Transaction start time
   */
  startTime: number;
  
  /**
   * Transaction end time (if completed)
   */
  endTime?: number;
  
  /**
   * Transaction isolation level
   */
  isolationLevel: IsolationLevel;
  
  /**
   * Transaction nesting level
   */
  nestingLevel: number;
  
  /**
   * Transaction is read-only
   */
  readOnly: boolean;
  
  /**
   * Transaction is deferrable
   */
  deferrable: boolean;
}

/**
 * Transaction class
 */
export class Transaction {
  private connection: Connection;
  private status: TransactionStatus;
  private startTime: number;
  private endTime?: number;
  private options: TransactionOptions;
  private nestingLevel: number;
  private savepointCounter: number;
  private timeoutId?: NodeJS.Timeout;
  private id: string;

  /**
   * Create a new transaction
   * 
   * @param connection - Database connection
   * @param options - Transaction options
   * @param nestingLevel - Transaction nesting level
   */
  constructor(
    connection: Connection,
    options: TransactionOptions = {},
    nestingLevel: number = 0
  ) {
    this.connection = connection;
    this.options = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
    this.status = TransactionStatus.ACTIVE;
    this.startTime = Date.now();
    this.nestingLevel = nestingLevel;
    this.savepointCounter = 0;
    this.id = `tx-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Begin the transaction
   */
  async begin(): Promise<void> {
    try {
      if (this.nestingLevel === 0) {
        // Start a new transaction
        let beginCommand = 'BEGIN';
        
        // Add isolation level if specified
        if (this.options.isolationLevel) {
          beginCommand += ` ISOLATION LEVEL ${this.options.isolationLevel}`;
        }
        
        // Add read-only if specified
        if (this.options.readOnly) {
          beginCommand += ' READ ONLY';
        }
        
        // Add deferrable if specified (only applies to SERIALIZABLE)
        if (
          this.options.deferrable &&
          this.options.isolationLevel === IsolationLevel.SERIALIZABLE
        ) {
          beginCommand += ' DEFERRABLE';
        }
        
        await this.connection.query(beginCommand);
        
        // Set up timeout if specified
        if (this.options.timeout && this.options.timeout > 0) {
          this.setupTimeout();
        }
      } else {
        // Create a savepoint for nested transaction
        const savepointName = this.createSavepointName();
        await this.connection.query(`SAVEPOINT ${savepointName}`);
      }
    } catch (error) {
      this.status = TransactionStatus.ERROR;
      throw new TransactionError(
        `Failed to begin transaction: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    try {
      if (this.status !== TransactionStatus.ACTIVE) {
        throw new TransactionError(
          `Cannot commit transaction in ${this.status} state`
        );
      }
      
      if (this.nestingLevel === 0) {
        // Commit the transaction
        await this.connection.query('COMMIT');
        
        // Clear timeout if set
        this.clearTimeout();
      } else {
        // Release the savepoint for nested transaction
        const savepointName = this.getSavepointName();
        await this.connection.query(`RELEASE SAVEPOINT ${savepointName}`);
      }
      
      this.status = TransactionStatus.COMMITTED;
      this.endTime = Date.now();
    } catch (error) {
      this.status = TransactionStatus.ERROR;
      throw new TransactionError(
        `Failed to commit transaction: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    try {
      if (
        this.status !== TransactionStatus.ACTIVE &&
        this.status !== TransactionStatus.ERROR
      ) {
        throw new TransactionError(
          `Cannot rollback transaction in ${this.status} state`
        );
      }
      
      if (this.nestingLevel === 0) {
        // Rollback the transaction
        await this.connection.query('ROLLBACK');
        
        // Clear timeout if set
        this.clearTimeout();
      } else {
        // Rollback to the savepoint for nested transaction
        const savepointName = this.getSavepointName();
        await this.connection.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      }
      
      this.status = TransactionStatus.ROLLED_BACK;
      this.endTime = Date.now();
    } catch (error) {
      this.status = TransactionStatus.ERROR;
      throw new TransactionError(
        `Failed to rollback transaction: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Create a nested transaction
   * 
   * @param options - Transaction options
   * @returns Nested transaction
   */
  createNestedTransaction(options: TransactionOptions = {}): Transaction {
    // Merge options with parent options
    const mergedOptions = { ...this.options, ...options };
    
    // Create nested transaction with incremented nesting level
    return new Transaction(
      this.connection,
      mergedOptions,
      this.nestingLevel + 1
    );
  }

  /**
   * Get transaction information
   * 
   * @returns Transaction information
   */
  getInfo(): TransactionInfo {
    return {
      id: this.id,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      isolationLevel: this.options.isolationLevel!,
      nestingLevel: this.nestingLevel,
      readOnly: this.options.readOnly!,
      deferrable: this.options.deferrable!,
    };
  }

  /**
   * Check if the transaction is active
   * 
   * @returns True if the transaction is active
   */
  isActive(): boolean {
    return this.status === TransactionStatus.ACTIVE;
  }

  /**
   * Check if the transaction is committed
   * 
   * @returns True if the transaction is committed
   */
  isCommitted(): boolean {
    return this.status === TransactionStatus.COMMITTED;
  }

  /**
   * Check if the transaction is rolled back
   * 
   * @returns True if the transaction is rolled back
   */
  isRolledBack(): boolean {
    return this.status === TransactionStatus.ROLLED_BACK;
  }

  /**
   * Create a savepoint name
   * 
   * @returns Savepoint name
   */
  private createSavepointName(): string {
    this.savepointCounter++;
    return `sp_${this.nestingLevel}_${this.savepointCounter}`;
  }

  /**
   * Get the current savepoint name
   * 
   * @returns Savepoint name
   */
  private getSavepointName(): string {
    return `sp_${this.nestingLevel}_${this.savepointCounter}`;
  }

  /**
   * Set up transaction timeout
   */
  private setupTimeout(): void {
    this.timeoutId = setTimeout(async () => {
      try {
        if (this.status === TransactionStatus.ACTIVE) {
          // Rollback the transaction on timeout
          await this.rollback();
          
          // Set status to error
          this.status = TransactionStatus.ERROR;
          
          console.error(
            `Transaction ${this.id} timed out after ${this.options.timeout}ms and was rolled back`
          );
        }
      } catch (error) {
        console.error('Error rolling back transaction on timeout:', error);
      }
    }, this.options.timeout);
  }

  /**
   * Clear transaction timeout
   */
  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}

/**
 * Transaction manager class
 */
export class TransactionManager {
  private connection: Connection;

  /**
   * Create a new transaction manager
   * 
   * @param connection - Database connection
   */
  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Begin a new transaction
   * 
   * @param options - Transaction options
   * @returns Transaction
   */
  async beginTransaction(options: TransactionOptions = {}): Promise<Transaction> {
    const transaction = new Transaction(this.connection, options);
    await transaction.begin();
    return transaction;
  }

  /**
   * Execute a function within a transaction
   * 
   * @param callback - Function to execute
   * @param options - Transaction options
   * @returns Result of the callback function
   */
  async withTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const transaction = await this.beginTransaction(options);
    
    try {
      const result = await callback(transaction);
      
      // Only commit if transaction is still active
      if (transaction.isActive()) {
        await transaction.commit();
      }
      
      return result;
    } catch (error) {
      // Only rollback if transaction is still active
      if (transaction.isActive()) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get the current isolation level
   * 
   * @returns Current isolation level
   */
  async getCurrentIsolationLevel(): Promise<IsolationLevel> {
    try {
      const result = await this.connection.query(
        'SHOW TRANSACTION ISOLATION LEVEL'
      );
      
      const level = result.rows[0].transaction_isolation;
      
      // Map PostgreSQL isolation level to our enum
      switch (level.toUpperCase()) {
        case 'READ UNCOMMITTED':
          return IsolationLevel.READ_UNCOMMITTED;
        case 'READ COMMITTED':
          return IsolationLevel.READ_COMMITTED;
        case 'REPEATABLE READ':
          return IsolationLevel.REPEATABLE_READ;
        case 'SERIALIZABLE':
          return IsolationLevel.SERIALIZABLE;
        default:
          return IsolationLevel.READ_COMMITTED;
      }
    } catch (error) {
      throw new TransactionError(
        `Failed to get current isolation level: ${(error as Error).message}`,
        error as Error
      );
    }
  }
}
