/**
 * SQL Generator implementation
 *
 * @packageDocumentation
 */

import {
  SchemaDefinition,
  VertexLabel,
  EdgeLabel,
  PropertyDefinition,
  PropertyType,
} from '../schema/types';
import {
  SQLResult,
  SQLParameters,
  SQLQueryOptions,
  SQLFilterCondition,
  SQLVertexTableOptions,
  SQLEdgeTableOptions,
  SQLTransactionType,
} from './types';
import {
  quoteIdentifier,
  getPostgresDataType,
  convertToPostgresValue,
  getVertexTableName,
  getEdgeTableName,
  getTempTableName,
} from './utils';

/**
 * Default options for vertex tables
 */
const DEFAULT_VERTEX_TABLE_OPTIONS: SQLVertexTableOptions = {
  tablePrefix: 'v_',
  includeMetadata: true,
  primaryKeyColumn: 'id',
};

/**
 * Default options for edge tables
 */
const DEFAULT_EDGE_TABLE_OPTIONS: SQLEdgeTableOptions = {
  ...DEFAULT_VERTEX_TABLE_OPTIONS,
  tablePrefix: 'e_',
  sourceIdColumn: 'source_id',
  targetIdColumn: 'target_id',
};

/**
 * SQL Generator class for generating SQL statements based on schema definitions
 */
export class SQLGenerator {
  /**
   * Create a new SQLGenerator instance
   *
   * @param schema - Schema definition
   */
  constructor(private schema: SchemaDefinition) {
    // Validate schema
    if (!schema || !schema.vertices || !schema.edges) {
      throw new Error('Invalid schema definition');
    }
  }

  /**
   * Generate CREATE TABLE statement for a vertex label
   *
   * @param label - Vertex label
   * @param options - Table options
   * @returns SQL result
   */
  public generateCreateVertexTableSQL(
    label: string,
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix, includeMetadata, primaryKeyColumn } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const columns: string[] = [];

    // Add primary key column
    columns.push(`${quoteIdentifier(primaryKeyColumn)} UUID PRIMARY KEY`);

    // Add property columns
    for (const [propName, propDef] of Object.entries(vertexDef.properties)) {
      const columnName = quoteIdentifier(propName);
      const dataType = this.getColumnDataType(propDef);
      const nullConstraint = this.isPropertyRequired(vertexDef, propName) ? 'NOT NULL' : 'NULL';
      columns.push(`${columnName} ${dataType} ${nullConstraint}`);
    }

    // Add metadata columns
    if (includeMetadata) {
      columns.push(`${quoteIdentifier('created_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
      columns.push(`${quoteIdentifier('updated_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(',\n  ')}\n)`;

    return { sql, params: [] };
  }

  /**
   * Generate INSERT statement for a vertex
   *
   * @param label - Vertex label
   * @param data - Vertex data
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateInsertVertexSQL(
    label: string,
    data: Record<string, any>,
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const columns: string[] = [quoteIdentifier(primaryKeyColumn)];
    const placeholders: string[] = ['$1'];
    const params: SQLParameters = [data[primaryKeyColumn] || 'uuid_generate_v4()'];
    let paramIndex = 2;

    // Add property columns and values
    for (const [propName, propDef] of Object.entries(vertexDef.properties)) {
      if (propName in data) {
        columns.push(quoteIdentifier(propName));
        placeholders.push(`$${paramIndex}`);
        params.push(convertToPostgresValue(data[propName], propDef.type as PropertyType));
        paramIndex++;
      }
    }

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')})
VALUES (${placeholders.join(', ')})
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate batch INSERT statement for multiple vertices
   *
   * @param label - Vertex label
   * @param dataArray - Array of vertex data
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateBatchInsertVertexSQL(
    label: string,
    dataArray: Record<string, any>[],
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    if (!dataArray.length) {
      throw new Error('Data array cannot be empty');
    }

    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const columns: string[] = [quoteIdentifier(primaryKeyColumn)];
    const propertyNames: string[] = [];

    // Determine which properties to include (union of all properties in data)
    for (const data of dataArray) {
      for (const propName of Object.keys(data)) {
        if (propName !== primaryKeyColumn &&
            propName in vertexDef.properties &&
            !propertyNames.includes(propName)) {
          propertyNames.push(propName);
          columns.push(quoteIdentifier(propName));
        }
      }
    }

    // Generate VALUES clauses and parameters
    const valuesClauses: string[] = [];
    const params: SQLParameters = [];
    let paramIndex = 1;

    for (const data of dataArray) {
      const placeholders: string[] = [];

      // Add ID parameter
      placeholders.push(`$${paramIndex}`);
      params.push(data[primaryKeyColumn] || 'uuid_generate_v4()');
      paramIndex++;

      // Add property parameters
      for (const propName of propertyNames) {
        const propDef = vertexDef.properties[propName];
        placeholders.push(`$${paramIndex}`);
        params.push(propName in data
          ? convertToPostgresValue(data[propName], propDef.type as PropertyType)
          : null);
        paramIndex++;
      }

      valuesClauses.push(`(${placeholders.join(', ')})`);
    }

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')})
VALUES ${valuesClauses.join(',\n      ')}
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate UPDATE statement for a vertex
   *
   * @param label - Vertex label
   * @param id - Vertex ID
   * @param data - Vertex data to update
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateUpdateVertexSQL(
    label: string,
    id: string,
    data: Record<string, any>,
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const setClauses: string[] = [];
    const params: SQLParameters = [];
    let paramIndex = 1;

    // Add property SET clauses
    for (const [propName, propDef] of Object.entries(vertexDef.properties)) {
      if (propName in data) {
        setClauses.push(`${quoteIdentifier(propName)} = $${paramIndex}`);
        params.push(convertToPostgresValue(data[propName], propDef.type as PropertyType));
        paramIndex++;
      }
    }

    // Add updated_at if metadata is included
    if (options.includeMetadata !== false) {
      setClauses.push(`${quoteIdentifier('updated_at')} = CURRENT_TIMESTAMP`);
    }

    // Add WHERE clause parameter
    params.push(id);

    const sql = `UPDATE ${tableName}
SET ${setClauses.join(',\n    ')}
WHERE ${quoteIdentifier(primaryKeyColumn)} = $${paramIndex}
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate DELETE statement for a vertex
   *
   * @param label - Vertex label
   * @param id - Vertex ID
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateDeleteVertexSQL(
    label: string,
    id: string,
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const params: SQLParameters = [id];

    const sql = `DELETE FROM ${tableName}
WHERE ${quoteIdentifier(primaryKeyColumn)} = $1
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate SELECT statement for vertices
   *
   * @param label - Vertex label
   * @param queryOptions - Query options
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateSelectVertexSQL(
    label: string,
    queryOptions: SQLQueryOptions = {},
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const params: SQLParameters = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = '';
    if (queryOptions.filters && queryOptions.filters.length > 0) {
      const conditions: string[] = [];

      for (const filter of queryOptions.filters) {
        const { property, operator, value } = filter;

        if (!vertexDef.properties[property]) {
          throw new Error(`Property ${property} not found in vertex label ${label}`);
        }

        const propDef = vertexDef.properties[property];
        const columnName = quoteIdentifier(property);

        switch (operator) {
          case 'IS NULL':
          case 'IS NOT NULL':
            conditions.push(`${columnName} ${operator}`);
            break;

          case 'IN':
          case 'NOT IN':
            if (Array.isArray(value)) {
              const placeholders: string[] = [];
              for (const val of value) {
                placeholders.push(`$${paramIndex}`);
                params.push(convertToPostgresValue(val, propDef.type as PropertyType));
                paramIndex++;
              }
              conditions.push(`${columnName} ${operator} (${placeholders.join(', ')})`);
            } else {
              throw new Error(`Value for ${operator} operator must be an array`);
            }
            break;

          default:
            conditions.push(`${columnName} ${operator} $${paramIndex}`);
            params.push(convertToPostgresValue(value, propDef.type as PropertyType));
            paramIndex++;
            break;
        }
      }

      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (queryOptions.orderBy && queryOptions.orderBy.length > 0) {
      const orderClauses: string[] = [];

      for (const order of queryOptions.orderBy) {
        const { property, direction } = order;

        if (!vertexDef.properties[property]) {
          throw new Error(`Property ${property} not found in vertex label ${label}`);
        }

        orderClauses.push(`${quoteIdentifier(property)} ${direction}`);
      }

      orderByClause = `ORDER BY ${orderClauses.join(', ')}`;
    }

    // Build LIMIT and OFFSET clauses
    let limitClause = '';
    if (queryOptions.limit !== undefined) {
      limitClause = `LIMIT $${paramIndex}`;
      params.push(queryOptions.limit);
      paramIndex++;
    }

    let offsetClause = '';
    if (queryOptions.offset !== undefined) {
      offsetClause = `OFFSET $${paramIndex}`;
      params.push(queryOptions.offset);
      paramIndex++;
    }

    const sql = `SELECT * FROM ${tableName}
${whereClause}
${orderByClause}
${limitClause}
${offsetClause}`.trim();

    return { sql, params };
  }

  /**
   * Generate a filter function for vertices
   *
   * @param label - Vertex label
   * @param options - Table options
   * @returns SQL result with function definition
   */
  public generateVertexFilterFunctionSQL(
    label: string,
    options: SQLVertexTableOptions = DEFAULT_VERTEX_TABLE_OPTIONS
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_VERTEX_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getVertexTableName(label, tablePrefix);
    const functionName = `filter_${label}_vertices`;
    const tempTableName = `temp_${label}_vertices`;

    // Generate function parameters based on vertex properties
    const functionParams: string[] = [];
    for (const [propName, propDef] of Object.entries(vertexDef.properties)) {
      const paramName = `p_${propName}`;
      const dataType = getPostgresDataType(propDef.type as PropertyType);
      functionParams.push(`${paramName} ${dataType} DEFAULT NULL`);
    }

    // Generate WHERE conditions for the filter
    const whereConditions: string[] = [];
    for (const [propName] of Object.entries(vertexDef.properties)) {
      const paramName = `p_${propName}`;
      const columnName = quoteIdentifier(propName);
      whereConditions.push(`(${paramName} IS NULL OR ${columnName} = ${paramName})`);
    }

    const sql = `CREATE OR REPLACE FUNCTION ${quoteIdentifier(functionName)}(
  ${functionParams.join(',\n  ')}
)
RETURNS TABLE (
  ${quoteIdentifier(primaryKeyColumn)} UUID,
  ${Object.keys(vertexDef.properties).map(prop => `${quoteIdentifier(prop)} ${getPostgresDataType(vertexDef.properties[prop].type as PropertyType)}`).join(',\n  ')}
) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM ${tableName}
  WHERE ${whereConditions.join('\n    AND ')};
END;
$$ LANGUAGE plpgsql;`;

    return { sql, params: [] };
  }

  // Helper methods

  /**
   * Get column data type for a property definition
   *
   * @param propDef - Property definition
   * @returns PostgreSQL data type
   */
  private getColumnDataType(propDef: PropertyDefinition): string {
    const type = Array.isArray(propDef.type) ? propDef.type[0] : propDef.type;
    return getPostgresDataType(type);
  }

  /**
   * Check if a property is required
   *
   * @param labelDef - Vertex or edge label definition
   * @param propName - Property name
   * @returns Whether the property is required
   */
  private isPropertyRequired(labelDef: VertexLabel | EdgeLabel, propName: string): boolean {
    return labelDef.required?.includes(propName) || false;
  }

  /**
   * Generate a transaction control statement
   *
   * @param type - Transaction type
   * @param name - Optional savepoint name
   * @returns SQL result
   */
  public generateTransactionSQL(type: SQLTransactionType, name?: string): SQLResult {
    let sql = '';
    const params: SQLParameters = [];

    switch (type) {
      case SQLTransactionType.BEGIN:
        sql = 'BEGIN';
        break;

      case SQLTransactionType.COMMIT:
        sql = 'COMMIT';
        break;

      case SQLTransactionType.ROLLBACK:
        sql = name ? `ROLLBACK TO SAVEPOINT ${quoteIdentifier(name)}` : 'ROLLBACK';
        break;

      case SQLTransactionType.SAVEPOINT:
        if (!name) {
          throw new Error('Savepoint name is required');
        }
        sql = `SAVEPOINT ${quoteIdentifier(name)}`;
        break;

      case SQLTransactionType.RELEASE:
        if (!name) {
          throw new Error('Savepoint name is required');
        }
        sql = `RELEASE SAVEPOINT ${quoteIdentifier(name)}`;
        break;

      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }

    return { sql, params };
  }

  /**
   * Generate a batch SQL statement with multiple operations in a transaction
   *
   * @param operations - Array of SQL results to combine
   * @returns SQL result with combined statements
   */
  public generateBatchSQL(operations: SQLResult[]): SQLResult {
    if (operations.length === 0) {
      throw new Error('Operations array cannot be empty');
    }

    const beginResult = this.generateTransactionSQL(SQLTransactionType.BEGIN);
    const commitResult = this.generateTransactionSQL(SQLTransactionType.COMMIT);

    const statements: string[] = [beginResult.sql];
    const params: SQLParameters = [];

    let paramOffset = 0;

    for (const operation of operations) {
      // Adjust parameter placeholders to account for the combined parameter array
      const adjustedSql = operation.sql.replace(/\$(\d+)/g, (_, index) => {
        const paramIndex = parseInt(index, 10);
        return `$${paramIndex + paramOffset}`;
      });

      statements.push(adjustedSql);
      params.push(...operation.params);

      paramOffset += operation.params.length;
    }

    statements.push(commitResult.sql);

    return {
      sql: statements.join(';\n\n'),
      params,
    };
  }
  /**
   * Generate CREATE TABLE statement for an edge label
   *
   * @param label - Edge label
   * @param options - Table options
   * @returns SQL result
   */
  public generateCreateEdgeTableSQL(
    label: string,
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, includeMetadata, primaryKeyColumn, sourceIdColumn, targetIdColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const columns: string[] = [];

    // Add primary key column
    columns.push(`${quoteIdentifier(primaryKeyColumn)} UUID PRIMARY KEY`);

    // Add source and target vertex ID columns
    columns.push(`${quoteIdentifier(sourceIdColumn)} UUID NOT NULL`);
    columns.push(`${quoteIdentifier(targetIdColumn)} UUID NOT NULL`);

    // Add property columns
    for (const [propName, propDef] of Object.entries(edgeDef.properties)) {
      const columnName = quoteIdentifier(propName);
      const dataType = this.getColumnDataType(propDef);
      const nullConstraint = this.isPropertyRequired(edgeDef, propName) ? 'NOT NULL' : 'NULL';
      columns.push(`${columnName} ${dataType} ${nullConstraint}`);
    }

    // Add metadata columns
    if (includeMetadata) {
      columns.push(`${quoteIdentifier('created_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
      columns.push(`${quoteIdentifier('updated_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    }

    // Add foreign key constraints if source and target vertex labels are specified
    const constraints: string[] = [];

    if (typeof edgeDef.fromVertex === 'string') {
      const sourceTable = getVertexTableName(edgeDef.fromVertex, tablePrefix.replace('e_', 'v_'));
      constraints.push(`FOREIGN KEY (${quoteIdentifier(sourceIdColumn)}) REFERENCES ${sourceTable}(${quoteIdentifier(primaryKeyColumn)})`);
    }

    if (typeof edgeDef.toVertex === 'string') {
      const targetTable = getVertexTableName(edgeDef.toVertex, tablePrefix.replace('e_', 'v_'));
      constraints.push(`FOREIGN KEY (${quoteIdentifier(targetIdColumn)}) REFERENCES ${targetTable}(${quoteIdentifier(primaryKeyColumn)})`);
    }

    if (constraints.length > 0) {
      columns.push(...constraints);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(',\n  ')}\n)`;

    return { sql, params: [] };
  }

  /**
   * Generate INSERT statement for an edge
   *
   * @param label - Edge label
   * @param sourceId - Source vertex ID
   * @param targetId - Target vertex ID
   * @param data - Edge data
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateInsertEdgeSQL(
    label: string,
    sourceId: string,
    targetId: string,
    data: Record<string, any> = {},
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn, sourceIdColumn, targetIdColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const columns: string[] = [
      quoteIdentifier(primaryKeyColumn),
      quoteIdentifier(sourceIdColumn),
      quoteIdentifier(targetIdColumn)
    ];
    const placeholders: string[] = ['$1', '$2', '$3'];
    const params: SQLParameters = [
      data[primaryKeyColumn] || 'uuid_generate_v4()',
      sourceId,
      targetId
    ];
    let paramIndex = 4;

    // Add property columns and values
    for (const [propName, propDef] of Object.entries(edgeDef.properties)) {
      if (propName in data) {
        columns.push(quoteIdentifier(propName));
        placeholders.push(`$${paramIndex}`);
        params.push(convertToPostgresValue(data[propName], propDef.type as PropertyType));
        paramIndex++;
      }
    }

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')})
VALUES (${placeholders.join(', ')})
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate batch INSERT statement for multiple edges
   *
   * @param label - Edge label
   * @param edges - Array of edge data with source and target IDs
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateBatchInsertEdgeSQL(
    label: string,
    edges: Array<{
      sourceId: string;
      targetId: string;
      data?: Record<string, any>;
    }>,
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    if (!edges.length) {
      throw new Error('Edges array cannot be empty');
    }

    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn, sourceIdColumn, targetIdColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const columns: string[] = [
      quoteIdentifier(primaryKeyColumn),
      quoteIdentifier(sourceIdColumn),
      quoteIdentifier(targetIdColumn)
    ];
    const propertyNames: string[] = [];

    // Determine which properties to include (union of all properties in data)
    for (const edge of edges) {
      const data = edge.data || {};
      for (const propName of Object.keys(data)) {
        if (propName !== primaryKeyColumn &&
            propName in edgeDef.properties &&
            !propertyNames.includes(propName)) {
          propertyNames.push(propName);
          columns.push(quoteIdentifier(propName));
        }
      }
    }

    // Generate VALUES clauses and parameters
    const valuesClauses: string[] = [];
    const params: SQLParameters = [];
    let paramIndex = 1;

    for (const edge of edges) {
      const placeholders: string[] = [];
      const data = edge.data || {};

      // Add ID, source ID, and target ID parameters
      placeholders.push(`$${paramIndex}`);
      params.push(data[primaryKeyColumn] || 'uuid_generate_v4()');
      paramIndex++;

      placeholders.push(`$${paramIndex}`);
      params.push(edge.sourceId);
      paramIndex++;

      placeholders.push(`$${paramIndex}`);
      params.push(edge.targetId);
      paramIndex++;

      // Add property parameters
      for (const propName of propertyNames) {
        const propDef = edgeDef.properties[propName];
        placeholders.push(`$${paramIndex}`);
        params.push(propName in data
          ? convertToPostgresValue(data[propName], propDef.type as PropertyType)
          : null);
        paramIndex++;
      }

      valuesClauses.push(`(${placeholders.join(', ')})`);
    }

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')})
VALUES ${valuesClauses.join(',\n      ')}
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate UPDATE statement for an edge
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @param data - Edge data to update
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateUpdateEdgeSQL(
    label: string,
    id: string,
    data: Record<string, any>,
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const setClauses: string[] = [];
    const params: SQLParameters = [];
    let paramIndex = 1;

    // Add property SET clauses
    for (const [propName, propDef] of Object.entries(edgeDef.properties)) {
      if (propName in data) {
        setClauses.push(`${quoteIdentifier(propName)} = $${paramIndex}`);
        params.push(convertToPostgresValue(data[propName], propDef.type as PropertyType));
        paramIndex++;
      }
    }

    // Add updated_at if metadata is included
    if (options.includeMetadata !== false) {
      setClauses.push(`${quoteIdentifier('updated_at')} = CURRENT_TIMESTAMP`);
    }

    // Add WHERE clause parameter
    params.push(id);

    const sql = `UPDATE ${tableName}
SET ${setClauses.join(',\n    ')}
WHERE ${quoteIdentifier(primaryKeyColumn)} = $${paramIndex}
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate DELETE statement for an edge
   *
   * @param label - Edge label
   * @param id - Edge ID
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateDeleteEdgeSQL(
    label: string,
    id: string,
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const params: SQLParameters = [id];

    const sql = `DELETE FROM ${tableName}
WHERE ${quoteIdentifier(primaryKeyColumn)} = $1
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate DELETE statement for edges between vertices
   *
   * @param label - Edge label
   * @param sourceId - Source vertex ID
   * @param targetId - Target vertex ID
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateDeleteEdgesBetweenVerticesSQL(
    label: string,
    sourceId: string,
    targetId: string,
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, sourceIdColumn, targetIdColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const params: SQLParameters = [sourceId, targetId];

    const sql = `DELETE FROM ${tableName}
WHERE ${quoteIdentifier(sourceIdColumn)} = $1
  AND ${quoteIdentifier(targetIdColumn)} = $2
RETURNING *`;

    return { sql, params };
  }

  /**
   * Generate SELECT statement for edges
   *
   * @param label - Edge label
   * @param queryOptions - Query options
   * @param options - Table options
   * @returns SQL result with parameterized query and parameters
   */
  public generateSelectEdgeSQL(
    label: string,
    queryOptions: SQLQueryOptions = {},
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const params: SQLParameters = [];
    let paramIndex = 1;

    // Build WHERE clause
    let whereClause = '';
    if (queryOptions.filters && queryOptions.filters.length > 0) {
      const conditions: string[] = [];

      for (const filter of queryOptions.filters) {
        const { property, operator, value } = filter;

        // Check if property is a special case for source or target ID
        if (property === options.sourceIdColumn || property === options.targetIdColumn) {
          const columnName = quoteIdentifier(property);

          switch (operator) {
            case 'IS NULL':
            case 'IS NOT NULL':
              conditions.push(`${columnName} ${operator}`);
              break;

            case 'IN':
            case 'NOT IN':
              if (Array.isArray(value)) {
                const placeholders: string[] = [];
                for (const val of value) {
                  placeholders.push(`$${paramIndex}`);
                  params.push(val);
                  paramIndex++;
                }
                conditions.push(`${columnName} ${operator} (${placeholders.join(', ')})`);
              } else {
                throw new Error(`Value for ${operator} operator must be an array`);
              }
              break;

            default:
              conditions.push(`${columnName} ${operator} $${paramIndex}`);
              if (Array.isArray(value)) {
                // Handle array parameters
                for (const item of value) {
                  params.push(item);
                }
              } else {
                params.push(value);
              }
              paramIndex++;
              break;
          }
        } else if (edgeDef.properties[property]) {
          const propDef = edgeDef.properties[property];
          const columnName = quoteIdentifier(property);

          switch (operator) {
            case 'IS NULL':
            case 'IS NOT NULL':
              conditions.push(`${columnName} ${operator}`);
              break;

            case 'IN':
            case 'NOT IN':
              if (Array.isArray(value)) {
                const placeholders: string[] = [];
                for (const val of value) {
                  placeholders.push(`$${paramIndex}`);
                  params.push(convertToPostgresValue(val, propDef.type as PropertyType));
                  paramIndex++;
                }
                conditions.push(`${columnName} ${operator} (${placeholders.join(', ')})`);
              } else {
                throw new Error(`Value for ${operator} operator must be an array`);
              }
              break;

            default:
              conditions.push(`${columnName} ${operator} $${paramIndex}`);
              params.push(convertToPostgresValue(value, propDef.type as PropertyType));
              paramIndex++;
              break;
          }
        } else {
          throw new Error(`Property ${property} not found in edge label ${label}`);
        }
      }

      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Build ORDER BY clause
    let orderByClause = '';
    if (queryOptions.orderBy && queryOptions.orderBy.length > 0) {
      const orderClauses: string[] = [];

      for (const order of queryOptions.orderBy) {
        const { property, direction } = order;

        // Check if property is a special case for source or target ID
        if (property === options.sourceIdColumn || property === options.targetIdColumn) {
          orderClauses.push(`${quoteIdentifier(property)} ${direction}`);
        } else if (edgeDef.properties[property]) {
          orderClauses.push(`${quoteIdentifier(property)} ${direction}`);
        } else {
          throw new Error(`Property ${property} not found in edge label ${label}`);
        }
      }

      orderByClause = `ORDER BY ${orderClauses.join(', ')}`;
    }

    // Build LIMIT and OFFSET clauses
    let limitClause = '';
    if (queryOptions.limit !== undefined) {
      limitClause = `LIMIT $${paramIndex}`;
      params.push(queryOptions.limit);
      paramIndex++;
    }

    let offsetClause = '';
    if (queryOptions.offset !== undefined) {
      offsetClause = `OFFSET $${paramIndex}`;
      params.push(queryOptions.offset);
      paramIndex++;
    }

    const sql = `SELECT * FROM ${tableName}
${whereClause}
${orderByClause}
${limitClause}
${offsetClause}`.trim();

    return { sql, params };
  }

  /**
   * Generate a filter function for edges
   *
   * @param label - Edge label
   * @param options - Table options
   * @returns SQL result with function definition
   */
  public generateEdgeFilterFunctionSQL(
    label: string,
    options: SQLEdgeTableOptions = DEFAULT_EDGE_TABLE_OPTIONS
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { tablePrefix, primaryKeyColumn, sourceIdColumn, targetIdColumn } = {
      ...DEFAULT_EDGE_TABLE_OPTIONS,
      ...options,
    };

    const tableName = getEdgeTableName(label, tablePrefix);
    const functionName = `filter_${label}_edges`;

    // Generate function parameters based on edge properties
    const functionParams: string[] = [
      `p_${sourceIdColumn} UUID DEFAULT NULL`,
      `p_${targetIdColumn} UUID DEFAULT NULL`
    ];

    for (const [propName, propDef] of Object.entries(edgeDef.properties)) {
      const paramName = `p_${propName}`;
      const dataType = getPostgresDataType(propDef.type as PropertyType);
      functionParams.push(`${paramName} ${dataType} DEFAULT NULL`);
    }

    // Generate WHERE conditions for the filter
    const whereConditions: string[] = [
      `(p_${sourceIdColumn} IS NULL OR ${quoteIdentifier(sourceIdColumn)} = p_${sourceIdColumn})`,
      `(p_${targetIdColumn} IS NULL OR ${quoteIdentifier(targetIdColumn)} = p_${targetIdColumn})`
    ];

    for (const [propName] of Object.entries(edgeDef.properties)) {
      const paramName = `p_${propName}`;
      const columnName = quoteIdentifier(propName);
      whereConditions.push(`(${paramName} IS NULL OR ${columnName} = ${paramName})`);
    }

    const sql = `CREATE OR REPLACE FUNCTION ${quoteIdentifier(functionName)}(
  ${functionParams.join(',\n  ')}
)
RETURNS TABLE (
  ${quoteIdentifier(primaryKeyColumn)} UUID,
  ${quoteIdentifier(sourceIdColumn)} UUID,
  ${quoteIdentifier(targetIdColumn)} UUID,
  ${Object.keys(edgeDef.properties).map(prop => `${quoteIdentifier(prop)} ${getPostgresDataType(edgeDef.properties[prop].type as PropertyType)}`).join(',\n  ')}
) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM ${tableName}
  WHERE ${whereConditions.join('\n    AND ')};
END;
$$ LANGUAGE plpgsql;`;

    return { sql, params: [] };
  }
}