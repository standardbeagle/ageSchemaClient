/**
 * Integration test for document sections and knowledge graph
 *
 * This test demonstrates:
 * 1. Loading a document-knowledge graph schema
 * 2. Using batch schema loader to insert data
 * 3. Using query builder for advanced queries with:
 *    - Edge connections
 *    - Aggregation
 *    - Path traversal
 *    - Advanced filtering
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  queryExecutor,
  isAgeAvailable,
  TEST_SCHEMA
} from '../setup/integration';
import { QueryBuilder } from '../../src/query/builder';
import { OrderDirection } from '../../src/query/types';
import { SchemaLoader } from '../../src/loader/schema-loader';
import { documentKnowledgeSchema } from '../fixtures/document-knowledge-schema';
import { generateGraphName } from '../setup/name-generator';

// Generate a unique graph name for this test
const DOCUMENT_KNOWLEDGE_GRAPH = generateGraphName('doc_knowledge');

// Test data for documents, sections, summaries, concepts, and topics
const testData = {
  vertices: {
    Document: [
      {
        id: 'doc1',
        title: 'Introduction to Graph Databases',
        author: 'Jane Smith',
        publishDate: '2023-01-15',
        language: 'en',
        category: 'Technology',
        tags: ['database', 'graph', 'nosql'],
        url: 'https://example.com/intro-graph-db'
      },
      {
        id: 'doc2',
        title: 'Advanced Graph Query Techniques',
        author: 'John Doe',
        publishDate: '2023-03-20',
        language: 'en',
        category: 'Technology',
        tags: ['database', 'graph', 'query', 'advanced'],
        url: 'https://example.com/advanced-graph-queries'
      }
    ],
    Section: [
      {
        id: 'sec1',
        title: 'What are Graph Databases?',
        content: 'Graph databases are NoSQL databases that use graph structures with nodes, edges, and properties to represent and store data.',
        position: 1,
        level: 1,
        wordCount: 20,
        documentId: 'doc1'
      },
      {
        id: 'sec2',
        title: 'Benefits of Graph Databases',
        content: 'Graph databases excel at managing highly connected data and complex queries. They provide superior performance for relationship-intensive operations.',
        position: 2,
        level: 1,
        wordCount: 25,
        documentId: 'doc1'
      },
      {
        id: 'sec3',
        title: 'Use Cases',
        content: 'Common use cases include social networks, recommendation engines, fraud detection, and knowledge graphs.',
        position: 3,
        level: 1,
        wordCount: 15,
        documentId: 'doc1'
      },
      {
        id: 'sec4',
        title: 'Path Finding Algorithms',
        content: 'Advanced path finding algorithms like Dijkstra and A* can be used to find optimal paths in a graph.',
        position: 1,
        level: 1,
        wordCount: 18,
        documentId: 'doc2'
      },
      {
        id: 'sec5',
        title: 'Pattern Matching',
        content: 'Pattern matching in graph queries allows for complex structural pattern recognition within the graph data.',
        position: 2,
        level: 1,
        wordCount: 16,
        documentId: 'doc2'
      }
    ],
    Summary: [
      {
        id: 'sum1',
        content: 'Graph databases store data in nodes and edges, optimized for relationship queries.',
        type: 'abstract',
        wordCount: 12,
        generatedBy: 'ai',
        confidence: 0.92,
        sectionId: 'sec1'
      },
      {
        id: 'sum2',
        content: 'Graph databases provide better performance for connected data and relationship-intensive operations.',
        type: 'key_points',
        wordCount: 14,
        generatedBy: 'ai',
        confidence: 0.88,
        sectionId: 'sec2'
      },
      {
        id: 'sum3',
        content: 'Graph databases are ideal for social networks, recommendations, fraud detection, and knowledge graphs.',
        type: 'key_points',
        wordCount: 15,
        generatedBy: 'ai',
        confidence: 0.90,
        sectionId: 'sec3'
      }
    ],
    Concept: [
      {
        id: 'con1',
        name: 'Graph Database',
        description: 'A database that uses graph structures for semantic queries with nodes, edges, and properties.',
        aliases: ['Graph DB', 'Graph-Oriented Database'],
        importance: 0.95
      },
      {
        id: 'con2',
        name: 'NoSQL',
        description: 'Database systems that store data in ways other than tabular relations used in relational databases.',
        aliases: ['Non-SQL', 'Not Only SQL'],
        importance: 0.85
      },
      {
        id: 'con3',
        name: 'Cypher Query Language',
        description: 'A declarative graph query language for the Neo4j graph database.',
        aliases: ['Cypher'],
        importance: 0.80
      },
      {
        id: 'con4',
        name: 'Knowledge Graph',
        description: 'A knowledge base that uses a graph-structured data model to integrate data.',
        aliases: ['Semantic Network'],
        importance: 0.90
      }
    ],
    Topic: [
      {
        id: 'top1',
        name: 'Database Systems',
        description: 'Systems designed to store, manage, and retrieve structured data.',
        category: 'Computer Science'
      },
      {
        id: 'top2',
        name: 'Graph Theory',
        description: 'The study of graphs, which are mathematical structures used to model pairwise relations between objects.',
        category: 'Mathematics'
      },
      {
        id: 'top3',
        name: 'Data Management',
        description: 'The practice of collecting, keeping, and using data securely, efficiently, and cost-effectively.',
        category: 'Information Technology'
      }
    ]
  },
  edges: {
    CONTAINS: [
      { from: 'doc1', to: 'sec1', section_order: 1 },
      { from: 'doc1', to: 'sec2', section_order: 2 },
      { from: 'doc1', to: 'sec3', section_order: 3 },
      { from: 'doc2', to: 'sec4', section_order: 1 },
      { from: 'doc2', to: 'sec5', section_order: 2 }
    ],
    SUMMARIZES: [
      { from: 'sum1', to: 'sec1', quality: 0.92, createdAt: '2023-01-16' },
      { from: 'sum2', to: 'sec2', quality: 0.88, createdAt: '2023-01-16' },
      { from: 'sum3', to: 'sec3', quality: 0.90, createdAt: '2023-01-16' }
    ],
    RELATES_TO: [
      { from: 'sec1', to: 'con1', relevance: 0.95, context: 'definition', mentionCount: 3 },
      { from: 'sec1', to: 'con2', relevance: 0.80, context: 'category', mentionCount: 1 },
      { from: 'sec2', to: 'con1', relevance: 0.85, context: 'benefits', mentionCount: 2 },
      { from: 'sec3', to: 'con4', relevance: 0.90, context: 'use case', mentionCount: 1 },
      { from: 'sec4', to: 'con1', relevance: 0.75, context: 'application', mentionCount: 1 },
      { from: 'sec5', to: 'con3', relevance: 0.85, context: 'technique', mentionCount: 2 },
      { from: 'sum1', to: 'con1', relevance: 0.90, context: 'summary', mentionCount: 1 },
      { from: 'sum3', to: 'con4', relevance: 0.85, context: 'summary', mentionCount: 1 }
    ],
    BELONGS_TO: [
      { from: 'con1', to: 'top1', confidence: 0.95, primary: true },
      { from: 'con1', to: 'top2', confidence: 0.70, primary: false },
      { from: 'con2', to: 'top1', confidence: 0.90, primary: true },
      { from: 'con3', to: 'top1', confidence: 0.85, primary: true },
      { from: 'con4', to: 'top3', confidence: 0.80, primary: true },
      { from: 'con4', to: 'top2', confidence: 0.65, primary: false }
    ],
    REFERENCES: [
      { from: 'sec2', to: 'sec1', context: 'builds upon', page: 1 },
      { from: 'sec3', to: 'sec2', context: 'applies concepts from', page: 2 },
      { from: 'sec5', to: 'sec4', context: 'related technique', page: 1 }
    ],
    SIMILAR_TO: [
      { from: 'con1', to: 'con4', similarity: 0.75, method: 'semantic' },
      { from: 'sec1', to: 'sec4', similarity: 0.65, method: 'content' },
      { from: 'doc1', to: 'doc2', similarity: 0.80, method: 'topic' }
    ]
  }
};

describe('Document Knowledge Graph Integration', () => {
  let ageAvailable = false;
  let schemaLoader: SchemaLoader<typeof documentKnowledgeSchema>;

  // Before all tests, check if AGE is available and create the test graph
  beforeAll(async () => {
    // Check if AGE is available
    ageAvailable = await isAgeAvailable();

    if (!ageAvailable) {
      console.warn('Apache AGE is not available, skipping tests');
      return;
    }

    try {
      // Create the schema loader
      schemaLoader = new SchemaLoader<typeof documentKnowledgeSchema>(documentKnowledgeSchema, queryExecutor, {
        validateBeforeLoad: true,
        defaultGraphName: DOCUMENT_KNOWLEDGE_GRAPH,
        defaultBatchSize: 100
      });

      // Create the graph
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.create_graph('${DOCUMENT_KNOWLEDGE_GRAPH}');
      `);

      console.log(`Created test graph: ${DOCUMENT_KNOWLEDGE_GRAPH}`);

      // Load the test data
      const result = await schemaLoader.loadGraphData(testData, {
        graphName: DOCUMENT_KNOWLEDGE_GRAPH
      });

      console.log(`Loaded test data: ${result.vertexCount} vertices, ${result.edgeCount} edges`);

      // Check if there were any errors or warnings
      if (result.errors && result.errors.length > 0) {
        console.error('Errors during data loading:');
        result.errors.forEach(error => console.error(error));
      }

      if (result.warnings && result.warnings.length > 0) {
        console.warn('Warnings during data loading:');
        result.warnings.forEach(warning => console.warn(warning));
      }

      // Verify the graph was created and has data
      const verifyResult = await queryExecutor.executeCypher(`
        MATCH (n) RETURN count(n) AS count
      `, {}, DOCUMENT_KNOWLEDGE_GRAPH);

      console.log(`Verification query result: ${JSON.stringify(verifyResult.rows)}`);

      if (verifyResult.rows.length > 0) {
        console.log(`Graph contains ${verifyResult.rows[0].count} vertices`);
      } else {
        console.warn('No vertices found in the graph');
      }
    } catch (error) {
      console.error('Error setting up test:', error);
      throw error;
    }
  });

  // After all tests, drop the test graph
  afterAll(async () => {
    if (!ageAvailable) {
      return;
    }

    try {
      await queryExecutor.executeSQL(`
        SELECT * FROM ag_catalog.drop_graph('${DOCUMENT_KNOWLEDGE_GRAPH}', true);
      `);
      console.log(`Dropped test graph: ${DOCUMENT_KNOWLEDGE_GRAPH}`);
    } catch (error) {
      console.warn(`Warning: Could not drop test graph: ${error.message}`);
    }
  });

  // Test: Basic query to verify data was loaded
  it('should verify data was loaded correctly', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, DOCUMENT_KNOWLEDGE_GRAPH);

    // Query documents
    const docResult = await queryBuilder
      .match('Document', 'd')
      .done()
      .return('d.title AS title')
      .execute();

    expect(docResult.rows.length).toBe(2);

    // Query sections
    const secResult = await queryBuilder
      .match('Section', 's')
      .done()
      .return('s.title AS title')
      .execute();

    expect(secResult.rows.length).toBe(5);
  });

  // Test: Edge connection query - Find sections in a document
  it('should find sections in a document using edge connections', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, DOCUMENT_KNOWLEDGE_GRAPH);

    // Set parameter for document title
    await queryBuilder.setParam('docTitle', 'Introduction to Graph Databases');

    // Query sections in a document using edge connections
    const result = await queryBuilder
      .withAgeParam('docTitle', 'params') // params will hold the document title
      .match('Document', 'd') // Match a document 'd'
      .outgoing('CONTAINS', 'c', 'Section', 's') // Find sections 's' it contains
      .done() // Done with the MATCH clause, back to IQueryBuilder
      .where('d.title = params') // Filter where the document d's title is the one we set in params
      .return('d.title AS document', 's.title AS section', 's.position AS section_order')
      .orderBy('s.position', OrderDirection.ASC)
      .execute();

    // Verify results
    expect(result.rows.length).toBe(3); // Document 'doc1' has 3 sections
    expect(JSON.parse(result.rows[0].section)).toBe('What are Graph Databases?');
    // The order of sections may vary, so we don't check specific indices
  });

  // Test: Aggregation query - Count concepts by topic
  it.skip('should count concepts by topic using aggregation', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, DOCUMENT_KNOWLEDGE_GRAPH);

    // Query to count concepts by topic
    const result = await queryBuilder
      .matchCypher('(c:Concept)-[b:BELONGS_TO]->(t:Topic)')
      .return('t.name AS topic', 'count(c) AS concept_count')
      .orderBy('concept_count', OrderDirection.DESC)
      .execute();

    // Verify results
    expect(result.rows.length).toBe(3);

    // Parse the results
    const parsedResults = result.rows.map(row => ({
      topic: JSON.parse(row.topic),
      conceptCount: parseInt(row.concept_count)
    }));

    // Find the Database Systems topic
    const dbSystemsTopic = parsedResults.find(r => r.topic === 'Database Systems');
    expect(dbSystemsTopic).toBeDefined();
    expect(dbSystemsTopic?.conceptCount).toBe(3);
  });

  // Test: Path traversal - Find summaries related to specific concepts
  it('should find summaries related to specific concepts using path traversal', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, DOCUMENT_KNOWLEDGE_GRAPH);

    // Set parameter for concept name
    await queryBuilder.setParam('conceptName', 'Graph Database');

    // Query to find summaries related to a specific concept
    const result = await queryBuilder
      .withAgeParam('conceptName', 'params')
      .match('Summary', 's') // Start match from Summary
      .outgoing('RELATES_TO', 'r1', 'Concept', 'c1') // (s:Summary)-[r1:RELATES_TO]->(c1:Concept)
      .done() // Done with the MATCH clause
      .where('c1.name = params') // Filter where the concept c1's name is the one from params
      .return('c1.name AS concept', 's.content AS summary', 'r1.relevance AS relevance')
      .orderBy('r1.relevance', OrderDirection.DESC)
      .execute();

    // Verify results
    expect(result.rows.length).toBe(1); // Test data has one summary ('sum1') related to 'con1' ('Graph Database')
    expect(JSON.parse(result.rows[0].concept)).toBe('Graph Database');
    expect(JSON.parse(result.rows[0].summary)).toContain('Graph databases store data in nodes and edges');
  });

  // Test: Advanced filtering - Find high-relevance relationships
  it('should find high-relevance relationships using advanced filtering', async () => {
    if (!ageAvailable) {
      console.warn('Skipping test: AGE not available');
      return;
    }

    // Create a query builder
    const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, DOCUMENT_KNOWLEDGE_GRAPH);

    // Set parameters for relevance threshold
    await queryBuilder.setParam('relevanceThreshold', 0.9);

    // Query to find high-relevance relationships
    const result = await queryBuilder
      .withAgeParam('relevanceThreshold', 'params')
      .match('Section', 's')
      .outgoing('RELATES_TO', 'r', 'Concept', 'c')
      .done()
      .where('r.relevance >= params') // params is relevanceThreshold (0.9)
      .return('s.title AS section', 'c.name AS concept', 'r.relevance AS relevance', 'r.context AS context')
      .orderBy('r.relevance', OrderDirection.DESC)
      .execute();

    // Verify results
    expect(result.rows.length).toBe(2);

    // Parse the results
    const parsedResults = result.rows.map(row => ({
      section: JSON.parse(row.section),
      concept: JSON.parse(row.concept),
      relevance: parseFloat(JSON.parse(row.relevance)),
      context: JSON.parse(row.context)
    }));

    // Check that all relevance values are >= 0.9
    parsedResults.forEach(row => {
      expect(row.relevance).toBeGreaterThanOrEqual(0.9);
    });
  });
});
