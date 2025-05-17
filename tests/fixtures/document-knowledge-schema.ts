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
      },
      required: ['id', 'title']
    },
    Section: {
      properties: {
        id: { type: 'string', required: true },
        title: { type: 'string' },
        content: { type: 'string', required: true },
        position: { type: 'number' },
        level: { type: 'number' },
        wordCount: { type: 'number' },
        documentId: { type: 'string', required: true }
      },
      required: ['id', 'content', 'documentId']
    },
    Summary: {
      properties: {
        id: { type: 'string', required: true },
        content: { type: 'string', required: true },
        type: { type: 'string' }, // e.g., 'abstract', 'key_points', 'conclusion'
        wordCount: { type: 'number' },
        generatedBy: { type: 'string' }, // e.g., 'human', 'ai', 'hybrid'
        confidence: { type: 'number' }, // 0-1 score for AI-generated summaries
        sectionId: { type: 'string', required: true }
      },
      required: ['id', 'content', 'sectionId']
    },
    Concept: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        aliases: { type: 'array' },
        externalId: { type: 'string' }, // e.g., Wikidata ID
        importance: { type: 'number' } // 0-1 score
      },
      required: ['id', 'name']
    },
    Topic: {
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string' },
        broader: { type: 'array' }, // Array of broader topic IDs
        narrower: { type: 'array' }, // Array of narrower topic IDs
        category: { type: 'string' }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    CONTAINS: {
      properties: {
        section_order: { type: 'number' } // Position of the section within the document
      },
      from: ['Document'],
      to: ['Section']
    },
    SUMMARIZES: {
      properties: {
        quality: { type: 'number' }, // 0-1 score for summary quality
        createdAt: { type: 'string' }
      },
      from: ['Summary'],
      to: ['Section']
    },
    RELATES_TO: {
      properties: {
        relevance: { type: 'number' }, // 0-1 score for relevance
        context: { type: 'string' }, // How the concept relates to the section/summary
        mentionCount: { type: 'number' } // Number of mentions
      },
      from: ['Section', 'Summary'],
      to: ['Concept']
    },
    BELONGS_TO: {
      properties: {
        confidence: { type: 'number' }, // 0-1 score for confidence
        primary: { type: 'boolean' } // Whether this is the primary topic
      },
      from: ['Concept'],
      to: ['Topic']
    },
    REFERENCES: {
      properties: {
        context: { type: 'string' },
        page: { type: 'number' }
      },
      from: ['Section'],
      to: ['Section']
    },
    SIMILAR_TO: {
      properties: {
        similarity: { type: 'number' }, // 0-1 score for similarity
        method: { type: 'string' } // e.g., 'semantic', 'citation', 'co-occurrence'
      },
      from: ['Concept', 'Section', 'Document'],
      to: ['Concept', 'Section', 'Document']
    }
  }
};

// Export the schema for use in tests
export default documentKnowledgeSchema;
