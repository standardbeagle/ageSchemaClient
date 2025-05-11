/**
 * SQL Generator extensions for schema migrations
 *
 * @packageDocumentation
 */

import { SQLGenerator } from './generator';
import { SQLResult, SQLParameters } from './types';
import { quoteIdentifier, getPostgresDataType, getVertexTableName, getEdgeTableName } from './utils';
import { PropertyDefinition, PropertyType } from '../schema/types';

/**
 * Extend SQLGenerator with migration methods
 */
export function extendSQLGeneratorWithMigrationMethods(SQLGenerator: any): void {
  /**
   * Generate SQL to drop a vertex table
   *
   * @param label - Vertex label
   * @returns SQL result
   */
  SQLGenerator.prototype.generateDropVertexTableSQL = function(
    label: string
  ): SQLResult {
    const tableName = getVertexTableName(label, this.options.tablePrefix);

    const sql = `DROP TABLE IF EXISTS ${tableName} CASCADE`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to drop an edge table
   *
   * @param label - Edge label
   * @returns SQL result
   */
  SQLGenerator.prototype.generateDropEdgeTableSQL = function(
    label: string
  ): SQLResult {
    const tableName = getEdgeTableName(label, this.options.tablePrefix);

    const sql = `DROP TABLE IF EXISTS ${tableName} CASCADE`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to add a column to a table
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param propertyDef - Property definition
   * @param isEdge - Whether this is an edge table
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateAddColumnSQL = function(
    label: string,
    propertyName: string,
    propertyDef: PropertyDefinition,
    isEdge: boolean = false,
    options: any = {}
  ): SQLResult {
    const tablePrefix = isEdge
      ? (options.tablePrefix || this.options?.tablePrefix || 'e_')
      : (options.tablePrefix || this.options?.tablePrefix || 'v_');

    const tableName = isEdge
      ? getEdgeTableName(label, tablePrefix)
      : getVertexTableName(label, tablePrefix);

    const dataType = getPostgresDataType(propertyDef.type as PropertyType);
    const nullability = propertyDef.nullable === false ? 'NOT NULL' : 'NULL';

    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${quoteIdentifier(propertyName)} ${dataType} ${nullability}`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to drop a column from a table
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param isEdge - Whether this is an edge table
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateDropColumnSQL = function(
    label: string,
    propertyName: string,
    isEdge: boolean = false,
    options: any = {}
  ): SQLResult {
    const tablePrefix = isEdge
      ? (options.tablePrefix || this.options?.tablePrefix || 'e_')
      : (options.tablePrefix || this.options?.tablePrefix || 'v_');

    const tableName = isEdge
      ? getEdgeTableName(label, tablePrefix)
      : getVertexTableName(label, tablePrefix);

    const sql = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${quoteIdentifier(propertyName)}`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to alter a column type
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param propertyDef - Property definition
   * @param isEdge - Whether this is an edge table
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateAlterColumnTypeSQL = function(
    label: string,
    propertyName: string,
    propertyDef: PropertyDefinition,
    isEdge: boolean = false,
    options: any = {}
  ): SQLResult {
    const tablePrefix = isEdge
      ? (options.tablePrefix || this.options?.tablePrefix || 'e_')
      : (options.tablePrefix || this.options?.tablePrefix || 'v_');

    const tableName = isEdge
      ? getEdgeTableName(label, tablePrefix)
      : getVertexTableName(label, tablePrefix);

    const dataType = getPostgresDataType(propertyDef.type as PropertyType);

    const sql = `ALTER TABLE ${tableName} ALTER COLUMN ${quoteIdentifier(propertyName)} TYPE ${dataType} USING ${quoteIdentifier(propertyName)}::${dataType}`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to set a column to NOT NULL
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param isEdge - Whether this is an edge table
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateSetNotNullSQL = function(
    label: string,
    propertyName: string,
    isEdge: boolean = false,
    options: any = {}
  ): SQLResult {
    const tablePrefix = isEdge
      ? (options.tablePrefix || this.options?.tablePrefix || 'e_')
      : (options.tablePrefix || this.options?.tablePrefix || 'v_');

    const tableName = isEdge
      ? getEdgeTableName(label, tablePrefix)
      : getVertexTableName(label, tablePrefix);

    const sql = `ALTER TABLE ${tableName} ALTER COLUMN ${quoteIdentifier(propertyName)} SET NOT NULL`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to drop a NOT NULL constraint
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param isEdge - Whether this is an edge table
   * @param options - Table options
   * @returns SQL result
   */
  SQLGenerator.prototype.generateDropNotNullSQL = function(
    label: string,
    propertyName: string,
    isEdge: boolean = false,
    options: any = {}
  ): SQLResult {
    const tablePrefix = isEdge
      ? (options.tablePrefix || this.options?.tablePrefix || 'e_')
      : (options.tablePrefix || this.options?.tablePrefix || 'v_');

    const tableName = isEdge
      ? getEdgeTableName(label, tablePrefix)
      : getVertexTableName(label, tablePrefix);

    const sql = `ALTER TABLE ${tableName} ALTER COLUMN ${quoteIdentifier(propertyName)} DROP NOT NULL`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to rename a column
   *
   * @param label - Vertex or edge label
   * @param oldName - Old property name
   * @param newName - New property name
   * @param isEdge - Whether this is an edge table
   * @returns SQL result
   */
  SQLGenerator.prototype.generateRenameColumnSQL = function(
    label: string,
    oldName: string,
    newName: string,
    isEdge: boolean = false
  ): SQLResult {
    const tableName = isEdge
      ? getEdgeTableName(label, this.options.tablePrefix)
      : getVertexTableName(label, this.options.tablePrefix);

    const sql = `ALTER TABLE ${tableName} RENAME COLUMN ${quoteIdentifier(oldName)} TO ${quoteIdentifier(newName)}`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to add a default value to a column
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param defaultValue - Default value
   * @param isEdge - Whether this is an edge table
   * @returns SQL result
   */
  SQLGenerator.prototype.generateSetDefaultSQL = function(
    label: string,
    propertyName: string,
    defaultValue: any,
    isEdge: boolean = false
  ): SQLResult {
    const tableName = isEdge
      ? getEdgeTableName(label, this.options.tablePrefix)
      : getVertexTableName(label, this.options.tablePrefix);

    let defaultValueStr: string;

    if (defaultValue === null) {
      defaultValueStr = 'NULL';
    } else if (typeof defaultValue === 'string') {
      defaultValueStr = `'${defaultValue.replace(/'/g, "''")}'`;
    } else if (typeof defaultValue === 'object') {
      defaultValueStr = `'${JSON.stringify(defaultValue)}'::jsonb`;
    } else {
      defaultValueStr = String(defaultValue);
    }

    const sql = `ALTER TABLE ${tableName} ALTER COLUMN ${quoteIdentifier(propertyName)} SET DEFAULT ${defaultValueStr}`;

    return { sql, params: [] };
  };

  /**
   * Generate SQL to drop a default value from a column
   *
   * @param label - Vertex or edge label
   * @param propertyName - Property name
   * @param isEdge - Whether this is an edge table
   * @returns SQL result
   */
  SQLGenerator.prototype.generateDropDefaultSQL = function(
    label: string,
    propertyName: string,
    isEdge: boolean = false
  ): SQLResult {
    const tableName = isEdge
      ? getEdgeTableName(label, this.options.tablePrefix)
      : getVertexTableName(label, this.options.tablePrefix);

    const sql = `ALTER TABLE ${tableName} ALTER COLUMN ${quoteIdentifier(propertyName)} DROP DEFAULT`;

    return { sql, params: [] };
  };
}
