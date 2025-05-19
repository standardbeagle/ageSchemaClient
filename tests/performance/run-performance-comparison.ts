/**
 * Script to run performance comparison tests
 * 
 * This script runs performance comparison tests between the original and optimized
 * BatchLoader implementations with various dataset sizes and configurations.
 */

import { runAllPerformanceComparisons, defaultComparisonConfigs } from './compare-batch-loaders';
import * as path from 'path';

// Output file for test results
const outputFile = path.join(__dirname, '../../reports/performance-comparison-results.json');

// Run all performance comparison tests
runAllPerformanceComparisons(defaultComparisonConfigs, outputFile)
  .then(() => {
    console.log('All performance comparison tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running performance comparison tests:', error);
    process.exit(1);
  });
