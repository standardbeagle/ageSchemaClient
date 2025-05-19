/**
 * Data storage module for ageSchemaClient
 *
 * This module provides functionality to store vertex and edge data in the age_params
 * temporary table for use with Apache AGE Cypher queries.
 *
 * @packageDocumentation
 */

import { QueryBuilder } from '../query/builder';

/**
 * Options for data storage operations
 */
export interface DataStorageOptions {
  /**
   * Batch size for chunking large datasets
   * @default 1000
   */
  batchSize?: number;

  /**
   * Whether to log debug information
   * @default false
   */
  debug?: boolean;

  /**
   * Number of retry attempts for transient failures
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Delay between retry attempts in milliseconds
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Default options for data storage operations
 */
const DEFAULT_DATA_STORAGE_OPTIONS: DataStorageOptions = {
  batchSize: 1000,
  debug: false,
  retryAttempts: 3,
  retryDelay: 1000
};

/**
 * Result of a data storage operation
 */
export interface DataStorageResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Number of items stored
   */
  count: number;

  /**
   * Number of chunks used (for large datasets)
   */
  chunks?: number;

  /**
   * Error message if the operation failed
   */
  error?: string;

  /**
   * Keys used to store the data
   */
  keys: string[];

  /**
   * Number of retry attempts made
   */
  retryAttempts?: number;
}

/**
 * Class for storing vertex and edge data in the age_params temporary table
 */
export class DataStorage {
  /**
   * Query builder instance
   */
  private queryBuilder: QueryBuilder<any>;

  /**
   * Options for data storage operations
   */
  private options: DataStorageOptions;

  /**
   * Create a new DataStorage instance
   *
   * @param queryBuilder - Query builder instance
   * @param options - Data storage options
   */
  constructor(queryBuilder: QueryBuilder<any>, options: DataStorageOptions = {}) {
    this.queryBuilder = queryBuilder;
    this.options = { ...DEFAULT_DATA_STORAGE_OPTIONS, ...options };
  }

  /**
   * Store vertex data in the age_params temporary table
   *
   * @param vertexType - Vertex type
   * @param vertices - Array of vertex data
   * @returns Result of the storage operation
   */
  async storeVertexData(vertexType: string, vertices: any[]): Promise<DataStorageResult> {
    if (!vertexType) {
      throw new Error('Vertex type is required');
    }

    // Store vertex data with key format: vertex_{vertexType}
    return this.storeData(`vertex_${vertexType}`, vertices);
  }

  /**
   * Store edge data in the age_params temporary table
   *
   * @param edgeType - Edge type
   * @param edges - Array of edge data
   * @returns Result of the storage operation
   */
  async storeEdgeData(edgeType: string, edges: any[]): Promise<DataStorageResult> {
    if (!edgeType) {
      throw new Error('Edge type is required');
    }

    // Store edge data with key format: edge_{edgeType}
    return this.storeData(`edge_${edgeType}`, edges);
  }

  /**
   * Store data in the age_params temporary table
   *
   * @param key - Key to store the data under
   * @param data - Array of data to store
   * @returns Result of the storage operation
   */
  private async storeData(key: string, data: any[]): Promise<DataStorageResult> {
    // Initialize result
    const result: DataStorageResult = {
      success: false,
      count: 0,
      keys: [],
      retryAttempts: 0
    };

    const { retryAttempts = 3, retryDelay = 1000 } = this.options;
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= retryAttempts) {
      try {
        // Handle empty array case
        if (!data || data.length === 0) {
          if (this.options.debug) {
            console.log(`No data to store for key: ${key}`);
          }

          // Store an empty array to ensure the key exists
          await this.queryBuilder.setParam(key, []);

          result.success = true;
          result.keys.push(key);
          return result;
        }

        const { batchSize = 1000 } = this.options;

        // If data fits in a single batch, store it directly
        if (data.length <= batchSize) {
          await this.queryBuilder.setParam(key, data);

          result.success = true;
          result.count = data.length;
          result.keys.push(key);

          if (this.options.debug) {
            console.log(`Stored ${data.length} items with key: ${key}`);
          }

          return result;
        }

        // Handle large datasets by chunking
        const chunks = Math.ceil(data.length / batchSize);
        result.chunks = chunks;

        if (this.options.debug) {
          console.log(`Chunking ${data.length} items into ${chunks} chunks of size ${batchSize}`);
        }

        // Track failed chunks for potential recovery
        const failedChunks: number[] = [];

        for (let i = 0; i < data.length; i += batchSize) {
          const chunkIndex = Math.floor(i / batchSize);
          const chunkKey = `${key}_chunk_${chunkIndex}`;
          const chunk = data.slice(i, i + batchSize);

          try {
            // Set a timeout for the operation
            const timeout = 30000; // 30 seconds timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
              const id = setTimeout(() => {
                clearTimeout(id);
                reject(new Error(`Timeout storing chunk ${chunkIndex + 1}/${chunks}`));
              }, timeout);
            });

            // Store the chunk with timeout
            await Promise.race([
              this.queryBuilder.setParam(chunkKey, chunk),
              timeoutPromise
            ]);

            result.keys.push(chunkKey);
            result.count += chunk.length;

            if (this.options.debug) {
              console.log(`Stored chunk ${chunkIndex + 1}/${chunks} with key: ${chunkKey}`);
            }
          } catch (chunkError) {
            // Track failed chunk for retry
            failedChunks.push(chunkIndex);

            if (this.options.debug) {
              console.error(`Failed to store chunk ${chunkIndex + 1}/${chunks}:`, chunkError);
            }

            // Throw the error to trigger retry logic
            throw chunkError;
          }
        }

        // If we got here, all chunks were stored successfully
        // Store metadata about the chunks
        await this.queryBuilder.setParam(`${key}_metadata`, {
          totalCount: data.length,
          chunks: chunks,
          chunkSize: batchSize,
          keys: result.keys,
          timestamp: new Date().toISOString()
        });

        result.keys.push(`${key}_metadata`);
        result.success = true;
        result.retryAttempts = attempts > 0 ? attempts - 1 : 0;

        if (this.options.debug) {
          console.log(`Successfully stored ${data.length} items in ${chunks} chunks`);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;
        result.retryAttempts = attempts - 1;

        if (this.options.debug) {
          console.error(`Error storing data with key ${key} (attempt ${attempts}/${retryAttempts + 1}):`, error);
        }

        // Check if we should retry
        if (attempts <= retryAttempts) {
          // Calculate delay with exponential backoff
          const delay = retryDelay * Math.pow(2, attempts - 1);

          if (this.options.debug) {
            console.log(`Retrying in ${delay}ms...`);
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // No more retries
          result.success = false;
          result.error = lastError.message;

          console.error(`Failed to store data with key ${key} after ${retryAttempts + 1} attempts:`, lastError);
          throw lastError;
        }
      }
    }

    // This should never be reached due to the throw in the catch block
    return result;
  }
}
