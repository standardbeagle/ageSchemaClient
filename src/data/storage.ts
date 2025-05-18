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
      keys: []
    };

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

      for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        const chunkKey = `${key}_chunk_${Math.floor(i / batchSize)}`;
        
        await this.queryBuilder.setParam(chunkKey, chunk);
        
        result.keys.push(chunkKey);
        result.count += chunk.length;
        
        if (this.options.debug) {
          console.log(`Stored chunk ${Math.floor(i / batchSize) + 1}/${chunks} with key: ${chunkKey}`);
        }
      }

      // Store metadata about the chunks
      await this.queryBuilder.setParam(`${key}_metadata`, {
        totalCount: data.length,
        chunks: chunks,
        chunkSize: batchSize,
        keys: result.keys
      });
      
      result.keys.push(`${key}_metadata`);
      result.success = true;
      
      if (this.options.debug) {
        console.log(`Successfully stored ${data.length} items in ${chunks} chunks`);
      }
      
      return result;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      
      console.error(`Error storing data with key ${key}:`, error);
      throw error;
    }
  }
}
