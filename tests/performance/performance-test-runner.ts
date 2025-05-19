/**
 * Performance test runner for BatchLoader
 * 
 * This module provides functions for running performance tests on the BatchLoader
 * implementation with various dataset sizes and configurations.
 */

import { performance } from 'perf_hooks';
import { createBatchLoader } from '../../src/loader/batch-loader-impl';
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
 * Performance test result
 */
export interface PerformanceTestResult {
  testName: string;
  datasetSize: {
    vertices: number;
    edges: number;
  };
  batchSize: number;
  loadTime: number; // in milliseconds
  verticesPerSecond: number;
  edgesPerSecond: number;
  memoryUsage: {
    rss: number; // in bytes
    heapTotal: number; // in bytes
    heapUsed: number; // in bytes
    external: number; // in bytes
  };
  options: Record<string, any>;
}

/**
 * Performance test configuration
 */
export interface PerformanceTestConfig {
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
 * Default performance test configurations
 */
export const defaultTestConfigs: PerformanceTestConfig[] = [
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
  // Large dataset
  {
    testName: 'Large Dataset',
    personCount: 5000,
    companyCount: 500,
    productCount: 2000,
    locationCount: 1000,
    knowsEdgeDensity: 0.001,
    worksAtEdgesPerPerson: 1,
    sellsEdgesPerCompany: 5,
    buysEdgesPerPerson: 3,
    locatedAtEdgesPerCompany: 2,
    livesAtEdgesPerPerson: 1,
    batchSize: 1000,
    graphName: 'perf_test_large',
    validateBeforeLoad: true,
    continueOnError: false,
    transactionTimeout: 300000,
    debug: false
  },
  // Batch size comparison - small batch
  {
    testName: 'Small Batch Size',
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
    batchSize: 2000,
    graphName: 'perf_test_batch_large',
    validateBeforeLoad: true,
    continueOnError: false,
    transactionTimeout: 120000,
    debug: false
  }
];

/**
 * Run a performance test with the given configuration
 * 
 * @param config - Performance test configuration
 * @param connectionManager - Connection manager
 * @returns Performance test result
 */
export async function runPerformanceTest(
  config: PerformanceTestConfig,
  connectionManager: PgConnectionManager
): Promise<PerformanceTestResult> {
  console.log(`Running performance test: ${config.testName}`);
  
  // Create query executor
  const queryExecutor = new QueryExecutor(connectionManager);
  
  // Create batch loader
  const batchLoader = createBatchLoader(performanceTestSchema, queryExecutor, {
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
  
  // Create test graph
  console.log(`Creating test graph: ${config.graphName}`);
  const connection = await connectionManager.getConnection();
  try {
    // Drop the graph if it exists
    try {
      await connection.query(`SELECT * FROM ag_catalog.drop_graph('${config.graphName}', true)`);
    } catch (error) {
      // Ignore error if graph doesn't exist
    }
    
    // Create the graph
    await connection.query(`SELECT * FROM ag_catalog.create_graph('${config.graphName}')`);
  } finally {
    await connectionManager.releaseConnection(connection);
  }
  
  // Prepare load options
  const loadOptions: LoadOptions = {
    graphName: config.graphName,
    batchSize: config.batchSize,
    validateBeforeLoad: config.validateBeforeLoad,
    continueOnError: config.continueOnError,
    transactionTimeout: config.transactionTimeout,
    debug: config.debug,
    onProgress: config.debug ? (progress) => {
      console.log(`Progress: ${progress.phase} ${progress.type} - ${progress.processed}/${progress.total} (${progress.percentage.toFixed(2)}%)`);
    } : undefined
  };
  
  // Measure memory usage before loading
  const memoryBefore = process.memoryUsage();
  
  // Measure load time
  console.log('Loading graph data...');
  const startTime = performance.now();
  const result = await batchLoader.loadGraphData(graphData, loadOptions);
  const endTime = performance.now();
  const loadTime = endTime - startTime;
  
  // Measure memory usage after loading
  const memoryAfter = process.memoryUsage();
  
  console.log(`Loaded ${result.vertexCount} vertices and ${result.edgeCount} edges in ${loadTime.toFixed(2)} ms`);
  
  // Calculate performance metrics
  const verticesPerSecond = result.vertexCount / (loadTime / 1000);
  const edgesPerSecond = result.edgeCount / (loadTime / 1000);
  
  console.log(`Performance: ${verticesPerSecond.toFixed(2)} vertices/sec, ${edgesPerSecond.toFixed(2)} edges/sec`);
  
  // Calculate memory usage
  const memoryUsage = {
    rss: memoryAfter.rss - memoryBefore.rss,
    heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
    heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
    external: memoryAfter.external - memoryBefore.external
  };
  
  console.log(`Memory usage: RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // Return performance test result
  return {
    testName: config.testName,
    datasetSize: {
      vertices: vertexCount,
      edges: edgeCount
    },
    batchSize: config.batchSize,
    loadTime,
    verticesPerSecond,
    edgesPerSecond,
    memoryUsage,
    options: {
      validateBeforeLoad: config.validateBeforeLoad,
      continueOnError: config.continueOnError,
      transactionTimeout: config.transactionTimeout,
      debug: config.debug
    }
  };
}

/**
 * Run all performance tests
 * 
 * @param configs - Performance test configurations
 * @param outputFile - Output file for test results
 * @returns Performance test results
 */
export async function runAllPerformanceTests(
  configs: PerformanceTestConfig[] = defaultTestConfigs,
  outputFile?: string
): Promise<PerformanceTestResult[]> {
  console.log('Running all performance tests...');
  
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
      applicationName: 'ageSchemaClient-performance-test',
    },
  });
  
  const results: PerformanceTestResult[] = [];
  
  try {
    // Run each test
    for (const config of configs) {
      try {
        const result = await runPerformanceTest(config, connectionManager);
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
      console.log(`Performance test results written to ${outputFile}`);
    }
    
    return results;
  } finally {
    // Close connection pool
    await connectionManager.end();
  }
}
