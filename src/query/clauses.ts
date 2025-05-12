/**
 * Query clauses implementation
 *
 * @packageDocumentation
 */

import { SchemaDefinition } from '../schema/types';
import {
  IQueryBuilder,
  IMatchClause,
  IReturnClause,
  MatchPatternType,
  VertexPattern,
  EdgePattern,
} from './types';
import { MatchPart, ReturnPart } from './parts';

/**
 * Match clause implementation
 */
export class MatchClause<
  T extends SchemaDefinition,
  L extends keyof T['vertices']
> implements IMatchClause<T, L> {
  /**
   * Create a new match clause
   *
   * @param queryBuilder - Query builder
   * @param matchPart - Match part
   * @param vertexPattern - Vertex pattern
   */
  constructor(
    private queryBuilder: IQueryBuilder<T>,
    private matchPart: MatchPart,
    private vertexPattern: VertexPattern
  ) {}

  /**
   * Add property constraint
   *
   * @param property - Property name
   * @param operator - Operator
   * @param value - Value
   * @returns This match clause
   */
  where(property: keyof T['vertices'][L]['properties'], operator: string, value: any): this {
    // Add property to vertex pattern
    if (!this.vertexPattern.properties) {
      this.vertexPattern.properties = {};
    }

    this.vertexPattern.properties[property as string] = value;

    return this;
  }

  /**
   * Add outgoing edge
   *
   * @param label - Edge label
   * @param alias - Edge alias
   * @param targetLabel - Target vertex label
   * @param targetAlias - Target vertex alias
   * @returns This match clause
   */
  outgoing<E extends keyof T['edges']>(
    label: E,
    alias: string,
    targetLabel: keyof T['vertices'],
    targetAlias: string
  ): this {
    // Create target vertex pattern
    const targetVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: targetLabel as string,
      alias: targetAlias,
      properties: {},
      toCypher: () => {
        const labelStr = targetLabel ? `:${String(targetLabel)}` : '';
        return `(${targetAlias}${labelStr})`;
      }
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: label as string,
      alias,
      fromVertex: this.vertexPattern,
      toVertex: targetVertex,
      direction: 'OUTGOING',
      properties: {},
      toCypher: () => {
        const sourceStr = this.vertexPattern.toCypher();
        const targetStr = targetVertex.toCypher();
        const labelStr = label ? `:${String(label)}` : '';
        return `${sourceStr}-[${alias}${labelStr}]->${targetStr}`;
      }
    };

    // Add pattern to match part
    this.matchPart.addPattern(edgePattern);

    return this;
  }

  /**
   * Add incoming edge
   *
   * @param label - Edge label
   * @param alias - Edge alias
   * @param sourceLabel - Source vertex label
   * @param sourceAlias - Source vertex alias
   * @returns This match clause
   */
  incoming<E extends keyof T['edges']>(
    label: E,
    alias: string,
    sourceLabel: keyof T['vertices'],
    sourceAlias: string
  ): this {
    // Create source vertex pattern
    const sourceVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: sourceLabel as string,
      alias: sourceAlias,
      properties: {},
      toCypher: () => {
        const labelStr = sourceLabel ? `:${String(sourceLabel)}` : '';
        return `(${sourceAlias}${labelStr})`;
      }
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: label as string,
      alias,
      fromVertex: sourceVertex,
      toVertex: this.vertexPattern,
      direction: 'INCOMING',
      properties: {},
      toCypher: () => {
        const sourceStr = sourceVertex.toCypher();
        const targetStr = this.vertexPattern.toCypher();
        const labelStr = label ? `:${String(label)}` : '';
        return `${sourceStr}-[${alias}${labelStr}]->${targetStr}`;
      }
    };

    // Add pattern to match part
    this.matchPart.addPattern(edgePattern);

    return this;
  }

  /**
   * Add bidirectional edge
   *
   * @param label - Edge label
   * @param alias - Edge alias
   * @param otherLabel - Other vertex label
   * @param otherAlias - Other vertex alias
   * @returns This match clause
   */
  related<E extends keyof T['edges']>(
    label: E,
    alias: string,
    otherLabel: keyof T['vertices'],
    otherAlias: string
  ): this {
    // Create other vertex pattern
    const otherVertex: VertexPattern = {
      type: MatchPatternType.VERTEX,
      label: otherLabel as string,
      alias: otherAlias,
      properties: {},
      toCypher: () => {
        const labelStr = otherLabel ? `:${String(otherLabel)}` : '';
        return `(${otherAlias}${labelStr})`;
      }
    };

    // Create edge pattern
    const edgePattern: EdgePattern = {
      type: MatchPatternType.EDGE,
      label: label as string,
      alias,
      fromVertex: this.vertexPattern,
      toVertex: otherVertex,
      direction: 'BIDIRECTIONAL',
      properties: {},
      toCypher: () => {
        const thisStr = this.vertexPattern.toCypher();
        const otherStr = otherVertex.toCypher();
        const labelStr = label ? `:${String(label)}` : '';
        return `${thisStr}-[${alias}${labelStr}]-${otherStr}`;
      }
    };

    // Add pattern to match part
    this.matchPart.addPattern(edgePattern);

    return this;
  }

  /**
   * Return to the main query builder
   *
   * @returns Query builder
   */
  done(): IQueryBuilder<T> {
    return this.queryBuilder;
  }
}

/**
 * Return clause implementation
 */
export class ReturnClause<T extends SchemaDefinition> implements IReturnClause<T> {
  /**
   * Create a new return clause
   *
   * @param queryBuilder - Query builder
   * @param returnPart - Return part
   */
  constructor(
    private queryBuilder: IQueryBuilder<T>,
    private returnPart: ReturnPart
  ) {}

  /**
   * Add GROUP BY clause
   *
   * @param expressions - Group by expressions
   * @returns Query builder
   */
  groupBy(...expressions: string[]): IQueryBuilder<T> {
    this.returnPart.addGroupBy(expressions);
    return this.queryBuilder;
  }

  /**
   * Return to the main query builder
   *
   * @returns Query builder
   */
  done(): IQueryBuilder<T> {
    return this.queryBuilder;
  }
}
