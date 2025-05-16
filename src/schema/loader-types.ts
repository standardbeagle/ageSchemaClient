/**
 * Schema loader types for the ageSchemaClient library
 * 
 * This file defines the TypeScript interfaces for the schema loading functionality.
 * 
 * @packageDocumentation
 */

import { Transaction } from '../db/transaction';

/**
 * Graph data structure containing both vertices and edges
 */
export interface GraphData {
  /**
   * Vertex data organized by vertex label
   * 
   * The keys are vertex labels and the values are arrays of vertex data objects
   */
  vertex: Record<string, any[]>;

  /**
   * Edge data organized by edge label
   * 
   * The keys are edge labels and the values are arrays of edge data objects
   */
  edge: Record<string, any[]>;
}

/**
 * Vertex data structure
 * 
 * The keys are vertex labels and the values are arrays of vertex data objects
 */
export type VertexData = Record<string, any[]>;

/**
 * Edge data structure
 * 
 * The keys are edge labels and the values are arrays of edge data objects
 */
export type EdgeData = Record<string, any[]>;

/**
 * Options for loading operations
 */
export interface LoadOptions {
  /**
   * Transaction to use for the loading operation
   * 
   * If not provided, a new transaction will be created if useTransactions is true
   */
  transaction?: Transaction;

  /**
   * Graph name to use for the loading operation
   * 
   * If not provided, the default graph name will be used
   */
  graphName?: string;

  /**
   * Batch size for the loading operation
   * 
   * If not provided, the default batch size will be used
   */
  batchSize?: number;

  /**
   * Progress callback for the loading operation
   * 
   * This function will be called periodically during the loading operation
   * to provide progress updates
   */
  onProgress?: (progress: ProgressInfo) => void;

  /**
   * Whether to validate data against the schema
   * 
   * If not provided, the default validateData option will be used
   */
  validateData?: boolean;
}

/**
 * Result of a loading operation
 */
export interface LoadResult {
  /**
   * Whether the loading operation was successful
   */
  success: boolean;

  /**
   * Number of vertices loaded
   */
  vertexCount: number;

  /**
   * Number of edges loaded
   */
  edgeCount: number;

  /**
   * Types of vertices loaded
   */
  vertexTypes: string[];

  /**
   * Types of edges loaded
   */
  edgeTypes: string[];

  /**
   * Errors that occurred during the loading operation
   */
  errors?: Error[];

  /**
   * Warnings that occurred during the loading operation
   */
  warnings?: string[];

  /**
   * Duration of the loading operation in milliseconds
   */
  duration: number;
}

/**
 * Progress information for a loading operation
 */
export interface ProgressInfo {
  /**
   * Current phase of the loading operation
   */
  phase: 'validation' | 'storing' | 'creating';

  /**
   * Current progress value
   */
  current: number;

  /**
   * Total progress value
   */
  total: number;

  /**
   * Percentage of completion (0-100)
   */
  percentage: number;

  /**
   * Number of vertices processed so far
   */
  vertexCount?: number;

  /**
   * Number of edges processed so far
   */
  edgeCount?: number;
}

/**
 * Error that occurred during data validation
 */
export interface ValidationErrorInfo {
  /**
   * Type of entity (vertex or edge)
   */
  entityType: 'vertex' | 'edge';

  /**
   * Label of the entity
   */
  label: string;

  /**
   * Index of the entity in the array
   */
  index: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Property that caused the error (if applicable)
   */
  property?: string;

  /**
   * Value that caused the error (if applicable)
   */
  value?: any;
}
