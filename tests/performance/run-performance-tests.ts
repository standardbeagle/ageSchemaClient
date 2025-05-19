/**
 * Script to run performance tests for BatchLoader
 * 
 * This script runs performance tests on the BatchLoader implementation
 * with various dataset sizes and configurations.
 */

import { runAllPerformanceTests, defaultTestConfigs } from './performance-test-runner';
import * as path from 'path';

// Output file for test results
const outputFile = path.join(__dirname, '../../reports/performance-test-results.json');

// Run all performance tests
runAllPerformanceTests(defaultTestConfigs, outputFile)
  .then(() => {
    console.log('All performance tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running performance tests:', error);
    process.exit(1);
  });
