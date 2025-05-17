/**
 * Resource Registry for ageSchemaClient
 *
 * This file provides a singleton registry for tracking and cleaning up
 * resources created during tests. It ensures that:
 * 1. All resources are properly tracked
 * 2. Resources are cleaned up in the correct order
 * 3. Cleanup errors are properly handled
 * 4. Resources can be cleaned up individually or all at once
 */

import { QueryExecutor } from '../../src/db/query';

/**
 * Resource types that can be registered
 */
export enum ResourceType {
  SCHEMA = 'schema',
  GRAPH = 'graph',
  TABLE = 'table',
  FUNCTION = 'function',
  OTHER = 'other',
}

/**
 * Resource interface
 */
export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  cleanup: () => Promise<void>;
  priority: number; // Higher priority resources are cleaned up first
}

/**
 * ResourceRegistry class that implements the singleton pattern
 */
export class ResourceRegistry {
  private static instance: ResourceRegistry | null = null;
  private resources: Map<string, Resource> = new Map();
  private queryExecutor: QueryExecutor | null = null;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    console.log('Creating resource registry...');

    // Register cleanup handler for process exit
    process.on('exit', () => {
      console.log('Process exiting, cleaning up resources...');
      // We can't use async functions in exit handlers, so we just log the resources
      console.log(`Resources that would be cleaned up: ${Array.from(this.resources.keys()).join(', ')}`);
    });
  }

  /**
   * Get the singleton instance
   * If it doesn't exist, it will be created
   *
   * @returns The singleton instance
   */
  public static getInstance(): ResourceRegistry {
    if (!ResourceRegistry.instance) {
      ResourceRegistry.instance = new ResourceRegistry();
    }
    return ResourceRegistry.instance;
  }

  /**
   * Set the query executor to use for cleanup operations
   * 
   * @param queryExecutor - Query executor
   */
  public setQueryExecutor(queryExecutor: QueryExecutor): void {
    this.queryExecutor = queryExecutor;
  }

  /**
   * Register a resource for cleanup
   * 
   * @param resource - Resource to register
   */
  public registerResource(resource: Resource): void {
    this.resources.set(resource.id, resource);
    console.log(`Registered resource: ${resource.type}:${resource.name} (${resource.id})`);
  }

  /**
   * Register a schema for cleanup
   * 
   * @param schemaName - Schema name
   * @param queryExecutor - Query executor to use for cleanup
   * @returns Resource ID
   */
  public registerSchema(schemaName: string, queryExecutor: QueryExecutor): string {
    const id = `schema:${schemaName}`;
    this.registerResource({
      id,
      type: ResourceType.SCHEMA,
      name: schemaName,
      cleanup: async () => {
        try {
          await queryExecutor.executeSQL(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
          console.log(`Dropped schema ${schemaName}`);
        } catch (error) {
          console.warn(`Warning: Could not drop schema ${schemaName}: ${(error as Error).message}`);
        }
      },
      priority: 10, // Schemas should be dropped after graphs
    });
    return id;
  }

  /**
   * Register a graph for cleanup
   * 
   * @param graphName - Graph name
   * @param queryExecutor - Query executor to use for cleanup
   * @returns Resource ID
   */
  public registerGraph(graphName: string, queryExecutor: QueryExecutor): string {
    const id = `graph:${graphName}`;
    this.registerResource({
      id,
      type: ResourceType.GRAPH,
      name: graphName,
      cleanup: async () => {
        try {
          await queryExecutor.executeSQL(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
          console.log(`Dropped graph ${graphName}`);
        } catch (error) {
          console.warn(`Warning: Could not drop graph ${graphName}: ${(error as Error).message}`);
        }
      },
      priority: 20, // Graphs should be dropped before schemas
    });
    return id;
  }

  /**
   * Register a table for cleanup
   * 
   * @param tableName - Table name (can include schema)
   * @param queryExecutor - Query executor to use for cleanup
   * @returns Resource ID
   */
  public registerTable(tableName: string, queryExecutor: QueryExecutor): string {
    const id = `table:${tableName}`;
    this.registerResource({
      id,
      type: ResourceType.TABLE,
      name: tableName,
      cleanup: async () => {
        try {
          await queryExecutor.executeSQL(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
          console.log(`Dropped table ${tableName}`);
        } catch (error) {
          console.warn(`Warning: Could not drop table ${tableName}: ${(error as Error).message}`);
        }
      },
      priority: 15, // Tables should be dropped after graphs but before schemas
    });
    return id;
  }

  /**
   * Register a custom resource for cleanup
   * 
   * @param id - Resource ID
   * @param name - Resource name
   * @param type - Resource type
   * @param cleanup - Cleanup function
   * @param priority - Cleanup priority (higher = cleaned up first)
   * @returns Resource ID
   */
  public registerCustomResource(
    id: string,
    name: string,
    type: ResourceType,
    cleanup: () => Promise<void>,
    priority: number
  ): string {
    this.registerResource({
      id,
      type,
      name,
      cleanup,
      priority,
    });
    return id;
  }

  /**
   * Clean up a specific resource
   * 
   * @param id - Resource ID
   */
  public async cleanupResource(id: string): Promise<void> {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        await resource.cleanup();
        this.resources.delete(id);
        console.log(`Cleaned up resource: ${resource.type}:${resource.name} (${resource.id})`);
      } catch (error) {
        console.error(`Error cleaning up resource ${resource.type}:${resource.name} (${resource.id}): ${(error as Error).message}`);
      }
    }
  }

  /**
   * Clean up all resources
   * Resources are cleaned up in priority order (higher priority first)
   */
  public async cleanupAll(): Promise<void> {
    // Sort resources by priority (higher priority first)
    const sortedResources = Array.from(this.resources.values())
      .sort((a, b) => b.priority - a.priority);
    
    console.log(`Cleaning up ${sortedResources.length} resources...`);
    
    for (const resource of sortedResources) {
      try {
        await resource.cleanup();
        this.resources.delete(resource.id);
        console.log(`Cleaned up resource: ${resource.type}:${resource.name} (${resource.id})`);
      } catch (error) {
        console.error(`Error cleaning up resource ${resource.type}:${resource.name} (${resource.id}): ${(error as Error).message}`);
      }
    }
    
    console.log('All resources cleaned up');
  }

  /**
   * Clean up resources by type
   * 
   * @param type - Resource type
   */
  public async cleanupByType(type: ResourceType): Promise<void> {
    const resourcesOfType = Array.from(this.resources.values())
      .filter(resource => resource.type === type)
      .sort((a, b) => b.priority - a.priority);
    
    console.log(`Cleaning up ${resourcesOfType.length} resources of type ${type}...`);
    
    for (const resource of resourcesOfType) {
      try {
        await resource.cleanup();
        this.resources.delete(resource.id);
        console.log(`Cleaned up resource: ${resource.type}:${resource.name} (${resource.id})`);
      } catch (error) {
        console.error(`Error cleaning up resource ${resource.type}:${resource.name} (${resource.id}): ${(error as Error).message}`);
      }
    }
  }

  /**
   * Get the number of registered resources
   * 
   * @returns The number of registered resources
   */
  public getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * Get the number of registered resources by type
   * 
   * @param type - Resource type
   * @returns The number of registered resources of the specified type
   */
  public getResourceCountByType(type: ResourceType): number {
    return Array.from(this.resources.values())
      .filter(resource => resource.type === type)
      .length;
  }
}

/**
 * Get the singleton resource registry instance
 * 
 * @returns The singleton resource registry instance
 */
export function getResourceRegistry(): ResourceRegistry {
  return ResourceRegistry.getInstance();
}
