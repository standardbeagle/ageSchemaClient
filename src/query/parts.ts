/**
 * Query parts implementation
 *
 * @packageDocumentation
 */

import {
  QueryPart,
  QueryPartType,
  MatchPattern,
  MatchPatternType,
  VertexPattern,
  EdgePattern,
  PathPattern,
  OrderDirection,
} from './types';

/**
 * Base class for query parts
 */
export abstract class BaseQueryPart implements QueryPart {
  /**
   * Query part type
   */
  abstract type: QueryPartType;

  /**
   * Convert to Cypher string
   */
  abstract toCypher(): string;

  /**
   * Get parameters used in this query part
   */
  getParameters(): Record<string, any> {
    return {};
  }
}

/**
 * MATCH query part
 */
export class MatchPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.MATCH;

  /**
   * Match patterns
   */
  private patterns: MatchPattern[] = [];

  /**
   * Optional flag
   */
  private optional: boolean = false;

  /**
   * Create a new MATCH part
   *
   * @param patterns - Match patterns
   * @param optional - Whether this is an OPTIONAL MATCH
   */
  constructor(patterns: MatchPattern[] = [], optional: boolean = false) {
    super();
    this.patterns = patterns;
    this.optional = optional;
  }

  /**
   * Add a pattern
   *
   * @param pattern - Match pattern
   */
  addPattern(pattern: MatchPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Set optional flag
   *
   * @param optional - Whether this is an OPTIONAL MATCH
   */
  setOptional(optional: boolean): void {
    this.optional = optional;
  }

  /**
   * Get patterns
   *
   * @returns Patterns
   */
  getPatterns(): MatchPattern[] {
    return this.patterns;
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    if (this.patterns.length === 0) {
      return '';
    }

    const matchKeyword = this.optional ? 'OPTIONAL MATCH' : 'MATCH';
    const patternStrings = this.patterns.map(pattern => pattern.toCypher());

    return `${matchKeyword} ${patternStrings.join(', ')}`;
  }

  /**
   * Get parameters used in this query part
   */
  getParameters(): Record<string, any> {
    // Collect parameters from patterns
    const params: Record<string, any> = {};

    // TODO: Implement parameter collection from patterns

    return params;
  }
}

/**
 * WHERE query part
 */
export class WherePart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.WHERE;

  /**
   * Condition expression
   */
  private condition: string;

  /**
   * Parameters
   */
  private parameters: Record<string, any>;

  /**
   * Create a new WHERE part
   *
   * @param condition - Condition expression
   * @param parameters - Parameters
   */
  constructor(condition: string, parameters: Record<string, any> = {}) {
    super();
    this.condition = condition;
    this.parameters = parameters;
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    return `WHERE ${this.condition}`;
  }

  /**
   * Get parameters used in this query part
   */
  getParameters(): Record<string, any> {
    return this.parameters;
  }
}

/**
 * RETURN query part
 */
export class ReturnPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.RETURN;

  /**
   * Return expressions
   */
  private expressions: string[];

  /**
   * Distinct flag
   */
  private distinct: boolean = false;

  /**
   * Group by expressions
   */
  private groupByExpressions: string[] = [];

  /**
   * Create a new RETURN part
   *
   * @param expressions - Return expressions
   * @param distinct - Whether to return distinct results
   */
  constructor(expressions: string[], distinct: boolean = false) {
    super();
    this.expressions = expressions;
    this.distinct = distinct;
  }

  /**
   * Add group by expressions
   *
   * @param expressions - Group by expressions
   */
  addGroupBy(expressions: string[]): void {
    this.groupByExpressions.push(...expressions);
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    const distinctKeyword = this.distinct ? 'DISTINCT ' : '';
    const expressionString = this.expressions.join(', ');
    let cypher = `RETURN ${distinctKeyword}${expressionString}`;

    if (this.groupByExpressions.length > 0) {
      cypher += ` GROUP BY ${this.groupByExpressions.join(', ')}`;
    }

    return cypher;
  }
}

/**
 * ORDER BY query part
 */
export class OrderByPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.ORDER_BY;

  /**
   * Order by items
   */
  private items: Array<{
    expression: string;
    direction: OrderDirection;
  }> = [];

  /**
   * Create a new ORDER BY part
   *
   * @param items - Order by items
   */
  constructor(items: Array<{
    expression: string;
    direction: OrderDirection;
  }> = []) {
    super();
    this.items = items;
  }

  /**
   * Add an order by item
   *
   * @param expression - Expression
   * @param direction - Order direction
   */
  addItem(expression: string, direction: OrderDirection = OrderDirection.ASC): void {
    this.items.push({ expression, direction });
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    if (this.items.length === 0) {
      return '';
    }

    const itemStrings = this.items.map(item =>
      `${item.expression} ${item.direction}`
    );

    return `ORDER BY ${itemStrings.join(', ')}`;
  }
}

/**
 * LIMIT query part
 */
export class LimitPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.LIMIT;

  /**
   * Limit count
   */
  private count: number;

  /**
   * Create a new LIMIT part
   *
   * @param count - Limit count
   */
  constructor(count: number) {
    super();
    this.count = count;
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    return `LIMIT ${this.count}`;
  }
}

/**
 * SKIP query part
 */
export class SkipPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.SKIP;

  /**
   * Skip count
   */
  private count: number;

  /**
   * Create a new SKIP part
   *
   * @param count - Skip count
   */
  constructor(count: number) {
    super();
    this.count = count;
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    return `SKIP ${this.count}`;
  }
}

/**
 * WITH query part
 */
export class WithPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.WITH;

  /**
   * With expressions
   */
  private expressions: string[];

  /**
   * Distinct flag
   */
  private distinct: boolean = false;

  /**
   * Create a new WITH part
   *
   * @param expressions - With expressions
   * @param distinct - Whether to use distinct
   */
  constructor(expressions: string[], distinct: boolean = false) {
    super();
    this.expressions = expressions;
    this.distinct = distinct;
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    const distinctKeyword = this.distinct ? 'DISTINCT ' : '';
    const expressionString = this.expressions.join(', ');

    return `WITH ${distinctKeyword}${expressionString}`;
  }
}

/**
 * UNWIND query part
 */
export class UnwindPart extends BaseQueryPart {
  /**
   * Query part type
   */
  type = QueryPartType.UNWIND;

  /**
   * Expression to unwind
   */
  private expression: string;

  /**
   * Alias for unwound items
   */
  private alias: string;

  /**
   * Create a new UNWIND part
   *
   * @param expression - Expression to unwind
   * @param alias - Alias for unwound items
   */
  constructor(expression: string, alias: string) {
    super();
    this.expression = expression;
    this.alias = alias;
  }

  /**
   * Convert to Cypher string
   */
  toCypher(): string {
    return `UNWIND ${this.expression} AS ${this.alias}`;
  }

  /**
   * Get parameters used in this query part
   */
  getParameters(): Record<string, any> {
    // Extract parameter name from expression if it's a parameter
    if (this.expression.startsWith('$')) {
      const paramName = this.expression.substring(1);
      return { [paramName]: [] }; // Default to empty array, will be replaced with actual value
    }

    return {};
  }
}
