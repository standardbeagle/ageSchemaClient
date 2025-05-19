/**
 * Script to analyze performance comparison results
 * 
 * This script analyzes the results of performance comparison tests between
 * the original and optimized BatchLoader implementations and generates a report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PerformanceComparisonResult } from './compare-batch-loaders';

// Input file for test results
const inputFile = path.join(__dirname, '../../reports/performance-comparison-results.json');

// Output file for analysis report
const outputFile = path.join(__dirname, '../../reports/performance-comparison-report.md');

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
 * Format a percentage
 * 
 * @param percentage - Percentage to format
 * @returns Formatted percentage
 */
function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

/**
 * Generate a performance comparison analysis report
 * 
 * @param results - Performance comparison results
 * @returns Analysis report
 */
function generateAnalysisReport(results: PerformanceComparisonResult[]): string {
  // Sort results by dataset size
  results.sort((a, b) => {
    const aSize = a.datasetSize.vertices + a.datasetSize.edges;
    const bSize = b.datasetSize.vertices + b.datasetSize.edges;
    return aSize - bSize;
  });
  
  // Generate report
  let report = '# BatchLoader Performance Comparison Report\n\n';
  
  // Add summary
  report += '## Summary\n\n';
  report += 'This report presents the results of performance comparison tests between the original and optimized BatchLoader implementations.\n';
  report += 'The tests were run with various dataset sizes and configurations to measure the performance improvements of the optimized implementation.\n\n';
  
  // Calculate average improvements
  const avgLoadTimeImprovement = results.reduce((sum, r) => sum + r.improvement.loadTime, 0) / results.length;
  const avgVerticesPerSecondImprovement = results.reduce((sum, r) => sum + r.improvement.verticesPerSecond, 0) / results.length;
  const avgEdgesPerSecondImprovement = results.reduce((sum, r) => sum + r.improvement.edgesPerSecond, 0) / results.length;
  const avgMemoryUsageImprovement = results.reduce((sum, r) => sum + r.improvement.memoryUsage, 0) / results.length;
  
  report += '### Average Improvements\n\n';
  report += `- Load Time: ${formatPercentage(avgLoadTimeImprovement)}\n`;
  report += `- Vertices per Second: ${formatPercentage(avgVerticesPerSecondImprovement)}\n`;
  report += `- Edges per Second: ${formatPercentage(avgEdgesPerSecondImprovement)}\n`;
  report += `- Memory Usage: ${formatPercentage(avgMemoryUsageImprovement)}\n\n`;
  
  // Add test results table
  report += '## Test Results\n\n';
  report += '| Test Name | Vertices | Edges | Batch Size | Original Load Time (ms) | Optimized Load Time (ms) | Improvement |\n';
  report += '|-----------|----------|-------|------------|-------------------------|--------------------------|-------------|\n';
  
  for (const result of results) {
    report += `| ${result.testName} | ${formatNumber(result.datasetSize.vertices)} | ${formatNumber(result.datasetSize.edges)} | ${formatNumber(result.batchSize)} | ${formatNumber(Math.round(result.original.loadTime))} | ${formatNumber(Math.round(result.optimized.loadTime))} | ${formatPercentage(result.improvement.loadTime)} |\n`;
  }
  
  report += '\n';
  
  // Add throughput comparison table
  report += '## Throughput Comparison\n\n';
  report += '| Test Name | Original Vertices/sec | Optimized Vertices/sec | Improvement | Original Edges/sec | Optimized Edges/sec | Improvement |\n';
  report += '|-----------|----------------------|------------------------|-------------|-------------------|---------------------|-------------|\n';
  
  for (const result of results) {
    report += `| ${result.testName} | ${formatNumber(Math.round(result.original.verticesPerSecond))} | ${formatNumber(Math.round(result.optimized.verticesPerSecond))} | ${formatPercentage(result.improvement.verticesPerSecond)} | ${formatNumber(Math.round(result.original.edgesPerSecond))} | ${formatNumber(Math.round(result.optimized.edgesPerSecond))} | ${formatPercentage(result.improvement.edgesPerSecond)} |\n`;
  }
  
  report += '\n';
  
  // Add memory usage comparison table
  report += '## Memory Usage Comparison\n\n';
  report += '| Test Name | Original Memory Usage | Optimized Memory Usage | Improvement |\n';
  report += '|-----------|----------------------|------------------------|-------------|\n';
  
  for (const result of results) {
    report += `| ${result.testName} | ${formatFileSize(result.original.memoryUsage.heapUsed)} | ${formatFileSize(result.optimized.memoryUsage.heapUsed)} | ${formatPercentage(result.improvement.memoryUsage)} |\n`;
  }
  
  report += '\n';
  
  // Add batch size comparison
  const batchSizeTests = results.filter(r => r.testName.includes('Batch Size'));
  if (batchSizeTests.length > 0) {
    report += '## Batch Size Comparison\n\n';
    report += 'This section compares the performance of the original and optimized BatchLoader implementations with different batch sizes.\n\n';
    
    report += '| Batch Size | Original Load Time (ms) | Optimized Load Time (ms) | Improvement | Original Vertices/sec | Optimized Vertices/sec | Improvement |\n';
    report += '|------------|-------------------------|--------------------------|-------------|----------------------|------------------------|-------------|\n';
    
    for (const result of batchSizeTests) {
      report += `| ${formatNumber(result.batchSize)} | ${formatNumber(Math.round(result.original.loadTime))} | ${formatNumber(Math.round(result.optimized.loadTime))} | ${formatPercentage(result.improvement.loadTime)} | ${formatNumber(Math.round(result.original.verticesPerSecond))} | ${formatNumber(Math.round(result.optimized.verticesPerSecond))} | ${formatPercentage(result.improvement.verticesPerSecond)} |\n`;
    }
    
    report += '\n';
  }
  
  // Add dataset size comparison
  const datasetSizeTests = results.filter(r => ['Small Dataset', 'Medium Dataset', 'Large Dataset'].includes(r.testName));
  if (datasetSizeTests.length > 0) {
    report += '## Dataset Size Comparison\n\n';
    report += 'This section compares the performance of the original and optimized BatchLoader implementations with different dataset sizes.\n\n';
    
    report += '| Dataset Size | Vertices | Edges | Original Load Time (ms) | Optimized Load Time (ms) | Improvement |\n';
    report += '|--------------|----------|-------|-------------------------|--------------------------|-------------|\n';
    
    for (const result of datasetSizeTests) {
      report += `| ${result.testName} | ${formatNumber(result.datasetSize.vertices)} | ${formatNumber(result.datasetSize.edges)} | ${formatNumber(Math.round(result.original.loadTime))} | ${formatNumber(Math.round(result.optimized.loadTime))} | ${formatPercentage(result.improvement.loadTime)} |\n`;
    }
    
    report += '\n';
  }
  
  // Add performance analysis
  report += '## Performance Analysis\n\n';
  
  // Analyze load time improvements
  report += '### Load Time Improvements\n\n';
  report += `The optimized BatchLoader implementation shows an average load time improvement of ${formatPercentage(avgLoadTimeImprovement)} compared to the original implementation.\n\n`;
  
  // Find the test with the highest load time improvement
  const highestLoadTimeImprovement = results.reduce((prev, curr) => {
    return prev.improvement.loadTime > curr.improvement.loadTime ? prev : curr;
  });
  
  report += `The highest load time improvement was observed in the "${highestLoadTimeImprovement.testName}" test, with a ${formatPercentage(highestLoadTimeImprovement.improvement.loadTime)} improvement.\n\n`;
  
  // Analyze throughput improvements
  report += '### Throughput Improvements\n\n';
  report += `The optimized BatchLoader implementation shows an average throughput improvement of ${formatPercentage(avgVerticesPerSecondImprovement)} for vertices and ${formatPercentage(avgEdgesPerSecondImprovement)} for edges compared to the original implementation.\n\n`;
  
  // Find the test with the highest throughput improvement
  const highestVerticesPerSecondImprovement = results.reduce((prev, curr) => {
    return prev.improvement.verticesPerSecond > curr.improvement.verticesPerSecond ? prev : curr;
  });
  
  const highestEdgesPerSecondImprovement = results.reduce((prev, curr) => {
    return prev.improvement.edgesPerSecond > curr.improvement.edgesPerSecond ? prev : curr;
  });
  
  report += `The highest vertex throughput improvement was observed in the "${highestVerticesPerSecondImprovement.testName}" test, with a ${formatPercentage(highestVerticesPerSecondImprovement.improvement.verticesPerSecond)} improvement.\n\n`;
  report += `The highest edge throughput improvement was observed in the "${highestEdgesPerSecondImprovement.testName}" test, with a ${formatPercentage(highestEdgesPerSecondImprovement.improvement.edgesPerSecond)} improvement.\n\n`;
  
  // Analyze memory usage improvements
  report += '### Memory Usage Improvements\n\n';
  report += `The optimized BatchLoader implementation shows an average memory usage improvement of ${formatPercentage(avgMemoryUsageImprovement)} compared to the original implementation.\n\n`;
  
  // Find the test with the highest memory usage improvement
  const highestMemoryUsageImprovement = results.reduce((prev, curr) => {
    return prev.improvement.memoryUsage > curr.improvement.memoryUsage ? prev : curr;
  });
  
  report += `The highest memory usage improvement was observed in the "${highestMemoryUsageImprovement.testName}" test, with a ${formatPercentage(highestMemoryUsageImprovement.improvement.memoryUsage)} improvement.\n\n`;
  
  // Add recommendations
  report += '## Recommendations\n\n';
  
  // Recommend optimal batch size
  if (batchSizeTests.length > 0) {
    const optimalBatchSize = batchSizeTests.reduce((prev, curr) => {
      return (prev.optimized.verticesPerSecond + prev.optimized.edgesPerSecond) > (curr.optimized.verticesPerSecond + curr.optimized.edgesPerSecond) ? prev : curr;
    });
    
    report += `- Use a batch size of ${formatNumber(optimalBatchSize.batchSize)} for optimal performance with the optimized BatchLoader implementation.\n`;
  }
  
  // Add general recommendations
  report += '- Use the optimized BatchLoader implementation for all production workloads.\n';
  report += '- Consider implementing parallel loading for very large datasets to further improve performance.\n';
  report += '- Monitor memory usage when loading very large datasets and adjust batch size accordingly.\n';
  
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
    const results = JSON.parse(fs.readFileSync(inputFile, 'utf8')) as PerformanceComparisonResult[];
    
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
    console.error('Error analyzing performance comparison results:', error);
    process.exit(1);
  }
}

// Run main function
main();
