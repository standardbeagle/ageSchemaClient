/**
 * Data generator utilities for testing
 * 
 * This module provides utilities for generating test data for the SchemaLoader.
 */

/**
 * Generate a large dataset for performance testing
 * 
 * @param size - Number of vertices to generate
 * @returns Graph data with vertices and edges
 */
export function generateLargeDataset(size: number) {
  const vertices: Record<string, any[]> = {
    Person: []
  };
  
  const edges: Record<string, any[]> = {
    KNOWS: []
  };
  
  // Generate vertices
  for (let i = 0; i < size; i++) {
    vertices.Person.push({
      id: `p${i}`,
      name: `Person ${i}`,
      age: 20 + (i % 50)
    });
  }
  
  // Generate edges (each person knows ~5 other people)
  for (let i = 0; i < size; i++) {
    const fromId = `p${i}`;
    
    // Create edges to 5 random people
    for (let j = 0; j < 5; j++) {
      const toIndex = (i + j + 1) % size;
      const toId = `p${toIndex}`;
      
      edges.KNOWS.push({
        from: fromId,
        to: toId,
        since: 2020 + (i % 3)
      });
    }
  }
  
  return {
    vertex: vertices,
    edge: edges
  };
}

/**
 * Generate a dataset with specific vertex and edge types
 * 
 * @param config - Configuration for the dataset
 * @returns Graph data with vertices and edges
 */
export function generateDataset(config: {
  vertexTypes: Array<{
    type: string;
    count: number;
    properties: (index: number) => Record<string, any>;
  }>;
  edgeTypes: Array<{
    type: string;
    count: number;
    fromType: string;
    toType: string;
    properties: (index: number) => Record<string, any>;
  }>;
}) {
  const vertices: Record<string, any[]> = {};
  const edges: Record<string, any[]> = {};
  
  // Generate vertices
  for (const vertexType of config.vertexTypes) {
    vertices[vertexType.type] = [];
    
    for (let i = 0; i < vertexType.count; i++) {
      vertices[vertexType.type].push({
        id: `${vertexType.type.toLowerCase()}_${i}`,
        ...vertexType.properties(i)
      });
    }
  }
  
  // Generate edges
  for (const edgeType of config.edgeTypes) {
    edges[edgeType.type] = [];
    
    const fromVertices = vertices[edgeType.fromType] || [];
    const toVertices = vertices[edgeType.toType] || [];
    
    if (fromVertices.length === 0 || toVertices.length === 0) {
      continue;
    }
    
    for (let i = 0; i < edgeType.count; i++) {
      const fromIndex = i % fromVertices.length;
      const toIndex = (i + 1) % toVertices.length;
      
      edges[edgeType.type].push({
        from: fromVertices[fromIndex].id,
        to: toVertices[toIndex].id,
        ...edgeType.properties(i)
      });
    }
  }
  
  return {
    vertex: vertices,
    edge: edges
  };
}
