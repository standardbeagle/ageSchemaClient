/**
 * Unit tests for parameter collection in query parts
 *
 * These tests verify that the MatchPart.getParameters() method correctly
 * identifies parameter references from vertex and edge patterns.
 */

import { describe, it, expect } from 'vitest';
import { MatchPart } from '../../src/query/parts';
import { MatchPatternType, VertexPattern, EdgePattern } from '../../src/query/types';

describe('MatchPart Parameter Collection', () => {
  describe('getParameters', () => {
    it('should return empty object when no patterns have parameters', () => {
      const matchPart = new MatchPart();
      
      // Add a vertex pattern without parameters
      const vertexPattern: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Person',
        alias: 'p',
        toCypher: () => '(p:Person)'
      };
      
      matchPart.addPattern(vertexPattern);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({});
    });

    it('should identify parameter references from vertex pattern Cypher', () => {
      const matchPart = new MatchPart();
      
      // Add a vertex pattern with parameter references in Cypher
      const vertexPattern: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Person',
        alias: 'p',
        toCypher: () => '(p:Person {name: $personName, age: $personAge})'
      };
      
      matchPart.addPattern(vertexPattern);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({
        personName: undefined,
        personAge: undefined
      });
    });

    it('should identify parameter references from edge pattern Cypher', () => {
      const matchPart = new MatchPart();
      
      // Add an edge pattern with parameter references in Cypher
      const edgePattern: EdgePattern = {
        type: MatchPatternType.EDGE,
        label: 'KNOWS',
        alias: 'r',
        fromVertex: {} as VertexPattern,
        toVertex: {} as VertexPattern,
        toCypher: () => '(p1)-[r:KNOWS {since: $knowsSince, strength: $knowsStrength}]->(p2)'
      };
      
      matchPart.addPattern(edgePattern);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({
        knowsSince: undefined,
        knowsStrength: undefined
      });
    });

    it('should identify parameter references from multiple patterns', () => {
      const matchPart = new MatchPart();
      
      // Add vertex pattern with parameter references
      const vertexPattern: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Person',
        alias: 'p',
        toCypher: () => '(p:Person {name: $personName})'
      };
      
      // Add edge pattern with parameter references
      const edgePattern: EdgePattern = {
        type: MatchPatternType.EDGE,
        label: 'WORKS_AT',
        alias: 'r',
        fromVertex: {} as VertexPattern,
        toVertex: {} as VertexPattern,
        toCypher: () => '(p)-[r:WORKS_AT {role: $workRole}]->(c)'
      };
      
      matchPart.addPattern(vertexPattern);
      matchPart.addPattern(edgePattern);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({
        personName: undefined,
        workRole: undefined
      });
    });

    it('should handle patterns with multiple parameter references', () => {
      const matchPart = new MatchPart();
      
      // Add vertex pattern with multiple parameter references
      const vertexPattern: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Product',
        alias: 'prod',
        toCypher: () => '(prod:Product {name: $productName, price: $productPrice, category: $productCategory})'
      };
      
      matchPart.addPattern(vertexPattern);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({
        productName: undefined,
        productPrice: undefined,
        productCategory: undefined
      });
    });

    it('should handle patterns with no parameter references', () => {
      const matchPart = new MatchPart();
      
      // Add vertex pattern without parameter references
      const vertexPattern: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Person',
        alias: 'p',
        toCypher: () => '(p:Person)'
      };
      
      // Add edge pattern without parameter references
      const edgePattern: EdgePattern = {
        type: MatchPatternType.EDGE,
        label: 'KNOWS',
        alias: 'r',
        fromVertex: {} as VertexPattern,
        toVertex: {} as VertexPattern,
        toCypher: () => '(p1)-[r:KNOWS]->(p2)'
      };
      
      matchPart.addPattern(vertexPattern);
      matchPart.addPattern(edgePattern);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({});
    });

    it('should handle duplicate parameter references correctly', () => {
      const matchPart = new MatchPart();
      
      // Add patterns that reference the same parameter
      const vertexPattern1: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Person',
        alias: 'p1',
        toCypher: () => '(p1:Person {age: $minAge})'
      };
      
      const vertexPattern2: VertexPattern = {
        type: MatchPatternType.VERTEX,
        label: 'Person',
        alias: 'p2',
        toCypher: () => '(p2:Person {age: $minAge})'
      };
      
      matchPart.addPattern(vertexPattern1);
      matchPart.addPattern(vertexPattern2);
      
      const params = matchPart.getParameters();
      expect(params).toEqual({
        minAge: undefined
      });
    });
  });
});