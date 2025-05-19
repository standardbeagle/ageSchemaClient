/**
 * Script to analyze performance test results
 * 
 * This script analyzes the results of performance tests on the BatchLoader
 * implementation and generates a report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PerformanceTestResult } from './performance-test-runner';

// Input file for test results
const inputFile = path.join(__dirname, '../../reports/performance-test-results.json');

// Output file for analysis report
const outputFile = path.join(__dirname, '../../reports/performance-analysis-report.md');

/**
 * Format a number with commas as thousands separators
 * 
 * @param num - Number to format
 * @returns Formatted number
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a file size in bytes to a human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } else {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
}

/**
 * Generate a performance analysis report
 * 
 * @param results - Performance test results
 * @returns Analysis report
 */
function generateAnalysisReport(results: PerformanceTestResult[]): string {
  // Sort results by dataset size
  results.sort((a, b) => {
    const aSize = a.datasetSize.vertices + a.datasetSize.edges;
    const bSize = b.datasetSize.vertices + b.datasetSize.edges;
    return aSize - bSize;
  });
  
  // Generate report
  let report = '# BatchLoader Performance Analysis Report\n\n';
  
  // Add summary
  report += '## Summary\n\n';
  report += 'This report presents the results of performance tests on the BatchLoader implementation.\n';
  report += 'The tests were run with various dataset sizes and configurations to measure the performance characteristics of the BatchLoader.\n\n';
  
  // Add test results table
  report += '## Test Results\n\n';
  report += '| Test Name | Vertices | Edges | Batch Size | Load Time (ms) | Vertices/sec | Edges/sec | Memory Usage |\n';
  report += '|-----------|----------|-------|------------|----------------|--------------|-----------|-------------|\n';
  
  for (const result of results) {
    report += `| ${result.testName} | ${formatNumber(result.datasetSize.vertices)} | ${formatNumber(result.datasetSize.edges)} | ${formatNumber(result.batchSize)} | ${formatNumber(Math.round(result.loadTime))} | ${formatNumber(Math.round(result.verticesPerSecond))} | ${formatNumber(Math.round(result.edgesPerSecond))} | ${formatFileSize(result.memoryUsage.heapUsed)} |\n`;
  }
  
  report += '\n';
  
  // Add batch size comparison
  const batchSizeTests = results.filter(r => r.testName.includes('Batch Size'));
  if (batchSizeTests.length > 0) {
    report += '## Batch Size Comparison\n\n';
    report += 'This section compares the performance of the BatchLoader with different batch sizes.\n\n';
    
    report += '| Batch Size | Load Time (ms) | Vertices/sec | Edges/sec | Memory Usage |\n';
    report += '|------------|----------------|--------------|-----------|-------------|\n';
    
    for (const result of batchSizeTests) {
      report += `| ${formatNumber(result.batchSize)} | ${formatNumber(Math.round(result.loadTime))} | ${formatNumber(Math.round(result.verticesPerSecond))} | ${formatNumber(Math.round(result.edgesPerSecond))} | ${formatFileSize(result.memoryUsage.heapUsed)} |\n`;
    }
    
    report += '\n';
  }
  
  // Add dataset size comparison
  const datasetSizeTests = results.filter(r => ['Small Dataset', 'Medium Dataset', 'Large Dataset'].includes(r.testName));
  if (datasetSizeTests.length > 0) {
    report += '## Dataset Size Comparison\n\n';
    report += 'This section compares the performance of the BatchLoader with different dataset sizes.\n\n';
    
    report += '| Dataset Size | Vertices | Edges | Load Time (ms) | Vertices/sec | Edges/sec | Memory Usage |\n';
    report += '|--------------|----------|-------|----------------|--------------|-----------|-------------|\n';
    
    for (const result of datasetSizeTests) {
      report += `| ${result.testName} | ${formatNumber(result.datasetSize.vertices)} | ${formatNumber(result.datasetSize.edges)} | ${formatNumber(Math.round(result.loadTime))} | ${formatNumber(Math.round(result.verticesPerSecond))} | ${formatNumber(Math.round(result.edgesPerSecond))} | ${formatFileSize(result.memoryUsage.heapUsed)} |\n`;
    }
    
    report += '\n';
  }
  
  // Add performance analysis
  report += '## Performance Analysis\n\n';
  
  // Calculate average performance
  const avgVerticesPerSecond = results.reduce((sum, r) => sum + r.verticesPerSecond, 0) / results.length;
  const avgEdgesPerSecond = results.reduce((sum, r) => sum + r.edgesPerSecond, 0) / results.length;
  
  report += `- Average vertices per second: ${formatNumber(Math.round(avgVerticesPerSecond))}\n`;
  report += `- Average edges per second: ${formatNumber(Math.round(avgEdgesPerSecond))}\n\n`;
  
  // Find optimal batch size
  if (batchSizeTests.length > 0) {
    const optimalBatchSize = batchSizeTests.reduce((prev, curr) => {
      return (prev.verticesPerSecond + prev.edgesPerSecond) > (curr.verticesPerSecond + curr.edgesPerSecond) ? prev : curr;
    });
    
    report += `- Optimal batch size: ${formatNumber(optimalBatchSize.batchSize)}\n`;
    report += `  - Vertices per second: ${formatNumber(Math.round(optimalBatchSize.verticesPerSecond))}\n`;
    report += `  - Edges per second: ${formatNumber(Math.round(optimalBatchSize.edgesPerSecond))}\n\n`;
  }
  
  // Analyze scalability
  if (datasetSizeTests.length > 0) {
    report += '### Scalability Analysis\n\n';
    
    // Sort by dataset size
    datasetSizeTests.sort((a, b) => {
      const aSize = a.datasetSize.vertices + a.datasetSize.edges;
      const bSize = b.datasetSize.vertices + b.datasetSize.edges;
      return aSize - bSize;
    });
    
    // Calculate scalability factors
    if (datasetSizeTests.length >= 2) {
      const smallest = datasetSizeTests[0];
      const largest = datasetSizeTests[datasetSizeTests.length - 1];
      
      const datasetSizeRatio = (largest.datasetSize.vertices + largest.datasetSize.edges) / (smallest.datasetSize.vertices + smallest.datasetSize.edges);
      const loadTimeRatio = largest.loadTime / smallest.loadTime;
      const scalabilityFactor = datasetSizeRatio / loadTimeRatio;
      
      report += `- Dataset size ratio (largest / smallest): ${datasetSizeRatio.toFixed(2)}\n`;
      report += `- Load time ratio (largest / smallest): ${loadTimeRatio.toFixed(2)}\n`;
      report += `- Scalability factor: ${scalabilityFactor.toFixed(2)}\n\n`;
      
      if (scalabilityFactor >= 0.8) {
        report += 'The BatchLoader shows good scalability, with load time increasing less than proportionally to dataset size.\n\n';
      } else if (scalabilityFactor >= 0.5) {
        report += 'The BatchLoader shows moderate scalability, with load time increasing somewhat more than proportionally to dataset size.\n\n';
      } else {
        report += 'The BatchLoader shows poor scalability, with load time increasing much more than proportionally to dataset size.\n\n';
      }
    }
  }
  
  // Add memory usage analysis
  report += '### Memory Usage Analysis\n\n';
  
  // Calculate average memory usage
  const avgHeapUsed = results.reduce((sum, r) => sum + r.memoryUsage.heapUsed, 0) / results.length;
  
  report += `- Average heap memory usage: ${formatFileSize(avgHeapUsed)}\n\n`;
  
  // Analyze memory usage vs dataset size
  if (datasetSizeTests.length > 0) {
    const smallest = datasetSizeTests[0];
    const largest = datasetSizeTests[datasetSizeTests.length - 1];
    
    const datasetSizeRatio = (largest.datasetSize.vertices + largest.datasetSize.edges) / (smallest.datasetSize.vertices + smallest.datasetSize.edges);
    const memoryUsageRatio = largest.memoryUsage.heapUsed / smallest.memoryUsage.heapUsed;
    
    report += `- Dataset size ratio (largest / smallest): ${datasetSizeRatio.toFixed(2)}\n`;
    report += `- Memory usage ratio (largest / smallest): ${memoryUsageRatio.toFixed(2)}\n\n`;
    
    if (memoryUsageRatio <= datasetSizeRatio * 1.2) {
      report += 'The BatchLoader shows good memory efficiency, with memory usage increasing proportionally to dataset size.\n\n';
    } else {
      report += 'The BatchLoader shows poor memory efficiency, with memory usage increasing more than proportionally to dataset size.\n\n';
    }
  }
  
  // Add recommendations
  report += '## Recommendations\n\n';
  
  // Recommend optimal batch size
  if (batchSizeTests.length > 0) {
    const optimalBatchSize = batchSizeTests.reduce((prev, curr) => {
      return (prev.verticesPerSecond + prev.edgesPerSecond) > (curr.verticesPerSecond + curr.edgesPerSecond) ? prev : curr;
    });
    
    report += `- Use a batch size of ${formatNumber(optimalBatchSize.batchSize)} for optimal performance.\n`;
  }
  
  // Add general recommendations
  report += '- Consider implementing parallel loading for large datasets to improve performance.\n';
  report += '- Optimize memory usage by processing vertices and edges in smaller batches.\n';
  report += '- Consider implementing a streaming approach for very large datasets to reduce memory usage.\n';
  
  return report;
}

// Main function
async function main() {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file not found: ${inputFile}`);
      process.exit(1);
    }
    
    // Read test results
    const results = JSON.parse(fs.readFileSync(inputFile, 'utf8')) as PerformanceTestResult[];
    
    // Generate analysis report
    const report = generateAnalysisReport(results);
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write analysis report
    fs.writeFileSync(outputFile, report);
    
    console.log(`Analysis report written to ${outputFile}`);
    process.exit(0);
  } catch (error) {
    console.error('Error analyzing performance test results:', error);
    process.exit(1);
  }
}

// Run main function
main();
