/**
 * Movie schema fixture for testing the query builder
 * 
 * This schema defines the structure for the movie database used in query builder tests.
 */

import { SchemaDefinition, PropertyType } from '../../src/schema/types';

/**
 * Movie database schema for testing
 */
export const movieSchema: SchemaDefinition = {
  version: '1.0.0',
  vertices: {
    Movie: {
      properties: {
        id: { type: PropertyType.INTEGER },
        title: { type: PropertyType.STRING },
        year: { type: PropertyType.STRING },
        genre: { type: PropertyType.STRING },
        rating: { type: PropertyType.NUMBER },
        directorId: { type: PropertyType.INTEGER }
      },
      required: ['id', 'title']
    },
    Person: {
      properties: {
        id: { type: PropertyType.INTEGER },
        name: { type: PropertyType.STRING },
        born: { type: PropertyType.INTEGER }
      },
      required: ['id', 'name']
    }
  },
  edges: {
    DIRECTED: {
      properties: {},
      fromVertex: 'Person',
      toVertex: 'Movie'
    }
  },
  metadata: {
    description: 'Movie database schema for query builder integration tests'
  }
};

/**
 * Export the movie schema as default
 */
export default movieSchema;
