/**
 * SQL Generator extensions for batch operations
 *
 * @packageDocumentation
 */

import { SQLGenerator } from './generator';
import { SQLResult, SQLParameters, SQLVertexTableOptions, SQLEdgeTableOptions } from './types';
import { quoteIdentifier, getPostgresDataType, getVertexTableName, getEdgeTableName } from './utils';
import { PropertyType } from '../schema/types';

/**
 * Extend SQLGenerator with batch operation methods
 */
export function extendSQLGeneratorWithBatchOperations(SQLGenerator: any): void {
  /**
   * Generate CREATE TEMPORARY TABLE statement for a vertex label
   *
   * @param label - Vertex label
   * @param tempTableName - Temporary table name
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateCreateTempVertexTableSQL = function(
    label: string,
    tempTableName: string,
    options: SQLVertexTableOptions = {}
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { primaryKeyColumn, includeMetadata } = {
      ...(({
        tablePrefix: 'v_',
        includeMetadata: true,
        primaryKeyColumn: 'id',
      } as SQLVertexTableOptions)),
      ...options,
    };

    // Build column definitions
    const columnDefs: string[] = [
      `${quoteIdentifier(primaryKeyColumn)} UUID PRIMARY KEY`,
    ];

    // Add property columns
    for (const [propName, propDef] of Object.entries(vertexDef.properties)) {
      const propType = (propDef as any).type;
      const dataType = getPostgresDataType(propType as PropertyType);
      const nullability = this.isPropertyRequired(vertexDef, propName) ? 'NOT NULL' : 'NULL';
      columnDefs.push(`${quoteIdentifier(propName)} ${dataType} ${nullability}`);
    }

    // Add metadata columns if requested
    if (includeMetadata) {
      columnDefs.push(`${quoteIdentifier('created_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
      columnDefs.push(`${quoteIdentifier('updated_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    }

    const sql = `CREATE TEMPORARY TABLE ${tempTableName} (
  ${columnDefs.join(',\n  ')}
) ON COMMIT DROP`;

    return { sql, params: [] };
  };

  /**
   * Generate CREATE TEMPORARY TABLE statement for an edge label
   *
   * @param label - Edge label
   * @param tempTableName - Temporary table name
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateCreateTempEdgeTableSQL = function(
    label: string,
    tempTableName: string,
    options: SQLEdgeTableOptions = {}
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { primaryKeyColumn, sourceIdColumn, targetIdColumn, includeMetadata } = {
      ...(({
        tablePrefix: 'e_',
        includeMetadata: true,
        primaryKeyColumn: 'id',
        sourceIdColumn: 'source_id',
        targetIdColumn: 'target_id',
      } as SQLEdgeTableOptions)),
      ...options,
    };

    // Build column definitions
    const columnDefs: string[] = [
      `${quoteIdentifier(primaryKeyColumn)} UUID PRIMARY KEY`,
      `${quoteIdentifier(sourceIdColumn)} UUID NOT NULL`,
      `${quoteIdentifier(targetIdColumn)} UUID NOT NULL`,
    ];

    // Add property columns
    for (const [propName, propDef] of Object.entries(edgeDef.properties)) {
      const propType = (propDef as any).type;
      const dataType = getPostgresDataType(propType as PropertyType);
      const nullability = this.isPropertyRequired(edgeDef, propName) ? 'NOT NULL' : 'NULL';
      columnDefs.push(`${quoteIdentifier(propName)} ${dataType} ${nullability}`);
    }

    // Add metadata columns if requested
    if (includeMetadata) {
      columnDefs.push(`${quoteIdentifier('created_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
      columnDefs.push(`${quoteIdentifier('updated_at')} TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
    }

    const sql = `CREATE TEMPORARY TABLE ${tempTableName} (
  ${columnDefs.join(',\n  ')}
) ON COMMIT DROP`;

    return { sql, params: [] };
  };

  /**
   * Generate COPY statement for loading data into a temporary vertex table
   *
   * @param label - Vertex label
   * @param tempTableName - Temporary table name
   * @param propertyNames - Property names to include
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateCopyVertexSQL = function(
    label: string,
    tempTableName: string,
    propertyNames: string[],
    options: SQLVertexTableOptions = {}
  ): SQLResult {
    const vertexDef = this.schema.vertices[label];
    if (!vertexDef) {
      throw new Error(`Vertex label ${label} not found in schema`);
    }

    const { primaryKeyColumn } = {
      ...(({
        tablePrefix: 'v_',
        includeMetadata: true,
        primaryKeyColumn: 'id',
      } as SQLVertexTableOptions)),
      ...options,
    };

    // Build column list
    const columns = [primaryKeyColumn, ...propertyNames];

    const sql = `COPY ${tempTableName} (${columns.map(col => quoteIdentifier(col)).join(', ')})
FROM STDIN WITH (FORMAT TEXT, DELIMITER E'\\t', NULL '\\N')`;

    return { sql, params: [] };
  };

  /**
   * Generate COPY statement for loading data into a temporary edge table
   *
   * @param label - Edge label
   * @param tempTableName - Temporary table name
   * @param propertyNames - Property names to include
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateCopyEdgeSQL = function(
    label: string,
    tempTableName: string,
    propertyNames: string[],
    options: SQLEdgeTableOptions = {}
  ): SQLResult {
    const edgeDef = this.schema.edges[label];
    if (!edgeDef) {
      throw new Error(`Edge label ${label} not found in schema`);
    }

    const { primaryKeyColumn, sourceIdColumn, targetIdColumn } = {
      ...(({
        tablePrefix: 'e_',
        includeMetadata: true,
        primaryKeyColumn: 'id',
        sourceIdColumn: 'source_id',
        targetIdColumn: 'target_id',
      } as SQLEdgeTableOptions)),
      ...options,
    };

    // Build column list
    const columns = [primaryKeyColumn, sourceIdColumn, targetIdColumn, ...propertyNames];

    const sql = `COPY ${tempTableName} (${columns.map(col => quoteIdentifier(col)).join(', ')})
FROM STDIN WITH (FORMAT TEXT, DELIMITER E'\\t', NULL '\\N')`;

    return { sql, params: [] };
  };

  /**
   * Generate INSERT statement to move data from a temporary table to the actual table
   *
   * @param label - Vertex or edge label
   * @param tempTableName - Temporary table name
   * @param isEdge - Whether this is an edge table
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateInsertFromTempTableSQL = function(
    label: string,
    tempTableName: string,
    isEdge: boolean = false,
    options: SQLVertexTableOptions | SQLEdgeTableOptions = {}
  ): SQLResult {
    const labelDef = isEdge ? this.schema.edges[label] : this.schema.vertices[label];
    if (!labelDef) {
      throw new Error(`${isEdge ? 'Edge' : 'Vertex'} label ${label} not found in schema`);
    }

    const mergedOptions = {
      ...{
        tablePrefix: isEdge ? 'e_' : 'v_',
        includeMetadata: true,
        primaryKeyColumn: 'id',
      },
      ...options,
    };

    const tableName = isEdge
      ? getEdgeTableName(label, mergedOptions.tablePrefix)
      : getVertexTableName(label, mergedOptions.tablePrefix);

    // Get all columns from the temporary table
    const columnsSQL = `SELECT column_name FROM information_schema.columns
WHERE table_name = '${tempTableName.replace(/"/g, '')}'
ORDER BY ordinal_position`;

    // Insert from temp table to actual table
    const sql = `INSERT INTO ${tableName} (
  SELECT * FROM ${tempTableName}
)
RETURNING *`;

    return { sql, params: [] };
  };
}
