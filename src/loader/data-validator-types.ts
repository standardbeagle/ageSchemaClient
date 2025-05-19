/**
 * Types for data validation
 * 
 * This module provides types for data validation.
 * 
 * @packageDocumentation
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  /**
   * Whether the validation was successful
   */
  valid: boolean;
  
  /**
   * Validation errors, if any
   */
  errors?: ValidationError[];
  
  /**
   * Validation warnings, if any
   */
  warnings?: string[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  /**
   * Type of entity (vertex or edge)
   */
  type: 'vertex' | 'edge';
  
  /**
   * Type of the entity (e.g., Person, KNOWS)
   */
  entityType: string;
  
  /**
   * Index of the entity in the array
   */
  index: number;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Path to the property that failed validation
   */
  path?: string;
}

/**
 * Graph data interface
 */
export interface GraphData {
  /**
   * Vertices to load, grouped by type
   */
  vertices: Record<string, any[]>;
  
  /**
   * Edges to load, grouped by type
   */
  edges: Record<string, any[]>;
}
