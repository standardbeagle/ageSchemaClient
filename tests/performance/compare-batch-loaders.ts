/**
 * Performance comparison between original and optimized BatchLoader implementations
 * 
 * This script compares the performance of the original and optimized BatchLoader
 * implementations with various dataset sizes and configurations.
 */

import { performance } from 'perf_hooks';
import { createBatchLoader } from '../../src/loader/batch-loader-impl';
import { createOptimizedBatchLoader } from '../../src/loader/optimized-batch-loader';
import { BatchLoader, GraphData, LoadOptions } from '../../src/loader/batch-loader';
import { QueryExecutor } from '../../src/db/query';
import { PgConnectionManager } from '../../src/db/pg-connection-manager';
import { generatePerformanceTestData, performanceTestSchema } from './data-generator';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

/**
 * Performance comparison result
 */
export interface PerformanceComparisonResult {
  testName: string;
  datasetSize: {
    vertices: number;
    edges: number;
  };
  batchSize: number;
  original: {
    loadTime: number; // in milliseconds
    verticesPerSecond: number;
    edgesPerSecond: number;
    memoryUsage: {
      rss: number; // in bytes
      heapTotal: number; // in bytes
      heapUsed: number; // in bytes
      external: number; // in bytes
    };
  };
  optimized: {
    loadTime: number; // in milliseconds
    verticesPerSecond: number;
    edgesPerSecond: number;
    memoryUsage: {
      rss: number; // in bytes
      heapTotal: number; // in bytes
      heapUsed: number; // in bytes
      external: number; // in bytes
    };
  };
  improvement: {
    loadTime: number; // percentage
    verticesPerSecond: number; // percentage
    edgesPerSecond: number; // percentage
    memoryUsage: number; // percentage
  };
  options: Record<string, any>;
}

/**
 * Performance test configuration
 */
export interface PerformanceComparisonConfig {
  testName: string;
  personCount: number;
  companyCount: number;
  productCount: number;
  locationCount: number;
  knowsEdgeDensity: number;
  worksAtEdgesPerPerson: number;
  sellsEdgesPerCompany: number;
  buysEdgesPerPerson: number;
  locatedAtEdgesPerCompany: number;
  livesAtEdgesPerPerson: number;
  batchSize: number;
  graphName: string;
  validateBeforeLoad: boolean;
  continueOnError: boolean;
  transactionTimeout: number;
  debug: boolean;
}

/**
 * Default performance comparison configurations
 */
export const defaultComparisonConfigs: PerformanceComparisonConfig[] = [
  // Small dataset
  {
    testName: 'Small Dataset',
    personCount: 100,
    companyCount: 10,
    productCount: 50,
    locationCount: 20,
    knowsEdgeDensity: 0.05,
    worksAtEdgesPerPerson: 1,
    sellsEdgesPerCompany: 5,
    buysEdgesPerPerson: 3,
    locatedAtEdgesPerCompany: 2,
    livesAtEdgesPerPerson: 1,
    batchSize: 100,
    graphName: 'perf_test_small',
    validateBeforeLoad: true,
    continueOnError: false,
    transactionTimeout: 60000,
    debug: false
  },
  // Medium dataset
  {
    testName: 'Medium Dataset',
    personCount: 1000,
    companyCount: 100,
    productCount: 500,
    locationCount: 200,
    knowsEdgeDensity: 0.01,
    worksAtEdgesPerPerson: 1,
    sellsEdgesPerCompany: 5,
    buysEdgesPerPerson: 3,
    locatedAtEdgesPerCompany: 2,
    livesAtEdgesPerPerson: 1,
    batchSize: 500,
    graphName: 'perf_test_medium',
    validateBeforeLoad: true,
    continueOnError: false,
    transactionTimeout: 120000,
    debug: false
  },
  // Batch size comparison - small batch
  {
    testName: 'Small Batch Size',
    personCount: 500,
    companyCount: 50,
    productCount: 200,
    locationCount: 100,
    knowsEdgeDensity: 0.01,
    worksAtEdgesPerPerson: 1,
    sellsEdgesPerCompany: 5,
    buysEdgesPerPerson: 3,
    locatedAtEdgesPerCompany: 2,
    livesAtEdgesPerPerson: 1,
    batchSize: 50,
    graphName: 'perf_test_batch_small',
    validateBeforeLoad: true,
    continueOnError: false,
    transactionTimeout: 120000,
    debug: false
  },
  // Batch size comparison - large batch
  {
    testName: 'Large Batch Size',
    personCount: 500,
    companyCount: 50,
    productCount: 200,
    locationCount: 100,
    knowsEdgeDensity: 0.01,
    worksAtEdgesPerPerson: 1,
    sellsEdgesPerCompany: 5,
    buysEdgesPerPerson: 3,
    locatedAtEdgesPerCompany: 2,
    livesAtEdgesPerPerson: 1,
    batchSize: 1000,
    graphName: 'perf_test_batch_large',
    validateBeforeLoad: true,
    continueOnError: false,
    transactionTimeout: 120000,
    debug: false
  }
];

/**
 * Run a performance comparison test with the given configuration
 * 
 * @param config - Performance comparison configuration
 * @param connectionManager - Connection manager
 * @returns Performance comparison result
 */
export async function runPerformanceComparison(
  config: PerformanceComparisonConfig,
  connectionManager: PgConnectionManager
): Promise<PerformanceComparisonResult> {
  console.log(`Running performance comparison: ${config.testName}`);
  
  // Create query executor
  const queryExecutor = new QueryExecutor(connectionManager);
  
  // Create batch loaders
  const originalBatchLoader = createBatchLoader(performanceTestSchema, queryExecutor, {
    defaultGraphName: config.graphName,
    validateBeforeLoad: config.validateBeforeLoad,
    defaultBatchSize: config.batchSize,
    schemaName: 'age_schema_client'
  });
  
  const optimizedBatchLoader = createOptimizedBatchLoader(performanceTestSchema, queryExecutor, {
    defaultGraphName: config.graphName,
    validateBeforeLoad: config.validateBeforeLoad,
    defaultBatchSize: config.batchSize,
    schemaName: 'age_schema_client'
  });
  
  // Generate test data
  console.log('Generating test data...');
  const graphData = generatePerformanceTestData({
    personCount: config.personCount,
    companyCount: config.companyCount,
    productCount: config.productCount,
    locationCount: config.locationCount,
    knowsEdgeDensity: config.knowsEdgeDensity,
    worksAtEdgesPerPerson: config.worksAtEdgesPerPerson,
    sellsEdgesPerCompany: config.sellsEdgesPerCompany,
    buysEdgesPerPerson: config.buysEdgesPerPerson,
    locatedAtEdgesPerCompany: config.locatedAtEdgesPerCompany,
    livesAtEdgesPerPerson: config.livesAtEdgesPerPerson
  });
  
  // Count vertices and edges
  const vertexCount = Object.values(graphData.vertices).reduce((sum, vertices) => sum + vertices.length, 0);
  const edgeCount = Object.values(graphData.edges).reduce((sum, edges) => sum + edges.length, 0);
  
  console.log(`Generated ${vertexCount} vertices and ${edgeCount} edges`);
  
  // Prepare load options
  const loadOptions: LoadOptions = {
    graphName: config.graphName,
    batchSize: config.batchSize,
    validateBeforeLoad: config.validateBeforeLoad,
    continueOnError: config.continueOnError,
    transactionTimeout: config.transactionTimeout,
    debug: config.debug
  };
  
  // Test original batch loader
  console.log('Testing original batch loader...');
  
  // Create test graph for original batch loader
  const originalGraphName = `${config.graphName}_original`;
  await createTestGraph(connectionManager, originalGraphName);
  
  // Measure memory usage before loading
  const originalMemoryBefore = process.memoryUsage();
  
  // Measure load time
  const originalStartTime = performance.now();
  const originalResult = await originalBatchLoader.loadGraphData(
    graphData,
    { ...loadOptions, graphName: originalGraphName }
  );
  const originalEndTime = performance.now();
  const originalLoadTime = originalEndTime - originalStartTime;
  
  // Measure memory usage after loading
  const originalMemoryAfter = process.memoryUsage();
  
  console.log(`Original: Loaded ${originalResult.vertexCount} vertices and ${originalResult.edgeCount} edges in ${originalLoadTime.toFixed(2)} ms`);
  
  // Calculate performance metrics
  const originalVerticesPerSecond = originalResult.vertexCount / (originalLoadTime / 1000);
  const originalEdgesPerSecond = originalResult.edgeCount / (originalLoadTime / 1000);
  
  console.log(`Original Performance: ${originalVerticesPerSecond.toFixed(2)} vertices/sec, ${originalEdgesPerSecond.toFixed(2)} edges/sec`);
  
  // Calculate memory usage
  const originalMemoryUsage = {
    rss: originalMemoryAfter.rss - originalMemoryBefore.rss,
    heapTotal: originalMemoryAfter.heapTotal - originalMemoryBefore.heapTotal,
    heapUsed: originalMemoryAfter.heapUsed - originalMemoryBefore.heapUsed,
    external: originalMemoryAfter.external - originalMemoryBefore.external
  };
  
  console.log(`Original Memory Usage: RSS: ${(originalMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(originalMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // Test optimized batch loader
  console.log('Testing optimized batch loader...');
  
  // Create test graph for optimized batch loader
  const optimizedGraphName = `${config.graphName}_optimized`;
  await createTestGraph(connectionManager, optimizedGraphName);
  
  // Measure memory usage before loading
  const optimizedMemoryBefore = process.memoryUsage();
  
  // Measure load time
  const optimizedStartTime = performance.now();
  const optimizedResult = await optimizedBatchLoader.loadGraphData(
    graphData,
    { ...loadOptions, graphName: optimizedGraphName }
  );
  const optimizedEndTime = performance.now();
  const optimizedLoadTime = optimizedEndTime - optimizedStartTime;
  
  // Measure memory usage after loading
  const optimizedMemoryAfter = process.memoryUsage();
  
  console.log(`Optimized: Loaded ${optimizedResult.vertexCount} vertices and ${optimizedResult.edgeCount} edges in ${optimizedLoadTime.toFixed(2)} ms`);
  
  // Calculate performance metrics
  const optimizedVerticesPerSecond = optimizedResult.vertexCount / (optimizedLoadTime / 1000);
  const optimizedEdgesPerSecond = optimizedResult.edgeCount / (optimizedLoadTime / 1000);
  
  console.log(`Optimized Performance: ${optimizedVerticesPerSecond.toFixed(2)} vertices/sec, ${optimizedEdgesPerSecond.toFixed(2)} edges/sec`);
  
  // Calculate memory usage
  const optimizedMemoryUsage = {
    rss: optimizedMemoryAfter.rss - optimizedMemoryBefore.rss,
    heapTotal: optimizedMemoryAfter.heapTotal - optimizedMemoryBefore.heapTotal,
    heapUsed: optimizedMemoryAfter.heapUsed - optimizedMemoryBefore.heapUsed,
    external: optimizedMemoryAfter.external - optimizedMemoryBefore.external
  };
  
  console.log(`Optimized Memory Usage: RSS: ${(optimizedMemoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(optimizedMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // Calculate improvement
  const loadTimeImprovement = ((originalLoadTime - optimizedLoadTime) / originalLoadTime) * 100;
  const verticesPerSecondImprovement = ((optimizedVerticesPerSecond - originalVerticesPerSecond) / originalVerticesPerSecond) * 100;
  const edgesPerSecondImprovement = ((optimizedEdgesPerSecond - originalEdgesPerSecond) / originalEdgesPerSecond) * 100;
  const memoryUsageImprovement = ((originalMemoryUsage.heapUsed - optimizedMemoryUsage.heapUsed) / originalMemoryUsage.heapUsed) * 100;
  
  console.log(`Improvement: Load Time: ${loadTimeImprovement.toFixed(2)}%, Vertices/sec: ${verticesPerSecondImprovement.toFixed(2)}%, Edges/sec: ${edgesPerSecondImprovement.toFixed(2)}%, Memory: ${memoryUsageImprovement.toFixed(2)}%`);
  
  // Clean up test graphs
  await dropTestGraph(connectionManager, originalGraphName);
  await dropTestGraph(connectionManager, optimizedGraphName);
  
  // Return performance comparison result
  return {
    testName: config.testName,
    datasetSize: {
      vertices: vertexCount,
      edges: edgeCount
    },
    batchSize: config.batchSize,
    original: {
      loadTime: originalLoadTime,
      verticesPerSecond: originalVerticesPerSecond,
      edgesPerSecond: originalEdgesPerSecond,
      memoryUsage: originalMemoryUsage
    },
    optimized: {
      loadTime: optimizedLoadTime,
      verticesPerSecond: optimizedVerticesPerSecond,
      edgesPerSecond: optimizedEdgesPerSecond,
      memoryUsage: optimizedMemoryUsage
    },
    improvement: {
      loadTime: loadTimeImprovement,
      verticesPerSecond: verticesPerSecondImprovement,
      edgesPerSecond: edgesPerSecondImprovement,
      memoryUsage: memoryUsageImprovement
    },
    options: {
      validateBeforeLoad: config.validateBeforeLoad,
      continueOnError: config.continueOnError,
      transactionTimeout: config.transactionTimeout,
      debug: config.debug
    }
  };
}

/**
 * Create a test graph
 * 
 * @param connectionManager - Connection manager
 * @param graphName - Graph name
 */
async function createTestGraph(connectionManager: PgConnectionManager, graphName: string): Promise<void> {
  const connection = await connectionManager.getConnection();
  try {
    // Drop the graph if it exists
    try {
      await connection.query(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }
    
    // Create the graph
    await connection.query(`SELECT * FROM ag_catalog.create_graph('${graphName}')`);
  } finally {
    await connectionManager.releaseConnection(connection);
  }
}

/**
 * Drop a test graph
 * 
 * @param connectionManager - Connection manager
 * @param graphName - Graph name
 */
async function dropTestGraph(connectionManager: PgConnectionManager, graphName: string): Promise<void> {
  const connection = await connectionManager.getConnection();
  try {
    // Drop the graph
    try {
      await connection.query(`SELECT * FROM ag_catalog.drop_graph('${graphName}', true)`);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }
  } finally {
    await connectionManager.releaseConnection(connection);
  }
}

/**
 * Run all performance comparison tests
 * 
 * @param configs - Performance comparison configurations
 * @param outputFile - Output file for test results
 * @returns Performance comparison results
 */
export async function runAllPerformanceComparisons(
  configs: PerformanceComparisonConfig[] = defaultComparisonConfigs,
  outputFile?: string
): Promise<PerformanceComparisonResult[]> {
  console.log('Running all performance comparison tests...');
  
  // Create connection manager
  const connectionManager = new PgConnectionManager({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'age-integration',
    user: process.env.PGUSER || 'age',
    password: process.env.PGPASSWORD || 'agepassword',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // PostgreSQL-specific options
    pgOptions: {
      // Ensure ag_catalog is in the search path for Apache AGE
      searchPath: 'ag_catalog, "$user", public',
      applicationName: 'ageSchemaClient-performance-comparison',
    },
  });
  
  const results: PerformanceComparisonResult[] = [];
  
  try {
    // Run each test
    for (const config of configs) {
      try {
        const result = await runPerformanceComparison(config, connectionManager);
        results.push(result);
      } catch (error) {
        console.error(`Error running test ${config.testName}:`, error);
      }
    }
    
    // Write results to file if specified
    if (outputFile) {
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log(`Performance comparison results written to ${outputFile}`);
    }
    
    return results;
  } finally {
    // Close connection pool
    await connectionManager.end();
  }
}
