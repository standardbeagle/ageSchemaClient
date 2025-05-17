/**
 * Global setup for ageSchemaClient
 *
 * This file runs once before all tests start
 * It is configured in vite.config.ts as globalSetup
 */

import { getResourceRegistry } from './resource-registry';
import { releaseAllTestConnections } from './test-connection-manager';

// This function will be called once before all tests
export default function() {
  console.log('🚀 Global setup running before all tests');

  // Set environment variables or perform other global setup
  process.env.AGE_GLOBAL_SETUP = 'true';

  // Return a teardown function that will be called once after all tests
  return async () => {
    console.log('🧹 Global teardown running after all tests');

    // Clean up any remaining resources
    const resourceRegistry = getResourceRegistry();
    console.log(`Cleaning up ${resourceRegistry.getResourceCount()} remaining resources...`);

    try {
      await resourceRegistry.cleanupAll();
    } catch (error) {
      console.error(`Error cleaning up resources: ${(error as Error).message}`);
    }

    // Release all connections
    try {
      await releaseAllTestConnections();
    } catch (error) {
      console.error(`Error releasing connections: ${(error as Error).message}`);
    }

    // Clean up any global resources
    delete process.env.AGE_GLOBAL_SETUP;

    console.log('Global teardown complete');
  };
}
