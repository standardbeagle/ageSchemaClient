import { describe, it, expect, vi } from 'vitest';
import { AgeSchemaClient } from '../../src/core/client';
import { QueryBuilder } from '../../src/query/builder';

// Mock dependencies
vi.mock('../../src/query/builder', () => {
  return {
    QueryBuilder: vi.fn().mockImplementation((schema, queryExecutor, graphName) => {
      return { schema, queryExecutor, graphName };
    }),
  };
});

describe('AgeSchemaClient', () => {
  it('should create a client instance', () => {
    const config = {
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'postgres',
        password: 'postgres',
      },
    };

    const client = new AgeSchemaClient(config);
    expect(client).toBeInstanceOf(AgeSchemaClient);
    expect(client.getConfig()).toEqual(config);
  });

  it('should throw when creating a query builder without schema', () => {
    const config = {
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'postgres',
        password: 'postgres',
      },
    };

    const client = new AgeSchemaClient(config);
    expect(() => client.createQueryBuilder('test_graph')).toThrow('Schema is not initialized');
  });

  it('should throw when creating a query builder without query executor', () => {
    const config = {
      connection: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'postgres',
        password: 'postgres',
      },
    };

    const client = new AgeSchemaClient(config);
    // @ts-ignore - Accessing private property for testing
    client.schema = {};

    expect(() => client.createQueryBuilder('test_graph')).toThrow('Query executor is not initialized');
  });
});
