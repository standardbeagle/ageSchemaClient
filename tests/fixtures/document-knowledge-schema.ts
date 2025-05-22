/**
 * Document and Knowledge Graph Schema
 *
 * This schema defines a document structure with sections and summaries,
 * coupled with a knowledge graph of concepts and topics.
 *
 * The schema allows for:
 * - Documents containing multiple sections
 * - Sections having summaries
 * - Sections and summaries relating to concepts
 * - Concepts belonging to topics
 * - Complex relationships between all entities
 */

import { SchemaDefinition } from '../../src/schema/types';

/**
 * Document and Knowledge Graph Schema
 */
export const documentKnowledgeSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Document: {
      label: 'Document',
      properties: {
        id: { type: 'string', required: true },
        title: { type: 'string', required: true },
        author: { type: 'string' },
        publishDate: { type: 'string' },
        language: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array' },
        url: { type: 'string' },
        sourceId: { type: 'string' }
      }
    },
    Section: {
      label: 'Section',
      properties: {
        id: { type: 'string', required: true },
        title: { type: 'string' },
        content: { type: 'string', required: true },
        position: { type: 'number' },
        level: { type: 'number' },
        wordCount: { type: 'number' },
        documentId: { type: 'string', required: true }
      }
    },
    Summary: {
      label: 'Summary',
      properties: {
        id: { type: 'string', required: true },
        content: { type: 'string', required: true },
        type: { type: 'string' }, // e.g., 'abstract', 'key_points', 'conclusion'
        wordCount: { type: 'number' },
        generatedBy: { type: 'string' }, // e.g., 'human', 'ai', 'hybrid'
        confidence: { type: 'number' }, // 0-1 score for AI-generated summaries
        sectionId: { type: 'string', required: true }
      }
    },
    Concept: {
      label: 'Concept',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        aliases: { type: 'array' },
        externalId: { type: 'string' }, // e.g., Wikidata ID
        importance: { type: 'number' } // 0-1 score
      }
    },
    Topic: {
      label: 'Topic',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        broader: { type: 'array' }, // Array of broader topic IDs
        narrower: { type: 'array' }, // Array of narrower topic IDs
        category: { type: 'string' }
      }
    }
  },
  edges: {
    CONTAINS: {
      label: 'CONTAINS',
      from: 'Document',
      to: 'Section',
      fromLabel: 'Document',
      toLabel: 'Section',
      fromVertex: 'Document',
      toVertex: 'Section',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        section_order: { type: 'number' } // Position of the section within the document
      }
    },
    SUMMARIZES: {
      label: 'SUMMARIZES',
      from: 'Summary',
      to: 'Section',
      fromLabel: 'Summary',
      toLabel: 'Section',
      fromVertex: 'Summary',
      toVertex: 'Section',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        quality: { type: 'number' }, // 0-1 score for summary quality
        createdAt: { type: 'string' }
      }
    },
    RELATES_TO: {
      label: 'RELATES_TO',
      from: 'Section',
      to: 'Concept',
      fromLabel: 'Section',
      toLabel: 'Concept',
      fromVertex: 'Section',
      toVertex: 'Concept',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        relevance: { type: 'number' }, // 0-1 score for relevance
        context: { type: 'string' }, // How the concept relates to the section/summary
        mentionCount: { type: 'number' } // Number of mentions
      }
    },
    SUMMARY_RELATES_TO: {
      label: 'SUMMARY_RELATES_TO',
      from: 'Summary',
      to: 'Concept',
      fromLabel: 'Summary',
      toLabel: 'Concept',
      fromVertex: 'Summary',
      toVertex: 'Concept',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        relevance: { type: 'number' }, // 0-1 score for relevance
        context: { type: 'string' }, // How the concept relates to the section/summary
        mentionCount: { type: 'number' } // Number of mentions
      }
    },
    BELONGS_TO: {
      label: 'BELONGS_TO',
      from: 'Concept',
      to: 'Topic',
      fromLabel: 'Concept',
      toLabel: 'Topic',
      fromVertex: 'Concept',
      toVertex: 'Topic',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        confidence: { type: 'number' }, // 0-1 score for confidence
        primary: { type: 'boolean' } // Whether this is the primary topic
      }
    },
    REFERENCES: {
      label: 'REFERENCES',
      from: 'Section',
      to: 'Section',
      fromLabel: 'Section',
      toLabel: 'Section',
      fromVertex: 'Section',
      toVertex: 'Section',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        context: { type: 'string' },
        page: { type: 'number' }
      }
    },
    SIMILAR_TO: {
      label: 'SIMILAR_TO',
      from: 'Concept',
      to: 'Concept',
      fromLabel: 'Concept',
      toLabel: 'Concept',
      fromVertex: 'Concept',
      toVertex: 'Concept',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        similarity: { type: 'number' }, // 0-1 score for similarity
        method: { type: 'string' } // e.g., 'semantic', 'citation', 'co-occurrence'
      }
    }
  }
};

// Export the schema for use in tests
export default documentKnowledgeSchema;
