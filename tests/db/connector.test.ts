/**
 * Tests for the database connector
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PgConnectionManager, ConnectionState } from '../../src/db';

// Mock pg Pool
vi.mock('pg', () => {
  const mockClient = {
    query: vi.fn().mockImplementation((query) => {
      // Mock the search_path query result
      if (query.includes('current_setting') && query.includes('search_path')) {
        return Promise.resolve({ rows: [{ search_path: 'ag_catalog, "$user", public' }], rowCount: 1 });
      }
      // Default response for other queries
      return Promise.resolve({ rows: [], rowCount: 0 });
    }),
    release: vi.fn(),
    // Add the _ageInitialized property that our code will check
    _ageInitialized: true
  };

  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockImplementation((event, callback) => {
      // Immediately call the connect callback with the mockClient
      if (event === 'connect') {
        callback(mockClient);
      }
      return mockPool;
    }),
    totalCount: 1,
    idleCount: 1,
    waitingCount: 0,
    options: { max: 10 },
  };

  return {
    Pool: vi.fn(() => mockPool),
  };
});

describe('PgConnectionManager', () => {
  let connectionManager: PgConnectionManager;

  beforeEach(() => {
    connectionManager = new PgConnectionManager({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a connection manager', () => {
    expect(connectionManager).toBeDefined();
  });

  it('should get a connection from the pool', async () => {
    const connection = await connectionManager.getConnection();
    expect(connection).toBeDefined();
    expect(connection.query).toBeDefined();
    expect(connection.release).toBeDefined();
  });

  it('should release a connection back to the pool', async () => {
    const connection = await connectionManager.getConnection();
    await connectionManager.releaseConnection(connection);
  });

  it('should get pool statistics', () => {
    const stats = connectionManager.getPoolStats();
    expect(stats).toBeDefined();
    expect(stats.total).toBe(1);
    expect(stats.idle).toBe(1);
    expect(stats.waiting).toBe(0);
    expect(stats.max).toBe(10);
  });

  it('should register and trigger hooks', async () => {
    const beforeConnectHook = vi.fn();
    const afterConnectHook = vi.fn();

    connectionManager.registerHooks({
      beforeConnect: beforeConnectHook,
      afterConnect: afterConnectHook,
    });

    const connection = await connectionManager.getConnection();

    expect(beforeConnectHook).toHaveBeenCalled();
    expect(afterConnectHook).toHaveBeenCalled();
  });

  it('should throw an error for invalid configuration', () => {
    expect(() => {
      new PgConnectionManager({} as any);
    }).toThrow();
  });
});
