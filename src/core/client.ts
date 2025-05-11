/**
 * Client implementation for the ageSchemaClient library
 *
 * @packageDocumentation
 */

import { ClientConfig } from './types';
import { SchemaDefinition } from '../schema/types';
import { PgConnectionManager } from '../db/connector';
import { QueryExecutor } from '../db/query';
import { SQLGenerator } from '../sql/generator';
import { QueryBuilder } from '../query/builder';
import { PathQueryBuilder } from '../query/path';
import { VertexOperations } from '../db/vertex';
import { EdgeOperations } from '../db/edge';

/**
 * Main client class for interacting with Apache AGE graph databases
 */
export class AgeSchemaClient<T extends SchemaDefinition = SchemaDefinition> {
  private config: ClientConfig;
  private schema?: T;
  private connectionManager?: PgConnectionManager;
  private queryExecutor?: QueryExecutor;
  private sqlGenerator?: SQLGenerator;
  private vertexOperations?: VertexOperations<T>;
  private edgeOperations?: EdgeOperations<T>;

  /**
   * Create a new AgeSchemaClient instance
   *
   * @param config - Client configuration
   */
  constructor(config: ClientConfig) {
    this.config = config;

    // TODO: Initialize schema from config
    // TODO: Initialize connection manager and query executor
  }

  /**
   * Get the client configuration
   *
   * @returns The client configuration
   */
  public getConfig(): ClientConfig {
    return this.config;
  }

  /**
   * Create a query builder for the specified graph
   *
   * @param graphName - Name of the graph
   * @returns A query builder instance
   */
  public createQueryBuilder(graphName: string = 'default') {
    if (!this.schema) {
      throw new Error('Schema is not initialized');
    }

    if (!this.queryExecutor) {
      throw new Error('Query executor is not initialized');
    }

    return new QueryBuilder<T>(this.schema, this.queryExecutor, graphName);
  }

  /**
   * Create a path query builder for the specified graph
   *
   * @param graphName - Name of the graph
   * @returns A path query builder instance
   */
  public createPathQueryBuilder(graphName: string = 'default') {
    if (!this.schema) {
      throw new Error('Schema is not initialized');
    }

    if (!this.queryExecutor) {
      throw new Error('Query executor is not initialized');
    }

    return new PathQueryBuilder<T>(this.schema, this.queryExecutor, graphName);
  }

  /**
   * Get vertex operations
   *
   * @returns Vertex operations
   */
  public getVertexOperations(): VertexOperations<T> {
    if (!this.vertexOperations) {
      if (!this.schema) {
        throw new Error('Schema is not initialized');
      }

      if (!this.queryExecutor) {
        throw new Error('Query executor is not initialized');
      }

      if (!this.sqlGenerator) {
        throw new Error('SQL generator is not initialized');
      }

      this.vertexOperations = new VertexOperations<T>(
        this.schema,
        this.queryExecutor,
        this.sqlGenerator
      );
    }

    return this.vertexOperations;
  }

  /**
   * Get edge operations
   *
   * @returns Edge operations
   */
  public getEdgeOperations(): EdgeOperations<T> {
    if (!this.edgeOperations) {
      if (!this.schema) {
        throw new Error('Schema is not initialized');
      }

      if (!this.queryExecutor) {
        throw new Error('Query executor is not initialized');
      }

      if (!this.sqlGenerator) {
        throw new Error('SQL generator is not initialized');
      }

      this.edgeOperations = new EdgeOperations<T>(
        this.schema,
        this.queryExecutor,
        this.sqlGenerator
      );
    }

    return this.edgeOperations;
  }
}
