/**
 * Global setup for ageSchemaClient
 * 
 * This file runs once before all tests start
 * It is configured in vite.config.ts as globalSetup
 */

// This function will be called once before all tests
export default function() {
  console.log('🚀 Global setup running before all tests');
  
  // Set environment variables or perform other global setup
  process.env.AGE_GLOBAL_SETUP = 'true';
  
  // Return a teardown function that will be called once after all tests
  return () => {
    console.log('🧹 Global teardown running after all tests');
    
    // Clean up any global resources
    delete process.env.AGE_GLOBAL_SETUP;
  };
}
