/**
 * Type definitions for SQL Generator extensions
 */

import { SQLResult, SQLVertexTableOptions, SQLEdgeTableOptions } from './types';
import { PropertyDefinition } from '../schema/types';

declare module './generator' {
  export interface SQLGenerator {
    // Batch operations
    generateCreateTempVertexTableSQL(
      label: string,
      tempTableName: string,
      options?: SQLVertexTableOptions
    ): SQLResult;

    generateCreateTempEdgeTableSQL(
      label: string,
      tempTableName: string,
      options?: SQLEdgeTableOptions
    ): SQLResult;

    generateCopyVertexSQL(
      label: string,
      tempTableName: string,
      propertyNames: string[],
      options?: SQLVertexTableOptions
    ): SQLResult;

    generateCopyEdgeSQL(
      label: string,
      tempTableName: string,
      propertyNames: string[],
      options?: SQLEdgeTableOptions
    ): SQLResult;

    generateInsertFromTempTableSQL(
      label: string,
      tempTableName: string,
      isEdge?: boolean,
      options?: SQLVertexTableOptions | SQLEdgeTableOptions
    ): SQLResult;

    // Migration operations
    generateDropVertexTableSQL(
      label: string,
      options?: any
    ): SQLResult;

    generateDropEdgeTableSQL(
      label: string,
      options?: any
    ): SQLResult;

    generateAddColumnSQL(
      label: string,
      propertyName: string,
      propertyDef: PropertyDefinition,
      isEdge?: boolean,
      options?: any
    ): SQLResult;

    generateDropColumnSQL(
      label: string,
      propertyName: string,
      isEdge?: boolean,
      options?: any
    ): SQLResult;

    generateAlterColumnTypeSQL(
      label: string,
      propertyName: string,
      propertyDef: PropertyDefinition,
      isEdge?: boolean,
      options?: any
    ): SQLResult;

    generateSetNotNullSQL(
      label: string,
      propertyName: string,
      isEdge?: boolean,
      options?: any
    ): SQLResult;

    generateDropNotNullSQL(
      label: string,
      propertyName: string,
      isEdge?: boolean,
      options?: any
    ): SQLResult;

    generateRenameColumnSQL(
      label: string,
      oldName: string,
      newName: string,
      isEdge?: boolean
    ): SQLResult;

    generateSetDefaultSQL(
      label: string,
      propertyName: string,
      defaultValue: any,
      isEdge?: boolean
    ): SQLResult;

    generateDropDefaultSQL(
      label: string,
      propertyName: string,
      isEdge?: boolean
    ): SQLResult;
  }
}
