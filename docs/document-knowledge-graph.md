# Document Knowledge Graph Schema

This document describes the Document Knowledge Graph schema, which provides a structure for representing documents, their sections, summaries, and related knowledge graph concepts.

## Overview

The Document Knowledge Graph schema enables:

- Storing documents with hierarchical sections
- Attaching summaries to sections
- Connecting sections and summaries to concepts in a knowledge graph
- Organizing concepts into topics
- Creating complex relationships between all entities

This schema is particularly useful for applications that need to:

- Manage document content with semantic understanding
- Generate and store summaries of document sections
- Link document content to a knowledge base
- Perform advanced queries across documents and knowledge entities
- Analyze relationships between concepts and document content

## Schema Structure

### Vertices

The schema defines the following vertex types:

#### Document

Represents a complete document.

```typescript
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
}
```

#### Section

Represents a section within a document.

```typescript
Section: {
  properties: {
    id: { type: 'string', required: true },
    title: { type: 'string' },
    content: { type: 'string', required: true },
    order: { type: 'number' },
    level: { type: 'number' },
    wordCount: { type: 'number' },
    documentId: { type: 'string', required: true }
  },
  required: ['id', 'content', 'documentId']
}
```

#### Summary

Represents a summary of a section.

```typescript
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
}
```

#### Concept

Represents a concept in the knowledge graph.

```typescript
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
}
```

#### Topic

Represents a topic that groups related concepts.

```typescript
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
```

### Edges

The schema defines the following edge types:

#### CONTAINS

Connects a document to its sections.

```typescript
CONTAINS: {
  properties: {
    order: { type: 'number' } // Position of the section within the document
  },
  from: ['Document'],
  to: ['Section']
}
```

#### SUMMARIZES

Connects a summary to the section it summarizes.

```typescript
SUMMARIZES: {
  properties: {
    quality: { type: 'number' }, // 0-1 score for summary quality
    createdAt: { type: 'string' }
  },
  from: ['Summary'],
  to: ['Section']
}
```

#### RELATES_TO

Connects sections or summaries to concepts they mention or relate to.

```typescript
RELATES_TO: {
  properties: {
    relevance: { type: 'number' }, // 0-1 score for relevance
    context: { type: 'string' }, // How the concept relates to the section/summary
    mentionCount: { type: 'number' } // Number of mentions
  },
  from: ['Section', 'Summary'],
  to: ['Concept']
}
```

#### BELONGS_TO

Connects concepts to topics they belong to.

```typescript
BELONGS_TO: {
  properties: {
    confidence: { type: 'number' }, // 0-1 score for confidence
    primary: { type: 'boolean' } // Whether this is the primary topic
  },
  from: ['Concept'],
  to: ['Topic']
}
```

#### REFERENCES

Connects sections that reference other sections.

```typescript
REFERENCES: {
  properties: {
    context: { type: 'string' },
    page: { type: 'number' }
  },
  from: ['Section'],
  to: ['Section']
}
```

#### SIMILAR_TO

Connects similar entities (concepts, sections, or documents).

```typescript
SIMILAR_TO: {
  properties: {
    similarity: { type: 'number' }, // 0-1 score for similarity
    method: { type: 'string' } // e.g., 'semantic', 'citation', 'co-occurrence'
  },
  from: ['Concept', 'Section', 'Document'],
  to: ['Concept', 'Section', 'Document']
}
```

## Example Queries

### Find all sections in a document

```typescript
const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, graphName);

await queryBuilder.setParam('docTitle', 'Introduction to Graph Databases');

const result = await queryBuilder
  .withAgeParam('docTitle', 'params')
  .match('Document', 'd')
  .where('d.title = params')
  .edge('CONTAINS', 'c')
  .to('Section', 's')
  .done()
  .return('d.title AS document', 's.title AS section', 's.order AS order')
  .orderBy('s.order', OrderDirection.ASC)
  .execute();
```

### Count concepts by topic

```typescript
const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, graphName);

const result = await queryBuilder
  .match('Concept', 'c')
  .edge('BELONGS_TO', 'b')
  .to('Topic', 't')
  .done()
  .return('t.name AS topic', 'count(c) AS conceptCount')
  .orderBy('conceptCount', OrderDirection.DESC)
  .execute();
```

### Find summaries related to a specific concept

```typescript
const queryBuilder = new QueryBuilder(documentKnowledgeSchema, queryExecutor, graphName);

await queryBuilder.setParam('conceptName', 'Graph Database');

const result = await queryBuilder
  .withAgeParam('conceptName', 'params')
  .match('Concept', 'c')
  .where('c.name = params')
  .edge('RELATES_TO', 'r1', true) // Reverse direction
  .from('Summary', 's')
  .done()
  .return('c.name AS concept', 's.content AS summary', 'r1.relevance AS relevance')
  .orderBy('r1.relevance', OrderDirection.DESC)
  .execute();
```

## Usage

See the integration test `tests/integration/document-knowledge-graph.integration.test.ts` for a complete example of how to use this schema with the batch schema loader and query builder.
