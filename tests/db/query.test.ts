/**
 * Tests for the query executor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryExecutor, DefaultQueryLogger } from '../../src/db';

describe('QueryExecutor', () => {
  let mockConnection: any;
  let queryExecutor: QueryExecutor;

  beforeEach(() => {
    mockConnection = {
      query: vi.fn().mockResolvedValue({
        rows: [{ test: 'value' }],
        rowCount: 1,
        fields: [{ name: 'test' }],
        command: 'SELECT',
        oid: 0,
      }),
    };

    queryExecutor = new QueryExecutor(mockConnection);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a query executor', () => {
    expect(queryExecutor).toBeDefined();
  });

  it('should execute a SQL query', async () => {
    const result = await queryExecutor.executeSQL('SELECT 1');

    expect(result).toBeDefined();
    expect(result.rows).toEqual([{ test: 'value' }]);
    expect(result.rowCount).toBe(1);
    expect(mockConnection.query).toHaveBeenCalled();
  });

  it('should execute a SQL query with parameters', async () => {
    const result = await queryExecutor.executeSQL('SELECT $1::text', ['test']);

    expect(result).toBeDefined();
    expect(mockConnection.query).toHaveBeenCalledWith({
      text: 'SELECT $1::text',
      values: ['test'],
      rowMode: 'object',
    });
  });

  it('should execute a SQL query with options', async () => {
    const result = await queryExecutor.executeSQL('SELECT 1', [], {
      rowMode: 'array',
      name: 'test-query',
    });

    expect(result).toBeDefined();
    expect(mockConnection.query).toHaveBeenCalledWith({
      text: 'SELECT 1',
      values: [],
      rowMode: 'array',
      name: 'test-query',
    });
  });

  it('should retry a failed query', async () => {
    mockConnection.query
      .mockRejectedValueOnce(new Error('connection error'))
      .mockResolvedValueOnce({
        rows: [{ test: 'value' }],
        rowCount: 1,
        fields: [{ name: 'test' }],
        command: 'SELECT',
        oid: 0,
      });

    const result = await queryExecutor.executeSQL('SELECT 1', [], {
      maxRetries: 1,
      retryDelay: 10,
    });

    expect(result).toBeDefined();
    expect(mockConnection.query).toHaveBeenCalledTimes(2);
  });

  it('should throw an error after max retries', async () => {
    mockConnection.query.mockRejectedValue(new Error('connection error'));

    await expect(
      queryExecutor.executeSQL('SELECT 1', [], {
        maxRetries: 2,
        retryDelay: 10,
      })
    ).rejects.toThrow('Query execution failed');

    expect(mockConnection.query).toHaveBeenCalledTimes(3);
  });

  it('should execute a Cypher query', async () => {
    const result = await queryExecutor.executeCypher(
      'MATCH (n) RETURN n',
      { param: 'value' },
      'test-graph'
    );

    expect(result).toBeDefined();
    expect(mockConnection.query).toHaveBeenCalledWith({
      text: "SELECT * FROM ag_catalog.cypher('test-graph', $q$MATCH (n) RETURN n$q$, $1) AS (result agtype)",
      values: ["{\"param\":\"value\"}"],
      rowMode: 'object',
    });
  });

  it('should transform query results', () => {
    const result = {
      rows: [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }],
      rowCount: 2,
      fields: [],
      command: 'SELECT',
      oid: 0,
    };

    const transformed = queryExecutor.transformResult(result, row => ({
      ...row,
      transformed: true,
    }));

    expect(transformed).toEqual([
      { id: 1, name: 'test', transformed: true },
      { id: 2, name: 'test2', transformed: true },
    ]);
  });
});

describe('DefaultQueryLogger', () => {
  let logger: DefaultQueryLogger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new DefaultQueryLogger();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('should log a query', () => {
    const result = {
      rows: [{ test: 'value' }],
      rowCount: 1,
      fields: [],
      command: 'SELECT',
      oid: 0,
    };

    logger.logQuery('SELECT 1', ['param'], 100, result);

    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should log a query error', () => {
    const error = new Error('Test error');

    logger.logError('SELECT 1', ['param'], 100, error);

    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should truncate long queries', () => {
    const longQuery = 'SELECT ' + 'x'.repeat(200);

    logger.logQuery(longQuery, [], 100);

    expect(consoleSpy.log).toHaveBeenCalled();
    const logCall = consoleSpy.log.mock.calls[0][0];
    expect(logCall.length).toBeLessThan(longQuery.length);
    expect(logCall).toContain('...');
  });
});
